import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env as any).SUPABASE_SERVICE_KEY!;

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const body = await request.json();
    const { laboratorio, administrador } = body;

    if (!laboratorio || !administrador) {
      return NextResponse.json(
        { error: "Datos incompletos para crear la cuenta." },
        { status: 400 }
      );
    }

    const labNombre = laboratorio.nombre?.trim();
    const labEmail = laboratorio.email?.trim().toLowerCase();
    const adminNombre = administrador.nombre?.trim();
    const adminEmail = administrador.email?.trim().toLowerCase();
    const adminPassword = administrador.password;

    if (!labNombre || !labEmail || !adminNombre || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben estar completos." },
        { status: 400 }
      );
    }

    if (adminPassword.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const { data: labData, error: labError } = await admin
      .from("laboratorio")
      .insert({
        nombre: labNombre,
        email: labEmail,
        telefono: laboratorio.telefono || null,
        direcccion: laboratorio.direccion || laboratorio.direcccion || null,
        ciudad: laboratorio.ciudad || null,
        plan: laboratorio.plan || "starter",
        logo_url: laboratorio.logo || null,
        susactivo: false,
      })
      .select()
      .single();

    if (labError || !labData) {
      return NextResponse.json(
        { error: labError?.message || "No se pudo crear el laboratorio." },
        { status: 400 }
      );
    }

    const { data: authData, error: createAuthError } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,

  user_metadata: { nombre: adminNombre },
    });

    if (createAuthError || !authData.user) {
      await admin.from("laboratorio").delete().eq("id", labData.id);
      return NextResponse.json(
        { error: createAuthError?.message || "No se pudo crear la cuenta de usuario." },
        { status: 400 }
      );
    }

    const { error: empError } = await admin.from("empleados").insert({
      laboratorio_id: labData.id,
      nombre: adminNombre,
       email: adminEmail,
      rol: "admin",
      departamento: "Administración",
      activo: true,
    });

    if (empError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      await admin.from("laboratorio").delete().eq("id", labData.id);
      return NextResponse.json(
        { error: empError.message || "No se pudo crear el perfil de administrador." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, laboratorio: labData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error en /api/suscripcion:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno al crear la cuenta." },
      { status: 500 }
    );
  }
}
