'use client';

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, History, TrendingUp, ChevronLeft, ChevronRight, MessageCircle, BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  const isActive = (href: string) => {
    if (href === '/materias') return pathname?.startsWith('/materias') || pathname?.startsWith('/duvida')
    return pathname === href
  }

  const Button = ({
    href,
    icon,
    label,
    title,
  }: {
    href: string
    icon: React.ReactNode
    label: string
    title: string
  }) => (
    <button
      type="button"
      onClick={() => handleNavigate(href)}
      className={`w-full flex items-center gap-2 py-3 px-4 rounded-xl transition-all font-medium backdrop-blur-sm text-sm ${
        isActive(href) ? 'sidebar-button-active' : 'sidebar-button-inactive'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? title : ''}
      aria-current={isActive(href) ? 'page' : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  )

  const { user } = useAuth()
  const [showVisitorNotice, setShowVisitorNotice] = React.useState(false)
  const [requestedHref, setRequestedHref] = React.useState<string | null>(null)

  const restricted = (href: string) => ['/historico'].includes(href)

  function handleNavigate(href: string) {
    if (!user && restricted(href)) {
      setRequestedHref(href)
      setShowVisitorNotice(true)
      return
    }
  // navigate normally
    router.push(href)
  }

  return (
    <>
      {/* Desktop collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex fixed left-3 top-6 z-50 p-2 rounded-lg backdrop-blur-sm transition-colors sidebar-toggle-button"
        aria-label={collapsed ? 'Expandir sidebar' : 'Contrair sidebar'}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed left-6 top-6 z-50 p-2 rounded-full transition-transform active:scale-95 header-text"
        aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isMobileOpen}
      >
        {/* Animated hamburger (morphs to X) */}
        <div
          className={`w-5 h-0.5 hamburger-bars rounded-full mb-1 transition-transform duration-200 ease-out ${
            isMobileOpen ? 'translate-y-1.5 rotate-45' : ''
          }`}
        />
        <div
          className={`w-5 h-0.5 hamburger-bars rounded-full mb-1 transition-all duration-200 ease-out ${
            isMobileOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
          }`}
          style={{ transformOrigin: 'center' }}
        />
        <div
          className={`w-5 h-0.5 hamburger-bars rounded-full transition-transform duration-200 ease-out ${
            isMobileOpen ? '-translate-y-1.5 -rotate-45' : ''
          }`}
        />
      </button>

      {/* Desktop sidebar */}
  <aside className={`sidebar-container hidden md:block sticky top-0 h-screen border-r backdrop-blur-sm border-gray-700/50 bg-gray-800/10 transition-all duration-300 ${
        collapsed ? 'p-2 w-16' : 'p-6 w-72'
      }`}>
        <div className={`flex flex-col gap-4 mt-16 ${collapsed ? 'items-center' : 'items-center'}`}>
          <div className="space-y-3 w-full">
            <Button
              href="/materias"
              icon={<Home size={18} />}
              label="Início"
              title="Início"
            />
            <Button
              href="/historico"
              icon={<History size={18} />}
              label="Histórico"
              title="Histórico"
            />
            {/* Removed Evolução, Temas and Whatsapp for Reditto Study */}
            {/* Favoritas removida */}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="sidebar-drawer absolute left-0 top-0 bottom-0 w-72 p-6 border-r backdrop-blur-sm border-gray-700/50 bg-gray-900/90">
            <div className="space-y-3 w-full mt-12">
              <Button href="/materias" icon={<Home size={18} />} label="Início" title="Início" />
              <Button href="/historico" icon={<History size={18} />} label="Histórico" title="Histórico" />
            </div>
          </div>
        </div>
      )}

      {showVisitorNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60">
          <div className="max-w-md w-full mx-4 p-6 rounded-2xl border border-blue-400/50 bg-gradient-to-br from-blue-800/95 via-blue-900/95 to-black/80 text-white shadow-[0_10px_40px_rgba(59,130,246,0.3)] backdrop-blur-md">
            <h2 className="text-xl font-semibold text-blue-200 mb-2">Recurso exclusivo para usuários logados</h2>
            <p className="text-blue-100/90 mb-4">
              A seção Histórico fica disponível após login. Crie uma conta ou faça login para acessar seu histórico.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowVisitorNotice(false)}
                className="px-4 py-2 rounded-lg border border-blue-400/60 text-blue-100 hover:bg-blue-900/40"
              >
                Fechar
              </button>
              <button
                onClick={() => { setShowVisitorNotice(false); router.push('/') }}
                className="px-4 py-2 rounded-lg btn-primary"
              >
                Ir para Início
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


