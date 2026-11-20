"use client"

import {
  BarraHerramientas,
  BloqueSeccion,
  EncabezadoFicha,
  InfoRow,
  PieFicha,
  renderTextoLargo,
  useControlFicha,
  useFirmas,
} from "./ficha-tecnica-generica"
import type { ControlFicha, FilaCambio, Firma, Seccion } from "./types"

export type { CampoEditable, Seccion } from "./types"

type Props = {
  secciones: Seccion[]
  onCampoChange: (seccionIndex: number, campoIndex: number, value: string) => void
  editing: boolean
  onToggleEditing: () => void
  onDownload: () => void
  downloading: boolean
  showToolbar?: boolean
  dientes?: string[]
  codigoTrazabilidad?: string
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

export function FichaTecnicaRenderer({
  secciones,
  onCampoChange,
  editing,
  onToggleEditing,
  onDownload,
  downloading,
  showToolbar = true,
  dientes,
  codigoTrazabilidad = "",
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
            renderCampo={(campo, campoIndex, isFirst, block) => {
              const isMateriales = campo.label === "Materiales Empleados"
              const isClasificacion = campo.label === "Clasificación de DMSMB"
              const isEspecificaciones = campo.label === "Especificaciones de diseño"
              const isNumeroSerie = campo.label === "Número de Serie o identificación del dispositivo"

              const isCampoEditable =
                (seccionIndex === 0 && !isClasificacion) ||
                (seccionIndex === 1 && isMateriales) ||
                (seccionIndex === 2 && isEspecificaciones)

              // Dientes seleccionados dentro del número de serie
              let selectedDientes: string[] = []
              if (isNumeroSerie && campo.value && codigoTrazabilidad) {
                const raw = String(campo.value)
                const prefix = `${codigoTrazabilidad}-`
                if (raw.startsWith(prefix)) {
                  const rest = raw.slice(prefix.length)
                  selectedDientes = rest.includes(",")
                    ? rest.split(",").map((v) => v.replace(`${codigoTrazabilidad}-`, "")).filter(Boolean)
                    : rest.split("-").filter(Boolean)
                }
              }

              const customEditorNumeroSerie =
                isNumeroSerie && editing && isCampoEditable && dientes && dientes.length > 0
                  ? () => (
                      <div className="space-y-1">
                        {dientes.length > 1 && (
                          <label className="flex items-center gap-2 text-[11px]">
                            <input
                              type="checkbox"
                              checked={selectedDientes.length === dientes.length}
                              onChange={(e) =>
                                onCampoChange(
                                  seccionIndex,
                                  campoIndex,
                                  e.target.checked ? `${codigoTrazabilidad}-${dientes.join("-")}` : "",
                                )
                              }
                            />
                            <span> Todos ({dientes.join("-")})</span>
                          </label>
                        )}
                        {dientes.map((d) => (
                          <label key={d} className="flex items-center gap-2 text-[11px]">
                            <input
                              type="checkbox"
                              checked={selectedDientes.includes(d)}
                              onChange={(e) => {
                                const nuevos = e.target.checked
                                  ? [...selectedDientes, d]
                                  : selectedDientes.filter((x) => x !== d)
                                onCampoChange(
                                  seccionIndex,
                                  campoIndex,
                                  nuevos.length > 0 ? `${codigoTrazabilidad}-${nuevos.join("-")}` : "",
                                )
                              }}
                            />
                            <span>{d}</span>
                          </label>
                        ))}
                      </div>
                    )
                  : undefined

              return (
                <InfoRow
                  key={campo.label}
                  label={campo.label}
                  value={campo.value}
                  seccionIndex={seccionIndex}
                  campoIndex={campoIndex}
                  editing={editing && isCampoEditable}
                  onCampoChange={onCampoChange}
                  customEditor={customEditorNumeroSerie}
                  isFirst={isFirst}
                  block={block}
                >
                  {CAMPOS_LARGOS.includes(campo.label) ? (
                    <div className="whitespace-pre-line">{renderTextoLargo(campo.value)}</div>
                  ) : (
                    campo.value || <span className="text-neutral-400">Sin información</span>
                  )}
                </InfoRow>
              )
            }}
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