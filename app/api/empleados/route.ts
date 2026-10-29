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
    const { laboratorio_id, nombre, email, contraseña, rol, departamento, departamento_id, telefono, activo } = body;

    if (!laboratorio_id || !nombre?.trim() || !email?.trim() || !contraseña || contraseña.length < 6) {
      return NextResponse.json({ error: "Datos incompletos o contraseña inválida." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: contraseña,
      email_confirm: true,
      user_metadata: { nombre: nombre.trim() },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "No se pudo crear el usuario de autenticación." }, { status: 400 });
    }

    const { data: empData, error: empError } = await admin.from("empleados").insert({
      laboratorio_id,
      nombre: nombre.trim(),
      email: cleanEmail,
      rol: rol || "tecnico",
      departamento: departamento || null,
      departamento_id: departamento_id || null,
      telefono: telefono || null,
      activo: activo ?? true,
    }).select().single();

    if (empError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: empError.message || "No se pudo crear el empleado." }, { status: 400 });
    }

    return NextResponse.json({ success: true, empleado: empData }, { status: 201 });
  } catch (error: any) {
    console.error("Error en /api/empleados:", error);
    return NextResponse.json({ error: error?.message || "Error interno." }, { status: 500 });
  }
}
