'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ZonaDentalChartProps {
  selectedZonas: number[]
  onZonaSelect: (zona: number) => void
  onClear: () => void
}

export function ZonaDentalChart({ selectedZonas, onZonaSelect, onClear }: ZonaDentalChartProps) {
  const [hoveredZona, setHoveredZona] = useState<number | null>(null)

  const isZonaSelected = (zona: number) => selectedZonas.includes(zona)

  const handleZonaClick = (zona: number) => {
    onZonaSelect(zona)
  }

  const handleClear = () => {
    onClear()
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[260px] rounded-lg border-2 border-[#5A7D9A] bg-[#5A7D9A] p-3">
        <svg viewBox="0 0 200 240" className="w-full h-auto">
          <defs>
            <clipPath id="ovalClip">
              <ellipse cx="100" cy="120" rx="80" ry="95" />
            </clipPath>
          </defs>

          <ellipse
            cx="100"
            cy="120"
            rx="80"
            ry="95"
            fill="#D4D4D4"
            stroke="#000000"
            strokeWidth="2.5"
          />

          <line x1="100" y1="25" x2="100" y2="215" stroke="#000000" strokeWidth="2" />
          <line x1="20" y1="120" x2="180" y2="120" stroke="#000000" strokeWidth="2" />

          <text x="100" y="18" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">
            Gingival
          </text>
          <text x="100" y="232" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">
            Incisal
          </text>

          <text x="50" y="116" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">
            Mesial
          </text>
          <text x="150" y="116" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">
            Distal
          </text>

          <text x="180" y="124" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">
            Medio
          </text>

          <g
            onClick={() => handleZonaClick(1)}
            onMouseEnter={() => setHoveredZona(1)}
            onMouseLeave={() => setHoveredZona(null)}
            className="cursor-pointer"
          >
            <ellipse
              cx="50"
              cy="72"
              rx="45"
              ry="50"
              fill={isZonaSelected(1) || hoveredZona === 1 ? '#8BC34A' : 'transparent'}
              stroke="transparent"
            />
            <text
              x="50"
              y="76"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fontWeight="700"
              fill={isZonaSelected(1) || hoveredZona === 1 ? '#fff' : '#000'}
              className="pointer-events-none select-none"
            >
              1
            </text>
          </g>

          <g
            onClick={() => handleZonaClick(2)}
            onMouseEnter={() => setHoveredZona(2)}
            onMouseLeave={() => setHoveredZona(null)}
            className="cursor-pointer"
          >
            <ellipse
              cx="150"
              cy="72"
              rx="45"
              ry="50"
              fill={isZonaSelected(2) || hoveredZona === 2 ? '#8BC34A' : 'transparent'}
              stroke="transparent"
            />
            <text
              x="150"
              y="76"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fontWeight="700"
              fill={isZonaSelected(2) || hoveredZona === 2 ? '#fff' : '#000'}
              className="pointer-events-none select-none"
            >
              2
            </text>
          </g>

          <g
            onClick={() => handleZonaClick(3)}
            onMouseEnter={() => setHoveredZona(3)}
            onMouseLeave={() => setHoveredZona(null)}
            className="cursor-pointer"
          >
            <ellipse
              cx="150"
              cy="168"
              rx="45"
              ry="50"
              fill={isZonaSelected(3) || hoveredZona === 3 ? '#8BC34A' : 'transparent'}
              stroke="transparent"
            />
            <text
              x="150"
              y="172"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fontWeight="700"
              fill={isZonaSelected(3) || hoveredZona === 3 ? '#fff' : '#000'}
              className="pointer-events-none select-none"
            >
              3
            </text>
          </g>

          <g
            onClick={() => handleZonaClick(4)}
            onMouseEnter={() => setHoveredZona(4)}
            onMouseLeave={() => setHoveredZona(null)}
            className="cursor-pointer"
          >
            <ellipse
              cx="50"
              cy="168"
              rx="45"
              ry="50"
              fill={isZonaSelected(4) || hoveredZona === 4 ? '#8BC34A' : 'transparent'}
              stroke="transparent"
            />
            <text
              x="50"
              y="172"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fontWeight="700"
              fill={isZonaSelected(4) || hoveredZona === 4 ? '#fff' : '#000'}
              className="pointer-events-none select-none"
            >
              4
            </text>
          </g>
        </svg>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClear}
        className="mt-3 gap-1.5 text-xs"
      >
        Borrar
      </Button>
    </div>
  )
}