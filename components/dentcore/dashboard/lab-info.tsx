'use client'

import { useState, useRef } from 'react'
import { FlaskConical, Mail, Phone, MapPin, Calendar, Award, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { lab as initialLab } from '@/data/lab-mock'

const planLabels: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

const planColors: Record<string, string> = {
  starter: 'bg-muted text-muted-foreground',
  professional: 'bg-accent/15 text-accent',
  enterprise: 'bg-primary/10 text-primary',
}

export function LabInfo() {
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLab.logo || null)
  const fileRef = useRef<HTMLInputElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-xl font-semibold text-primary">
            Información del laboratorio
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40"
                onClick={() => fileRef.current?.click()}
                title="Cambiar logo"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo del laboratorio" className="size-full object-cover" />
                ) : (
                  <FlaskConical className="size-7 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-primary">{initialLab.name}</p>
                <p className="text-sm text-muted-foreground">Logo del laboratorio</p>
              </div>
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" />
                Subir logo
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-6 px-6 pb-6 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Correo electrónico
            </p>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Mail className="size-3.5 text-muted-foreground" />
              {initialLab.email}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Teléfono
            </p>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Phone className="size-3.5 text-muted-foreground" />
              {initialLab.phone}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Dirección
            </p>
            <div className="flex items-start gap-2 text-sm text-foreground">
              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
              <span>
                {initialLab.address}, {initialLab.city}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Plan actual
            </p>
            <div className="flex items-center gap-2">
              <Award className="size-3.5 text-muted-foreground" />
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${planColors[initialLab.plan]}`}
              >
                {planLabels[initialLab.plan]}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Miembro desde
            </p>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Calendar className="size-3.5 text-muted-foreground" />
              {new Date(initialLab.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <div className="border-b border-border px-6 py-4">
            <h3 className="font-heading text-base font-semibold text-primary">
              Resumen rápido
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 p-6">
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">5</p>
              <p className="text-xs text-muted-foreground">Empleados</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">5</p>
              <p className="text-xs text-muted-foreground">Odontólogos</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">8</p>
              <p className="text-xs text-muted-foreground">Solicitudes activas</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-xs text-muted-foreground">Completadas hoy</p>
            </div>
          </div>
        </Card>

        <Card className="flex-1">
          <div className="border-b border-border px-6 py-4">
            <h3 className="font-heading text-base font-semibold text-primary">
              Acciones rápidas
            </h3>
          </div>
          <div className="flex flex-col gap-2 p-6">
            <p className="text-sm text-muted-foreground">
              Accede rápidamente a las secciones más utilizadas de tu panel.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
