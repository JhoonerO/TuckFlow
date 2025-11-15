'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { 
  Package,
  TrendingUp,
  TrendingDown,
  Edit3,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface HistorialStock {
  id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo: string | null
  created_at: string
  productos: {
    nombre: string
  }
}

export default function HistorialStockPage() {
  const router = useRouter()
  const [historial, setHistorial] = useState<HistorialStock[]>([])
  const [historialFiltrado, setHistorialFiltrado] = useState<HistorialStock[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'salida' | 'ajuste'>('todos')
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  useEffect(() => {
    cargarHistorial()
  }, [])

  useEffect(() => {
    aplicarFiltros()
    setPaginaActual(1) // Reset a página 1 cuando cambian filtros
  }, [historial, busqueda, filtroTipo])

  const cargarHistorial = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('historial_stock')
        .select(`
          *,
          productos (nombre)
        `)
        .eq('usuario_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHistorial(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let resultado = [...historial]

    if (busqueda.trim()) {
      resultado = resultado.filter(h => 
        h.productos.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (h.motivo && h.motivo.toLowerCase().includes(busqueda.toLowerCase()))
      )
    }

    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(h => h.tipo === filtroTipo)
    }

    setHistorialFiltrado(resultado)
  }

  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return {
          icon: TrendingUp,
          color: 'text-green-400',
          bg: 'bg-green-500/20',
          label: 'Entrada'
        }
      case 'salida':
        return {
          icon: TrendingDown,
          color: 'text-red-400',
          bg: 'bg-red-500/20',
          label: 'Salida'
        }
      case 'ajuste':
        return {
          icon: Edit3,
          color: 'text-blue-400',
          bg: 'bg-blue-500/20',
          label: 'Ajuste'
        }
      default:
        return {
          icon: Package,
          color: 'text-zinc-400',
          bg: 'bg-zinc-500/20',
          label: tipo
        }
    }
  }

  // Cálculos de paginación
  const totalPaginas = Math.ceil(historialFiltrado.length / itemsPorPagina)
  const indiceInicio = (paginaActual - 1) * itemsPorPagina
  const indiceFin = indiceInicio + itemsPorPagina
  const itemsActuales = historialFiltrado.slice(indiceInicio, indiceFin)

  const cambiarPagina = (numeroPagina: number) => {
    setPaginaActual(numeroPagina)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 font-light">Cargando historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 px-4 py-6 sm:p-8 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-white/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-6 sm:mb-8 mt-10 md:mt-0">
          <h1 className="text-2xl sm:text-3xl font-light text-white mb-1 sm:mb-2">Historial de Stock</h1>
          <p className="text-sm sm:text-base text-zinc-400 font-light">Registro de movimientos de inventario</p>
        </div>

        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="text"
              placeholder="Buscar por producto o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
            />
          </div>

          {/* Filtros por tipo */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filtroTipo === 'todos'
                  ? 'bg-white text-zinc-900'
                  : 'bg-white/10 text-zinc-300 hover:bg-white/20'
              }`}
            >
              Todos ({historial.length})
            </button>
            <button
              onClick={() => setFiltroTipo('entrada')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filtroTipo === 'entrada'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              Entradas ({historial.filter(h => h.tipo === 'entrada').length})
            </button>
            <button
              onClick={() => setFiltroTipo('salida')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filtroTipo === 'salida'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              Salidas ({historial.filter(h => h.tipo === 'salida').length})
            </button>
            <button
              onClick={() => setFiltroTipo('ajuste')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filtroTipo === 'ajuste'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              }`}
            >
              Ajustes ({historial.filter(h => h.tipo === 'ajuste').length})
            </button>
          </div>
        </div>

        {/* Resultados y paginación info */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-zinc-400">
          <div>
            Mostrando <span className="font-semibold text-white">{indiceInicio + 1}</span> a{' '}
            <span className="font-semibold text-white">{Math.min(indiceFin, historialFiltrado.length)}</span> de{' '}
            <span className="font-semibold text-white">{historialFiltrado.length}</span> movimientos
          </div>
          {totalPaginas > 1 && (
            <div className="text-zinc-400">
              Página <span className="font-semibold text-white">{paginaActual}</span> de{' '}
              <span className="font-semibold text-white">{totalPaginas}</span>
            </div>
          )}
        </div>

        {/* Lista de historial */}
        {itemsActuales.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              No hay movimientos
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 font-light">
              {historial.length === 0 
                ? 'Aún no hay movimientos de stock registrados' 
                : 'No se encontraron movimientos con los filtros actuales'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 divide-y divide-white/10 mb-6">
              {itemsActuales.map((item) => {
                const config = getTipoConfig(item.tipo)
                const Icon = config.icon

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                              {item.productos.nombre}
                            </h3>
                            <p className={`text-xs sm:text-sm font-medium ${config.color}`}>
                              {config.label}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <p className="text-xs sm:text-sm text-zinc-400">
                              {new Date(item.created_at).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Cantidad:</span>
                            <span className={`font-bold ${
                              item.tipo === 'entrada' ? 'text-green-400' : 
                              item.tipo === 'salida' ? 'text-red-400' : 
                              'text-blue-400'
                            }`}>
                              {item.tipo === 'entrada' ? '+' : item.tipo === 'salida' ? '-' : ''}
                              {item.cantidad}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Stock:</span>
                            <span className="font-medium text-white">
                              {item.stock_anterior} → {item.stock_nuevo}
                            </span>
                          </div>
                        </div>

                        {item.motivo && (
                          <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-xs sm:text-sm text-zinc-400">
                              <span className="font-medium text-zinc-300">Motivo:</span> {item.motivo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>

                <div className="flex gap-1 sm:gap-2">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let numeroPagina
                    if (totalPaginas <= 5) {
                      numeroPagina = i + 1
                    } else if (paginaActual <= 3) {
                      numeroPagina = i + 1
                    } else if (paginaActual >= totalPaginas - 2) {
                      numeroPagina = totalPaginas - 4 + i
                    } else {
                      numeroPagina = paginaActual - 2 + i
                    }

                    return (
                      <Button
                        key={numeroPagina}
                        onClick={() => cambiarPagina(numeroPagina)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 p-0 ${
                          paginaActual === numeroPagina
                            ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {numeroPagina}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline mr-1">Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
