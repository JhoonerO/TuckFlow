'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  LogOut, 
  Package, 
  TrendingUp, 
  Users, 
  BarChart3,
  ArrowRight,
  AlertTriangle,
  Clock,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

interface Perfil {
  nombre_completo: string | null
  nombre_negocio: string
  rol: string
}

interface Stats {
  productos: number
  ventas: number
  clientes: number
  ventasHoy: number
  ventasMesActual: number
  ventasMesAnterior: number
  cambioMensual: number
}

interface ProductoBajoStock {
  id: string
  nombre: string
  stock: number
}

interface UltimaVenta {
  id: string
  total: number
  created_at: string
}

interface VentaPorDia {
  dia: string
  total: number
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [stats, setStats] = useState<Stats>({
    productos: 0,
    ventas: 0,
    clientes: 0,
    ventasHoy: 0,
    ventasMesActual: 0,
    ventasMesAnterior: 0,
    cambioMensual: 0
  })
  const [productosBajoStock, setProductosBajoStock] = useState<ProductoBajoStock[]>([])
  const [ultimasVentas, setUltimasVentas] = useState<UltimaVenta[]>([])
  const [ventasPorDia, setVentasPorDia] = useState<VentaPorDia[]>([])

  useEffect(() => {
    verificarSesion()
  }, [])

  const verificarSesion = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error obteniendo sesión:', sessionError)
        router.push('/login')
        return
      }

      if (!session) {
        router.push('/login')
        return
      }

      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('nombre_completo, nombre_negocio, rol')
        .eq('id', session.user.id)
        .single()

      if (perfilError) {
        console.error('Error obteniendo perfil:', perfilError)
        router.push('/login')
        return
      }

      setPerfil(perfilData)
      await obtenerEstadisticas(session.user.id)
      
    } catch (error) {
      console.error('Error en verificarSesion:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const obtenerEstadisticas = async (userId: string) => {
    try {
      const { count: productosCount } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', userId)

      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', userId)

      const { count: ventasCount } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', userId)

      const hoy = new Date().toISOString().split('T')[0]
      const { data: ventasHoyData } = await supabase
        .from('ventas')
        .select('total')
        .eq('usuario_id', userId)
        .gte('created_at', `${hoy}T00:00:00`)
        .lte('created_at', `${hoy}T23:59:59`)

      const totalVentasHoy = ventasHoyData?.reduce((sum, venta) => sum + Number(venta.total), 0) || 0

      const inicioMesActual = new Date()
      inicioMesActual.setDate(1)
      inicioMesActual.setHours(0, 0, 0, 0)

      const { data: ventasMesActualData } = await supabase
        .from('ventas')
        .select('total')
        .eq('usuario_id', userId)
        .gte('created_at', inicioMesActual.toISOString())

      const totalMesActual = ventasMesActualData?.reduce((sum, venta) => sum + Number(venta.total), 0) || 0

      const inicioMesAnterior = new Date()
      inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1)
      inicioMesAnterior.setDate(1)
      inicioMesAnterior.setHours(0, 0, 0, 0)

      const finMesAnterior = new Date()
      finMesAnterior.setDate(0)
      finMesAnterior.setHours(23, 59, 59, 999)

      const { data: ventasMesAnteriorData } = await supabase
        .from('ventas')
        .select('total')
        .eq('usuario_id', userId)
        .gte('created_at', inicioMesAnterior.toISOString())
        .lte('created_at', finMesAnterior.toISOString())

      const totalMesAnterior = ventasMesAnteriorData?.reduce((sum, venta) => sum + Number(venta.total), 0) || 0

      const cambio = totalMesAnterior > 0 
        ? ((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100 
        : totalMesActual > 0 ? 100 : 0

      const { data: bajoStockData } = await supabase
        .from('productos')
        .select('id, nombre, stock')
        .eq('usuario_id', userId)
        .lt('stock', 10)
        .order('stock', { ascending: true })
        .limit(5)

      const { data: ultimasVentasData } = await supabase
        .from('ventas')
        .select('id, total, created_at')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      const hace7Dias = new Date()
      hace7Dias.setDate(hace7Dias.getDate() - 6)
      
      const { data: ventasRecientes } = await supabase
        .from('ventas')
        .select('total, created_at')
        .eq('usuario_id', userId)
        .gte('created_at', hace7Dias.toISOString())

      const ventasPorDiaMap: { [key: string]: number } = {}
      
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date()
        fecha.setDate(fecha.getDate() - i)
        const diaKey = fecha.toISOString().split('T')[0]
        ventasPorDiaMap[diaKey] = 0
      }

      ventasRecientes?.forEach(venta => {
        const dia = venta.created_at.split('T')[0]
        if (ventasPorDiaMap.hasOwnProperty(dia)) {
          ventasPorDiaMap[dia] += Number(venta.total)
        }
      })

      const ventasPorDiaArray = Object.entries(ventasPorDiaMap).map(([dia, total]) => ({
        dia: new Date(dia).toLocaleDateString('es-CO', { weekday: 'short' }),
        total
      }))

      setStats({
        productos: productosCount || 0,
        ventas: ventasCount || 0,
        clientes: clientesCount || 0,
        ventasHoy: totalVentasHoy,
        ventasMesActual: totalMesActual,
        ventasMesAnterior: totalMesAnterior,
        cambioMensual: cambio
      })

      setProductosBajoStock(bajoStockData || [])
      setUltimasVentas(ultimasVentasData || [])
      setVentasPorDia(ventasPorDiaArray)

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const maxVenta = Math.max(...ventasPorDia.map(v => v.total), 1)

  const getCambioColor = () => {
    if (stats.cambioMensual > 0) return 'text-green-400'
    if (stats.cambioMensual < 0) return 'text-red-400'
    return 'text-zinc-400'
  }

  const getCambioIcon = () => {
    if (stats.cambioMensual > 0) return <ArrowUp className="w-4 h-4" />
    if (stats.cambioMensual < 0) return <ArrowDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 font-light">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-white/5 rounded-full blur-3xl" />

      <header className="relative z-10 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg">
                <Building2 className="w-6 h-6 text-zinc-900" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                  {perfil?.nombre_negocio}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 font-light">
                  {perfil?.nombre_completo}
                </p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden text-sm">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-2">
            Bienvenido de vuelta
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 font-light">
            Aquí está un resumen de tu negocio
          </p>
        </div>

        {/* Comparativa Mensual */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm text-zinc-400 font-light mb-1">Ventas este mes</p>
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                ${stats.ventasMesActual.toLocaleString()}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`flex items-center gap-1 ${getCambioColor()}`}>
                  {getCambioIcon()}
                  <span className="text-sm font-semibold">
                    {Math.abs(stats.cambioMensual).toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-zinc-500 font-light">
                  vs mes anterior (${stats.ventasMesAnterior.toLocaleString()})
                </span>
              </div>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto sm:mx-0">
              <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <button
            onClick={() => router.push('/dashboard/productos')}
            className="bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-blue-400/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-1">
              {stats.productos}
            </h3>
            <p className="text-sm text-zinc-400 font-light">Productos</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/ventas')}
            className="bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-green-400/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-1">
              ${stats.ventasHoy.toLocaleString()}
            </h3>
            <p className="text-sm text-zinc-400 font-light">Ventas de hoy</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/clientes')}
            className="bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-1">
              {stats.clientes}
            </h3>
            <p className="text-sm text-zinc-400 font-light">Clientes</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/reportes')}
            className="bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-orange-400/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-1">
              {stats.ventas}
            </h3>
            <p className="text-sm text-zinc-400 font-light">Ventas realizadas</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Ventas de los últimos 7 días</h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-light">Evolución diaria de ventas</p>
              </div>
            </div>

            <div className="h-60 sm:h-64 relative">
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-white/10"></div>
                ))}
              </div>

              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(74, 222, 128)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(74, 222, 128)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d={(() => {
                    if (ventasPorDia.length === 0) return ''
                    const width = 100
                    const step = width / (ventasPorDia.length - 1 || 1)
                    let path = `M 0,100 `
                    
                    ventasPorDia.forEach((venta, i) => {
                      const x = i * step
                      const y = 100 - ((venta.total / maxVenta) * 90)
                      path += `L ${x},${y} `
                    })
                    
                    path += `L 100,100 Z`
                    return path
                  })()}
                  fill="url(#gradient)"
                  vectorEffect="non-scaling-stroke"
                />

                <path
                  d={(() => {
                    if (ventasPorDia.length === 0) return ''
                    const width = 100
                    const step = width / (ventasPorDia.length - 1 || 1)
                    let path = ''
                    
                    ventasPorDia.forEach((venta, i) => {
                      const x = i * step
                      const y = 100 - ((venta.total / maxVenta) * 90)
                      path += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`
                    })
                    
                    return path
                  })()}
                  fill="none"
                  stroke="rgb(74, 222, 128)"
                  strokeWidth="0.3"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {ventasPorDia.map((venta, i) => {
                  const width = 100
                  const step = width / (ventasPorDia.length - 1 || 1)
                  const x = i * step
                  const y = 100 - ((venta.total / maxVenta) * 90)
                  
                  return (
                    <g key={i}>
                      <circle
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="1"
                        fill="rgb(24, 24, 27)"
                        stroke="rgb(74, 222, 128)"
                        strokeWidth="0.3"
                      />
                    </g>
                  )
                })}
              </svg>

              <div className="absolute bottom-0 w-full flex justify-between px-1 sm:px-2">
                {ventasPorDia.map((venta, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <p className="text-[10px] sm:text-xs font-medium text-zinc-400 mt-2">
                      {venta.dia}
                    </p>
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 flex justify-between items-end pb-8">
                {ventasPorDia.map((venta, index) => {
                  const altura = venta.total > 0 ? (venta.total / maxVenta) * 90 : 0
                  return (
                    <div 
                      key={index} 
                      className="flex-1 group relative flex items-end justify-center"
                      style={{ height: '100%' }}
                    >
                      <div 
                        className="w-full cursor-pointer"
                        style={{ height: `${altura}%` }}
                      >
                        {venta.total > 0 && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 sm:mb-2 bg-white text-zinc-900 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            <div className="font-semibold">${venta.total.toLocaleString()}</div>
                            <div className="text-zinc-600">{venta.dia}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Últimas Ventas</h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-light">Ventas recientes</p>
              </div>
            </div>

            {ultimasVentas.length === 0 ? (
              <p className="text-center text-zinc-500 py-4 font-light text-sm">
                Sin ventas registradas
              </p>
            ) : (
              <div className="space-y-2">
                {ultimasVentas.map((venta) => (
                  <div
                    key={venta.id}
                    className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10"
                  >
                    <div>
                      <p className="font-medium text-white text-xs sm:text-sm">
                        #{venta.id.slice(0, 8)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-zinc-400">
                        {new Date(venta.created_at).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-green-400">
                      ${Number(venta.total).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {productosBajoStock.length > 0 && (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Alerta de Stock Bajo</h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-light">
                  Productos que necesitan reposición urgente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {productosBajoStock.map((producto) => (
                <div
                  key={producto.id}
                  className="bg-white/5 p-4 rounded-lg border border-red-500/30 flex flex-col items-center text-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3">
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                  </div>
                  <p className="font-medium text-white text-xs sm:text-sm mb-1">
                    {producto.nombre}
                  </p>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mb-2">
                    Stock restante
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-red-400">
                    {producto.stock}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
