'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChart3, Briefcase, Gauge, Shield, ShoppingCart, Settings2 } from 'lucide-react'

const items = [
  { label: 'Ventas', href: '/analisis/ventas', icon: BarChart3 },
  { label: 'Trabajos', href: '/analisis/trabajos', icon: Briefcase },
  { label: 'Productividad', href: '/analisis/productividad', icon: Gauge },
  { label: 'Calidad', href: '/analisis/calidad', icon: Shield },
  { label: 'Compras', href: '/analisis/compras', icon: ShoppingCart },
  { label: 'Control avanzado', href: '/analisis/control-avanzado', icon: Settings2 },
]

export function AnalisisNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-[112px] h-[calc(100vh-112px)] w-56 border-r border-border bg-card p-3">
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
