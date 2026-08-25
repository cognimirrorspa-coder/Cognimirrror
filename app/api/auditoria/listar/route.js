import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const colegioId = searchParams.get('colegio_id');

    if (!colegioId) {
      return NextResponse.json({ error: 'Falta colegio_id' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabaseClient = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : createClient(supabaseUrl, anonKey);

    const { data: logs, error } = await supabaseClient
      .from('logs_auditoria')
      .select('*')
      .eq('colegio_id', colegioId)
      .order('creado_en', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('[API Auditoria Listar] Error consultando logs:', error.message);
      return NextResponse.json({ logs: [] });
    }

    return NextResponse.json({ logs: logs || [] });

  } catch (err) {
    console.error('[API Auditoria] Error:', err);
    return NextResponse.json({ logs: [] });
  }
}
