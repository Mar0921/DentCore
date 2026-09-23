'use client'

import { useState } from 'react'
import { Package, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/dentcore/app-shell'
import { EmpleadosProductosClient } from '@/components/dentcore/laboratorio/empleados-productos-client'
import { DepartamentosPageClient } from '@/components/dentcore/laboratorio/departamentos-page-client'

type LaboratorioTab = 'productos' | 'departamentos'

export default function EmpleadoLaboratorioPage() {
  const [tab, setTab] = useState<LaboratorioTab>('productos')

  return (
    <AppShell sidebar="empleado">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={tab === 'productos' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setTab('productos')}
          >
            <Package className="size-4" />
            Productos
          </Button>
          <Button
            variant={tab === 'departamentos' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setTab('departamentos')}
          >
            <Building2 className="size-4" />
            Departamentos
          </Button>
        </div>

        {tab === 'productos' && <EmpleadosProductosClient />}
        {tab === 'departamentos' && <DepartamentosPageClient empleado={true} />}
      </div>
    </AppShell>
  )
}
