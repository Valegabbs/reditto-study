import { NextRequest, NextResponse } from 'next/server';
import { callN8nWebhook, validateN8nCredentials, N8N_GENERIC_ERROR } from '@/lib/n8n';

// Configurações de segurança
const MAX_TEXT_LENGTH = 2000;
const MIN_TEXT_LENGTH = 30;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  console.log('🚀 === INICIANDO PROCESSAMENTO DE DÚVIDA COM N8N ===');
  
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
    const subject = formData.get('subject') as string;
    const doubtText = formData.get('doubtText') as string;
    const imageFile = formData.get('image') as File | null;

    console.log('📝 Dados recebidos:', {
      subject: subject || 'Não especificado',
      textLength: doubtText?.length || 0,
      hasImage: !!imageFile
    });

    // Validações básicas
    if (!subject || !subject.trim()) {
      console.error('❌ Matéria não fornecida');
      return NextResponse.json(
        { error: 'A matéria é obrigatória' },
        { status: 400, headers: responseHeaders }
      );
    }

    if (!doubtText || doubtText.trim().length < MIN_TEXT_LENGTH) {
      console.error('❌ Texto da dúvida muito curto');
      return NextResponse.json(
        { error: `O texto da dúvida deve ter pelo menos ${MIN_TEXT_LENGTH} caracteres` },
        { status: 400, headers: responseHeaders }
      );
    }

    if (doubtText.length > MAX_TEXT_LENGTH) {
      console.error('❌ Texto da dúvida muito longo');
      return NextResponse.json(
        { error: `O texto da dúvida não pode exceder ${MAX_TEXT_LENGTH} caracteres` },
        { status: 400, headers: responseHeaders }
      );
    }

    // Validar tamanho da imagem se fornecida
    if (imageFile && imageFile.size > MAX_IMAGE_SIZE) {
      console.error('❌ Imagem muito grande');
      return NextResponse.json(
        { error: 'A imagem não pode exceder 10MB' },
        { status: 400, headers: responseHeaders }
      );
    }

    // Preparar payload para o n8n
    const payload: any = {
      doubtText: doubtText.trim()
    };

    // Determinar o campo correto baseado na matéria
    if (subject.toLowerCase() === 'matematica') {
      payload.Mat = subject; // Campo especial para matemática
    } else {
      payload.Topic = subject; // Campo padrão para outras matérias
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
