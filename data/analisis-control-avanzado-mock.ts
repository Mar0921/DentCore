import type { AnalisisControlAvanzadoData } from '@/types/analisis-control-avanzado'

export const analisisControlAvanzado: AnalisisControlAvanzadoData = {
  trimestres: [
    {
      trimestre: '1.er trimestre',
      ventasSinImpuestos: 12000,
      comprasSinImpuestos: 8000,
      gastosIva: 3200,
    },
    {
      trimestre: '2.º trimestre',
      ventasSinImpuestos: 15000,
      comprasSinImpuestos: 9000,
      gastosIva: 3900,
    },
    {
      trimestre: '3.er trimestre',
      ventasSinImpuestos: 18000,
      comprasSinImpuestos: 10000,
      gastosIva: 4400,
    },
  ],
  totalAnual: {
    ventasSinImpuestos: 45000,
    comprasSinImpuestos: 27000,
    gastosIva: 11500,
  },
  productos: [
    { producto: 'Coronas', ventas: 18000, coste: 9000, margen: 9000 },
    { producto: 'Puentes', ventas: 14000, coste: 8400, margen: 5600 },
    { producto: 'Implantes', ventas: 12000, coste: 7200, margen: 4800 },
    { producto: 'Ortodoncia', ventas: 10000, coste: 6000, margen: 4000 },
  ],
  clientes: [
    { estado: 'Nuevos', cantidad: 45 },
    { estado: 'Recuperados', cantidad: 12 },
    { estado: 'Activos', cantidad: 380 },
    { estado: 'En descenso', cantidad: 28 },
    { estado: 'Perdidos', cantidad: 18 },
    { estado: 'Inactivos', cantidad: 64 },
  ],
  costosProduccion: [
    { concepto: 'Materiales', total: 14500 },
    { concepto: 'Mano de obra', total: 22000 },
    { concepto: 'Maquinaria', total: 8500 },
    { concepto: 'Logística', total: 3200 },
    { concepto: 'Calidad', total: 1800 },
  ],
}
