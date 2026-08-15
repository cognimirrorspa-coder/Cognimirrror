import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(request) {
  try {
    // Intentar leer de la query string o del cuerpo del mensaje
    const { searchParams } = new URL(request.url);
    let specialistId = searchParams.get('id');

    if (!specialistId) {
      try {
        const body = await request.json();
        specialistId = body.id;
      } catch (e) {
        // Ignorar
      }
    }

    if (!specialistId) {
      return NextResponse.json(
        { error: 'Falta el ID del especialista a eliminar' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Modo Mock/Desarrollo si falta la clave secreta del servidor
    if (!serviceRoleKey || specialistId.startsWith('mock-')) {
      console.warn(`[API Eliminar] Ejecutando en modo MOCK local para especialista ID: ${specialistId}`);
      
      const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      // Eliminar de perfiles directamente
      const { error: profileError } = await supabaseAnon
        .from('perfiles')
        .delete()
        .eq('id', specialistId);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        mockMode: true,
        message: 'Especialista eliminado correctamente de la base de datos (Mock Mode).'
      });
    }

    // Modo Producción Real
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`[API Eliminar] Eliminando especialista ID: ${specialistId}`);

    // 1. Eliminar de public.perfiles
    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .delete()
      .eq('id', specialistId);

    if (profileError) {
      console.error('[API Eliminar] Error eliminando perfil de especialista:', profileError.message);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 2. Eliminar de Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(specialistId);

    if (authError) {
      console.warn('[API Eliminar] El perfil fue eliminado, pero falló la revocación de acceso en Auth:', authError.message);
      // Retornar éxito parcial ya que el perfil fue eliminado y ya no pertenece al colegio
      return NextResponse.json({
        success: true,
        warning: 'El perfil fue eliminado, pero falló la desactivación completa en Supabase Auth: ' + authError.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Especialista eliminado permanentemente del sistema.'
    });

  } catch (err) {
    console.error('[API Eliminar] Error crítico:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
