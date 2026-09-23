import { TarifasPageClient } from '@/components/dentcore/tarifas/tarifas-page-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tarifas | DentCore',
  description: 'Precios de venta por producto.',
}

export default function TarifasPage() {
  return <TarifasPageClient />
}
