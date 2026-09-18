import { Mail, MessageCircle, Globe, Phone } from 'lucide-react'
import { DentCoreLogo } from './logo'

const columns = [
  {
    title: 'Producto',
    links: ['Funciones', 'Planes', 'Tipos de acceso', 'Actualizaciones'],
  },
  {
    title: 'Empresa',
    links: ['Sobre DentCore', 'Nosotros', 'Contacto', 'Soporte'],
  },
  {
    title: 'Legal',
    links: ['Términos y condiciones', 'Política de privacidad', 'Seguridad', 'Cookies'],
  },
]

const socials = [
  { icon: Mail, label: 'Correo' },
  { icon: MessageCircle, label: 'Chat' },
  { icon: Phone, label: 'Teléfono' },
  { icon: Globe, label: 'Sitio web' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <span className="text-primary">
              <DentCoreLogo />
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              La plataforma en la nube que centraliza la gestión de tu laboratorio
              dental: trabajos, técnicos, inventario y facturación en un solo lugar.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-heading text-sm font-semibold text-primary">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} DentCore. Todos los derechos reservados.</p>
          <p>Hecho para laboratorios dentales modernos.</p>
        </div>
      </div>
    </footer>
  )
}
