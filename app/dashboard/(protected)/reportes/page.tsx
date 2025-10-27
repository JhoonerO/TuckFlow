'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  FileText
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

export default function ReportesPage() {
  const router = useRouter()
  const [ventas, setVentas] = useState<VentaConDetalles[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroFecha, setFiltroFecha] = useState('todo')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [ventaExpandida, setVentaExpandida] = useState<string | null>(null)
  const [nombreNegocio, setNombreNegocio] = useState('')

  useEffect(() => {
    cargarVentas()
    obtenerNombreNegocio()
  }, [filtroFecha, fechaInicio, fechaFin])

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
    } else {
      imprimirRecibo(datosRecibo)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 font-light">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 p-8 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-white mb-2">Reportes</h1>
          <p className="text-zinc-400 font-light">Análisis de ventas y estadísticas</p>
        </div>

        <div className="mb-6 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Período
              </label>
              <select
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-white"
                aria-label="Filtro de fecha"
              >
                <option value="todo" className="bg-zinc-900">Todas las ventas</option>
                <option value="hoy" className="bg-zinc-900">Hoy</option>
                <option value="semana" className="bg-zinc-900">Última semana</option>
                <option value="mes" className="bg-zinc-900">Último mes</option>
                <option value="personalizado" className="bg-zinc-900">Personalizado</option>
              </select>
            </div>

            {filtroFecha === 'personalizado' && (
              <>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Fecha inicio
                  </label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="bg-white/10 border-white/20 text-white focus:border-white/40"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Fecha fin
                  </label>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-light text-green-100">Total Vendido</h3>
            </div>
            <p className="text-3xl font-bold">${calcularTotalVentas().toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-light text-blue-100">Número de Ventas</h3>
            </div>
            <p className="text-3xl font-bold">{ventas.length}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-light text-purple-100">Productos Vendidos</h3>
            </div>
            <p className="text-3xl font-bold">{calcularProductosVendidos()}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h3 className="text-lg font-semibold text-white">Historial de Ventas</h3>
          </div>

          {ventas.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay ventas
              </h3>
              <p className="text-zinc-400 font-light">
                No se encontraron ventas en el período seleccionado
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {ventas.map((venta) => (
                <div key={venta.id} className="bg-white/5">
                  <div
                    className="px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Venta #{venta.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-zinc-400">
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

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          ${Number(venta.total).toLocaleString()}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {venta.detalle_ventas.length} producto(s)
                        </p>
                      </div>

                      {/* Botones de factura */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => generarFacturaVenta(venta, 'pdf')}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => generarFacturaVenta(venta, 'imprimir')}
                          className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Imprimir"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        onClick={() => toggleDetalleVenta(venta.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Ver detalles de la venta"
                      >
                        <ChevronDown
                          className={`w-5 h-5 text-zinc-400 transition-transform ${
                            ventaExpandida === venta.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {ventaExpandida === venta.id && (
                    <div className="px-6 py-4 bg-white/10 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-3">
                        Productos vendidos:
                      </h4>
                      <div className="space-y-2">
                        {venta.detalle_ventas.map((detalle) => (
                          <div
                            key={detalle.id}
                            className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {detalle.productos.nombre}
                                </p>
                                <p className="text-sm text-zinc-400">
                                  ${Number(detalle.precio_unitario).toLocaleString()} × {detalle.cantidad}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-white">
                              ${Number(detalle.subtotal).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      {Number(venta.descuento) > 0 && (
                        <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                          <div className="flex justify-between text-sm">
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
      </div>
    </div>
  )
}
