import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

// Configurações de segurança - Credenciais protegidas no servidor
const OPEN_WEBUI_BASE_URL = process.env.OPEN_WEBUI_BASE_URL;
const OPEN_WEBUI_API_KEY = process.env.OPEN_WEBUI_API_KEY;
const OPEN_WEBUI_MODEL = process.env.OPEN_WEBUI_MODEL || 'gemma3:4b';
const OPEN_WEBUI_JWT_TOKEN = process.env.OPEN_WEBUI_JWT_TOKEN;
const OPEN_WEBUI_API_PATH = process.env.OPEN_WEBUI_API_PATH || '/api/chat/completions';
const OPEN_WEBUI_DEBUG = process.env.OPEN_WEBUI_DEBUG === 'true';

// Configurações de segurança para OCR
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Validação das credenciais do Open WebUI
function validateCredentials(): { valid: boolean; error?: string } {
  if (!OPEN_WEBUI_BASE_URL) {
    return { valid: false, error: 'OPEN_WEBUI_BASE_URL não configurada' };
  }
  
  // API Key pode ser opcional dependendo do setup do Open WebUI
  
  return { valid: true };
}

async function extractTextFromImage(imageBuffer: Buffer, originalMimeType?: string): Promise<string> {
  console.log(`🔍 Iniciando extração de texto da imagem com ${OPEN_WEBUI_MODEL}...`);
  
  try {
    const base64Image = imageBuffer.toString('base64');
    // Detectar tipo MIME correto baseado no tipo original ou usar JPEG como fallback
    let mimeType = originalMimeType || 'image/jpeg';
    
    // Normalizar tipos MIME
    if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
    
    console.log(`📝 Enviando requisição para Open WebUI (OCR - Modelo: ${OPEN_WEBUI_MODEL})...`);
    console.log('📍 URL:', OPEN_WEBUI_BASE_URL);
    console.log('🎯 Modelo:', OPEN_WEBUI_MODEL);
    console.log('🎯 Tipo MIME:', mimeType);
    console.log('📦 Tamanho da imagem (base64):', base64Image.length);
    
    // Formato compatível com OpenAI API que o Open WebUI suporta
    const response = await fetch(`${OPEN_WEBUI_BASE_URL}${OPEN_WEBUI_API_PATH}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPEN_WEBUI_JWT_TOKEN || ''}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Reditto-Next/1.0"
      },
      body: JSON.stringify({
        "model": OPEN_WEBUI_MODEL,
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "Extraia todo o texto desta imagem de redação com máxima precisão. Mantenha a formatação original, preservando quebras de linha e parágrafos. Retorne APENAS o texto extraído, sem comentários, explicações ou formatação adicional."
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        "max_tokens": 4000,
        "temperature": 0.1,
        "stream": false
      })
    });

    console.log('📊 Status da resposta OCR:', response.status);
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.error('❌ Erro na API de OCR:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      let errorMessage = 'Erro na API de OCR';
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Credenciais inválidas para o Open WebUI';
      } else if (response.status === 404 || response.status === 405) {
        errorMessage = 'Endpoint não encontrado no Open WebUI';
      } else if (response.status === 429) {
        errorMessage = 'Muitas requisições. Tente novamente em alguns minutos';
      } else if (response.status === 400) {
        errorMessage = `Erro na requisição: ${errorText}`;
      } else if (response.status >= 500) {
        errorMessage = 'Servidor do Open WebUI temporariamente indisponível';
      }
      throw new Error(`${errorMessage} (${response.status})`);
    }

    const data = await response.json();
    console.log('✅ Resposta OCR recebida');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Estrutura de resposta inválida:', data);
      throw new Error('Resposta inválida do Open WebUI');
    }

    const extractedText = data.choices[0].message.content;
    console.log('📄 Texto extraído (comprimento):', extractedText?.length || 0);
    
    return extractedText || '';
    
  } catch (error) {
    console.error('❌ Erro completo no OCR:', error);
    throw new Error(`Falha ao extrair texto da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 === INICIANDO PROCESSAMENTO DE OCR ===');
  console.log('🔑 Credenciais status:', OPEN_WEBUI_API_KEY ? `API Key configurada (${OPEN_WEBUI_API_KEY.substring(0, 15)}...)` : 'API Key NÃO CONFIGURADA');
  console.log('🔗 Base URL:', OPEN_WEBUI_BASE_URL || 'NÃO CONFIGURADA');
  console.log('🎯 Modelo:', OPEN_WEBUI_MODEL || 'NÃO CONFIGURADO');
  
  try {
    // Verificar se as credenciais estão configuradas e válidas
    const credentialsCheck = validateCredentials();
    if (!credentialsCheck.valid) {
      console.error('❌ Credenciais do Open WebUI inválidas:', credentialsCheck.error);
      return NextResponse.json(
        { error: `Configuração inválida: ${credentialsCheck.error}. Configure as variáveis OPEN_WEBUI_* no arquivo .env.local` },
        { status: 500 }
      );
    }

    console.log('✅ Credenciais validadas');

    // Adicionar headers de segurança
    const responseHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    };

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    console.log('🖼️ Processando envio por imagem...');
    
    // Validações de segurança para imagem
    if (!imageFile) {
      console.error('❌ Imagem não fornecida');
      return NextResponse.json(
        { error: 'Imagem não fornecida' },
        { status: 400, headers: responseHeaders }
      );
    }
    
    console.log('📊 Detalhes da imagem:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });
    
    if (imageFile.size > MAX_FILE_SIZE) {
      console.error('❌ Imagem muito grande:', imageFile.size);
      return NextResponse.json(
        { error: 'Imagem deve ter no máximo 10MB' },
        { status: 400, headers: responseHeaders }
      );
    }
    
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      console.error('❌ Tipo de imagem inválido:', imageFile.type);
      return NextResponse.json(
        { error: 'Tipo de imagem não suportado. Use PNG, JPG, JPEG ou WEBP' },
        { status: 400, headers: responseHeaders }
      );
    }

    console.log('✅ Imagem validada, iniciando OCR...');
    const originalArrayBuffer = await imageFile.arrayBuffer();
    const originalBuffer: Buffer = Buffer.from(originalArrayBuffer as ArrayBuffer);

    // Normalizar imagem para JPEG com largura máxima para reduzir payload
    let imageBuffer: Buffer = originalBuffer as Buffer
    try {
      const normalized: Buffer = await sharp(originalBuffer as Buffer)
        .rotate() // corrigir orientação
        .resize({ width: 1400, withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
      imageBuffer = normalized as Buffer
      console.log('🗜️ Imagem normalizada para OCR. Tamanho:', imageBuffer.length)
    } catch (e) {
      console.warn('⚠️ Falha ao normalizar imagem. Seguindo com buffer original.')
    }
    const extractedText = await extractTextFromImage(imageBuffer, imageFile.type);
    
    if (!extractedText || extractedText.trim().length < 50) {
      console.error('❌ Texto extraído insuficiente:', extractedText?.length || 0);
      return NextResponse.json(
        { error: 'Não foi possível extrair texto suficiente da imagem. Tente uma imagem com melhor qualidade e texto mais legível.' },
        { status: 400, headers: responseHeaders }
      );
    }
    
    console.log('🎉 === OCR CONCLUÍDO COM SUCESSO ===');
    
    // Retornar apenas o texto extraído
    return NextResponse.json(
      { extractedText: extractedText.trim() }, 
      { headers: responseHeaders }
    );
    
  } catch (error) {
    console.error('❌ === ERRO NO PROCESSAMENTO OCR ===');
    console.error('Erro completo:', error);
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('Tipo de erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Não expor detalhes do erro para o cliente
    const errorMessage = error instanceof Error && error.message.includes('API') 
      ? 'Erro na comunicação com o serviço de OCR. Tente novamente em alguns minutos.'
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
