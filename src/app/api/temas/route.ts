import { NextRequest, NextResponse } from 'next/server';

// Cache em memória para os temas (não persiste no banco)
let temasCache: {
  temas: string[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em ms

// Função para verificar se deve atualizar baseado no horário (9h da manhã)
function deveAtualizarPorHorario(): boolean {
  const agora = new Date();
  const horaAtual = agora.getHours();
  
  // Se for 9h da manhã e ainda não atualizou hoje
  if (horaAtual >= 9) {
    if (!temasCache) return true;
    
    const ultimaAtualizacao = new Date(temasCache.timestamp);
    const hoje = new Date();
    
    // Se a última atualização foi antes das 9h de hoje
    return ultimaAtualizacao.getDate() !== hoje.getDate() || 
           ultimaAtualizacao.getHours() < 9;
  }
  
  return false;
}

// Lista expandida de temas para seleção aleatória
const TEMAS_DISPONIVEIS = [
  "A importância da educação digital no Brasil",
  "Os desafios da sustentabilidade urbana",
  "O impacto das redes sociais na sociedade contemporânea",
  "A democratização do acesso à cultura no Brasil",
  "Os desafios da mobilidade urbana nas grandes cidades",
  "O papel da tecnologia na inclusão social",
  "A preservação do meio ambiente e desenvolvimento econômico",
  "A importância da leitura na formação do cidadão",
  "Os desafios da educação pública no Brasil",
  "O combate à violência contra a mulher",
  "A valorização da diversidade cultural brasileira",
  "Os impactos da pandemia na educação",
  "A importância do esporte na sociedade",
  "Os desafios da saúde mental na juventude",
  "A preservação da memória histórica nacional",
  "O papel da arte na transformação social",
  "Os desafios da alimentação saudável no Brasil",
  "A importância do voluntariado na sociedade",
  "Os impactos da globalização na cultura local",
  "O combate ao trabalho infantil no Brasil",
  "A importância da ciência para o desenvolvimento nacional",
  "Os desafios da acessibilidade nas cidades",
  "O papel da família na educação dos filhos",
  "A preservação dos recursos hídricos",
  "Os desafios da terceira idade na sociedade contemporânea"
];

// Função para gerar 3 temas aleatórios
function gerarTemasAleatorios(): string[] {
  const temasSelecionados = [...TEMAS_DISPONIVEIS];
  
  // Embaralhar array usando Fisher-Yates
  for (let i = temasSelecionados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [temasSelecionados[i], temasSelecionados[j]] = [temasSelecionados[j], temasSelecionados[i]];
  }
  
  // Retornar os 3 primeiros com numeração
  return temasSelecionados.slice(0, 3).map((tema, index) => 
    `Tema ${index + 1}: ${tema}`
  );
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Se forçar refresh, cache expirado ou horário de atualização (9h), gerar novos temas aleatórios
    if (forceRefresh || !temasCache || (Date.now() - temasCache.timestamp) > CACHE_DURATION || deveAtualizarPorHorario()) {
      const novosTemas = gerarTemasAleatorios();
      
      // Atualizar cache
      temasCache = {
        temas: novosTemas,
        timestamp: Date.now()
      };
      
      return NextResponse.json({
        temas: novosTemas,
        cached: false,
        lastUpdate: new Date(temasCache.timestamp).toISOString(),
        message: forceRefresh ? 'Temas atualizados com sucesso' : 'Temas gerados automaticamente'
      });
    }

    return NextResponse.json({
      temas: temasCache.temas,
      cached: true,
      lastUpdate: new Date(temasCache.timestamp).toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar temas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
