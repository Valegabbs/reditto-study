import { NextRequest, NextResponse } from 'next/server';
import { callN8nWebhook, validateN8nCredentials, N8N_GENERIC_ERROR } from '@/lib/n8n';

// Configurações de segurança
const MAX_TEXT_LENGTH = 5000;
const MIN_TEXT_LENGTH = 200;
const MAX_TOPIC_LENGTH = 200;

export async function POST(request: NextRequest) {
  console.log('🚀 === INICIANDO PROCESSAMENTO DE REDAÇÃO COM N8N ===');
  
  try {
    // Verificar se as credenciais estão configuradas e válidas
    const credentialsCheck = validateN8nCredentials();
    if (!credentialsCheck.valid) {
      console.error('❌ Credenciais do n8n inválidas:', credentialsCheck.error);
      return NextResponse.json(
        { error: N8N_GENERIC_ERROR },
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
    const topic = formData.get('topic') as string;
    const essayText = formData.get('essayText') as string;
    const imageFile = formData.get('image') as File | null;

    console.log('📝 Dados recebidos:', {
      topic: topic || 'Não especificado',
      textLength: essayText?.length || 0,
      hasImage: !!imageFile
    });

    // Validações básicas
    if (!topic || !topic.trim()) {
      console.error('❌ Tema não fornecido');
      return NextResponse.json(
        { error: 'O tema da redação é obrigatório' },
        { status: 400, headers: responseHeaders }
      );
    }
    if (!essayText && !imageFile) {
      console.error('❌ Nenhum texto ou imagem fornecido');
      return NextResponse.json(
        { error: 'É necessário fornecer um texto ou uma imagem da redação' },
        { status: 400, headers: responseHeaders }
      );
    }

    if (essayText && (essayText.length < MIN_TEXT_LENGTH || essayText.length > MAX_TEXT_LENGTH)) {
      console.error(`❌ Texto fora dos limites (${essayText.length} caracteres)`);
      return NextResponse.json(
        { error: `O texto deve ter entre ${MIN_TEXT_LENGTH} e ${MAX_TEXT_LENGTH} caracteres` },
        { status: 400, headers: responseHeaders }
      );
    }

    if (topic && topic.length > MAX_TOPIC_LENGTH) {
      console.error(`❌ Tema muito longo (${topic.length} caracteres)`);
      return NextResponse.json(
        { error: `O tema não pode exceder ${MAX_TOPIC_LENGTH} caracteres` },
        { status: 400, headers: responseHeaders }
      );
    }

    // Preparar payload para o n8n
    const payload: any = {
      topic: topic || ''
    };

    // Se tiver texto, enviar diretamente
    if (essayText) {
      payload.text = essayText;
    }

    // Se tiver imagem, converter para base64
    if (imageFile) {
      const imageBuffer = await imageFile.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageFile.type;
      payload.imageBase64 = `data:${mimeType};base64,${base64Image}`;
    }

    // Chamar o webhook do n8n
    console.log('🔄 Enviando dados para o n8n...');
    const n8nResponse = await callN8nWebhook(payload);

    if (!n8nResponse.success) {
      console.error('❌ Erro na resposta do n8n:', n8nResponse.error);
      return NextResponse.json(
        { error: N8N_GENERIC_ERROR },
        { status: 500, headers: responseHeaders }
      );
    }

    console.log('✅ Resposta do n8n recebida com sucesso');
    
    // Retornar a resposta do n8n
    return NextResponse.json(n8nResponse.data, { 
      status: 200, 
      headers: responseHeaders 
    });
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    return NextResponse.json(
      { error: N8N_GENERIC_ERROR },
      { status: 500 }
    );
  }
}