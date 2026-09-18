import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useLabUser() {
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [labName, setLabName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserInfo()
  }, [])

  async function loadUserInfo() {
    try {
      // Primero verificar localStorage
      const savedEmail = localStorage.getItem('labUserEmail')
      const savedName = localStorage.getItem('labUserName')
      const savedLabName = localStorage.getItem('labName')

      if (savedEmail) {
        setUserEmail(savedEmail)
        setUserName(savedName || "")
        if (savedLabName) {
          setLabName(savedLabName)
        }
        setLoading(false)
        return
      }

      // Si no hay en localStorage, buscar en BD
      const { data: labs } = await supabase
        .from("laboratorio")
        .select("id, nombre")
        .limit(1)

      if (labs && labs.length > 0) {
        setLabName(labs[0].nombre)

        const { data: employees } = await supabase
          .from("empleados")
          .select("nombre, email")
          .eq("laboratorio_id", labs[0].id)
          .limit(1)

        if (employees && employees.length > 0) {
          setUserName(employees[0].nombre)
          setUserEmail(employees[0].email || "")
        }
      }
    } catch (err) {
      console.error("Error loading user info:", err)
    } finally {
      setLoading(false)
    }
  }

  return { userName, userEmail, labName, loading }
}