'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, PenTool, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export function CartaConvenioInvitadoClient() {
  const [laboratorio, setLaboratorio] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [firmas, setFirmas] = useState<any[]>([])
  const [firmaLab, setFirmaLab] = useState<any>(null)
  const [firmaCliente, setFirmaCliente] = useState<any>(null)
  const [openFirma, setOpenFirma] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const labEmail = localStorage.getItem('labEmail')
      const clienteEmail = localStorage.getItem('labUserEmail')

      // Buscar cliente primero
      const { data: cli } = await supabase.from('cliente').select('*').eq('email', clienteEmail).maybeSingle()
      if (cli) setCliente(cli)

      let labId: string | null = null
      // Buscar laboratorio por laboratorio_id del cliente o por email guardado
      if (cli?.laboratorio_id) {
        labId = cli.laboratorio_id
        const { data: lab } = await supabase.from('laboratorio').select('*').eq('id', cli.laboratorio_id).maybeSingle()
        if (lab) setLaboratorio(lab)
      } else {
        const { data: lab } = await supabase.from('laboratorio').select('*').eq('email', labEmail).maybeSingle()
        if (lab) {
          setLaboratorio(lab)
          labId = lab.id
        }
      }

      if (cli?.id) {
        const { data: carta } = await supabase.from('cartas_convenio').select('firma_odontologo_data_url').eq('cliente_id', cli.id).maybeSingle()
        if (carta?.firma_odontologo_data_url) {
          setFirmaCliente(carta.firma_odontologo_data_url)
        }
      }

      if (labId) {
        const { data: firm } = await supabase
          .from('firmas')
          .select('*')
          .eq('laboratorio_id', labId)
          .eq('activo', true)
          .order('created_at', { ascending: true })
        if (firm) {
          setFirmas(firm)
          if (firm.length > 0) setFirmaLab(firm[0])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  function initCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2 * scale
    ctx.strokeStyle = '#000000'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function startDrawing(e: any) {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let clientX, clientY
    if (e.touches) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    ctx.beginPath()
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
  }

  function draw(e: any) {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let clientX, clientY
    if (e.touches) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    ctx.stroke()
  }

  function stopDrawing() {
    setIsDrawing(false)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function handlePrint() {
    window.print()
  }

  function guardarFirmaCliente() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    if (dataUrl === 'data:,') {
      alert('Debe dibujar la firma')
      return
    }
    guardarEnDB(dataUrl)
  }

  async function guardarEnDB(dataUrl: string) {
    try {
      const clienteEmail = localStorage.getItem('labUserEmail')
      const { data: cli } = await supabase.from('cliente').select('id, laboratorio_id').eq('email', clienteEmail).maybeSingle()
      if (cli?.laboratorio_id && cli?.id) {
        const { data: existing } = await supabase.from('cartas_convenio').select('id').eq('cliente_id', cli.id).maybeSingle()
        let res
        if (existing) {
          res = await supabase.from('cartas_convenio').update({
            firma_odontologo_data_url: dataUrl,
            fecha_firma: new Date().toISOString(),
            firmado: true,
            laboratorio_id: cli.laboratorio_id,
          }).eq('id', existing.id)
        } else {
          res = await supabase.from('cartas_convenio').insert({
            laboratorio_id: cli.laboratorio_id,
            cliente_id: cli.id,
            firma_odontologo_data_url: dataUrl,
            fecha_firma: new Date().toISOString(),
            firmado: true,
          })
        }
        console.log('GUARDADO:', res)
        setFirmaCliente(dataUrl)
        setOpenFirma(false)
        alert('Carta convenio firmada y guardada correctamente')
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (openFirma && canvasRef.current) {
      setTimeout(() => initCanvas(), 100)
    }
  }, [openFirma])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Carta Convenio</h1>
          <p className="text-muted-foreground">Convenio entre laboratorio y odontólogo</p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="size-4" />
          Imprimir / Guardar PDF
        </Button>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-8 space-y-6 text-sm leading-relaxed">
          <div className="text-center space-y-2">
            <p>Santiago de Cali, {new Date().toLocaleDateString('es-CO')}</p>
            <p className="text-xl font-bold">CARTA CONVENIO</p>
          </div>

          <div className="space-y-1">
            <p><strong>Clínica:</strong> {cliente?.clinica || cliente?.nombre || 'XXXXXXXXX'}</p>
            <p><strong>Doctor(a):</strong> {cliente?.nombre || 'XXXXXXXXXX'}</p>
          </div>

          <p>
            El laboratorio dental <strong>{laboratorio?.nombre || ''}</strong> confirma el compromiso para la provisión en cuanto a fabricación, reparación y dispensación, de los DISPOSITIVOS MÉDICOS SOBRE MEDIDA BUCAL, cumpliendo con la resolución 214 de 2022 en la cual se establecen los requisitos sanitarios que deben cumplir los dispositivos médicos sobre medida bucal.
          </p>

          <p>
            Nuestro compromiso es respetar su autonomía como odontólogo, fabricando o reparando los dispositivos acordes a la prescripción por usted realizada en la evaluación previa del paciente con los datos completos.
          </p>

          <p>Declaramos nuestro compromiso como fabricante</p>

          <div className="space-y-3">
            <p className="font-bold">DENTRO DEL CONVENIO EL LABORATORIO SE COMPROMETE A:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>EL LABORATORIO garantiza que los trabajos entregados estarán elaborados con materiales de buena calidad y conforme a las especificaciones solicitadas.</li>
              <li>Cumplir con Procedimientos documentados: Declaración de conformidad con su garantía si aplica, Ficha técnica de fabricación, manual de uso.</li>
              <li>El tiempo de entrega estará sujeto a acuerdos según la complejidad del caso.</li>
              <li>Nos comprometemos a respetar su autonomía y trabajar articuladamente entre técnico y odontólogo.</li>
              <li>Ambas partes se comprometen a mantener la confidencialidad respecto a los datos de los pacientes, precios, y cualquier información considerada confidencial.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <p className="font-bold">COMPROMISO DEL ODONTOLOGO</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Enviar la orden de fabricación de forma completa y clara con los datos solicitados sin enmendaduras y en letra legible en los términos establecidos en el artículo 6 de la resolución 214 de 2022.</li>
              <li>Estar debidamente habilitado ante la secretaría de salud en los términos establecidos en la resolución 3100 de 2019.</li>
              <li>Realizar el control pos-adaptación 8 días después en una cita de control al paciente y enviar copia del registro de verificación del estado del dispositivo en el control del paciente realizada por el odontólogo.</li>
              <li>Informar al Laboratorio dental cualquier evento adverso serio y compartir el código del evento adverso reportado en los programas de tecnovigilancia.</li>
            </ol>
          </div>

          <p>Esperamos atender y cumplir sus necesidades en cuanto a calidad, diseño y estética de los dispositivos médicos.</p>

          <div className="pt-12 space-y-16">
            <div className="grid grid-cols-2 gap-12">
              <div className="text-center space-y-2">
                <div className="border-b border-black h-20 flex items-end justify-center">
                  {firmas[0] && <img src={firmas[0].firma_data_url} alt="Firma laboratorio" className="h-16 object-contain" />}
                </div>
                <div className="space-y-1">

                  <p className="font-bold">Representante legal</p>
                  {firmas[0] && (
                    <>
                      <p className="text-xs">{firmas[0].nombre}</p>
                      {firmas[0].rol && <p className="text-xs">{firmas[0].rol}</p>}
                    </>
                  )}
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="border-b border-black h-20 flex items-end justify-center">
                  {firmaCliente ? (
                    <img src={firmaCliente} alt="Firma odontólogo" className="h-16 object-contain" />
                  ) : (
                    <button type="button" className="w-full h-full flex items-center justify-center text-xs text-muted-foreground hover:text-foreground print:hidden" onClick={() => setOpenFirma(true)}>
                      <span className="flex items-center gap-1"><PenTool className="size-3" /> Dibujar firma</span>
                    </button>
                  )}
                </div>
                <div className="space-y-1">

                  <p className="font-bold">Recibido Odontólogo o Auxiliar</p>
                  {firmaCliente && (
                    <Button type="button" variant="ghost" size="sm" className="mt-1 print:hidden" onClick={() => setOpenFirma(true)}>
                      <PenTool className="size-3 mr-1" />
                      Editar firma
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="border-b border-black h-20 flex items-end justify-center w-64 mx-auto">
                {firmas[1] ? (
                  <img src={firmas[1].firma_data_url} alt="Firma D.T" className="h-16 object-contain" />
                ) : firmas[0] ? (
                  <img src={firmas[0].firma_data_url} alt="Firma D.T" className="h-16 object-contain" />
                ) : null}
              </div>
              <div className="space-y-1">

                <p className="font-bold">D.T LABORATORIO DENTAL {laboratorio?.nombre?.toUpperCase() || ''}</p>
                {(firmas[1] || firmas[0]) && (
                  <>
                    <p className="text-xs">{(firmas[1] || firmas[0]).nombre}</p>
                    {(firmas[1] || firmas[0]).rol && <p className="text-xs">{(firmas[1] || firmas[0]).rol}</p>}
                  </>
                )}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      <Dialog open={openFirma} onOpenChange={setOpenFirma}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Firmar Carta Convenio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Firma del Odontólogo</label>
                <Button type="button" variant="ghost" size="sm" onClick={clearCanvas} className="gap-1">
                  <RotateCcw className="size-3" />
                  Limpiar
                </Button>
              </div>
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full border rounded-lg bg-white cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <p className="text-xs text-muted-foreground mt-1">Dibuja tu firma con el ratón o dedo</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenFirma(false)}>Cancelar</Button>
            <Button onClick={guardarFirmaCliente}>Guardar firma</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
