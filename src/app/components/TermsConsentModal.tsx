'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface TermsConsentModalProps {
  isOpen: boolean;
  onProceed: () => Promise<void> | void;
  onClose?: () => void; // opcional, caso precise cancelar
  termsUrl?: string;
  privacyUrl?: string;
}

export default function TermsConsentModal({
  isOpen,
  onProceed,
  onClose,
  termsUrl = '/politics/Termos de Uso do Reditto.md',
  privacyUrl = '/politics/Política de Privacidade do Reditto.md'
}: TermsConsentModalProps) {
  const [activeTab, setActiveTab] = React.useState<'terms' | 'privacy'>('terms');
  const [termsContent, setTermsContent] = React.useState<string>('');
  const [privacyContent, setPrivacyContent] = React.useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setFetching(true);
      setErrorMsg(null);
      try {
        const [tRes, pRes] = await Promise.all([
          fetch(encodeURI(termsUrl)),
          fetch(encodeURI(privacyUrl))
        ]);
        if (!tRes.ok || !pRes.ok) {
          throw new Error('Falha ao carregar documentos.');
        }
        const [tText, pText] = await Promise.all([tRes.text(), pRes.text()]);
        if (!cancelled) {
          setTermsContent(tText);
          setPrivacyContent(pText);
        }
      } catch (err) {
        if (!cancelled) setErrorMsg('Não foi possível carregar os documentos. Tente novamente mais tarde.');
      } finally {
        if (!cancelled) setFetching(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen, termsUrl, privacyUrl]);

  const canProceed = acceptedTerms && acceptedPrivacy && !loading && !fetching;

  const handleProceed = async () => {
    if (!canProceed) return;
    try {
      setLoading(true);
      await onProceed();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-w-3xl w-full mx-4 rounded-2xl panel-base border">
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="text-lg font-semibold text-white">Termos de Uso e Política de Privacidade</h2>
          {onClose && (
            <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
          )}
        </div>

        <div className="px-6 mt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'terms'
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/60'
              }`}
            >
              Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'privacy'
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/60'
              }`}
            >
              Política de Privacidade
            </button>
          </div>
        </div>

        <div className="px-6 mt-4">
          <div className="h-72 overflow-y-auto rounded-xl border border-gray-300 p-4" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            {fetching && (
              <div className="text-sm" style={{ color: '#000000' }}>Carregando...</div>
            )}
            {errorMsg && (
              <div className="text-sm" style={{ color: '#b91c1c' }}>{errorMsg}</div>
            )}
            {!fetching && !errorMsg && (
              <div className="prose max-w-none" style={{ color: '#000000' }}>
                {activeTab === 'terms' ? (
                  <ReactMarkdown>{termsContent}</ReactMarkdown>
                ) : (
                  <ReactMarkdown>{privacyContent}</ReactMarkdown>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 mt-5 space-y-3">
          <label className="flex items-start gap-3 text-sm terms-label">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5"
            />
            <span>Declaro que li e aceito os termos de uso do site.</span>
          </label>
          <label className="flex items-start gap-3 text-sm terms-label">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="mt-0.5"
            />
            <span>Declaro que li e aceito a política de privacidade.</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            disabled={!canProceed}
            onClick={handleProceed}
            className={`px-5 py-2 rounded-lg font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processando...' : 'Prosseguir'}
          </button>
        </div>
      </div>
    </div>
  );
}


