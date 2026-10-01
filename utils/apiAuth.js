import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Valida la autenticación de una petición a la API de Next.js mediante el token de Supabase.
 * @param {Request} request 
 * @returns {Promise<{ user: object|null, errorResponse: NextResponse|null }>}
 */
export async function authenticateApiRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Clave secreta de servicio para llamadas internas seguras (ej. cron jobs o servidor)
  const internalSecret = request.headers.get('x-internal-secret');
  if (internalSecret && process.env.SUPABASE_SERVICE_ROLE_KEY && internalSecret === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      user: { id: 'service-role-system', email: 'system@cognimirror.cl', rol: 'founder' },
      errorResponse: null
    };
  }

  if (!token) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere cabecera Authorization: Bearer <token>' },
        { status: 401 }
      )
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Configuración de servidor incompleta.' },
        { status: 500 }
      )
    };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false }
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Token de sesión inválido o expirado. Inicie sesión nuevamente.' },
        { status: 401 }
      )
    };
  }

  return { user, errorResponse: null };
}
