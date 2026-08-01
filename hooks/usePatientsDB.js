import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

let isSyncingGlobal = false;

const deduplicateSessions = (sessions) => {
  if (!sessions) return [];
  return sessions.filter((s, index, self) => 
    self.findIndex(x => 
      (x.sessionId && s.sessionId && x.sessionId === s.sessionId) || 
      (x.testType === s.testType && 
       x.attemptNumber === s.attemptNumber && 
       x.clinicalLabel === s.clinicalLabel)
    ) === index
  );
};

export function usePatientsDB() {
  const [patients, setPatients] = useState([]);
  const [activePatientId, setActivePatientId] = useState(null);
  const { user } = useAuth();

  const syncOfflineDataToSupabase = useCallback(async (psicologoId) => {
    if (isSyncingGlobal) {
      console.log('[Sync] Sincronización ya en curso. Omitiendo llamada concurrente.');
      return;
    }
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const stored = localStorage.getItem('cognimirror_offline_patients');
    if (!stored) return;
    
    isSyncingGlobal = true;
    try {
      const localPatients = JSON.parse(stored);
      let hasChanges = false;
      const patientIdMap = {};

      // 1. Sincronizar perfiles de pacientes locales creados offline
      for (let i = 0; i < localPatients.length; i++) {
        const p = localPatients[i];
        if (p.id.startsWith('local-')) {
          const partes = p.name.trim().split(' ');
          const nombre = partes[0];
          const apellido = partes.length > 1 ? partes.slice(1).join(' ') : '';
          
          console.log(`[Sync] Sincronizando paciente offline: ${p.name}`);
          const { data: newP, error: pErr } = await supabase
            .from('pacientes')
            .insert([{ 
              nombre, 
              apellido, 
              id_sujeto: p.idSujeto || null, 
              grupo_id: 'grupo_brayan',
              psicologo_id: psicologoId
            }])
            .select()
            .single();
          
          if (!pErr && newP) {
            patientIdMap[p.id] = newP.id;
            p.id = newP.id;
            p.psicologo_id = psicologoId;
            hasChanges = true;
            console.log(`[Sync] Paciente ${p.name} sincronizado con UUID: ${newP.id}`);
          } else {
            console.warn(`[Sync] Error sincronizando paciente ${p.name}:`, pErr);
          }
        }
      }

      // 2. Sincronizar sesiones locales
      for (let i = 0; i < localPatients.length; i++) {
        const p = localPatients[i];
        const resolvedPatientId = patientIdMap[p.id] || p.id;
        if (resolvedPatientId.startsWith('local-')) continue;

        if (p.sessions && p.sessions.length > 0) {
          for (let j = 0; j < p.sessions.length; j++) {
            const s = p.sessions[j];
            if (s.sessionId.startsWith('local-sess-')) {
              console.log(`[Sync] Sincronizando sesión offline (${s.testType}) para paciente: ${p.name}`);
              
              const { data: newS, error: sErr } = await supabase
                .from('sesiones_clinicas')
                .insert([{
                  id_paciente: resolvedPatientId,
                  tipo_test: s.testType,
                  intento_numero: s.attemptNumber,
                  etiqueta_clinica: s.clinicalLabel,
                  estadisticas_json: s.stats,
                  etiqueta_estudio: s.etiquetaEstudio || null,
                  id_sujeto: s.idSujeto || null,
                  intento_valido: s.intentoValido !== false,
                  grupo_id: 'grupo_brayan',
                  psicologo_id: psicologoId
                }])
                .select()
                .single();

              if (!sErr && newS) {
                const telemetry = s.rawTurnsData || [];
                if (telemetry.length > 0) {
                  try {
                    if (s.testType === 'reaction') {
                      const rows = telemetry.map(t => ({
                        id_sesion: newS.id,
                        nivel: t.round || t.level || 0,
                        tiempo_reaccion_ms: t.time !== undefined ? t.time : (t.latencyMs !== undefined ? t.latencyMs : null),
                        cara_esperada: t.expected || t.expectedFace,
                        cara_girada: t.actualFace || t.userFace || null,
                        es_correcto: t.status === 'Ok' || t.status === 'Corregido' || t.isCorrect || false,
                        timestamp_local: new Date(t.timestamp || Date.now()).toISOString()
                      }));
                      await supabase.from('resultados_juego_reaccion').insert(rows);
                    } else if (s.testType === 'memory') {
                      const rows = telemetry.map(t => ({
                        id_sesion: newS.id,
                        nivel: t.level || 0,
                        intento: t.trial || 'A',
                        cara_esperada: t.expectedFace || t.expected || null,
                        cara_girada: t.userFace || t.actualFace || null,
                        es_correcto: t.isCorrect !== undefined ? t.isCorrect : (t.status === 'Ok' || t.status === 'Corregido'),
                        latencia_ms: t.latencyMs !== undefined ? t.latencyMs : (t.time || null),
                        array_latencias_intra: t.moveLatencies || null,
                        tipo_error: t.errorType || null,
                        timestamp_local: new Date(t.timestamp || Date.now()).toISOString()
                      }));
                      await supabase.from('resultados_juego_memoria').insert(rows);
                    }
                  } catch (telemetryErr) {
                    console.warn('[Sync] Error al insertar telemetría relacional:', telemetryErr);
                  }
                }
                s.sessionId = newS.id;
                hasChanges = true;
                console.log(`[Sync] Sesión (${s.testType}) de ${p.name} sincronizada en Supabase.`);
              } else {
                console.warn(`[Sync] Error al insertar sesión en Supabase:`, sErr);
              }
            }
          }
        }
      }

      if (hasChanges) {
        const cleanPatients = localPatients.map(p => ({
          ...p,
          sessions: deduplicateSessions(p.sessions)
        }));
        localStorage.setItem('cognimirror_offline_patients', JSON.stringify(cleanPatients));
      }
    } catch (err) {
      console.error('[Sync] Error general en el despachador de sincronización offline:', err);
    } finally {
      isSyncingGlobal = false;
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    if (!user) return;
    
    // 1. Ejecutar sincronización en segundo plano antes de consultar
    if (typeof window !== 'undefined' && navigator.onLine) {
      await syncOfflineDataToSupabase(user.id);
    }

    try {
      const { data: pacientesData, error: errPacientes } = await supabase
        .from('pacientes')
        .select('*')
        .eq('grupo_id', 'grupo_brayan')
        .eq('psicologo_id', user.id)
        .order('creado_en', { ascending: false });

      if (errPacientes) throw errPacientes;

      const { data: sesionesData, error: errSesiones } = await supabase
        .from('sesiones_clinicas')
        .select('*')
        .eq('grupo_id', 'grupo_brayan')
        .eq('psicologo_id', user.id)
        .order('fecha_sesion', { ascending: true });
        
      if (errSesiones) throw errSesiones;

      // Consulta de telemetría atómica para compatibilidad con registros antiguos
      const { data: reaccionData } = await supabase
        .from('resultados_juego_reaccion')
        .select('*');

      const { data: memoriaData } = await supabase
        .from('resultados_juego_memoria')
        .select('*');

      let mapPatients = pacientesData.map(p => ({
        id: p.id,
        name: `${p.nombre} ${p.apellido}`.trim(),
        idSujeto: p.id_sujeto,
        createdAt: p.creado_en,
        sessions: deduplicateSessions(
          sesionesData
            .filter(s => s.id_paciente === p.id)
            .map(s => {
              let rawTurns = s.estadisticas_json?.rawTurnsData || [];
              
              // Reconstrucción desde BD relacional si no existe en el JSON consolidado (datos históricos)
              if (rawTurns.length === 0) {
                if (s.tipo_test === 'reaction') {
                  const filtrados = reaccionData?.filter(r => r.id_sesion === s.id) || [];
                  rawTurns = filtrados.map(r => ({
                    round: r.nivel || 1,
                    type: r.cara_esperada ? (r.cara_esperada !== 'L' && r.cara_esperada !== 'R' ? 'NOGO' : 'GO') : 'NOGO',
                    expected: r.cara_esperada,
                    actualFace: r.cara_girada,
                    time: r.tiempo_reaccion_ms,
                    errors: r.es_correcto ? 0 : 1,
                    timeout: r.tiempo_reaccion_ms === null || r.tiempo_reaccion_ms === 0,
                    fail: !r.es_correcto && (r.cara_esperada !== 'L' && r.cara_esperada !== 'R'),
                    isFalseStart: !r.es_correcto && (r.cara_esperada !== 'L' && r.cara_esperada !== 'R'),
                    isOmission: r.tiempo_reaccion_ms === null || r.tiempo_reaccion_ms === 0,
                    status: r.es_correcto ? 'Ok' : 'Error'
                  }));
                } else if (s.tipo_test === 'memory') {
                  const filtrados = memoriaData?.filter(m => m.id_sesion === s.id) || [];
                  rawTurns = filtrados.map(m => ({
                    level: m.nivel,
                    trial: m.intento,
                    expectedFace: m.cara_esperada,
                    userFace: m.cara_girada,
                    isCorrect: m.es_correcto,
                    latencyMs: m.latencia_ms,
                    moveLatencies: m.array_latencias_intra,
                    errorType: m.tipo_error,
                    timestamp: m.timestamp_local
                  }));
                }
              }

              return {
                sessionId: s.id,
                testType: s.tipo_test,
                attemptNumber: s.intento_numero,
                clinicalLabel: s.etiqueta_clinica,
                etiquetaEstudio: s.etiqueta_estudio,
                idSujeto: s.id_sujeto,
                intentoValido: s.intento_valido !== false,
                anotacion_clinica: s.anotacion_clinica,
                date: s.fecha_sesion,
                stats: s.estadisticas_json,
                rawTurnsData: rawTurns
              };
            })
        )
      }));

      // Fallback local inteligente para recuperar telemetrías perdidas de ayer en este navegador
      try {
        const localData = typeof window !== 'undefined' ? localStorage.getItem('cognimirror_offline_patients') : null;
        if (localData) {
          const localPatients = JSON.parse(localData);
          mapPatients = mapPatients.map(sp => {
            const lp = localPatients.find(x => x.name.trim().toLowerCase() === sp.name.trim().toLowerCase());
            if (!lp) return sp;

            return {
              ...sp,
              sessions: deduplicateSessions(
                sp.sessions.map(ss => {
                  if (ss.rawTurnsData && ss.rawTurnsData.length > 0) return ss;
                  
                  // Si la sesión de Supabase no tiene telemetría, la buscamos en el localStorage local por coincidencia de fecha o intento
                  const localSession = lp.sessions?.find(ls => 
                    ls.testType === ss.testType && 
                    (ls.attemptNumber === ss.attemptNumber || Math.abs(new Date(ls.date) - new Date(ss.date)) < 30000)
                  );

                  if (localSession && localSession.rawTurnsData && localSession.rawTurnsData.length > 0) {
                    console.log(`[Auto-Merge] Inyectada telemetría local de ayer para la sesión ${ss.sessionId} de ${sp.name}`);
                    const telemetry = localSession.rawTurnsData;
                    const statsPayload = {
                      ...(ss.stats || {}),
                      rawTurnsData: telemetry
                    };
                    
                    // Auto-sincronización silenciosa y transparente en Supabase
                    supabase.from('sesiones_clinicas')
                      .update({ estadisticas_json: statsPayload })
                      .eq('id', ss.sessionId)
                      .then(({ error }) => {
                        if (!error) console.log(`[Auto-Sync] Subida telemetría histórica de sesión ${ss.sessionId} a Supabase.`);
                      });

                    // Insertar en tablas relacionales para completitud
                    if (ss.testType === 'reaction') {
                      const rows = telemetry.map(t => ({
                        id_sesion: ss.sessionId,
                        nivel: t.round || t.level || 0,
                        tiempo_reaccion_ms: t.time !== undefined ? t.time : (t.latencyMs !== undefined ? t.latencyMs : null),
                        cara_esperada: t.expected || t.expectedFace,
                        cara_girada: t.actualFace || t.userFace || null,
                        es_correcto: t.status === 'Ok' || t.status === 'Corregido' || t.isCorrect || false,
                        timestamp_local: new Date(t.timestamp || Date.now()).toISOString()
                      }));
                      supabase.from('resultados_juego_reaccion').insert(rows).then(() => {});
                    } else if (ss.testType === 'memory') {
                      const rows = telemetry.map(t => ({
                        id_sesion: ss.sessionId,
                        nivel: t.level || 0,
                        intento: t.trial || 'A',
                        cara_esperada: t.expectedFace || t.expected || null,
                        cara_girada: t.userFace || t.actualFace || null,
                        es_correcto: t.isCorrect !== undefined ? t.isCorrect : (t.status === 'Ok' || t.status === 'Corregido'),
                        latencia_ms: t.latencyMs !== undefined ? t.latencyMs : (t.time || null),
                        array_latencias_intra: t.moveLatencies || null,
                        tipo_error: t.errorType || null,
                        timestamp_local: new Date(t.timestamp || Date.now()).toISOString()
                      }));
                      supabase.from('resultados_juego_memoria').insert(rows).then(() => {});
                    }

                    return {
                      ...ss,
                      rawTurnsData: telemetry
                    };
                  }
                  return ss;
                })
              )
            };
          });
        }
      } catch (errLocal) {
        console.warn("[Auto-Merge] Error al sincronizar datos locales:", errLocal);
      }

      // Guardar base de datos offline consolidada
      if (typeof window !== 'undefined') {
        const cleanData = mapPatients.map(p => ({
          ...p,
          sessions: deduplicateSessions(p.sessions)
        }));
        localStorage.setItem('cognimirror_offline_patients', JSON.stringify(cleanData));
      }

      setPatients(mapPatients);
    } catch (error) {
      console.warn('[Offline Mode] Sin conexión a internet o red inestable. Cargando datos locales desde el almacenamiento offline.');
      // Fallback a localStorage offline
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cognimirror_offline_patients');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const cleanData = parsed.map(p => ({
              ...p,
              sessions: deduplicateSessions(p.sessions)
            }));
            setPatients(cleanData);
            return;
          } catch (e) {
            console.error('[Offline Mode] Error parsing offline patients:', e);
          }
        }
      }
      setPatients([]);
    }
  }, [user, syncOfflineDataToSupabase]);

  useEffect(() => {
    fetchPatients();

    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        console.log('[Network] Conexión a internet restablecida en el lobby. Sincronizando datos offline...');
        fetchPatients();
      };
      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }
  }, [fetchPatients]);

  const createPatient = useCallback(async (name, idSujeto = null) => {
    if (!user) return null;
    const partes = name.trim().split(' ');
    const nombre = partes[0];
    const apellido = partes.length > 1 ? partes.slice(1).join(' ') : '';
    const tempId = 'local-' + Math.random().toString(36).substr(2, 9);
    const newPatient = {
      id: tempId,
      name: name.trim(),
      idSujeto: idSujeto,
      createdAt: new Date().toISOString(),
      psicologo_id: user.id,
      sessions: []
    };

    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert([{ 
          nombre, 
          apellido, 
          id_sujeto: idSujeto, 
          grupo_id: 'grupo_brayan',
          psicologo_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const patient = {
        id: data.id,
        name: `${data.nombre} ${data.apellido}`.trim(),
        idSujeto: data.id_sujeto,
        createdAt: data.creado_en,
        psicologo_id: data.psicologo_id,
        sessions: []
      };

      setPatients(prev => {
        const updated = [patient, ...prev.filter(p => p.id !== tempId)];
        if (typeof window !== 'undefined') {
          localStorage.setItem('cognimirror_offline_patients', JSON.stringify(updated));
        }
        return updated;
      });
      return patient;
    } catch (error) {
      console.warn('Error creating patient in Supabase, using local patient instead:', error);
      setPatients(prev => {
        const updated = [newPatient, ...prev];
        if (typeof window !== 'undefined') {
          localStorage.setItem('cognimirror_offline_patients', JSON.stringify(updated));
        }
        return updated;
      });
      return newPatient;
    }
  }, [user]);

  const addSession = useCallback(async (patientId, sessionData) => {
    try {
      const patientIndex = patients.findIndex(p => p.id === patientId);
      if (patientIndex === -1) return null;
      const patient = patients[patientIndex];

      const testType = sessionData.testType || 'reaction';
      const testTypeSessions = patient.sessions.filter(s => (s.testType || 'reaction') === testType);
      const attemptNumber = testTypeSessions.length + 1;
      
      let label = sessionData.clinicalLabel;
      if (!label) {
        if (attemptNumber === 1) label = 'Ensayo / Familiarización';
        else if (attemptNumber === 2) label = 'Línea Base';
        else label = 'Evaluación de Seguimiento';
      }

      const telemetryData = sessionData.telemetry || sessionData.rawTurnsData || [];
      const statsPayload = {
        ...(sessionData.metrics || sessionData.stats || {}),
        rawTurnsData: telemetryData
      };

      const tempSessionId = 'local-sess-' + Math.random().toString(36).substr(2, 9);
      const localSession = {
        sessionId: tempSessionId,
        testType,
        attemptNumber,
        clinicalLabel: label,
        etiquetaEstudio: sessionData.etiquetaEstudio || sessionData.etiqueta_estudio || null,
        idSujeto: sessionData.idSujeto || sessionData.id_sujeto || null,
        intentoValido: sessionData.intentoValido !== undefined ? sessionData.intentoValido : true,
        date: new Date().toISOString(),
        stats: statsPayload,
        rawTurnsData: telemetryData
      };

      // Si el paciente es local, no podemos insertarlo en Supabase sin su paciente
      if (patientId.startsWith('local-')) {
        throw new Error('El paciente es local. Guardando la sesión en local storage.');
      }

      const { data: sessionInfo, error: sessionErr } = await supabase
        .from('sesiones_clinicas')
        .insert([{
          id_paciente: patientId,
          tipo_test: testType,
          intento_numero: attemptNumber,
          etiqueta_clinica: label,
          estadisticas_json: statsPayload,
          etiqueta_estudio: sessionData.etiquetaEstudio || sessionData.etiqueta_estudio || null,
          id_sujeto: sessionData.idSujeto || sessionData.id_sujeto || null,
          intento_valido: sessionData.intentoValido !== undefined ? sessionData.intentoValido : true,
          grupo_id: 'grupo_brayan',
          psicologo_id: user?.id || null
        }])
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      const newSession = {
        sessionId: sessionInfo.id,
        testType,
        attemptNumber,
        clinicalLabel: label,
        etiquetaEstudio: sessionInfo.etiqueta_estudio,
        idSujeto: sessionInfo.id_sujeto,
        intentoValido: sessionInfo.intento_valido,
        anotacion_clinica: sessionInfo.anotacion_clinica,
        date: sessionInfo.fecha_sesion,
        stats: sessionInfo.estadisticas_json,
        rawTurnsData: telemetryData
      };

      if (telemetryData && telemetryData.length > 0) {
        try {
          if (testType === 'reaction') {
            const rows = telemetryData.map(t => ({
              id_sesion: sessionInfo.id,
              nivel: t.round || t.level || 0,
              tiempo_reaccion_ms: t.time !== undefined ? t.time : (t.latencyMs !== undefined ? t.latencyMs : null),
              cara_esperada: t.expected || t.expectedFace,
              cara_girada: t.actualFace || t.userFace || null,
              es_correcto: t.status === 'Ok' || t.status === 'Corregido' || t.isCorrect || false,
              timestamp_local: new Date(t.timestamp || Date.now()).toISOString()
            }));
            await supabase.from('resultados_juego_reaccion').insert(rows);
          } else if (testType === 'memory') {
            const rows = telemetryData.map(t => ({
              id_sesion: sessionInfo.id,
              nivel: t.level || 0,
              intento: t.trial || 'A',
              cara_esperada: t.expectedFace || t.expected || null,
              cara_girada: t.userFace || t.actualFace || null,
              es_correcto: t.isCorrect !== undefined ? t.isCorrect : (t.status === 'Ok' || t.status === 'Corregido'),
              latencia_ms: t.latencyMs !== undefined ? t.latencyMs : (t.time || null),
              array_latencias_intra: t.moveLatencies || null,
              tipo_error: t.errorType || null,
              timestamp_local: new Date(t.timestamp || Date.now()).toISOString()
            }));
            await supabase.from('resultados_juego_memoria').insert(rows);
          }
        } catch (telemetryErr) {
          console.warn('Error inserting relational telemetry:', telemetryErr);
        }
      }

      setPatients(prev => {
        const newData = prev.map(p => {
          if (p.id === patientId) {
            const updatedSessions = [...p.sessions.filter(s => s.sessionId !== tempSessionId), newSession];
            return {
              ...p,
              sessions: deduplicateSessions(updatedSessions)
            };
          }
          return p;
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('cognimirror_offline_patients', JSON.stringify(newData));
        }
        return newData;
      });

      return newSession;
    } catch (error) {
      console.warn('Error adding session to Supabase, saving to local storage only:', error);
      
      const patientIndex = patients.findIndex(p => p.id === patientId);
      if (patientIndex === -1) return null;
      const patient = patients[patientIndex];
      const testType = sessionData.testType || 'reaction';
      const testTypeSessions = patient.sessions.filter(s => (s.testType || 'reaction') === testType);
      const attemptNumber = testTypeSessions.length + 1;
      let label = sessionData.clinicalLabel;
      if (!label) {
        if (attemptNumber === 1) label = 'Ensayo / Familiarización';
        else if (attemptNumber === 2) label = 'Línea Base';
        else label = 'Evaluación de Seguimiento';
      }
      const telemetryData = sessionData.telemetry || sessionData.rawTurnsData || [];
      const statsPayload = {
        ...(sessionData.metrics || sessionData.stats || {}),
        rawTurnsData: telemetryData
      };
      const tempSessionId = 'local-sess-' + Math.random().toString(36).substr(2, 9);
      const localSession = {
        sessionId: tempSessionId,
        testType,
        attemptNumber,
        clinicalLabel: label,
        etiquetaEstudio: sessionData.etiquetaEstudio || sessionData.etiqueta_estudio || null,
        idSujeto: sessionData.idSujeto || sessionData.id_sujeto || null,
        intentoValido: sessionData.intentoValido !== undefined ? sessionData.intentoValido : true,
        date: new Date().toISOString(),
        stats: statsPayload,
        rawTurnsData: telemetryData
      };

      setPatients(prev => {
        const newData = prev.map(p => {
          if (p.id === patientId) {
            const updatedSessions = [...p.sessions, localSession];
            return {
              ...p,
              sessions: deduplicateSessions(updatedSessions)
            };
          }
          return p;
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('cognimirror_offline_patients', JSON.stringify(newData));
        }
        return newData;
      });

      return localSession;
    }
  }, [patients, user]);

  const deletePatient = useCallback(async (patientId) => {
    try {
      if (!patientId.startsWith('local-')) {
        await supabase.from('pacientes').delete().eq('id', patientId);
      }
    } catch (error) {
      console.warn('Error deleting patient in Supabase:', error);
    }
    setPatients(prev => {
      const updated = prev.filter(p => p.id !== patientId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cognimirror_offline_patients', JSON.stringify(updated));
      }
      return updated;
    });
    if (activePatientId === patientId) setActivePatientId(null);
  }, [activePatientId]);

  const deleteSession = useCallback(async (patientId, sessionId) => {
    try {
      if (!sessionId.startsWith('local-sess-')) {
        await supabase.from('sesiones_clinicas').delete().eq('id', sessionId);
      }
    } catch (error) {
      console.warn('Error deleting session in Supabase:', error);
    }
    setPatients(prev => {
      const newData = [...prev];
      const idx = newData.findIndex(p => p.id === patientId);
      if (idx !== -1) {
        newData[idx].sessions = newData[idx].sessions.filter(s => s.sessionId !== sessionId);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('cognimirror_offline_patients', JSON.stringify(newData));
      }
      return newData;
    });
  }, []);

  const getPatient = useCallback((id) => {
    return patients.find(p => p.id === id);
  }, [patients]);

  const fetchRemoteEvaluations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('evaluaciones_remotas')
        .select('*, pacientes(nombre, apellido, id_sujeto)')
        .eq('grupo_id', 'grupo_brayan')
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching remote evaluations:', error);
      return [];
    }
  }, []);

  const createRemoteEvaluation = useCallback(async (patientId, testType) => {
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('evaluaciones_remotas')
        .insert([{
          id_paciente: patientId,
          tipo_test: testType,
          token: token,
          activo: true,
          grupo_id: 'grupo_brayan',
          expira_en: expiraEn
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating remote evaluation:', error);
      throw error;
    }
  }, []);

  const invalidateRemoteEvaluation = useCallback(async (evalId) => {
    try {
      const { error } = await supabase
        .from('evaluaciones_remotas')
        .update({ activo: false })
        .eq('id', evalId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error invalidating remote evaluation:', error);
      throw error;
    }
  }, []);

  return {
    patients,
    activePatientId,
    setActivePatientId,
    createPatient,
    addSession,
    deletePatient,
    deleteSession,
    getPatient,
    refreshData: fetchPatients,
    fetchRemoteEvaluations,
    createRemoteEvaluation,
    invalidateRemoteEvaluation
  };
}
