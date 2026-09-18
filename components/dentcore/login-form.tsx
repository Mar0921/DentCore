'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Lock, UserRound, FlaskConical, Eye, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const inputClass =
  'h-11 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/30'

type Role = 'empleado' | 'invitado-laboratorio' | 'administrador'

const roles: { value: Role; label: string; description: string; icon: typeof UserRound }[] = [
  { value: 'empleado', label: 'Empleado', description: 'Acceso a trabajos', icon: UserRound },
  { value: 'invitado-laboratorio', label: 'Invitado Laboratorio', description: 'Acceso a su clínica', icon: Eye },
  { value: 'administrador', label: 'Administrador', description: 'Acceso al laboratorio', icon: FlaskConical },
]

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('empleado')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [suspenso, setSuspenso] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Correo no válido.'
    if (password.length < 6) next.password = 'Mínimo 6 caracteres.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setSubmitting(true)
    handleSubmitLogin()
  }

  async function handleSubmitLogin() {
    try {
      // Invitado Laboratorio == Cliente: autenticación contra la tabla `cliente`
      if (role === 'invitado-laboratorio') {
        const { data: cliente, error: cliError } = await supabase
          .from('cliente')
          .select('*, laboratorio(*)')
          .eq('email', email)
          .eq('password', password)
          .single()

        if (cliente && !cliError) {
          // Verificación de tipo de acceso: el cliente debe tener acceso habilitado
          if (!cliente.tiene_acceso) {
            setErrors({
              submit: 'No tienes permiso para acceder. Pide al laboratorio que habilite tu acceso.',
            })
            setSubmitting(false)
            return
          }

          const laboratorio = cliente.laboratorio
          if (!laboratorio || !laboratorio.susactivo) {
            setErrors({
              submit: 'Ocurrió un error, por favor comunícate con tu laboratorio.',
            })
            setSubmitting(false)
            return
          }

          setSubmitting(false)
          setDone(true)

          localStorage.setItem('labUserType', 'invitado-laboratorio')
          localStorage.setItem('labUserEmail', cliente.email || '')
          localStorage.setItem('labUserName', cliente.nombre)
          if (laboratorio) {
            localStorage.setItem('labName', laboratorio.nombre)
          }

          router.push('/invitado-laboratorio')
          return
        }

        // No hay cliente: ¿es un empleado intentando entrar como invitado?
        const { data: empCheck } = await supabase
          .from('empleados')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        setErrors({
          submit: empCheck
            ? 'No tienes permiso para acceder como invitado.'
            : 'Credenciales incorrectas.',
        })
        setSubmitting(false)
        return
      }

      // --- Empleado / Administrador ---
      // La credencial debe coincidir con el tipo de acceso seleccionado:
      //  - administrador -> empleado con rol 'admin'
      //  - empleado -> empleado que NO es admin (técnico/asistente/gerente)
      const base = supabase
        .from('empleados')
        .select('*, laboratorio(*)')
        .eq('email', email)
        .eq('contraseña', password) // En producción usar Supabase Auth

      const { data: employee, error: empError } =
        role === 'administrador'
          ? await base.eq('rol', 'admin').single()
          : await base.neq('rol', 'admin').single()

      if (employee && !empError) {
        // Verificar si la suscripción está activa
        const laboratorio = employee.laboratorio
        if (!laboratorio || !laboratorio.susactivo) {
          setSuspenso(true)
          if (role === 'administrador') {
            setErrors({ submit: 'Tu suscripción está pendiente de pago.' })
          } else {
            setErrors({ submit: 'Ocurrió un error, por favor comunícate con tu laboratorio.' })
          }
          setSubmitting(false)
          return
        }

        setSubmitting(false)
        setDone(true)

        // Guardar información del usuario en localStorage
        localStorage.setItem('labUserType', role === 'administrador' ? 'administrador' : 'empleado')
        localStorage.setItem('labUserEmail', employee.email || '')
        localStorage.setItem('labUserName', employee.nombre)
        if (laboratorio) {
          localStorage.setItem('labName', laboratorio.nombre)
        }

        router.push(role === 'administrador' ? '/laboratorio' : '/empleado')
        return
      }

      // No hay empleado con ese rol: ¿el email pertenece a un empleado de otro rol?
      const { data: empCheck } = await supabase
        .from('empleados')
        .select('rol')
        .eq('email', email)
        .maybeSingle()

      if (empCheck) {
        setErrors({
          submit: `No tienes permiso para acceder como ${role === 'administrador' ? 'administrador' : 'empleado'}.`,
        })
        setSubmitting(false)
        return
      }

      // El email no es empleado: ¿es un cliente intentando entrar como empleado?
      const { data: cliCheck } = await supabase
        .from('cliente')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      setErrors({
        submit: cliCheck
          ? 'No tienes permiso para acceder como empleado.'
          : 'Credenciales incorrectas.',
      })
      setSubmitting(false)
    } catch (err: any) {
      setErrors({ submit: err.message || 'Error al iniciar sesión.' })
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent/15">
          <Lock className="size-6 text-accent" />
        </div>
        <h1 className="mt-5 font-heading text-xl font-bold text-primary">
          Autenticación de demostración
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El inicio de sesión aún no está conectado a un backend. Cuando lo conectemos, aquí accederás a tu panel de DentCore.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button render={<Link href="/trabajos" />} className="h-11 w-full rounded-full">
            Ir a Trabajos (empleado)
          </Button>
          <Button render={<Link href="/invitado-laboratorio" />} variant="outline" className="h-11 w-full rounded-full">
            Ir a Invitado Laboratorio
          </Button>
          <Button render={<Link href="/laboratorio" />} variant="outline" className="h-11 w-full rounded-full">
            Ir al Laboratorio (admin)
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-primary">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            className={inputClass}
            placeholder="tu@laboratorio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-primary">
              Contraseña
            </label>
            <button type="button" className="text-xs font-medium text-accent hover:underline">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <input
            id="password"
            type="password"
            className={inputClass}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && (
            <p className="text-xs font-medium text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary">Tipo de acceso</label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => {
              const Icon = r.icon
              const isActive = role === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-all',
                    isActive ? 'border-accent bg-accent/10 text-accent shadow-sm' : 'border-border hover:bg-secondary',
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{r.description}</span>
                </button>
              )
            })}
          </div>
        </div>

        {errors.submit && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errors.submit}</span>
          </div>
        )}

        {suspenso && role === 'administrador' && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/15">
              <AlertCircle className="size-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">
                Tu suscripción está pendiente de pago
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Realiza el pago de tu plan para activar tu cuenta y acceder al panel.
              </p>
            </div>
            <Button
              render={<Link href="/suscripcion" />}
              size="sm"
              className="h-9 rounded-full px-5"
            >
              Realizar pago
            </Button>
          </div>
        )}

        {suspenso && role !== 'administrador' && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>Ocurrió un error, por favor comunícate con tu laboratorio.</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className={cn('group h-12 w-full gap-2 rounded-full text-sm')}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            <>
              Iniciar sesión
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
