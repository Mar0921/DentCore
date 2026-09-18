import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { FASES_PROCESO } from './data/fases-data'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const values = FASES_PROCESO.map((f) => `('${f.nombre.replace(/'/g, "''")}', ${f.orden})`).join(', ')

const sql = `
CREATE TABLE IF NOT EXISTS "public"."fases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre" text NOT NULL,
  "orden" integer,
  "color" text,
  "descripcion" text,
  "empleado_id" uuid REFERENCES "public"."empleados" ("id") ON DELETE SET NULL,
  "laboratorio_id" uuid
);
ALTER TABLE "public"."fases" ADD COLUMN IF NOT EXISTS "empleado_id" uuid REFERENCES "public"."empleados" ("id") ON DELETE SET NULL;
ALTER TABLE "public"."fases" ADD COLUMN IF NOT EXISTS "laboratorio_id" uuid;
INSERT INTO "public"."fases" ("nombre", "orden")
SELECT * FROM (VALUES ${values}) AS v(nombre, orden)
WHERE NOT EXISTS (SELECT 1 FROM "public"."fases" WHERE nombre = v.nombre);
`

async function main() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    })
    console.log('SQL endpoint status:', response.status)
    const result = await response.text()
    console.log('Result:', result.substring(0, 500))

    const { count } = await supabase.from('fases').select('*', { count: 'exact', head: true })
    console.log('Total fases count:', count)
  } catch (e) {
    console.error('Error:', e)
  }
}

main()
