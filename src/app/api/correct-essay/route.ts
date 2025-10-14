import { NextRequest, NextResponse } from 'next/server';

interface EssayResult {
  finalScore: number;
  competencies: {
    [key: string]: number;
  };
  feedback: {
    summary: string;
    improvements: string[];
    attention: string[];
    congratulations: string[];
    competencyFeedback: {
      [key: string]: string;
    };
  };
  originalEssay: string;
}

// Configurações de segurança - Credenciais protegidas no servidor
const OPEN_WEBUI_BASE_URL = process.env.OPEN_WEBUI_BASE_URL;
const OPEN_WEBUI_API_KEY = process.env.OPEN_WEBUI_API_KEY;
const OPEN_WEBUI_MODEL = process.env.OPEN_WEBUI_MODEL || 'gemma3:4b';
const OPEN_WEBUI_JWT_TOKEN = process.env.OPEN_WEBUI_JWT_TOKEN;
const OPEN_WEBUI_API_PATH = process.env.OPEN_WEBUI_API_PATH || '/api/chat/completions';
const OPEN_WEBUI_DEBUG = process.env.OPEN_WEBUI_DEBUG === 'true';

// Configurações de segurança
const MAX_TEXT_LENGTH = 5000;
const MIN_TEXT_LENGTH = 200;
const MAX_TOPIC_LENGTH = 200;

// Validação das credenciais do Open WebUI
function validateCredentials(): { valid: boolean; error?: string } {
  if (!OPEN_WEBUI_BASE_URL) {
    return { valid: false, error: 'OPEN_WEBUI_BASE_URL não configurada' };
  }
  
  // API Key e JWT podem ser opcionais dependendo do setup do Open WebUI.
  
  return { valid: true };
}

async function analyzeEssay(essayText: string, topic?: string): Promise<EssayResult> {
  console.log('🔍 Iniciando análise da redação...');
  console.log('📝 Texto a ser analisado (comprimento):', essayText.length);
  console.log('🎯 Tema:', topic || 'Não especificado');

  try {
    const prompt = `INSTRUÇÕES: Você é um corretor especialista em redações do ENEM. Analise esta redação seguindo rigorosamente os critérios oficiais do ENEM.

IMPORTANTE: Retorne APENAS um JSON válido, sem texto antes ou depois, sem formatação markdown, sem explicações adicionais.

Estrutura do JSON:

{
  "finalScore": número de 0 a 1000,
  "competencies": {
    "Competência I": número de 0 a 200,
    "Competência II": número de 0 a 200,
    "Competência III": número de 0 a 200,
    "Competência IV": número de 0 a 200,
    "Competência V": número de 0 a 200
  },
  "feedback": {
    "summary": "resumo geral detalhado da correção (2-3 parágrafos)",
    "improvements": ["sugestão específica de melhoria 1", "sugestão específica de melhoria 2", "sugestão específica de melhoria 3"],
    "attention": ["ponto de atenção crítico 1", "ponto de atenção crítico 2", "ponto de atenção crítico 3"],
    "congratulations": ["aspecto positivo específico 1", "aspecto positivo específico 2", "aspecto positivo específico 3"],
    "competencyFeedback": {
      "Competência I": "feedback detalhado sobre domínio da modalidade escrita formal",
      "Competência II": "feedback detalhado sobre compreensão do tema e tipo textual",
      "Competência III": "feedback detalhado sobre seleção e organização de informações",
      "Competência IV": "feedback detalhado sobre coesão e coerência",
      "Competência V": "feedback detalhado sobre proposta de intervenção"
    }
  }
}

**CRITÉRIOS DETALHADOS DO ENEM:**

**Competência I - Domínio da modalidade escrita formal (0-200):**
- 200 pontos: Demonstra excelente domínio da modalidade escrita formal da língua portuguesa e de escolha de registro. Desvios gramaticais ou de convenções da escrita são aceitos somente como excepcionalidade.
- 160 pontos: Demonstra bom domínio da modalidade escrita formal, com poucos desvios gramaticais e de convenções da escrita.
- 120 pontos: Demonstra domínio mediano da modalidade escrita formal, com alguns desvios gramaticais e de convenções da escrita.
- 80 pontos: Demonstra domínio insuficiente da modalidade escrita formal, com muitos desvios gramaticais e de convenções da escrita.
- 40 pontos: Demonstra domínio precário da modalidade escrita formal, com inúmeros desvios gramaticais e de convenções da escrita.
- 0 pontos: Demonstra desconhecimento da modalidade escrita formal da língua portuguesa.

**Competência II - Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento (0-200):**
- 200 pontos: Desenvolve o tema por meio de argumentação consistente, a partir de um repertório sociocultural produtivo e apresenta excelente domínio do texto dissertativo-argumentativo.
- 160 pontos: Desenvolve o tema por meio de argumentação consistente e apresenta bom domínio do texto dissertativo-argumentativo, com proposição, argumentação e conclusão.
- 120 pontos: Desenvolve o tema por meio de argumentação previsível e apresenta domínio mediano do texto dissertativo-argumentativo, com proposição, argumentação e conclusão.
- 80 pontos: Desenvolve o tema recorrendo à cópia de trechos dos textos motivadores ou apresenta domínio insuficiente do texto dissertativo-argumentativo.
- 40 pontos: Apresenta o assunto, tangenciando o tema, ou demonstra domínio precário do texto dissertativo-argumentativo.
- 0 pontos: Fuga ao tema/não atendimento à estrutura dissertativo-argumentativa.

**Competência III - Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos (0-200):**
- 200 pontos: Apresenta informações, fatos e opiniões relacionados ao tema proposto, de forma consistente e organizada, configurando autoria, em defesa de um ponto de vista.
- 160 pontos: Apresenta informações, fatos e opiniões relacionados ao tema, de forma organizada, com indícios de autoria, em defesa de um ponto de vista.
- 120 pontos: Apresenta informações, fatos e opiniões relacionados ao tema, limitados aos argumentos dos textos motivadores e pouco organizados, em defesa de um ponto de vista.
- 80 pontos: Apresenta informações, fatos e opiniões relacionados ao tema, mas desorganizados ou contraditórios e limitados aos argumentos dos textos motivadores.
- 40 pontos: Apresenta informações, fatos e opiniões pouco relacionados ao tema ou incoerentes e sem defesa de um ponto de vista.
- 0 pontos: Apresenta informações, fatos e opiniões não relacionados ao tema e sem defesa de um ponto de vista.

**Competência IV - Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação (0-200):**
- 200 pontos: Articula bem as partes do texto e apresenta repertório diversificado de recursos coesivos.
- 160 pontos: Articula as partes do texto com poucas inadequações e apresenta repertório diversificado de recursos coesivos.
- 120 pontos: Articula as partes do texto, de forma mediana, com inadequações, e apresenta repertório pouco diversificado de recursos coesivos.
- 80 pontos: Articula as partes do texto, de forma insuficiente, com muitas inadequações e apresenta repertório limitado de recursos coesivos.
- 40 pontos: Articula as partes do texto de forma precária.
- 0 pontos: Não articula as informações.

**Competência V - Elaborar proposta de intervenção para o problema abordado (0-200):**
- 200 pontos: Elabora muito bem proposta de intervenção com detalhamento dos meios para realizá-la.
- 160 pontos: Elabora bem proposta de intervenção relacionada ao tema e articulada à discussão desenvolvida no texto.
- 120 pontos: Elabora, de forma mediana, proposta de intervenção relacionada ao tema e articulada à discussão desenvolvida no texto.
- 80 pontos: Elabora, de forma insuficiente, proposta de intervenção relacionada ao tema, ou não articulada com a discussão desenvolvida no texto.
- 40 pontos: Apresenta proposta de intervenção vaga, precária ou relacionada apenas ao assunto.
- 0 pontos: Não apresenta proposta de intervenção ou apresenta proposta não relacionada ao tema ou ao assunto.

**TEMA DA REDAÇÃO:** ${topic || 'Não especificado'}

**REDAÇÃO A SER ANALISADA:**
${essayText}

TAREFA: Analise cada competência detalhadamente e seja criterioso na pontuação. Forneça feedback construtivo e específico.

LEMBRETE FINAL: Sua resposta deve ser APENAS o JSON válido, começando com { e terminando com }. Não inclua explicações, comentários ou formatação markdown.`;

    console.log('📝 Enviando requisição para Open WebUI (Gemma3 Análise)...');
    console.log('📍 URL:', OPEN_WEBUI_BASE_URL);
    console.log('🎯 Modelo:', OPEN_WEBUI_MODEL);

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
            "content": prompt
          }
        ],
        "max_tokens": 4000,
        "temperature": 0.2,
        "stream": false
      })
    });

    console.log('📊 Status da resposta Análise:', response.status);
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.error('❌ Erro na API de análise:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      let errorMessage = 'Erro na API de análise';
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
    console.log('✅ Resposta de análise recebida');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Estrutura de resposta inválida:', data);
      throw new Error('Resposta inválida da API de análise');
    }

    const analysisText = data.choices[0].message.content;
    console.log('📄 Resposta da análise (primeiros 200 chars):', analysisText?.substring(0, 200) || 'Vazio');
    
    // Extrair JSON da resposta - várias tentativas
    let jsonText = analysisText.trim();
    
    // Tentativa 1: Extrair de bloco de código
    const jsonCodeBlockMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonCodeBlockMatch) {
      jsonText = jsonCodeBlockMatch[1].trim();
      console.log('📦 JSON extraído de bloco de código');
    }
    // Tentativa 2: Extrair JSON puro (do primeiro { ao último })
    else {
      const firstBrace = analysisText.indexOf('{');
      const lastBrace = analysisText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = analysisText.substring(firstBrace, lastBrace + 1).trim();
        console.log('📦 JSON extraído por posição de chaves');
      }
      // Tentativa 3: Regex tradicional
      else {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0].trim();
          console.log('📦 JSON extraído por regex');
        }
      }
    }
    
    console.log('🔍 Tentando parsear JSON (primeiros 200 chars):', jsonText.substring(0, 200));

    try {
      const analysis: EssayResult = JSON.parse(jsonText);
      analysis.originalEssay = essayText;
      console.log('✅ JSON parseado com sucesso, nota final:', analysis.finalScore);
      return analysis;
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      console.error('📄 Texto que causou erro:', jsonText);
      throw new Error('Resposta inválida da API - JSON malformado');
    }
  } catch (error) {
    console.error('❌ Erro completo na análise:', error);
    throw new Error(`Falha ao analisar redação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 === INICIANDO PROCESSAMENTO DE REDAÇÃO ===');
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
    const topic = formData.get('topic') as string;
    const essayText = formData.get('essayText') as string;

    console.log('📝 Dados recebidos:', {
      topic: topic || 'Não especificado',
      textLength: essayText?.length || 0
    });

    // Validações de segurança para texto
    if (!essayText) {
      console.error('❌ Texto da redação não fornecido');
      return NextResponse.json(
        { error: 'Texto da redação é obrigatório' },
        { status: 400, headers: responseHeaders }
      );
    }
    
    if (essayText.length < MIN_TEXT_LENGTH) {
      console.error('❌ Texto muito curto:', essayText.length);
      return NextResponse.json(
        { error: `Texto deve ter pelo menos ${MIN_TEXT_LENGTH} caracteres` },
        { status: 400, headers: responseHeaders }
      );
    }
    
    if (essayText.length > MAX_TEXT_LENGTH) {
      console.error('❌ Texto muito longo:', essayText.length);
      return NextResponse.json(
        { error: `Texto deve ter no máximo ${MAX_TEXT_LENGTH} caracteres` },
        { status: 400, headers: responseHeaders }
      );
    }

    // Validar o tópico se fornecido
    if (topic && topic.length > MAX_TOPIC_LENGTH) {
      console.error('❌ Tema muito longo:', topic.length);
      return NextResponse.json(
        { error: `Tema deve ter no máximo ${MAX_TOPIC_LENGTH} caracteres` },
        { status: 400, headers: responseHeaders }
      );
    }

    // Sanitizar o texto (remover caracteres perigosos)
    const originalLength = essayText.length;
    const sanitizedText = essayText.replace(/[<>]/g, '').trim();
    
    if (originalLength !== sanitizedText.length) {
      console.log('🧹 Texto sanitizado');
    }
    
    console.log('🔍 Iniciando análise da IA...');
    const analysis = await analyzeEssay(sanitizedText, topic);

    console.log('🎉 === PROCESSAMENTO CONCLUÍDO COM SUCESSO ===');
    
    // Retornar resultado diretamente (sem armazenamento por enquanto)
    return NextResponse.json(analysis, { headers: responseHeaders });
    
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
    const errorMessage = error instanceof Error && error.message.includes('API') 
      ? 'Erro na comunicação com o serviço de análise. Tente novamente em alguns minutos.'
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
