'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { generarReciboPDF, imprimirRecibo } from '../../../lib/generar-recibo'
import { 
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  ChevronDown,
  Package,
  Printer,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Venta {
  id: string
  total: number
  created_at: string
  estado: string | null
  metodo_pago: string | null
  descuento: number
}

interface DetalleVenta {
  id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  productos: {
    nombre: string
  }
}

interface VentaConDetalles extends Venta {
  detalle_ventas: DetalleVenta[]
}

type FiltroFecha = 'todo' | 'hoy' | 'semana' | 'mes' | 'personalizado'

export default function ReportesPage() {
  const router = useRouter()
  const [ventas, setVentas] = useState<VentaConDetalles[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todo')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [ventaExpandida, setVentaExpandida] = useState<string | null>(null)
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  useEffect(() => {
    cargarVentas()
    obtenerNombreNegocio()
  }, [filtroFecha, fechaInicio, fechaFin])

  useEffect(() => {
    setPaginaActual(1) // Reset a página 1 cuando cambian ventas
  }, [ventas])

  const obtenerNombreNegocio = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('perfiles')
        .select('nombre_negocio')
        .eq('id', session.user.id)
        .single()

      if (data) setNombreNegocio(data.nombre_negocio)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cargarVentas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('ventas')
        .select(`
          *,
          detalle_ventas (
            *,
            productos (nombre)
          )
        `)
        .eq('usuario_id', session.user.id)
        .order('created_at', { ascending: false })

      if (filtroFecha !== 'todo' && filtroFecha !== 'personalizado') {
        const fecha = obtenerFechaFiltro(filtroFecha)
        query = query.gte('created_at', fecha)
      } else if (filtroFecha === 'personalizado' && fechaInicio && fechaFin) {
        query = query
          .gte('created_at', `${fechaInicio}T00:00:00`)
          .lte('created_at', `${fechaFin}T23:59:59`)
      }

      const { data, error } = await query

      if (error) throw error
      setVentas(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  const obtenerFechaFiltro = (filtro: string) => {
    const hoy = new Date()
    switch (filtro) {
      case 'hoy':
        return new Date(hoy.setHours(0, 0, 0, 0)).toISOString()
      case 'semana':
        const semana = new Date(hoy.setDate(hoy.getDate() - 7))
        return semana.toISOString()
      case 'mes':
        const mes = new Date(hoy.setMonth(hoy.getMonth() - 1))
        return mes.toISOString()
      default:
        return ''
    }
  }

  const calcularTotalVentas = () => {
    return ventas.reduce((total, venta) => total + Number(venta.total), 0)
  }

  const calcularProductosVendidos = () => {
    return ventas.reduce((total, venta) => {
      return total + venta.detalle_ventas.reduce((sum, detalle) => sum + detalle.cantidad, 0)
    }, 0)
  }

  const toggleDetalleVenta = (ventaId: string) => {
    setVentaExpandida(ventaExpandida === ventaId ? null : ventaId)
  }

  const generarFacturaVenta = async (venta: VentaConDetalles, tipo: 'pdf' | 'imprimir') => {
    const datosRecibo = {
      numeroVenta: venta.id.slice(0, 8).toUpperCase(),
      fecha: new Date(venta.created_at).toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      nombreNegocio: nombreNegocio || 'TuckFlow',
      items: venta.detalle_ventas.map(detalle => ({
        nombre: detalle.productos.nombre,
        cantidad: detalle.cantidad,
        precio: Number(detalle.precio_unitario),
        subtotal: Number(detalle.subtotal)
      })),
      subtotal: venta.detalle_ventas.reduce((sum, d) => sum + Number(d.subtotal), 0),
      descuento: Number(venta.descuento) || 0,
      total: Number(venta.total)
    }

    if (tipo === 'pdf') {
      await generarReciboPDF(datosRecibo)
      toast.success('PDF descargado exitosamente')
    } else {
      imprimirRecibo(datosRecibo)
    }
  }

  const getTextoFiltro = (filtro: FiltroFecha) => {
    switch (filtro) {
      case 'todo': return 'Todas las ventas'
      case 'hoy': return 'Hoy'
      case 'semana': return 'Última semana'
      case 'mes': return 'Último mes'
      case 'personalizado': return 'Personalizado'
      default: return 'Seleccionar período'
    }
  }

  // Cálculos de paginación
  const totalPaginas = Math.ceil(ventas.length / itemsPorPagina)
  const indiceInicio = (paginaActual - 1) * itemsPorPagina
  const indiceFin = indiceInicio + itemsPorPagina
  const ventasActuales = ventas.slice(indiceInicio, indiceFin)

  const cambiarPagina = (numeroPagina: number) => {
    setPaginaActual(numeroPagina)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 font-light">Cargando reportes...</p>
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
          <h1 className="text-2xl sm:text-3xl font-light text-white mb-1 sm:mb-2">Reportes</h1>
          <p className="text-sm sm:text-base text-zinc-400 font-light">Análisis de ventas y estadísticas</p>
        </div>

        <div className="mb-6 bg-white/5 backdrop-blur-sm p-4 sm:p-5 rounded-xl border border-white/10 relative z-20 overflow-visible">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full min-w-[200px]">
              <Label className="text-zinc-300 text-xs sm:text-sm mb-2 block">
                Período
              </Label>
              
              {/* Custom Select Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMostrarDropdown(!mostrarDropdown)}
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm sm:text-base text-white text-left flex items-center justify-between hover:bg-white/15 transition-colors"
                >
                  <span className="truncate pr-2">
                    {getTextoFiltro(filtroFecha)}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform flex-shrink-0 ${mostrarDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown List */}
                {mostrarDropdown && (
                  <>
                    {/* Backdrop para cerrar al hacer click fuera */}
                    <div 
                      className="fixed inset-0 z-[100]" 
                      onClick={() => setMostrarDropdown(false)}
                    />
                    
                    <div className="absolute z-[110] w-full mt-2 bg-zinc-900 border border-white/20 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                      {(['todo', 'hoy', 'semana', 'mes', 'personalizado'] as FiltroFecha[]).map((opcion) => (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => {
                            setFiltroFecha(opcion)
                            setMostrarDropdown(false)
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 ${
                            filtroFecha === opcion ? 'bg-white/10' : ''
                          }`}
                        >
                          <p className="text-sm sm:text-base text-white font-medium">
                            {getTextoFiltro(opcion)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {filtroFecha === 'personalizado' && (
              <>
                <div className="flex-1 w-full min-w-[150px]">
                  <Label className="text-zinc-300 text-xs sm:text-sm mb-2 block">
                    Fecha inicio
                  </Label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="bg-white/10 border-white/20 text-white focus:border-white/40"
                  />
                </div>
                <div className="flex-1 w-full min-w-[150px]">
                  <Label className="text-zinc-300 text-xs sm:text-sm mb-2 block">
                    Fecha fin
                  </Label>
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="bg-white/10 border-white/20 text-white focus:border-white/40"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-5 sm:p-6 rounded-xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-light text-green-100">Total Vendido</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">${calcularTotalVentas().toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 sm:p-6 rounded-xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-light text-blue-100">Número de Ventas</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{ventas.length}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-5 sm:p-6 rounded-xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-light text-purple-100">Productos Vendidos</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{calcularProductosVendidos()}</p>
          </div>
        </div>

        {/* Info de paginación */}
        {ventas.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-zinc-400">
            <div>
              Mostrando <span className="font-semibold text-white">{indiceInicio + 1}</span> a{' '}
              <span className="font-semibold text-white">{Math.min(indiceFin, ventas.length)}</span> de{' '}
              <span className="font-semibold text-white">{ventas.length}</span> ventas
            </div>
            {totalPaginas > 1 && (
              <div className="text-zinc-400">
                Página <span className="font-semibold text-white">{paginaActual}</span> de{' '}
                <span className="font-semibold text-white">{totalPaginas}</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-6 relative z-10">
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5">
            <h3 className="text-base sm:text-lg font-semibold text-white">Historial de Ventas</h3>
          </div>

          {ventasActuales.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                No hay ventas
              </h3>
              <p className="text-sm sm:text-base text-zinc-400 font-light">
                No se encontraron ventas en el período seleccionado
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {ventasActuales.map((venta) => (
                <div key={venta.id} className="bg-white/5">
                  <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white text-sm sm:text-base truncate">
                          Venta #{venta.id.slice(0, 8)}
                        </p>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          {new Date(venta.created_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-base sm:text-lg font-bold text-white">
                          ${Number(venta.total).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          {venta.detalle_ventas.length} producto(s)
                        </p>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => generarFacturaVenta(venta, 'pdf')}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => generarFacturaVenta(venta, 'imprimir')}
                          className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => toggleDetalleVenta(venta.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          aria-label="Ver detalles de la venta"
                        >
                          <ChevronDown
                            className={`w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 transition-transform ${
                              ventaExpandida === venta.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {ventaExpandida === venta.id && (
                    <div className="px-4 sm:px-6 py-4 bg-white/10 border-t border-white/10">
                      <h4 className="text-xs sm:text-sm font-semibold text-white mb-3">
                        Productos vendidos:
                      </h4>
                      <div className="space-y-2">
                        {venta.detalle_ventas.map((detalle) => (
                          <div
                            key={detalle.id}
                            className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-blue-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-white text-sm sm:text-base truncate">
                                  {detalle.productos.nombre}
                                </p>
                                <p className="text-xs sm:text-sm text-zinc-400">
                                  ${Number(detalle.precio_unitario).toLocaleString()} × {detalle.cantidad}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-white text-sm sm:text-base flex-shrink-0">
                              ${Number(detalle.subtotal).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      {Number(venta.descuento) > 0 && (
                        <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-red-300 font-medium">Descuento aplicado:</span>
                            <span className="text-red-400 font-bold">-${Number(venta.descuento).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
                    className={`w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm ${
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
      </div>
    </div>
  )
}
