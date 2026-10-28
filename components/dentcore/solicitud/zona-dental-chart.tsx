'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ZonaDentalChartProps {
  selectedZonas: number[]
  onZonaSelect: (zona: number) => void
  onClear: () => void
  onSaveDrawing?: (dataUrl: string) => void
}

export function ZonaDentalChart({ onClear, onSaveDrawing }: ZonaDentalChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawing, setHasDrawing] = useState(false)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ff0000'
  }, [])

  useEffect(() => {
    initCanvas()
    const handleResize = () => initCanvas()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [initCanvas])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    e.preventDefault()
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    e.preventDefault()
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
    onClear()
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !onSaveDrawing) return
    onSaveDrawing(canvas.toDataURL('image/png'))
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={containerRef} className="relative w-full max-w-[260px] rounded-lg border-2 border-[#5A7D9A] overflow-hidden">
        <svg viewBox="0 0 200 240" className="w-full h-auto block" style={{ pointerEvents: 'none' }}>
          <ellipse cx="100" cy="120" rx="80" ry="95" fill="#D4D4D4" stroke="#000000" strokeWidth="2.5" />
          <line x1="100" y1="25" x2="100" y2="215" stroke="#000000" strokeWidth="2" />
          <line x1="20" y1="120" x2="180" y2="120" stroke="#000000" strokeWidth="2" />
          <text x="100" y="18" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">Gingival</text>
          <text x="100" y="232" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">Incisal</text>
          <text x="50" y="116" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">Mesial</text>
          <text x="150" y="116" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">Distal</text>
          <text x="195" y="124" textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">Medio</text>
          {['1', '2', '3', '4'].map((n, i) => {
            const positions = [{ cx: 50, cy: 72 }, { cx: 150, cy: 72 }, { cx: 150, cy: 168 }, { cx: 50, cy: 168 }]
            const p = positions[i]
            return (
              <text key={n} x={p.cx} y={p.cy + 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="#000" className="select-none">
                {n}
              </text>
            )
          })}
        </svg>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSave}
          className="gap-1.5 text-xs"
          disabled={!hasDrawing || !onSaveDrawing}
        >
          Guardar dibujo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="gap-1.5 text-xs"
          disabled={!hasDrawing}
        >
          Borrar
        </Button>
      </div>
    </div>
  )
}
