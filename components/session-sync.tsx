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
import { Loader2 } from 'lucide-react'

const CHANNEL_NAME = 'dentcore-session-sync'
const SESSION_KEY = 'dentcore_session_id'
const TAB_ID_KEY = 'dentcore_tab_id'

function generateSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function generateTabId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function SessionSync() {
  const router = useRouter()
  const [blocked, setBlocked] = useState(false)
  const mySessionId = useRef<string>('')
  const myTabId = useRef<string>('')
  const channelRef = useRef<BroadcastChannel | null>(null)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let currentId = localStorage.getItem(SESSION_KEY)
    if (!currentId) {
      currentId = generateSessionId()
      localStorage.setItem(SESSION_KEY, currentId)
    }
    mySessionId.current = currentId

    let tabId = sessionStorage.getItem(TAB_ID_KEY)
    if (!tabId) {
      tabId = generateTabId()
      sessionStorage.setItem(TAB_ID_KEY, tabId)
    }
    myTabId.current = tabId

    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (event) => {
      const data = event.data
      if (!data) return

      if (data.type === 'tab-join' && data.sessionId === mySessionId.current && data.tabId !== myTabId.current) {
        if (!hasCheckedRef.current) {
          hasCheckedRef.current = true
          setBlocked(true)
        }
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

    channel.postMessage({ type: 'tab-join', sessionId: mySessionId.current, tabId: myTabId.current })

    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY && e.newValue && e.newValue !== mySessionId.current) {
        if (!hasCheckedRef.current) {
          hasCheckedRef.current = true
          setBlocked(true)
        }
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      channel.postMessage({ type: 'tab-leave', sessionId: mySessionId.current, tabId: myTabId.current })
      channel.close()
      window.removeEventListener('storage', onStorage)
    }
  }, [router])

  const handleRedirectToLogin = () => {
    supabase.auth.signOut().catch(() => {})
    try {
      localStorage.removeItem('labUserType')
      localStorage.removeItem('labUserEmail')
      localStorage.removeItem('labUserName')
      localStorage.removeItem('labName')
      localStorage.removeItem('labId')
      localStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(TAB_ID_KEY)
    } catch (_) {}
    router.push('/iniciar-sesion')
  }

  if (blocked) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sesión activa en otra pestaña</DialogTitle>
            <DialogDescription>
              Ya tienes una sesión iniciada en otra pestaña o ventana de DentCore. 
              Para evitar conflictos entre perfiles, no se permite tener múltiples pestañas abiertas simultáneamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row justify-center">
            <Button onClick={handleRedirectToLogin} className="w-full sm:w-auto" disabled={false}>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ir a iniciar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return null
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
