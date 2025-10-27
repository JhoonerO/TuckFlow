'use client'

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "../lib/supabase"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Loader2, AlertCircle, Building2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (loginError) throw loginError

      if (data.user) {
        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex">
      {/* Left side - Branding section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg">
              <Building2 className="w-6 h-6 text-zinc-900" />
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">TuckFlow</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-light text-white mb-6 leading-tight tracking-tight">
              Gestión empresarial de clase mundial
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed font-light">
              Plataforma integral diseñada para empresas que exigen excelencia, precisión y resultados excepcionales.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <div className="w-8 h-px bg-zinc-700" />
            <span className="font-light">Confiado por empresas líderes globalmente</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="flex items-center justify-center w-10 h-10 bg-zinc-900 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-zinc-900 tracking-tight">TuckFlow</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-light text-zinc-900 mb-3 tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-zinc-500 font-light">Ingresa a tu cuenta de TuckFlow</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-900">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@empresa.com"
                className="h-12 bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 focus:border-2 transition-colors"

              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-900">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="h-12 bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 focus:border-2 transition-colors"

              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-light">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-sm text-zinc-400 font-light">o</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          <p className="text-center text-sm text-zinc-600 font-light">
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="font-medium text-zinc-900 hover:text-zinc-700 transition-colors underline underline-offset-4"
            >
              Regístrate gratis
            </Link>
          </p>

          <p className="text-center text-xs text-zinc-400 mt-12 font-light">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad
          </p>
        </div>
      </div>
    </div>
  )
}
