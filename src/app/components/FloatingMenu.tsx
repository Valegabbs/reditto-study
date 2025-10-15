'use client';

import Image from 'next/image';
import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function FloatingMenu({ onLogout }: { onLogout?: () => void }) {
  const [theme, setTheme] = React.useState<string>('dark');

  React.useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    setTheme(nextTheme);
    
    // Salvar tema no localStorage
    try {
      localStorage.setItem('reditto-theme', nextTheme);
    } catch (error) {
      // Ignorar erro se localStorage não estiver disponível
    }
  };

  return (
    <div className="floating-menu" aria-label="Menu flutuante">
      <div className="flex items-center gap-2">
            <Image src="/assets/logo.PNG?v=3" alt="Reditto Logo" width={28} height={28} />
        <span className="font-semibold">Correção de Redação para Todos!</span>
      </div>
      <button 
        onClick={toggleTheme} 
        className="p-2 rounded-full transition-colors border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60"
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? <Sun size={16} className="text-blue-300" /> : <Moon size={16} className="text-blue-600" />}
      </button>
      {onLogout && (
        <button 
          onClick={onLogout} 
          className="text-white/90 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60"
        >
          Sair
        </button>
      )}
    </div>
  );
}


