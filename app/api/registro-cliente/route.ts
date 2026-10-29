import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env as any).SUPABASE_SERVICE_KEY!;

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await request.json();
    const { nombre, email, telefono, calle, localidad, clinica, locacion_extra, direccion_extra, password, laboratorio_id } = body;

    if (!nombre?.trim() || !email?.trim() || !password || password.length < 6) {
      return NextResponse.json({ error: "Datos incompletos o contraseña inválida." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data: labs } = await admin.from("laboratorio").select("id").limit(1);
    if (!labs || labs.length === 0) {
      return NextResponse.json({ error: "No hay laboratorio registrado." }, { status: 400 });
    }
    const labId = labs[0].id;


    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { nombre: nombre.trim() },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "No se pudo crear el usuario de autenticación." }, { status: 400 });
    }

    const { data: clienteData, error: clienteError } = await admin.from("cliente").insert({
      nombre: nombre.trim(),
      email: cleanEmail,
      telefono: telefono || null,
      calle: calle || null,
      localidad: localidad || null,
      clinica: clinica || null,
      locacion_extra: locacion_extra || null,
      direccion_extra: direccion_extra || null,
      laboratorio_id: labId,
      tiene_acceso: true,
    }).select().single();

    if (clienteError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: clienteError.message || "No se pudo crear el cliente." }, { status: 400 });
    }

    return NextResponse.json({ success: true, cliente: clienteData }, { status: 201 });
  } catch (error: any) {
    console.error("Error en /api/registro-cliente:", error);
    return NextResponse.json({ error: error?.message || "Error interno." }, { status: 500 });
  }
}
