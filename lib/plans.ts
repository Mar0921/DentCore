export type PlanId = 'starter' | 'professional' | 'enterprise'

export type Plan = {
  id: PlanId
  name: string
  desc: string
  monthly: number | null
  yearly: number | null
  priceLabel?: string
  features: string[]
  featured: boolean
  cta: string
}

export const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    desc: 'Para laboratorios pequeños.',
    monthly: 170000,
    yearly: 1700000,
    features: [
      'Gestión del laboratorio',
      'Gestión de solicitudes',
      ' clientes',
      'Soporte por correo',
      'Inventario',
      'Reportes',
      'Facturación',
      'Notificaciones',
      'Chat interno',
    ],
    cta: 'Comenzar gratis',
    featured: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    desc: 'Próximamente.',
    monthly: 230000,
    yearly: 2300000,
    features: [
      'Gestión del laboratorio',
      'Inventario',
      'Reportes',
      'Facturación',
      'Notificaciones',
      'Chat interno',
    ],
    cta: 'Próximamente',
    featured: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    desc: 'Para múltiples sedes o altos volúmenes. Nos contactaremos contigo y elaboraremos una solución perfecta para tu laboratorio.',
    monthly: null,
    yearly: null,
    priceLabel: 'A medida',
    features: [
      'Todo lo anterior',
      'API e integraciones',
      'Soporte prioritario',
      'Personalización',
      'Capacitación especializada',
    ],
    cta: 'Solicitar cotización',
    featured: false,
  },
]

export function getPlan(id: string | null | undefined): Plan | undefined {
  return plans.find((p) => p.id === id)
}

export function formatPrice(value: number): string {
  return `$${value.toLocaleString('es-CO')}`
}
