import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { email, nombre, colegio_id } = await request.json();

    if (!email || !nombre || !colegio_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (email, nombre, colegio_id)' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Modo Mock/Desarrollo si falta la clave secreta del servidor
    if (!serviceRoleKey) {
      console.warn('[API Invitar] SUPABASE_SERVICE_ROLE_KEY no encontrada. Corriendo en modo MOCK local.');
      
      const mockUserId = `mock-user-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString().slice(-4)}`;
      
      // Simular inserción en perfiles directamente
      const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { error: profileError } = await supabaseAnon
        .from('perfiles')
        .insert([{
          id: mockUserId,
          email: email,
          nombre_completo: nombre,
          colegio_id: colegio_id,
          rol: 'especialista',
          activo: true
        }]);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        mockMode: true,
        user: {
          id: mockUserId,
          email,
          nombre
        }
      });
    }

    // Modo Producción Real
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`[API Invitar] Invitando al especialista: ${email}`);

    // 1. Invitar al usuario via Supabase Auth admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: nombre
      }
    });

    if (authError) {
      console.error('[API Invitar] Error invitando usuario en auth:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUser = authData.user;

    // 2. Crear su registro en public.perfiles
    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .insert([{
        id: newUser.id,
        email: newUser.email,
        nombre_completo: nombre,
        colegio_id: colegio_id,
        rol: 'especialista',
        activo: true
      }]);

    if (profileError) {
      console.warn('[API Invitar] Error creando registro en tabla perfiles:', profileError.message);
      return NextResponse.json({ 
        success: true, 
        warning: 'El usuario fue invitado pero falló la creación del perfil.',
        user: { id: newUser.id, email: newUser.email }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        nombre
      }
    });

  } catch (err) {
    console.error('[API Invitar] Error crítico:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
