'use client'

import { useState } from 'react'
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
import { analisisVentas } from '@/data/analisis-ventas-mock'
import type { AnalisisVentasData } from '@/types/analisis-ventas'
import { BarChart, DonutChart, CHART_COLORS, fmt } from './charts'

const tabs = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'informe', label: 'Informe de ventas' },
] as const

type Tab = (typeof tabs)[number]['key']

export function VentasDashboard({ datos }: { datos?: AnalisisVentasData }) {
  const data = datos ?? analisisVentas
  const [tab, setTab] = useState<Tab>('resumen')

  const factData = data.facturacionMensual
  const albData = data.albaranesMensual
  const indicators = data.indicadoresTrabajo

  const productData = data.productos.map((p, i) => ({
    nombre: p.nombre,
    valor: p.ventasAnio,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Análisis &gt; Ventas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Indicadores económicos, facturación y rendimiento comercial
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

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
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

      {tab === 'resumen' && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Facturación */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Facturación</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Evolución pendiente vs cobrado</p>
              </div>
              <Button variant="ghost" className="text-xs">
                Detalles
              </Button>
            </CardHeader>
            <CardContent>
              <BarChart
                data={factData}
                keys={['pendiente', 'cobrado']}
                colors={['#8b5cf6', '#342764']}
              />
            </CardContent>
          </Card>

          {/* Totales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen anual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['1.º trimestre', '2.º trimestre', '3.º trimestre', '4.º trimestre'].map((label, i) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-foreground">{fmt(data.trimestres[i])}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Total anual</span>
                  <span className="text-sm font-bold text-primary">{fmt(data.totalAnual)}</span>
                </div>
                <Button variant="ghost" className="mt-2 h-auto p-0 text-xs text-accent hover:underline">
                  Detalles
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Albaranes por mes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Albaranes por mes</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Valor económico por estado</p>
            </CardHeader>
            <CardContent>
              <BarChart
                data={albData}
                keys={['facturados', 'almacenados', 'enviados']}
                colors={['#342764', '#6366f1', '#8b5cf6']}
              />
            </CardContent>
          </Card>

          {/* Indicadores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores de trabajos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {indicators.map((ind) => (
                <div key={ind.label} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{ind.label}</span>
                  <span className="text-sm font-bold text-primary">{fmt(ind.valor)}</span>
                  <span className="text-[11px] text-muted-foreground">{ind.trabajos} trabajos</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Albaranes del período */}
          <Card className="lg:col-span-3">
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Albaranes este mes</span>
                <span className="text-lg font-bold text-primary">{fmt(data.albaranesEsteMes)}</span>
                <span className="text-xs text-destructive">{data.variacionEsteMes} %</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Albaranes este año</span>
                <span className="text-lg font-bold text-primary">{fmt(data.albaranesEsteAnio)}</span>
                <span className="text-xs text-destructive">{data.variacionEsteAnio} %</span>
              </div>
            </CardContent>
          </Card>

          {/* Facturación por clientes */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Facturación por clientes</CardTitle>
              <Button variant="ghost" className="text-xs">
                Detalles
              </Button>
            </CardHeader>
            <CardContent>
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-primary">No hay datos sobre los que realizar el análisis</p>
              </div>
            </CardContent>
          </Card>

          {/* Ventas por producto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ventas por producto</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart data={productData} colors={CHART_COLORS} />
              <div className="mt-4 space-y-2">
                {data.productos.map((p) => (
                  <div key={p.nombre} className="flex items-center justify-between">
                    <span className="truncate text-xs text-foreground">{p.nombre}</span>
                    <span className={`text-xs font-medium ${p.diferencia >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {fmt(p.ventasAnio)} ({p.diferencia >= 0 ? '+' : ''}{p.diferencia}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
