import { Navbar } from '@/components/dentcore/navbar'
import { Hero } from '@/components/dentcore/hero'
import { Marquee } from '@/components/dentcore/marquee'
import { Why } from '@/components/dentcore/why'
import { Features } from '@/components/dentcore/features'
import { Roles } from '@/components/dentcore/roles'
import { WhyChoose } from '@/components/dentcore/why-choose'
import { Pricing } from '@/components/dentcore/pricing'
import { Faq } from '@/components/dentcore/faq'
import { Cta } from '@/components/dentcore/cta'
import { Footer } from '@/components/dentcore/footer'

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Marquee />
      <Why />
      <Features />
      <Roles />
      <WhyChoose />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
    </main>
  )
}
