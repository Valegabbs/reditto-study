'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DirectSupabaseTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectSignUp = async () => {
    setIsTesting(true);
    addResult('🔄 Testando criação de conta diretamente...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'teste.direto@exemplo.com',
        password: '123456',
        options: {
          data: {
            name: 'Teste Direto'
          }
        }
      });

      if (error) {
        addResult(`❌ Erro na criação: ${error.message}`);
      } else {
        addResult('✅ Conta criada com sucesso!');
        addResult(`👤 Usuário: ${data.user?.email}`);
        addResult(`📧 Confirmado: ${data.user?.email_confirmed_at ? 'Sim' : 'Não'}`);
      }
    } catch (error) {
      addResult(`❌ Erro inesperado: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testDirectSignIn = async () => {
    setIsTesting(true);
    addResult('🔄 Testando login diretamente...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'rasob16787@dextrago.com',
        password: '123456'
      });

      if (error) {
        addResult(`❌ Erro no login: ${error.message}`);
      } else {
        addResult('✅ Login realizado com sucesso!');
        addResult(`👤 Usuário: ${data.user?.email}`);
        addResult(`🔐 Sessão: ${data.session ? 'Criada' : 'Não criada'}`);
      }
    } catch (error) {
      addResult(`❌ Erro inesperado: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testGetSession = async () => {
    setIsTesting(true);
    addResult('🔄 Testando obtenção de sessão...');
    
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        addResult(`❌ Erro na sessão: ${error.message}`);
      } else {
        addResult(`🔐 Sessão atual: ${data.session ? 'Ativa' : 'Inativa'}`);
        if (data.session) {
          addResult(`👤 Usuário: ${data.session.user.email}`);
        }
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
        <h1 className="text-3xl font-bold text-white mb-8">Teste Direto do Supabase</h1>
        
        {/* Botões de Teste */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Testes Diretos</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={testDirectSignUp}
              disabled={isTesting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isTesting ? 'Testando...' : 'Testar Criação Direta'}
            </button>
            <button
              onClick={testDirectSignIn}
              disabled={isTesting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isTesting ? 'Testando...' : 'Testar Login Direto'}
            </button>
            <button
              onClick={testGetSession}
              disabled={isTesting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isTesting ? 'Testando...' : 'Testar Sessão'}
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
