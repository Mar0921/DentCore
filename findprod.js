const {createClient}=require('@supabase/supabase-js');
const s=createClient('https://efncaahogayphxykqjak.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbmNhYWhvZ2F5cGh4eWtxamFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTE2MzM2OSwiZXhwIjoyMTA0NzM5MzY5fQ.67DXY1q7aSjL4zr3zegBzJIAWK-JmL5U9kjkpj00keE');
async function run(){
  const {data} = await s.from('productos').select('id,titulo,nombre').eq('laboratorio_id','529a60ef-38ce-47cc-b925-72dd7e4db810');
  const solProd = 'CARILLA ZIRCONIO x2 (11,12) a .00; CORONA ZIR IMPLANTO SOPORTADA (CON UCLA CALCINABLE) x1 (27) a .00'.toLowerCase();
  const ids = data.filter(p=>solProd.includes((p.titulo||p.nombre||'').toLowerCase())).map(p=>p.id);
  console.log(ids);
}
run();
