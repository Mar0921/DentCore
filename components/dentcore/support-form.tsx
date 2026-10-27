'use client'

import { useState } from 'react'
import { X, Send, Loader2, Mail, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface SupportFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportForm({ open, onOpenChange }: SupportFormProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<'consulta' | 'soporte' | 'bug' | 'sugerencia'>('consulta')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setStatus('error')
      setErrorMessage('Por favor completa todos los campos')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error')
      setErrorMessage('Correo electrónico no válido')
      return
    }

    setSubmitting(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          type,
          labName: localStorage.getItem('labName') || '',
          labUserEmail: localStorage.getItem('labUserEmail') || '',
          labUserName: localStorage.getItem('labUserName') || '',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje')
      }

      setStatus('success')
      setSubject('')
      setMessage('')
      setEmail('')
      setName('')
      
      setTimeout(() => {
        onOpenChange(false)
        setStatus('idle')
      }, 3000)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Error al enviar el mensaje')
    } finally {
      setSubmitting(false)
    }
  }

  const typeOptions = [
    { value: 'consulta', label: 'Consulta general', icon: MessageSquare },
    { value: 'soporte', label: 'Soporte técnico', icon: AlertCircle },
    { value: 'bug', label: 'Reporte de error', icon: AlertCircle },
    { value: 'sugerencia', label: 'Sugerencia', icon: MessageSquare },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="size-5 text-primary" />
              <span>Contactar a DentCore</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setStatus('idle')
                setErrorMessage('')
                onOpenChange(false)
              }}
            >
              <X className="size-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Envíanos tu consulta, reporte de error o sugerencia. Te responderemos a la brevedad.
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-accent/15 mb-4">
              <CheckCircle className="size-8 text-accent" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-primary">¡Mensaje enviado!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Gracias por contactarnos. Responderemos a <strong>{email || 'tu correo'}</strong> lo antes posible.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-primary">Nombre</label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-primary">Correo electrónico</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="type" className="text-sm font-medium text-primary">Tipo de mensaje</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                disabled={submitting}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-sm font-medium text-primary">Asunto</label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del mensaje"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="text-sm font-medium text-primary">Mensaje</label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe tu consulta, problema o sugerencia..."
                rows={5}
                disabled={submitting}
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatus('idle')
                  setErrorMessage('')
                  onOpenChange(false)
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" className="gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Enviar mensaje
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}