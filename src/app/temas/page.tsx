'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sun, BookOpen, Clock, RefreshCw } from 'lucide-react';
import ClientWrapper from '../components/ClientWrapper';
import Sidebar from '../components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';

interface TemasData {
  temas: string[];
  cached: boolean;
  lastUpdate?: string;
}

export default function TemasPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [temas, setTemas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isCached, setIsCached] = useState(false);

  const fetchTemas = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const url = showRefresh ? '/api/temas?refresh=true' : '/api/temas';
      const response = await fetch(url);
      const data: TemasData = await response.json();
      
      if (response.ok) {
        setTemas(data.temas);
        setIsCached(data.cached);
        if (data.lastUpdate) {
          setLastUpdate(new Date(data.lastUpdate).toLocaleString('pt-BR'));
        }
      } else {
        console.error('Erro ao buscar temas:', data);
        // Fallback para temas padrão
        setTemas([
          'Tema 1: A importância da educação digital no Brasil',
          'Tema 2: Os desafios da sustentabilidade urbana', 
          'Tema 3: O impacto das redes sociais na sociedade contemporânea'
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar temas:', error);
      // Fallback para temas padrão
      setTemas([
        'Tema 1: A importância da educação digital no Brasil',
        'Tema 2: Os desafios da sustentabilidade urbana',
        'Tema 3: O impacto das redes sociais na sociedade contemporânea'
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTemas();
  }, []);

  const handleTemaClick = (tema: string) => {
    // Extrair apenas o texto do tema (remover "Tema X: " se existir)
    const temaText = tema.replace(/^Tema \d+:\s*/, '');
    
    // Redirecionar para envio com tema pré-preenchido
    const params = new URLSearchParams({
      tema: temaText
    });
    
    router.push(`/envio?${params.toString()}`);
  };

  const handleRefresh = () => {
    fetchTemas(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  if (loading) {
    return (
      <ClientWrapper showFloatingMenu={false}>
        <div className="min-h-screen bg-background bg-dot-grid">
          <div className="flex">
            <Sidebar />
            <div className="w-full">
              <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-500 animate-spin"></div>
                  <p className="text-white">Carregando temas...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ClientWrapper>
    );
  }

  return (
    <ClientWrapper showFloatingMenu={false}>
      <div className="min-h-screen bg-background bg-dot-grid">
        <div className="flex">
          <Sidebar />
          <div className="w-full">
            <div className="max-w-5xl px-6 py-8 mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => router.push('/envio')}
                    className="text-white hover:text-blue-300 transition-colors flex items-center justify-center rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 p-2"
                    aria-label="Voltar"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h1 className="text-2xl font-bold text-white">Temas de Redação</h1>
                </div>
                <div className="flex items-center gap-3">
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
                  <button onClick={handleSignOut} className="text-white hover:text-red-300 transition-colors px-3 py-1.5 rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60">
                    Sair
                  </button>
                </div>
              </div>

              {/* Status dos temas */}
              <div className="mb-6 p-4 rounded-2xl border backdrop-blur-sm border-gray-700/50 bg-gray-800/20 temas-status-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock size={16} />
                    <span>
                      {isCached && lastUpdate 
                        ? `Última atualização: ${lastUpdate}`
                        : 'Temas atualizados automaticamente a cada 24 horas'
                      }
                    </span>
                    {isCached && (
                      <span className="ml-2 px-2 py-1 rounded-full bg-green-900/30 text-green-400 text-xs">
                        Atualizado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Trocar os Temas</span>
                    <button 
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="text-white hover:text-blue-300 transition-colors flex items-center justify-center rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 p-2 disabled:opacity-50"
                      aria-label="Atualizar temas"
                    >
                      <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cards de temas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {temas.map((tema, index) => (
                  <div
                    key={index}
                    onClick={() => handleTemaClick(tema)}
                    className="p-6 rounded-2xl border backdrop-blur-sm border-gray-700/50 bg-gray-800/20 hover:bg-gray-800/30 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 group temas-theme-card"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                        <BookOpen size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Sugestão de Tema {index + 1}
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {tema.replace(/^Tema \d+:\s*/, '')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-400 font-medium">
                        Clique para usar este tema
                      </span>
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/40 transition-colors">
                        <ArrowLeft size={14} className="text-blue-400 rotate-180" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Informações adicionais */}
              <div className="mt-8 p-4 rounded-2xl border backdrop-blur-sm border-gray-700/50 bg-gray-800/20 temas-info-card">
                <h3 className="text-lg font-semibold text-white mb-2">Como funciona?</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Os temas são alterados a cada 24 horas, sempre as 9:00 da manhã (Horário de Brasília)</li>
                  <li>• Clique em qualquer tema para começar uma redação</li>
                  <li>• Use o botão de atualizar para verificar novos temas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
}
