//app/dashboard/%28protected%29/ventas/page.tsx
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
  TrendingUp,
  Plus,
  Trash2,
  ShoppingCart,
  DollarSign,
  Package,
  Tag,
  X,
  Percent,
  Printer,
  Download,
  CheckCircle
} from 'lucide-react'

interface Producto {
  id: string
  nombre: string
  precio: number
  stock: number
}

interface ItemVenta {
  producto: Producto
  cantidad: number
  subtotal: number
}

interface DatosRecibo {
  numeroVenta: string
  fecha: string
  nombreNegocio: string
  items: { nombre: string; cantidad: number; precio: number; subtotal: number }[]
  subtotal: number
  descuento: number
  total: number
}

export default function VentasPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [carrito, setCarrito] = useState<ItemVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('')
  const [cantidad, setCantidad] = useState<string>('1')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<number>(0)
  const [mostrarDescuento, setMostrarDescuento] = useState(false)
  
  const [mostrarModalExito, setMostrarModalExito] = useState(false)
  const [datosVentaExitosa, setDatosVentaExitosa] = useState<DatosRecibo | null>(null)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('usuario_id', session.user.id)
        .eq('activo', true)
        .gt('stock', 0)
        .order('nombre')

      if (error) throw error
      setProductos(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const agregarAlCarrito = () => {
    if (!productoSeleccionado || !cantidad) {
      toast.error('Selecciona un producto y cantidad')
      return
    }

    const producto = productos.find(p => p.id === productoSeleccionado)
    if (!producto) return

    const cantidadNum = parseInt(cantidad)
    if (cantidadNum <= 0 || cantidadNum > producto.stock) {
      toast.error(`Stock disponible: ${producto.stock}`)
      return
    }

    const existente = carrito.find(item => item.producto.id === producto.id)
    
    if (existente) {
      const nuevaCantidad = existente.cantidad + cantidadNum
      if (nuevaCantidad > producto.stock) {
        toast.error(`Stock disponible: ${producto.stock}`)
        return
      }
      setCarrito(carrito.map(item => 
        item.producto.id === producto.id
          ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * producto.precio }
          : item
      ))
      toast.success(`Cantidad actualizada: ${producto.nombre}`)
    } else {
      setCarrito([...carrito, {
        producto,
        cantidad: cantidadNum,
        subtotal: cantidadNum * producto.precio
      }])
      toast.success(`Agregado: ${producto.nombre}`)
    }

    setProductoSeleccionado('')
    setCantidad('1')
  }

  const eliminarDelCarrito = (productoId: string, nombreProducto: string) => {
    setCarrito(carrito.filter(item => item.producto.id !== productoId))
    toast.success(`Eliminado: ${nombreProducto}`)
  }

  const calcularSubtotal = () => {
    return carrito.reduce((total, item) => total + item.subtotal, 0)
  }

  const calcularDescuento = () => {
    return (calcularSubtotal() * descuentoPorcentaje) / 100
  }

  const calcularTotal = () => {
    return calcularSubtotal() - calcularDescuento()
  }

  const aplicarDescuento = (porcentaje: number) => {
    if (porcentaje < 0 || porcentaje > 100) {
      toast.error('El descuento debe estar entre 0% y 100%')
      return
    }
    setDescuentoPorcentaje(porcentaje)
    setMostrarDescuento(false)
    toast.success(`Descuento aplicado: ${porcentaje}%`)
  }

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    setProcesando(true)

    const loadingToast = toast.loading('Procesando venta...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('No hay sesión activa', { id: loadingToast })
        setProcesando(false)
        return
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre_negocio')
        .eq('id', session.user.id)
        .single()

      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert([{
          usuario_id: session.user.id,
          cliente_id: null,
          total: calcularTotal(),
          estado: 'completada',
          metodo_pago: 'efectivo',
          descuento: calcularDescuento()
        }])
        .select()
        .single()

      if (ventaError) throw ventaError

      for (const item of carrito) {
        const { error: detalleError } = await supabase
          .from('detalle_ventas')
          .insert([{
            venta_id: venta.id,
            producto_id: item.producto.id,
            cantidad: item.cantidad,
            precio_unitario: item.producto.precio,
            subtotal: item.subtotal
          }])

        if (detalleError) throw detalleError

        const nuevoStock = item.producto.stock - item.cantidad

        const { error: stockError } = await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.producto.id)

        if (stockError) throw stockError

        await supabase.from('historial_stock').insert([{
          producto_id: item.producto.id,
          usuario_id: session.user.id,
          tipo: 'salida',
          cantidad: item.cantidad,
          stock_anterior: item.producto.stock,
          stock_nuevo: nuevoStock,
          motivo: `Venta #${venta.id.slice(0, 8).toUpperCase()}`
        }])
      }

      const datosRecibo: DatosRecibo = {
        numeroVenta: venta.id.slice(0, 8).toUpperCase(),
        fecha: new Date().toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        nombreNegocio: perfil?.nombre_negocio || 'TuckFlow',
        items: carrito.map(item => ({
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.producto.precio,
          subtotal: item.subtotal
        })),
        subtotal: calcularSubtotal(),
        descuento: calcularDescuento(),
        total: calcularTotal()
      }

      toast.success('Venta registrada exitosamente', { id: loadingToast })
      
      setDatosVentaExitosa(datosRecibo)
      setMostrarModalExito(true)
      
      setCarrito([])
      setDescuentoPorcentaje(0)
      await cargarProductos()

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(`Error: ${error.message || 'Error desconocido'}`, { id: loadingToast })
    } finally {
      setProcesando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 font-light">Cargando productos...</p>
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
          <h1 className="text-2xl sm:text-3xl font-light text-white mb-1 sm:mb-2">Registrar Venta</h1>
          <p className="text-sm sm:text-base text-zinc-400 font-light">Agrega productos al carrito</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Tarjeta con z-20 para que el dropdown esté encima */}
            <div className="bg-white/5 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-white/10 overflow-visible relative z-20">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Agregar Producto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="producto" className="text-zinc-300 text-sm mb-2 block">Producto</Label>
                  
                  {/* Custom Select Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMostrarDropdown(!mostrarDropdown)}
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm sm:text-base text-white text-left flex items-center justify-between hover:bg-white/15 transition-colors"
                    >
                      <span className="truncate pr-2">
                        {productoSeleccionado 
                          ? (() => {
                              const prod = productos.find(p => p.id === productoSeleccionado)
                              return prod ? `${prod.nombre} - $${prod.precio.toLocaleString()}` : 'Seleccionar producto...'
                            })()
                          : 'Seleccionar producto...'
                        }
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
                          {productos.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-zinc-400 text-center">
                              No hay productos disponibles
                            </div>
                          ) : (
                            productos.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setProductoSeleccionado(p.id)
                                  setMostrarDropdown(false)
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 ${
                                  productoSeleccionado === p.id ? 'bg-white/10' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm sm:text-base text-white font-medium truncate">
                                      {p.nombre}
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                      Stock: {p.stock} unidades
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm sm:text-base font-semibold text-green-400">
                                      ${p.precio.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="cantidad" className="text-zinc-300 text-sm mb-2 block">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="bg-white/10 border-white/20 text-white focus:border-white/40"
                  />
                </div>
              </div>

              <Button
                onClick={agregarAlCarrito}
                className="mt-4 w-full md:w-auto bg-white text-zinc-900 hover:bg-zinc-100"
                disabled={!productoSeleccionado || !cantidad}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar al Carrito
              </Button>
            </div>

            {/* Tarjeta del carrito con z-10 */}
            <div className="bg-white/5 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-white/10 relative z-10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Carrito de Compras</h3>
              
              {carrito.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-500 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-zinc-400 font-light">El carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrito.map(item => (
                    <div
                      key={item.producto.id}
                      className="flex items-center justify-between bg-white/5 p-3 sm:p-4 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-white text-sm sm:text-base truncate">{item.producto.nombre}</h4>
                          <p className="text-xs sm:text-sm text-zinc-400">
                            ${item.producto.precio.toLocaleString()} × {item.cantidad}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <p className="text-base sm:text-lg font-semibold text-white">
                          ${item.subtotal.toLocaleString()}
                        </p>
                        <button
                          onClick={() => eliminarDelCarrito(item.producto.id, item.producto.nombre)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          aria-label="Eliminar del carrito"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-5 sm:p-6 rounded-xl text-white lg:sticky lg:top-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-green-100 font-light">Resumen de Venta</p>
                  <h2 className="text-2xl sm:text-3xl font-bold">${calcularTotal().toLocaleString()}</h2>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 pb-4 border-b border-white/20">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-green-100 font-light">Subtotal:</span>
                  <span className="font-medium">${calcularSubtotal().toLocaleString()}</span>
                </div>

                {descuentoPorcentaje > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-green-100 font-light">Descuento ({descuentoPorcentaje}%):</span>
                    <span className="font-medium">-${calcularDescuento().toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-green-100 font-light">Productos:</span>
                  <span className="font-medium">{carrito.length}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-green-100 font-light">Items totales:</span>
                  <span className="font-medium">
                    {carrito.reduce((total, item) => total + item.cantidad, 0)}
                  </span>
                </div>
              </div>

              {!mostrarDescuento && descuentoPorcentaje === 0 && (
                <Button
                  onClick={() => setMostrarDescuento(true)}
                  className="w-full mb-3 bg-white/20 hover:bg-white/30 text-white border border-white/30"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Agregar Descuento
                </Button>
              )}

              {mostrarDescuento && (
                <div className="mb-4 p-3 sm:p-4 bg-white/10 rounded-lg border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-white text-xs sm:text-sm font-medium">Descuento %</Label>
                    <button
                      onClick={() => setMostrarDescuento(false)}
                      className="text-white/70 hover:text-white"
                      aria-label="Cerrar panel de descuento"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[5, 10, 15, 20].map((porcentaje) => (
                      <button
                        key={porcentaje}
                        onClick={() => aplicarDescuento(porcentaje)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs sm:text-sm font-semibold transition-colors"
                      >
                        {porcentaje}%
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Otro %"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          aplicarDescuento(parseInt((e.target as HTMLInputElement).value) || 0)
                        }
                      }}
                    />
                    <Button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                        aplicarDescuento(parseInt(input.value) || 0)
                      }}
                      className="bg-white text-green-600 hover:bg-white/90"
                    >
                      <Percent className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {descuentoPorcentaje > 0 && !mostrarDescuento && (
                <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-medium">Descuento: {descuentoPorcentaje}%</span>
                  </div>
                  <button
                    onClick={() => setDescuentoPorcentaje(0)}
                    className="text-white/70 hover:text-white"
                    aria-label="Quitar descuento"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <Button
                onClick={procesarVenta}
                disabled={carrito.length === 0 || procesando}
                className="w-full bg-white text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base"
              >
                {procesando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Confirmar Venta
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Venta Exitosa */}
      {mostrarModalExito && datosVentaExitosa && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 border border-white/10 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto px-4 sm:px-6 py-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full mx-auto mb-4">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
              Venta Registrada
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 text-center mb-6">
              La venta se ha procesado exitosamente
            </p>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-6 space-y-2 border border-white/10">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-zinc-400">Factura:</span>
                <span className="font-semibold text-white">{datosVentaExitosa.numeroVenta}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-zinc-400">Productos:</span>
                <span className="font-semibold text-white">{datosVentaExitosa.items.length}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-zinc-400">Subtotal:</span>
                <span className="font-semibold text-white">${datosVentaExitosa.subtotal.toLocaleString()}</span>
              </div>
              {datosVentaExitosa.descuento > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-zinc-400">Descuento:</span>
                  <span className="font-semibold text-red-400">-${datosVentaExitosa.descuento.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white font-bold text-sm sm:text-base">Total:</span>
                <span className="text-green-400 font-bold text-base sm:text-lg">${datosVentaExitosa.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  imprimirRecibo(datosVentaExitosa)
                  setMostrarModalExito(false)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={async () => {
                  await generarReciboPDF(datosVentaExitosa)
                  setMostrarModalExito(false)
                }}
                className="bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>

            <Button
              onClick={() => setMostrarModalExito(false)}
              className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm"
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
