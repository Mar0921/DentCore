export interface PlantillaFicha {
  id: string
  nombre: string
  descripcion?: string
}

export const PLANTILLAS_FICHAS: PlantillaFicha[] = [
  { id: "colado-ucla", nombre: "Colado UCLA", descripcion: "Ficha técnica para estructura UCLA (colado metal-cerámica)" },
  { id: "corona-disilicato-estratificada", nombre: "Corona de Disilicato Estratificada", descripcion: "Ficha técnica para corona de disilicato de litio estratificada" },
  { id: "corona-disilicato-implante", nombre: "Corona de Disilicato sobre Implante", descripcion: "Ficha técnica para corona de disilicato sobre implante dental" },
  { id: "corona-disilicato-monolitica", nombre: "Corona de Disilicato Monolítica", descripcion: "Ficha técnica para corona de disilicato monolítica" },
  { id: "corona-zirconio-estratificada", nombre: "Corona de Zirconio Estratificada", descripcion: "Ficha técnica para corona de zirconio estratificada" },
  { id: "corona-zirconio-implante", nombre: "Corona de Zirconio sobre Implante", descripcion: "Ficha técnica para corona de zirconio sobre implante dental" },
  { id: "corona-zirconio-monolitica", nombre: "Corona de Zirconio Monolítica", descripcion: "Ficha técnica para corona de zirconio monolítica" },
  { id: "disilicato", nombre: "Disilicato", descripcion: "Ficha técnica para dispositivo de disilicato de litio" },
  { id: "incrustacion-disilicato", nombre: "Incrustación de Disilicato", descripcion: "Ficha técnica para inlay/onlay de disilicato de litio" },
  { id: "incrustacion-metal", nombre: "Incrustación de Metal", descripcion: "Ficha técnica para inlay/onlay metálico" },
  { id: "monolitica", nombre: "Monolítica", descripcion: "Ficha técnica para dispositivo monolítico" },
  { id: "nucleo-npg", nombre: "Núcleo NPG", descripcion: "Ficha técnica para núcleo de pilar protésico" },
  { id: "protesis-hibrida-all-on-four", nombre: "Prótesis Híbrida All-on-Four", descripcion: "Ficha técnica para prótesis híbrida sobre 4 implantes" },
  { id: "provisional-pmma", nombre: "Provisional PMMA", descripcion: "Ficha técnica para restauración provisional en PMMA" },
  { id: "provisional-pmma-implante", nombre: "Provisional PMMA sobre Implante", descripcion: "Ficha técnica para restauración provisional PMMA sobre implante" },
  { id: "provisional-resina-impresa", nombre: "Provisional Resina Impresa", descripcion: "Ficha técnica para restauración provisional resina impresa 3D" },
  { id: "resina", nombre: "Resina", descripcion: "Ficha técnica para dispositivo en resina" },
  { id: "ceramica-encia", nombre: "Cerámica Encia", descripcion: "Ficha técnica para cerámica sobre encía" },
  { id: "carillas-impresas-en-resina", nombre: "Carillas Impresas en Resina", descripcion: "Ficha técnica para carillas provisionales impresas en resina termocurada" },
  { id: "carilla-disilicato-monolitica", nombre: "Carilla en Disilicato Monolítica", descripcion: "Ficha técnica para carilla de disilicato de litio monolítica" },
  { id: "carilla-disilicato-estratificada", nombre: "Carilla en Disilicato Estratificada", descripcion: "Ficha técnica para carilla de disilicato de litio estratificada" },
]
