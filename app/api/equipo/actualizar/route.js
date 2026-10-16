import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { user: requestingUser, errorResponse } = await authenticateApiRequest(request);
    if (errorResponse) return errorResponse;

    const { 
      userId, 
      email, 
      nombre, 
      rol = 'psicologo', 
      cargo = 'Profesional PIE',
      password = null,
      colegioId = null,
      adminName = 'Director / Administrador'
    } = await request.json();

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Se requiere ID de usuario o correo electrónico para actualizar.' },
        { status: 400 }
      );
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanNombre = nombre ? nombre.trim() : null;
    const cleanCargo = cargo ? cargo.trim() : null;
    const cleanRol = rol ? rol.toLowerCase() : null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://viqtdxvoryovilzsfhwu.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let authUser = null;
    let authUpdated = false;

    // 1. Si se configuró la Service Role Key, actualizar o crear en Supabase Auth
    if (serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Si se proporcionó una nueva contraseña, actualizarla en Auth
      if (password && password.length >= 6) {
        let targetAuthId = null;

        // Intentar actualizar directamente por userId si es un UUID válido
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
        if (isUUID) {
          const { data: updateData, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: {
              ...(cleanNombre ? { full_name: cleanNombre } : {}),
              ...(cleanRol ? { rol: cleanRol } : {}),
              ...(colegioId ? { colegio_id: colegioId } : {})
            }
          });

          if (!updateErr && updateData?.user) {
            targetAuthId = updateData.user.id;
            authUser = updateData.user;
            authUpdated = true;
          }
        }

        // Si no se pudo por UUID, buscar por email en auth.users
        if (!authUpdated && cleanEmail) {
          try {
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
            const existingAuth = listData?.users?.find(u => u.email.toLowerCase() === cleanEmail);

            if (existingAuth) {
              const { data: updateData, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingAuth.id, {
                password,
                email_confirm: true,
                user_metadata: {
                  ...(cleanNombre ? { full_name: cleanNombre } : {}),
                  ...(cleanRol ? { rol: cleanRol } : {}),
                  ...(colegioId ? { colegio_id: colegioId } : {})
                }
              });

              if (!updateErr && updateData?.user) {
                targetAuthId = updateData.user.id;
                authUser = updateData.user;
                authUpdated = true;
              }
            } else {
              // Si no existe en Auth, crearlo formalmente con la contraseña indicada
              const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                email: cleanEmail,
                password,
                email_confirm: true,
                user_metadata: {
                  full_name: cleanNombre || cleanEmail,
                  colegio_id: colegioId,
                  rol: cleanRol
                }
              });

              if (!createErr && createData?.user) {
                targetAuthId = createData.user.id;
                authUser = createData.user;
                authUpdated = true;
              }
            }
          } catch (listErr) {
            console.warn('[API Actualizar] Error buscando usuario por email:', listErr.message);
          }
        }
      }

      // 2. Actualizar registro en public.perfiles
      const updatePayload = {};
      if (cleanNombre) updatePayload.nombre_completo = cleanNombre;
      if (cleanRol) updatePayload.rol = cleanRol;
      if (cleanCargo) updatePayload.cargo_texto = cleanCargo;
      if (cleanEmail) updatePayload.email = cleanEmail;

      let profileUpdated = false;
      if (userId) {
        const { error: pErr } = await supabaseAdmin
          .from('perfiles')
          .update(updatePayload)
          .eq('id', userId);
        if (!pErr) profileUpdated = true;
      }

      if (!profileUpdated && cleanEmail) {
        await supabaseAdmin
          .from('perfiles')
          .update(updatePayload)
          .eq('email', cleanEmail);
      }

      // 3. Registrar auditoría
      if (colegioId) {
        try {
          await supabaseAdmin.from('logs_auditoria').insert([{
            colegio_id: colegioId,
            usuario_nombre: adminName,
            evento: 'EDITAR_USUARIO',
            detalles: {
              accion: 'Modificación de usuario / contraseña por administración',
              profesional_nombre: cleanNombre,
              profesional_email: cleanEmail,
              rol: cleanRol,
              password_actualizada: Boolean(password)
            }
          }]);
        } catch (e) {}
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario y credenciales actualizados exitosamente en Supabase.',
        authUpdated,
        userId: authUser?.id || userId
      });
    }

    // Modo Fallback si falta SUPABASE_SERVICE_ROLE_KEY
    // Intentar al menos actualizar en public.perfiles con anonKey
    const supabaseAnon = createClient(supabaseUrl, anonKey);
    const updatePayload = {};
    if (cleanNombre) updatePayload.nombre_completo = cleanNombre;
    if (cleanRol) updatePayload.rol = cleanRol;
    if (cleanCargo) updatePayload.cargo_texto = cleanCargo;
    if (cleanEmail) updatePayload.email = cleanEmail;

    if (userId) {
      await supabaseAnon.from('perfiles').update(updatePayload).eq('id', userId);
    } else if (cleanEmail) {
      await supabaseAnon.from('perfiles').update(updatePayload).eq('email', cleanEmail);
    }

    return NextResponse.json({
      success: true,
      warning: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en Vercel. La contraseña en Auth solo puede ser gestionada directamente si se configura esta variable de servidor.',
      profileUpdated: true
    });

  } catch (err) {
    console.error('[API Actualizar] Error crítico:', err);
    return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
  }
}
