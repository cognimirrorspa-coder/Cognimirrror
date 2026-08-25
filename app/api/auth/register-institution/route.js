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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // ── MODO LOCAL / DESARROLLO (Si no hay serviceRoleKey) ──
    if (!serviceRoleKey) {
      console.warn('[Register Institution] SUPABASE_SERVICE_ROLE_KEY no configurada. Ejecutando registro en modo local.');
      const mockColegioId = `colegio-${Math.random().toString(36).substring(2, 9)}`;
      const mockUserId = `user-${Math.random().toString(36).substring(2, 9)}`;

      const supabaseAnon = createClient(supabaseUrl, anonKey);
      
      // Insertar colegio
      await supabaseAnon.from('colegios').insert([{
        id: mockColegioId,
        nombre: schoolName.trim(),
        rbd: rbd.trim(),
        comuna: comuna.trim(),
        region: region.trim()
      }]).catch(() => {});

      // Insertar perfil
      await supabaseAnon.from('perfiles').insert([{
        id: mockUserId,
        colegio_id: mockColegioId,
        email: email.trim().toLowerCase(),
        nombre_completo: adminName.trim(),
        rol: role,
        cargo_texto: cargo.trim(),
        activo: true
      }]).catch(() => {});

      return NextResponse.json({
        success: true,
        mockMode: true,
        colegio: { id: mockColegioId, nombre: schoolName, rbd },
        user: { id: mockUserId, email, nombre_completo: adminName, rol: role }
      });
    }

    // ── MODO PRODUCCIÓN REAL CON SUPABASE SERVICE ROLE ──
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Verificar si el RBD ya existe
    const { data: existingSchool, error: checkError } = await supabaseAdmin
      .from('colegios')
      .select('id, nombre, rbd')
      .eq('rbd', rbd.trim())
      .maybeSingle();

    if (existingSchool) {
      return NextResponse.json(
        { error: `El colegio con RBD "${rbd}" ya se encuentra registrado (${existingSchool.nombre}). Si eres parte de este equipo, solicita una invitación a tu Director.` },
        { status: 409 }
      );
    }

    // 2. Crear la Institución (Colegio / Tenant)
    const { data: newSchool, error: schoolError } = await supabaseAdmin
      .from('colegios')
      .insert([{
        nombre: schoolName.trim(),
        rbd: rbd.trim(),
        comuna: comuna.trim(),
        region: region.trim()
      }])
      .select()
      .single();

    if (schoolError || !newSchool) {
      console.error('[Register Institution] Error al crear colegio:', schoolError?.message);
      return NextResponse.json(
        { error: 'Error al registrar la institución: ' + (schoolError?.message || 'No se pudo crear el registro.') },
        { status: 500 }
      );
    }

    const colegioId = newSchool.id;
    console.log(`[Register Institution] Colegio registrado: ${newSchool.nombre} (ID: ${colegioId})`);

    // 3. Crear el Usuario Administrador en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: adminName.trim(),
        colegio_id: colegioId,
        rol: role
      }
    });

    if (authError || !authData?.user) {
      console.error('[Register Institution] Error al crear usuario auth:', authError?.message);
      // Revertir creación de colegio si falló auth
      await supabaseAdmin.from('colegios').delete().eq('id', colegioId);
      return NextResponse.json(
        { error: 'Error al crear la cuenta de acceso: ' + (authError?.message || 'Fallo de autenticación') },
        { status: 400 }
      );
    }

    const newUser = authData.user;

    // 4. Crear Perfil en la tabla public.perfiles
    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .insert([{
        id: newUser.id,
        colegio_id: colegioId,
        email: email.trim().toLowerCase(),
        nombre_completo: adminName.trim(),
        rol: role,
        cargo_texto: cargo.trim(),
        activo: true
      }]);

    if (profileError) {
      console.warn('[Register Institution] Error en tabla perfiles:', profileError.message);
    }

    // 5. Registrar Evento de Auditoría
    await supabaseAdmin.from('logs_auditoria').insert([{
      colegio_id: colegioId,
      usuario_id: newUser.id,
      usuario_nombre: adminName.trim(),
      evento: 'CREAR_USUARIO',
      detalles: {
        accion: 'Registro inicial de institución educativa',
        colegio_nombre: schoolName.trim(),
        rbd: rbd.trim(),
        rol: role
      }
    }]).catch(e => console.warn('[Register Institution] Error registrando auditoría:', e.message));

    return NextResponse.json({
      success: true,
      colegio: newSchool,
      user: {
        id: newUser.id,
        email: newUser.email,
        nombre_completo: adminName.trim(),
        rol: role
      }
    });

  } catch (err) {
    console.error('[Register Institution] Error crítico:', err);
    return NextResponse.json({ error: 'Error interno del servidor: ' + err.message }, { status: 500 });
  }
}
