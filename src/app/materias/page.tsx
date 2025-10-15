'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Calculator, Atom, Globe, Microscope, Palette, Music, History, MapPin, Heart, Brain, Zap, Sun, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import ClientWrapper from '../components/ClientWrapper';
import Disclaimer from '../components/Disclaimer';
import Sidebar from '../components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TermsConsentModal from '../components/TermsConsentModal';
import { supabase } from '@/lib/supabase';

interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  gradient: string;
}

const subjects: Subject[] = [
  {
    id: 'matematica',
    name: 'Matemática',
    icon: <Calculator size={32} />,
    description: 'Álgebra, geometria, cálculo e muito mais',
    color: 'from-blue-500 to-blue-700',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700'
  },
  {
    id: 'portugues',
    name: 'Português',
    icon: <BookOpen size={32} />,
    description: 'Gramática, literatura e interpretação de texto',
    color: 'from-green-500 to-green-700',
    gradient: 'bg-gradient-to-br from-green-500 to-green-700'
  },
  {
    id: 'fisica',
    name: 'Física',
    icon: <Atom size={32} />,
    description: 'Mecânica, termodinâmica e eletromagnetismo',
    color: 'from-blue-500 to-blue-700',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700'
  },
  {
    id: 'quimica',
    name: 'Química',
    icon: <Microscope size={32} />,
    description: 'Reações químicas, estequiometria e orgânica',
    color: 'from-orange-500 to-orange-700',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-700'
  },
  {
    id: 'biologia',
    name: 'Biologia',
    icon: <Heart size={32} />,
    description: 'Genética, ecologia e anatomia',
    color: 'from-pink-500 to-pink-700',
    gradient: 'bg-gradient-to-br from-pink-500 to-pink-700'
  },
  {
    id: 'historia',
    name: 'História',
    icon: <History size={32} />,
    description: 'História do Brasil e mundial',
    color: 'from-amber-500 to-amber-700',
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-700'
  },
  {
    id: 'geografia',
    name: 'Geografía',
    icon: <MapPin size={32} />,
    description: 'Geografia física e humana',
    color: 'from-teal-500 to-teal-700',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-700'
  },
  {
    id: 'filosofia',
    name: 'Filosofia',
    icon: <Brain size={32} />,
    description: 'Ética, lógica e filosofia política',
    color: 'from-indigo-500 to-indigo-700',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700'
  },
  {
    id: 'sociologia',
    name: 'Sociologia',
    icon: <Globe size={32} />,
    description: 'Sociedade, cultura e movimentos sociais',
    color: 'from-cyan-500 to-cyan-700',
    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700'
  },
  {
    id: 'artes',
    name: 'Artes',
    icon: <Palette size={32} />,
    description: 'História da arte e expressões artísticas',
    color: 'from-rose-500 to-rose-700',
    gradient: 'bg-gradient-to-br from-rose-500 to-rose-700'
  },
  {
    id: 'musica',
    name: 'Música',
    icon: <Music size={32} />,
    description: 'Teoria musical e história da música',
    color: 'from-violet-500 to-violet-700',
    gradient: 'bg-gradient-to-br from-violet-500 to-violet-700'
  },
  {
    id: 'outros',
    name: 'Outros',
    icon: <Zap size={32} />,
    description: 'Outras áreas do conhecimento',
    color: 'from-gray-500 to-gray-700',
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-700'
  }
];

export default function MateriasPage() {
  const { user, signOut, isConfigured, loading } = useAuth();
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);

  const handleSubjectSelect = (subjectId: string) => {
    // Redirecionar para a página de dúvida com a matéria selecionada
    router.push(`/duvida?materia=${subjectId}`);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setShowConsent(false);
    await signOut();
    window.location.href = '/';
  };

  // Carregar/checar consentimento
  useEffect(() => {
    // Mostrar popup informativo uma vez por sessão quando usuário visita a página de matérias
    try {
      const shown = sessionStorage.getItem('reditto-materias-popup-shown') === 'true';
      if (!shown) {
        setShowPopup(true);
        sessionStorage.setItem('reditto-materias-popup-shown', 'true');
      }
    } catch {}

    const check = async () => {
      if (isSigningOut) { setShowConsent(false); return; }
      // Aguarda carregar estado de auth para evitar abrir modal indevidamente
      if (loading) return;

      // Visitante: sempre exige consentimento
      if (!isConfigured || !user) {
        setHasAcceptedConsent(false);
        // Exigir na entrada da página, mas não repetir após aceite nesta sessão
        let accepted = false;
        try { accepted = sessionStorage.getItem('reditto-visitor-consent-accepted') === 'true'; } catch {}
        setShowConsent(!accepted);
        return;
      }

      // Usuário logado: verificar no metadata
      const acceptedTerms = Boolean(user.user_metadata?.accepted_terms);
      const acceptedPrivacy = Boolean(user.user_metadata?.accepted_privacy);
      const accepted = acceptedTerms && acceptedPrivacy;
      setHasAcceptedConsent(accepted);
      setShowConsent(!accepted);
    };
    check();
  }, [isConfigured, user, loading, isSigningOut]);

  const ensureConsent = async (): Promise<boolean> => {
    // Visitante
    if (!isConfigured || !user) {
      let accepted = false;
      try { accepted = sessionStorage.getItem('reditto-visitor-consent-accepted') === 'true'; } catch {}
      if (!accepted) {
        setShowConsent(true);
        return false;
      }
      return true;
    }

    // Logado
    if (!hasAcceptedConsent) {
      setShowConsent(true);
      return false;
    }
    return true;
  };

  const handleConsentProceed = async () => {
    // Visitante: salvar somente na sessão/localStorage
    if (!isConfigured || !user) {
      try { sessionStorage.setItem('reditto-visitor-consent-accepted', 'true'); } catch {}
      setShowConsent(false);
      return;
    }

    // Logado: persistir no user_metadata
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          accepted_terms: true,
          accepted_privacy: true,
          accepted_at: new Date().toISOString()
        }
      });
      if (error) throw error;
      setHasAcceptedConsent(true);
      setShowConsent(false);
      window.dispatchEvent(new CustomEvent('reditto:toast', { detail: { message: 'Consentimento registrado com sucesso.', type: 'success' } }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('reditto:toast', { detail: { message: `Erro ao registrar consentimento. Tente novamente.`, type: 'error' } }));
    }
  };

  if (loading) {
    return (
      <ClientWrapper showFloatingMenu={false}>
        <div className="flex justify-center items-center min-h-screen bg-background">
          <div className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-500 animate-spin"></div>
            <p className="text-white">Carregando...</p>
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

          {/* Main Content */}
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center p-6">
              {/* Esconde logo e slogan no mobile (onde existe o menu hambúrguer) */}
              <div className="hidden gap-3 items-center ml-4 md:flex header-item">
                <Image src="/assets/study.png" alt="Reditto Study Logo" width={36} height={36} className="w-9 h-9" />
                <span className="text-base font-medium header-text text-white/90">Reditto Study - Sua IA de Estudos!</span>
              </div>
              <div className="flex gap-3 items-center ml-auto">
                <button 
                  onClick={() => { window.location.href = '/historico'; }}
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
                  className="p-2 text-white rounded-full border transition-colors hover:text-yellow-400 border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 header-text" 
                  aria-label="Alternar tema"
                >
                  <Sun size={20} />
                </button>
                <button 
                  onClick={handleSignOut} 
                  className="flex gap-1 items-center text-sm text-white transition-colors header-text hover:text-red-300 px-3 py-1.5 rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                  </svg>
                  Sair
                </button>
              </div>
            </div>

            {/* Main Content */}
            <main className="px-6 pb-6 mx-auto max-w-6xl">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-4xl font-bold text-white">Escolha sua Matéria</h1>
                <p className="text-lg text-gray-300">
                  Selecione a área do conhecimento para tirar sua dúvida
                </p>
                {user && (
                  <p className="mt-2 text-sm text-blue-400 welcome-message">
                    Olá, {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}! Escolha uma matéria para começar.
                  </p>
                )}
                {!isConfigured && (
                  <p className="mt-2 text-sm text-yellow-400">
                    ⚠️ Modo visitante: crie uma conta para poder ter acesso ao seu histórico de dúvidas
                  </p>
                )}
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleSubjectSelect(subject.id)}
                    className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl ${subject.gradient} hover:shadow-xl`}
                  >
                    <div className="relative z-10">
                      <div className="mb-4 text-white">
                        {subject.icon}
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-white">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-white/80">
                        {subject.description}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                ))}
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-12">
                <div className="text-center card">
                  <Brain size={48} className="mx-auto mb-4 text-blue-400" />
                  <h3 className="mb-2 font-semibold text-white">IA Inteligente</h3>
                  <p className="text-sm text-gray-300">
                    Respostas personalizadas para suas dúvidas
                  </p>
                </div>
                
                <div className="text-center card">
                  <Zap size={48} className="mx-auto mb-4 text-blue-400" />
                  <h3 className="mb-2 font-semibold text-white">Resposta Rápida</h3>
                  <p className="text-sm text-gray-300">
                    Tire suas dúvidas em segundos com nossa IA
                  </p>
                </div>
                
                <div className="text-center card">
                  <BookOpen size={48} className="mx-auto mb-4 text-blue-400" />
                  <h3 className="mb-2 font-semibold text-white">Todas as Matérias</h3>
                  <p className="text-sm text-gray-300">
                    Suporte para todas as áreas do conhecimento
                  </p>
                </div>
              </div>
            </main>
            <Disclaimer />
            <TermsConsentModal
              isOpen={showConsent && !isSigningOut}
              onProceed={handleConsentProceed}
            />
              {/* Informational popup (white) shown on Materias page */}
              {showPopup && (
                <div id="reditto-popup" className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
                  <div className="absolute inset-0 bg-black/20" onClick={() => setShowPopup(false)} />
                  <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-lg pointer-events-auto z-10">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <h3 className="text-lg font-semibold text-gray-900">Aviso!</h3>
                      <img src="/pop-up.png" alt="Aviso" className="w-24 h-24 object-contain mx-auto" />
                      <p className="text-sm text-gray-800 leading-relaxed">
                        A Reditto Study usa inteligência artificial para responder suas dúvidas, mas nem sempre acerta tudo. 🧠💬
                        <br />
                        As respostas podem conter erros, então é sempre bom conferir as informações e, se possível, confirmar com um professor ou outra fonte confiável. 😉
                      </p>
                      <div className="mt-2">
                        <button onClick={() => setShowPopup(false)} className="px-4 py-2 rounded-full bg-blue-600 text-white">Fechar</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
}
