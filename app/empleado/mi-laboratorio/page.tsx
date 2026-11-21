'use client'

import { useState } from 'react'
import { Package, Building2, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/dentcore/app-shell'
import { EmpleadosProductosClient } from '@/components/dentcore/laboratorio/empleados-productos-client'
import { DepartamentosPageClient } from '@/components/dentcore/laboratorio/departamentos-page-client'
import { MaterialesPageClient } from '@/components/dentcore/laboratorio/materiales-page-client'

type LaboratorioTab = 'productos' | 'departamentos' | 'materiales'

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
          <Button
            variant={tab === 'materiales' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setTab('materiales')}
          >
            <ClipboardList className="size-4" />
            Materiales
          </Button>
        </div>

        {tab === 'productos' && <EmpleadosProductosClient />}
        {tab === 'departamentos' && <DepartamentosPageClient empleado={true} />}
        {tab === 'materiales' && <MaterialesPageClient empleado={true} />}
      </div>
    </AppShell>
  )
}
