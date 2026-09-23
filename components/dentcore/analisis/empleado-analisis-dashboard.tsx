'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, Download, ChevronDown } from 'lucide-react'
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
import { ControlAvanzadoDashboard } from './control-avanzado-dashboard'
import { BarChart, DonutChart, CHART_COLORS, fmt } from './charts'
import { analisisVentas } from '@/data/analisis-ventas-mock'

const tabs = [
  { key: 'resumen', label: 'Resumen', href: '/analisis' },
  { key: 'trabajos', label: 'Trabajos', href: '/analisis/trabajos' },
  { key: 'productividad', label: 'Productividad', href: '/analisis/productividad' },
  { key: 'calidad', label: 'Calidad', href: '/analisis/calidad' },
  { key: 'control', label: 'Control avanzado', href: '/analisis/control-avanzado' },
] as const

type Tab = (typeof tabs)[number]['key']

export function EmpleadoAnalisisDashboard() {
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
  const productData = ventas.productos.map((p, i) => ({
    nombre: p.nombre,
    valor: p.ventasAnio,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

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
                <ChevronDown className="size-3" />
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

      {tab === 'trabajos' && <TrabajosDashboard />}

      {tab === 'productividad' && <ProductividadDashboard />}

      {tab === 'calidad' && <CalidadDashboard />}

      {tab === 'control' && <ControlAvanzadoDashboard />}
    </div>
  )
}
