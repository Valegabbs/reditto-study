'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, AlertTriangle, Lightbulb, Printer, Brain, Award, TrendingUp, Target, Sun, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import ClientWrapper from '../components/ClientWrapper';
import Disclaimer from '../components/Disclaimer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function ResultadosPage() {
  const [result, setResult] = useState<any>(null);
  const { signOut, user, isConfigured } = useAuth();
  const savedRef = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  const n8nTextParam = urlParams.get('n8nText') || urlParams.get('text') || urlParams.get('n8n');
    const essayId = urlParams.get('essayId');

    // Prioridade: sessionStorage (evita passar base64 enormes pela URL)
    try {
      const cached = sessionStorage.getItem('reditto:lastDoubtResult');
      if (cached) {
        const parsed = JSON.parse(cached);
        setResult(normalizeResult(parsed));
        // limpar cache após leitura para evitar reuso acidental
        try { sessionStorage.removeItem('reditto:lastDoubtResult'); } catch {}
        return;
      }
    } catch (err) {
      // ignore and continue to parse URL params
    }

    const loadFromId = async (id: string) => {
      try {
        const { data: essay, error } = await supabase.from('essays').select('id, topic, essay_text, final_score, competencies, feedback, created_at').eq('id', id).single();
        if (error) {
          console.error('Erro ao buscar redação por id:', error);
          setResult(getExampleData());
          return;
        }

        const built = {
          finalScore: essay.final_score,
          competencies: essay.competencies ? JSON.parse(essay.competencies) : null,
          feedback: essay.feedback ? JSON.parse(essay.feedback) : null,
          originalEssay: essay.essay_text,
          topic: essay.topic,
          created_at: essay.created_at
        };
        setResult(built);
      } catch (err) {
        console.error('Erro ao carregar redação por id:', err);
        setResult(getExampleData());
      }
    };

    if (n8nTextParam) {
      // Parâmetro vindo do workflow n8n (texto puro) — tentar decodificar e normalizar
      try {
        const raw = decodeURIComponent(n8nTextParam);
        // o n8n pode enviar texto simples ou uma string JSON — tentar detectar
        let parsed: any = raw;
        try { parsed = JSON.parse(raw); } catch {}
        setResult(normalizeResult(parsed));
      } catch (err) {
        setResult(normalizeResult(n8nTextParam));
      }
    } else if (dataParam) {
      // Dados vindos da API de correção em JSON (prioridade)
      try {
  const parsedData = JSON.parse(decodeURIComponent(dataParam));
  setResult(normalizeResult(parsedData));
      } catch (error) {
        console.error('Erro ao parsear dados:', error);
        // Fallback: tentar carregar por essayId se fornecido
        if (essayId) {
          loadFromId(essayId);
        } else {
          setResult(getExampleData());
        }
      }
    } else if (essayId) {
      // Carregar diretamente do banco usando o id
  loadFromId(essayId);
    } else {
      // Sem parâmetros: mostrar dados de exemplo
      setResult(getExampleData());
    }
  }, []);

  // Normaliza formatos variados vindos do n8n / APIs para um shape consistente
  function normalizeResult(input: any) {
    // if string: tentar heurísticas para separar dúvida e resposta
    if (typeof input === 'string') {
      const s = input.trim();
      // tentativa 1: dupla quebra de linha -> primeira parte = dúvida, resto = resposta
      const dbl = s.split(/\r?\n\r?\n/);
      if (dbl.length >= 2) {
        const original = dbl[0].trim();
        const ai = dbl.slice(1).join('\n\n').trim();
        return { aiResponse: ai || null, originalDoubt: original || null };
      }

      // tentativa 2: procurar marcadores "Resposta" e "Dúvida"
      const respostaMatch = s.match(/(?:resposta(?: da ia)?|answer|response|resultado|output)[:\s-]+([\s\S]+)/i);
      const doubtMatch = s.match(/(?:dúvida|duvida|pergunta|question|prompt|original question|original doubt)[:\s-]+([\s\S]+?)(?:\r?\n|$)/i);
      if (respostaMatch && doubtMatch) {
        return { aiResponse: respostaMatch[1].trim(), originalDoubt: doubtMatch[1].trim() };
      }
      if (respostaMatch) {
        const before = respostaMatch.index ? s.slice(0, respostaMatch.index).trim() : '';
        return { aiResponse: respostaMatch[1].trim(), originalDoubt: before || null };
      }

      // tentativa 3: única linha com '?' -> provavelmente é a dúvida
      if (s.length < 200 && s.endsWith('?')) {
        return { aiResponse: null, originalDoubt: s };
      }

      // fallback: tratar tudo como resposta
      return { aiResponse: s, originalDoubt: null };
    }

    // if array, try first element
    if (Array.isArray(input) && input.length > 0) {
      // n8n costuma enviar [{ json: { output: '...' } }]
      const first = input[0];
      if (first && typeof first === 'object') {
        if (first.json) return normalizeResult(first.json);
        return normalizeResult(first);
      }
    }

    if (typeof input === 'object' && input !== null) {
      // possible keys for ai response
      const aiCandidates = ['aiResponse', 'ai_response', 'output', 'text', 'response', 'answer', 'result'];
      let ai: string | null = null;
      for (const k of aiCandidates) {
        if (input[k]) { ai = input[k]; break; }
      }

      // possible keys for original doubt/question
      const doubtCandidates = ['originalDoubt', 'original_doubt', 'originalQuestion', 'doubt', 'input', 'question', 'prompt', 'userQuestion', 'doubt_text'];
      let od: string | null = null;
      for (const k of doubtCandidates) {
        if (input[k]) { od = input[k]; break; }
      }

      // possible keys for images associated with the doubt (base64 or urls)
      const imageCandidates = ['doubtImages', 'doubt_images', 'imagesBase64', 'images', 'image_urls', 'imageUrls'];
      let di: string[] | null = null;
      for (const k of imageCandidates) {
        if (input[k] && Array.isArray(input[k])) { di = input[k]; break; }
      }

      // if nested with items/json
      if (!ai && input.items && Array.isArray(input.items) && input.items[0]) {
        const maybe = input.items[0];
        if (maybe.json) return normalizeResult(maybe.json);
      }

      // coerce to strings and carry images array if present
      return {
        aiResponse: ai != null ? String(ai) : null,
        originalDoubt: od != null ? String(od) : null,
        doubtImageUrl: input.doubtImageUrl || input.doubt_image_url || input.image_url || null,
        doubtImages: di || null,
        // keep original raw for debugging if needed
        __raw: input
      };
    }

    return { aiResponse: null, originalDoubt: null };
  }

  // Salvar automaticamente a redação no histórico do usuário autenticado
  useEffect(() => {
    if (!result || !user || !isConfigured) return;

    // Evitar múltiplas execuções causadas por re-renders
    if (savedRef.current) return;
    savedRef.current = true;

    (async () => {
      try {
        const record = {
          user_id: user.id,
          topic: (result.topic as string) || null,
          essay_text: (result.originalEssay as string) || '',
          final_score: (result.finalScore as number) ?? null,
          competencies: result.competencies ? JSON.stringify(result.competencies) : null,
          feedback: result.feedback ? JSON.stringify(result.feedback) : null,
        };

        const serialized = JSON.stringify(record);
        const lastSaved = sessionStorage.getItem('lastSavedEssay');
        if (lastSaved === serialized) {
          // Já salvo nessa sessão
          return;
        }

        // Verificar no banco se já existe um registro similar (proteção contra efeitos duplos)
        try {
          const { data: existing, error: selectError } = await supabase
            .from('essays')
            .select('id')
            .eq('user_id', user.id)
            .eq('essay_text', record.essay_text)
            .eq('final_score', record.final_score)
            .limit(1);

          if (selectError) {
            console.warn('Erro ao checar duplicatas antes de salvar:', selectError);
          } else if (existing && existing.length > 0) {
            // Já existe um registro idêntico
            try { sessionStorage.setItem('lastSavedEssay', serialized); } catch {}
            return;
          }
        } catch (err) {
          console.warn('Erro inesperado na verificação de duplicatas:', err);
        }

        const { data, error } = await supabase.from('essays').insert(record).select().single();
        if (error) {
          console.error('Erro ao salvar redação no histórico:', error);
        } else {
          try { sessionStorage.setItem('lastSavedEssay', serialized); } catch {}
          console.log('Redação salva no histórico:', data?.id);
        }
      } catch (err) {
        console.error('Erro inesperado ao salvar redação:', err);
      }
    })();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, user, isConfigured]);

  const getExampleData = () => {
    return {
      finalScore: 780,
      competencies: {
        'Competência I': 180,
        'Competência II': 160,
        'Competência III': 140,
        'Competência IV': 160,
        'Competência V': 140
      },
      feedback: {
        summary: "A redação aborda o tema da intolerância religiosa no Brasil de forma compreensiva e argumentativa, com exemplos históricos e atuais. A escrita é clara e coerente, mas há espaço para melhoria na profundidade dos argumentos e no detalhamento da proposta de intervenção.",
        improvements: [
          "Conexão mais explícita entre a citação de Einstein e o tema",
          "Profundidade maior nos argumentos", 
          "Detalhamento maior na proposta de intervenção"
        ],
        attention: [
          "Desenvolver mais a introdução para contextualizar a citação de Einstein",
          "Incluir exemplos mais concretos de como a intolerância religiosa afeta a sociedade atualmente",
          "Especificar os agentes e meios da proposta de intervenção"
        ],
        congratulations: [
          "Escrita clara e coerente",
          "Exemplos históricos e atuais relevantes",
          "Conexão com direitos humanos"
        ],
        competencyFeedback: {
          'Competência I': 'Demonstra bom domínio da modalidade escrita formal, com poucos desvios.',
          'Competência II': 'Desenvolve o tema adequadamente com argumentação consistente.',
          'Competência III': 'Apresenta informações organizadas em defesa do ponto de vista.',
          'Competência IV': 'Articula as partes do texto com adequação mediana.',
          'Competência V': 'Proposta de intervenção relacionada ao tema, mas com detalhamento insuficiente.'
        }
      },
      originalEssay: 'É mais fácil desintegrar um átomo que um preconceito. Com essa frase, Albert Einstein desvelou os entraves que envolvem o combate às diversas formas de discriminação existentes na sociedade.'
    };
  };

  const handleNewDoubt = () => {
    window.location.href = '/materias';
  };

  const handlePrintResult = () => {
    window.print();
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (!result) {
    return (
      <ClientWrapper>
        <div className="min-h-screen bg-background bg-dot-grid flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Carregando resultados...</p>
          </div>
        </div>
      </ClientWrapper>
    );
  }

  return (
    <ClientWrapper showFloatingMenu={false}>
      <div className="min-h-screen bg-background bg-dot-grid">

      {/* Header (copiado da página de envio) */}
      <div className="flex items-center p-6 max-w-6xl mx-auto">
        {/* Esconde logo e slogan no mobile (onde existe o menu hambúrguer) */}
            <div className="hidden md:flex items-center gap-2 header-item bg-gray-800/20 border border-gray-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
            <Image src="/assets/study.png" alt="Reditto Logo" width={20} height={20} className="w-5 h-5" />
          <span className="header-text text-white/90 text-sm font-medium">Reditto Study - Sua IA de Estudos!</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button 
            onClick={() => { window.location.href = '/materias'; }}
            className="text-white hover:text-blue-300 transition-colors flex items-center justify-center rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 p-2"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <button 
            onClick={() => {
              const current = document.documentElement.getAttribute('data-theme') || 'dark';
              const next = current === 'dark' ? 'light' : 'dark';
              document.documentElement.setAttribute('data-theme', next);
              try { localStorage.setItem('reditto-theme', next); } catch {}
            }} 
            className="text-white hover:text-yellow-400 transition-colors p-2 rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 header-text" 
            aria-label="Alternar tema"
          >
            <Sun size={20} />
          </button>
          <button 
            onClick={handleSignOut} 
            className="header-text text-white hover:text-red-300 transition-colors flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
            </svg>
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Doubt Overview */}
        <div className="card mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain size={32} className="text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Resposta da IA</h1>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-blue-400 mb-2">Dúvida Respondida!</div>
              <div className="text-gray-300 text-lg">Sua dúvida foi analisada e respondida pela IA</div>
            </div>
          </div>
        </div>

        {/* Doubt Section */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={24} className="text-blue-400" />
            <h2 className="text-white text-xl font-semibold">Sua Dúvida</h2>
          </div>
          <div className="bg-gray-800/20 rounded-2xl p-4 border border-gray-700/50 backdrop-blur-sm">
              <div className="text-gray-300 leading-relaxed space-y-4">
                {result.originalDoubt ? (
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap">{String(result.originalDoubt)}</div>
                ) : result.originalEssay ? (
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap">{String(result.originalEssay)}</div>
                ) : (
                  <div className="text-gray-400">Dúvida não disponível</div>
                )}

                {/* Se houver imagens associadas à dúvida, renderizar abaixo */}
                {((result.doubtImages && result.doubtImages.length > 0) || result.doubtImageUrl) && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(result.doubtImages || (result.doubtImageUrl ? [result.doubtImageUrl] : []))
                      .filter(Boolean)
                      .map((src: string, idx: number) => (
                        <div key={idx} className="rounded-lg overflow-hidden border border-gray-700/40 bg-gray-900/10 p-2">
                          <img src={src} alt={`Imagem da dúvida ${idx+1}`} className="w-full h-auto object-contain" />
                        </div>
                      ))}
                  </div>
                )}

              </div>
            </div>
        </div>

        {/* Image Preview if available */}
        {result.doubtImageUrl && (
          <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
              <ImageIcon size={24} className="text-blue-400" />
              <h2 className="text-white text-xl font-semibold">Imagem Enviada</h2>
          </div>
            <div className="bg-gray-800/20 rounded-2xl p-4 border border-gray-700/50 backdrop-blur-sm">
              <img 
                src={result.doubtImageUrl} 
                alt="Imagem da dúvida" 
                className="max-w-full h-auto rounded-lg"
              />
              </div>
          </div>
        )}

        {/* AI Response Section */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={24} className="text-blue-400" />
            <h2 className="text-white text-xl font-semibold">Resposta da IA</h2>
          </div>
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/20 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-sm">
            <pre className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">{String(result.aiResponse || result.feedback?.summary || 'Resposta não disponível')}</pre>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleNewDoubt}
            className="btn-primary"
          >
            <Brain size={20} />
            Nova Dúvida
          </button>
          <button
            onClick={handlePrintResult}
            className="btn-secondary"
          >
            <Printer size={20} />
            Imprimir Resposta
          </button>
        </div>
      </main>
      <Disclaimer />
      </div>
    </ClientWrapper>
  );
}