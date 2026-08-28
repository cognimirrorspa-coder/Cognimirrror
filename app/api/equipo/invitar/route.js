import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { 
      email, 
      nombre, 
      colegio_id, 
      rol = 'psicologo', 
      cargo = 'Profesional PIE',
      tempPassword = null,
      adminName = 'Director / Coordinador' 
    } = await request.json();

    if (!email || !nombre || !colegio_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (email, nombre, colegio_id)' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://viqtdxvoryovilzsfhwu.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Modo Mock/Desarrollo si falta la clave secreta del servidor
    if (!serviceRoleKey) {
      console.warn('[API Invitar] SUPABASE_SERVICE_ROLE_KEY no encontrada. Corriendo en modo MOCK local.');
      const mockUserId = `mock-user-${Math.random().toString(36).substring(2, 9)}`;
      
      const supabaseAnon = createClient(supabaseUrl, anonKey);
      try {
        await supabaseAnon
          .from('perfiles')
          .insert([{
            id: mockUserId,
            email: email.trim().toLowerCase(),
            nombre_completo: nombre.trim(),
            colegio_id: colegio_id,
            institucion_id: colegio_id,
            rol: rol.toLowerCase(),
            cargo_texto: cargo.trim(),
            activo: true
          }]);
      } catch (err) {}

      // Registrar auditoría mock
      try {
        await supabaseAnon.from('logs_auditoria').insert([{
          colegio_id: colegio_id,
          usuario_nombre: adminName,
          evento: 'CREAR_USUARIO',
          detalles: {
            profesional_nombre: nombre,
            profesional_email: email,
            rol: rol,
            cargo: cargo
          }
        }]);
      } catch (err) {}

      return NextResponse.json({
        success: true,
        mockMode: true,
        user: {
          id: mockUserId,
          email,
          nombre,
          rol,
          cargo
        }
      });
    }

    // Modo Producción Real
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log(`[API Invitar] Creando/invitando profesional: ${email} (${rol}) para colegio ${colegio_id}`);

    let authUser = null;
    if (tempPassword && tempPassword.length >= 6) {
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: nombre.trim(),
          colegio_id: colegio_id,
          rol: rol.toLowerCase()
        }
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
      authUser = createData.user;
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
        data: {
          full_name: nombre.trim(),
          colegio_id: colegio_id,
          rol: rol.toLowerCase()
        }
      });

      if (authError) {
        console.error('[API Invitar] Error invitando usuario en auth:', authError.message);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
      authUser = authData.user;
    }

    // 2. Crear o actualizar su registro en public.perfiles
    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .upsert([{
        id: authUser.id,
        email: email.trim().toLowerCase(),
        nombre_completo: nombre.trim(),
        colegio_id: colegio_id,
        institucion_id: colegio_id,
        rol: rol.toLowerCase(),
        cargo_texto: cargo.trim(),
        activo: true
      }]);

    if (profileError) {
      console.warn('[API Invitar] Error creando registro en tabla perfiles:', profileError.message);
    }

    // 3. Registrar Evento de Auditoría
    try {
      await supabaseAdmin.from('logs_auditoria').insert([{
        colegio_id: colegio_id,
        usuario_nombre: adminName,
        evento: 'CREAR_USUARIO',
        detalles: {
          profesional_nombre: nombre.trim(),
          profesional_email: email.trim().toLowerCase(),
          rol: rol,
          cargo: cargo
        }
      }]);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        nombre: nombre.trim(),
        rol: rol,
        cargo: cargo
      }
    });

  } catch (err) {
    console.error('[API Invitar] Error crítico:', err);
    return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
  }
}
