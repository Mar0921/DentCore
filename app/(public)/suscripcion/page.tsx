import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dentcore/page-header'
import { SubscribeFlow } from '@/components/dentcore/subscribe-flow'
import { getPlan, type PlanId } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Suscripción | DentCore',
  description: 'Crea tu cuenta de DentCore y comienza a gestionar tu laboratorio dental.',
}

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams
  const initialPlan: PlanId = (getPlan(plan)?.id ?? 'professional') as PlanId

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        cta={
          <Button
            render={<Link href="/iniciar-sesion" />}
            variant="ghost"
            className="text-primary hover:bg-secondary"
          >
            Iniciar sesión
          </Button>
        }
      />
      <SubscribeFlow initialPlan={initialPlan} />
    </main>
  )
}
