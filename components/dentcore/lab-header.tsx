'use client'

import { useState, useEffect } from "react"
import { FlaskConical, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function LabHeader() {
  const [labName, setLabName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    loadInfo()
  }, [])

  async function loadInfo() {
    try {
      // Buscar todos los laboratorios
      const { data: labs } = await supabase
        .from("laboratorio")
        .select("id, nombre")

      if (labs && labs.length > 0) {
        setLabName(labs[0].nombre)

        // Buscar empleados de ese laboratorio
        const { data: employees } = await supabase
          .from("empleados")
          .select("email")
          .eq("laboratorio_id", labs[0].id)
          .limit(1)

        if (employees && employees.length > 0) {
          setUserEmail(employees[0].email || "")
        }
      }
    } catch (err) {
      console.error("Error:", err)
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
        {userEmail || "Cargando..."}
        <ChevronDown className="size-3" />
      </Button>
    </>
  )
}