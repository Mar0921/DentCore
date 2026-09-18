'use client'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Phone, Building2, Edit, Save, X, Plus, FileText } from "lucide-react"
import { SolicitudDetail } from "@/components/dentcore/solicitud/solicitud-detail"

export function InvitadoLaboratorioPageClient() {
  const [invitado, setInvitado] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    clinica: "",
  })
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    loadInvitado()
    loadSolicitudes()
  }, [])

  async function loadInvitado() {
    try {
      const email = localStorage.getItem('labUserEmail')
      if (!email) return

      const { data } = await supabase.from("cliente").select("*").eq("email", email).single()
      if (data) {
        setInvitado(data)
        setFormData({
          nombre: data.nombre || "",
          email: data.email || "",
          telefono: data.telefono || "",
          clinica: data.clinica || "",
        })
      }
    } catch (err) {
      console.error("Error:", err)
    }
  }

  async function loadSolicitudes() {
    try {
      const email = localStorage.getItem('labUserEmail')
      if (!email) return

      const { data: clienteData } = await supabase
        .from('cliente')
        .select('id, nombre')
        .eq('email', email)
        .maybeSingle()

      const nombreBuscado = clienteData?.nombre

      // Try matching by odontologo_id first (find odontologo by name)
      let result: any[] = []
      if (nombreBuscado) {
        const { data: odonto } = await supabase
          .from('odontologos')
          .select('id')
          .eq('nombre', nombreBuscado)
          .maybeSingle()

        if (odonto?.id) {
          const { data } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('odontologo_id', odonto.id)
            .order('created_at', { ascending: false })
          if (data) result = data
        }
      }

      // Also try matching by odontologonombre
      if (result.length === 0 && nombreBuscado) {
        const { data } = await supabase
          .from('solicitudes')
          .select('*')
          .eq('odontologonombre', nombreBuscado)
          .order('created_at', { ascending: false })
        if (data) result = data
      }

      setSolicitudes(result)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  async function handleSave() {
    try {
      const email = localStorage.getItem('labUserEmail')
      if (!email) return

      await supabase.from("cliente").update(formData).eq("email", email)
      setInvitado({ ...invitado, ...formData })
      setEditing(false)
    } catch (err) {
      console.error("Error:", err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu información</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Datos Personales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Nombre</label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Teléfono</label>
                    <Input
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Clínica</label>
                    <Input
                      value={formData.clinica}
                      onChange={(e) => setFormData({ ...formData, clinica: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="size-4" />
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      <X className="size-4" />
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="size-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{invitado?.nombre || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground">{invitado?.clinica || "Sin clínica"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <span className="text-sm">{invitado?.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" />
                      <span className="text-sm">{invitado?.telefono || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      <span className="text-sm">{invitado?.clinica || "—"}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={() => setEditing(true)}>
                    <Edit className="size-4" />
                    Editar perfil
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Mis Solicitudes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {solicitudes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto size-12 mb-2 opacity-50" />
                  <p>No has creado ninguna solicitud</p>
                  <Button className="mt-4 gap-2" render={<a href="/invitado-laboratorio/solicitudes/nueva" />}>
                    <Plus className="size-4" />
                    Crear primera solicitud
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {solicitudes.map((s) => (
                    <div
                      key={s.id}
                      className="cursor-pointer rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                      onClick={() => {
                        setSelectedSolicitud(s)
                        setDetailOpen(true)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-primary">
                            {s.codigo_trazabilidad ? `${s.codigo_trazabilidad}${s.productos ? ` · ${s.productos}` : ''}` : `Solicitud ${s.id}`}
                          </p>
                          <p className="text-sm text-muted-foreground">{s.tipo}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{s.estado}</span>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full gap-2" render={<a href="/invitado-laboratorio/solicitudes/nueva" />}>
                    <Plus className="size-4" />
                    Nueva solicitud
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <SolicitudDetail
        solicitud={selectedSolicitud}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}