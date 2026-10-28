import { CartaConvenioAdminClient } from '@/components/dentcore/laboratorio/carta-convenio-admin-client'
import { Suspense } from 'react'

export default function CartaConvenioAdminPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <CartaConvenioAdminClient />
    </Suspense>
  )
}

