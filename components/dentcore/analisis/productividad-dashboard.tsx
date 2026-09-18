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
import { analisisProductividad } from '@/data/analisis-productividad-mock'
import type { AnalisisProductividadData } from '@/types/analisis-productividad'
import { BarChart, DonutChart, LineChart, CHART_COLORS, fmt } from '../analisis/charts'

const tabs = [
  { key: 'resumen', label: 'Resumen', href: '/analisis/productividad' },
  { key: 'tareas', label: 'Tareas realizadas', href: '/analisis/productividad/tareas' },
  { key: 'tecnicos', label: 'Técnicos', href: '/analisis/productividad/tecnicos' },
  { key: 'maquinas', label: 'Máquinas', href: '/analisis/productividad/maquinas' },
  { key: 'externalizaciones', label: 'Externalizaciones', href: '/analisis/productividad/externalizaciones' },
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

function ProductividadDashboard({ datos }: { datos?: AnalisisProductividadData }) {
  const pathname = usePathname()
  const router = useRouter()
  const basePrefix = pathname.startsWith('/laboratorio/analisis/productividad') ? '/laboratorio/analisis/productividad' : '/analisis/productividad'
  const [tab, setTab] = useState<Tab>(() => {
    const match = tabs.find((t) => pathname.startsWith(basePrefix + t.href.replace('/analisis/productividad', '')))
    return match?.key ?? 'resumen'
  })

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const target = tabs.find((t) => t.key === newTab)
    if (target) {
      router.push(basePrefix + target.href.replace('/analisis/productividad', ''))
    }
  }

  const data = datos ?? analisisProductividad

  const tecnicosChart = data.empleados.map((e, i) => ({
    nombre: e.nombre,
    valor: e.tareas,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const maquinasChart = data.maquinas.map((m, i) => ({
    nombre: m.nombre,
    valor: m.tareas,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const externalChart = data.externalizaciones.map((e, i) => ({
    nombre: e.nombre,
    valor: e.tareas,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Análisis &gt; Productividad</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rendimiento del laboratorio, técnicos, máquinas y externalizaciones
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
              <SeccionHeader titulo="Tareas realizadas" subtitulo="Evolución mensual de tareas y piezas" />
            </CardHeader>
            <CardContent>
              <LineChart
                data={data.tareasMensuales}
                keys={['tareas', 'piezas']}
                colors={['#342764', '#6366f1']}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicadores anuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">N.º tareas año</span>
                <span className="text-lg font-bold text-primary">{fmt(data.tareasAnio)}</span>
                <span className={`text-xs ${data.variacionTareas >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionTareas >= 0 ? '+' : ''}{data.variacionTareas} %
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">N.º piezas año</span>
                <span className="text-lg font-bold text-primary">{fmt(data.piezasAnio)}</span>
                <span className={`text-xs ${data.variacionPiezas >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionPiezas >= 0 ? '+' : ''}{data.variacionPiezas} %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <SeccionHeader titulo="Técnicos" subtitulo="Distribución de tareas por empleado" />
            </CardHeader>
            <CardContent>
              <DonutChart data={tecnicosChart} colors={CHART_COLORS} />
              <div className="mt-4 space-y-2">
                {data.empleados.map((e) => (
                  <div key={e.nombre} className="flex items-center justify-between">
                    <span className="truncate text-xs text-foreground">{e.nombre}</span>
                    <span className="text-xs font-medium text-primary">{fmt(e.tareas)} tareas</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SeccionHeader titulo="Máquinas" subtitulo="Tareas por máquina" />
            </CardHeader>
            <CardContent>
              <DonutChart data={maquinasChart} colors={CHART_COLORS} />
              <div className="mt-4 space-y-2">
                {data.maquinas.map((m) => (
                  <div key={m.nombre} className="flex items-center justify-between">
                    <span className="truncate text-xs text-foreground">{m.nombre}</span>
                    <span className="text-xs font-medium text-primary">{fmt(m.tareas)} tareas</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <SeccionHeader titulo="Externalizaciones" subtitulo="Tareas enviadas a proveedores externos" />
            </CardHeader>
            <CardContent>
              <DonutChart data={externalChart} colors={CHART_COLORS} />
              <div className="mt-4 space-y-2">
                {data.externalizaciones.map((e) => (
                  <div key={e.nombre} className="flex items-center justify-between">
                    <span className="truncate text-xs text-foreground">{e.nombre}</span>
                    <span className="text-xs font-medium text-primary">{fmt(e.tareas)} tareas</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'tareas' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tareas realizadas</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Evolución mensual de tareas y piezas</p>
          </CardHeader>
          <CardContent>
            <LineChart
              data={data.tareasMensuales}
              keys={['tareas', 'piezas']}
              colors={['#342764', '#6366f1']}
              height={260}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">N.º tareas año</span>
                <span className="text-lg font-bold text-primary">{fmt(data.tareasAnio)}</span>
                <span className={`text-xs ${data.variacionTareas >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionTareas >= 0 ? '+' : ''}{data.variacionTareas} %
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">N.º piezas año</span>
                <span className="text-lg font-bold text-primary">{fmt(data.piezasAnio)}</span>
                <span className={`text-xs ${data.variacionPiezas >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {data.variacionPiezas >= 0 ? '+' : ''}{data.variacionPiezas} %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'tecnicos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Técnicos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Rendimiento por empleado</p>
          </CardHeader>
          <CardContent>
            <DonutChart data={tecnicosChart} colors={CHART_COLORS} />
            <div className="mt-4 space-y-2">
              {data.empleados.map((e) => (
                <div key={e.nombre} className="flex items-center justify-between">
                  <span className="truncate text-xs text-foreground">{e.nombre}</span>
                  <span className="text-xs font-medium text-primary">{fmt(e.tareas)} tareas</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'maquinas' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Máquinas</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Tareas por máquina</p>
          </CardHeader>
          <CardContent>
            <DonutChart data={maquinasChart} colors={CHART_COLORS} />
            <div className="mt-4 space-y-2">
              {data.maquinas.map((m) => (
                <div key={m.nombre} className="flex items-center justify-between">
                  <span className="truncate text-xs text-foreground">{m.nombre}</span>
                  <span className="text-xs font-medium text-primary">{fmt(m.tareas)} tareas</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'externalizaciones' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Externalizaciones</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Tareas enviadas a proveedores externos</p>
          </CardHeader>
          <CardContent>
            <DonutChart data={externalChart} colors={CHART_COLORS} />
            <div className="mt-4 space-y-2">
              {data.externalizaciones.map((e) => (
                <div key={e.nombre} className="flex items-center justify-between">
                  <span className="truncate text-xs text-foreground">{e.nombre}</span>
                  <span className="text-xs font-medium text-primary">{fmt(e.tareas)} tareas</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { ProductividadDashboard }
