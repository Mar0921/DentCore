'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const CHANNEL_NAME = 'dentcore-session-sync'
const SESSION_KEY = 'dentcore_session_id'

function generateSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function SessionSync() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const mySessionId = useRef<string>('')
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let currentId = localStorage.getItem(SESSION_KEY)
    if (!currentId) {
      currentId = generateSessionId()
      localStorage.setItem(SESSION_KEY, currentId)
    }
    mySessionId.current = currentId

    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (event) => {
      const data = event.data
      if (!data) return

      if (data.type === 'session-start' && data.sessionId && data.sessionId !== mySessionId.current) {
        setOpen(true)
      }

      if (data.type === 'session-force-logout' && data.sessionId !== mySessionId.current) {
        supabase.auth.signOut().catch(() => {})
        localStorage.removeItem('labUserType')
        localStorage.removeItem('labUserEmail')
        localStorage.removeItem('labUserName')
        localStorage.removeItem('labName')
        localStorage.removeItem('labId')
        router.push('/')
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY && e.newValue && e.newValue !== mySessionId.current) {
        setOpen(true)
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      channel.close()
      window.removeEventListener('storage', onStorage)
    }
  }, [router])

  const closeThisSession = async () => {
    try {
      await supabase.auth.signOut()
    } catch (_) {}
    try {
      localStorage.removeItem('labUserType')
      localStorage.removeItem('labUserEmail')
      localStorage.removeItem('labUserName')
      localStorage.removeItem('labName')
      localStorage.removeItem('labId')
      localStorage.removeItem(SESSION_KEY)
    } catch (_) {}
    setOpen(false)
    router.push('/')
  }

  const keepThisSession = () => {
    const newId = generateSessionId()
    mySessionId.current = newId
    try {
      localStorage.setItem(SESSION_KEY, newId)
    } catch (_) {}
    channelRef.current?.postMessage({ type: 'session-force-logout', sessionId: newId })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Sesión activa en otra pestaña</DialogTitle>
          <DialogDescription>
            Tienes una sesión iniciada en otra ventana o pestaña. ¿Qué deseas hacer?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={closeThisSession} className="w-full sm:w-auto">
            Cerrar sesión en esta pestaña
          </Button>
          <Button onClick={keepThisSession} className="w-full sm:w-auto">
            Mantener sesión aquí y cerrar la otra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function broadcastSessionStart() {
  if (typeof window === 'undefined') return
  try {
    const id = localStorage.getItem(SESSION_KEY) || generateSessionId()
    localStorage.setItem(SESSION_KEY, id)
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.postMessage({ type: 'session-start', sessionId: id })
    setTimeout(() => channel.close(), 500)
  } catch (_) {}
}
