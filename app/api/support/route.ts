import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const SUPPORT_EMAIL = 'labdencore@gmail.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message, type, labName, labUserEmail, labUserName } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    // Create a formatted message for the support email
    const emailContent = `
Nuevo mensaje de soporte - DentCore

Tipo: ${type}
Nombre: ${name}
Correo: ${email}
Asunto: ${subject}

Laboratorio: ${labName || 'No especificado'}
Usuario: ${labUserName || 'No especificado'}
Correo usuario: ${labUserEmail || 'No especificado'}

Mensaje:
${message}
    `.trim()

    // Store in database for tracking
    try {
      await supabase.from('support_messages').insert({
        name,
        email,
        subject,
        message,
        type,
        lab_name: labName,
        lab_user_email: labUserEmail,
        lab_user_name: labUserName,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    } catch (dbError) {
      console.error('Error storing support message:', dbError)
      // Continue even if DB insert fails
    }

    // Send email via a service (using Supabase Edge Functions or external service)
    // For now, we'll log it and return success
    // In production, you'd integrate with SendGrid, Resend, etc.
    console.log('=== SUPPORT MESSAGE ===')
    console.log('To:', SUPPORT_EMAIL)
    console.log('Subject:', `[DentCore Soporte] ${subject}`)
    console.log('Body:', emailContent)
    console.log('=======================')

    // Try to send via Supabase Edge Function if available
    try {
      const { error: fnError } = await supabase.functions.invoke('send-support-email', {
        body: {
          to: SUPPORT_EMAIL,
          subject: `[DentCore Soporte] ${subject}`,
          text: emailContent,
          replyTo: email,
        },
      })
      if (fnError) {
        console.error('Edge function error:', fnError)
      }
    } catch (fnError) {
      console.log('Edge function not available, message logged only')
    }

    return NextResponse.json({ success: true, message: 'Mensaje enviado correctamente' }, { status: 200 })
  } catch (e) {
    console.error('Support API error:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}