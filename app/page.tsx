'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabase'
import Link from 'next/link'
import { Building2, BarChart3, Package, Users, TrendingUp } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900">
      {/* Header */}
      <header className="relative z-10 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg">
              <Building2 className="w-6 h-6 text-zinc-900" />
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">TuckFlow</span>
          </div>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-7xl font-light text-white mb-8 leading-tight tracking-tight">
            Gestión empresarial <br />
            <span className="font-normal">de clase mundial</span>
          </h1>
          <p className="text-xl lg:text-2xl text-zinc-400 mb-12 font-light leading-relaxed">
            Plataforma integral para administrar tu negocio con precisión, 
            eficiencia y resultados excepcionales.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registro"
              className="px-8 py-4 bg-white text-zinc-900 rounded-lg font-semibold hover:bg-zinc-100 transition-all hover:scale-105 shadow-lg"
            >
              Comenzar Gratis
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-transparent text-white rounded-lg font-semibold border-2 border-white/20 hover:border-white/40 transition-all"
            >
              Ver Demo
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Inventario</h3>
            <p className="text-zinc-400 text-sm font-light">
              Gestiona productos, stock y alertas en tiempo real
            </p>
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ventas</h3>
            <p className="text-zinc-400 text-sm font-light">
              Registra y analiza tus ventas con reportes detallados
            </p>
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Clientes</h3>
            <p className="text-zinc-400 text-sm font-light">
              Administra tu base de clientes y pagos pendientes
            </p>
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Reportes</h3>
            <p className="text-zinc-400 text-sm font-light">
              Visualiza métricas clave y toma mejores decisiones
            </p>
          </div>
        </div>
      </main>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
    </div>
  )
}
