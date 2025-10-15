'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Sun, ArrowLeft } from 'lucide-react';
import ClientWrapper from '../components/ClientWrapper';
import Sidebar from '../components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface DoubtRow {
  id: string;
  subject: string;
  doubt_text: string;
  doubt_image_url?: string | null;
  ai_response: string;
  created_at: string;
}

export default function HistoricoPage() {
  const { user, isConfigured, signOut } = useAuth();
  const [doubts, setDoubts] = useState<DoubtRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDoubts = async () => {
    if (!user || !isConfigured) {
      setDoubts([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doubts')
        .select('id, subject, doubt_text, doubt_image_url, ai_response, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoubts((data || []) as DoubtRow[]);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setDoubts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubts();
    // Inscrever para mudanças em tempo real (opcional)
    const subscription = supabase
      .channel('public:doubts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doubts' }, (payload: any) => {
        // Recarregar ao detectar mudança relevante para este usuário
        // Payload shape can vary between SDK versions: check common fields
        const rec = payload?.record ?? payload?.new ?? (Array.isArray(payload?.rows) ? payload.rows[0] : null);
        if (rec?.user_id === user?.id) loadDoubts();
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(subscription); } catch {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isConfigured]);

  const handleDelete = async (id: string) => {
    try {
      const ok = await (window as any).redittoConfirm?.('Deseja realmente excluir esta dúvida?');
      if (!ok) return;

  if (!user?.id) throw new Error('Usuário não autenticado');
  const { error } = await supabase.from('doubts').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setDoubts(prev => prev.filter(d => d.id !== id));
      window.dispatchEvent(new CustomEvent('reditto:toast', { detail: { message: 'Dúvida excluída com sucesso.', type: 'success' } }));
    } catch (err) {
      console.error('Erro ao excluir dúvida:', err);
      window.dispatchEvent(new CustomEvent('reditto:toast', { detail: { message: 'Falha ao excluir. Tente novamente.', type: 'error' } }));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <ClientWrapper showFloatingMenu={false}>
      <div className="min-h-screen bg-background bg-dot-grid">
        <div className="flex">
          <Sidebar />
          <div className="w-full">
            <div className="max-w-5xl px-6 py-8 mx-auto">
              <div className="flex items-center p-6 mb-4">
                <div className="hidden md:flex items-center gap-2 header-item bg-gray-800/20 border border-gray-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
                  <Image src="/assets/study.png" alt="Reditto Logo" width={20} height={20} className="w-5 h-5" />
                  <span className="header-text text-white/90 text-sm font-medium">Reditto Study - Sua IA de Estudos!</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <button 
                    onClick={() => { window.location.href = '/materias'; }}
                    className="text-white hover:text-blue-300 transition-colors flex items-center justify-center rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 p-2"
                    aria-label="Ir para matérias"
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
                </div>
                <button onClick={handleSignOut} className="ml-2 text-white hover:text-red-300 transition-colors px-3 py-1.5 rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60">
                  Sair
                </button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white">Histórico de Dúvidas</h1>
                    <p className="text-gray-300 mt-2">Veja todas as suas dúvidas respondidas — toque em qualquer card para rever a resposta completa.</p>
                  </div>
                  <button
                    onClick={() => { window.location.href = '/materias'; }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                    Tirar Dúvida!
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-gray-700/50 bg-gray-800/20 backdrop-blur-sm">
                {loading ? (
                  <div className="text-center text-gray-300">Carregando histórico...</div>
                ) : doubts.length === 0 ? (
                  <p className="text-gray-300">Seu histórico aparecerá aqui quando houver registros.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {doubts.map((d, idx) => {
                      const title = `Dúvida ${idx + 1}: ${d.subject}`;
                      const doubtPreview = d.doubt_text.length > 100 ? d.doubt_text.substring(0, 100) + '...' : d.doubt_text;

                      const handleOpen = async () => {
                        // construir payload para /resultados
                        const payload = {
                          originalDoubt: d.doubt_text,
                          doubtImageUrl: d.doubt_image_url,
                          aiResponse: d.ai_response,
                          subject: d.subject
                        };
                        window.location.href = `/resultados?data=${encodeURIComponent(JSON.stringify(payload))}`;
                      };

                      return (
                        <article key={d.id} onClick={handleOpen} className="group cursor-pointer p-6 rounded-2xl panel-base border border-gray-700/40 hover:scale-105 transform transition-all duration-200 relative">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="status-circle p-2 rounded-full" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <path fill="#ffffff" d="M20.285 6.708a1 1 0 00-1.414-1.416l-9.193 9.193-3.172-3.172a1 1 0 10-1.414 1.414l3.88 3.88a1 1 0 001.414 0l9.899-9.899z" />
                                </svg>
                              </div>
                              <div>
                                {/* Campo cinza e tema ocultos em telas pequenas */}
                                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-200/60 to-gray-200/40 px-4 py-1 rounded-full hidden md:flex">
                                  <div className="text-xs font-semibold tracking-wide text-yellow-400">&nbsp;</div>
                                  <div className="text-sm font-semibold text-black">{title}</div>
                                </div>
                                <div className="text-sm hist-date mt-2">Enviada em: {new Date(d.created_at).toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-extrabold text-blue-400">{d.subject}</div>
                              <div className="text-sm text-gray-400">Matéria</div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="text-sm text-gray-300 mb-2">
                              <strong>Dúvida:</strong> {doubtPreview}
                            </div>
                            {d.doubt_image_url && (
                              <div className="text-xs text-blue-400 mb-2">
                                📷 Inclui imagem
                              </div>
                            )}
                          </div>
                          
                          {/* Ícone de lixeira centralizado, com fundo e borda circular */}
                          <div className="flex justify-center mt-4">
                            <button
                              type="button"
                              onClick={ev => { ev.stopPropagation(); handleDelete(d.id); }}
                              className="p-0 bg-transparent hover:scale-110 transition-transform"
                              aria-label="Excluir dúvida"
                            >
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 border-2 border-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24">
                                  <path fill="#fff" d="M9 3v1H4v2h16V4h-5V3a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2zm-4 6v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9H5zm2 2h10v9H7v-9z"/>
                                </svg>
                              </span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
}


