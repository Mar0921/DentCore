import { PrescriptionForm } from '@/components/dentcore/solicitud/prescription-form'
import { ProductosSelector } from '@/components/dentcore/solicitud/productos-selector'

export default function NuevaSolicitudPage() {
  return (
    <div className="space-y-4">
      <PrescriptionForm />
      <ProductosSelector />
    </div>
  )
}