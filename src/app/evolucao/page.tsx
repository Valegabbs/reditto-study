'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import { Sun, ArrowLeft } from 'lucide-react';
import ClientWrapper from '../components/ClientWrapper';
import Sidebar from '../components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Usaremos uma implementação simples de gráfico usando SVG para evitar
// adicionar dependências externas. Abaixo renderizamos uma linha básica.

interface DataPoint { id?: string; label: string; value: number | null; }

function InteractiveLineChart({ data }: { data: DataPoint[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);
  // Responsividade: ajusta largura e altura do gráfico conforme tamanho da tela
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const width = isMobile ? 340 : 760;
  const height = isMobile ? 180 : 300;
  const padding = 48;

  const values = data.map(d => (d.value ?? 0));
  const maxVal = Math.max(...values, 1000);
  const minVal = 0;

  // Y ticks fixed as requested
  const yTicks = [200, 400, 600, 800, 1000];

  const xCount = Math.max(1, data.length);
  const xPositions = data.map((_, i) => padding + (i * (width - padding * 2)) / Math.max(1, xCount - 1));

  const points = data.map((d, i) => {
    const x = xPositions[i];
    const y = height - padding - ((d.value ?? 0) - minVal) / Math.max(1, (maxVal - minVal)) * (height - padding * 2);
    return { x, y };
  });

  const handleMove = (evt: React.MouseEvent) => {
    if (!svgRef.current) return;
    // Travado em um ponto? Não recalcular o índice
    if (lockedIndex !== null) {
      setHoverIndex(lockedIndex);
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    // Converter coordenada do mouse (px) para o sistema do viewBox
    const scaleX = width / Math.max(1, rect.width);
    const mx = (evt.clientX - rect.left) * scaleX;
    // find nearest x
    let nearest = 0;
    let nearestDist = Infinity;
    xPositions.forEach((x, i) => {
      const d = Math.abs(x - mx);
      if (d < nearestDist) { nearestDist = d; nearest = i; }
    });
    setHoverIndex(nearest);
  };

  const handleLeave = () => { setHoverIndex(null); setLockedIndex(null); setTooltipPos(null); };

  // abbreviate x labels depending on count
  const formatXLabel = (i: number) => {
    if (xCount > 20) return `${i + 1}`;
    if (xCount > 10) return `Red ${i + 1}`;
    return `Redação ${i + 1}`;
  };

  return (
    <div ref={containerRef} className="overflow-x-auto relative w-full">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" onMouseMove={handleMove} onMouseLeave={handleLeave}>
        {/* grid lines and y axis labels */}
        {yTicks.map((t, idx) => {
          const y = height - padding - (t - minVal) / Math.max(1, (maxVal - minVal)) * (height - padding * 2);
          return (
            <g key={t}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(11,18,32,0.06)" strokeWidth={1} />
              <text x={padding - 10} y={y + 4} textAnchor="end" className="text-xs y-label">{t}</text>
            </g>
          );
        })}

        {/* x labels */}
        {xPositions.map((x, i) => (
          <text key={i} x={x} y={height - 8} textAnchor="middle" className="text-xs x-label" style={{ transformOrigin: `${x}px ${height - 8}px` }}>{formatXLabel(i)}</text>
        ))}

        {/* polyline */}
        <polyline
          fill="none"
          stroke="var(--reditto-blue)"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
        />

        {/* filled area subtle */}
        <polygon className="fill-area" points={`${padding},${height - padding} ${points.map(p => `${p.x},${p.y}`).join(' ')} ${width - padding},${height - padding}`} />

        {/* fixed points (always visible) */}
        {points.map((p, i) => (
          <g key={`pt-${i}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 6 : 4}
              fill={hoverIndex === i ? '#fff' : 'var(--reditto-blue)'}
              stroke={hoverIndex === i ? 'var(--reditto-blue)' : 'transparent'}
              strokeWidth={2}
              style={{ cursor: data[i]?.id ? 'pointer' : 'default' }}
              onClick={() => {
                if (data[i]?.id) {
                  // Redirect to resultados page using existing record id to avoid creating new DB entries
                  window.location.href = `/resultados?essayId=${encodeURIComponent(String(data[i].id))}`;
                }
              }}
              onMouseEnter={() => {
                setLockedIndex(i);
                setHoverIndex(i);
              }}
              onMouseLeave={() => {
                setLockedIndex(null);
              }}
            />
          </g>
        ))}
      </svg>

      {/* tooltip */}
      {hoverIndex !== null && points[hoverIndex] && svgRef.current && (
        (() => {
          const rect = svgRef.current!.getBoundingClientRect();
          const scaleX = rect.width / width;
          const scaleY = rect.height / height;
          const p = points[hoverIndex];
          const left = p.x * scaleX;
          const top = p.y * scaleY;
          return (
            <div className="absolute z-50 pointer-events-none" style={{ left, top, transform: 'translate(-50%, calc(-100% - 16px))' }}>
              <div className="px-3 py-2 text-sm text-white whitespace-nowrap bg-gray-900 rounded-lg border shadow-lg chart-tooltip border-black/20">
                <div className="font-semibold">{formatXLabel(hoverIndex)}</div>
                <div className="text-xs text-gray-200">{data[hoverIndex].value ?? '—'}</div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

export default function EvolucaoPage() {
  const { user, isConfigured, signOut } = useAuth();
  const [scores, setScores] = useState<Array<{ id: string; final_score: number | null; created_at: string; topic?: string | null }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user || !isConfigured) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.from('essays').select('id, final_score, created_at, topic').eq('user_id', user.id).order('created_at', { ascending: true });
        if (error) throw error;
        setScores((data || []) as any);
      } catch (err) {
        console.error('Erro ao carregar evolução:', err);
        setScores([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isConfigured]);

  const dataPoints = useMemo(() => scores.map((s, i) => ({ id: s.id, label: s.topic || `Red ${i + 1}`, value: s.final_score } as DataPoint)), [scores]);

  const stats = useMemo(() => {
    const valid = scores.map(s => s.final_score ?? 0);
    if (valid.length === 0) return { avg: null, min: null, max: null };
    const sum = valid.reduce((a, b) => a + b, 0);
    return { avg: Math.round(sum / valid.length), min: Math.min(...valid), max: Math.max(...valid) };
  }, [scores]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <ClientWrapper showFloatingMenu={false}>
      <div className="min-h-screen bg-background bg-dot-grid">
        <div className="flex">
          <Sidebar />
          <div className="w-full">
            <div className="px-6 py-8 mx-auto max-w-6xl">
              {/* Header (same as Envio) */}
              <div className="flex items-center p-6 mb-4">
                <div className="hidden gap-2 items-center px-4 py-2 rounded-full border backdrop-blur-sm md:flex header-item bg-gray-800/20 border-gray-700/50">
                  <Image src="/assets/logo.PNG" alt="Reditto Logo" width={20} height={20} className="w-5 h-5" />
                  <span className="text-sm font-medium header-text text-white/90">Correção de Redação para Todos!</span>
                </div>
                <div className="flex gap-3 items-center ml-auto">
                  <button 
                    onClick={() => { window.location.href = '/envio'; }}
                    className="flex justify-center items-center p-2 text-white rounded-full border transition-colors hover:text-blue-300 border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60"
                    aria-label="Ir para envio"
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
                </div>
                <button onClick={handleSignOut} className="ml-2 text-white hover:text-red-300 transition-colors px-3 py-1.5 rounded-full border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/60">
                  Sair
                </button>
              </div>

              <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">Evolução</h1>
                <p className="mt-2 text-gray-300">Acompanhe a sua evolução de notas ao longo das redações. Passe o mouse sobre os pontos para ver a redação e clique para abrir o histórico.</p>
              </div>

              <div className="p-6 rounded-2xl border backdrop-blur-sm border-gray-700/50 bg-gray-800/20">
                {loading ? (
                  <div className="text-gray-300">Carregando evolução...</div>
                ) : scores.length === 0 ? (
                  <div className="text-gray-300">Sem dados para exibir. Envie sua primeira redação!</div>
                ) : (
                  <div className="space-y-6">
                    <div className="overflow-hidden relative p-4 w-full rounded-xl evolution-chart">
                      <InteractiveLineChart data={dataPoints} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="p-4 bg-gradient-to-br rounded-lg panel-base from-blue-700/10 to-blue-700/5">
                        <div className="text-sm text-gray-400">Média</div>
                        <div className="text-2xl font-semibold text-white">{stats.avg ?? '—'}</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br rounded-lg panel-base from-red-600/8 to-red-600/4">
                        <div className="text-sm text-gray-400">Pior Nota</div>
                        <div className="text-2xl font-semibold text-white">{stats.min ?? '—'}</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br rounded-lg panel-base from-green-600/8 to-green-600/4">
                        <div className="text-sm text-gray-400">Melhor Nota</div>
                        <div className="text-2xl font-semibold text-white">{stats.max ?? '—'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
}


