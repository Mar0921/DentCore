const {createClient}=require("@supabase/supabase-js");
const url="https://efncaahogayphxykqjak.supabase.co";
const key=process.env.SUPABASE_SERVICE_KEY;
const s=createClient(url,key);
s.rpc('exec_sql', { sql: "ALTER TABLE public.fichas_tecnicas ADD COLUMN IF NOT EXISTS nombre TEXT;" }).then(r=>{console.log(r.error?.message||JSON.stringify(r.data));});
