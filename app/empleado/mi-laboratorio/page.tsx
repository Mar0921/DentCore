import { AppShell } from '@/components/dentcore/app-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function EmpleadoLaboratorioPage() {
  return (
    <AppShell sidebar="empleado">
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Laboratorio</h1>
          <p className="text-sm text-muted-foreground">Información general del laboratorio</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">En construcción</CardTitle>
            <CardDescription>Esta sección estará disponible próximamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aquí podrás consultar la información del laboratorio, recursos y configuración disponible para empleados.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
