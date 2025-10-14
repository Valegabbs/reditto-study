"use client";

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

interface FrameLoadingOverlayProps {
  /** Controla a exibição do overlay */
  visible: boolean;
  /** Intervalo entre frames em ms (quanto menor, mais rápido) */
  frameIntervalMs?: number;
  /** Chamado ao clicar para cancelar (opcional) */
  onCancel?: () => void;
}

/**
 * Overlay de tela cheia que exibe uma animação usando frames estáticos
 * `public/loading-frames/RedittoFrame1.png` ... `RedittoFrame6.png`.
 */
export default function FrameLoadingOverlay({
  visible,
  frameIntervalMs = 80,
  onCancel,
}: FrameLoadingOverlayProps) {
  const frames = useMemo(
    () => [
      '/loading-frames/RedittoFrame1.png',
      '/loading-frames/RedittoFrame2.png',
      '/loading-frames/RedittoFrame3.png',
      '/loading-frames/RedittoFrame4.png',
      '/loading-frames/RedittoFrame5.png',
      '/loading-frames/RedittoFrame6.png',
    ],
    []
  );

  const [frameIndex, setFrameIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pré-carregar imagens para evitar flicker
  useEffect(() => {
    frames.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [frames]);

  useEffect(() => {
    if (!visible) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setFrameIndex(0);
      return;
    }

    timerRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, frameIntervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, frames.length, frameIntervalMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        // Combinar com a cor de fundo atual via CSS var
        background: 'var(--background)',
      }}
      onClick={onCancel}
    >
      <div className="flex flex-col items-center select-none">
        <Image
          src={frames[frameIndex]}
          alt="Carregando análise da redação..."
          width={214}
          height={102}
          priority
          draggable={false}
        />
        <p className="mt-6 text-sm text-gray-300">Analisando sua redação...</p>
      </div>
    </div>
  );
}


