'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { 
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Mail,
  Phone,
  User,
  MapPin
} from 'lucide-react'

interface Cliente {
  id: string
  nombre: string
  email: string | null
  telefono: string | null
  direccion: string | null
  created_at: string
}

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  })

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('usuario_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    const loadingToast = toast.loading(editingCliente ? 'Actualizando...' : 'Creando...')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('No hay sesión activa', { id: loadingToast })
        return
      }

      const clienteData = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        direccion: formData.direccion.trim() || null,
        usuario_id: session.user.id
      }

      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', editingCliente.id)

        if (error) throw error
        toast.success('Cliente actualizado exitosamente', { id: loadingToast })
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([clienteData])

        if (error) throw error
        toast.success('Cliente creado exitosamente', { id: loadingToast })
      }

      await cargarClientes()
      cerrarModal()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al guardar cliente', { id: loadingToast })
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar a "${nombre}"?`)) return

    const loadingToast = toast.loading('Eliminando cliente...')

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Cliente eliminado exitosamente', { id: loadingToast })
      await cargarClientes()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error al eliminar cliente', { id: loadingToast })
    }
  }

  const cerrarModal = () => {
    setShowModal(false)
    setEditingCliente(null)
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      direccion: ''
    })
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 font-light">Cargando clientes...</p>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 mt-10 md:mt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-white mb-1 sm:mb-2">Clientes</h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light">Gestiona tu cartera de clientes</p>
          </div>
          
          <Button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto bg-white text-zinc-900 hover:bg-zinc-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
          />
        </div>

        {/* Contador de resultados */}
        {searchTerm && (
          <div className="mb-4 text-sm text-zinc-400">
            {clientesFiltrados.length === 0 
              ? 'No se encontraron clientes' 
              : `Mostrando ${clientesFiltrados.length} ${clientesFiltrados.length === 1 ? 'cliente' : 'clientes'}`
            }
          </div>
        )}

        {/* Clientes Grid */}
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              No hay clientes
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 font-light mb-6">
              {searchTerm ? 'No se encontraron clientes con ese criterio' : 'Comienza agregando tu primer cliente'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowModal(true)} 
                className="bg-white text-zinc-900 hover:bg-zinc-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-white/5 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cliente)}
                      className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      aria-label="Editar cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente.id, cliente.nombre)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      aria-label="Eliminar cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 truncate">
                  {cliente.nombre}
                </h3>

                <div className="space-y-2">
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.direccion && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-zinc-500 mt-2 pt-2 border-t border-white/10">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cliente.direccion}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Agregar/Editar Cliente */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 border border-white/10 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto px-4 sm:px-6 py-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <button
                  onClick={cerrarModal}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nombre" className="text-zinc-300 text-sm">
                    Nombre Completo <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    className="bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@ejemplo.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="telefono" className="text-zinc-300 text-sm">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="300 123 4567"
                    className="bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="direccion" className="text-zinc-300 text-sm">Dirección</Label>
                  <textarea
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección del cliente (opcional)"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-sm sm:text-base text-white placeholder:text-zinc-500 resize-none"
                    rows={3}
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
                    {editingCliente ? 'Actualizar' : 'Crear Cliente'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
