'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DentCoreLogo } from './logo'

const links = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Funciones', href: '#funciones' },
  { label: 'Planes', href: '#planes' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Contacto', href: '#contacto' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#inicio" className="text-primary">
          <DentCoreLogo />
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            render={<Link href="/iniciar-sesion" />}
            variant="ghost"
            className="text-primary hover:bg-secondary"
          >
            Iniciar sesión
          </Button>
          <Button render={<Link href="/suscripcion" />} className="group gap-1 rounded-full">
            Comenzar gratis
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-md text-primary lg:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button
                render={<Link href="/iniciar-sesion" />}
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Iniciar sesión
              </Button>
              <Button
                render={<Link href="/suscripcion" />}
                className="gap-1 rounded-full"
                onClick={() => setOpen(false)}
              >
                Comenzar gratis
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
