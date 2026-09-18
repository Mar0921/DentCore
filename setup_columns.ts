import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const sql = 'ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "registro_medico" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "historia_clinica" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "indicaciones" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "color" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "guia" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "codigo_trazabilidad" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "productos" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "piezas_enviadas" TEXT;'
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    })
    console.log('SQL endpoint status:', response.status)
    const result = await response.text()
    console.log('Result:', result.substring(0, 500))
  } catch (e) {
    console.error('Error:', e)
  }
}

main()
