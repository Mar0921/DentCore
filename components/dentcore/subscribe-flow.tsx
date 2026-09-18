'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Building2,
  Lock,
  CheckCircle2,
  Loader2,
  Upload,
  Image,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { plans, getPlan, formatPrice, type Plan, type PlanId } from '@/lib/plans'
import { createLaboratorio, createAdmin } from '@/lib/services/laboratorio.service'
import { supabase } from '@/lib/supabase'

type Cycle = 'monthly' | 'yearly'

const steps = ['Plan', 'Cuenta', 'Pago', 'Listo'] as const

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-primary">
        {label}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/30'

export function SubscribeFlow({ initialPlan }: { initialPlan: PlanId }) {
  const [step, setStep] = useState(0)
  const [planId, setPlanId] = useState<PlanId>(initialPlan)
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [submitting, setSubmitting] = useState(false)

  const plan = getPlan(planId) as Plan
  const isEnterprise = plan.id === 'enterprise'

  // form data
  const [account, setAccount] = useState({
    lab: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    logo: null as File | null,
    logoPreview: '' as string,
  })
  const [payment, setPayment] = useState({ card: '', exp: '', cvc: '', holder: '' })
  const [quote, setQuote] = useState({ company: '', name: '', email: '', phone: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const price = useMemo(() => {
    if (isEnterprise) return null
    return cycle === 'monthly' ? plan.monthly : plan.yearly
  }, [plan, cycle, isEnterprise])

  function validateAccount() {
    const e: Record<string, string> = {}
    if (!account.lab.trim()) e.lab = 'Ingresa el nombre del laboratorio.'
    if (!account.name.trim()) e.name = 'Ingresa tu nombre.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) e.email = 'Correo no válido.'
    if (account.password.length < 6) e.password = 'Mínimo 6 caracteres.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validatePayment() {
    const e: Record<string, string> = {}
    if (isEnterprise) {
      if (!quote.company.trim()) e.company = 'Ingresa el nombre de la empresa.'
      if (!quote.name.trim()) e.name = 'Ingresa tu nombre.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quote.email)) e.email = 'Correo no válido.'
    } else {
      if (payment.card.replace(/\s/g, '').length < 15) e.card = 'Número de tarjeta no válido.'
      if (!/^\d{2}\/\d{2}$/.test(payment.exp)) e.exp = 'Formato MM/AA.'
      if (payment.cvc.length < 3) e.cvc = 'CVC no válido.'
      if (!payment.holder.trim()) e.holder = 'Ingresa el titular.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    setErrors({})
    if (step === 1 && !validateAccount()) return
    if (step === 2) {
      if (!validatePayment()) return
      setSubmitting(true)
      // Save to Supabase
      saveToSupabase()
      return
    }
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  async function saveToSupabase() {
    try {
      let logoUrl: string | undefined

      // Upload logo if provided
      if (account.logo) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('logos-laboratorios')
          .upload(`temp/${Date.now()}_${account.logo.name}`, account.logo)

        if (uploadError) {
          console.error('Logo upload error:', uploadError)
        } else if (uploadData) {
          const { data: publicUrl } = supabase.storage
            .from('logos-laboratorios')
            .getPublicUrl(uploadData.path)
          logoUrl = publicUrl.publicUrl
        }
      }

      // Create laboratorio
      const laboratorio = await createLaboratorio({
        nombre: account.lab,
        email: account.email,
        telefono: account.phone || undefined,
        direcccion: account.address || undefined,
        ciudad: account.city || undefined,
        plan: planId,
        logo: logoUrl,
      })

      // Create admin employee
      await createAdmin({
        laboratorioId: laboratorio.id,
        nombre: account.name,
        email: account.email,
        password: account.password,
      })

      setSubmitting(false)
      setStep(3)
    } catch (err: any) {
      setErrors({ submit: err.message || 'Error al crear la cuenta.' })
      setSubmitting(false)
    }
  }

  function back() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:py-16 lg:px-8">
      {/* main column */}
      <div>
        {/* stepper */}
        <ol className="mb-10 flex items-center gap-2">
          {steps.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                    i < step && 'border-accent bg-accent text-accent-foreground',
                    i === step && 'border-primary bg-primary text-primary-foreground',
                    i > step && 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {i < step ? <Check className="size-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'hidden text-sm font-medium sm:block',
                    i <= step ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    'h-px flex-1',
                    i < step ? 'bg-accent' : 'bg-border',
                  )}
                />
              )}
            </li>
          ))}
        </ol>

        {/* STEP 0 — plan & cycle */}
        {step === 0 && (
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary sm:text-3xl">
              Elige tu plan
            </h1>
            <p className="mt-2 text-muted-foreground">
              Comienza con 14 días de prueba gratis. Sin tarjeta para empezar en planes con prueba.
            </p>

            <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1">
              {(['monthly', 'yearly'] as Cycle[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={cn(
                    'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                    cycle === c
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-primary',
                  )}
                >
                  {c === 'monthly' ? 'Mensual' : 'Anual'}
                  {c === 'yearly' && (
                    <span className="ml-1.5 text-xs text-accent">-2 meses</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4">
              {plans.map((p) => {
                const selected = p.id === planId
                const pPrice = p.id === 'enterprise' ? null : cycle === 'monthly' ? p.monthly : p.yearly
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border p-5 text-left transition-all',
                      selected
                        ? 'border-accent bg-accent/5 ring-2 ring-accent/30'
                        : 'border-border bg-card hover:border-accent/50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                        selected ? 'border-accent bg-accent text-accent-foreground' : 'border-border',
                      )}
                    >
                      {selected && <Check className="size-3" />}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-primary">{p.name}</span>
                        {p.featured && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                    <div className="text-right">
                      {pPrice !== null ? (
                        <>
                          <span className="font-heading text-xl font-bold text-primary">
                            {formatPrice(pPrice)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            /{cycle === 'monthly' ? 'mes' : 'año'}
                          </span>
                        </>
                      ) : (
                        <span className="font-heading text-lg font-bold text-primary">
                          {p.priceLabel}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 1 — account */}
        {step === 1 && (
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary sm:text-3xl">
              Crea tu cuenta
            </h1>
            <p className="mt-2 text-muted-foreground">
              Con estos datos configuraremos el acceso a tu laboratorio.
            </p>
            <div className="mt-6 grid gap-5">
              <Field label="Nombre del laboratorio" id="lab" error={errors.lab}>
                <input
                  id="lab"
                  className={inputClass}
                  placeholder="Laboratorio Dental Sonrisa"
                  value={account.lab}
                  onChange={(e) => setAccount({ ...account, lab: e.target.value })}
                />
              </Field>
              <Field label="Teléfono" id="phone">
                <input
                  id="phone"
                  className={inputClass}
                  placeholder="+34 123 456 789"
                  value={account.phone}
                  onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                />
              </Field>
              <Field label="Dirección" id="address">
                <input
                  id="address"
                  className={inputClass}
                  placeholder="Calle Principal 123"
                  value={account.address}
                  onChange={(e) => setAccount({ ...account, address: e.target.value })}
                />
              </Field>
              <Field label="Ciudad" id="city">
                <input
                  id="city"
                  className={inputClass}
                  placeholder="Madrid"
                  value={account.city}
                  onChange={(e) => setAccount({ ...account, city: e.target.value })}
                />
              </Field>
              <Field label="Logo del laboratorio" id="logo">
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40"
                    onClick={() => document.getElementById('logo-input')?.click()}
                  >
                    {account.logoPreview ? (
                      <img src={account.logoPreview} alt="Logo" className="size-full object-cover" />
                    ) : (
                      <Image className="size-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      id="logo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (!file.type.startsWith('image/')) return
                        const url = URL.createObjectURL(file)
                        setAccount({ ...account, logo: file, logoPreview: url })
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => document.getElementById('logo-input')?.click()}
                    >
                      <Upload className="size-4" />
                      Subir logo
                    </Button>
                  </div>
                </div>
              </Field>
              <Field label="Tu nombre" id="name" error={errors.name}>
                <input
                  id="name"
                  className={inputClass}
                  placeholder="Nombre y apellido"
                  value={account.name}
                  onChange={(e) => setAccount({ ...account, name: e.target.value })}
                />
              </Field>
              <Field label="Correo electrónico" id="email" error={errors.email}>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  placeholder="tu@laboratorio.com"
                  value={account.email}
                  onChange={(e) => setAccount({ ...account, email: e.target.value })}
                />
              </Field>
              <Field label="Contraseña" id="password" error={errors.password}>
                <input
                  id="password"
                  type="password"
                  className={inputClass}
                  placeholder="Mínimo 6 caracteres"
                  value={account.password}
                  onChange={(e) => setAccount({ ...account, password: e.target.value })}
                />
              </Field>
            </div>
          </div>
        )}

        {/* STEP 2 — payment or quote */}
        {step === 2 && !isEnterprise && (
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary sm:text-3xl">
              Datos de pago
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <Lock className="size-4 text-accent" />
              Tus datos están protegidos. No se realizará ningún cargo durante la prueba.
            </p>
            <div className="mt-6 grid gap-5">
              <Field label="Titular de la tarjeta" id="holder" error={errors.holder}>
                <input
                  id="holder"
                  className={inputClass}
                  placeholder="Como aparece en la tarjeta"
                  value={payment.holder}
                  onChange={(e) => setPayment({ ...payment, holder: e.target.value })}
                />
              </Field>
              <Field label="Número de tarjeta" id="card" error={errors.card}>
                <div className="relative">
                  <input
                    id="card"
                    inputMode="numeric"
                    className={cn(inputClass, 'pr-10')}
                    placeholder="1234 5678 9012 3456"
                    value={payment.card}
                    onChange={(e) =>
                      setPayment({
                        ...payment,
                        card: e.target.value
                          .replace(/[^\d]/g, '')
                          .slice(0, 16)
                          .replace(/(.{4})/g, '$1 ')
                          .trim(),
                      })
                    }
                  />
                  <CreditCard className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Vencimiento" id="exp" error={errors.exp}>
                  <input
                    id="exp"
                    inputMode="numeric"
                    className={inputClass}
                    placeholder="MM/AA"
                    value={payment.exp}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, '').slice(0, 4)
                      setPayment({
                        ...payment,
                        exp: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v,
                      })
                    }}
                  />
                </Field>
                <Field label="CVC" id="cvc" error={errors.cvc}>
                  <input
                    id="cvc"
                    inputMode="numeric"
                    className={inputClass}
                    placeholder="123"
                    value={payment.cvc}
                    onChange={(e) =>
                      setPayment({ ...payment, cvc: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })
                    }
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {step === 2 && isEnterprise && (
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary sm:text-3xl">
              Solicita tu cotización
            </h1>
            <p className="mt-2 text-muted-foreground">
              Cuéntanos sobre tu operación y nuestro equipo te contactará con una propuesta a medida.
            </p>
            <div className="mt-6 grid gap-5">
              <Field label="Empresa" id="company" error={errors.company}>
                <input
                  id="company"
                  className={inputClass}
                  placeholder="Nombre de la empresa"
                  value={quote.company}
                  onChange={(e) => setQuote({ ...quote, company: e.target.value })}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Tu nombre" id="qname" error={errors.name}>
                  <input
                    id="qname"
                    className={inputClass}
                    placeholder="Nombre y apellido"
                    value={quote.name}
                    onChange={(e) => setQuote({ ...quote, name: e.target.value })}
                  />
                </Field>
                <Field label="Teléfono" id="phone">
                  <input
                    id="phone"
                    className={inputClass}
                    placeholder="Opcional"
                    value={quote.phone}
                    onChange={(e) => setQuote({ ...quote, phone: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Correo electrónico" id="qemail" error={errors.email}>
                <input
                  id="qemail"
                  type="email"
                  className={inputClass}
                  placeholder="tu@empresa.com"
                  value={quote.email}
                  onChange={(e) => setQuote({ ...quote, email: e.target.value })}
                />
              </Field>
              <Field label="Cuéntanos sobre tu laboratorio" id="message">
                <textarea
                  id="message"
                  rows={4}
                  className={cn(inputClass, 'h-auto py-3')}
                  placeholder="Número de sedes, volumen de trabajos, integraciones necesarias..."
                  value={quote.message}
                  onChange={(e) => setQuote({ ...quote, message: e.target.value })}
                />
              </Field>
            </div>
          </div>
        )}

        {/* STEP 3 — success */}
        {step === 3 && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-accent/15">
              <CheckCircle2 className="size-9 text-accent" />
            </div>
            <h1 className="mt-6 font-heading text-2xl font-bold text-primary sm:text-3xl">
              {isEnterprise ? '¡Solicitud enviada!' : '¡Bienvenido a DentCore!'}
            </h1>
            <p className="mt-3 max-w-md text-muted-foreground">
              {isEnterprise
                ? 'Recibimos tu solicitud de cotización. Nuestro equipo se pondrá en contacto contigo muy pronto.'
                : `Tu cuenta del plan ${plan.name} quedó lista. Enviamos un correo de confirmación a ${account.email}.`}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button render={<Link href="/" />} size="lg" className="h-12 rounded-full px-8">
                Ir al inicio
              </Button>
              {!isEnterprise && (
                <Button
                  render={<Link href="/iniciar-sesion" />}
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full px-8 text-primary"
                >
                  Iniciar sesión
                </Button>
              )}
            </div>
          </div>
        )}

        {/* nav buttons */}
        {step < 3 && (
          <div className="mt-10 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={back} className="gap-1.5 text-primary">
                <ArrowLeft className="size-4" />
                Atrás
              </Button>
            ) : (
              <Button
                render={<Link href="/" />}
                variant="ghost"
                className="gap-1.5 text-muted-foreground"
              >
                <ArrowLeft className="size-4" />
                Cancelar
              </Button>
            )}

            <Button
              onClick={next}
              disabled={submitting}
              className="group h-11 gap-2 rounded-full px-7"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  {step === 2
                    ? isEnterprise
                      ? 'Enviar solicitud'
                      : 'Confirmar'
                    : 'Continuar'}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* summary sidebar */}
      <aside className="h-fit lg:sticky lg:top-24">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-primary">Resumen</h2>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary/60 p-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-primary">Plan {plan.name}</p>
              <p className="text-xs text-muted-foreground">
                {isEnterprise ? 'Facturación personalizada' : cycle === 'monthly' ? 'Facturación mensual' : 'Facturación anual'}
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Check className="size-4 shrink-0 text-accent" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-border pt-5">
            {price !== null ? (
              <div className="flex items-end justify-between">
                <span className="text-sm text-muted-foreground">Total hoy</span>
                <div className="text-right">
                  <span className="font-heading text-2xl font-bold text-primary">
                    {formatPrice(price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{cycle === 'monthly' ? 'mes' : 'año'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precio</span>
                <span className="font-heading text-lg font-bold text-primary">A medida</span>
              </div>
            )}
            {!isEnterprise && (
              <p className="mt-2 text-xs text-muted-foreground">
                14 días de prueba gratis. Cancela cuando quieras.
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          Pago seguro y encriptado
        </p>
      </aside>
    </div>
  )
}
