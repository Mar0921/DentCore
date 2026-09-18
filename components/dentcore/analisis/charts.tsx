'use client'

import { cn } from '@/lib/utils'

const CHART_COLORS = ['#342764', '#6366f1', '#8b5cf6', '#a78bfa']

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO').format(n)
}

export function BarChart({
  data,
  keys,
  colors,
  height = 180,
}: {
  data: { mes: string; [key: string]: number | string }[]
  keys: string[]
  colors: string[]
  height?: number
}) {
  const max = Math.max(...data.flatMap((d) => keys.map((k) => Number(d[k] as number)))) || 1

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        {data.map((item, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end gap-0.5" style={{ height }}>
              {keys.map((k, j) => {
                const value = Number(item[k] as number)
                const h = Math.max((value / max) * height, 2)
                return (
                  <div
                    key={k}
                    className="flex-1 rounded-t"
                    style={{
                      height: h,
                      backgroundColor: colors[j],
                    }}
                  />
                )
              })}
            </div>
            <span className="text-[10px] text-muted-foreground">{item.mes}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4">
        {keys.map((k, i) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: colors[i] }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </span>
        ))}
      </div>
    </div>
  )
}

export function DonutChart({ data, colors }: { data: { nombre: string; valor: number; color: string }[] }) {
  const total = data.reduce((acc, d) => acc + d.valor, 0) || 1
  let cumulative = 0

  const segments = data.map((d) => {
    const start = cumulative
    const pct = d.valor / total
    cumulative += pct
    return { ...d, start, pct }
  })

  return (
    <div className="flex items-center gap-6">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 36 36" className="size-full -rotate-90">
          {segments.map((s, i) => {
            const dashArray = `${s.pct * 100} ${100 - s.pct * 100}`
            const dashOffset = 25 - s.start * 100
            return (
              <circle
                key={i}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="3"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold text-primary">{fmt(total)}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <span key={d.nombre} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-foreground">{d.nombre}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export { CHART_COLORS, fmt }

export function LineChart({
  data,
  keys,
  colors,
  height = 180,
}: {
  data: { mes: string; [key: string]: number | string }[]
  keys: string[]
  colors: string[]
  height?: number
}) {
  const width = 100
  const max = Math.max(...data.flatMap((d) => keys.map((k) => Number(d[k] as number)))) || 1
  const step = width / Math.max(data.length - 1, 1)

  const points = keys.map((key) =>
    data
      .map((d, i) => {
        const value = Number(d[key] as number)
        const x = i * step
        const y = height - (value / max) * height
        return `${x},${y}`
      })
      .join(' '),
  )

  return (
    <div className="space-y-3">
      <div className="relative" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="size-full" preserveAspectRatio="none">
          {keys.map((key, i) => (
            <polyline
              key={key}
              fill="none"
              stroke={colors[i]}
              strokeWidth="2"
              points={points[i]}
            />
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex justify-between">
          {data.map((item) => (
            <span key={item.mes} className="text-[10px] text-muted-foreground">
              {item.mes}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        {keys.map((k, i) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: colors[i] }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </span>
        ))}
      </div>
    </div>
  )
}
