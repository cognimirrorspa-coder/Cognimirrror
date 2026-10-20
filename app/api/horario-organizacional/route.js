import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnbxhuqficktoaivrrqj.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return createClient(supabaseUrl, anonKey);
}

// Formatear tarea de BD (snake_case) a formato frontend (camelCase)
function mapDbTaskToFrontend(row) {
  return {
    id: row.id,
    title: row.title || '',
    project: row.project || '',
    status: row.status || 'in_progress',
    priority: row.priority || 'Medium',
    progress: Number(row.progress) || 0,
    dueDate: row.due_date || '',
    completedAt: row.completed_at || null,
    assignees: Array.isArray(row.assignees) ? row.assignees : [],
    effort: row.effort || '1 Bloque libre (1.5 hrs)',
    scheduledDays: Array.isArray(row.scheduled_days) ? row.scheduled_days : [],
    scheduledSlot: row.scheduled_slot || '10:00 - 11:30',
    dependency: row.dependency || '',
    description: row.description || '',
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    commentsCount: Number(row.comments_count) || 0,
    attachmentsCount: Number(row.attachments_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Formatear tarea de frontend a BD (snake_case)
function mapFrontendTaskToDb(task, colegioId = null) {
  return {
    id: String(task.id),
    colegio_id: colegioId,
    title: task.title || 'Nueva Tarea',
    project: task.project || '',
    status: task.status || 'in_progress',
    priority: task.priority || 'Medium',
    progress: Number(task.progress) || 0,
    due_date: task.dueDate || '',
    completed_at: task.completedAt || null,
    assignees: Array.isArray(task.assignees) ? task.assignees : [],
    effort: task.effort || '1 Bloque libre (1.5 hrs)',
    scheduled_days: Array.isArray(task.scheduledDays) ? task.scheduledDays : [],
    scheduled_slot: task.scheduledSlot || '10:00 - 11:30',
    dependency: task.dependency || '',
    description: task.description || '',
    checklist: Array.isArray(task.checklist) ? task.checklist : [],
    comments_count: Number(task.commentsCount) || 0,
    attachments_count: Number(task.attachmentsCount) || 0,
    updated_at: new Date().toISOString()
  };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const colegioId = searchParams.get('colegio_id');

    // 1. Consultar tareas
    let queryTasks = supabase
      .from('organizacional_tareas')
      .select('*')
      .order('created_at', { ascending: true });

    if (colegioId) {
      queryTasks = queryTasks.or(`colegio_id.eq.${colegioId},colegio_id.is.null`);
    }

    const { data: dbTasks, error: errTasks } = await queryTasks;

    // Si la tabla aún no existe en Supabase (error 42P01)
    if (errTasks) {
      if (errTasks.code === '42P01' || errTasks.message?.includes('does not exist') || errTasks.message?.includes('schema cache')) {
        return NextResponse.json({
          success: true,
          notConfigured: true,
          tasks: null,
          availability: null,
          categories: null,
          message: 'La tabla organizacional_tareas aún no ha sido creada en Supabase.'
        });
      }
      console.warn('[API Horario] Error al consultar tareas:', errTasks.message);
      return NextResponse.json({ error: errTasks.message }, { status: 400 });
    }

    // 2. Consultar configuración (disponibilidad y categorías)
    const { data: configData } = await supabase
      .from('organizacional_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    const formattedTasks = (dbTasks || []).map(mapDbTaskToFrontend);

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      availability: configData?.availability || null,
      categories: configData?.categories || null,
      isLiveSupabase: true
    });

  } catch (err) {
    console.error('[API Horario] Error en GET:', err);
    return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { action = 'sync_all', colegioId = null } = body;

    // ACCIÓN 1: Guardar o actualizar una sola tarea
    if (action === 'save_task') {
      const { task } = body;
      if (!task || !task.id) {
        return NextResponse.json({ error: 'Falta la tarea o su ID' }, { status: 400 });
      }

      const dbPayload = mapFrontendTaskToDb(task, colegioId);
      const { error } = await supabase
        .from('organizacional_tareas')
        .upsert(dbPayload, { onConflict: 'id' });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ notConfigured: true, success: false });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, task: mapDbTaskToFrontend(dbPayload) });
    }

    // ACCIÓN 2: Eliminar una sola tarea
    if (action === 'delete_task') {
      const { taskId } = body;
      if (!taskId) {
        return NextResponse.json({ error: 'Falta taskId' }, { status: 400 });
      }

      const { error } = await supabase
        .from('organizacional_tareas')
        .delete()
        .eq('id', String(taskId));

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        return NextResponse.json({ notConfigured: true, success: false });
      }

      return NextResponse.json({ success: true, deletedId: taskId });
    }

    // ACCIÓN 3: Guardar disponibilidad horaria semanal
    if (action === 'save_availability') {
      const { availability } = body;
      const { error } = await supabase
        .from('organizacional_config')
        .upsert({
          id: 'default',
          colegio_id: colegioId,
          availability: availability || {},
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        return NextResponse.json({ notConfigured: true, success: false });
      }

      return NextResponse.json({ success: true });
    }

    // ACCIÓN 4: Guardar categorías dinámicas
    if (action === 'save_categories') {
      const { categories } = body;
      const { error } = await supabase
        .from('organizacional_config')
        .upsert({
          id: 'default',
          colegio_id: colegioId,
          categories: categories || [],
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        return NextResponse.json({ notConfigured: true, success: false });
      }

      return NextResponse.json({ success: true });
    }

    // ACCIÓN 5: Sincronización completa (sync_all)
    if (action === 'sync_all') {
      const { tasks, availability, categories } = body;

      if (Array.isArray(tasks) && tasks.length > 0) {
        const rows = tasks.map(t => mapFrontendTaskToDb(t, colegioId));
        await supabase
          .from('organizacional_tareas')
          .upsert(rows, { onConflict: 'id' });
      }

      if (availability || categories) {
        const configPayload = {
          id: 'default',
          colegio_id: colegioId,
          updated_at: new Date().toISOString()
        };
        if (availability) configPayload.availability = availability;
        if (categories) configPayload.categories = categories;

        await supabase
          .from('organizacional_config')
          .upsert(configPayload, { onConflict: 'id' });
      }

      return NextResponse.json({ success: true, synced: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });

  } catch (err) {
    console.error('[API Horario] Error en POST:', err);
    return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
  }
}
