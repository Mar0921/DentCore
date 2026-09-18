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
import { BarChart, DonutChart, LineChart, CHART_COLORS, fmt } from '../analisis/charts'
import { analisisControlAvanzado } from '@/data/analisis-control-avanzado-mock'
import type { AnalisisControlAvanzadoData } from '@/types/analisis-control-avanzado'

const tabs = [
  { key: 'resumen', label: 'Resumen', href: '/analisis/control-avanzado' },
  { key: 'balance', label: 'Balance económico', href: '/analisis/control-avanzado/balance' },
  { key: 'productos', label: 'Análisis de productos', href: '/analisis/control-avanzado/productos' },
  { key: 'clientes', label: 'Análisis de clientes', href: '/analisis/control-avanzado/clientes' },
  { key: 'costos', label: 'Desglose de costos', href: '/analisis/control-avanzado/costos' },
] as const

type Tab = (typeof tabs)[number]['key']

function SeccionHeader({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-base">{titulo}</CardTitle>
        {subtitulo && <p className="mt-1 text-xs text-muted-foreground">{subtitulo}</p>}
      </div>
      <Button variant="ghost" className="text-xs">
        Detalles
      </Button>
    </div>
  )
}

function ControlAvanzadoDashboard({ datos }: { datos?: AnalisisControlAvanzadoData }) {
  const pathname = usePathname()
  const router = useRouter()
  const basePrefix = pathname.startsWith('/laboratorio/analisis/control-avanzado')
    ? '/laboratorio/analisis/control-avanzado'
    : '/analisis/control-avanzado'
  const [tab, setTab] = useState<Tab>(() => {
    const match = tabs.find((t) => pathname.startsWith(basePrefix + t.href.replace('/analisis/control-avanzado', '')))
    return match?.key ?? 'resumen'
  })

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const target = tabs.find((t) => t.key === newTab)
    if (target) {
      router.push(basePrefix + target.href.replace('/analisis/control-avanzado', ''))
    }
  }

  const data = datos ?? analisisControlAvanzado

  const balanceChart = data.trimestres.map((t) => ({
    mes: t.trimestre,
    'Ventas sin impuestos': t.ventasSinImpuestos,
    'Compras sin impuestos': t.comprasSinImpuestos,
    'Gastos asociados al IVA': t.gastosIva,
  }))

  const productosChart = data.productos.map((p) => ({
    producto: p.producto,
    Ventas: p.ventas,
    Coste: p.coste,
    Margen: p.margen,
  }))

  const clientesChart = data.clientes.map((c, i) => ({
    nombre: c.estado,
    valor: c.cantidad,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const costosChart = data.costosProduccion.map((c) => ({
    concepto: c.concepto,
    total: c.total,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Análisis &gt; Control avanzado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Análisis estratégico y financiero del laboratorio
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
              <SeccionHeader titulo="Balance económico" subtitulo="Ventas, compras y gastos por trimestre" />
            </CardHeader>
            <CardContent>
              <BarChart
                data={balanceChart}
                keys={['Ventas sin impuestos', 'Compras sin impuestos', 'Gastos asociados al IVA']}
                colors={['#342764', '#94a3b8', '#ef4444']}
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Ventas sin impuestos</span>
                  <span className="text-lg font-bold text-primary">{fmt(data.totalAnual.ventasSinImpuestos)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Compras sin impuestos</span>
                  <span className="text-lg font-bold text-primary">{fmt(data.totalAnual.comprasSinImpuestos)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Gastos asociados al IVA</span>
                  <span className="text-lg font-bold text-primary">{fmt(data.totalAnual.gastosIva)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores económicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Balance neto</span>
                <span className="text-lg font-bold text-primary">
                  {fmt(data.totalAnual.ventasSinImpuestos - data.totalAnual.comprasSinImpuestos)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Margen bruto</span>
                <span className="text-lg font-bold text-primary">
                  {fmt(data.productos.reduce((acc, p) => acc + p.margen, 0))}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Costos de producción</span>
                <span className="text-lg font-bold text-primary">
                  {fmt(data.costosProduccion.reduce((acc, c) => acc + c.total, 0))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <SeccionHeader titulo="Análisis de productos" subtitulo="Rendimiento económico por producto" />
            </CardHeader>
            <CardContent>
              <BarChart
                data={productosChart}
                keys={['Ventas', 'Coste', 'Margen']}
                colors={['#342764', '#94a3b8', '#10b981']}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores de productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.productos.map((p) => (
                <div key={p.producto} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{p.producto}</span>
                  <span className="text-lg font-bold text-primary">{fmt(p.ventas)}</span>
                  <span className="text-xs text-muted-foreground">Margen: {fmt(p.margen)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <SeccionHeader titulo="Análisis de clientes" subtitulo="Distribución por estado" />
            </CardHeader>
            <CardContent>
              <DonutChart data={clientesChart} colors={CHART_COLORS} />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.clientes.map((c) => (
                  <div key={c.estado} className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{c.estado}</span>
                    <span className="text-lg font-bold text-primary">{c.cantidad}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'balance' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance económico</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Ventas, compras y gastos asociados al IVA</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={balanceChart}
              keys={['Ventas sin impuestos', 'Compras sin impuestos', 'Gastos asociados al IVA']}
              colors={['#342764', '#94a3b8', '#ef4444']}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Ventas sin impuestos</span>
                <span className="text-lg font-bold text-primary">{fmt(data.totalAnual.ventasSinImpuestos)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Compras sin impuestos</span>
                <span className="text-lg font-bold text-primary">{fmt(data.totalAnual.comprasSinImpuestos)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Gastos asociados al IVA</span>
                <span className="text-lg font-bold text-primary">{fmt(data.totalAnual.gastosIva)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'productos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análisis de productos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Comportamiento y rendimiento económico por producto</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={productosChart}
              keys={['Ventas', 'Coste', 'Margen']}
              colors={['#342764', '#94a3b8', '#10b981']}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {data.productos.map((p) => (
                <div key={p.producto} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{p.producto}</span>
                  <span className="text-lg font-bold text-primary">{fmt(p.ventas)}</span>
                  <span className="text-xs text-muted-foreground">Margen: {fmt(p.margen)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'clientes' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análisis de clientes</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Distribución de clientes por estado</p>
          </CardHeader>
          <CardContent>
            <DonutChart data={clientesChart} colors={CHART_COLORS} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.clientes.map((c) => (
                <div key={c.estado} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{c.estado}</span>
                  <span className="text-lg font-bold text-primary">{c.cantidad}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'costos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desglose de costos de producción</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Costos relacionados con la fabricación de trabajos</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={costosChart}
              keys={['total']}
              colors={['#342764']}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.costosProduccion.map((c) => (
                <div key={c.concepto} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{c.concepto}</span>
                  <span className="text-lg font-bold text-primary">{fmt(c.total)}</span>
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Total costos</span>
                <span className="text-lg font-bold text-primary">
                  {fmt(data.costosProduccion.reduce((acc, c) => acc + c.total, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { ControlAvanzadoDashboard }
