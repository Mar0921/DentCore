const {createClient}=require("@supabase/supabase-js");
const url="https://efncaahogayphxykqjak.supabase.co";
const key=process.env.SUPABASE_SERVICE_KEY;
const s=createClient(url,key);
s.from("fichas_tecnicas").insert({solicitud_id: "00000000-0000-0000-0000-000000000000", tipo:"x", nombre:"x", secciones:[]}).then(r=>{console.log(r.error?.message||"ok");});
