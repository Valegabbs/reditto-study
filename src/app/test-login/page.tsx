'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestLoginPage() {
  const { signUp, signIn, loading, isConfigured, user, session } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCreateAccount = async () => {
    setIsTesting(true);
    addResult('🔄 Testando criação de conta...');
    
    try {
      const result = await signUp('rasob16787@dextrago.com', '123456', 'Teste Usuario');
      
      if (result.error) {
        addResult(`❌ Erro: ${result.error.message}`);
      } else {
        addResult('✅ Conta criada com sucesso!');
      }
    } catch (error) {
      addResult(`❌ Erro inesperado: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testLogin = async () => {
    setIsTesting(true);
    addResult('🔄 Testando login...');
    
    try {
      const result = await signIn('rasob16787@dextrago.com', '123456');
      
      if (result.error) {
        addResult(`❌ Erro: ${result.error.message}`);
      } else {
        addResult('✅ Login realizado com sucesso!');
      }
    } catch (error) {
      addResult(`❌ Erro inesperado: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-end mb-4">
          <button 
            onClick={() => { window.location.href = '/envio'; }}
            className="text-white hover:text-blue-300 transition-colors flex items-center justify-center rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 p-2"
            aria-label="Ir para envio"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
        <h1 className="text-3xl font-bold text-white mb-8">Teste de Login</h1>
        
        {/* Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Supabase:</span>
              <span className={isConfigured ? 'text-green-400' : 'text-red-400'}>
                {isConfigured ? '✅ Configurado' : '❌ Não configurado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Carregando:</span>
              <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
                {loading ? '⏳ Sim' : '✅ Não'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Usuário:</span>
              <span className={user ? 'text-green-400' : 'text-gray-400'}>
                {user ? `✅ ${user.email}` : '❌ Não logado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Sessão:</span>
              <span className={session ? 'text-green-400' : 'text-gray-400'}>
                {session ? '✅ Ativa' : '❌ Inativa'}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Teste */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Testes</h2>
          <div className="flex gap-4">
            <button
              onClick={testCreateAccount}
              disabled={isTesting || !isConfigured}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isTesting ? 'Testando...' : 'Criar Conta'}
            </button>
            <button
              onClick={testLogin}
              disabled={isTesting || !isConfigured}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isTesting ? 'Testando...' : 'Fazer Login'}
            </button>
            <button
              onClick={clearResults}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Resultados</h2>
          <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-400">Nenhum teste executado.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm text-gray-300 mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
