// Serviço de integração com o n8n
// Este serviço substitui a integração anterior com Open WebUI

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '';
const N8N_API_KEY = process.env.NEXT_PUBLIC_N8N_API_KEY || '';
const TIMEOUT_MS = 60000; // 60 segundos

export const N8N_GENERIC_ERROR = 'Estamos tendo problemas no servidor, tente mais tarde.';

// Validar se as credenciais do n8n estão configuradas
export function validateN8nCredentials() {
  const issues = [];

  if (!N8N_WEBHOOK_URL) {
    issues.push('URL do webhook do n8n não configurada');
  } else if (!N8N_WEBHOOK_URL.includes('webhook')) {
    issues.push('URL do webhook do n8n parece inválida (deve conter "webhook")');
  }

  if (!N8N_API_KEY) {
    issues.push('API Key do n8n não configurada');
  } else if (N8N_API_KEY.length < 20) {
    issues.push('API Key do n8n parece inválida (muito curta)');
  }

  return {
    valid: issues.length === 0,
    error: issues.join(', ')
  };
}

// Interface para a requisição ao n8n
interface N8nRequest {
  text?: string;
  imageBase64?: string;
  topic?: string;
}

// Interface para a resposta do n8n
interface N8nResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Envia uma requisição para o webhook do n8n
 * @param payload Dados a serem enviados para o n8n
 * @returns Resposta do n8n
 */
export async function callN8nWebhook(payload: N8nRequest): Promise<N8nResponse> {
  console.log('🤖 Enviando requisição para n8n...');
  console.log('📍 URL:', N8N_WEBHOOK_URL);
  console.log('💬 Payload:', {
    hasText: !!payload.text,
    hasImage: !!payload.imageBase64,
    topic: payload.topic || 'Não especificado'
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Garantir compatibilidade com workflows que esperam a chave capitalizada 'Topic'
    const requestBody: any = { ...payload };
    if (!Object.prototype.hasOwnProperty.call(requestBody, 'Topic') && requestBody.topic) {
      requestBody.Topic = requestBody.topic;
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Reditto-Next/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.error('❌ Erro na resposta do n8n:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return {
        success: false,
        error: N8N_GENERIC_ERROR
      };
    }

    const data = await response.json();
    console.log('✅ Resposta recebida do n8n');
    console.log('📄 Estrutura da resposta (raw):', Object.keys(data));

    // Normalizar possíveis formatos de resposta do n8n para o formato esperado pelo frontend
    let normalized: any = data;

    try {
      // Caso 1: array de items com .json (ex.: [{ json: {...} }])
      if (Array.isArray(normalized) && normalized.length > 0 && normalized[0].json) {
        normalized = normalized[0].json;
        console.log('🔁 Normalized from array[0].json');
      }

      // Caso 2: envelope comum { success: true, data: {...} }
      if (normalized && typeof normalized === 'object' && normalized.data && typeof normalized.data === 'object' && (normalized.data.finalScore || normalized.data.competencies || normalized.data.feedback)) {
        normalized = normalized.data;
        console.log('🔁 Normalized from envelope.data');
      }

      // Caso 3: payload dentro de 'output' ou 'result'
      if (normalized && typeof normalized === 'object' && normalized.output && typeof normalized.output === 'object' && (normalized.output.finalScore || normalized.output.competencies || normalized.output.feedback)) {
        normalized = normalized.output;
        console.log('🔁 Normalized from output');
      }
      if (normalized && typeof normalized === 'object' && normalized.result && typeof normalized.result === 'object' && (normalized.result.finalScore || normalized.result.competencies || normalized.result.feedback)) {
        normalized = normalized.result;
        console.log('🔁 Normalized from result');
      }

      // Caso 4: string JSON
      if (typeof normalized === 'string') {
        try {
          const parsed = JSON.parse(normalized);
          normalized = parsed;
          console.log('🔁 Parsed JSON string to object');
        } catch (e) {
          // não alterar se não for JSON
        }
      }

      // Se for resposta de OCR (extractedText), manter como está
      if (normalized && typeof normalized === 'object' && Object.prototype.hasOwnProperty.call(normalized, 'extractedText')) {
        // manter intacto
      } else {
        // Coerções simples de tipo para o formato esperado pela UI
        if (normalized && normalized.finalScore && typeof normalized.finalScore === 'string') {
          const n = Number(normalized.finalScore.toString().replace(/[^0-9.-]/g, ''));
          normalized.finalScore = Number.isFinite(n) ? n : normalized.finalScore;
        }

        if (normalized && normalized.competencies && typeof normalized.competencies === 'object') {
          for (const k of Object.keys(normalized.competencies)) {
            const v = normalized.competencies[k];
            if (typeof v === 'string') {
              const num = Number(v.toString().replace(/[^0-9.-]/g, ''));
              normalized.competencies[k] = Number.isFinite(num) ? num : v;
            }
          }
        }

        // Garantir estrutura mínima de feedback
        if (!normalized.feedback) {
          normalized.feedback = { summary: '', improvements: [], attention: [], congratulations: [], competencyFeedback: {} };
        } else {
          normalized.feedback.summary = normalized.feedback.summary ?? '';
          normalized.feedback.improvements = Array.isArray(normalized.feedback.improvements) ? normalized.feedback.improvements : [];
          normalized.feedback.attention = Array.isArray(normalized.feedback.attention) ? normalized.feedback.attention : [];
          normalized.feedback.congratulations = Array.isArray(normalized.feedback.congratulations) ? normalized.feedback.congratulations : [];
          normalized.feedback.competencyFeedback = normalized.feedback.competencyFeedback && typeof normalized.feedback.competencyFeedback === 'object' ? normalized.feedback.competencyFeedback : {};
        }
      }
    } catch (err) {
      console.warn('⚠️ Erro ao normalizar resposta do n8n:', err);
    }

    console.log('📄 Estrutura da resposta (normalized):', normalized && typeof normalized === 'object' ? Object.keys(normalized) : typeof normalized);

    return {
      success: true,
      data: normalized
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Timeout na requisição para n8n');
      return {
        success: false,
        error: N8N_GENERIC_ERROR
      };
    }
    
    console.error('❌ Erro na comunicação com n8n:', error);
    return {
      success: false,
      error: N8N_GENERIC_ERROR
    };
  }
}