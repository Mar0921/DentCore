import { Suspense } from 'react'
import { RegistroClientePageClient } from '@/components/dentcore/registro/registro-cliente-page-client'

export default function RegistroClientePage() {
  return (
    <Suspense>
      <RegistroClientePageClient />
    </Suspense>
  )
}