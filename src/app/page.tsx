	'use client';

import { useState, useEffect } from 'react';
import { Sun, Users, Mail, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import ClientWrapper from './components/ClientWrapper';
import Disclaimer from './components/Disclaimer';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { signUp, signIn, loading, isConfigured, user, session } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ type, message });
    try {
      window.clearTimeout((window as any).__reditto_toast_timer);
    } catch {}
    (window as any).__reditto_toast_timer = window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    try {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setIsDarkMode(current === 'dark');
    } catch {}
  }, []);

  const handleThemeToggle = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('reditto-theme', next); } catch {}
    setIsDarkMode(next === 'dark');
  };

  const handleCreateAccount = () => {
    setShowLogin(true);
    setIsLogin(false);
  };

  const handleEmailLogin = () => {
    setShowLogin(true);
    setIsLogin(true);
  };

  const handleGuestAccess = () => {
    // Redirecionar para a página de histórico como visitante
    window.location.href = '/historico';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password, formData.name);
      }

      if (result.error) {
        showToast(`Erro: ${result.error.message || 'Tente novamente.'}`, 'error');
        setIsSubmitting(false);
        return;
      }

      // Redirecionar imediatamente; sessão será mantida pelo AuthContext
      window.location.href = '/historico';
      
    } catch (error) {
      console.error('Erro no formulário:', error);
      showToast('Erro inesperado. Tente novamente.', 'error');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBackToHome = () => {
    setShowLogin(false);
    setIsLogin(false);
    setFormData({ email: '', password: '', name: '' });
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
      <div className="overflow-hidden relative min-h-screen bg-background bg-dot-grid">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm ${
              toast.type === 'error' ? 'bg-red-900/30 border-red-500/40 text-red-200' : toast.type === 'success' ? 'bg-green-900/30 border-green-500/40 text-green-200' : 'bg-yellow-900/30 border-yellow-500/40 text-yellow-200'
            }`}>
              <div className="flex gap-3 items-start">
                <span className="font-medium">{toast.type === 'error' ? 'Aviso' : toast.type === 'success' ? 'Sucesso' : 'Informação'}</span>
                <button onClick={() => setToast(null)} className="ml-auto text-white/70 hover:text-white">✕</button>
              </div>
              <div className="mt-1 text-sm">{toast.message}</div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center p-6 mx-auto max-w-6xl">
          {/* Esconde logo e slogan no mobile (onde existe o menu hambúrguer) */}
          <div className="hidden gap-2 items-center px-4 py-2 rounded-full border backdrop-blur-sm md:flex header-item bg-gray-800/20 border-gray-700/50">
            <Image src="/assets/logo.PNG" alt="Reditto Logo" width={20} height={20} className="w-5 h-5" />
            <span className="text-sm font-medium header-text text-white/90">Correção de Redação para Todos!</span>
          </div>
          <div className="flex gap-3 items-center ml-auto">
            <button 
              onClick={handleThemeToggle} 
              className="p-2 text-white rounded-full border transition-colors hover:text-yellow-400 border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 header-text" 
              aria-label="Alternar tema"
            >
              <Sun size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-6 py-12 mx-auto max-w-md">
          <div className="mb-8 text-center">
            <Image src="/assets/logo.PNG" alt="Reditto Logo" width={80} height={80} className="mx-auto mb-4" />
            <h1 className="mb-2 text-3xl font-bold text-white">Bem-vindo ao Reditto Study</h1>
            <p className="text-gray-300">
              Sua plataforma inteligente para tirar dúvidas e estudar
            </p>
            
            {!isConfigured && (
              <div className="p-4 mt-4 rounded-lg border bg-red-900/20 border-red-600/30">
                <p className="text-sm text-red-400">
                  ❌ <strong>Erro de Configuração:</strong> Sistema de autenticação não está funcionando. Entre em contato com o suporte.
                </p>
              </div>
            )}
          </div>

          {!showLogin ? (
            <>
              {/* Botões de Conta */}
              <div className="mb-6 space-y-3">
                <button
                  onClick={handleCreateAccount}
                  disabled={!isConfigured}
                  className={`w-full btn-secondary ${!isConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Users size={20} />
                  Criar conta
                </button>
                <button
                  onClick={handleEmailLogin}
                  disabled={!isConfigured}
                  className={`w-full btn-secondary ${!isConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Mail size={20} />
                  Entrar com Email
                </button>
              </div>

              {/* Seção de Visitante */}
              <div className="p-4 rounded-2xl main-form">
                <h3 className="mb-1 font-medium text-center text-white">Testar sem cadastro</h3>
                <p className="mb-3 text-sm text-center text-gray-300">
                  Experimente todas as funcionalidades
                </p>
                <p className="mb-3 text-xs text-center text-yellow-400">
                  ⚠️ Modo visitante: crie uma conta para poder ter acesso ao seu histórico de redações e evoluções
                </p>
                <button
                  onClick={handleGuestAccess}
                  className="justify-center w-full btn-secondary"
                >
                  <User size={20} />
                  Entrar como visitante
                </button>
              </div>
            </>
          ) : (
            /* Formulário de Login/Registro */
            <div className="p-6 rounded-2xl main-form">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={handleBackToHome}
                  className="text-white hover:text-blue-300 transition-colors flex items-center justify-center rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 p-2"
                  aria-label="Voltar"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="text-center flex-1">
                  <h2 className="mb-2 text-2xl font-bold text-white">
                    {isLogin ? 'Entrar' : 'Criar Conta'}
                  </h2>
                  <p className="text-sm text-gray-300">
                    {isLogin ? 'Acesse sua conta' : 'Crie sua conta gratuita'}
                  </p>
                </div>
                <div className="w-10"></div> {/* Espaçador para centralizar o título */}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block mb-2 font-medium text-white">
                      Seu Nome
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Seu nome"
                      className="w-full input-field"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-2 font-medium text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="seu@email.com"
                    className="w-full input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-white">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Sua senha"
                      className="pr-10 w-full input-field"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 text-gray-400 transform -translate-y-1/2 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex gap-2 justify-center items-center py-3 w-full font-semibold btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-b-2 border-white animate-spin"></div>
                      {isLogin ? 'Entrando...' : 'Criando conta...'}
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      {isLogin ? 'Entrar' : 'Criar Conta'}
                    </>
                  )}
                </button>
              </form>

              
            </div>
          )}
        </main>
        <Disclaimer />
      </div>
    </ClientWrapper>
  );
}