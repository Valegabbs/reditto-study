'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestAuthPage() {
  const { signUp, signIn, loading, isConfigured, user, session } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSignUp = async () => {
    setIsTesting(true);
    addResult('🔄 Iniciando teste de criação de conta...');
    
    try {
      const result = await signUp('rasob16787@dextrago.com', '123456', 'Teste Usuario');
      
      if (result.error) {
        addResult(`❌ Erro na criação: ${result.error.message}`);
      } else {
        addResult('✅ Conta criada com sucesso!');
      }
    } catch (error) {
      addResult(`❌ Erro inesperado: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testSignIn = async () => {
    setIsTesting(true);
    addResult('🔄 Iniciando teste de login...');
    
    try {
      const result = await signIn('rasob16787@dextrago.com', '123456');
      
      if (result.error) {
        addResult(`❌ Erro no login: ${result.error.message}`);
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-end mb-4">
          <button 
            onClick={() => { window.location.href = '/envio'; }}
            className="text-white hover:text-blue-300 transition-colors flex items-center justify-center rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60 p-2"
            aria-label="Ir para envio"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
        <h1 className="text-3xl font-bold text-white mb-8">Teste de Autenticação</h1>
        
        {/* Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Status do Sistema</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-300">Supabase Configurado:</span>
              <span className={`ml-2 ${isConfigured ? 'text-green-400' : 'text-red-400'}`}>
                {isConfigured ? '✅ Sim' : '❌ Não'}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Carregando:</span>
              <span className={`ml-2 ${loading ? 'text-yellow-400' : 'text-green-400'}`}>
                {loading ? '⏳ Sim' : '✅ Não'}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Usuário Logado:</span>
              <span className={`ml-2 ${user ? 'text-green-400' : 'text-gray-400'}`}>
                {user ? `✅ ${user.email}` : '❌ Não'}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Sessão Ativa:</span>
              <span className={`ml-2 ${session ? 'text-green-400' : 'text-gray-400'}`}>
                {session ? '✅ Sim' : '❌ Não'}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Teste */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Testes</h2>
          <div className="flex gap-4">
            <button
              onClick={testSignUp}
              disabled={isTesting || !isConfigured}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? 'Testando...' : 'Testar Criação de Conta'}
            </button>
            <button
              onClick={testSignIn}
              disabled={isTesting || !isConfigured}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? 'Testando...' : 'Testar Login'}
            </button>
            <button
              onClick={clearResults}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Limpar Resultados
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Resultados dos Testes</h2>
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-400">Nenhum teste executado ainda.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm text-gray-300 mb-1 font-mono">
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
