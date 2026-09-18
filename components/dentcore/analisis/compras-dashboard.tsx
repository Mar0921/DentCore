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
import { analisisCompras } from '@/data/analisis-compras-mock'
import type { AnalisisComprasData } from '@/types/analisis-compras'

const tabs = [
  { key: 'resumen', label: 'Resumen', href: '/analisis/compras' },
  { key: 'gastos', label: 'Gastos', href: '/analisis/compras/gastos' },
  { key: 'pedidos', label: 'Pedidos', href: '/analisis/compras/pedidos' },
  { key: 'informe', label: 'Informe de compras', href: '/analisis/compras/informe' },
  { key: 'inventario', label: 'Inventario', href: '/analisis/compras/inventario' },
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

function EmptyState({ mensaje = 'No hay datos sobre los que realizar el análisis' }: { mensaje?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-primary">{mensaje}</p>
    </div>
  )
}

function ComprasDashboard({ datos }: { datos?: AnalisisComprasData }) {
  const pathname = usePathname()
  const router = useRouter()
  const basePrefix = pathname.startsWith('/laboratorio/analisis/compras')
    ? '/laboratorio/analisis/compras'
    : '/analisis/compras'
  const [tab, setTab] = useState<Tab>(() => {
    const match = tabs.find((t) => pathname.startsWith(basePrefix + t.href.replace('/analisis/compras', '')))
    return match?.key ?? 'resumen'
  })

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const target = tabs.find((t) => t.key === newTab)
    if (target) {
      router.push(basePrefix + target.href.replace('/analisis/compras', ''))
    }
  }

  const data = datos ?? analisisCompras

  const gastosChart = data.gastosMensuales.map((g) => ({
    mes: g.mes,
    Pendiente: g.pendiente,
    Pagado: g.pagado,
  }))

  const pedidosChart = data.pedidosMensuales.map((p) => ({
    mes: p.mes,
    Facturados: p.facturados,
    Recibidos: p.recibidos,
    'En proceso': p.enProceso,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Análisis &gt; Compras</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gastos, pedidos, proveedores e inventario
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
              <SeccionHeader titulo="Gastos" subtitulo="Pendiente vs pagado" />
            </CardHeader>
            <CardContent>
              <BarChart
                data={gastosChart}
                keys={['Pendiente', 'Pagado']}
                colors={['#94a3b8', '#342764']}
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.gastosTrimestrales.map((t) => (
                  <div key={t.trimestre} className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{t.trimestre}</span>
                    <span className="text-lg font-bold text-primary">{fmt(t.total)}</span>
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Total anual</span>
                  <span className="text-lg font-bold text-primary">{fmt(data.totalAnual)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores de gastos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Pendiente</span>
                <span className="text-lg font-bold text-primary">
                  {fmt(data.gastosMensuales.reduce((acc, g) => acc + g.pendiente, 0))}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Pagado</span>
                <span className="text-lg font-bold text-primary">
                  {fmt(data.gastosMensuales.reduce((acc, g) => acc + g.pagado, 0))}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Total anual</span>
                <span className="text-lg font-bold text-primary">{fmt(data.totalAnual)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <SeccionHeader titulo="Pedidos por mes" subtitulo="Facturados, recibidos y en proceso" />
            </CardHeader>
            <CardContent>
              <BarChart
                data={pedidosChart}
                keys={['Facturados', 'Recibidos', 'En proceso']}
                colors={['#342764', '#10b981', '#f59e0b']}
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.pedidosEstados.map((p) => (
                  <div key={p.estado} className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{p.estado}</span>
                    <span className="text-lg font-bold text-primary">{fmt(p.importe)}</span>
                    <span className="text-xs text-muted-foreground">{p.cantidad} pedidos</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Pedidos este mes</span>
                  <span className="text-lg font-bold text-primary">{fmt(data.pedidosEsteMes)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Pedidos este año</span>
                  <span className="text-lg font-bold text-primary">{fmt(data.pedidosEsteAnio)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <SeccionHeader titulo="Gastos por proveedor" subtitulo="Distribución de gastos" />
            </CardHeader>
            <CardContent>
              {data.proveedores.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <DonutChart
                    data={data.proveedores.map((p, i) => ({
                      nombre: p.proveedor,
                      valor: p.total,
                      color: CHART_COLORS[i % CHART_COLORS.length],
                    }))}
                    colors={CHART_COLORS}
                  />
                  <div className="mt-4 space-y-2">
                    {data.proveedores.map((p) => (
                      <div key={p.proveedor} className="flex items-center justify-between">
                        <span className="truncate text-xs text-foreground">{p.proveedor}</span>
                        <span className="text-xs font-medium text-primary">{fmt(p.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores de proveedores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Proveedores activos</span>
                <span className="text-lg font-bold text-primary">{data.proveedores.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Total proveedores</span>
                <span className="text-lg font-bold text-primary">{data.proveedores.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <SeccionHeader titulo="Compras por material" subtitulo="Distribución por tipo de material" />
            </CardHeader>
            <CardContent>
              {data.materiales.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <DonutChart
                    data={data.materiales.map((m, i) => ({
                      nombre: m.material,
                      valor: m.total,
                      color: CHART_COLORS[i % CHART_COLORS.length],
                    }))}
                    colors={CHART_COLORS}
                  />
                  <div className="mt-4 space-y-2">
                    {data.materiales.map((m) => (
                      <div key={m.material} className="flex items-center justify-between">
                        <span className="truncate text-xs text-foreground">{m.material}</span>
                        <span className="text-xs font-medium text-primary">{fmt(m.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'gastos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Evolución de gastos pendientes y pagados</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={gastosChart}
              keys={['Pendiente', 'Pagado']}
              colors={['#94a3b8', '#342764']}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.gastosTrimestrales.map((t) => (
                <div key={t.trimestre} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{t.trimestre}</span>
                  <span className="text-lg font-bold text-primary">{fmt(t.total)}</span>
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Total anual</span>
                <span className="text-lg font-bold text-primary">{fmt(data.totalAnual)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'pedidos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Evolución de pedidos por estado</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={pedidosChart}
              keys={['Facturados', 'Recibidos', 'En proceso']}
              colors={['#342764', '#10b981', '#f59e0b']}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.pedidosEstados.map((p) => (
                <div key={p.estado} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{p.estado}</span>
                  <span className="text-lg font-bold text-primary">{fmt(p.importe)}</span>
                  <span className="text-xs text-muted-foreground">{p.cantidad} pedidos</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Pedidos este mes</span>
                <span className="text-lg font-bold text-primary">{fmt(data.pedidosEsteMes)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Pedidos este año</span>
                <span className="text-lg font-bold text-primary">{fmt(data.pedidosEsteAnio)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'informe' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informe de compras</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Generación y consulta de informes de compras</p>
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

      {tab === 'inventario' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventario</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Control de materiales y existencias</p>
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
    </div>
  )
}

export { ComprasDashboard }
