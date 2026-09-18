'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ToothStatus } from './solicitud-types'

type ToothType = 'molar' | 'premolar' | 'canine' | 'incisor'

interface ToothData {
  num: number
  x: number
  y: number
  type: ToothType
  labelX: number
  labelY: number
}

const STATUS_CONFIG: Record<
  ToothStatus,
  { label: string; fill: string; stroke: string }
> = {
  normal: { label: 'Normal', fill: '#8BC34A', stroke: '#558b2f' },
  ausencia: { label: 'Ausencia', fill: 'white', stroke: '#ef4444' },
  implante: { label: 'Implante', fill: '#93C5FD', stroke: '#2563EB' },
  pilar: { label: 'Pilar', fill: '#FDE68A', stroke: '#D97706' },
}

interface DentalChartProps {
  selectedTeeth: number[]
  toothStatuses: Record<number, 'normal' | 'ausencia' | 'implante' | 'pilar'>
  onToothSelect: (toothNumber: number) => void
  onToothStatusChange: (toothNumber: number, status: 'normal' | 'ausencia' | 'implante' | 'pilar') => void
  onToothStatusClear: (toothNumber: number) => void
}

function ToothStatusIcon({
  status,
  x,
  y,
  size,
  strokeWidth,
}: {
  status: ToothStatus
  x: number
  y: number
  size: number
  strokeWidth: number
}) {
  if (status === 'normal') return null

  if (status === 'ausencia') {
    return (
      <path
        d={`M ${x - size} ${y - size} L ${x + size} ${y + size} M ${x + size} ${y - size} L ${x - size} ${y + size}`}
        stroke={STATUS_CONFIG.ausencia.stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    )
  }

  if (status === 'implante') {
    return (
      <g stroke={STATUS_CONFIG.implante.stroke} strokeWidth={strokeWidth} strokeLinecap="round">
        <line x1={x} y1={y - size} x2={x} y2={y + size} />
        <line x1={x - size * 0.65} y1={y - size * 0.5} x2={x + size * 0.65} y2={y - size * 0.5} />
        <line x1={x - size * 0.65} y1={y + size * 0.5} x2={x + size * 0.65} y2={y + size * 0.5} />
      </g>
    )
  }

  return (
    <g stroke={STATUS_CONFIG.pilar.stroke} strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1={x - size} y1={y} x2={x + size} y2={y} />
      <line x1={x} y1={y - size} x2={x} y2={y + size} />
    </g>
  )
}

export function DentalChart({
  selectedTeeth,
  toothStatuses,
  onToothSelect,
  onToothStatusChange,
  onToothStatusClear,
}: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)

  const selectedTeethSet = useMemo(() => new Set(selectedTeeth), [selectedTeeth])

  const upperRightTeeth: ToothData[] = [
    { num: 18, x: 45, y: 95, type: 'molar', labelX: 25, labelY: 95 },
    { num: 17, x: 58, y: 78, type: 'molar', labelX: 40, labelY: 72 },
    { num: 16, x: 70, y: 62, type: 'molar', labelX: 52, labelY: 54 },
    { num: 15, x: 82, y: 48, type: 'premolar', labelX: 66, labelY: 40 },
    { num: 14, x: 94, y: 38, type: 'premolar', labelX: 80, labelY: 28 },
    { num: 13, x: 108, y: 28, type: 'canine', labelX: 95, labelY: 16 },
    { num: 12, x: 122, y: 22, type: 'incisor', labelX: 112, labelY: 8 },
    { num: 11, x: 138, y: 20, type: 'incisor', labelX: 132, labelY: 5 },
  ]

  const upperLeftTeeth: ToothData[] = [
    { num: 21, x: 162, y: 20, type: 'incisor', labelX: 168, labelY: 5 },
    { num: 22, x: 178, y: 22, type: 'incisor', labelX: 188, labelY: 8 },
    { num: 23, x: 192, y: 28, type: 'canine', labelX: 205, labelY: 16 },
    { num: 24, x: 206, y: 38, type: 'premolar', labelX: 220, labelY: 28 },
    { num: 25, x: 218, y: 48, type: 'premolar', labelX: 234, labelY: 40 },
    { num: 26, x: 230, y: 62, type: 'molar', labelX: 248, labelY: 54 },
    { num: 27, x: 242, y: 78, type: 'molar', labelX: 260, labelY: 72 },
    { num: 28, x: 255, y: 95, type: 'molar', labelX: 275, labelY: 95 },
  ]

  const lowerRightTeeth: ToothData[] = [
    { num: 48, x: 45, y: 175, type: 'molar', labelX: 25, labelY: 175 },
    { num: 47, x: 58, y: 192, type: 'molar', labelX: 38, labelY: 200 },
    { num: 46, x: 72, y: 208, type: 'molar', labelX: 52, labelY: 218 },
    { num: 45, x: 86, y: 222, type: 'premolar', labelX: 68, labelY: 234 },
    { num: 44, x: 100, y: 234, type: 'premolar', labelX: 84, labelY: 248 },
    { num: 43, x: 114, y: 244, type: 'canine', labelX: 100, labelY: 260 },
    { num: 42, x: 130, y: 250, type: 'incisor', labelX: 120, labelY: 268 },
    { num: 41, x: 144, y: 254, type: 'incisor', labelX: 140, labelY: 272 },
  ]

  const lowerLeftTeeth: ToothData[] = [
    { num: 31, x: 156, y: 254, type: 'incisor', labelX: 160, labelY: 272 },
    { num: 32, x: 170, y: 250, type: 'incisor', labelX: 180, labelY: 268 },
    { num: 33, x: 186, y: 244, type: 'canine', labelX: 200, labelY: 260 },
    { num: 34, x: 200, y: 234, type: 'premolar', labelX: 216, labelY: 248 },
    { num: 35, x: 214, y: 222, type: 'premolar', labelX: 232, labelY: 234 },
    { num: 36, x: 228, y: 208, type: 'molar', labelX: 248, labelY: 218 },
    { num: 37, x: 242, y: 192, type: 'molar', labelX: 262, labelY: 200 },
    { num: 38, x: 255, y: 175, type: 'molar', labelX: 275, labelY: 175 },
  ]

  const getToothPath = (x: number, y: number, type: ToothType): string => {
    switch (type) {
      case 'molar':
        return `M ${x - 10} ${y - 8} Q ${x - 12} ${y} ${x - 10} ${y + 8} Q ${x} ${y + 12} ${x + 10} ${y + 8} Q ${x + 12} ${y} ${x + 10} ${y - 8} Q ${x} ${y - 12} ${x - 10} ${y - 8} Z`
      case 'premolar':
        return `M ${x - 7} ${y - 6} Q ${x - 9} ${y} ${x - 7} ${y + 6} Q ${x} ${y + 9} ${x + 7} ${y + 6} Q ${x + 9} ${y} ${x + 7} ${y - 6} Q ${x} ${y - 9} ${x - 7} ${y - 6} Z`
      case 'canine':
        return `M ${x} ${y - 10} Q ${x + 6} ${y - 4} ${x + 5} ${y + 6} Q ${x} ${y + 10} ${x - 5} ${y + 6} Q ${x - 6} ${y - 4} ${x} ${y - 10} Z`
      case 'incisor':
        return `M ${x - 4} ${y - 8} L ${x + 4} ${y - 8} Q ${x + 6} ${y} ${x + 5} ${y + 8} Q ${x} ${y + 10} ${x - 5} ${y + 8} Q ${x - 6} ${y} ${x - 4} ${y - 8} Z`
      default:
        return ''
    }
  }

  const handleToothClick = (toothNumber: number) => {
    onToothSelect(toothNumber)
    setSelectedTooth(toothNumber)
  }

  const selectedToothStatus = selectedTooth ? toothStatuses?.[selectedTooth] : undefined

  return (
    <div className="flex flex-col items-center w-full" suppressHydrationWarning>
      <div className="flex w-full max-w-[300px] text-[10px] font-bold text-muted-foreground mb-1">
        <span className="flex-1 text-center">DERECHO</span>
        <span className="flex-1 text-center">IZQUIERDO</span>
      </div>

      <svg viewBox="0 0 300 280" className="w-full max-w-[300px] h-auto">
        <line x1="150" y1="0" x2="150" y2="280" stroke="#ccc" strokeWidth="1" strokeDasharray="4,4" />
        <line x1="30" y1="135" x2="270" y2="135" stroke="#ccc" strokeWidth="1" strokeDasharray="4,4" />
        <text x="150" y="115" textAnchor="middle" fontSize="9" fill="#666" fontWeight="500">
          Maxilar superior
        </text>
        <text x="150" y="155" textAnchor="middle" fontSize="9" fill="#666" fontWeight="500">
          Maxilar inferior
        </text>
        <text x="135" y="128" textAnchor="middle" fontSize="10" fill="#888" fontWeight="600">
          1
        </text>
        <text x="165" y="128" textAnchor="middle" fontSize="10" fill="#888" fontWeight="600">
          2
        </text>
        <text x="135" y="145" textAnchor="middle" fontSize="10" fill="#888" fontWeight="600">
          4
        </text>
        <text x="165" y="145" textAnchor="middle" fontSize="10" fill="#888" fontWeight="600">
          3
        </text>

        {upperRightTeeth.map((tooth) => (
          <Tooth
            key={tooth.num}
            tooth={tooth}
            quadrant={1}
            isSelected={selectedTeethSet.has(tooth.num)}
            status={toothStatuses?.[tooth.num]}
            onClick={() => handleToothClick(tooth.num)}
          />
        ))}
        {upperLeftTeeth.map((tooth) => (
          <Tooth
            key={tooth.num}
            tooth={tooth}
            quadrant={2}
            isSelected={selectedTeethSet.has(tooth.num)}
            status={toothStatuses?.[tooth.num]}
            onClick={() => handleToothClick(tooth.num)}
          />
        ))}
        {lowerRightTeeth.map((tooth) => (
          <Tooth
            key={tooth.num}
            tooth={tooth}
            quadrant={4}
            isSelected={selectedTeethSet.has(tooth.num)}
            status={toothStatuses?.[tooth.num]}
            onClick={() => handleToothClick(tooth.num)}
          />
        ))}
        {lowerLeftTeeth.map((tooth) => (
          <Tooth
            key={tooth.num}
            tooth={tooth}
            quadrant={3}
            isSelected={selectedTeethSet.has(tooth.num)}
            status={toothStatuses?.[tooth.num]}
            onClick={() => handleToothClick(tooth.num)}
          />
        ))}
      </svg>

      <div className="flex w-full max-w-[300px] text-[10px] font-bold text-muted-foreground mt-1">
        <span className="flex-1 text-center">DERECHO</span>
        <span className="flex-1 text-center">IZQUIERDO</span>
      </div>

      <Dialog open={selectedTooth !== null} onOpenChange={(open) => setSelectedTooth(open ? selectedTooth : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Diente {selectedTooth}</DialogTitle>
            <DialogDescription>Selecciona el estado asociado a este diente.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4">
            <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0">
              <path
                d="M 40 10 Q 58 20 58 40 Q 58 60 40 70 Q 22 60 22 40 Q 22 20 40 10 Z"
                fill={selectedToothStatus ? STATUS_CONFIG[selectedToothStatus].fill : 'white'}
                stroke={selectedToothStatus ? STATUS_CONFIG[selectedToothStatus].stroke : '#333'}
                strokeWidth="2"
              />
              {selectedToothStatus && (
                <ToothStatusIcon status={selectedToothStatus} x={40} y={40} size={12} strokeWidth={2} />
              )}
            </svg>

            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(STATUS_CONFIG) as ToothStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    if (selectedTooth !== null) {
                      onToothStatusChange(selectedTooth, status)
                      setSelectedTooth(null)
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors',
                    selectedToothStatus === status
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border hover:bg-secondary',
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full border"
                    style={{
                      backgroundColor: STATUS_CONFIG[status].fill,
                      borderColor: STATUS_CONFIG[status].stroke,
                    }}
                  />
                  {STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              onClick={() => {
                if (selectedTooth !== null) {
                  onToothStatusClear(selectedTooth)
                }
                setSelectedTooth(null)
              }}
            >
              Limpiar estado
            </Button>
            <Button type="button" className="text-xs" onClick={() => setSelectedTooth(null)}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Tooth({
  tooth,
  quadrant,
  isSelected,
  status,
  onClick,
}: {
  tooth: ToothData
  quadrant: number
  isSelected: boolean
  status?: ToothStatus
  onClick: () => void
}) {
  const statusConfig = status ? STATUS_CONFIG[status] : null

  return (
    <g onClick={onClick} className="cursor-pointer" style={{ transformOrigin: `${tooth.x}px ${tooth.y}px` }}>
      <path
        d={getToothPath(tooth.x, tooth.y, tooth.type)}
        fill={statusConfig?.fill || (isSelected ? '#8BC34A' : 'white')}
        stroke={statusConfig?.stroke || (isSelected ? '#558b2f' : '#333')}
        strokeWidth="1.5"
        className="transition-colors hover:fill-green-100"
      />
      {!status && !isSelected && <XMark x={tooth.x} y={tooth.y} type={tooth.type} />}
      {status && (
        <ToothStatusIcon status={status} x={tooth.x} y={tooth.y} size={tooth.type === 'molar' ? 6 : 5} strokeWidth={1.4} />
      )}
      <text
        x={tooth.labelX}
        y={tooth.labelY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="500"
        fill="#333"
        className="pointer-events-none select-none"
      >
        {tooth.num}
      </text>
    </g>
  )
}

function XMark({ x, y, type }: { x: number; y: number; type: ToothType }) {
  if (type === 'molar' || type === 'premolar') {
    const size = type === 'molar' ? 5 : 4
    return (
      <>
        <line x1={x - size} y1={y - size} x2={x + size} y2={y + size} stroke="#555" strokeWidth="1" />
        <line x1={x + size} y1={y - size} x2={x - size} y2={y + size} stroke="#555" strokeWidth="1" />
      </>
    )
  }
  return null
}

function getToothPath(x: number, y: number, type: ToothType): string {
  switch (type) {
    case 'molar':
      return `M ${x - 10} ${y - 8} Q ${x - 12} ${y} ${x - 10} ${y + 8} Q ${x} ${y + 12} ${x + 10} ${y + 8} Q ${x + 12} ${y} ${x + 10} ${y - 8} Q ${x} ${y - 12} ${x - 10} ${y - 8} Z`
    case 'premolar':
      return `M ${x - 7} ${y - 6} Q ${x - 9} ${y} ${x - 7} ${y + 6} Q ${x} ${y + 9} ${x + 7} ${y + 6} Q ${x + 9} ${y} ${x + 7} ${y - 6} Q ${x} ${y - 9} ${x - 7} ${y - 6} Z`
    case 'canine':
      return `M ${x} ${y - 10} Q ${x + 6} ${y - 4} ${x + 5} ${y + 6} Q ${x} ${y + 10} ${x - 5} ${y + 6} Q ${x - 6} ${y - 4} ${x} ${y - 10} Z`
    case 'incisor':
      return `M ${x - 4} ${y - 8} L ${x + 4} ${y - 8} Q ${x + 6} ${y} ${x + 5} ${y + 8} Q ${x} ${y + 10} ${x - 5} ${y + 8} Q ${x - 6} ${y} ${x - 4} ${y - 8} Z`
    default:
      return ''
  }
}
