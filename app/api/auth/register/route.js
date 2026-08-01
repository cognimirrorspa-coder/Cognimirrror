import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (email, password, fullName)' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Variables de entorno de administración de Supabase no configuradas en el servidor.' },
        { status: 500 }
      );
    }

    // Inicializar cliente administrativo de Supabase con service_role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`[API Register] Creando usuario administrativo en Supabase Auth: ${email}`);

    // 1. Crear el usuario en auth.users de Supabase de forma directa y confirmada
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('[API Register] Error de Supabase Auth:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUser = authData.user;
    console.log(`[API Register] Usuario creado exitosamente con UID: ${newUser.id}`);

    // 2. Insertar perfil en la tabla public.perfiles
    // Esto mantiene la compatibilidad con el resto del backend de la base de datos
    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .insert([{
        id: newUser.id,
        email: newUser.email,
        nombre_completo: fullName,
        rol: 'mecanico', // Valor compatible con el CHECK constraint del taller electromecanico
        activo: true
      }]);

    if (profileError) {
      console.warn('[API Register] No se pudo crear registro en tabla perfiles:', profileError.message);
      // No fallamos la petición porque el usuario en auth.users ya fue creado con éxito
    } else {
      console.log('[API Register] Registro en tabla perfiles creado con éxito.');
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName
      }
    });

  } catch (err) {
    console.error('[API Register] Error crítico:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
