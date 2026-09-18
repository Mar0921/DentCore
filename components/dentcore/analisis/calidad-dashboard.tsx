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
import { analisisCalidad } from '@/data/analisis-calidad-mock'
import type { AnalisisCalidadData } from '@/types/analisis-calidad'
import { BarChart, DonutChart, LineChart, CHART_COLORS, fmt } from '../analisis/charts'

const tabs = [
  { key: 'resumen', label: 'Resumen', href: '/analisis/calidad' },
  { key: 'repeticiones', label: 'Repeticiones', href: '/analisis/calidad/repeticiones' },
  { key: 'retrasos', label: 'Retrasos', href: '/analisis/calidad/retrasos' },
  { key: 'incidencias', label: 'Incidencias', href: '/analisis/calidad/incidencias' },
  { key: 'evaluacion', label: 'Evaluación', href: '/analisis/calidad/evaluacion' },
] as const

type Tab = (typeof tabs)[number]['key']

const estadoColors = ['#342764', '#ef4444', '#94a3b8']

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

function CalidadDashboard({ datos }: { datos?: AnalisisCalidadData }) {
  const pathname = usePathname()
  const router = useRouter()
  const basePrefix = pathname.startsWith('/laboratorio/analisis/calidad') ? '/laboratorio/analisis/calidad' : '/analisis/calidad'
  const [tab, setTab] = useState<Tab>(() => {
    const match = tabs.find((t) => pathname.startsWith(basePrefix + t.href.replace('/analisis/calidad', '')))
    return match?.key ?? 'resumen'
  })

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const target = tabs.find((t) => t.key === newTab)
    if (target) {
      router.push(basePrefix + target.href.replace('/analisis/calidad', ''))
    }
  }

  const data = datos ?? analisisCalidad

  const repeticionesChart = data.repeticionesMensuales.map((r) => ({
    mes: r.mes,
    repetidos: r.repetidos,
  }))

  const pruebasChart = data.pruebasMensuales.map((p) => ({
    mes: p.mes,
    Aprobadas: p.aprobadas,
    Rechazadas: p.rechazadas,
  }))

  const retrasosChart = data.retrasosMensuales.map((r) => ({
    mes: r.mes,
    retrasoMedio: r.retrasoMedio,
  }))

  const incidenciasChart = data.incidencias.map((i, index) => ({
    nombre: i.tipo,
    valor: i.cantidad,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Análisis &gt; Calidad</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control de calidad, incidencias, retrasos y repeticiones
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
              <SeccionHeader titulo="Repeticiones" subtitulo="Trabajos repetidos por mes" />
            </CardHeader>
            <CardContent>
              <BarChart
                data={repeticionesChart}
                keys={['repetidos']}
                colors={estadoColors.slice(0, 1)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores de repeticiones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">N.º trabajos repetidos</span>
                <span className="text-lg font-bold text-primary">{fmt(data.trabajosRepetidos)}</span>
                <span className={`text-xs ${data.variacionRepeticiones >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionRepeticiones >= 0 ? '+' : ''}{data.variacionRepeticiones} %
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Porcentaje de repeticiones</span>
                <span className="text-lg font-bold text-primary">0%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <SeccionHeader titulo="Resultado de pruebas" subtitlo="Aprobadas vs rechazadas" />
            </CardHeader>
            <CardContent>
              <BarChart
                data={data.pruebasMensuales.map((p) => ({
                  mes: p.mes,
                  Aprobadas: p.aprobadas,
                  Rechazadas: p.rechazadas,
                }))}
                keys={['Aprobadas', 'Rechazadas']}
                colors={['#342764', '#ef4444']}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores de pruebas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Pruebas rechazadas</span>
                <span className="text-lg font-bold text-primary">{data.pruebasRechazadas}</span>
                <span className={`text-xs ${data.variacionPruebas >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionPruebas >= 0 ? '+' : ''}{data.variacionPruebas} %
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Porcentaje de pruebas rechazadas</span>
                <span className="text-lg font-bold text-primary">{data.porcentajePruebasRechazadas}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <SeccionHeader titulo="Incidencias" subtitulo="Distribución por tipo" />
            </CardHeader>
            <CardContent>
              <DonutChart data={incidenciasChart} colors={CHART_COLORS} />
              <div className="mt-4 space-y-2">
                {data.incidencias.map((inc) => (
                  <div key={inc.tipo} className="flex items-center justify-between">
                    <span className="truncate text-xs text-foreground">{inc.tipo}</span>
                    <span className="text-xs font-medium text-primary">{inc.cantidad}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores de incidencias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Incidencias nuevas</span>
                <span className="text-lg font-bold text-primary">{data.incidenciasNuevas}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Incidencias abiertas</span>
                <span className="text-lg font-bold text-primary">{data.incidenciasAbiertas}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <SeccionHeader titulo="Tareas retrasadas" subtitulo="Evolución del retraso medio en días" />
            </CardHeader>
            <CardContent>
              <LineChart
                data={retrasosChart}
                keys={['retrasoMedio']}
                colors={['#ef4444']}
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">N.º tareas retrasadas</span>
                  <span className="text-lg font-bold text-primary">{fmt(data.tareasRetrasadas)}</span>
                  <span className={`text-xs ${data.variacionRetrasos >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    {data.variacionRetrasos >= 0 ? '+' : ''}{data.variacionRetrasos} %
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Porcentaje de retrasos</span>
                  <span className="text-lg font-bold text-primary">{data.porcentajeRetrasos}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Retraso medio</span>
                  <span className="text-lg font-bold text-primary">
                    {data.retrasosMensuales.length > 0 ? `${data.retrasosMensuales[data.retrasosMensuales.length - 1].retrasoMedio} días` : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'repeticiones' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repeticiones</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Trabajos que tuvieron que repetirse</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={repeticionesChart}
              keys={['repetidos']}
              colors={estadoColors.slice(0, 1)}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">N.º trabajos repetidos</span>
                <span className="text-lg font-bold text-primary">{fmt(data.trabajosRepetidos)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Porcentaje de repeticiones</span>
                <span className="text-lg font-bold text-primary">0%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'retrasos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retrasos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Tareas entregadas fuera de tiempo</p>
          </CardHeader>
          <CardContent>
            <LineChart
              data={retrasosChart}
              keys={['retrasoMedio']}
              colors={['#ef4444']}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">N.º tareas retrasadas</span>
                <span className="text-lg font-bold text-primary">{fmt(data.tareasRetrasadas)}</span>
                <span className={`text-xs ${data.variacionRetrasos >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionRetrasos >= 0 ? '+' : ''}{data.variacionRetrasos} %
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Porcentaje de retrasos</span>
                <span className="text-lg font-bold text-primary">{data.porcentajeRetrasos}%</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Retraso medio</span>
                <span className="text-lg font-bold text-primary">
                  {data.retrasosMensuales.length > 0 ? `${data.retrasosMensuales[data.retrasosMensuales.length - 1].retrasoMedio} días` : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'incidencias' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incidencias</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Problemas registrados durante la producción</p>
          </CardHeader>
          <CardContent>
            <DonutChart data={incidenciasChart} colors={CHART_COLORS} />
            <div className="mt-4 space-y-2">
              {data.incidencias.map((inc) => (
                <div key={inc.tipo} className="flex items-center justify-between">
                  <span className="truncate text-xs text-foreground">{inc.tipo}</span>
                  <span className="text-xs font-medium text-primary">{inc.cantidad}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Incidencias nuevas</span>
                <span className="text-lg font-bold text-primary">{data.incidenciasNuevas}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Incidencias abiertas</span>
                <span className="text-lg font-bold text-primary">{data.incidenciasAbiertas}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'evaluacion' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evaluación</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Herramientas de evaluación de calidad</p>
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

export { CalidadDashboard }
