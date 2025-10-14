'use client';

import React from 'react';
import FloatingMenu from './FloatingMenu';

type Toast = { type: 'error' | 'success' | 'info'; message: string } | null;

export default function ClientWrapper({ 
  children, 
  showFloatingMenu = true 
}: { 
  children: React.ReactNode;
  showFloatingMenu?: boolean;
}) {
  const [toast, setToast] = React.useState<Toast>(null);
  const [confirmState, setConfirmState] = React.useState<{ message: string } | null>(null);

  React.useEffect(() => {
    // Carregar tema salvo do localStorage
    try {
      const savedTheme = localStorage.getItem('reditto-theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    } catch (error) {
      // Ignorar erro se localStorage não estiver disponível
    }

    // Global toast listener
    const toastHandler = (e: any) => {
      const d = e?.detail as Toast;
      if (d) {
        setToast(d);
        try { window.clearTimeout((window as any).__reditto_toast_timer); } catch {}
        (window as any).__reditto_toast_timer = window.setTimeout(() => setToast(null), 4500);
      }
    };

    // Global confirm opener
    const openConfirm = (e: any) => {
      const msg = e?.detail?.message || 'Confirmar?';
      setConfirmState({ message: msg });
    };

    window.addEventListener('reditto:toast', toastHandler as EventListener);
    window.addEventListener('reditto:openConfirm', openConfirm as EventListener);

    // helpers exposed to window
    (window as any).redittoAlert = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
      window.dispatchEvent(new CustomEvent('reditto:toast', { detail: { message, type } }));
    };

    (window as any).redittoConfirm = (message: string) => {
      return new Promise<boolean>((resolve) => {
        (window as any).__reditto_confirm_resolve = resolve;
        window.dispatchEvent(new CustomEvent('reditto:openConfirm', { detail: { message } }));
      });
    };

    return () => {
      window.removeEventListener('reditto:toast', toastHandler as EventListener);
      window.removeEventListener('reditto:openConfirm', openConfirm as EventListener);
      try { delete (window as any).redittoAlert; } catch {}
      try { delete (window as any).redittoConfirm; } catch {}
    };
  }, []);

  const handleLogout = () => {
    window.location.href = '/';
  };

  const handleConfirm = (ok: boolean) => {
    try { (window as any).__reditto_confirm_resolve?.(ok); } catch {}
    try { delete (window as any).__reditto_confirm_resolve; } catch {}
    setConfirmState(null);
  };

  return (
    <>
      {showFloatingMenu && <FloatingMenu onLogout={handleLogout} />}
      {children}

      {/* Global toast listener UI */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm ${
            toast.type === 'error' ? 'bg-red-900/30 border-red-500/40 text-red-200' : toast.type === 'success' ? 'bg-green-900/30 border-green-500/40 text-green-200' : 'bg-yellow-900/30 border-yellow-500/40 text-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              <span className="font-medium">{toast.type === 'error' ? 'Erro' : toast.type === 'success' ? 'Sucesso' : 'Aviso'}</span>
              <button onClick={() => setToast(null)} className="ml-auto text-white/70 hover:text-white">✕</button>
            </div>
            <div className="text-sm mt-1">{toast.message}</div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmState && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="max-w-md w-full p-6 rounded-2xl panel-base border">
            <div className="text-lg font-semibold text-white mb-3">Confirmação</div>
            <div className="text-sm text-gray-300 mb-6">{confirmState.message}</div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => handleConfirm(false)} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200">Cancelar</button>
              <button onClick={() => handleConfirm(true)} className="px-4 py-2 rounded-lg btn-primary">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
