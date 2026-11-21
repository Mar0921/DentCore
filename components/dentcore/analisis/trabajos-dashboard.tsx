'use client'

import { useState, useEffect } from 'react'
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
import type { AnalisisTrabajosData, EntradaTrabajoMensual } from '@/types/analisis-trabajos'
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
  const [entradasReales, setEntradasReales] = useState<EntradaTrabajoMensual[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientesReales, setClientesReales] = useState<{ codigo: string; nombre: string; trabajosAnio: number; diferencia: number }[] | null>(null)
  const [totalClientes, setTotalClientes] = useState<number | null>(null)
  const [productosReales, setProductosReales] = useState<{ nombre: string; unidadesAnio: number; diferencia: number }[] | null>(null)
  const [totalProductos, setTotalProductos] = useState<number | null>(null)
  const [metricasReales, setMetricasReales] = useState<{ trabajosEsteMes: number; variacionEsteMes: number; trabajosEsteAnio: number; variacionEsteAnio: number } | null>(null)
  const [trimestresReales, setTrimestresReales] = useState<{ trabajos: number; variacion: number }[] | null>(null)

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const target = tabs.find((t) => t.key === newTab)
    if (target) {
      router.push(basePrefix + target.href.replace('/analisis/trabajos', ''))
    }
  }

  useEffect(() => {
    let cancelled = false
    async function cargarEntradas() {
      setLoading(true)
      try {
        const [resEntradas, resClientes, resProductos, resMetricas, resTrimestres] = await Promise.all([
          fetch('/api/analisis/trabajos', { cache: 'no-store' }),
          fetch('/api/analisis/trabajos/clientes', { cache: 'no-store' }),
          fetch('/api/analisis/trabajos/productos', { cache: 'no-store' }),
          fetch('/api/analisis/trabajos/metricas', { cache: 'no-store' }),
          fetch('/api/analisis/trabajos/trimestres', { cache: 'no-store' }),
        ])
        if (resEntradas.ok) {
          const json = await resEntradas.json()
          if (!cancelled && json.data?.entradasMensuales) {
            setEntradasReales(json.data.entradasMensuales)
          }
        }
        if (resClientes.ok) {
          const json = await resClientes.json()
          if (!cancelled && json.data?.clientes) {
            setClientesReales(json.data.clientes)
            setTotalClientes(json.data.total ?? 0)
          }
        }
        if (resProductos.ok) {
          const json = await resProductos.json()
          if (!cancelled && json.data?.productos) {
            setProductosReales(json.data.productos)
            setTotalProductos(json.data.total ?? 0)
          }
        }
        if (resMetricas.ok) {
          const json = await resMetricas.json()
          if (!cancelled && json.data) {
            setMetricasReales(json.data)
          }
        }
        if (resTrimestres.ok) {
          const json = await resTrimestres.json()
          if (!cancelled && json.data?.trimestres) {
            setTrimestresReales(json.data.trimestres)
          }
        }
      } catch {
        // silencioso: se usará el mock
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    cargarEntradas()
    return () => { cancelled = true }
  }, [])

  const data = datos ?? analisisTrabajos
  const entradasMensuales = loading ? data.entradasMensuales : (entradasReales ?? data.entradasMensuales)
  const clientes = clientesReales ?? data.clientes
  const total = totalClientes ?? data.clientes.reduce((acc, c) => acc + c.trabajosAnio, 0)
  const productos = productosReales ?? data.productos
  const totalProd = totalProductos ?? data.productos.reduce((acc, p) => acc + p.unidadesAnio, 0)
  const metricas = metricasReales ?? {
    trabajosEsteMes: data.trabajosEsteMes,
    variacionEsteMes: data.variacionEsteMes,
    trabajosEsteAnio: data.trabajosEsteAnio,
    variacionEsteAnio: data.variacionEsteAnio,
  }
  const trimestres = trimestresReales ?? data.trimestres

  const clientChartData = clientes.map((c, i) => ({
    nombre: c.nombre,
    valor: c.trabajosAnio,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const productChartData = productos.map((p, i) => ({
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
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Entradas de trabajos</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Pendientes, entregados y otros por mes</p>
            </CardHeader>
            <CardContent>
              <BarChart
                data={entradasMensuales}
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
              {trimestres.map((item, i) => (
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

          <Card className="lg:col-span-2">
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Trabajos este mes</span>
                <span className="text-lg font-bold text-primary">{fmt(metricas.trabajosEsteMes)} trabajos</span>
                <span className={`text-xs ${metricas.variacionEsteMes >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {metricas.variacionEsteMes >= 0 ? '+' : ''}{metricas.variacionEsteMes} %
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Trabajos este año</span>
                <span className="text-lg font-bold text-primary">{fmt(metricas.trabajosEsteAnio)} trabajos</span>
                <span className={`text-xs ${metricas.variacionEsteAnio >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {metricas.variacionEsteAnio >= 0 ? '+' : ''}{metricas.variacionEsteAnio} %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
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
              <div className="mb-4">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-primary">{fmt(total)} trabajos</span>
              </div>
              <DonutChart data={clientChartData} colors={CHART_COLORS} />
              <div className="mt-4 space-y-2">
                {clientes.map((c) => (
                  <div key={c.codigo} className="flex items-center justify-between">
                    <span className="truncate text-xs text-foreground">{c.nombre}</span>
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
              <div className="mb-4">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-primary">{fmt(totalProd)} unid.</span>
              </div>
              <DonutChart data={productChartData} colors={CHART_COLORS} />
              <div className="mt-4 space-y-2">
                {productos.map((p) => (
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
              data={entradasMensuales}
              keys={['pendientes', 'entregados', 'otros']}
              colors={estadoColors}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trimestres.map((item, i) => (
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
                  <span className="text-lg font-bold text-primary">{fmt(metricas.trabajosEsteMes)} trabajos</span>
                  <span className={`text-xs ${metricas.variacionEsteMes >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    {metricas.variacionEsteMes >= 0 ? '+' : ''}{metricas.variacionEsteMes} %
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Unidades este año</span>
                  <span className="text-lg font-bold text-primary">{fmt(totalProd)} unid.</span>
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
                    {productos.map((p) => (
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
