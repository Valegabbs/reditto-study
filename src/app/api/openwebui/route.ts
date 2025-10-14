import { NextRequest, NextResponse } from 'next/server';

interface OpenWebUIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenWebUIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Configurações de segurança - Credenciais protegidas no servidor
const OPEN_WEBUI_BASE_URL = process.env.OPEN_WEBUI_BASE_URL;
const OPEN_WEBUI_API_KEY = process.env.OPEN_WEBUI_API_KEY;
const OPEN_WEBUI_MODEL = process.env.OPEN_WEBUI_MODEL || 'gemma3:4b';
const OPEN_WEBUI_JWT_TOKEN = process.env.OPEN_WEBUI_JWT_TOKEN;
const OPEN_WEBUI_API_PATH = process.env.OPEN_WEBUI_API_PATH || '/api/chat/completions';
const OPEN_WEBUI_DEBUG = process.env.OPEN_WEBUI_DEBUG === 'true';

// Configurações de segurança
const MAX_TOKENS = 4000;
const TEMPERATURE = 0.2;
const TIMEOUT_MS = 60000; // 60 segundos

// Validação das credenciais
function validateCredentials(): { valid: boolean; error?: string } {
  if (!OPEN_WEBUI_BASE_URL) {
    return { valid: false, error: 'OPEN_WEBUI_BASE_URL não configurada' };
  }
  
  // API Key e JWT são opcionais dependendo da configuração do Open WebUI
  // Não forçar formato específico, pois o provedor pode variar
  
  return { valid: true };
}

// Função para comunicar com o Open WebUI na VPS
async function callOpenWebUI(messages: OpenWebUIMessage[]): Promise<OpenWebUIResponse> {
  console.log('🤖 Enviando requisição para Open WebUI na VPS...');
  console.log('📍 URL:', OPEN_WEBUI_BASE_URL);
  console.log('🎯 Modelo:', OPEN_WEBUI_MODEL);
  console.log('💬 Mensagens:', messages.length);

  const requestBody = {
    model: OPEN_WEBUI_MODEL,
    messages: messages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    stream: false
  };

  console.log('📤 Enviando dados:', JSON.stringify(requestBody, null, 2));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${OPEN_WEBUI_BASE_URL}${OPEN_WEBUI_API_PATH}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPEN_WEBUI_JWT_TOKEN || ''}`,
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
      console.error('❌ Erro na resposta:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      let errorMessage = 'Erro na comunicação com a IA';
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Credenciais inválidas para o Open WebUI';
      } else if (response.status === 404 || response.status === 405) {
        errorMessage = 'Endpoint não encontrado no Open WebUI';
      } else if (response.status === 429) {
        errorMessage = 'Muitas requisições. Tente novamente em alguns minutos';
      } else if (response.status >= 500) {
        errorMessage = 'Servidor do Open WebUI temporariamente indisponível';
      }
      throw new Error(`${errorMessage} (${response.status})`);
    }

    const data = await response.json();
    console.log('✅ Resposta recebida do Open WebUI');
    console.log('📄 Estrutura da resposta:', Object.keys(data));

    // Validar estrutura da resposta
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('❌ Estrutura de resposta inválida:', data);
      throw new Error('Resposta inválida do Open WebUI');
    }

    if (!data.choices[0].message || !data.choices[0].message.content) {
      console.error('❌ Conteúdo da mensagem não encontrado:', data.choices[0]);
      throw new Error('Conteúdo da resposta não encontrado');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Timeout na requisição para Open WebUI');
      throw new Error('Timeout na comunicação com a IA. Tente novamente.');
    }
    
    console.error('❌ Erro na comunicação com Open WebUI:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 === ENDPOINT OPEN WEBUI INICIADO ===');
  
  try {
    // Validar credenciais
    const credentialsCheck = validateCredentials();
    if (!credentialsCheck.valid) {
      console.error('❌ Credenciais inválidas:', credentialsCheck.error);
      return NextResponse.json(
        { error: `Configuração inválida: ${credentialsCheck.error}` },
        { status: 500 }
      );
    }

    console.log('✅ Credenciais validadas');

    // Headers de segurança
    const responseHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    };

    // Extrair dados da requisição
    const body = await request.json();
    const { messages, model, max_tokens, temperature } = body;

    console.log('📝 Dados recebidos:', {
      messagesCount: messages?.length || 0,
      model: model || 'default',
      max_tokens: max_tokens || 'default',
      temperature: temperature || 'default'
    });

    // Validações de entrada
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('❌ Mensagens inválidas ou vazias');
      return NextResponse.json(
        { error: 'Mensagens são obrigatórias e devem ser um array não vazio' },
        { status: 400, headers: responseHeaders }
      );
    }

    // Validar estrutura das mensagens
    for (const message of messages) {
      if (!message.role || !message.content) {
        console.error('❌ Estrutura de mensagem inválida:', message);
        return NextResponse.json(
          { error: 'Cada mensagem deve ter "role" e "content"' },
          { status: 400, headers: responseHeaders }
        );
      }
      
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        console.error('❌ Role inválido:', message.role);
        return NextResponse.json(
          { error: 'Role da mensagem deve ser "user", "assistant" ou "system"' },
          { status: 400, headers: responseHeaders }
        );
      }
    }

    // Sanitizar mensagens
    const sanitizedMessages: OpenWebUIMessage[] = messages.map(msg => ({
      role: msg.role,
      content: String(msg.content).replace(/[<>]/g, '').trim()
    }));

    console.log('🔍 Iniciando comunicação com Open WebUI...');
    const response = await callOpenWebUI(sanitizedMessages);

    console.log('🎉 === PROCESSAMENTO CONCLUÍDO ===');
    
    return NextResponse.json(response, { headers: responseHeaders });
    
  } catch (error) {
    console.error('❌ === ERRO NO PROCESSAMENTO ===');
    console.error('Erro completo:', error);
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('Tipo de erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Não expor detalhes do erro para o cliente
    const errorMessage = error instanceof Error && error.message.includes('Timeout')
      ? 'Timeout na comunicação com a IA. Tente novamente.'
      : error instanceof Error && error.message.includes('Credenciais')
      ? 'Erro de autenticação com o servidor de IA.'
      : error instanceof Error && error.message.includes('indisponível')
      ? 'Servidor de IA temporariamente indisponível. Tente novamente em alguns minutos.'
      : 'Erro interno do servidor. Tente novamente.';
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        }
      }
    );
  }
}
