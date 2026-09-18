const https = require('https');
require('dotenv').config({ path: '.env.local' });

const projectId = 'efncaahogayphxykqjak';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// The SQL to add columns
const sql = 'ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "registro_medico" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "historia_clinica" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "indicaciones" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "color" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "guia" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "codigo_trazabilidad" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "productos" TEXT; ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "piezas_enviadas" TEXT;';

const postData = JSON.stringify({ query: sql });

// Try the PostgREST /rest/v1/ endpoint - some Supabase projects have a SQL runner
// Let's try using the supabase edge functions endpoint
const options = {
  hostname: 'efncaahogayphxykqjak.supabase.co',
  port: 443,
  path: `/rest/v1/rpc/pg_execute`,
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log('pg_execute Status:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body.substring(0, 500)));
});

req.on('error', (e) => console.log('Error:', e.message));
req.write(postData);
req.end();
