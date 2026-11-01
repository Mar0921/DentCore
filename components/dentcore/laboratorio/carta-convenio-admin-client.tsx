'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export function CartaConvenioAdminClient() {
  const searchParams = useSearchParams()
  const clienteId = searchParams.get('cliente')
  const [laboratorio, setLaboratorio] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [firmas, setFirmas] = useState<any[]>([])
  const [firmaCliente, setFirmaCliente] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [clienteId])

  async function loadData() {
    try {
      setCliente(null)
      setFirmaCliente(null)
      setLaboratorio(null)
      setFirmas([])

      let cli: any = null
      let carta: any = null

      if (clienteId) {
        const { data: cliData } = await supabase
          .from('cliente')
          .select('*')
          .eq('id', clienteId)
          .maybeSingle()
        cli = cliData
        if (cli) setCliente(cli)

        // 1. Carta por el id del cliente de la URL
        const { data: cartasPorId } = await supabase
          .from('cartas_convenio')
          .select('*')
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false })
          .limit(1)
        carta = cartasPorId?.[0] ?? null

        // 2. Fallback: otras filas de cliente con el mismo email
        if (!carta && cli?.email) {
          const { data: mismos } = await supabase
            .from('cliente')
            .select('id')
            .eq('email', cli.email)
          const ids = (mismos || []).map((c: any) => c.id)

          if (ids.length > 0) {
            const { data: cartasPorEmail } = await supabase
              .from('cartas_convenio')
              .select('*')
              .in('cliente_id', ids)
              .order('created_at', { ascending: false })
              .limit(1)
            carta = cartasPorEmail?.[0] ?? null
          }
        }

        if (carta?.firma_odontologo_data_url) {
          setFirmaCliente(carta.firma_odontologo_data_url)
        }
      }

      // Laboratorio: carta -> cliente -> primero disponible
      let lab: any = null
      const labId = carta?.laboratorio_id || cli?.laboratorio_id

      if (labId) {
        const { data: labData } = await supabase
          .from('laboratorio')
          .select('*')
          .eq('id', labId)
          .maybeSingle()
        lab = labData
      }

      if (!lab) {
        const { data: labData } = await supabase
          .from('laboratorio')
          .select('*')
          .limit(1)
          .maybeSingle()
        lab = labData
      }

      if (lab) {
        setLaboratorio(lab)
        const { data: firm } = await supabase
          .from('firmas')
          .select('*')
          .eq('laboratorio_id', lab.id)
          .eq('activo', true)
          .order('created_at', { ascending: true })
        if (firm) setFirmas(firm)
      }
    } catch (err) {
      console.error(err)
    }
  }

  function handlePrint() {
    window.print()
  }

  const firmaRL = firmas.find((f) => f.rol === 'Representante legal') || null
  const firmaDT = firmas.find((f) => f.rol === 'D.T LABORATORIO DENTAL') || null

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Carta Convenio</h1>
          <p className="text-muted-foreground">
            {firmaCliente ? 'Carta firmada por el cliente' : 'Plantilla de convenio del laboratorio'}
          </p>
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
              <li>Estar debidamente habilitado ante la secretaria de salud en los términos establecidos en la resolución 3100 de 2019.</li>
              <li>Realizar el control pos-adaptación 8 días después en una cita de control al paciente y enviar copia del registro de verificación del estado del dispositivo en el control de la paciente realizada por el odontólogo.</li>
              <li>Informar al Laboratorio dental cualquier evento adverso serio y compartir el código del evento adverso reportado en los programas de tecno vigilancia.</li>
            </ol>
          </div>

          <p>Esperamos atender y cumplir sus necesidades en cuanto a calidad, diseño y estética de los dispositivos médicos.</p>

          <div className="pt-12 space-y-16">
            <div className="grid grid-cols-2 gap-12">
              <div className="text-center space-y-2">
                <div className="border-b border-black h-20 flex items-end justify-center">
                  {firmaRL && (
                    <img src={firmaRL.firma_data_url} alt="Firma Representante Legal" className="h-16 object-contain" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">__________________________________</p>
                  <p className="font-bold">Representante legal</p>
                  {firmaRL && (
                    <>
                      <p className="text-xs">{firmaRL.nombre}</p>
                      {firmaRL.rol && <p className="text-xs">{firmaRL.rol}</p>}
                    </>
                  )}
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="border-b border-black h-20 flex items-end justify-center">
                  {firmaCliente && (
                    <img src={firmaCliente} alt="Firma odontólogo" className="h-16 object-contain" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">__________________________________</p>
                  <p className="font-bold">Recibido Odontólogo o Auxiliar</p>
                  {cliente?.nombre && <p className="text-xs">{cliente.nombre}</p>}
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="border-b border-black h-20 flex items-end justify-center w-64 mx-auto">
                {firmaDT && (
                  <img src={firmaDT.firma_data_url} alt="Firma D.T" className="h-16 object-contain" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-semibold">____________________________________</p>
                <p className="font-bold">D.T LABORATORIO DENTAL {laboratorio?.nombre?.toUpperCase() || ''}</p>
                {firmaDT && (
                  <>
                    <p className="text-xs">{firmaDT.nombre}</p>
                    {firmaDT.rol && <p className="text-xs">{firmaDT.rol}</p>}
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="text-center pt-8">Atentamente</p>
        </CardContent>
      </Card>
    </div>
  )
}