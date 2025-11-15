'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex relative bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900">
      {/* Sidebar escritorio / tablet - FIJO */}
      <div className="hidden md:block w-64 lg:w-64 flex-shrink-0">
        <div className="fixed top-0 left-0 h-screen w-64 lg:w-64 overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {/* Botón menú móvil */}
      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 inline-flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 p-2 focus:outline-none focus:ring-2 focus:ring-white/40"
      >
        <Menu className="w-5 h-5" />
        <span className="sr-only">Abrir menú</span>
      </button>

      {/* Sidebar móvil como overlay */}
      <div
        className={`
          md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#050509]
          shadow-2xl overflow-y-auto
          transform transition-transform duration-200 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </div>

      {/* Backdrop móvil */}
      {isMobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Contenido principal - scrollable independiente */}
      <main className="flex-1 overflow-y-auto h-screen w-full">
        {children}
      </main>
    </div>
  )
}
