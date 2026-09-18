'use client'

import { useState } from "react"
import Calendar from 'react-calendar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { CalendarDays, Clock, User, Plus } from "lucide-react"
import 'react-calendar/dist/Calendar.css'

export default function CalendarioPageClient() {
  const [date, setDate] = useState(new Date())
  const [eventos, setEventos] = useState<any[]>([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoEvent, setNuevoEvent] = useState({
    title: "",
    time: "",
    type: "entrega",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Mi Calendario</h1>
        <p className="text-sm text-muted-foreground">Gestiona tus Citas y Programación</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <Calendar
                onChange={setDate}
                value={date}
                locale="es"
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5" />
                Eventos de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    <span className="text-sm font-medium">09:00 AM</span>
                  </div>
                  <p className="mt-1 text-sm text-primary">Entrega de corona</p>
                  <p className="text-xs text-muted-foreground">Paciente: Juan Pérez</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    <span className="text-sm font-medium">11:30 AM</span>
                  </div>
                  <p className="mt-1 text-sm text-primary">Consultoria</p>
                  <p className="text-xs text-muted-foreground">Doctor: Dr. García</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    <span className="text-sm font-medium">02:00 PM</span>
                  </div>
                  <p className="mt-1 text-sm text-primary">Entrega de puente</p>
                  <p className="text-xs text-muted-foreground">Paciente: María López</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full gap-2">
            <Plus className="size-4" />
            Nuevo Evento
          </Button>
        </div>
      </div>
    </div>
  )
}