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
    monthly: 260000,
    yearly: 2600000,
    features: [
      'Gestión del laboratorio',
      'Gestión de solicitudes',
      'Clientes',
      'Soporte por correo',
    ],
    cta: 'Comenzar gratis',
    featured: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    desc: 'El plan más recomendado.',
    monthly: 320000,
    yearly: 3200000,
    features: [
      'Gestión del laboratorio',
      'Inventario',
      'Reportes',
      'Facturación',
      'Notificaciones',
      'Chat interno',
    ],
    cta: 'Elegir Professional',
    featured: true,
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
