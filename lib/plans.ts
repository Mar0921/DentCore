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
    monthly: 29,
    yearly: 290,
    features: [
      'Hasta 3 usuarios',
      'Gestión de solicitudes',
      'Clientes',
      'Facturación básica',
      'Soporte por correo',
    ],
    cta: 'Comenzar gratis',
    featured: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    desc: 'El plan más recomendado.',
    monthly: 79,
    yearly: 790,
    features: [
      'Usuarios ilimitados',
      'Inventario',
      'Reportes',
      'Facturación completa',
      'Notificaciones',
      'Chat interno',
    ],
    cta: 'Elegir Professional',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    desc: 'Para múltiples sedes o altos volúmenes.',
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
  return `$${value.toLocaleString('en-US')}`
}
