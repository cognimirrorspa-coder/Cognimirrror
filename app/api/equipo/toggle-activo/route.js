import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { userId, activo, colegioId, adminName = 'Director / Coordinador' } = await request.json();

    if (!userId || colegioId === undefined || activo === undefined) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (userId, activo, colegioId)' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://viqtdxvoryovilzsfhwu.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Si es mock
    if (!serviceRoleKey || userId.startsWith('mock-')) {
      const supabaseAnon = createClient(supabaseUrl, anonKey);
      try {
        await supabaseAnon
          .from('perfiles')
          .update({ activo })
          .eq('id', userId);
      } catch (e) {}

      try {
        await supabaseAnon.from('logs_auditoria').insert([{
          colegio_id: colegioId,
          usuario_nombre: adminName,
          evento: activo ? 'CREAR_USUARIO' : 'DESACTIVAR_USUARIO',
          detalles: { accion: activo ? 'Cuenta reactivada' : 'Cuenta suspendida/desactivada', usuario_id: userId }
        }]);
      } catch (e) {}

      return NextResponse.json({ success: true, activo });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Actualizar en public.perfiles
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('perfiles')
      .update({ activo })
      .eq('id', userId)
      .select('nombre_completo, email')
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 2. Registrar en auditoría
    try {
      await supabaseAdmin.from('logs_auditoria').insert([{
        colegio_id: colegioId,
        usuario_nombre: adminName,
        evento: activo ? 'CREAR_USUARIO' : 'DESACTIVAR_USUARIO',
        detalles: {
          accion: activo ? 'Cuenta reactivada por Dirección' : 'Cuenta desactivada/suspendida por Dirección',
          profesional_nombre: updatedProfile?.nombre_completo,
          profesional_email: updatedProfile?.email
        }
      }]);
    } catch (e) {}

    return NextResponse.json({ success: true, activo });

  } catch (err) {
    console.error('[API Toggle Activo] Error:', err);
    return NextResponse.json({ error: 'Error interno: ' + err.message }, { status: 500 });
  }
}
