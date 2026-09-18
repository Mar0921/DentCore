import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { LoginForm } from '@/components/dentcore/login-form'

export const metadata: Metadata = {
  title: 'Iniciar sesión | DentCore',
  description: 'Accede a tu cuenta de DentCore para gestionar tu laboratorio dental.',
}

export default function IniciarSesionPage() {
  return (
    <main className="flex min-h-screen bg-background">
      <div className="hidden w-1/2 bg-primary lg:block" />
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2 text-primary">
            <span className="font-heading text-xl font-bold tracking-tight">DentCore</span>
          </div>
          <h1 className="mt-8 font-heading text-3xl font-bold tracking-tight text-primary">Bienvenido de nuevo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa tus datos para acceder a tu cuenta.
          </p>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/suscripcion" className="font-semibold text-accent hover:underline">
              Comienza gratis
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
