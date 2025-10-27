'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Mail,
  Phone,
  User
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const clienteData = {
      nombre: formData.nombre,
      email: formData.email || null,
      telefono: formData.telefono || null,
      direccion: formData.direccion || null,
      usuario_id: session.user.id
    }

    if (editingCliente) {
      const { error } = await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', editingCliente.id)

      if (error) {
        console.error('Error actualizando cliente:', error)
        alert('Error al actualizar cliente')
        return
      }
      alert('Cliente actualizado exitosamente')
    } else {
      const { error } = await supabase
        .from('clientes')
        .insert([clienteData])

      if (error) {
        console.error('Error creando cliente:', error)
        alert('Error al crear cliente')
        return
      }
      alert('Cliente creado exitosamente')
    }

    await cargarClientes()
    cerrarModal()
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando cliente:', error)
      alert('Error al eliminar cliente')
      return
    }

    alert('Cliente eliminado exitosamente')
    await cargarClientes()
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
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 font-light">Cargando clientes...</p>
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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-white mb-2">Clientes</h1>
            <p className="text-zinc-400 font-light">Gestiona tu cartera de clientes</p>
          </div>
          
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white text-zinc-900 hover:bg-zinc-100"
          >
            <Plus className="w-5 h-5" />
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
            className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-white/40"
          />
        </div>

        {/* Clientes Grid */}
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <Users className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay clientes
            </h3>
            <p className="text-zinc-400 font-light mb-6">
              {searchTerm ? 'No se encontraron clientes con ese criterio' : 'Comienza agregando tu primer cliente'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)} className="bg-white text-zinc-900 hover:bg-zinc-100">
                <Plus className="w-5 h-5 mr-2" />
                Agregar Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-400" />
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
                      onClick={() => handleDelete(cliente.id)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      aria-label="Eliminar cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-3">
                  {cliente.nombre}
                </h3>

                <div className="space-y-2">
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Phone className="w-4 h-4" />
                      <span>{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.direccion && (
                    <div className="text-sm text-zinc-500 mt-2 pt-2 border-t border-white/10">
                      {cliente.direccion}
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
            <div className="bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 border border-white/10 rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">
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
                  <Label htmlFor="nombre" className="text-zinc-300">Nombre Completo *</Label>
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
                  <Label htmlFor="email" className="text-zinc-300">Email</Label>
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
                  <Label htmlFor="telefono" className="text-zinc-300">Teléfono</Label>
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
                  <Label htmlFor="direccion" className="text-zinc-300">Dirección</Label>
                  <textarea
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección del cliente (opcional)"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 font-light text-white placeholder:text-zinc-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-white text-zinc-900 hover:bg-zinc-100">
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
