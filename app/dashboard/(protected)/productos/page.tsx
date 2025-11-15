//app/dashboard/%28protected%29/productos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingDown,
  Search,
  Filter,
  X
} from 'lucide-react'

interface Producto {
  id: string
  nombre: string
  precio: number
  stock: number
  stock_minimo: number
}

type OrdenProductos =
  | 'nombre-asc'
  | 'nombre-desc'
  | 'precio-asc'
  | 'precio-desc'
  | 'stock-asc'
  | 'stock-desc'

export default function ProductosPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [productoActual, setProductoActual] = useState<Producto | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroStock, setFiltroStock] = useState<'todos' | 'bajo' | 'normal'>('todos')
  const [orden, setOrden] = useState<OrdenProductos>('nombre-asc')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    stock: '',
    stock_minimo: '5',
  })

  useEffect(() => {
    cargarProductos()
  }, [])

  useEffect(() => {
    aplicarFiltrosYOrden()
  }, [productos, busqueda, filtroStock, orden])

  const registrarHistorialStock = async (
    productoId: string,
    tipo: 'entrada' | 'salida' | 'ajuste',
    cantidad: number,
    stockAnterior: number,
    stockNuevo: number,
    motivo?: string
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      await supabase.from('historial_stock').insert([
        {
          producto_id: productoId,
          usuario_id: session.user.id,
          tipo,
          cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          motivo: motivo || null,
        },
      ])
    } catch (error) {
      console.error('Error al registrar historial:', error)
    }
  }

  const cargarProductos = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('usuario_id', session.user.id)
        .eq('activo', true)

      if (error) throw error
      setProductos(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltrosYOrden = () => {
    let resultado = [...productos]

    if (busqueda.trim()) {
      resultado = resultado.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    }

    if (filtroStock === 'bajo') {
      resultado = resultado.filter((p) => p.stock <= p.stock_minimo)
    } else if (filtroStock === 'normal') {
      resultado = resultado.filter((p) => p.stock > p.stock_minimo)
    }

    resultado.sort((a, b) => {
      switch (orden) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre)
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre)
        case 'precio-asc':
          return a.precio - b.precio
        case 'precio-desc':
          return b.precio - a.precio
        case 'stock-asc':
          return a.stock - b.stock
        case 'stock-desc':
          return b.stock - a.stock
        default:
          return 0
      }
    })

    setProductosFiltrados(resultado)
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroStock('todos')
    setOrden('nombre-asc')
    toast.success('Filtros limpiados')
  }

  const abrirModal = (producto?: Producto) => {
    if (producto) {
      setEditando(true)
      setProductoActual(producto)
      setFormData({
        nombre: producto.nombre,
        precio: producto.precio.toString(),
        stock: producto.stock.toString(),
        stock_minimo: producto.stock_minimo.toString(),
      })
    } else {
      setEditando(false)
      setProductoActual(null)
      setFormData({
        nombre: '',
        precio: '',
        stock: '',
        stock_minimo: '5',
      })
    }
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(false)
    setProductoActual(null)
    setFormData({
      nombre: '',
      precio: '',
      stock: '',
      stock_minimo: '5',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.precio || !formData.stock) {
      toast.error('Completa todos los campos')
      return
    }

    const loadingToast = toast.loading(editando ? 'Actualizando...' : 'Creando...')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        toast.error('No hay sesión activa', { id: loadingToast })
        return
      }

      const productoData = {
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        stock_minimo: parseInt(formData.stock_minimo),
      }

      if (editando && productoActual) {
        const { error } = await supabase
          .from('productos')
          .update(productoData)
          .eq('id', productoActual.id)

        if (error) throw error

        if (productoActual.stock !== productoData.stock) {
          const diferencia = productoData.stock - productoActual.stock
          await registrarHistorialStock(
            productoActual.id,
            'ajuste',
            Math.abs(diferencia),
            productoActual.stock,
            productoData.stock,
            'Ajuste manual de inventario'
          )
        }

        toast.success('Producto actualizado', { id: loadingToast })
      } else {
        const { data: nuevoProducto, error } = await supabase
          .from('productos')
          .insert([{ ...productoData, usuario_id: session.user.id }])
          .select()
          .single()

        if (error) throw error

        if (nuevoProducto && productoData.stock > 0) {
          await registrarHistorialStock(
            nuevoProducto.id,
            'entrada',
            productoData.stock,
            0,
            productoData.stock,
            'Stock inicial del producto'
          )
        }

        toast.success('Producto creado', { id: loadingToast })
      }

      cerrarModal()
      cargarProductos()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al guardar', { id: loadingToast })
    }
  }

  const eliminarProducto = async (id: string, nombre: string) => {
    if (
      !confirm(
        `¿Desactivar producto "${nombre}"?\n\nNo se eliminará del historial de ventas.`
      )
    )
      return

    const loadingToast = toast.loading('Desactivando producto...')

    try {
      const { error } = await supabase
        .from('productos')
        .update({ activo: false })
        .eq('id', id)

      if (error) throw error

      toast.success('Producto desactivado exitosamente', { id: loadingToast })
      cargarProductos()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error al desactivar producto', { id: loadingToast })
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
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 mt-10 md:mt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-white mb-1 sm:mb-2">
              Productos
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light">
              Gestión de inventario
            </p>
          </div>
          <Button
            onClick={() => abrirModal()}
            className="w-full sm:w-auto bg-white text-zinc-900 hover:bg-zinc-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                type="text"
                placeholder="Buscar producto por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
              />
            </div>
            <Button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {(filtroStock !== 'todos' || orden !== 'nombre-asc') && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full text-xs font-semibold">
                  {(filtroStock !== 'todos' ? 1 : 0) + (orden !== 'nombre-asc' ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {mostrarFiltros && (
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Stock
                  </Label>
                  <select
                    value={filtroStock}
                    onChange={(e) => setFiltroStock(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm sm:text-base text-white"
                    aria-label="Filtrar por stock"
                  >
                    <option value="todos" className="bg-zinc-900">
                      Todos
                    </option>
                    <option value="bajo" className="bg-zinc-900">
                      Stock bajo
                    </option>
                    <option value="normal" className="bg-zinc-900">
                      Stock normal
                    </option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Ordenar por
                  </Label>
                  <select
                    value={orden}
                    onChange={(e) => setOrden(e.target.value as OrdenProductos)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm sm:text-base text-white"
                    aria-label="Ordenar productos"
                  >
                    <option value="nombre-asc" className="bg-zinc-900">
                      Nombre (A-Z)
                    </option>
                    <option value="nombre-desc" className="bg-zinc-900">
                      Nombre (Z-A)
                    </option>
                    <option value="precio-asc" className="bg-zinc-900">
                      Precio (menor a mayor)
                    </option>
                    <option value="precio-desc" className="bg-zinc-900">
                      Precio (mayor a menor)
                    </option>
                    <option value="stock-asc" className="bg-zinc-900">
                      Stock (menor a mayor)
                    </option>
                    <option value="stock-desc" className="bg-zinc-900">
                      Stock (mayor a menor)
                    </option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={limpiarFiltros}
                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumen de resultados */}
        <div className="mb-4 text-sm text-zinc-400">
          Mostrando{' '}
          <span className="font-semibold text-white">
            {productosFiltrados.length}
          </span>{' '}
          de{' '}
          <span className="font-semibold text-white">{productos.length}</span>{' '}
          productos
        </div>

        {/* Grid de productos */}
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <Package className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {productos.length === 0 ? 'No hay productos' : 'No se encontraron productos'}
            </h3>
            <p className="text-zinc-400 font-light mb-6">
              {productos.length === 0
                ? 'Crea tu primer producto para comenzar'
                : 'Intenta cambiar los filtros de búsqueda'}
            </p>
            {productos.length === 0 && (
              <Button
                onClick={() => abrirModal()}
                className="bg-white text-zinc-900 hover:bg-zinc-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Producto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 sm:p-6 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  {producto.stock <= producto.stock_minimo && (
                    <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-semibold border border-red-500/30">
                      <TrendingDown className="w-3 h-3" />
                      Bajo
                    </div>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                  {producto.nombre}
                </h3>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Precio:</span>
                    <span className="font-semibold text-white">
                      ${producto.precio.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Stock:</span>
                    <span
                      className={`font-semibold ${
                        producto.stock <= producto.stock_minimo
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {producto.stock} unidades
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Stock mínimo:</span>
                    <span className="font-medium text-zinc-300">
                      {producto.stock_minimo}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => abrirModal(producto)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => eliminarProducto(producto.id, producto.nombre)}
                    className="text-red-400 hover:bg-red-500/10 bg-white/10 border-white/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 border border-white/10 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto px-4 sm:px-6 py-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editando ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre" className="text-zinc-300">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
                  placeholder="Ej: Laptop HP"
                  required
                />
              </div>

              <div>
                <Label htmlFor="precio" className="text-zinc-300">
                  Precio
                </Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData({ ...formData, precio: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="stock" className="text-zinc-300">
                  Stock
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="stock_minimo" className="text-zinc-300">
                  Stock Mínimo
                </Label>
                <Input
                  id="stock_minimo"
                  type="number"
                  value={formData.stock_minimo}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_minimo: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
                  placeholder="5"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-white text-zinc-900 hover:bg-zinc-100"
                >
                  {editando ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
