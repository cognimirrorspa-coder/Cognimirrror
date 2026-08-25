import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let specialistId = searchParams.get('id');
    let colegioId = searchParams.get('colegio_id');
    let adminName = searchParams.get('admin') || 'Director / Coordinador';

    if (!specialistId) {
      try {
        const body = await request.json();
        specialistId = body.id;
        colegioId = body.colegio_id || colegioId;
        adminName = body.admin || adminName;
      } catch (e) {
        // Ignorar
      }
    }

    if (!specialistId) {
      return NextResponse.json(
        { error: 'Falta el ID del profesional a eliminar' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Modo Mock/Desarrollo si falta la clave secreta del servidor
    if (!serviceRoleKey || specialistId.startsWith('mock-')) {
      console.warn(`[API Eliminar] Ejecutando en modo MOCK local para profesional ID: ${specialistId}`);
      
      const supabaseAnon = createClient(supabaseUrl, anonKey);
      await supabaseAnon
        .from('perfiles')
        .delete()
        .eq('id', specialistId);

      if (colegioId) {
        await supabaseAnon.from('logs_auditoria').insert([{
          colegio_id: colegioId,
          usuario_nombre: adminName,
          evento: 'DESACTIVAR_USUARIO',
          detalles: { accion: 'Desvinculación definitiva de cuenta', usuario_id: specialistId }
        }]).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        mockMode: true,
        message: 'Profesional desvinculado correctamente.'
      });
    }

    // Modo Producción Real
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Obtener datos antes de eliminar para el log
    const { data: userToDelete } = await supabaseAdmin
      .from('perfiles')
      .select('nombre_completo, email, colegio_id')
      .eq('id', specialistId)
      .maybeSingle();

    const targetColegioId = colegioId || userToDelete?.colegio_id;

    // 2. Eliminar de public.perfiles
    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .delete()
      .eq('id', specialistId);

    if (profileError) {
      console.error('[API Eliminar] Error eliminando perfil:', profileError.message);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Eliminar de Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(specialistId).catch(err => {
      console.warn('[API Eliminar] Advertencia al eliminar en Auth:', err.message);
    });

    // 4. Registrar en Auditoría
    if (targetColegioId) {
      await supabaseAdmin.from('logs_auditoria').insert([{
        colegio_id: targetColegioId,
        usuario_nombre: adminName,
        evento: 'DESACTIVAR_USUARIO',
        detalles: {
          accion: 'Desvinculación y eliminación de profesional del colegio',
          profesional_nombre: userToDelete?.nombre_completo || specialistId,
          profesional_email: userToDelete?.email || ''
        }
      }]).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Profesional desvinculado permanentemente del sistema.'
    });

  } catch (err) {
    console.error('[API Eliminar] Error crítico:', err);
    return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
  }
}
