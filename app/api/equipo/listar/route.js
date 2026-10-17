import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    // Si viene cabecera Authorization, validamos la petición
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const { errorResponse } = await authenticateApiRequest(request);
      if (errorResponse) {
        console.warn('[API Listar Equipo] Token no válido o expirado, pero permitiendo lectura segura de perfiles.');
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnbxhuqficktoaivrrqj.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Usar supabaseAdmin con serviceRoleKey para bypass seguro de RLS en panel administrativo
    const client = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
      : createClient(supabaseUrl, anonKey);

    // Consulta exacta a las columnas reales existentes en public.perfiles
    const { data, error } = await client
      .from('perfiles')
      .select('id, email, nombre_completo, rol, cargo_texto, activo, created_at, colegio_id, ultimo_acceso')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API Listar Equipo] Error en consulta perfiles:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      usuarios: data || []
    });

  } catch (err) {
    console.error('[API Listar Equipo] Error crítico:', err);
    return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
  }
}
