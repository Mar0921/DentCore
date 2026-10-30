"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import {
  FileText,
  ArrowLeft,
  Download,
  Eye,
  Save,
  X,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FichaTecnicaColadoUcla } from "@/components/dentcore/fichas-tecnicas/ficha-tecnica-colado-ucla"
import { FichaTecnicaCeramicaEncia } from "@/components/dentcore/fichas-tecnicas/ficha-tecnica-ceramica-encia"
import { FichaTecnicaGenerica } from "@/components/dentcore/fichas-tecnicas/ficha-tecnica-generica"
import { PLANTILLAS_FICHAS, PlantillaFicha } from "@/components/dentcore/fichas-tecnicas/plantillas"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FichaTecnica {
  id: string
  nombre: string
  tipo: string
  fecha: string
  url: string
  secciones?: Seccion[]
}

export interface CampoEditable {
  label: string
  value: string
}

export interface Seccion {
  titulo: string
  campos: CampoEditable[]
}

interface SolicitudCompleta {
  id: string | number
  paciente: string
  odontologo: string | null
  codigo_trazabilidad: string
  dientes_trabajados: string[]
  servicios_detalle?: { dientes: string | null }[]
  dientes_disponibles?: string[]
  laboratorio_id?: string | null
}

export default function FichasTecnicasPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <FichasTecnicasPageInner />
    </Suspense>
  )
}

function FichasTecnicasPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const solicitudIdParam = searchParams.get("solicitud_id")

  const [fichas, setFichas] = useState<FichaTecnica[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudCompleta[]>([])
  const [loading, setLoading] = useState(true)

  const [showFichaModal, setShowFichaModal] = useState(false)
  const [fichaActual, setFichaActual] = useState<Seccion[]>([])
  const [tipoFichaActual, setTipoFichaActual] = useState<string>("")
  const [editingFicha, setEditingFicha] = useState(true)
  const [downloadingFicha, setDownloadingFicha] = useState(false)
  const [solicitudActualId, setSolicitudActualId] = useState<string | number | null>(null)
  const [fichasGuardadasPorSolicitud, setFichasGuardadasPorSolicitud] = useState<Record<string, FichaTecnica[]>>({})
  const [solicitudActual, setSolicitudActual] = useState<SolicitudCompleta | null>(null)
  const [cargandoDientesModal, setCargandoDientesModal] = useState(false)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      if (!solicitudIdParam) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/solicitudes?id=${encodeURIComponent(solicitudIdParam)}`)
        if (res.ok) {
          const result = await res.json()
          const data = result?.data || null
          if (data) {
          const solicitudCompleta: SolicitudCompleta = {
            id: data.id,
            paciente: data.paciente || "",
            odontologo: data.odontologonombre || null,
            codigo_trazabilidad: data.codigo_trazabilidad || "",
            dientes_trabajados: data.dientes ? String(data.dientes).split(/[\s,]+/).filter(Boolean) : [],
            servicios_detalle: [],
            dientes_disponibles: [],
            laboratorio_id: data.laboratorio_id || data.laboratorioId || null,
          }
            setSolicitudes([solicitudCompleta])
            setSolicitudActual(solicitudCompleta)
            setSolicitudActualId(data.id)
          }
        }
      } catch (e) {
        console.error("Error cargando solicitud:", e)
      }
      try {
        const res = await fetch(`/api/fichas-tecnicas?solicitud_id=${encodeURIComponent(solicitudIdParam)}`)
        if (res.ok) {
          const result = await res.json()
          const data = result.data || []
          const fichasList: FichaTecnica[] = data.map((f: any) => ({
            id: f.id,
            nombre: f.nombre,
            tipo: f.tipo,
            fecha: f.fecha,
            url: "#",
            secciones: f.secciones || [],
          }))
          setFichas(fichasList)
          setFichasGuardadasPorSolicitud((prev) => ({
            ...prev,
            [solicitudIdParam]: fichasList,
          }))
        }
      } catch (e) {
        console.error("Error cargando fichas:", e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [solicitudIdParam])

  const crearFichaVacia = (tipo: string, solicitud?: SolicitudCompleta | null): Seccion[] => {
    const paciente = solicitud?.paciente || "SAMY"
    const prescriptor = solicitud?.odontologo || "leia"
    const codigo = solicitud?.codigo_trazabilidad || "DC-20261029143108"
    const dientes = solicitud?.dientes_trabajados || ["11"]
    const numeroSerie = `${codigo}-${dientes.join("-")}`
    const fechaHoy = "29/10/2026"

    if (tipo === "Provisional Resina Impresa") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / provisional en termocurado",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración dental provisional fabricada a medida para cada paciente mediante resina acrílica termocurada de uso odontológico. Elaborada en laboratorio dental mediante procesos de polimerización por calor, diseñada para reemplazar temporalmente dientes o estructuras dentales ausentes o preparadas, proporcionando protección, función masticatoria, estabilidad oclusal y estética durante el período previo a la instalación de la restauración definitiva.",
            },
            {
              label: "Uso previsto",
              value:
                "Mantener la función, estética y protección de dientes preparados o espacios edéntulos durante tratamientos protésicos, restauradores o de rehabilitación oral. Su finalidad es preservar la posición de los dientes, proteger los tejidos orales, favorecer la adaptación funcional y estética del paciente y servir como restauración temporal mientras se fabrica el dispositivo definitivo.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Resina acrílica termocurada de grado odontológico.\nPigmentos y caracterizadores dentales biocompatibles (cuando aplique).\nMateriales para acabado, ajuste y pulido.\nDebe registrarse la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Dispositivo de carácter temporal con una vida útil estimada entre 3 y 12 meses, dependiendo de las condiciones clínicas, ubicación de la restauración, hábitos del paciente, fuerzas masticatorias y cumplimiento de las recomendaciones profesionales. Durante este período pueden requerirse ajustes, reparaciones, rebasados o recementaciones para mantener su correcta adaptación, funcionalidad y comodidad hasta la colocación de la restauración definitiva.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "El provisional en resina acrílica termocurada es una restauración temporal utilizada para proteger dientes preparados o reemplazar temporalmente dientes ausentes durante un tratamiento odontológico. Aunque es un dispositivo de bajo riesgo, pueden presentarse molestias leves durante el período de adaptación, sensibilidad dental temporal, desgaste del material, fractura o desprendimiento de la restauración. También puede producirse acumulación de placa bacteriana o irritación gingival si no se mantiene una adecuada higiene oral. En casos poco frecuentes, pueden presentarse reacciones de hipersensibilidad a los materiales empleados.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Advertencias:\nEste dispositivo es de carácter temporal y no sustituye la restauración definitiva.\nEvite consumir alimentos muy duros, pegajosos o que requieran una fuerza excesiva de masticación.\nMantenga una adecuada higiene oral para prevenir inflamación de las encías y problemas periodontales.\nNo manipule, ajuste ni intente reparar la restauración por su cuenta.\nAcuda a los controles odontológicos programados para verificar su adaptación y estado.\nContraindicaciones:\nPacientes con alergia conocida a alguno de los componentes de la resina acrílica utilizada.\nCasos clínicos en los que el profesional determine que otro tipo de restauración provisional es más apropiado.\nPacientes con hábitos parafuncionales severos no controlados (bruxismo intenso), salvo indicación profesional.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Cepille sus dientes después de cada comida utilizando un cepillo de cerdas suaves y crema dental.\nUtilice seda dental de acuerdo con las recomendaciones de su odontólogo.\nEvite masticar alimentos extremadamente duros o pegajosos que puedan fracturar o desprender la restauración.\nMantenga las citas de control programadas por el profesional tratante.\nSi presenta molestias persistentes, fractura, aflojamiento o desprendimiento del provisional, contacte a su odontólogo de manera inmediata.\nSiga todas las recomendaciones específicas proporcionadas por el profesional responsable de su tratamiento.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value: "Revisiones periódicas recomendadas cada 6–12 meses.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nNo aplica.",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Provisional PMMA") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / provisional en PMMA",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración dental provisional fabricada a medida para cada paciente en PMMA (Polimetilmetacrilato) de grado odontológico, mediante técnicas CAD/CAM. Diseñada para reemplazar temporalmente dientes ausentes o proteger dientes preparados, proporcionando función masticatoria, estabilidad oclusal, protección de tejidos dentales y estética durante el período previo a la colocación de la restauración definitiva.",
            },
            {
              label: "Uso previsto",
              value:
                "Mantener la función, estética y comodidad del paciente durante tratamientos protésicos, implantológicos o rehabilitadores. Su finalidad es proteger los dientes preparados y tejidos orales, preservar la posición dental, evaluar aspectos funcionales y estéticos del tratamiento y servir como restauración temporal mientras se fabrica o instala la restauración definitiva.",
            },
            {
              label: "Materiales Empleados",
              value:
                "PMMA (Polimetilmetacrilato) de grado médico/odontológico.\nDiscos o bloques de PMMA para sistemas CAD/CAM (cuando aplique).\nMateriales para acabado, ajuste y pulido de restauraciones dentales.\nCemento provisional o sistema de fijación temporal indicado por el profesional tratante.\nDebe registrarse la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Dispositivo de uso temporal con una vida útil estimada entre 6 meses y 2 años, dependiendo de la indicación clínica, ubicación de la restauración, hábitos del paciente, condiciones oclusales y cumplimiento de los controles odontológicos. Durante este período pueden requerirse ajustes, pulidos, reparaciones o recementaciones para mantener su adecuada funcionalidad, estética y adaptación.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "El provisional en PMMA es una restauración temporal utilizada para proteger dientes preparados o reemplazar temporalmente dientes ausentes durante tratamientos odontológicos. Su uso presenta un bajo nivel de riesgo; sin embargo, pueden presentarse molestias leves durante el período de adaptación, sensibilidad temporal, desgaste o fractura del material, aflojamiento o desprendimiento de la restauración y acumulación de placa bacteriana si no se mantiene una adecuada higiene oral. En casos poco frecuentes, pueden presentarse reacciones de hipersensibilidad a los materiales utilizados.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Advertencias:\nEste dispositivo está diseñado para uso temporal y no reemplaza la restauración definitiva.\nEvite morder alimentos extremadamente duros o pegajosos que puedan fracturar o desprender la restauración.\nMantenga una adecuada higiene oral para prevenir inflamación de la encía y acumulación de placa bacteriana.\nNo intente modificar, ajustar o reparar el dispositivo por cuenta propia.\nAsista a los controles periódicos indicados por su odontólogo.\nContraindicaciones:\nPacientes con alergia o sensibilidad conocida al PMMA o a cualquiera de los materiales utilizados en la fabricación del dispositivo.\nCasos clínicos en los que el profesional tratante determine que otro tipo de restauración provisional es más adecuado.\nPacientes con hábitos parafuncionales severos no controlados, salvo indicación profesional específica.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Mantenga una adecuada higiene oral mediante cepillado después de cada comida y uso diario de seda dental.\nEvite alimentos muy duros, pegajosos o que requieran una fuerza excesiva de masticación.\nSiga las recomendaciones específicas dadas por su odontólogo respecto al cuidado del provisional.\nAcuda a las citas de control programadas para verificar la adaptación, funcionalidad y estado de la restauración.\nEn caso de fractura, movilidad, desprendimiento o molestias persistentes, consulte inmediatamente a su odontólogo.\nSi utiliza férula o protector nocturno, úselo de acuerdo con las indicaciones profesionales.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value: "Revisiones periódicas recomendadas cada 3–6 meses.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nNo aplica.",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Provisional PMMA sobre Implante") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / Provisional en PMMA sobre implante",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración provisional sobre implante fabricada a medida para cada paciente en PMMA (Polimetilmetacrilato) de grado odontológico, mediante tecnología CAD/CAM. Diseñada para ser instalada sobre un implante dental mediante un pilar protésico, permitiendo la rehabilitación temporal de uno o varios dientes ausentes mientras se completa el proceso de oseointegración o se fabrica la restauración definitiva. Proporciona función, estética y soporte de los tejidos blandos periimplantarios.",
            },
            {
              label: "Uso previsto",
              value:
                "Restaurar temporalmente la función masticatoria, fonética y estética en pacientes portadores de implantes dentales. Su finalidad es proteger el implante y los tejidos circundantes, favorecer el acondicionamiento gingival, mantener los espacios protésicos y permitir la evaluación clínica de aspectos funcionales y estéticos antes de la colocación de la restauración definitiva.",
            },
            {
              label: "Materiales Empleados",
              value:
                "PMMA (Polimetilmetacrilato) de grado odontológico.\nDiscos o bloques de PMMA para sistemas CAD/CAM (cuando aplique).\nPilar provisional o componente protésico compatible con el sistema de implantes utilizado.\nTornillo protésico para fijación temporal (cuando aplique).\nMateriales para acabado, ajuste y pulido.\nDebe registrarse la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Dispositivo de uso temporal con una vida útil estimada entre 6 meses y 2 años, dependiendo de las condiciones clínicas, el proceso de oseointegración, las cargas oclusales, los hábitos del paciente y el plan de tratamiento establecido por el profesional tratante. Durante este período pueden requerirse ajustes, reparaciones, pulidos o reemplazos para garantizar su correcto funcionamiento y adaptación hasta la colocación de la restauración definitiva.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "El uso de un Provisional en PMMA sobre Implante puede presentar riesgos como sensibilidad o molestias temporales durante el período de adaptación, irritación de los tejidos blandos periimplantarios, inflamación gingival por higiene deficiente, aflojamiento de tornillos protésicos, desgaste o fractura de la restauración provisional debido a cargas excesivas o traumatismos. También pueden presentarse alteraciones funcionales o estéticas si el dispositivo sufre deformaciones o daños. Ante cualquier molestia persistente, movilidad o fractura, se debe consultar inmediatamente al profesional tratante.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Utilizar únicamente bajo supervisión de un odontólogo o implantólogo.\nEvitar masticar alimentos muy duros, pegajosos o de alta resistencia que puedan fracturar el provisional.\nNo manipular, ajustar ni intentar retirar la restauración por cuenta propia.\nMantener una adecuada higiene oral para prevenir inflamación de los tejidos periimplantarios.\nNo utilizar el dispositivo si presenta fracturas, fisuras, desprendimientos o movilidad.\nAcudir inmediatamente al profesional tratante si observa aflojamiento, fractura o cambios en la adaptación de la prótesis provisional.\nEstá contraindicado en pacientes con alergia conocida a alguno de los materiales empleados en su fabricación o cuando el profesional determine que su uso no es clínicamente adecuado.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Durante los primeros días es normal experimentar una ligera sensación de presión, sensibilidad o cambios temporales en la mordida.\nSiga estrictamente las recomendaciones proporcionadas por el odontólogo o implantólogo.\nCepille cuidadosamente los dientes y la restauración provisional después de cada comida utilizando un cepillo de cerdas suaves.\nLimpie cuidadosamente la zona alrededor del implante siguiendo las indicaciones del profesional tratante.\nUtilice los elementos de higiene recomendados, como seda dental especial, cepillos interproximales o irrigadores bucales, cuando estén indicados.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Cepille cuidadosamente la restauración provisional y los dientes adyacentes después de cada comida utilizando un cepillo de cerdas suaves.\nLimpie cuidadosamente la zona alrededor del implante para evitar la acumulación de placa bacteriana.\nUtilice los implementos de higiene recomendados por el profesional tratante, como seda dental, cepillos interproximales o irrigadores bucales.. Revisiones periódicas recomendadas cada 6–12 meses.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nNo aplica.",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: "Jazmin Valencia" }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Prótesis Híbrida All-on-Four") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de prótesis total / prótesis hibrida all on four",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Prótesis fija implantosoportada fabricada individualmente para cada paciente a partir de registros clínicos y digitales. Está compuesta por una estructura rígida de soporte, dientes artificiales y encía protésica, unida a dos o más implantes dentales mediante componentes protésicos atornillados. Diseñada para proporcionar estabilidad, retención, distribución adecuada de cargas masticatorias y una rehabilitación funcional y estética de arco completo.",
            },
            {
              label: "Uso previsto",
              value:
                "Dispositivo médico odontológico sobre medida diseñado para rehabilitar pacientes total o parcialmente edéntulos mediante una prótesis fija implantosoportada. Su función es restablecer la estética, la función masticatoria, la fonación y la calidad de vida del paciente, apoyándose sobre dos o más implantes dentales estratégicamente ubicados en el maxilar o la mandíbula según el protocolo All-on-Four.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Estructura protésica elaborada en titanio grado médico, cobalto-cromo o zirconia según diseño clínico.\nEncía artificial y base protésica confeccionadas en resina acrílica de grado médico.\nDientes protésicos en resina acrílica multicapa o cerámica. Componentes protésicos implantables (cilindros, tornillos y aditamentos) fabricados en titanio grado médico.\nTodos los materiales utilizados son biocompatibles y aptos para uso intraoral prolongado.\nDebe registrarse la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "La vida útil estimada de la prótesis híbrida All-on-Four es de 5 a 15 años, dependiendo de los materiales utilizados, hábitos del paciente, higiene oral, condiciones funcionales y controles periódicos de mantenimiento. Durante este período pueden requerirse ajustes, recambio de tornillos, reparaciones de la resina acrílica o sustitución de dientes protésicos debido al desgaste normal.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "El uso de la prótesis híbrida All-on-Four puede estar asociado a riesgos como irritación o inflamación de los tejidos periimplantarios, incompatibilidad oclusal, acumulación de placa bacteriana alrededor de los implantes, aflojamiento o fractura de tornillos protésicos, desgaste o fractura de los dientes protésicos, dificultades en la higiene oral y molestias durante el período de adaptación. Estos riesgos pueden minimizarse mediante una adecuada higiene oral, el cumplimiento de las recomendaciones del odontólogo y la asistencia periódica a controles de mantenimiento.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "No manipule ni intente ajustar los tornillos o componentes de la prótesis por cuenta propia.\nSi percibe movilidad de la prótesis, dolor, inflamación, sangrado, mal olor persistente o cualquier cambio en su ajuste o funcionamiento, consulte inmediatamente a su odontólogo.\nMantenga una higiene oral rigurosa y asista a los controles programados.\nEl uso de la prótesis puede estar contraindicado en pacientes con alergia conocida a alguno de sus materiales constitutivos o en aquellos que no puedan mantener una adecuada higiene oral y seguimiento clínico.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "La prótesis híbrida All-on-Four es una rehabilitación fija que debe permanecer instalada en boca y únicamente puede ser retirada por el profesional en odontología.\nMantenga una higiene diaria cuidadosa utilizando cepillos especiales, seda dental con enhebradores, cepillos interproximales o irrigadores orales según las indicaciones recibidas.\nEvite morder objetos duros o utilizar los dientes protésicos para actividades diferentes a la masticación de alimentos.\nAsista a los controles periódicos establecidos por su odontólogo para verificar la estabilidad de los implantes, el estado de la prótesis y realizar los mantenimientos preventivos necesarios.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Realice una higiene oral exhaustiva después de cada comida, limpiando cuidadosamente la prótesis y los tejidos circundantes mediante cepillos de cerdas suaves, cepillos interproximales, seda dental para con enhedradores o usar irrigadores orales, según las recomendaciones de su odontólogo.\nUtilice únicamente productos de higiene oral recomendados por el profesional tratante.\nEvite el uso de elementos abrasivos que puedan rayar o deteriorar los componentes de la prótesis.\nEvite morder alimentos extremadamente duros, hielo, huesos, semillas o cualquier objeto que pueda generar sobrecarga mecánica, fracturas o aflojamiento de los componentes protésicos.\nNo intente desmontar, ajustar o reparar la prótesis por cuenta propia. Cualquier procedimiento de mantenimiento o reparación debe ser realizado exclusivamente por un profesional en odontología calificado.\nAcuda a controles periódicos cada seis meses o con la frecuencia indicada por su odontólogo para evaluar el estado de los implantes, la estabilidad de los tornillos, la integridad de la prótesis y la salud de los tejidos periimplantarios.\nInforme inmediatamente a su odontólogo si presenta movilidad de la prótesis, aflojamiento de tornillos, fracturas, molestias al masticar, inflamación, sangrado, mal olor persistente o cualquier cambio en su funcionamiento habitual.\nEvite hábitos que puedan comprometer la durabilidad de la rehabilitación, como bruxismo no controlado, morder objetos duros, abrir envases con los dientes o consumir sustancias que puedan afectar la salud oral.\nMantenga una adecuada salud general y periodontal, siguiendo las recomendaciones médicas y odontológicas para favorecer la estabilidad y longevidad de los implantes y de la prótesis.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Núcleo NPG") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de producción fija / Núcleo NPG",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Núcleo colado intrarradicular fabricado a medida para cada paciente en aleación NPG (aleación metálica de alta resistencia y biocompatibilidad para uso odontológico). Diseñado para adaptarse al conducto radicular previamente tratado endodónticamente y proporcionar soporte, retención y estabilidad a una restauración coronaria definitiva. Su elaboración se realiza mediante técnicas de laboratorio dental a partir de impresiones o modelos suministrados por el profesional tratante.",
            },
            {
              label: "Uso previsto",
              value:
                "Restaurar dientes con pérdida extensa de estructura coronaria que han sido sometidos a tratamiento endodóntico, proporcionando una base sólida para la colocación de coronas u otras restauraciones protésicas definitivas. Su función es mejorar la retención, distribución de cargas masticatorias y estabilidad de la rehabilitación dental.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Aleación NPG (Non-Precious Gold) para uso odontológico.\nResinas de patrón o materiales para modelado del núcleo.\nMateriales de revestimiento y colado utilizados en laboratorio dental.\nSe deberá registrar la marca comercial, referencia y número de lote de cada material utilizado en la fabricación del dispositivo médico sobre medida bucal.",
            },
            {
              label: "Vida útil estimada",
              value:
                "La vida útil estimada del núcleo colado en NPG es de 10 a 15 años o más, dependiendo de factores como la salud periodontal, la calidad de la restauración definitiva, las condiciones oclusales, los hábitos del paciente y el cumplimiento de los controles odontológicos periódicos. Durante este período pueden requerirse procedimientos sustitución de la restauración cuando sea clínicamente necesario.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "El núcleo colado en NPG es un dispositivo dental utilizado para reforzar dientes tratados endodónticamente y servir de soporte para una corona definitiva. Cuando es instalado correctamente por un profesional odontólogo, los riesgos son mínimos. Sin embargo, pueden presentarse sensibilidad temporal, molestias durante la adaptación, descementación del núcleo o de la corona, fractura del diente remanente debido a sobrecargas oclusales o, en casos poco frecuentes, reacciones de hipersensibilidad a los materiales utilizados.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Advertencias:\nMantenga una adecuada higiene oral para preservar la salud del diente y los tejidos circundantes.\nAsista a controles odontológicos periódicos para evaluar el estado de la restauración.\nEvite morder objetos duros o utilizar los dientes como herramienta para prevenir fracturas o desprendimientos.\nConsulte a su odontólogo si presenta dolor persistente, movilidad de la restauración o cambios en la mordida.\nContraindicaciones:\nPacientes con alergia conocida a alguno de los componentes de la aleación NPG.\nDientes con estructura remanente insuficiente o condiciones clínicas que, según criterio profesional, no permitan la instalación segura del dispositivo.\nCasos en los que existan infecciones activas o enfermedad periodontal no controlada que requieran tratamiento previo.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Mantenga una higiene oral adecuada mediante cepillado dental después de cada comida y uso diario de seda dental.\nCumpla con las recomendaciones específicas indicadas por su odontólogo.\nAcuda a los controles periódicos para verificar el estado del núcleo, la corona y los tejidos de soporte.\nEvite hábitos como morder hielo, abrir envases con los dientes o consumir frecuentemente alimentos extremadamente duros.\nEn caso de presentar dolor, inflamación, movilidad o desprendimiento de la restauración, solicite atención odontológica de inmediato.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value: "Revisiones periódicas recomendadas cada 6–12 meses.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Incrustación de Metal") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / incrustacion en metal",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración dental indirecta tipo incrustación metálica (inlay), fabricada a medida para cada paciente. Diseñada para rehabilitar pérdidas parciales de estructura dentaria en dientes posteriores, ajustándose anatómicamente a la cavidad preparada, con aleación metálica biocompatible y cementada de forma definitiva al diente.",
            },
            {
              label: "Uso previsto",
              value:
                "Restablecer la forma, función y resistencia mecánica de dientes con pérdida moderada de tejido dental causada por caries, fracturas o restauraciones extensas. La incrustación metálica permite recuperar la anatomía oclusal, la función masticatoria y la integridad estructural del diente, contribuyendo a la conservación de la pieza dental remanente.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Aleación metálica odontológica biocompatible (Níquel-Cromo, Cobalto-Cromo o aleación noble, según prescripción clínica).\nMateriales para modelado y colado.\nSe debe registrar la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo médico sobre medida bucal.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Entre 10 y 15 años, dependiendo de las condiciones de uso, higiene oral del paciente, controles odontológicos periódicos y ausencia de hábitos parafuncionales. Durante este período pueden requerirse procedimientos de mantenimiento.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "El uso de la incrustación metálica dental presenta riesgos mínimos cuando es instalada y supervisada por un profesional odontológico. En algunos casos pueden presentarse sensibilidad dental temporal, molestias durante el período de adaptación, reacciones alérgicas a componentes metálicos en pacientes susceptibles, o desprendimiento de la restauración debido a traumatismos o desgaste del cemento de fijación.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Advertencias:\nMantenga una adecuada higiene oral para prolongar la vida útil de la restauración.\nAcuda a controles odontológicos periódicos para verificar el estado de la incrustación.\nEvite masticar objetos extremadamente duros que puedan afectar la restauración o el diente.\nContraindicaciones:\nPacientes con alergia conocida a alguno de los componentes de la aleación metálica utilizada.\nInstrucciones de uso\nMantenga una correcta higiene bucal mediante cepillado dental y uso de seda dental diariamente.\nSiga las recomendaciones indicadas por su odontólogo.\nAsista a controles periódicos para evaluar el estado de la restauración.\nEn caso de presentar dolor persistente, movilidad de la incrustación o cualquier anomalía, consulte inmediatamente a su odontólogo.\nNo requiere procedimientos especiales de limpieza diferentes a los recomendados para la higiene oral habitual.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value: "Revisiones periódicas recomendadas cada 6–12 meses.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Incrustación de Disilicato") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / Incrustacion en Disilicato de litio",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración dental indirecta sobre medida elaborada en cerámica de disilicato de litio de grado médico, diseñada para reconstruir parcial o totalmente la estructura coronaria de un diente afectado. Fabricada mediante tecnología CAD/CAM o técnicas de laboratorio convencionales, ofreciendo alta resistencia mecánica, excelente estética y biocompatibilidad. La restauración se adapta de manera individual a las características anatómicas y funcionales del paciente.",
            },
            {
              label: "Uso previsto",
              value:
                "Restaurar dientes con pérdida moderada de estructura dental ocasionada por caries, fracturas, desgaste o reemplazo de restauraciones defectuosas, preservando la mayor cantidad posible de tejido dental sano. Su finalidad es recuperar la función masticatoria, la anatomía dental, la estabilidad oclusal y la estética.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Cerámica de disilicato de litio de grado médico para uso odontológico, materiales de caracterización y pigmentación cerámica cuando sean requeridos, y materiales biocompatibles compatibles con los procedimientos adhesivos odontológicos.\nSe debe registrar la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo médico sobre medida bucal.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Entre 10 y 15 años o más, dependiendo de las condiciones clínicas del paciente, la higiene oral, los controles odontológicos periódicos, las cargas oclusales y la ausencia de hábitos parafuncionales no controlados. Durante su vida útil pueden requerirse mantenimiento o reparación según criterio clínico profesional.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "La incrustación en disilicato de litio está fabricada con materiales biocompatibles destinados al uso odontológico. Los riesgos potenciales son poco frecuentes e incluyen sensibilidad dental temporal posterior a la cementación, molestias durante el período de adaptación a la mordida, fractura de la restauración por traumatismos o fuerzas excesivas, descementación, desgaste de la restauración con el tiempo y posibles filtraciones marginales en caso de deterioro de la unión adhesiva.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Evite masticar objetos duros como hielo, huesos, semillas, caramelos duros o utilizar los dientes para abrir envases.\nInforme a su odontólogo si presenta dolor persistente, sensibilidad prolongada, fractura, movilidad o desprendimiento de la restauración.\nLos pacientes con bruxismo o hábitos de apretamiento dental deben seguir las recomendaciones profesionales y utilizar férulas de protección cuando sean indicadas.\nContraindicada en pacientes con hipersensibilidad conocida a cualquiera de los materiales utilizados en la restauración o cementación.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Mantenga una adecuada higiene oral mediante cepillado después de cada comida, uso diario de seda dental y controles odontológicos periódicos.\nEvite hábitos que generen cargas excesivas sobre la restauración, como morder objetos duros o utilizar los dientes como herramientas.\nAcuda regularmente a revisiones odontológicas para evaluar el estado de la incrustación y de los tejidos dentales adyacentes.\nEn caso de fractura, desgaste significativo o desprendimiento de la restauración, consulte inmediatamente a su odontólogo.\nNo intente reparar o recolocar la incrustación por cuenta propia.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Mantenga una adecuada higiene oral mediante cepillado dental después de cada comida utilizando un cepillo de cerdas suaves y crema dental.\nUtilice diariamente seda dental o elementos de higiene interdental para eliminar la placa bacteriana y los residuos alimenticios alrededor de la restauración.\nAcuda a controles odontológicos periódicos, al menos cada seis meses o según las indicaciones de su odontólogo, para evaluar el estado de la incrustación y de los tejidos dentales circundantes.\nNo intente reparar, ajustar o recolocar la restauración por cuenta propia; cualquier intervención debe ser realizada por un profesional.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Corona de Zirconio sobre Implante") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / corona en zirconio sobre implante",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración protésica fija sobre medida bucal, elaborada en zirconio de grado médico (material compuesto reforzado con partículas cerámicas), diseñada para restaurar la anatomía, función masticatoria, fonética y estética de dientes naturales o rehabilitados. Fabricada de forma personalizada según la prescripción del odontólogo tratante y las características anatómicas y funcionales del paciente.",
            },
            {
              label: "Uso previsto",
              value:
                "Restauración protésica fija sobre implante dental destinada a reemplazar uno o varios dientes ausentes, restaurando la función masticatoria, la estética, la fonación y la estabilidad oclusal del paciente. Diseñada para ser cementada o atornillada sobre una estructura protésica compatible con el sistema de implantes utilizado.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Zirconio policristalino tetragonal estabilizado con itrio (Y-TZP) de grado médico para uso odontológico.\nPuede incluir interfase o base de titanio grado médico (Ti-6Al-4V o titanio grado 4) según el diseño protésico.\nMateriales auxiliares de fabricación: cerámicas de maquillaje, pigmentos certificados para uso dental y agentes de cementación o fijación según indicación clínica.\nSe debe registrar la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo médico sobre medida bucal.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Entre 10 y 15 años o más, siempre que se mantengan condiciones adecuadas de higiene oral, controles odontológicos periódicos y ausencia de hábitos parafuncionales severos. La vida útil puede variar según las condiciones clínicas del paciente, la carga funcional, el mantenimiento preventivo y el estado del implante y tejidos de soporte.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "Posibles riesgos asociados al uso de la restauración incluyen desgaste o fractura de la corona por fuerzas masticatorias excesivas, desprendimiento o descementación de la restauración, sensibilidad dental, acumulación de placa bacteriana por higiene inadecuada, irritación de los tejidos gingivales y alteraciones funcionales o estéticas derivadas del desgaste natural del material con el tiempo.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Mantenga una adecuada higiene oral para preservar la salud del diente restaurado y de los tejidos circundantes.\nEvite morder objetos duros como hielo, huesos, bolígrafos o utilizar los dientes para abrir envases.\nNo intente ajustar o reparar la restauración por cuenta propia.\nConsulte a su odontólogo si presenta dolor, movilidad, fractura, sensibilidad persistente o cualquier cambio en la restauración.\nLos pacientes con bruxismo deben seguir las recomendaciones de protección indicadas por el profesional tratante.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Cepille sus dientes después de cada comida utilizando un cepillo de cerdas suaves y crema dental de baja abrasividad.\nUtilice diariamente seda dental o los elementos de higiene recomendados por su odontólogo.\nAsista a controles odontológicos periódicos para evaluar el estado de la restauración y realizar mantenimiento preventivo.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Evite hábitos que generen sobrecargas sobre la corona.\nMantenga una adecuada higiene oral y siga las recomendaciones profesionales para conservar la funcionalidad y apariencia de la restauración.\nAnte cualquier anomalía o molestia, acuda oportunamente a consulta odontológica.\nRevisiones periódicas recomendadas cada 6–12 meses.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Corona de Zirconio Monolítica") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de prótesis fija / corona en zirconio monolítica",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Corona dental fija elaborada completamente en dióxido de zirconio (ZrO₂) de grado médico mediante tecnología CAD/CAM. Restauración protésica personalizada, diseñada de acuerdo con la anatomía y requerimientos funcionales del paciente. Se caracteriza por su alta resistencia mecánica, biocompatibilidad y estabilidad estética, sin recubrimientos cerámicos estratificados.",
            },
            {
              label: "Uso previsto",
              value:
                "Restauración protésica fija destinada a reemplazar la estructura coronaria de un diente natural que ha sufrido pérdida parcial o total de tejido por caries, fracturas, desgaste o tratamiento endodóntico. Su finalidad es restablecer la función masticatoria, la anatomía dental, la oclusión y la estética del paciente.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Dióxido de zirconio (ZrO₂) policristalino estabilizado con itrio (Y-TZP) de grado médico para uso odontológico.\nPigmentos y maquillajes cerámicos biocompatibles para caracterización estética cuando aplique.\nMateriales compatibles con tejidos orales y de comprobada biocompatibilidad.\nSe debe registrar la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo médico sobre medida bucal.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Entre 10 y 15 años o más, dependiendo de las condiciones clínicas del paciente, hábitos de higiene oral, controles odontológicos periódicos, estado periodontal y ausencia de hábitos parafuncionales no controlados.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "La corona en zirconio monolítica está fabricada con materiales biocompatibles y seguros para uso odontológico. Los riesgos asociados son poco frecuentes e incluyen sensibilidad dental temporal después de la instalación, molestias oclusales (incompatibilidad oclusal) que pueden requerir ajuste profesional, descementación de la corona, desgaste de dientes antagonistas en casos específicos y fractura de la restauración debido a traumatismos severos o uso inadecuado.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Evite morder objetos duros como hielo, huesos, semillas, bolígrafos o abrir empaques con los dientes, ya que esto puede comprometer la integridad de la restauración.\nInforme a su odontólogo si presenta dolor persistente, movilidad, fractura o desprendimiento de la corona.\nLos pacientes con bruxismo o apretamiento dental deben seguir las recomendaciones profesionales y utilizar férulas de protección cuando sean indicadas.\nContraindicada en pacientes con hipersensibilidad conocida a cualquiera de los materiales empleados en la restauración o cementación.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "La corona debe utilizarse como un diente natural para las funciones normales de masticación.\nMantenga una adecuada higiene oral mediante cepillado después de cada comida, uso diario de seda dental y enjuagues bucales cuando sean recomendados por el odontólogo.\nAsista a controles odontológicos periódicos para evaluar el estado de la restauración y los tejidos de soporte.\nEn caso de fractura, desgaste excesivo, movilidad o desprendimiento de la corona, consulte inmediatamente a su odontólogo y evite intentar repararla por cuenta propia.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Mantenga una adecuada higiene oral mediante cepillado dental después de cada comida utilizando un cepillo de cerdas suaves y crema dental con flúor.\nUtilice diariamente seda dental o cepillos interproximales para limpiar las zonas alrededor de la corona y prevenir la acumulación de placa bacteriana.\nAcuda a controles odontológicos periódicos, al menos cada seis meses o según la frecuencia indicada por su odontólogo, para evaluar el estado de la corona y los tejidos de soporte.\nInforme a su odontólogo si presenta dolor, sensibilidad persistente, movilidad de la corona, cambios en la mordida, fracturas, desgaste inusual o cualquier otra alteración.\nNo intente ajustar, reparar o cementar nuevamente la corona por cuenta propia; cualquier procedimiento debe ser realizado por un profesional odontológico.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Corona de Zirconio Estratificada") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / corona en zirconio estratificada",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Corona dental fija elaborada en zirconio monolítico con estratificación cerámica feldespática en zona estética. Estructura interna en dióxido de zirconio de grado médico, recubierta parcialmente con porcelana dental para caracterización anatómica, funcional y estética. Diseñada de forma personalizada a partir de la anatomía dental del paciente mediante tecnología CAD/CAM.",
            },
            {
              label: "Uso previsto",
              value:
                "Restauración protésica fija destinada a reemplazar la estructura coronaria de uno o varios dientes afectados por caries extensas, fracturas, desgaste severo o tratamientos endodónticos. Su función es restablecer la anatomía, función masticatoria, estética dental y protección del remanente dentario.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Dióxido de zirconio (ZrO₂) grado médico para la cofia o estructura interna; cerámica feldespática de recubrimiento para estratificación estética; pigmentos y maquillajes cerámicos dentales; cemento de fijación dental según prescripción clínica.\nTodos los materiales son biocompatibles y aptos para uso odontológico.\nSe debe registrar la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo médico sobre medida bucal.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Entre 10 y 15 años bajo condiciones normales de uso, siempre que el paciente mantenga adecuados hábitos de higiene oral, controles odontológicos periódicos y ausencia de hábitos parafuncionales no controlados.\nLa vida útil puede variar según las condiciones clínicas y funcionales del paciente.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "La corona en zirconio estratificada es un dispositivo biocompatible diseñado para uso odontológico.\nLos riesgos potenciales son mínimos y pueden incluir sensibilidad temporal después de la cementación, molestias por ajustes oclusales, fractura de la porcelana de recubrimiento por traumatismos o fuerzas excesivas, y reacciones adversas asociadas a los materiales de cementación utilizados por el profesional tratante.\nMitigación de riesgos como por ejemplo ajustes, control dimensional, pruebas de resistencia.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "No utilizar la corona como herramienta para abrir objetos o morder elementos duros (hielo, huesos, semillas, entre otros).\nInformar al odontólogo sobre cualquier molestia persistente, movilidad o fractura de la restauración.\nSe recomienda especial precaución en pacientes con bruxismo o hábitos parafuncionales, quienes podrán requerir dispositivos de protección nocturna.\nContraindicada en pacientes con alergia conocida a alguno de los materiales utilizados en su fabricación o cementación.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Mantener una adecuada higiene oral mediante cepillado dental mínimo dos veces al día, uso de seda dental y controles odontológicos periódicos.\nEvitar hábitos que puedan generar sobrecarga mecánica sobre la restauración.\nAsistir a revisiones profesionales según indicación del odontólogo.\nEn caso de fractura, desprendimiento o deterioro de la corona, acudir inmediatamente al profesional tratante para su evaluación y manejo.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Mantenga una adecuada higiene oral mediante cepillado dental después de cada comida utilizando un cepillo de cerdas suaves y crema dental.\nUtilice diariamente seda dental o cepillos interproximales para limpiar las zonas alrededor de la corona y prevenir la acumulación de placa bacteriana.\nAcuda a controles odontológicos periódicos, al menos cada seis meses o según la frecuencia indicada por su odontólogo, para evaluar el estado de la corona y los tejidos de soporte.\nEvite morder objetos duros como hielo, huesos, semillas, caramelos duros, bolígrafos o cualquier elemento que pueda generar fuerzas excesivas sobre la restauración.\nEvite hábitos perjudiciales como morder uñas, abrir envases con los dientes o sujetar objetos con la boca.\nSi presenta bruxismo (rechinar o apretar los dientes), utilice la férula oclusal recomendada por su odontólogo para proteger la corona y los dientes naturales.\nMantenga una alimentación equilibrada y reduzca el consumo frecuente de alimentos y bebidas con alto contenido de azúcar para favorecer la salud oral.\nInforme a su odontólogo si presenta dolor, sensibilidad persistente, movilidad de la corona, cambios en la mordida, fracturas, desgaste inusual o cualquier otra alteración.\nNo intente ajustar, reparar o cementar nuevamente la corona por cuenta propia; cualquier procedimiento debe ser realizado por un profesional odontológico.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Corona de Disilicato sobre Implante") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / corona en Disilicato de litio sobre implante",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración protésica fija sobre medida bucal, elaborada en cerámica de disilicato de litio de grado médico, diseñada para ser instalada sobre un implante dental mediante un pilar protésico compatible. Su finalidad es reemplazar una pieza dental ausente, restaurando la función masticatoria, la fonética y la estética. El dispositivo es fabricado de forma individualizada de acuerdo con la prescripción del odontólogo tratante y las características anatómicas del paciente.",
            },
            {
              label: "Uso previsto",
              value:
                "Rehabilitar la ausencia de uno o varios dientes mediante una restauración implantosoportada, proporcionando función masticatoria, estabilidad oclusal, estética dental y soporte de los tejidos blandos circundantes. Está indicada para pacientes con implantes osteointegrados que requieren una restauración protésica definitiva.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Cerámica de disilicato de litio de grado médico, materiales de caracterización estética (pigmentos y maquillajes cerámicos biocompatibles), materiales de glaseado y acabado superficial.\nPuede estar asociada a componentes protésicos compatibles con el sistema de implantes indicado por el odontólogo tratante.\nDeben registrarse la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "La vida útil estimada es de 10 a 15 años, siempre que se mantengan adecuadas condiciones de uso, higiene oral, controles odontológicos periódicos y ausencia de factores que comprometan la integridad del dispositivo.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "Posibles riesgos asociados al uso de la restauración incluyen aflojamiento de componentes protésicos, fractura de la corona por traumatismos o fuerzas excesivas, acumulación de placa bacteriana alrededor del implante por higiene inadecuada, inflamación o sangrado de los tejidos periimplantarios, desgaste por hábitos parafuncionales (bruxismo) y molestias derivadas de cambios en la oclusión o adaptación de la restauración.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Mantenga una adecuada higiene oral para preservar la salud de los tejidos alrededor del implante.\nEvite morder objetos duros como hielo, huesos, lápices o abrir envases con los dientes.\nNo manipule ni intente ajustar la restauración por cuenta propia.\nSi presenta movilidad, dolor, inflamación, sangrado, fractura o cualquier cambio en la restauración, consulte inmediatamente a su odontólogo.\nLos pacientes con hábitos de apretamiento o rechinamiento dental deben seguir las recomendaciones de protección indicadas por el profesional tratante.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Cepille sus dientes y la restauración después de cada comida utilizando los elementos de higiene recomendados por su odontólogo.\nUtilice seda dental, cepillos interproximales o dispositivos específicos para la limpieza alrededor de implantes.\nAsista periódicamente a controles odontológicos para evaluación y mantenimiento profesional.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Evite hábitos que generen sobrecargas excesivas sobre la restauración.\nSiga las recomendaciones de higiene y control profesional para prolongar la vida útil de la corona y del implante.\nEn caso de detectar cualquier anomalía, solicite una valoración odontológica lo antes posible.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Corona de Disilicato Monolítica") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / Corona en Disilicato de litio monolitica",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración protésica fija sobre medida bucal, elaborada completamente en cerámica de Disilicato de litio de grado médico en una sola estructura (monolítica), diseñada para restaurar la anatomía, función masticatoria, fonética y estética de dientes naturales. Fabricada de forma personalizada de acuerdo con la prescripción del odontólogo tratante y las características anatómicas y funcionales del paciente, ofreciendo alta resistencia mecánica, biocompatibilidad y estabilidad estética.",
            },
            {
              label: "Uso previsto",
              value:
                "Restaurar dientes con pérdida parcial o total de estructura coronaria, devolviendo la función masticatoria, la estabilidad oclusal, la fonética y la estética dental. Indicada para rehabilitaciones protésicas unitarias definitivas en dientes naturales, tanto en el sector anterior como posterior, cuando se requiere una restauración de alta resistencia y excelente comportamiento estético.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Cerámica de Disilicato de litio de grado médico como material principal de la restauración, pigmentos y maquillajes cerámicos biocompatibles para caracterización estética cuando sea necesario, materiales de glaseado y acabado superficial.\nSe debe registrar la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo médico sobre medida bucal.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Entre 10 y 15 años, dependiendo de las condiciones clínicas del paciente, la higiene oral, los controles odontológicos periódicos, la correcta función oclusal y el cumplimiento de las recomendaciones del odontólogo tratante. Durante este período pueden requerirse procedimientos de mantenimiento, ajuste o reacondicionamiento superficial para conservar sus propiedades funcionales y estéticas.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "Posibles riesgos asociados al uso de la restauración incluyen fractura o desprendimiento de la corona debido a traumatismos o fuerzas masticatorias excesivas, sensibilidad dental transitoria, desgaste de dientes antagonistas en caso de alteraciones oclusales, acumulación de placa bacteriana por higiene oral deficiente, inflamación de la encía y disminución de la vida útil de la restauración por hábitos parafuncionales como el bruxismo.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Mantenga una adecuada higiene oral para preservar la salud del diente restaurado y los tejidos circundantes.\nEvite morder alimentos u objetos extremadamente duros, como hielo, huesos, semillas o utilizar los dientes para abrir envases.\nNo intente ajustar, pulir o reparar la restauración por cuenta propia.\nConsulte a su odontólogo si presenta dolor, sensibilidad persistente, fractura, movilidad o desprendimiento de la corona.\nLos pacientes con bruxismo o apretamiento dental deben seguir las recomendaciones de protección indicadas por el profesional tratante.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Cepille sus dientes después de cada comida utilizando un cepillo de cerdas suaves y crema dental de baja abrasividad.\nUtilice diariamente seda dental o los elementos de higiene recomendados por su odontólogo.\nMantenga hábitos adecuados de cuidado oral y asista a los controles periódicos programados.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Realice limpiezas profesionales periódicas según indicación odontológica.\nEvite hábitos que generen sobrecargas sobre la restauración.\nEn caso de notar cambios en la mordida, molestias, fracturas o cualquier alteración de la corona, solicite valoración odontológica de manera inmediata.\nRevisiones periódicas recomendadas cada 6–12 meses.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Corona de Disilicato Estratificada") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / corona en Disilicato de litio estratificada",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración protésica fija sobre medida bucal, elaborada con una estructura de disilicato de litio de grado médico recubierta mediante técnica de estratificación con cerámica feldespática para lograr una óptima caracterización estética. Diseñada para restaurar la anatomía, función masticatoria, fonética y estética de dientes naturales. Fabricada de forma individualizada según la prescripción del odontólogo tratante y las características clínicas del paciente.",
            },
            {
              label: "Uso previsto",
              value:
                "Restaurar dientes con pérdida parcial o total de estructura coronaria, devolviendo la función masticatoria, estabilidad oclusal, fonética y estética dental. Indicada para rehabilitaciones protésicas unitarias definitivas en dientes naturales que requieren una restauración de alta resistencia y excelente integración estética.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Cerámica de disilicato de litio de grado médico como estructura base, cerámica feldespática de estratificación para caracterización estética, pigmentos y maquillajes cerámicos biocompatibles, materiales de glaseado y acabado superficial.\nSe debe registrar la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo médico sobre medida bucal.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Entre 10 y 15 años, dependiendo de las condiciones clínicas del paciente, la higiene oral, los controles odontológicos periódicos, la correcta función oclusal y el cumplimiento de las recomendaciones del odontólogo tratante. Durante este período pueden requerirse procedimientos de mantenimiento, ajuste o pulido para conservar sus características funcionales y estéticas.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "Posibles riesgos asociados al uso de la restauración incluyen fractura o desprendimiento de la corona debido a traumatismos o fuerzas masticatorias excesivas, sensibilidad dental, desgaste de la restauración o de los dientes antagonistas, acumulación de placa bacteriana por higiene inadecuada, inflamación de las encías y alteraciones funcionales o estéticas derivadas del uso prolongado o de hábitos parafuncionales como el bruxismo.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Mantenga una adecuada higiene oral para preservar la salud del diente restaurado y de los tejidos circundantes.\nEvite morder objetos duros como hielo, huesos, lápices o utilizar los dientes para abrir envases.\nNo manipule ni intente reparar la restauración por cuenta propia.\nConsulte inmediatamente a su odontólogo si presenta dolor, movilidad, fractura, desprendimiento, sensibilidad persistente o cualquier cambio en la restauración.\nLos pacientes con bruxismo deben utilizar los dispositivos de protección recomendados por el profesional tratante.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Cepille sus dientes después de cada comida utilizando un cepillo de cerdas suaves y crema dental de baja abrasividad.\nUtilice diariamente seda dental y siga las recomendaciones de higiene indicadas por su odontólogo.\nAsista a controles odontológicos periódicos para verificar el estado de la restauración.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Evite hábitos que puedan generar sobrecargas sobre la corona.\nMantenga una adecuada higiene oral y realice limpiezas profesionales periódicas.\nEn caso de fractura, desprendimiento o cualquier anomalía, solicite atención odontológica de manera oportuna.\nRevisiones periódicas recomendadas cada 6–12 meses.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Colado UCLA") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de protesis fija / colado de ucla",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Dispositivo médico sobre medida bucal elaborado a partir de una base UCLA prefabricada para implantes dentales, diseñado para servir como estructura de soporte y conexión entre el implante osteointegrado y la restauración protésica definitiva. El componente es personalizado mediante técnicas de colado dental para obtener la anatomía, ajuste y funcionalidad requeridos según la prescripción del odontólogo tratante y las características clínicas del paciente.",
            },
            {
              label: "Uso previsto",
              value:
                "Proporcionar soporte, retención y estabilidad a restauraciones protésicas sobre implantes dentales, permitiendo la rehabilitación funcional y estética de dientes ausentes. Está indicado para la fabricación de coronas unitarias, puentes o estructuras implantosoportadas personalizadas.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Base UCLA prefabricada compatible con el sistema de implante indicado por el odontólogo tratante.\nAleación metálica de grado médico para colado (cromo-cobalto, metal noble u otra autorizada para uso odontológico), materiales de revestimiento, acabado y pulido biocompatibles.\nDebe registrarse la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Entre 10 y 15 años o más, dependiendo de las condiciones clínicas del paciente, la estabilidad del implante, la higiene oral, el mantenimiento profesional periódico, la calidad de la rehabilitación protésica y la ausencia de sobrecargas funcionales o hábitos parafuncionales. Durante este período pueden requerirse ajustes, mantenimiento o reemplazo de componentes protésicos asociados.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "Posibles riesgos asociados al uso de la restauración: aflojamiento de tornillos protésicos, fractura o desgaste de componentes protésicos, inflamación de los tejidos blandos por deficiente higiene oral, acumulación de placa bacteriana alrededor del implante, molestias durante la masticación por sobrecarga oclusal y pérdida de estabilidad de la restauración por falta de mantenimiento profesional periódico.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Mantener una adecuada higiene oral y asistir a los controles periódicos programados por el odontólogo.\nEvitar morder objetos duros o utilizar los dientes como herramienta.\nInformar al odontólogo ante cualquier sensación de movilidad, dolor, inflamación, sangrado o cambio en el ajuste de la restauración.\nNo manipular ni intentar ajustar la prótesis por cuenta propia.\nContraindicado en pacientes con alergia conocida a alguno de los materiales utilizados en la rehabilitación (casos excepcionales).",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Realizar cepillado dental después de cada comida y utilizar los elementos de higiene recomendados por el odontólogo para la limpieza alrededor de implantes y prótesis.\nAsistir a controles periódicos para evaluación, mantenimiento y limpieza profesional de la restauración.\nEvitar hábitos parafuncionales como apretar o rechinar los dientes sin tratamiento adecuado.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value: "Seguir las indicaciones de higiene y mantenimiento suministradas por el profesional tratante.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Cerámica Encia") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de prótesis fija / cerámica de encía",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración protésica sobre medida bucal elaborada en cerámica dental de grado médico, diseñada para reemplazar o simular el tejido gingival perdido alrededor de dientes naturales, implantes o prótesis. Su fabricación es personalizada de acuerdo con las características anatómicas, funcionales y estéticas de cada paciente, permitiendo recuperar la apariencia natural de la encía y mejorar la armonía de la sonrisa.",
            },
            {
              label: "Uso previsto",
              value:
                "Dispositivo destinado a restaurar o compensar pérdidas de tejido gingival ocasionadas por reabsorciones óseas, enfermedades periodontales, traumatismos, defectos anatómicos o tratamientos de rehabilitación oral. Su finalidad es mejorar la estética, el soporte de tejidos blandos y la integración visual de restauraciones dentales o implantosoportadas.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Cerámica dental de grado médico (feldespática, prensada o estratificada según el caso clínico), pigmentos y maquillajes cerámicos biocompatibles para caracterización estética, materiales de glaseado y acabado superficial.\nSe debe registrar la marca comercial, referencia y número de lote de los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Entre 10 y 15 años, dependiendo de las condiciones de uso, higiene oral, controles odontológicos periódicos, estabilidad de los tejidos orales y ausencia de traumatismos o hábitos que puedan comprometer la integridad del dispositivo. Durante este período pueden requerirse ajustes, mantenimiento o reacondicionamiento profesional para conservar sus características estéticas y funcionales.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "Posibles riesgos asociados al dispositivo: fractura o desprendimiento de la cerámica por traumatismos o fuerzas excesivas, irritación de los tejidos blandos por acumulación de placa bacteriana, molestias derivadas de una adaptación inadecuada, dificultad en la higiene oral si no se siguen las recomendaciones de limpieza y alteraciones estéticas por desgaste o cambios en los tejidos de soporte.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "No manipular ni realizar ajustes sobre el dispositivo sin supervisión profesional.\nMantener una adecuada higiene oral para evitar inflamación de los tejidos circundantes.\nEvitar morder objetos duros o someter la restauración a fuerzas excesivas.\nEn caso de fractura, desprendimiento, incomodidad persistente o inflamación, acudir inmediatamente al odontólogo.\nContraindicado en pacientes con alergia conocida a alguno de los materiales utilizados en la restauración (casos excepcionales).",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Mantener una higiene oral adecuada mediante cepillado y uso de elementos de higiene interdental recomendados por el odontólogo.\nAsistir periódicamente a controles clínicos para evaluar el estado de la restauración y de los tejidos de soporte.\nEvitar hábitos parafuncionales y el contacto con objetos que puedan ocasionar fracturas.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "La durabilidad y apariencia de la cerámica de encía dependen del mantenimiento adecuado, la higiene oral diaria y las revisiones periódicas realizadas por el profesional tratante.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Carillas Impresas en Resina") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de prótesis fija / provisional en termo curado",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración dental provisional fabricada a medida para cada paciente mediante resina acrílica termocurada de uso odontológico. Elaborada en laboratorio dental mediante procesos de polimerización por calor, diseñada para reemplazar temporalmente dientes o estructuras dentales ausentes o preparadas, proporcionando protección, función masticatoria, estabilidad oclusal y estética durante el período previo a la instalación de la restauración definitiva.",
            },
            {
              label: "Uso previsto",
              value:
                "Mantener la función, estética y protección de dientes preparados o espacios edéntulos durante tratamientos protésicos, restauradores o de rehabilitación oral. Su finalidad es preservar la posición de los dientes, proteger los tejidos orales, favorecer la adaptación funcional y estética del paciente y servir como restauración temporal mientras se fabrica el dispositivo definitivo.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Resina acrílica termocurada de grado odontológico.\nPigmentos y caracterizadores dentales biocompatibles (cuando aplique).\nMateriales para acabado, ajuste y pulido.\nDebe registrarse la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Dispositivo de carácter temporal con una vida útil estimada entre 3 y 12 meses, dependiendo de las condiciones clínicas, ubicación de la restauración, hábitos del paciente, fuerzas masticatorias y cumplimiento de las recomendaciones profesionales. Durante este período pueden requerirse ajustes, reparaciones, rebasados o recementaciones para mantener su correcta adaptación, funcionalidad y comodidad hasta la colocación de la restauración definitiva.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "El provisional en resina acrílica termocurada es una restauración temporal utilizada para proteger dientes preparados o reemplazar temporalmente dientes ausentes durante un tratamiento odontológico. Aunque es un dispositivo de bajo riesgo, pueden presentarse molestias leves durante el período de adaptación, sensibilidad dental temporal, desgaste del material, fractura o desprendimiento de la restauración. También puede producirse acumulación de placa bacteriana o irritación gingival si no se mantiene una adecuada higiene oral. En casos poco frecuentes, pueden presentarse reacciones de hipersensibilidad a los materiales empleados.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "Advertencias:\nEste dispositivo es de carácter temporal y no sustituye la restauración definitiva.\nEvite consumir alimentos muy duros, pegajosos o que requieran una fuerza excesiva de masticación.\nMantenga una adecuada higiene oral para prevenir inflamación de las encías y problemas periodontales.\nNo manipule, ajuste ni intente reparar la restauración por su cuenta.\nAcuda a los controles odontológicos programados para verificar su adaptación y estado.\nContraindicaciones:\nPacientes con alergia conocida a alguno de los componentes de la resina acrílica utilizada.\nCasos clínicos en los que el profesional determine que otro tipo de restauración provisional es más apropiado.\nPacientes con hábitos parafuncionales severos no controlados (bruxismo intenso), salvo indicación profesional.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Cepille sus dientes después de cada comida utilizando un cepillo de cerdas suaves y crema dental.\nUtilice seda dental de acuerdo con las recomendaciones de su odontólogo.\nEvite masticar alimentos extremadamente duros o pegajosos que puedan fracturar o desprender la restauración.\nMantenga las citas de control programadas por el profesional tratante.\nSi presenta molestias persistentes, fractura, aflojamiento o desprendimiento del provisional, contacte a su odontólogo de manera inmediata.\nSiga todas las recomendaciones específicas proporcionadas por el profesional responsable de su tratamiento.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value: "Revisiones periódicas recomendadas cada 6–12 meses.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nNo aplica.",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Carilla en Disilicato Monolítica") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de prótesis fija / carilla en Disilicato monolítica",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración dental fija sobre medida bucal, tipo carilla monolítica, elaborada en cerámica de Disilicato de litio. Diseñada para adherirse a la superficie vestibular de dientes naturales con fines estéticos y funcionales.",
            },
            {
              label: "Uso previsto",
              value:
                "Restaurar la estética y función dental mediante la corrección de alteraciones de forma, tamaño, color, desgaste, fracturas menores o espacios interdentales. Indicada para rehabilitaciones estéticas conservadoras en dientes anteriores y premolares, según prescripción del profesional tratante.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Cerámica de Disilicato de litio de grado médico, utilizada como material principal de la restauración monolítica.\nPigmentos, tintes o maquillajes cerámicos biocompatibles para caracterización estética individualizada, cuando aplique.\nMateriales de glaseado y acabado superficial biocompatibles para proporcionar brillo, textura y protección de la superficie.\nSe debe registrar la marca comercial, referencia y número de lote de los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Período durante el cual se espera que la carilla en Disilicato de litio monolitica mantenga de forma segura y efectiva sus características funcionales y estéticas. La vida útil estimada es de 5 a 10 años, siempre que se mantengan adecuadas condiciones de uso, higiene oral, controles odontológicos periódicos y ausencia de factores que comprometan la integridad del dispositivo.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "Posibles riesgos asociados al dispositivo: desprendimiento o fractura de la carilla por trauma o sobrecarga oclusal, sensibilidad dental transitoria posterior a la cementación, irritación de tejidos blandos por desajustes marginales, reacción alérgica a materiales complementarios utilizados en la cementación (casos excepcionales) y desgaste del diente antagonista en presencia de ajustes oclusales inadecuados.\nMitigación de riesgos como por ejemplo ajustes, control dimensional, pruebas de resistencia.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "No utilizar en pacientes con higiene oral deficiente, enfermedad periodontal activa no controlada o estructura dental insuficiente para la adhesión. Contraindicado en casos de bruxismo severo no tratado, hábitos parafuncionales sin control, movilidad dental avanzada o alergia conocida a alguno de los materiales empleados. Evitar impactos directos sobre la restauración y el uso de los dientes para abrir o cortar objetos.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Mantener una adecuada higiene oral mediante cepillado dental mínimo tres veces al día y uso diario de seda dental, asistir a los controles odontológicos periódicos programados por su odontólogo para evaluar el estado de la restauración y de los tejidos orales,evitar morder o abrir objetos con los dientes, como tapas, empaques, uñas, bolígrafos u otros elementos duros, limitar el consumo de alimentos extremadamente duros que puedan generar fracturas o desprendimiento de la restauración. No realizar ajustes, pulidos o reparaciones por cuenta propia; cualquier intervención debe ser realizada por un profesional de la odontología.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Realice una higiene oral adecuada mediante cepillado después de cada comida utilizando un cepillo de cerdas suaves y crema dental de baja abrasividad.\nUtilice seda dental diariamente para remover la placa bacteriana y los residuos de alimentos entre los dientes y alrededor de la restauración.\nAsista a controles odontológicos periódicos, al menos cada seis meses o según indicación de su odontólogo, para evaluar el estado de la carilla y realizar mantenimiento preventivo.\nEvite masticar alimentos excesivamente duros (hielo, huesos, caramelos duros, entre otros) que puedan ocasionar fracturas o desprendimiento de la restauración.\nNo utilice los dientes como herramienta para abrir envases, cortar hilos o sujetar objetos.\nSi presenta bruxismo (rechinamiento o apretamiento dental), utilice la férula o protector nocturno recomendado por su odontólogo.\nLimite el consumo frecuente de sustancias que puedan afectar la salud oral, como bebidas azucaradas o altamente ácidas.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    if (tipo === "Carilla en Disilicato Estratificada") {
      return [
        {
          titulo: "1. Información de Identificación y Trazabilidad",
          campos: [
            { label: "Nombre del paciente", value: paciente },
            { label: "Prescriptor", value: prescriptor },
            {
              label: "Clasificación de DMSMB",
              value: "Línea de prótesis fija y carilla en Disilicato estratificada",
            },
            {
              label: "Número de Serie o identificación del dispositivo",
              value: numeroSerie,
            },
          ],
        },
        {
          titulo: "2. Identificación del producto",
          campos: [
            {
              label: "Descripción técnica del dispositivo médico",
              value:
                "Restauración dental fija sobre medida bucal, tipo carilla estética, fabricada mediante una estructura base de cerámica de disilicato de litio recubierta con capas de cerámica de estratificación feldespática para lograr una mayor caracterización estética. Diseñada para adherirse de forma permanente a la superficie vestibular de dientes naturales, con el propósito de restaurar o mejorar la estética dental y contribuir a la función masticatoria. El dispositivo es elaborado de manera individualizada a partir de la prescripción del odontólogo tratante y de las características anatómicas específicas del paciente, garantizando biocompatibilidad, adaptación marginal, resistencia mecánica y alta estética mediante la reproducción de color, translucidez y textura dental natural.",
            },
            {
              label: "Uso previsto",
              value:
                "Restaurar la estética y función dental mediante la corrección de alteraciones de forma, tamaño, color, desgaste, fracturas menores o espacios interdentales. Indicada para rehabilitaciones estéticas conservadoras en dientes anteriores y premolares, según prescripción del profesional tratante.",
            },
            {
              label: "Materiales Empleados",
              value:
                "Disilicato de litio de uso odontológico (cerámica vítrea reforzada), biocompatible y de alta resistencia mecánica.\nMasas cerámicas de estratificación feldespática para caracterización anatómica, cromática y estética.\nMateriales refractarios y accesorios de laboratorio dental para el proceso de estratificación y cocción cerámica.\nPigmentos y maquillajes cerámicos para caracterización estética individualizada, cuando sea requerido.\nSe debe registrar la marca comercial, referencia y número de lote de todos los materiales utilizados en la fabricación del dispositivo.",
            },
            {
              label: "Vida útil estimada",
              value:
                "Período durante el cual se espera que la carilla en Disilicato de litio estratificada mantenga de forma segura y efectiva sus características funcionales, mecánicas y estéticas. La vida útil estimada es de 10 a 15 años, dependiendo de las condiciones de uso, higiene oral, mantenimiento profesional periódico y ausencia de factores que comprometan la integridad del dispositivo médico sobre medida bucal.",
            },
          ],
        },
        {
          titulo: "3. Proceso de diseño y fabricación",
          campos: [
            {
              label: "Especificaciones de diseño",
              value:
                "Prescripción odontológica, Diseño personalizado mediante CAD/CAM o modelos de yeso basados en la anatomía del paciente",
            },
            {
              label: "Normas aplicadas",
              value:
                "Resolución 214 de 2022 “Por la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal)\"\nOtras normas técnicas nacionales o internacionales aplicadas para materias primas utilizadas, procesos de fabricación y control de calidad. Ejemplo:\nISO 10139-1 / ISO 10139-2: Materiales de revestimiento blando para prótesis.\nISO 10477: Materiales poliméricos para coronas y recubrimientos (prótesis fija).\nISO 10873: Adhesivos para prótesis dentales.\nISO 13017: Anclajes magnéticos para prótesis.\nISO 7405 y ISO 10993: Evaluación biológica de materiales dentales y médicos.\nISO 13116: Método de ensayo para determinar la radiopacidad de los materiales\nISO 10271: Métodos de ensayo de corrosión para materiales metálicos\nISO 12836: Dispositivos de digitalización para sistemas CAD/CAM para restauraciones dentales indirectas: métodos de ensayo para evaluar la precisión\nNTC-ISO 10993: Evaluación biológica de dispositivos médicos\nISO 15841: alambres para uso en ortodoncia",
            },
          ],
        },
        {
          titulo: "4. Requisitos de seguridad y funcionamiento",
          campos: [
            {
              label: "Análisis de riesgos",
              value:
                "Desprendimiento o fractura de la carilla por trauma o sobrecarga oclusal, sensibilidad dental transitoria posterior a la cementación, irritación de tejidos blandos por desajustes marginales, reacción alérgica a materiales complementarios utilizados en la cementación (casos excepcionales) y desgaste del diente antagonista en presencia de ajustes oclusales inadecuados.\nMitigación de riesgos como por ejemplo ajustes, control dimensional, pruebas de resistencia.",
            },
            {
              label: "Advertencias y contraindicaciones",
              value:
                "No utilizar en pacientes con higiene oral deficiente, enfermedad periodontal activa no controlada o estructura dental insuficiente para la adhesión. Contraindicado en casos de bruxismo severo no tratado, hábitos para funcionales sin control, movilidad dental avanzada o alergia conocida a alguno de los materiales empleados. Evitar impactos directos sobre la restauración y el uso de los dientes para abrir o cortar objetos.",
            },
            {
              label: "Instrucciones de uso",
              value:
                "Mantener una adecuada higiene oral mediante cepillado dental mínimo tres veces al día y uso diario de seda dental, asistir a los controles odontológicos periódicos programados por su odontólogo para evaluar el estado de la restauración y de los tejidos orales, evitar morder o abrir objetos con los dientes, como tapas, empaques, uñas, bolígrafos u otros elementos duros, limitar el consumo de alimentos extremadamente duros que puedan generar fracturas o desprendimiento de la restauración. No realizar ajustes, pulidos o reparaciones por cuenta propia; cualquier intervención debe ser realizada por un profesional de la odontología.",
            },
            {
              label: "Instrucciones de mantenimiento",
              value:
                "Realice una higiene oral adecuada mediante cepillado después de cada comida utilizando un cepillo de cerdas suaves y crema dental de baja abrasividad.\nUtilice seda dental diariamente para remover la placa bacteriana y los residuos de alimentos entre los dientes y alrededor de la restauración.\nAsista a controles odontológicos periódicos, al menos cada seis meses o según indicación de su odontólogo, para evaluar el estado de la carilla y realizar mantenimiento preventivo.\nEvite masticar alimentos excesivamente duros (hielo, huesos, caramelos duros, entre otros) que puedan ocasionar fracturas o desprendimiento de la restauración.\nNo utilice los dientes como herramienta para abrir envases, cortar hilos o sujetar objetos.\nSi presenta bruxismo (rechinamiento o apretamiento dental), utilice la férula o protector nocturno recomendado por su odontólogo.\nLimite el consumo frecuente de sustancias que puedan afectar la salud oral, como bebidas azucaradas o altamente ácidas.",
            },
          ],
        },
        {
          titulo: "5. Garantía",
          campos: [
            {
              label: "Garantía",
              value:
                "El dispositivo médico sobre medida bucal cumple con los requisitos esenciales de seguridad y se ajusta estrictamente a la prescripción y a los requisitos establecidos en el capítulo VI, artículos 9, 10 y 11 de la resolución 214 de 2022.\nLa garantía del dispositivo médico será como mínimo por un (1) año a partir de la fecha de adaptación del dispositivo médico, periodo durante el cual se realiza reparación o reposición del dispositivo médico, si aplica",
            },
          ],
        },
        {
          titulo: "6. Firma",
          campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
        },
        {
          titulo: "CONTROL DE CAMBIOS",
          campos: [
            { label: "VERSIÓN", value: "00" },
            { label: "FECHA DE APROBACIÓN", value: fechaHoy },
            { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
          ],
        },
      ]
    }

    return [
      {
        titulo: "1. Información de Identificación y Trazabilidad",
        campos: [
          { label: "Nombre del paciente", value: paciente },
          { label: "Prescriptor", value: prescriptor },
          { label: "Clasificación de DMSMB", value: "Línea de prótesis fija y carilla en Disilicato estratificada" },
          { label: "Número de Serie o identificación del dispositivo", value: numeroSerie },
        ],
      },
      {
        titulo: "2. Identificación del producto",
        campos: [
          {
            label: "Descripción técnica del dispositivo médico",
            value: `Dispositivo médico a medida tipo ${tipo || "Cerámica Encia"}, fabricado sobre modelo del paciente ${paciente}, prescrito por ${prescriptor}.`,
          },
          { label: "Uso previsto", value: "Restauración dental a medida para rehabilitación oclusal y estética del paciente." },
          {
            label: "Materiales Empleados",
            value: "Disilicato de litio, cerámica estratificada, agentes de unión, colorantes ceramicos.",
          },
          { label: "Vida útil estimada", value: "5 a 10 años con cuidados adecuados y revisiones periódicas." },
        ],
      },
      {
        titulo: "3. Proceso de diseño y fabricación",
        campos: [
          {
            label: "Especificaciones de diseño",
            value: "Diseño CAD/CAM escaneado del modelo dental, fresado en bloque de disilicato y estratificado ceramico.",
          },
          { label: "Normas aplicadas", value: "UNE-EN ISO 13485, UNE-EN ISO 22674, MDR 2017/745." },
        ],
      },
      {
        titulo: "4. Requisitos de seguridad y funcionamiento",
        campos: [
          {
            label: "Análisis de riesgos",
            value: "Riesgo bajo. Posible fractura por oclusión excesiva; mitigado con ajuste oclusal yナイト guard si bruxismo.",
          },
          {
            label: "Advertencias y contraindicaciones",
            value: "No usar en pacientes con bruxismo severo no controlado. Contraindicado en alergia a componentes ceramicos.",
          },
          {
            label: "Instrucciones de uso",
            value: "Cementar con cemento resinoso adecuado. Revisar oclusión tras cementación.",
          },
          {
            label: "Instrucciones de mantenimiento",
            value: "Higiene bucal estándar. Revisiones cada 6 meses. Evitar morder objetos duros.",
          },
        ],
      },
      {
        titulo: "5. Garantía",
        campos: [{ label: "Garantía", value: "12 meses contra defectos de fabricación. No cubre mal uso o falta de mantenimiento." }],
      },
      {
        titulo: "6. Firma",
        campos: [{ label: "Firma autorizada", value: `Director técnico - ${fechaHoy}` }],
      },
      {
        titulo: "CONTROL DE CAMBIOS",
        campos: [
          { label: "VERSIÓN", value: "00" },
          { label: "FECHA DE APROBACIÓN", value: fechaHoy },
          { label: "DESCRIPCIÓN DEL CAMBIO", value: "Elaboración del documento" },
        ],
      },
    ]
  }

  const handleAbrirFicha = async (tipo: string = "Carilla de Disilicato Estratificada") => {
    let ultimaSolicitud: SolicitudCompleta | null | undefined =
      solicitudActual || solicitudes.find((s) => s.paciente || s.odontologo) || solicitudes[0]

    if (!ultimaSolicitud && solicitudIdParam) {
      const res = await fetch(`/api/solicitudes?id=${encodeURIComponent(solicitudIdParam)}`)
      if (res.ok) {
        const data = await res.json()
        const solicitud = data?.data
        if (solicitud) {
          ultimaSolicitud = {
            id: solicitud.id,
            paciente: solicitud.paciente || "",
            odontologo: solicitud.odontologonombre || null,
            codigo_trazabilidad: solicitud.codigo_trazabilidad || "",
            dientes_trabajados: solicitud.dientes ? String(solicitud.dientes).split(/[\s,]+/).filter(Boolean) : [],
            servicios_detalle: [],
            dientes_disponibles: [],
            laboratorio_id: solicitud.laboratorio_id || null,
          } as any
          setSolicitudes((prev) => {
            if (prev.find((s) => s.id === ultimaSolicitud!.id)) return prev
            return [...prev, ultimaSolicitud!]
          })
          setSolicitudActual(ultimaSolicitud)
          setSolicitudActualId(solicitud.id)
        }
      }
    }

    setSolicitudActualId(ultimaSolicitud?.id ?? null)

    const ficha: Seccion[] = crearFichaVacia(tipo, ultimaSolicitud ?? undefined)
    setTipoFichaActual(tipo)

    if (ultimaSolicitud) {
      ficha.forEach((seccion) => {
        seccion.campos.forEach((campo) => {
          if (campo.label === "Nombre del paciente") {
            campo.value = ultimaSolicitud!.paciente || ""
          }
          if (campo.label === "Prescriptor") {
            campo.value = ultimaSolicitud!.odontologo || ""
          }
        })
      })
    }

    setFichaActual(ficha)
    setShowFichaModal(true)
  }

  const handleGuardarFicha = async () => {
    if (!solicitudActualId || !tipoFichaActual || !fichaActual.length) {
      setShowFichaModal(false)
      return
    }

    const fichaGuardada: FichaTecnica = {
      id: Date.now().toString(),
      nombre: tipoFichaActual,
      tipo: tipoFichaActual,
      fecha: new Date().toISOString().split("T")[0],
      url: "#",
      secciones: fichaActual,
    }

    try {
      const res = await fetch("/api/fichas-tecnicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitud_id: String(solicitudActualId),
          tipo: fichaGuardada.tipo,
          nombre: fichaGuardada.nombre,
          nombre_archivo: fichaGuardada.nombre,
          fecha: fichaGuardada.fecha,
          secciones: fichaGuardada.secciones,
          laboratorio_id: solicitudActual?.laboratorio_id || (solicitudActual as any)?.laboratorioId || null,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        const fichaDb = result.data
        if (fichaDb?.id) fichaGuardada.id = String(fichaDb.id)
        setFichas((prev) => [fichaGuardada, ...prev])
        setFichasGuardadasPorSolicitud((prev) => ({
          ...prev,
          [String(solicitudActualId)]: [fichaGuardada, ...(prev[String(solicitudActualId)] || [])],
        }))
      } else {
        const errorText = await res.text()
        alert(`Error al guardar: ${res.status}\n${errorText}`)
      }
    } catch (e: any) {
      alert("No se pudo guardar la ficha técnica: " + e.message)
    }

    setShowFichaModal(false)
  }

  const extraerDientesDisponibles = (solicitudData: any): string[] => {
    const servicios = solicitudData.servicios_detalle || []
    const dientesDeServicios = servicios.map((s: any) => s.dientes).filter((d: any) => d != null)
    if (dientesDeServicios.length > 0) {
      return dientesDeServicios.join(",").split(",").map((d: string) => String(d).split("-")[0]).filter((d: string) => d && !isNaN(Number(d)))
    }
    return (solicitudData.dientes_detallados || []).map((d: any) => String(d.numero))
  }

  const handleVerFichaGuardada = async (ficha: FichaTecnica) => {
    let solicitud = solicitudActual || solicitudes.find((s) => s.id === solicitudActualId) || solicitudes[0] || null
    if (!solicitud && solicitudActualId) {
      const res = await fetch(`/api/solicitudes?id=${encodeURIComponent(String(solicitudActualId))}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.data) {
          const d = data.data
          const sd: SolicitudCompleta = {
            id: d.id,
            paciente: d.paciente || "",
            odontologo: d.odontologonombre || null,
            codigo_trazabilidad: d.codigo_trazabilidad || "",
            dientes_trabajados: d.dientes ? String(d.dientes).split(/[\s,]+/).filter(Boolean) : [],
            servicios_detalle: [],
            dientes_disponibles: extraerDientesDisponibles(d),
            laboratorio_id: d.laboratorio_id || null,
          } as any
          setSolicitudes((prev) => (prev.find((s) => s.id === sd.id) ? prev : [...prev, sd]))
          setSolicitudActual(sd)
          solicitud = sd
        }
      }
    }

    const seccionesActualizadas = ficha.secciones?.map((s) => ({ ...s, campos: [...s.campos] })) || []
    setFichaActual(seccionesActualizadas)
    setTipoFichaActual(ficha.tipo)
    setEditingFicha(true)
    setShowFichaModal(true)
  }

  const handleDescargarFichaGuardada = async (ficha: FichaTecnica) => {
    let solicitud = solicitudActual || solicitudes.find((s) => s.id === solicitudActualId) || solicitudes[0] || null
    if (!solicitud && solicitudActualId) {
      const res = await fetch(`/api/solicitudes?id=${encodeURIComponent(String(solicitudActualId))}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.data) {
          const d = data.data
          const sd: SolicitudCompleta = {
            id: d.id,
            paciente: d.paciente || "",
            odontologo: d.odontologonombre || null,
            codigo_trazabilidad: d.codigo_trazabilidad || "",
            dientes_trabajados: d.dientes ? String(d.dientes).split(/[\s,]+/).filter(Boolean) : [],
            servicios_detalle: [],
            dientes_disponibles: extraerDientesDisponibles(d),
            laboratorio_id: d.laboratorio_id || null,
          } as any
          setSolicitudes((prev) => (prev.find((s) => s.id === sd.id) ? prev : [...prev, sd]))
          setSolicitudActual(sd)
          solicitud = sd
        }
      }
    }

    const seccionesActualizadas = ficha.secciones?.map((s) => ({ ...s, campos: [...s.campos] })) || []
    setFichaActual(seccionesActualizadas)
    setTipoFichaActual(ficha.tipo)
    setEditingFicha(true)
    setShowFichaModal(true)
    await new Promise((r) => setTimeout(r, 100))
    await handleDownloadPdf()
    setShowFichaModal(false)
  }

  const waitForElement = (id: string, timeout = 3000) =>
    new Promise<HTMLElement | null>((resolve, reject) => {
      const start = Date.now()
      const check = () => {
        const el = document.getElementById(id)
        if (el) return resolve(el)
        if (Date.now() - start > timeout) return reject(new Error(`Timeout esperando #${id}`))
        setTimeout(check, 50)
      }
      check()
    })

  const handleDownloadPdf = async () => {
    setDownloadingFicha(true)
    setEditingFicha(false)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ])

      const styleEl = document.createElement('style')
      styleEl.textContent = '* { color: #000 !important; background-color: transparent !important; border-color: #000 !important; }'
      document.head.appendChild(styleEl)
      const nodeCheck = await waitForElement("documento", 10000)
      const headerElCheck = document.getElementById("doc-header")
      if (!nodeCheck || !headerElCheck) {
        alert("No se encontró el documento para generar el PDF.")
        setDownloadingFicha(false)
        setEditingFicha(true)
        styleEl.remove()
        return
      }
      const node = nodeCheck
      const headerEl = headerElCheck

      const scrollableAncestors: HTMLElement[] = []
      let walker = (node as HTMLElement).parentElement
      while (walker && walker !== document.body) {
        scrollableAncestors.push(walker)
        walker = walker.parentElement
      }
      const previousStyles = scrollableAncestors.map((a) => ({
        el: a,
        overflow: a.style.overflow,
        overflowY: a.style.overflowY,
        overflowX: a.style.overflowX,
        maxHeight: a.style.maxHeight,
        maxWidth: a.style.maxWidth,
        scrollTop: a.scrollTop,
      }))
      scrollableAncestors.forEach((a) => {
        a.style.overflow = "visible"
        a.style.overflowY = "visible"
        a.style.overflowX = "visible"
        a.style.maxHeight = "none"
        a.style.maxWidth = "none"
        a.scrollTop = 0
      })

      const shot = (el: HTMLElement) =>
        html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, allowTaint: true, logging: false, removeContainer: true, foreignObjectRendering: false } as any)

      styleEl.textContent = '* { color: #000 !important; background-color: #fff !important; border-color: #000 !important; fill: #000 !important; stroke: #000 !important; }'
      await new Promise(r => setTimeout(r, 200))
      styleEl.textContent = '* { color: #000 !important; background-color: #fff !important; border-color: #000 !important; fill: #000 !important; stroke: #000 !important; }'
      document.head.appendChild(styleEl)
      await new Promise(r => setTimeout(r, 200))

      const headerCanvas = await shot(headerEl)
      headerEl.style.display = "none"
      const fullCanvas = await shot(node)

      const pdf = new jsPDF({ unit: "pt", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const marginX = 40
      const marginTop = 28
      const marginBottom = 28
      const gap = 8
      const contentWidth = pageWidth - marginX * 2

      const ptHeight = (c: HTMLCanvasElement) => (c.height * contentWidth) / c.width
      const headerHpt = Math.max(ptHeight(headerCanvas), 40)
      const headerData = headerCanvas.toDataURL("image/png")
      const contentHeightPt = ptHeight(fullCanvas)
      const contentTop = marginTop + headerHpt + gap
      const availableContentHeight = pageHeight - marginBottom - contentTop
      const pxPerPt = fullCanvas.width / contentWidth
      const totalPages = Math.max(1, Math.ceil((contentHeightPt + gap) / (availableContentHeight + gap)))

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage()
        pdf.addImage(headerData, "PNG", marginX, marginTop, contentWidth, headerHpt)
        const startY = i * availableContentHeight
        const sliceH = Math.min(availableContentHeight, contentHeightPt - startY)
        if (sliceH <= 0) continue
        const tmp = document.createElement("canvas")
        tmp.width = fullCanvas.width
        tmp.height = Math.max(1, Math.round(sliceH * pxPerPt))
        const ctx = tmp.getContext("2d")
        if (!ctx) continue
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, tmp.width, tmp.height)
        ctx.drawImage(fullCanvas, 0, Math.round(startY * pxPerPt), fullCanvas.width, tmp.height, 0, 0, fullCanvas.width, tmp.height)
        pdf.addImage(tmp.toDataURL("image/png"), "PNG", marginX, contentTop, contentWidth, sliceH)
      }

      const fileName = tipoFichaActual
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
      pdf.save(`${fileName}.pdf`);
    } catch (err: any) {
      alert("Error generando el PDF: " + err.message);
    } finally {
      const headerElFinally = document.getElementById("doc-header")
      if (headerElFinally) headerElFinally.style.display = ""
      setDownloadingFicha(false)
      setEditingFicha(true)
      // Remove temporary style
      const styleEls = document.querySelectorAll('style')
      styleEls.forEach((el) => {
        if (el.textContent && el.textContent.includes('color: #000 !important')) {
          el.remove()
        }
      })
    }
  }

  const handleCampoChange = (seccionIndex: number, campoIndex: number, value: string) => {
    setFichaActual((prev) => {
      const nueva = [...prev]
      nueva[seccionIndex] = {
        ...nueva[seccionIndex],
        campos: nueva[seccionIndex].campos.map((c, i) => (i === campoIndex ? { ...c, value } : c)),
      }
      return nueva
    })
  }

  if (loading) {
    return (
      <div className="p-4">
        <Card><CardContent>Cargando fichas técnicas…</CardContent></Card>
      </div>
    )
  }

  const fichasDeSolicitud = fichas.length > 0 ? fichas : (fichasGuardadasPorSolicitud[String(solicitudIdParam)] || [])

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fichas Técnicas</h1>
            <p className="text-muted-foreground">
              Gestión de fichas técnicas de la solicitud{solicitudIdParam ? `: ${solicitudIdParam}` : ""}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fichas guardadas</CardTitle>
        </CardHeader>
        <CardContent>
          {fichasDeSolicitud.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Fecha</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fichasDeSolicitud.map((ficha) => (
                    <tr key={ficha.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium text-foreground">{ficha.nombre}</td>
                      <td className="px-6 py-4 text-muted-foreground">{ficha.tipo}</td>
                      <td className="px-6 py-4 text-muted-foreground">{ficha.fecha}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerFichaGuardada(ficha)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDescargarFichaGuardada(ficha)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm("¿Eliminar ficha técnica?")) return
                              fetch(`/api/fichas-tecnicas?id=${encodeURIComponent(ficha.id)}`, { method: "DELETE" })
                                .then(() => {
                                  setFichas((prev) => prev.filter((f) => f.id !== ficha.id))
                                  setFichasGuardadasPorSolicitud((prev) => ({
                                    ...prev,
                                    [String(solicitudIdParam)]: (prev[String(solicitudIdParam)] || []).filter((f) => f.id !== ficha.id),
                                  }))
                                })
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No hay fichas técnicas registradas para esta solicitud.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plantillas disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {PLANTILLAS_FICHAS.map((plantilla) => (
              <button
                key={plantilla.id}
                type="button"
                onClick={() => handleAbrirFicha(plantilla.nombre)}
                className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent hover:border-accent"
              >
                <FileText className="size-4" />
                {plantilla.nombre}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {showFichaModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto">
          <div className="rounded-xl bg-card shadow-xl w-full max-w-[850px] my-8 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">{tipoFichaActual}</h3>
              <button onClick={() => setShowFichaModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-neutral-200">
              {(function () {
                const src = solicitudActual || solicitudes.find((s) => s.id === solicitudActualId) || solicitudes[0]
                const codigoRaw = src?.codigo_trazabilidad || ""
                const partes = codigoRaw.split("-")
                const codigoTrazabilidad = partes.length >= 2 ? `${partes[0]}-${partes[1]}` : codigoRaw
                const dientes = (src?.dientes_disponibles || src?.dientes_trabajados || []).map((d: any) => String(d).split("-")[0]).filter((d: string) => d && !isNaN(Number(d)))

                if (cargandoDientesModal) {
                  return <div className="flex h-64 items-center justify-center text-neutral-500 text-sm">Cargando dientes de la solicitud…</div>
                }

                const FichaComponent =
                  tipoFichaActual === "Cerámica Encia"
                    ? FichaTecnicaCeramicaEncia
                    : tipoFichaActual === "Colado UCLA"
                    ? FichaTecnicaColadoUcla
                    : FichaTecnicaGenerica

                const propsComunes = {
                  secciones: fichaActual,
                  onCampoChange: handleCampoChange,
                  editing: editingFicha,
                  onToggleEditing: () => setEditingFicha((e) => !e),
                  onDownload: handleDownloadPdf,
                  downloading: downloadingFicha,
                  showToolbar: true,
                  nombreTipo: tipoFichaActual,
                }

                return (
                  <>
                    {FichaComponent === FichaTecnicaColadoUcla || FichaComponent === FichaTecnicaCeramicaEncia ? (
                      <FichaComponent
                        {...propsComunes}
                        dientes={dientes}
                        codigoTrazabilidad={codigoTrazabilidad}
                      />
                    ) : (
                      <FichaComponent {...propsComunes} />
                    )}
                  </>
                )
              })()}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <button onClick={handleGuardarFicha} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark">
                <Save size={16} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
