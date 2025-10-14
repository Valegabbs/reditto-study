'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ClientWrapper from '../../components/ClientWrapper';
import Sidebar from '../../components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function HistoricoDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isConfigured } = useAuth();
  const [loading, setLoading] = useState(true);
  const [essay, setEssay] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!id || !user || !isConfigured) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('essays').select('*').eq('id', id).eq('user_id', user.id).single();
        if (error) throw error;
        setEssay(data);
      } catch (err) {
        console.error('Erro ao carregar redação:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, isConfigured]);

  const handleBack = () => router.push('/historico');

  const openAsResultadosLocal = () => {
    try {
      const payload = {
        finalScore: essay.final_score,
        competencies: essay.competencies ? JSON.parse(essay.competencies) : null,
        feedback: essay.feedback ? JSON.parse(essay.feedback) : null,
        originalEssay: essay.essay_text,
        topic: essay.topic || null
      };
      const url = `/resultados?data=${encodeURIComponent(JSON.stringify(payload))}`;
      if (typeof window !== 'undefined') window.location.href = url;
    } catch (err) {
      console.error('Erro ao abrir como resultados:', err);
    }
  };

  if (loading) {
    return (
      <ClientWrapper showFloatingMenu={false}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-white">Carregando...</div>
        </div>
      </ClientWrapper>
    );
  }

  if (!essay) {
    return (
      <ClientWrapper showFloatingMenu={false}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-white">Redação não encontrada ou acesso negado.</div>
        </div>
      </ClientWrapper>
    );
  }

  const competencies = essay.competencies ? JSON.parse(essay.competencies) : null;
  const feedback = essay.feedback ? JSON.parse(essay.feedback) : null;

  return (
    <ClientWrapper showFloatingMenu={false}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          <div className="w-full">
            <div className="max-w-5xl px-6 py-8 mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={handleBack} className="text-sm text-gray-300 hover:text-white">← Voltar</button>
                </div>
                <h1 className="text-2xl font-bold text-white">Redação</h1>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { window.location.href = '/envio'; }}
                    className="text-white hover:text-blue-300 transition-colors flex items-center justify-center rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 p-2"
                    aria-label="Ir para envio"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button onClick={openAsResultadosLocal} className="px-3 py-2 rounded-md btn-primary">
                    Ver como Resultado
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-400">Enviada em: {new Date(essay.created_at).toLocaleString()}</div>
                      <div className="text-lg font-semibold text-white mt-1">{essay.topic || 'Sem título'}</div>
                    </div>
                    <div className="text-4xl font-extrabold text-blue-400">{essay.final_score ?? '—'}</div>
                  </div>
                  <div className="bg-gray-800/20 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-gray-300 whitespace-pre-wrap">{essay.essay_text}</p>
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Análise por Competência</h2>
                  {competencies ? Object.entries(competencies).map(([k, v]: any) => (
                    <div key={k} className="flex items-center justify-between py-2">
                      <div className="text-sm text-gray-300">{k.replace('Competência ', 'C')}</div>
                      <div className="text-lg font-semibold text-white">{v}</div>
                    </div>
                  )) : <div className="text-gray-400">Sem dados de competências</div>}
                </div>

                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Feedback</h2>
                  <div className="text-gray-300 mb-3">{feedback?.summary || 'Sem feedback geral'}</div>
                  <div className="space-y-2">
                    {feedback?.improvements?.map((it: string, i: number) => (
                      <div key={i} className="text-sm text-yellow-200">• {it}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
}

// Redirecionar para a página de resultados com os dados reconstruídos
// quando o usuário preferir ver a UI exata de resultados
// compat shim: export não necessário para a rota; removido para evitar erro de build




