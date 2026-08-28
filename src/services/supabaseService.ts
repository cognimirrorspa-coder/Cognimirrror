// src/services/supabaseService.ts
// Servicio Central de Integración con Supabase BD 2 (viqtdxvoryovilzsfhwu)

import { supabase } from '../data/supabase';
import { User, Patient, Therapist, Institution, GameSession, AnalysisGameSession } from '../types';

/**
 * Iniciar Sesión buscando en perfiles o instituciones de Supabase
 */
export async function loginWithSupabase(email: string, password?: string): Promise<User | null> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Buscar en tabla perfiles (Founders, Directores, Profesionales)
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (perfil && !perfilError) {
      const isFounder = perfil.rol === 'founder';
      const isDirector = perfil.rol === 'director' || perfil.rol === 'institucional';
      const mappedType = isFounder || isDirector ? 'institucional' : 'terapeuta';

      const user: User = {
        id: perfil.id,
        email: perfil.email,
        type: mappedType,
        role: perfil.rol,
        especialidad: perfil.especialidad,
        name: `${perfil.nombre} ${perfil.apellido || ''}`.trim(),
        institutionId: perfil.institucion_id || undefined,
        createdAt: new Date(perfil.creado_en || Date.now()),
      };

      // Registrar login en trazabilidad
      await registrarAuditoriaSupabase({
        usuario_id: perfil.id,
        usuario_email: perfil.email,
        usuario_rol: perfil.rol,
        institucion_id: perfil.institucion_id,
        accion: 'LOGIN',
        entidad_afectada: 'perfiles',
        entidad_id: perfil.id,
        detalles: { navegador: navigator.userAgent }
      });

      return user;
    }

    // 2. Buscar en tabla instituciones (Colegios o Centros Terapéuticos)
    const { data: inst, error: instError } = await supabase
      .from('instituciones')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (inst && !instError) {
      const user: User = {
        id: inst.id,
        email: inst.email,
        type: 'institucional',
        role: inst.tipo === 'founders' ? 'founder' : 'director',
        name: inst.nombre,
        institutionId: inst.id,
        createdAt: new Date(inst.creado_en || Date.now()),
      };

      await registrarAuditoriaSupabase({
        usuario_email: inst.email,
        usuario_rol: inst.tipo === 'founders' ? 'founder' : 'director',
        institucion_id: inst.id,
        accion: 'LOGIN_INSTITUCION',
        entidad_afectada: 'instituciones',
        entidad_id: inst.id,
        detalles: { tipo: inst.tipo }
      });

      return user;
    }

    // 3. Buscar en tabla pacientes
    const { data: pac, error: pacError } = await supabase
      .from('pacientes')
      .select('*')
      .ilike('id_sujeto', cleanEmail)
      .maybeSingle();

    if (pac && !pacError) {
      const patient: Patient = {
        id: pac.id,
        idSujeto: pac.id_sujeto,
        email: pac.id_sujeto ? `${pac.id_sujeto.toLowerCase()}@cognimirror.com` : cleanEmail,
        type: 'paciente',
        name: `${pac.nombre} ${pac.apellido || ''}`.trim(),
        parentEmails: [],
        therapistId: '',
        institutionId: pac.institucion_id,
        cursoId: pac.curso_id,
        diagnosis: pac.diagnostico_principal ? [pac.diagnostico_principal] : [],
        progress: 50,
        achievements: [],
        sessions: [],
        createdAt: new Date(pac.creado_en || Date.now())
      };
      return patient;
    }

    return null;
  } catch (error) {
    console.error('❌ Error en loginWithSupabase:', error);
    return null;
  }
}

/**
 * Registrar un nuevo usuario (Institución o Profesional) en Supabase
 */
export async function registerUserSupabase(userData: {
  name: string;
  email: string;
  type: 'institucional' | 'terapeuta';
  especialidad?: string;
  institutionId?: string;
}): Promise<User | null> {
  try {
    const cleanEmail = userData.email.trim().toLowerCase();

    if (userData.type === 'institucional') {
      const { data, error } = await supabase
        .from('instituciones')
        .insert({
          nombre: userData.name,
          email: cleanEmail,
          tipo: 'colegio',
          activo: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        name: data.nombre,
        type: 'institucional',
        role: 'director',
        institutionId: data.id,
        createdAt: new Date(data.creado_en)
      };
    } else {
      const [nombre, ...apellidos] = userData.name.split(' ');
      const { data, error } = await supabase
        .from('perfiles')
        .insert({
          email: cleanEmail,
          nombre: nombre || userData.name,
          apellido: apellidos.join(' ') || '',
          rol: 'profesional',
          especialidad: userData.especialidad || 'psicologo',
          institucion_id: userData.institutionId || 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08',
          activo: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        name: `${data.nombre} ${data.apellido || ''}`.trim(),
        type: 'terapeuta',
        role: 'profesional',
        especialidad: data.especialidad,
        institutionId: data.institucion_id,
        createdAt: new Date(data.creado_en)
      };
    }
  } catch (error) {
    console.error('❌ Error en registerUserSupabase:', error);
    return null;
  }
}

/**
 * Obtener todos los pacientes reales de Supabase
 */
export async function getPacientesFromSupabase(institucionId?: string): Promise<Patient[]> {
  try {
    let query = supabase
      .from('pacientes')
      .select('*')
      .order('creado_en', { ascending: false });

    if (institucionId && institucionId !== 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08') {
      query = query.eq('institucion_id', institucionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      idSujeto: p.id_sujeto,
      email: p.id_sujeto ? `${p.id_sujeto.toLowerCase()}@cognimirror.com` : '',
      type: 'paciente' as const,
      name: `${p.nombre} ${p.apellido || ''}`.trim() + (p.id_sujeto ? ` (${p.id_sujeto})` : ''),
      parentEmails: [],
      therapistId: '',
      institutionId: p.institucion_id,
      cursoId: p.curso_id,
      age: p.fecha_nacimiento ? Math.floor((Date.now() - new Date(p.fecha_nacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 10,
      diagnosis: p.diagnostico_principal ? [p.diagnostico_principal, ...(p.diagnosticos_secundarios || [])] : ['Evaluación Basal'],
      progress: Math.floor(Math.random() * 40) + 50, // Progreso visual
      achievements: [],
      sessions: [],
      createdAt: new Date(p.creado_en)
    }));
  } catch (error) {
    console.error('❌ Error en getPacientesFromSupabase:', error);
    return [];
  }
}

/**
 * Crear un nuevo paciente en Supabase
 */
export async function createPacienteSupabase(patientData: {
  nombre: string;
  apellido?: string;
  id_sujeto?: string;
  diagnostico_principal?: string;
  institucion_id?: string;
  curso_id?: string;
  therapistId?: string;
}): Promise<Patient | null> {
  try {
    const defaultInstId = patientData.institucion_id || 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08';

    const { data, error } = await supabase
      .from('pacientes')
      .insert({
        nombre: patientData.nombre,
        apellido: patientData.apellido || '',
        id_sujeto: patientData.id_sujeto || `S-${Date.now().toString().slice(-4)}`,
        diagnostico_principal: patientData.diagnostico_principal || 'Evaluación Basal',
        institucion_id: defaultInstId,
        curso_id: patientData.curso_id || null,
        activo: true
      })
      .select()
      .single();

    if (error) throw error;

    // Si tiene terapeuta asignado, crear relación N a N
    if (patientData.therapistId) {
      await supabase
        .from('asignaciones_profesional_paciente')
        .insert({
          paciente_id: data.id,
          profesional_id: patientData.therapistId,
          rol_en_caso: 'principal'
        });
    }

    return {
      id: data.id,
      idSujeto: data.id_sujeto,
      email: `${data.id_sujeto.toLowerCase()}@cognimirror.com`,
      type: 'paciente',
      name: `${data.nombre} ${data.apellido || ''}`.trim(),
      parentEmails: [],
      therapistId: patientData.therapistId || '',
      institutionId: data.institucion_id,
      cursoId: data.curso_id,
      diagnosis: [data.diagnostico_principal],
      progress: 0,
      achievements: [],
      sessions: [],
      createdAt: new Date(data.creado_en)
    };
  } catch (error) {
    console.error('❌ Error en createPacienteSupabase:', error);
    return null;
  }
}

/**
 * Obtener todos los terapeutas/profesionales de Supabase
 */
export async function getTerapeutasFromSupabase(institucionId?: string): Promise<User[]> {
  try {
    let query = supabase
      .from('perfiles')
      .select('*')
      .in('rol', ['profesional', 'terapeuta', 'founder'])
      .order('creado_en', { ascending: false });

    if (institucionId && institucionId !== 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08') {
      query = query.eq('institucion_id', institucionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((t: any) => ({
      id: t.id,
      email: t.email,
      name: `${t.nombre} ${t.apellido || ''}`.trim(),
      type: 'terapeuta' as const,
      role: t.rol,
      especialidad: t.especialidad,
      institutionId: t.institucion_id,
      createdAt: new Date(t.creado_en)
    }));
  } catch (error) {
    console.error('❌ Error en getTerapeutasFromSupabase:', error);
    return [];
  }
}

/**
 * Guardar una Sesión de Evaluación y su Telemetría en Supabase (Event Sourcing)
 */
export async function guardarSesionEvaluacionSupabase(session: AnalysisGameSession, pacienteId?: string, profesionalId?: string): Promise<string | null> {
  try {
    const mappedNivel = 
      session.gameId.includes('memory') ? 5 :
      session.gameId.includes('reaction') ? 4 :
      session.gameId.includes('bilateral') ? 3 :
      session.gameId.includes('go_no_go') ? 2 : 1;

    const mappedProtocolo = 
      session.gameId.includes('memory') ? 'p05_memory_mirror' :
      session.gameId.includes('reaction') ? 'p04_reaction_mirror' :
      session.gameId.includes('bilateral') ? 'p03_bilateralidad' :
      session.gameId.includes('go_no_go') ? 'p02_go_no_go' : 'p01_exploracion_haptica';

    // 1. Insertar Cabecera de Sesión
    const { data: sesionCreada, error: sesionError } = await supabase
      .from('sesiones_evaluacion')
      .insert({
        paciente_id: pacienteId || '82716a98-6165-47af-8d06-fb2ef15bcd0c', // Brayan por defecto si no hay id
        profesional_id: profesionalId || null,
        institucion_id: 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08',
        protocolo_nivel: mappedNivel,
        protocolo_nombre: mappedProtocolo,
        fecha_inicio: session.startTime,
        fecha_fin: session.endTime || new Date().toISOString(),
        duracion_total_segundos: Math.round((new Date(session.endTime || Date.now()).getTime() - new Date(session.startTime).getTime()) / 1000),
        estado: 'completado',
        ble_conectado: true
      })
      .select()
      .single();

    if (sesionError) throw sesionError;

    // 2. Insertar Telemetría Cruda (Event Sourcing) si hay rondas/taps
    if (session.rounds && Array.isArray(session.rounds) && session.rounds.length > 0) {
      const telemetriaRows: any[] = [];

      session.rounds.forEach((round: any, rIdx: number) => {
        if (round.taps && Array.isArray(round.taps)) {
          round.taps.forEach((tap: any, tIdx: number) => {
            telemetriaRows.push({
              sesion_id: sesionCreada.id,
              ensayo_num: (rIdx * 10) + tIdx + 1,
              fase_o_bloque: round.level || 1,
              tipo_estimulo: 'SECUENCIA_CORSI',
              timestamp_estimulo_ms: Date.now() - (tap.timestamp ? Math.round(tap.timestamp) : 1000),
              timestamp_respuesta_ms: Date.now(),
              latencia_ms: Math.round(tap.timeTaken ? tap.timeTaken * 1000 : 450),
              cara_presionada: String(tap.blockId || 'F'),
              es_acierto: tap.isCorrect ?? true
            });
          });
        }
      });

      if (telemetriaRows.length > 0) {
        await supabase.from('telemetria_ensayos').insert(telemetriaRows);
      }
    }

    console.log('✅ [Supabase] Sesión y Telemetría guardadas en BD 2:', sesionCreada.id);
    return sesionCreada.id;
  } catch (error) {
    console.error('❌ Error en guardarSesionEvaluacionSupabase:', error);
    return null;
  }
}

/**
 * Registrar evento en la tabla inmutable de auditoría
 */
export async function registrarAuditoriaSupabase(data: {
  usuario_id?: string;
  usuario_email: string;
  usuario_rol: string;
  institucion_id?: string;
  accion: string;
  entidad_afectada?: string;
  entidad_id?: string;
  detalles?: Record<string, any>;
}) {
  try {
    await supabase.from('trazabilidad_auditoria').insert({
      usuario_id: data.usuario_id || null,
      usuario_email: data.usuario_email,
      usuario_rol: data.usuario_rol,
      institucion_id: data.institucion_id || null,
      accion: data.accion,
      entidad_afectada: data.entidad_afectada || null,
      entidad_id: data.entidad_id || null,
      detalles: data.detalles || {}
    });
  } catch (e) {
    // Si falla auditoría no bloquea la app
    console.warn('⚠️ [Auditoría] No se pudo escribir registro de trazabilidad:', e);
  }
}
