'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3,
  History,
  ArrowLeft
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      name: 'Productos',
      icon: Package,
      href: '/dashboard/productos',
      active: pathname === '/dashboard/productos'
    },
    {
      name: 'Ventas',
      icon: ShoppingCart,
      href: '/dashboard/ventas',
      active: pathname === '/dashboard/ventas'
    },
    {
      name: 'Clientes',
      icon: Users,
      href: '/dashboard/clientes',
      active: pathname === '/dashboard/clientes'
    },
    {
      name: 'Reportes',
      icon: BarChart3,
      href: '/dashboard/reportes',
      active: pathname === '/dashboard/reportes'
    },
    {
      name: 'Historial Stock',
      icon: History,
      href: '/dashboard/historial-stock',
      active: pathname === '/dashboard/historial-stock'
    }
  ]

  return (
    <div className="w-64 bg-zinc-900 border-r border-white/10 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-zinc-900" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-white">TuckFlow</h2>
            <p className="text-xs text-zinc-400">Sistema de Ventas</p>
          </div>
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.active
                      ? 'bg-white text-zinc-900 shadow-lg'
                      : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all w-full text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
