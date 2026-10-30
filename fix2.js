const {createClient}=require("@supabase/supabase-js");
const url="https://efncaahogayphxykqjak.supabase.co";
const key=process.env.SUPABASE_SERVICE_KEY;
const s=createClient(url,key);
s.from("fichas_tecnicas").select("nombre").limit(1).then(r=>{console.log(r.error?.message||"ok");});
