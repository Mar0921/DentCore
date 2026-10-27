'use client'

import { useState, useEffect } from "react"
import { FlaskConical, ChevronDown, LogOut, User, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { exportPageToPDF, getPageTitle } from '@/lib/pdf-export'

export function LabHeader() {
  const [labName, setLabName] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadInfo()
  }, [])

  function loadInfo() {
    if (typeof window !== 'undefined') {
      const storedLabName = localStorage.getItem('labName')
      const storedUserName = localStorage.getItem('labUserName')
      const storedUserEmail = localStorage.getItem('labUserEmail')
      setLabName(storedLabName || "")
      setUserName(storedUserName || "")
      setUserEmail(storedUserEmail || "")
    }
  }

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('labUserType')
      localStorage.removeItem('labUserEmail')
      localStorage.removeItem('labUserName')
      localStorage.removeItem('labName')
    }
    router.push('/iniciar-sesion')
    router.refresh()
  }

  async function handleExportPDF() {
    setIsExporting(true)
    try {
      const title = getPageTitle()
      await exportPageToPDF(title)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error al generar el PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Button variant="ghost" className="gap-1.5 text-xs">
        <FlaskConical className="size-4" />
        {labName || "Cargando..."}
        <ChevronDown className="size-3" />
      </Button>
      <Button variant="ghost" className="gap-1.5 text-xs">
        <User className="size-3" />
        {userName || "Cargando..."}
        <ChevronDown className="size-3" />
      </Button>
      <Button variant="ghost" className="gap-1.5 text-xs">
        {userEmail || "Cargando..."}
        <ChevronDown className="size-3" />
      </Button>
      <Button variant="ghost" size="icon" className="size-9" onClick={handleExportPDF} title="Exportar a PDF" disabled={isExporting}>
        <Printer className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" className="size-9" onClick={handleLogout}>
        <LogOut className="size-4" />
      </Button>
    </>
  )
}