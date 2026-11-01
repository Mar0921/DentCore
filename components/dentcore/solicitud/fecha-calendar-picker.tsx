'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CalendarIcon } from 'lucide-react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CalendarValue = Date | null | [Date | null, Date | null]

interface FechaCalendarPickerProps {
  value: { dia: string; mes: string; anio: string }
  onChange: (fecha: { dia: string; mes: string; anio: string }) => void
  label: string
  placeholder?: string
}

function fechaToDate(fecha: { dia: string; mes: string; anio: string }): Date | null {
  const dia = parseInt(fecha.dia, 10)
  const mes = parseInt(fecha.mes, 10)
  const anio = parseInt(fecha.anio, 10)
  if (!dia || !mes || !anio) return null
  const d = new Date(anio, mes - 1, dia)
  if (isNaN(d.getTime())) return null
  return d
}

function dateToFecha(date: Date): { dia: string; mes: string; anio: string } {
  return {
    dia: String(date.getDate()).padStart(2, '0'),
    mes: String(date.getMonth() + 1).padStart(2, '0'),
    anio: String(date.getFullYear()),
  }
}

function formatFechaDisplay(fecha: { dia: string; mes: string; anio: string }): string {
  if (!fecha.dia || !fecha.mes || !fecha.anio) return ''
  return `${fecha.dia}/${fecha.mes}/${fecha.anio}`
}

export function FechaCalendarPicker({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar fecha',
}: FechaCalendarPickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(fechaToDate(value))
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedDate(fechaToDate(value))
  }, [value])

  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const calendarHeight = 280
      const spaceBelow = viewportHeight - rect.bottom
      setCoords({
        top: spaceBelow < calendarHeight ? rect.top - calendarHeight - 8 : rect.bottom + 8,
        left: rect.left,
      })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const handleResize = () => updatePosition()
    const handleScroll = () => updatePosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleCalendarChange = (date: CalendarValue) => {
    if (date instanceof Date) {
      setSelectedDate(date)
      onChange(dateToFecha(date))
    }
  }

  const handleClear = () => {
    setSelectedDate(null)
    onChange({ dia: '', mes: '', anio: '' })
  }

  const displayValue = formatFechaDisplay(value)

  return (
    <div className="grid gap-1.5" ref={containerRef}>
      <label className="text-sm font-medium text-primary">{label}</label>
      <div className="flex gap-2">
        <Input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          className="cursor-pointer"
          onClick={() => {
            if (!open) updatePosition()
            setOpen(!open)
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => {
            if (open) {
              setOpen(false)
            } else {
              updatePosition()
              setOpen(true)
            }
          }}
        >
          <CalendarIcon className="size-4" />
        </Button>
      </div>
      {open && coords && (
        <div
          ref={contentRef}
          className="fixed z-[9999] rounded-lg border border-border bg-card p-3 shadow-2xl"
          style={{
            top: coords.top,
            left: coords.left,
          }}
        >
          <Calendar
            onChange={handleCalendarChange}
            value={selectedDate}
            locale="es"
          />
          <div className="mt-2 flex justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              Limpiar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}