'use client';

import { useState, useEffect, Suspense } from 'react';
import { FileText, Image as ImageIcon, Send, Sun, ArrowLeft, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import FrameLoadingOverlay from '@/components/FrameLoadingOverlay';
import ClientWrapper from '../components/ClientWrapper';
import Disclaimer from '../components/Disclaimer';
import Sidebar from '../components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import TermsConsentModal from '../components/TermsConsentModal';
import { supabase } from '@/lib/supabase';

const subjects: { [key: string]: string } = {
  'matematica': 'Matemática',
  'portugues': 'Português',
  'fisica': 'Física',
  'quimica': 'Química',
  'biologia': 'Biologia',
  'historia': 'História',
  'geografia': 'Geografia',
  'filosofia': 'Filosofia',
  'sociologia': 'Sociologia',
  'artes': 'Artes',
  'musica': 'Música',
  'outros': 'Outros'
};

function DuvidaPageContent() {
  const { user, signOut, isConfigured, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [doubtText, setDoubtText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Capturar matéria da URL quando a página carrega
  useEffect(() => {
    const materiaFromUrl = searchParams.get('materia');
    if (materiaFromUrl && subjects[materiaFromUrl]) {
      setSelectedSubject(materiaFromUrl);
    }
  }, [searchParams]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho da imagem (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        window.dispatchEvent(new CustomEvent('reditto:toast', { 
          detail: { message: 'Imagem muito grande. Máximo 10MB.', type: 'error' } 
        }));
        return;
      }
      setSelectedImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bloquear envio se consentimento ainda não aceito
    if (!await ensureConsent()) {
      return;
    }

    // Validar texto obrigatório (mínimo 30 caracteres)
    if (doubtText.length < 30) {
      window.dispatchEvent(new CustomEvent('reditto:toast', { 
        detail: { message: 'O texto da dúvida deve ter pelo menos 30 caracteres.', type: 'error' } 
      }));
      return;
    }

    // Validar se não enviou apenas imagem sem texto
    if (selectedImage && doubtText.length < 30) {
      window.dispatchEvent(new CustomEvent('reditto:toast', { 
        detail: { message: 'É necessário preencher o campo de texto com sua dúvida (mínimo 30 caracteres).', type: 'error' } 
      }));
      return;
    }

    setIsLoading(true);

    try {
      const doubtFormData = new FormData();
      doubtFormData.append('subject', selectedSubject);
      doubtFormData.append('doubtText', doubtText);
      
      // Se tiver imagem, anexar
      if (selectedImage) {
        doubtFormData.append('image', selectedImage);
      }

      // Usando o novo endpoint para dúvidas
      const response = await fetch('/api/duvida', { 
        method: 'POST', 
        body: doubtFormData 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Estamos tendo problemas no servidor, tente mais tarde.' }));
        throw new Error(errorData.error || 'Estamos tendo problemas no servidor, tente mais tarde.');
      }
      
      const result = await response.json();
      setIsLoading(false);
      
      // Redirecionar para a página de resultados
      window.location.href = `/resultados?data=${encodeURIComponent(JSON.stringify(result))}`;
    } catch (error) {
      console.error('❌ Erro ao enviar dúvida:', error);
      window.dispatchEvent(new CustomEvent('reditto:toast', { 
        detail: { message: `Erro ao enviar dúvida: ${error instanceof Error ? error.message : 'Tente novamente.'}`, type: 'error' } 
      }));
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setShowConsent(false);
    await signOut();
    window.location.href = '/';
  };

  // Carregar/checar consentimento
  useEffect(() => {
    const check = async () => {
      if (isSigningOut) { setShowConsent(false); return; }
      if (loading) return;

      // Visitante: sempre exige consentimento
      if (!isConfigured || !user) {
        setHasAcceptedConsent(false);
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

  return (
    <ClientWrapper showFloatingMenu={false}>
      <FrameLoadingOverlay visible={isLoading} />
      <div className="min-h-screen bg-background bg-dot-grid">
        <div className="flex">
          <Sidebar />

          {/* Main Content */}
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center p-6">
              {/* Esconde logo e slogan no mobile (onde existe o menu hambúrguer) */}
              <div className="hidden gap-3 items-center ml-4 md:flex header-item">
                <Image src="/assets/logo.PNG" alt="Reditto Study Logo" width={36} height={36} className="w-9 h-9" />
                <span className="text-base font-medium header-text text-white/90">Reditto Study - Sua IA de Estudos!</span>
              </div>
              <div className="flex gap-3 items-center ml-auto">
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
            <main className="px-6 pb-6 mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-4xl font-bold text-white">Tire sua Dúvida</h1>
                <p className="text-lg text-gray-300">
                  {selectedSubject ? `Matéria: ${subjects[selectedSubject]}` : 'Descreva sua dúvida em detalhes'}
                </p>
                {user && (
                  <p className="mt-2 text-sm text-blue-400 welcome-message">
                    Olá, {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}! Descreva sua dúvida abaixo.
                  </p>
                )}
                {!isConfigured && (
                  <p className="mt-2 text-sm text-yellow-400">
                    ⚠️ Modo visitante: crie uma conta para poder ter acesso ao seu histórico de dúvidas
                  </p>
                )}
              </div>

              {/* Doubt Form */}
              <div className="mb-8">
                <div className="p-8 rounded-3xl main-form">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Text Input - Obrigatório */}
                    <div>
                      <label className="block mb-2 font-medium text-white">
                        Sua dúvida <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={doubtText}
                        onChange={(e) => setDoubtText(e.target.value)}
                        placeholder="Descreva sua dúvida em detalhes... (mínimo 30 caracteres)"
                        rows={8}
                        maxLength={2000}
                        minLength={30}
                        className="w-full resize-none input-field"
                        required
                      />
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-red-400">
                          Mínimo 30 caracteres • Máximo 2.000 caracteres
                        </span>
                        <span className="text-gray-400">
                          {doubtText.length}/2000
                        </span>
                      </div>
                    </div>

                    {/* Image Upload - Opcional */}
                    <div>
                      <label className="block mb-2 font-medium text-white">
                        Imagem (opcional)
                      </label>
                      <div className="p-8 text-center rounded-2xl border-2 border-dashed backdrop-blur-sm border-gray-600/50 bg-gray-800/10">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <ImageIcon size={48} className="mx-auto mb-4 text-gray-400" />
                          <p className="mb-2 text-gray-300">
                            Clique para adicionar uma imagem
                          </p>
                          <p className="text-sm text-gray-400">
                            PNG, JPG ou JPEG até 10MB
                          </p>
                        </label>
                      </div>
                      {selectedImage && (
                        <div className="p-3 mt-4 rounded-2xl border backdrop-blur-sm bg-gray-700/30 border-gray-700/50">
                          <p className="text-sm text-white">
                            Arquivo selecionado: {selectedImage.name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4">
                      <button
                        type="submit"
                        disabled={isLoading || doubtText.length < 30}
                        className="flex gap-3 justify-center items-center px-12 py-4 font-semibold shadow-lg transform btn-primary hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                      >
                        <Send size={20} />
                        {isLoading ? 'Enviando...' : 'Enviar Dúvida'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center card">
                  <FileText size={48} className="mx-auto mb-4 text-blue-400" />
                  <h3 className="mb-2 font-semibold text-white">Texto Obrigatório</h3>
                  <p className="text-sm text-gray-300">
                    Descreva sua dúvida em texto para obter a melhor resposta
                  </p>
                </div>
                
                <div className="text-center card">
                  <ImageIcon size={48} className="mx-auto mb-4 text-blue-400" />
                  <h3 className="mb-2 font-semibold text-white">Imagem Opcional</h3>
                  <p className="text-sm text-gray-300">
                    Adicione uma imagem para ilustrar sua dúvida
                  </p>
                </div>
                
                <div className="text-center card">
                  <Send size={48} className="mx-auto mb-4 text-blue-400" />
                  <h3 className="mb-2 font-semibold text-white">Resposta Rápida</h3>
                  <p className="text-sm text-gray-300">
                    Receba uma resposta personalizada da IA
                  </p>
                </div>
              </div>
            </main>
            <Disclaimer />
            <TermsConsentModal
              isOpen={showConsent && !isSigningOut}
              onProceed={handleConsentProceed}
            />
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
}

export default function DuvidaPage() {
  return (
    <Suspense fallback={
      <ClientWrapper showFloatingMenu={false}>
        <div className="min-h-screen bg-background bg-dot-grid">
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-500 animate-spin"></div>
              <p className="text-white">Carregando...</p>
            </div>
          </div>
        </div>
      </ClientWrapper>
    }>
      <DuvidaPageContent />
    </Suspense>
  );
}
