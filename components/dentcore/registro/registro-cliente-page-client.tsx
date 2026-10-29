'use client'

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Phone, Lock, CheckCircle, AlertCircle } from "lucide-react"

export function RegistroClientePageClient() {
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('from') : null)
  const fromLab = fromParam === 'lab'
  const fromEmpleado = fromParam === 'empleado'
  const fromAdmin = fromLab || fromEmpleado
  const backPath = fromEmpleado ? '/empleado/clientes' : '/laboratorio/clientes'
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    calle: "",
    localidad: "",
    clinica: "",
    locacion_extra: "",
    direccion_extra: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function validateForm() {
    const newErrors: Record<string, string> = {}
    if (!formData.nombre) newErrors.nombre = "El nombre es obligatorio"
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email válido es obligatorio"
    }
    if (!formData.telefono) newErrors.telefono = "El teléfono es obligatorio"
    if (formData.password.length < 6) newErrors.password = "Mínimo 6 caracteres"
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
       // Buscar el primer laboratorio
       const { data: labs } = await supabase.from("laboratorio").select("id").limit(1)
       if (!labs || labs.length === 0) {
         alert("No hay laboratorio registrado")
         setSubmitting(false)
         return
       }

       const response = await fetch('/api/registro-cliente', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           nombre: formData.nombre,
           email: formData.email,
           telefono: formData.telefono,
           calle: formData.calle,
           localidad: formData.localidad,
           clinica: formData.clinica,
           locacion_extra: formData.locacion_extra,
           direccion_extra: formData.direccion_extra,
           password: formData.password,
           laboratorio_id: labs[0].id,
         }),
       })
       const result = await response.json()
       if (!response.ok) throw new Error(result.error || 'No se pudo registrar.')


      setDone(true)
    } catch (err: any) {
      alert("Error al registrarse: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-accent/15 mb-4">
              <CheckCircle className="size-8 text-accent" />
            </div>
            <h2 className="font-heading text-xl font-bold text-primary">¡Registro exitoso!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {fromAdmin ? 'El cliente ha sido creado.' : 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.'}
            </p>
            <Button className="mt-4" render={<a href={fromAdmin ? backPath : '/iniciar-sesion'} />}>
              {fromAdmin ? 'Volver' : 'Iniciar sesión'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Registro de Cliente</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Crea tu cuenta para acceder al laboratorio
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Tu nombre"
              />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@ejemplo.com"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+57 300 123 4567"
              />
              {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Calle</label>
              <Input
                value={formData.calle}
                onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                placeholder="Calle y número"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Localidad</label>
              <Input
                value={formData.localidad}
                onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                placeholder="Ciudad"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Clínica</label>
              <Input
                value={formData.clinica}
                onChange={(e) => setFormData({ ...formData, clinica: e.target.value })}
                placeholder="Nombre de la clínica"
              />
            </div>
                <div>
              <label className="text-sm font-medium">Locacion Extra</label>
              <Input
                value={formData.locacion_extra}
                onChange={(e) => setFormData({ ...formData, locacion_extra: e.target.value })}
                placeholder="Locacion extra"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Direccion Extra</label>
              <Input
                value={formData.direccion_extra}
                onChange={(e) => setFormData({ ...formData, direccion_extra: e.target.value })}
                placeholder="Direccion extra"
              />
            </div>
        <div>
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Confirmar contraseña</label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repite la contraseña"
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Registrando..." : "Registrarse"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}