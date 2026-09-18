import { Plus } from 'lucide-react'

const words = [
  'Solicitudes',
  'Producción',
  'Inventario',
  'Facturación',
  'Comunicación',
  'Reportes',
  'Técnicos',
  'Clientes',
]

export function Marquee() {
  return (
    <section className="border-y border-border bg-primary py-6 text-primary-foreground">
      <div className="relative flex overflow-hidden">
        <div className="flex shrink-0 animate-dentcore-marquee items-center gap-6">
          {[...words, ...words].map((w, i) => (
            <div key={i} className="flex items-center gap-6 whitespace-nowrap">
              <span className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {w}
              </span>
              <Plus className="size-6 text-accent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
