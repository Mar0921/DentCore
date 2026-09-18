import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Doctores/Clientes | DentCore',
  description: 'Listado de clientes y odontólogos registrados en el laboratorio.',
}

export default async function DoctoresPage() {
  let clientes: any[] | null = null
  let error: { message: string } | null = null

  try {
    const res = await supabase
      .from('cliente')
      .select('*')
      .order('created_at', { ascending: false })
    clientes = res.data
    if (res.error) error = { message: res.error.message }
  } catch (e: any) {
    error = { message: e.message || 'Error inesperado' }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Doctores/as</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de odontólogos y clientes registrados
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clientes registrados</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Listado de todos los clientes registrados en el laboratorio
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p className="px-6 py-4 text-sm text-destructive">
              Error al cargar los clientes: {error.message}
            </p>
          ) : !clientes || clientes.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No hay clientes registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Teléfono</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Clínica</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Localidad</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-center">
                      ¿Tiene acceso?
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clientes.map((c: any) => (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-secondary/30"
                    >
                      <td className="px-4 py-4 font-medium text-primary">
                        {c.nombre || '-'}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {c.email || '-'}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {c.telefono || '-'}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {c.clinica || '-'}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {c.localidad || '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            c.tiene_acceso
                              ? 'bg-accent/15 text-accent'
                              : 'bg-destructive/10 text-destructive',
                          )}
                        >
                          {c.tiene_acceso ? '✓' : '×'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
