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
import { analisisTrabajos } from '@/data/analisis-trabajos-mock'
import type { AnalisisTrabajosData } from '@/types/analisis-trabajos'
import { BarChart, DonutChart, CHART_COLORS, fmt } from '../analisis/charts'

const tabs = [
  { key: 'resumen', label: 'Resumen', href: '/analisis/trabajos' },
  { key: 'entradas', label: 'Entradas de trabajos', href: '/analisis/trabajos/entradas' },
  { key: 'desglose', label: 'Desglose por producto', href: '/analisis/trabajos/desglose' },
] as const

type Tab = (typeof tabs)[number]['key']

const estadoColors = ['#342764', '#ef4444', '#94a3b8']

function TrabajosDashboard({ datos }: { datos?: AnalisisTrabajosData }) {
  const pathname = usePathname()
  const router = useRouter()
  const basePrefix = pathname.startsWith('/laboratorio/analisis/trabajos') ? '/laboratorio/analisis/trabajos' : '/analisis/trabajos'
  const [tab, setTab] = useState<Tab>(() => {
    const match = tabs.find((t) => pathname.startsWith(basePrefix + t.href.replace('/analisis/trabajos', '')))
    return match?.key ?? 'resumen'
  })

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const target = tabs.find((t) => t.key === newTab)
    if (target) {
      router.push(basePrefix + target.href.replace('/analisis/trabajos', ''))
    }
  }

  const data = datos ?? analisisTrabajos

  const clientChartData = data.clientes.map((c, i) => ({
    nombre: c.nombre,
    valor: c.trabajosAnio,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const productChartData = data.productos.map((p, i) => ({
    nombre: p.nombre,
    valor: p.unidadesAnio,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Análisis &gt; Trabajos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Volumen de trabajos, entradas y demanda por cliente y producto
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

      {tab === 'resumen' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Entradas de trabajos</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Pendientes, entregados y otros por mes</p>
            </CardHeader>
            <CardContent>
              <BarChart
                data={data.entradasMensuales}
                keys={['pendientes', 'entregados', 'otros']}
                colors={estadoColors}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores por trimestre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.trimestres.map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{i + 1}º trimestre</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{fmt(item.trabajos)} trabajos</span>
                    <span className={`text-xs font-medium ${item.variacion >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {item.variacion >= 0 ? '+' : ''}{item.variacion} %
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Trabajos este mes</span>
                <span className="text-lg font-bold text-primary">{fmt(data.trabajosEsteMes)} trabajos</span>
                <span className={`text-xs ${data.variacionEsteMes >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionEsteMes >= 0 ? '+' : ''}{data.variacionEsteMes} %
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Trabajos este año</span>
                <span className="text-lg font-bold text-primary">{fmt(data.trabajosEsteAnio)} trabajos</span>
                <span className={`text-xs ${data.variacionEsteAnio >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionEsteAnio >= 0 ? '+' : ''}{data.variacionEsteAnio} %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Trabajos por cliente</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Distribución de trabajos por cliente</p>
              </div>
              <Button variant="ghost" className="text-xs">
                Detalles
              </Button>
            </CardHeader>
            <CardContent>
              <DonutChart data={clientChartData} colors={CHART_COLORS} />
              <div className="mt-4 space-y-2">
                {data.clientes.map((c) => (
                  <div key={c.codigo} className="flex items-center justify-between">
                    <span className="truncate text-xs text-foreground">
                      {c.codigo !== 'otros' ? `${c.codigo} - ` : ''}{c.nombre}
                    </span>
                    <span className={`text-xs font-medium ${c.diferencia >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {fmt(c.trabajosAnio)} trabajos ({c.diferencia >= 0 ? '+' : ''}{c.diferencia}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desglose por producto</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Unidades producidas por producto</p>
            </CardHeader>
            <CardContent>
              <DonutChart data={productChartData} colors={CHART_COLORS} />
              <div className="mt-4 space-y-2">
                {data.productos.map((p) => (
                  <div key={p.nombre} className="flex items-center justify-between">
                    <span className="truncate text-xs text-foreground">{p.nombre}</span>
                    <span className={`text-xs font-medium ${p.diferencia >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {fmt(p.unidadesAnio)} unid. ({p.diferencia >= 0 ? '+' : ''}{p.diferencia}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'entradas' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entradas de trabajos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Evolución mensual de entradas por estado</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={data.entradasMensuales}
              keys={['pendientes', 'entregados', 'otros']}
              colors={estadoColors}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.trimestres.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <span className="text-xs text-muted-foreground">{i + 1}º trimestre</span>
                  <p className="mt-1 text-xl font-bold text-primary">{fmt(item.trabajos)}</p>
                  <span className={`text-xs ${item.variacion >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    {item.variacion >= 0 ? '+' : ''}{item.variacion} %
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'desglose' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desglose por producto</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Unidades producidas y variación anual</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Trabajos este mes</span>
                <span className="text-lg font-bold text-primary">{fmt(data.trabajosEsteMes)} trabajos</span>
                <span className={`text-xs ${data.variacionEsteMes >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionEsteMes >= 0 ? '+' : ''}{data.variacionEsteMes} %
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Trabajos este año</span>
                <span className="text-lg font-bold text-primary">{fmt(data.trabajosEsteAnio)} trabajos</span>
                <span className={`text-xs ${data.variacionEsteAnio >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionEsteAnio >= 0 ? '+' : ''}{data.variacionEsteAnio} %
                </span>
              </div>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Producto</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Unid. año</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Dif.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.productos.map((p) => (
                    <tr key={p.nombre} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3 text-foreground">{p.nombre}</td>
                      <td className="px-4 py-3 font-medium text-primary">{fmt(p.unidadesAnio)}</td>
                      <td className={`px-4 py-3 text-xs font-medium ${p.diferencia >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {p.diferencia >= 0 ? '+' : ''}{p.diferencia} %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { TrabajosDashboard }
