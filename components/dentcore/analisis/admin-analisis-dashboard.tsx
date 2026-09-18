'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { VentasDashboard } from './ventas-dashboard'
import { TrabajosDashboard } from './trabajos-dashboard'
import { ProductividadDashboard } from './productividad-dashboard'
import { CalidadDashboard } from './calidad-dashboard'
import { ComprasDashboard } from './compras-dashboard'
import { ControlAvanzadoDashboard } from './control-avanzado-dashboard'
import { analisisVentas } from '@/data/analisis-ventas-mock'

const tabs = [
  { key: 'resumen', label: 'Resumen', href: '/laboratorio/analisis/ventas' },
  { key: 'trabajos', label: 'Trabajos', href: '/laboratorio/analisis/trabajos' },
  { key: 'productividad', label: 'Productividad', href: '/laboratorio/analisis/productividad' },
  { key: 'calidad', label: 'Calidad', href: '/laboratorio/analisis/calidad' },
  { key: 'compras', label: 'Compras', href: '/laboratorio/analisis/compras' },
  { key: 'control', label: 'Control avanzado', href: '/laboratorio/analisis/control-avanzado' },
] as const

type Tab = (typeof tabs)[number]['key']

export function AdminAnalisisDashboard() {
  const pathname = usePathname()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(() => {
    const match = tabs.find((t) => pathname.startsWith(t.href))
    return match?.key ?? 'resumen'
  })

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const target = tabs.find((t) => t.key === newTab)
    if (target) {
      router.push(target.href)
    }
  }

  const ventas = analisisVentas

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Análisis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Indicadores generales del laboratorio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="gap-2">
                <MoreHorizontal className="size-4" />
                Acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="size-4" />
                Exportar informe
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="size-4" />
                Ver detalles
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && <VentasDashboard />}

      {tab === 'trabajos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análisis de trabajos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Volumen y estados de trabajos</p>
          </CardHeader>
          <CardContent>
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-primary">Próximamente</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Este módulo se encuentra en desarrollo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'productividad' && <ProductividadDashboard />}

      {tab === 'calidad' && <CalidadDashboard />}

      {tab === 'compras' && <ComprasDashboard />}

      {tab === 'control' && <ControlAvanzadoDashboard />}
    </div>
  )
}
