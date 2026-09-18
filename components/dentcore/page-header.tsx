import Link from 'next/link'
import { DentCoreLogo } from './logo'

export function PageHeader({ cta }: { cta?: React.ReactNode }) {
  return (
    <header className="border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-primary" aria-label="Ir al inicio de DentCore">
          <DentCoreLogo />
        </Link>
        {cta}
      </div>
    </header>
  )
}
