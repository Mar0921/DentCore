export interface CampoEditable {
  label: string
  value: string
}

export interface Seccion {
  titulo: string
  campos: CampoEditable[]
}

export const CAMPOS_EDITABLES = [
  "Nombre del paciente",
  "Prescriptor",
  "Número de Serie o identificación del dispositivo",
  "Materiales Empleados",
  "Especificaciones de diseño",
]

/* =====================================================================
 * Constantes
 * ===================================================================== */

export const CODIGO_FICHA_DEFAULT = "SIG-GF-FOR-001"

// Roles (como están en la tabla `firmas`, se comparan sin tildes ni mayúsculas)
export const ROL_ELABORO = "director tecnico"          // Elaboración: automática
export const ROL_REVISO_DEFAULT = "asistente tecnico"  // Revisión: editable
export const ROL_APROBO_DEFAULT = "director tecnico"   // Aprobación: editable
export const ROL_FIRMA_AUTORIZADA = "director tecnico" // Bloque "Firma autorizada"


/* =====================================================================
 * Tipos
 * ===================================================================== */

export type Firma = {
  id?: string
  nombre: string
  rol: string
  firma_data_url?: string | null
  laboratorio_id?: string
}

export type ControlFicha = {
  codigo: string
  version: string
  fecha: string                       // elaboración, ISO yyyy-mm-dd
  fechaRevision: string | null        // null = igual a la elaboración
  fechaAprobacion: string | null      // null = igual a la elaboración
  revisoFirmaId: string | null        // null = por rol por defecto
  aproboFirmaId: string | null
}

export type FilaCambio = { version: string; fecha: string; descripcion: string }

/* =====================================================================
 * Helpers de fechas y roles
 * ===================================================================== */

export function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function fmtDMY(iso?: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  return y && m && d ? `${d}-${m}-${y}` : "—"
}

// 2026-09-12 -> "12 de septiembre de 2026"
export function fmtLarga(iso?: string | null): string {
  if (!iso) return ""
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return ""
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
}

const normRol = (s?: string | null) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

export function rolLegible(rol?: string | null): string {
  switch (normRol(rol)) {
    case "director tecnico": return "Director técnico"
    case "asistente tecnico": return "Asistente técnico"
    case "representante legal": return "Representante legal"
    default: return rol || ""
  }
}

export const firmaKey = (f: Firma) => f.id ?? `${f.rol}|${f.nombre}`

export function buscarPorRol(firmas: Firma[], rol: string): Firma | undefined {
  return firmas.find((f) => normRol(f.rol) === normRol(rol))
}

export function resolverFirma(firmas: Firma[], key: string | null, rolDefault: string): Firma | undefined {
  return (key ? firmas.find((f) => firmaKey(f) === key) : undefined) ?? buscarPorRol(firmas, rolDefault)
}