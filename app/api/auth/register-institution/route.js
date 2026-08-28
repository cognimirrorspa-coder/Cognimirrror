import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { 
      schoolName, 
      rbd, 
      comuna = 'Santiago', 
      region = 'Metropolitana', 
      adminName, 
      email, 
      password, 
      role = 'director',
      cargo = 'Director(a) / Coordinador(a)' 
    } = await request.json();

    if (!schoolName || !rbd || !adminName || !email || !password) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (Nombre de Colegio, RBD, Nombre del Director/Coordinador, Email, Contraseña)' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://viqtdxvoryovilzsfhwu.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // Cliente para operaciones públicas / anónimas
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey || anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const newColegioId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    console.log(`[Register Institution] Registrando colegio: ${schoolName} (RBD: ${rbd})`);

    // 1. Insertar Institución / Colegio en Supabase BD 2
    try {
      // Intentar en tabla 'instituciones'
      await supabaseClient.from('instituciones').insert([{
        id: newColegioId,
        nombre: schoolName.trim(),
        rbd: rbd.trim(),
        comuna: comuna.trim(),
        region: region.trim(),
        email: email.trim().toLowerCase(),
        contacto_nombre: adminName.trim(),
        activo: true
      }]);
    } catch (e) {
      console.warn('[Register Institution] Aviso instituciones:', e.message);
    }

    // Intentar también en tabla 'colegios' para total compatibilidad
    try {
      await supabaseClient.from('colegios').insert([{
        id: newColegioId,
        nombre: schoolName.trim(),
        rbd: rbd.trim(),
        comuna: comuna.trim(),
        region: region.trim()
      }]);
    } catch (e) {
      // Ignorar si la tabla colegios no existe
    }

    // 2. Insertar Perfil en tabla 'perfiles'
    try {
      await supabaseClient.from('perfiles').insert([{
        id: newUserId,
        email: email.trim().toLowerCase(),
        nombre_completo: adminName.trim(),
        rol: role,
        institucion_id: newColegioId,
        colegio_id: newColegioId,
        cargo_texto: cargo.trim(),
        activo: true
      }]);
    } catch (e) {
      console.warn('[Register Institution] Aviso perfiles:', e.message);
    }

    // 3. Registrar en trazabilidad / auditoría
    try {
      await supabaseClient.from('trazabilidad_auditoria').insert([{
        usuario_id: newUserId,
        institucion_id: newColegioId,
        accion: 'REGISTRO_INSTITUCION',
        modulo: 'Auth',
        detalles: {
          colegio_nombre: schoolName.trim(),
          rbd: rbd.trim(),
          director_nombre: adminName.trim(),
          email: email.trim()
        }
      }]);
    } catch (e) {
      // Fallback a logs_auditoria
      try {
        await supabaseClient.from('logs_auditoria').insert([{
          colegio_id: newColegioId,
          usuario_id: newUserId,
          usuario_nombre: adminName.trim(),
          evento: 'CREAR_USUARIO',
          detalles: {
            accion: 'Registro inicial de institución educativa',
            colegio_nombre: schoolName.trim(),
            rbd: rbd.trim(),
            rol: role
          }
        }]);
      } catch (err) {}
    }

    return NextResponse.json({
      success: true,
      colegio: { 
        id: newColegioId, 
        nombre: schoolName.trim(), 
        rbd: rbd.trim(),
        comuna: comuna.trim() 
      },
      user: { 
        id: newUserId, 
        email: email.trim().toLowerCase(), 
        nombre_completo: adminName.trim(), 
        rol: role,
        institucion_id: newColegioId,
        colegio_id: newColegioId
      }
    });

  } catch (err) {
    console.error('[Register Institution] Error crítico:', err);
    return NextResponse.json({ error: 'Error interno del servidor: ' + err.message }, { status: 500 });
  }
}
