"use client"

import React, { useEffect, useState } from "react"
import { Download, Pencil, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  CAMPOS_EDITABLES,
  CODIGO_FICHA_DEFAULT,
  ROL_ELABORO,
  ROL_REVISO_DEFAULT,
  ROL_APROBO_DEFAULT,
  ROL_FIRMA_AUTORIZADA,
  buscarPorRol,
  firmaKey,
  fmtDMY,
  fmtLarga,
  hoyISO,
  resolverFirma,
  rolLegible,
  type ControlFicha,
  type FilaCambio,
  type Firma,
  type Seccion,
} from "./types"

// Cada bloque con esto no se parte entre páginas (CSS) y además lleva
// el atributo data-block para que el exportador pagine entre bloques.
export const BLOCK: React.CSSProperties = { breakInside: "avoid", pageBreakInside: "avoid" }
const blockAttr = { "data-block": "" } as const

/* =====================================================================
 * Hooks
 * ===================================================================== */

// Estado del encabezado/firmas. Funciona solo (interno) o controlado por el padre.
export function useControlFicha(control?: ControlFicha, onControlChange?: (c: ControlFicha) => void) {
  const [interno, setInterno] = useState<ControlFicha>({
    codigo: CODIGO_FICHA_DEFAULT,
    version: "01",
    fecha: "", // se llena en el cliente para evitar errores de hidratación
    fechaRevision: null,
    fechaAprobacion: null,
    revisoFirmaId: null,
    aproboFirmaId: null,
  })
  const actual = control ?? interno

  const cambiar = (parche: Partial<ControlFicha>) => {
    const next = { ...actual, ...parche }
    if (!control) setInterno(next)
    onControlChange?.(next)
  }

  useEffect(() => {
    if (!actual.fecha) cambiar({ fecha: hoyISO() }) // Elaboración: fecha automática (hoy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { control: actual, cambiar }
}

// Firmas desde la tabla `firmas` (roles: Representante legal, Director tecnico, Asistente tecnico)
export function useFirmas(firmasProp?: Firma[]): Firma[] {
  const [firmas, setFirmas] = useState<Firma[]>([])

  useEffect(() => {
    if (firmasProp) return
    let cancelado = false
    ;(async () => {
      let labId: string | null = localStorage.getItem("labId")
      if (!labId) {
        const { data: lab } = await supabase.from("laboratorio").select("id").limit(1)
        labId = lab?.[0]?.id ?? null
      }
      if (!labId) return
      const { data } = await supabase.from("firmas").select("*").eq("laboratorio_id", labId)
      if (!cancelado && data) setFirmas(data as Firma[])
    })()
    return () => { cancelado = true }
  }, [firmasProp])

  return firmasProp ?? firmas
}

/* =====================================================================
 * Piezas básicas
 * ===================================================================== */

export function EditableField({
  value, placeholder, onChange, editing = true, className = "", rows = 2,
}: {
  value: string
  placeholder?: string
  onChange: (value: string) => void
  editing?: boolean
  className?: string
  rows?: number
}) {
  if (!editing) {
    return <div className={className}>{value || <span className="text-neutral-400">{placeholder}</span>}</div>
  }
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded border border-amber-300 bg-amber-50 p-2 text-[11px] text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 ${className}`}
      rows={rows}
    />
  )
}

const inputAmarillo =
  "w-full rounded border border-amber-300 bg-amber-50 px-1.5 py-1 text-[11px] text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"

export function Section({ title, level = 1 }: { title: string; level?: 1 | 2 }) {
  return level === 1 ? (
    <h1 className="mb-4 border-b-2 border-neutral-800 pb-2 text-[11px] font-bold">{title}</h1>
  ) : (
    <h2 className="mb-3 mt-8 text-[11px] font-bold">{title}</h2>
  )
}

export function InfoRow({
  label, value, seccionIndex, campoIndex, editing, onCampoChange, customEditor, isFirst = false, block = true, children,
}: {
  label: string
  value?: string
  seccionIndex?: number
  campoIndex?: number
  editing?: boolean
  onCampoChange?: (seccionIndex: number, campoIndex: number, value: string) => void
  customEditor?: () => React.ReactNode
  isFirst?: boolean
  block?: boolean
  children?: React.ReactNode
}) {
  const isEditable = seccionIndex !== undefined && campoIndex !== undefined && editing && onCampoChange
  const displayValue = value || ""

  return (
    <div
      {...(block ? blockAttr : {})}
      style={block ? BLOCK : undefined}
      className={`flex items-stretch border-x border-b border-neutral-300 ${isFirst ? "border-t" : ""}`}
    >
      <div className="w-[38%] shrink-0 border-r border-neutral-300 bg-neutral-50 p-3 font-bold">{label}</div>
      <div className="flex-1 p-3">
        {isEditable ? (
          customEditor ? (
            customEditor()
          ) : (
            <EditableField
              value={displayValue}
              onChange={(val) => onCampoChange!(seccionIndex!, campoIndex!, val)}
              editing={editing}
              rows={displayValue.split("\n").length > 3 ? 6 : 2}
            />
          )
        ) : children ?? (
          <div className="whitespace-pre-line">
            {displayValue || <span className="text-neutral-400">Sin información</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// Título + primera fila van juntos (el título nunca queda solo al final de una página);
// cada fila restante es un bloque independiente.
export function BloqueSeccion<T extends { label: string }>({
  titulo, nivel, campos, renderCampo,
}: {
  titulo: string
  nivel: 1 | 2
  campos: T[]
  renderCampo: (campo: T, campoIndex: number, isFirst: boolean, block: boolean) => React.ReactNode
}) {
  const [primero, ...resto] = campos
  return (
    <div className="mb-4">
      <div {...blockAttr} style={BLOCK}>
        <Section title={titulo} level={nivel} />
        {primero && renderCampo(primero, 0, true, false)}
      </div>
      {resto.map((c, i) => renderCampo(c, i + 1, false, true))}
    </div>
  )
}

// Texto largo: párrafos o listas ("- item" / "1. item")
export function renderTextoLargo(text: string) {
  const lineas = (text || "").split("\n").filter((p) => p.trim())
  return lineas.map((linea, i) => {
    if (linea.trim().startsWith("-") || /^\d+\./.test(linea.trim())) {
      return (
        <ul key={i} className="ml-4 list-disc">
          <li>{linea.trim().replace(/^[-\d.]+\s*/, "")}</li>
        </ul>
      )
    }
    return <p key={i} className="mb-2">{linea}</p>
  })
}

export function BarraHerramientas({
  editing, onToggleEditing, onDownload, downloading,
}: {
  editing: boolean
  onToggleEditing: () => void
  onDownload: () => void
  downloading: boolean
}) {
  return (
    <div className="mx-auto mb-6 flex max-w-[794px] flex-wrap items-center justify-between gap-3 px-4">
      <div className="text-sm text-neutral-600">
        {editing ? (
          <span className="inline-flex items-center gap-1.5">
            <Pencil className="h-4 w-4 text-amber-600" aria-hidden />
            Haz clic en los campos <span className="rounded bg-[#fff2a8] px-1 text-neutral-800">amarillos</span> para editarlos
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-600" aria-hidden />
            Edición bloqueada
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleEditing}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          {editing ? <Check className="h-4 w-4" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
          {editing ? "Terminar edición" : "Editar campos"}
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
        >
          <Download className="h-4 w-4" aria-hidden />
          {downloading ? "Generando..." : "Descargar PDF"}
        </button>
      </div>
    </div>
  )
}

/* =====================================================================
 * Encabezado (imagen 1)
 * ===================================================================== */

export function EncabezadoFicha({
  control, cambiar, editing, logoSrc = "/logo-smile.png",
}: {
  control: ControlFicha
  cambiar: (p: Partial<ControlFicha>) => void
  editing: boolean
  logoSrc?: string
}) {
  const celda = "border border-neutral-800 p-1.5 align-middle text-center"

  return (
    <table id="doc-header" {...blockAttr} style={BLOCK} className="mb-6 w-full table-fixed border-collapse text-[11px]">
      <tbody>
        <tr>
          <td rowSpan={3} className="w-[24%] border border-neutral-800 p-2 align-middle">
            <div id="doc-header-logo" className="relative flex h-14 w-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="Logo" className="max-h-14 w-full object-contain" />
            </div>
          </td>
          <td colSpan={4} className={`${celda} text-[12px] font-bold`}>SISTEMA INTEGRADO DE GESTION</td>
        </tr>
        <tr>
          <td colSpan={4} className={`${celda} text-[12px] font-bold`}>
            FICHA TÉCNICA DISPOSITIVO MÉDICO SOBRE MEDIDA BUCAL
          </td>
        </tr>
        <tr>
          <td className={`${celda} w-[20%]`}>
            Proceso:
            <div>GESTION FABRICACION</div>
          </td>
          <td className={`${celda} w-[20%]`}>
            Código:
            {editing ? (
              <input
                type="text"
                value={control.codigo}
                onChange={(e) => cambiar({ codigo: e.target.value })}
                className={`${inputAmarillo} mt-1 text-center font-bold`}
              />
            ) : (
              <div className="font-bold">{control.codigo}</div>
            )}
          </td>
          <td className={`${celda} w-[12%]`}>
            Versión{" "}
            {editing ? (
              <input
                type="text"
                value={control.version}
                onChange={(e) => cambiar({ version: e.target.value })}
                className={`${inputAmarillo} mt-1 text-center`}
              />
            ) : (
              control.version
            )}
          </td>
          <td className={`${celda} w-[24%]`}>
            Fecha de Elaboración:
            {editing ? (
              <input
                type="date"
                value={control.fecha}
                onChange={(e) => cambiar({ fecha: e.target.value })}
                className={`${inputAmarillo} mt-1 text-center`}
              />
            ) : (
              <div>{fmtDMY(control.fecha)}</div>
            )}
            <div id="page-indicator">Página 1 de 1</div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

/* =====================================================================
 * Final del documento (imagen 2): Firma autorizada, Control de cambios, Firmas
 * ===================================================================== */

function FirmaImg({ firma, className = "h-16" }: { firma?: Firma; className?: string }) {
  if (!firma?.firma_data_url) return <div className={className} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={firma.firma_data_url} alt={firma.nombre} className={`${className} object-contain`} />
}

function CeldaFirma({
  etiquetaFecha, etiquetaRol, fecha, firma, rolDefault, firmas, editable, onFecha, onFirma,
}: {
  etiquetaFecha: string
  etiquetaRol: string
  fecha: string
  firma?: Firma
  rolDefault: string
  firmas: Firma[]
  editable: boolean
  onFecha?: (iso: string) => void
  onFirma?: (key: string) => void
}) {
  return (
    <td className="w-1/3 border border-neutral-800 p-2 align-top">
      <div>{etiquetaFecha}:</div>
      {editable ? (
        <input type="date" value={fecha} onChange={(e) => onFecha?.(e.target.value)} className={`${inputAmarillo} mb-1`} />
      ) : (
        <div>{fmtDMY(fecha)}</div>
      )}
      <div>{etiquetaRol}:</div>
      {editable ? (
        <select
          value={firma ? firmaKey(firma) : ""}
          onChange={(e) => onFirma?.(e.target.value)}
          className={inputAmarillo}
        >
          {!firma && <option value="">— Seleccionar —</option>}
          {firmas.map((f) => (
            <option key={firmaKey(f)} value={firmaKey(f)}>
              {f.nombre} — {rolLegible(f.rol)}
            </option>
          ))}
        </select>
      ) : (
        <>
          <div>{rolLegible(firma?.rol) || rolLegible(rolDefault)}</div>
          <div>{firma?.nombre || ""}</div>
        </>
      )}
      <div className="mt-1 flex h-16 items-center">
        <FirmaImg firma={firma} />
      </div>
    </td>
  )
}

export function PieFicha({
  control, cambiar, editing, firmas, textoFirmaAutorizada, filasCambios,
}: {
  control: ControlFicha
  cambiar: (p: Partial<ControlFicha>) => void
  editing: boolean
  firmas: Firma[]
  textoFirmaAutorizada?: string
  filasCambios?: FilaCambio[]
}) {
  const autorizada = buscarPorRol(firmas, ROL_FIRMA_AUTORIZADA)
  const elaboro = buscarPorRol(firmas, ROL_ELABORO)
  const reviso = resolverFirma(firmas, control.revisoFirmaId, ROL_REVISO_DEFAULT)
  const aprobo = resolverFirma(firmas, control.aproboFirmaId, ROL_APROBO_DEFAULT)
  const fechaRev = control.fechaRevision || control.fecha
  const fechaApr = control.fechaAprobacion || control.fecha

  const cambios: FilaCambio[] =
    filasCambios && filasCambios.length > 0
      ? filasCambios
      : [{ version: "001", fecha: fmtLarga(fechaApr), descripcion: "Elaboración revisión y aprobación del documento" }]

  const th = "border border-neutral-800 p-1.5 text-center font-bold"
  const td = "border border-neutral-800 p-1.5"

  return (
    <div>
      {/* Firma autorizada */}
      <div {...blockAttr} style={BLOCK} className="mb-6 mt-8">
        <p className="mb-5 font-bold">
          Firma:{" "}
          <span className="font-normal">
            {textoFirmaAutorizada || "Firma autorizada (nombre y firma del director técnico / perfil profesional)"}
          </span>
        </p>
        <p className="mb-1">Nombre. {autorizada?.nombre || ""}</p>
        <div className="flex items-end gap-2">
          <span>Firma:</span>
          <div className="min-w-[140px] border-b border-neutral-800">
            <FirmaImg firma={autorizada} className="h-14" />
          </div>
        </div>
        <p>Perfil profesional: {rolLegible(autorizada?.rol || ROL_FIRMA_AUTORIZADA).toLowerCase()}</p>
      </div>

      {/* Control de cambios */}
      <table {...blockAttr} style={BLOCK} className="mx-auto mb-8 w-[92%] border-collapse text-[11px]">
        <thead>
          <tr>
            <th colSpan={3} className={th}>CONTROL DE CAMBIOS</th>
          </tr>
          <tr>
            <th className={`${th} w-[16%]`}>VERSIÓN</th>
            <th className={`${th} w-[30%]`}>FECHA DE APROBACIÓN</th>
            <th className={th}>DESCRIPCIÓN DEL CAMBIO</th>
          </tr>
        </thead>
        <tbody>
          {cambios.map((c, i) => (
            <tr key={i}>
              <td className={td}>{c.version}</td>
              <td className={td}>{c.fecha}</td>
              <td className={td}>{c.descripcion}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Elaboró / Revisó / Aprobó */}
      <table {...blockAttr} style={BLOCK} className="w-full table-fixed border-collapse text-[11px]">
        <tbody>
          <tr>
            <CeldaFirma
              etiquetaFecha="Fecha de elaboración"
              etiquetaRol="Elaboró"
              fecha={control.fecha}
              firma={elaboro}
              rolDefault={ROL_ELABORO}
              firmas={firmas}
              editable={false}
            />
            <CeldaFirma
              etiquetaFecha="Fecha de Revisión"
              etiquetaRol="Revisó"
              fecha={fechaRev}
              firma={reviso}
              rolDefault={ROL_REVISO_DEFAULT}
              firmas={firmas}
              editable={editing}
              onFecha={(iso) => cambiar({ fechaRevision: iso || null })}
              onFirma={(key) => cambiar({ revisoFirmaId: key || null })}
            />
            <CeldaFirma
              etiquetaFecha="Fecha de Aprobación"
              etiquetaRol="Aprobó"
              fecha={fechaApr}
              firma={aprobo}
              rolDefault={ROL_APROBO_DEFAULT}
              firmas={firmas}
              editable={editing}
              onFecha={(iso) => cambiar({ fechaAprobacion: iso || null })}
              onFirma={(key) => cambiar({ aproboFirmaId: key || null })}
            />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/* =====================================================================
 * Ficha técnica genérica
 * ===================================================================== */

type Props = {
  secciones: Seccion[]
  onCampoChange: (seccionIndex: number, campoIndex: number, value: string) => void
  editing: boolean
  onToggleEditing: () => void
  onDownload: () => void
  downloading: boolean
  showToolbar?: boolean
  nombreTipo?: string
  firmas?: Firma[]
  // Opcionales: si no los pasas, el encabezado y las fechas/firmas se manejan internamente
  control?: ControlFicha
  onControlChange?: (c: ControlFicha) => void
  logoSrc?: string
}

// Secciones que se dibujan aparte (pie del documento)
const TITULOS_ESPECIALES = ["CONTROL DE CAMBIOS", "ELABORO", "Reviso", "Aprobó", "6. Firma", "Firma"]

const CAMPOS_LARGOS = [
  "Materiales Empleados",
  "Normas aplicadas",
  "Análisis de riesgos",
  "Advertencias y contraindicaciones",
  "Instrucciones de uso",
  "Instrucciones de mantenimiento",
  "Garantía",
  "Descripción técnica del dispositivo médico",
  "Uso previsto",
  "Vida útil estimada",
]

export function FichaTecnicaGenerica({
  secciones,
  onCampoChange,
  editing,
  onToggleEditing,
  onDownload,
  downloading,
  showToolbar = true,
  firmas,
  control,
  onControlChange,
  logoSrc,
}: Props) {
  const firmasUsar = useFirmas(firmas)
  const { control: ctl, cambiar } = useControlFicha(control, onControlChange)

  // Se conserva el índice original para que onCampoChange apunte a la sección correcta
  const seccionesPrincipales = secciones
    .map((seccion, index) => ({ seccion, index }))
    .filter(({ seccion }) => !TITULOS_ESPECIALES.includes(seccion.titulo))
    .slice(0, 5)

  const seccionFirma = secciones.find((s) => s.titulo === "6. Firma" || s.titulo === "Firma")
  const seccionControlCambios = secciones.find((s) => s.titulo === "CONTROL DE CAMBIOS")

  const filasCambios: FilaCambio[] = seccionControlCambios
    ? Array.from({ length: Math.floor(seccionControlCambios.campos.length / 3) }, (_, i) => ({
        version: seccionControlCambios.campos[i * 3]?.value ?? "",
        fecha: seccionControlCambios.campos[i * 3 + 1]?.value ?? "",
        descripcion: seccionControlCambios.campos[i * 3 + 2]?.value ?? "",
      }))
    : []

  return (
    <div>
      {showToolbar && (
        <BarraHerramientas
          editing={editing}
          onToggleEditing={onToggleEditing}
          onDownload={onDownload}
          downloading={downloading}
        />
      )}

      <article
        id="documento"
        className="mx-auto max-w-[794px] bg-white px-8 py-10 text-[11px] leading-relaxed text-neutral-900 shadow-lg"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <EncabezadoFicha control={ctl} cambiar={cambiar} editing={editing} logoSrc={logoSrc} />

        {seccionesPrincipales.map(({ seccion, index: seccionIndex }) => (
          <BloqueSeccion
            key={seccion.titulo + seccionIndex}
            titulo={seccion.titulo}
            nivel={seccion.titulo.startsWith("1.") || seccion.titulo.startsWith("2.") ? 1 : 2}
            campos={seccion.campos}
            renderCampo={(campo, campoIndex, isFirst, block) => (
              <InfoRow
                key={campo.label}
                label={campo.label}
                value={campo.value}
                seccionIndex={seccionIndex}
                campoIndex={campoIndex}
                editing={editing && CAMPOS_EDITABLES.includes(campo.label)}
                onCampoChange={onCampoChange}
                isFirst={isFirst}
                block={block}
              >
                {CAMPOS_LARGOS.includes(campo.label) ? (
                  <div className="whitespace-pre-line">{renderTextoLargo(campo.value)}</div>
                ) : (
                  campo.value || <span className="text-neutral-400">Sin información</span>
                )}
              </InfoRow>
            )}
          />
        ))}

        <PieFicha
          control={ctl}
          cambiar={cambiar}
          editing={editing}
          firmas={firmasUsar}
          textoFirmaAutorizada={seccionFirma?.campos[0]?.value}
          filasCambios={filasCambios}
        />
      </article>
    </div>
  )
}