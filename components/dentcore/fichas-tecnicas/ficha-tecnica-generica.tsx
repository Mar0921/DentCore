"use client"

import { Download, Pencil, Check } from "lucide-react"
import { Seccion, CampoEditable, CAMPOS_EDITABLES } from "./types"

type Props = {
  secciones: Seccion[]
  onCampoChange: (seccionIndex: number, campoIndex: number, value: string) => void
  editing: boolean
  onToggleEditing: () => void
  onDownload: () => void
  downloading: boolean
  showToolbar?: boolean
  nombreTipo?: string
}

function EditableField({
  value,
  placeholder,
  onChange,
  editing = true,
  className = "",
  rows = 2,
}: {
  value: string
  placeholder?: string
  onChange: (value: string) => void
  editing?: boolean
  className?: string
  rows?: number
}) {
  if (!editing) {
    return (
      <div className={className}>
        {value || <span className="text-neutral-400">{placeholder}</span>}
      </div>
    )
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

function Section({ title, level = 1 }: { title: string; level?: 1 | 2 }) {
  return level === 1 ? (
    <h1 className="mb-4 border-b-2 border-neutral-800 pb-2 text-[11px] font-bold">
      {title}
    </h1>
  ) : (
    <h2 className="mb-3 mt-8 text-[11px] font-bold">
      {title}
    </h2>
  )
}

function InfoTable({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 border border-neutral-300">{children}</div>
}

function InfoRow({ label, children, value, seccionIndex, campoIndex, editing, onCampoChange, customEditor }: {
  label: string
  children?: React.ReactNode
  value?: string
  seccionIndex?: number
  campoIndex?: number
  editing?: boolean
  onCampoChange?: (seccionIndex: number, campoIndex: number, value: string) => void
  customEditor?: () => React.ReactNode
}) {
  const isEditable = seccionIndex !== undefined && campoIndex !== undefined && editing && onCampoChange
  const displayValue = value || ""

  return (
    <div className="flex items-stretch border-t border-neutral-300 first:border-t-0">
      <div className="w-[38%] shrink-0 border-r border-neutral-300 bg-neutral-50 p-3 font-bold">{label}</div>
      <div className="flex-1 p-3">
        {isEditable ? (
          customEditor ? (
            customEditor()
          ) : (
            <EditableField
              value={displayValue}
              onChange={(val) => onCampoChange(seccionIndex!, campoIndex!, val)}
              editing={editing}
              rows={displayValue.split('\n').length > 3 ? 6 : 2}
            />
          )
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`border border-neutral-300 bg-neutral-100 p-2 text-left font-bold ${className}`}>{children}</th>
  )
}

function Td({ children, className = "", seccionIndex, campoIndex, editing, onCampoChange }: {
  children?: React.ReactNode
  className?: string
  seccionIndex?: number
  campoIndex?: number
  editing?: boolean
  onCampoChange?: (seccionIndex: number, campoIndex: number, value: string) => void
  customEditor?: () => React.ReactNode
}) {
  const value = typeof children === 'string' ? children : ""
  const isEditable = seccionIndex !== undefined && campoIndex !== undefined && editing && onCampoChange

  return (
    <td className={`border border-neutral-300 p-2 align-middle ${className}`}>
      {isEditable ? (
        <EditableField
          value={value}
          onChange={(val) => onCampoChange(seccionIndex!, campoIndex!, val)}
          editing={editing}
          rows={value.split('\n').length > 2 ? 4 : 1}
        />
      ) : (
        children
      )}
    </td>
  )
}

function DocumentHeader({ nombreTipo }: { nombreTipo?: string }) {
  return (
    <table id="doc-header" className="mb-6 w-full border-collapse text-[11px]">
      <tbody>
        <tr>
          <td rowSpan={2} className="w-[36%] border border-neutral-400 p-2 align-middle">
            <div id="doc-header-logo" className="relative h-12 w-full">
              <div className="flex h-full w-full items-center justify-center border border-dashed border-neutral-300 rounded text-neutral-400 text-[10px]">
                LOGO
              </div>
            </div>
          </td>
          <td className="border border-neutral-400 p-2 align-middle">Versión: 01</td>
          <td rowSpan={2} className="w-[34%] border border-neutral-400 p-2 align-middle">
            <div>Fecha de Elaboración: 23 de julio 2026</div>
            <div id="page-indicator">Pagina 1 de 6</div>
          </td>
        </tr>
        <tr>
          <td className="border border-neutral-400 p-2 align-middle">Código: GF-FO-003</td>
        </tr>
        <tr>
          <td className="border border-neutral-400 p-2" />
          <td colSpan={2} className="border border-neutral-400 p-2">
            PROCESO: GESTION FABRICACION
          </td>
        </tr>
        <tr>
          <td className="border border-neutral-400 p-2" />
          <td colSpan={2} className="border border-neutral-400 p-2 font-bold">
            FORMATO: FICHA TÉCNICA DISPOSITIVO MÉDICO SOBRE MEDIDA BUCAL
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function FichaTecnicaGenerica({
  secciones,
  onCampoChange,
  editing,
  onToggleEditing,
  onDownload,
  downloading,
  showToolbar = true,
  nombreTipo,
}: Props) {
  const renderParagraphs = (text: string) => {
    const paragraphs = text.split('\n').filter((p) => p.trim())
    return paragraphs.map((p, i) => {
      const listContent = renderListContent(p)
      if (listContent) return <div key={i}>{listContent}</div>
      return <p key={i} className="mb-2">{p}</p>
    })
  }

  const renderListContent = (text: string) => {
    const items = text.split('\n').filter((line) => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
    if (items.length === 0) return null
    return (
      <ul className="ml-4 list-disc space-y-1">
        {items.map((item, i) => (
          <li key={i}>{item.trim().replace(/^[-\d.]+\s*/, '')}</li>
        ))}
      </ul>
    )
  }

  const seccionControlCambios = secciones.find((s) => s.titulo === "CONTROL DE CAMBIOS")
  const seccionElaboro = secciones.find((s) => s.titulo === "ELABORÓ")
  const seccionReviso = secciones.find((s) => s.titulo === "REVISÓ")
  const seccionAprobo = secciones.find((s) => s.titulo === "APROBÓ")

  return (
    <div>
      {showToolbar && (
        <div className="mx-auto mb-6 flex max-w-[794px] flex-wrap items-center justify-between gap-3 px-4">
          <div className="text-sm text-neutral-600">
            {editing ? (
              <span className="inline-flex items-center gap-1.5">
                <Pencil className="h-4 w-4 text-amber-600" aria-hidden />
                Haz clic en los campos <span className="rounded bg-[#fff2a8] px-1 text-neutral-800">amarillos</span> para
                editarlos
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
      )}

      <article
        id="documento"
        className="mx-auto max-w-[794px] bg-white px-8 py-10 text-[11px] leading-relaxed text-neutral-900 shadow-lg"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <DocumentHeader nombreTipo={nombreTipo} />

        {secciones.slice(0, 5).map((seccion, seccionIndex) => {
          return (
            <div key={seccion.titulo + seccionIndex}>
              <Section
                title={seccion.titulo}
                level={seccion.titulo.startsWith("1.") || seccion.titulo.startsWith("2.") ? 1 : 2}
              />
              <InfoTable>
                {seccion.campos.map((campo, campoIndex) => {
                  const isLargeField =
                    campo.label === "Materiales Empleados" ||
                    campo.label === "Normas aplicadas" ||
                    campo.label === "Análisis de riesgos" ||
                    campo.label === "Advertencias y contraindicaciones" ||
                    campo.label === "Instrucciones de uso" ||
                    campo.label === "Instrucciones de mantenimiento" ||
                    campo.label === "Garantía" ||
                    campo.label === "Descripción técnica del dispositivo médico" ||
                    campo.label === "Uso previsto" ||
                    campo.label === "Vida útil estimada"

                  return (
                    <InfoRow
                      key={campo.label}
                      label={campo.label}
                      value={campo.value}
                      seccionIndex={seccionIndex}
                      campoIndex={campoIndex}
                      editing={editing && CAMPOS_EDITABLES.includes(campo.label)}
                      onCampoChange={onCampoChange}
                    >
                      {isLargeField ? (
                        <div className="whitespace-pre-line">
                          {renderParagraphs(campo.value)}
                        </div>
                      ) : (
                        campo.value || <span className="text-neutral-400">Sin información</span>
                      )}
                    </InfoRow>
                  )
                })}
              </InfoTable>
            </div>
          )
        })}

        {secciones.find((s) => s.titulo === "6. Firma" || s.titulo === "Firma") && (
          <div>
            <p data-block className="mb-6 mt-8 font-bold">
              6. Firma:{" "}
              {secciones.find((s) => s.titulo === "6. Firma" || s.titulo === "Firma")?.campos[0]?.value ||
                "Firma autorizada (nombre y firma del director técnico / perfil profesional)"}
            </p>
          </div>
        )}

        {seccionControlCambios && (
          <div>
            <h3 data-block className="mb-2 mt-8 text-[11px] font-bold">
              CONTROL DE CAMBIOS
            </h3>
            <table data-block className="mb-8 w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  <Th>VERSIÓN</Th>
                  <Th>FECHA DE APROBACIÓN</Th>
                  <Th>DESCRIPCIÓN DEL CAMBIO</Th>
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  { length: Math.floor(seccionControlCambios.campos.length / 3) },
                  (_, i) => (
                    <tr key={i}>
                      <Td>{seccionControlCambios.campos[i * 3]?.value}</Td>
                      <Td>{seccionControlCambios.campos[i * 3 + 1]?.value}</Td>
                      <Td>{seccionControlCambios.campos[i * 3 + 2]?.value}</Td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        {[seccionElaboro, seccionReviso, seccionAprobo]
          .filter(Boolean)
          .length > 0 && (
            <table data-block className="w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  <Th className="w-32" />
                  <Th className="w-[40%]">NOMBRES Y APELLIDOS</Th>
                  <Th className="w-[30%]">CARGO</Th>
                  <Th className="w-[30%]">FIRMA</Th>
                </tr>
              </thead>
              <tbody>
                {[seccionElaboro, seccionReviso, seccionAprobo]
                  .filter(Boolean)
                  .map((seccion) => {
                    if (!seccion) return null
                    return (
                      <tr key={seccion.titulo}>
                        <Td className="font-bold h-20 align-middle">{seccion.titulo}</Td>
                        <Td className="h-20 align-middle">
                          <div className="min-h-[1.5rem] overflow-hidden">
                            {seccion.campos[0]?.value || <span className="text-neutral-400">Sin información</span>}
                          </div>
                        </Td>
                        <Td className="h-20 align-middle">
                          <div className="min-h-[1.5rem] overflow-hidden">
                            {seccion.campos[1]?.value || <span className="text-neutral-400">Sin información</span>}
                          </div>
                        </Td>
                        <Td className="h-20 align-middle">
                          <div className="min-h-[1.5rem] overflow-hidden">
                            {seccion.campos[2]?.value && seccion.campos[2].value.startsWith("/") ? (
                              <img src={seccion.campos[2].value} alt="Firma" className="h-20 object-contain" />
                            ) : (
                              seccion.campos[2]?.value || <span className="text-neutral-400">Sin información</span>
                            )}
                          </div>
                        </Td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
      </article>
    </div>
  )
}
