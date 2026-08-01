import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function usePatientsDB() {
  const [patients, setPatients] = useState([]);
  const [activePatientId, setActivePatientId] = useState(null);

  const fetchPatients = useCallback(async () => {
    try {
      const { data: pacientesData, error: errPacientes } = await supabase
        .from('pacientes')
        .select('*')
        .order('creado_en', { ascending: false });

      if (errPacientes) throw errPacientes;

      const { data: sesionesData, error: errSesiones } = await supabase
        .from('sesiones_clinicas')
        .select('*')
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
        createdAt: p.creado_en,
        sessions: sesionesData
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
              date: s.fecha_sesion,
              stats: s.estadisticas_json,
              rawTurnsData: rawTurns
            };
          })
      }));

      // Fallback local inteligente para recuperar telemetrías perdidas de ayer en este navegador
      try {
        const localData = typeof window !== 'undefined' ? localStorage.getItem('cogniMirror_Patients') : null;
        if (localData) {
          const localPatients = JSON.parse(localData);
          mapPatients = mapPatients.map(sp => {
            const lp = localPatients.find(x => x.name.trim().toLowerCase() === sp.name.trim().toLowerCase());
            if (!lp) return sp;

            return {
              ...sp,
              sessions: sp.sessions.map(ss => {
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
            };
          });
        }
      } catch (errLocal) {
        console.warn("[Auto-Merge] Error al sincronizar datos locales:", errLocal);
      }

      setPatients(mapPatients);
    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const createPatient = useCallback(async (name) => {
    try {
      const partes = name.trim().split(' ');
      const nombre = partes[0];
      const apellido = partes.length > 1 ? partes.slice(1).join(' ') : '';

      const { data, error } = await supabase
        .from('pacientes')
        .insert([{ nombre, apellido }])
        .select()
        .single();

      if (error) throw error;

      const newPatient = {
        id: data.id,
        name: `${data.nombre} ${data.apellido}`.trim(),
        createdAt: data.creado_en,
        sessions: []
      };

      setPatients(prev => [newPatient, ...prev]);
      return newPatient;
    } catch (error) {
      console.error('Error creating patient:', error);
      return null;
    }
  }, []);

  const addSession = useCallback(async (patientId, sessionData) => {
    try {
      const patientIndex = patients.findIndex(p => p.id === patientId);
      if (patientIndex === -1) return null;
      const patient = patients[patientIndex];

      const testType = sessionData.testType || 'reaction';
      const testTypeSessions = patient.sessions.filter(s => (s.testType || 'reaction') === testType);
      const attemptNumber = testTypeSessions.length + 1;
      
      let label = 'Seguimiento';
      if (attemptNumber === 1) label = 'Ensayo / Familiarización';
      else if (attemptNumber === 2) label = 'Línea Base';
      else label = 'Evaluación de Seguimiento';

      const telemetryData = sessionData.telemetry || sessionData.rawTurnsData || [];
      const statsPayload = {
        ...(sessionData.metrics || sessionData.stats || {}),
        rawTurnsData: telemetryData
      };

      const { data: sessionInfo, error: sessionErr } = await supabase
        .from('sesiones_clinicas')
        .insert([{
          id_paciente: patientId,
          tipo_test: testType,
          intento_numero: attemptNumber,
          etiqueta_clinica: label,
          estadisticas_json: statsPayload
        }])
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      const newSession = {
        sessionId: sessionInfo.id,
        testType,
        attemptNumber,
        clinicalLabel: label,
        date: sessionInfo.fecha_sesion,
        stats: sessionInfo.estadisticas_json,
        rawTurnsData: telemetryData
      };

      if (telemetryData && telemetryData.length > 0) {
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
      }

      setPatients(prev => {
        const newData = [...prev];
        newData[patientIndex].sessions.push(newSession);
        return newData;
      });

      return newSession;
    } catch (error) {
      console.error('Error adding session:', error);
      return null;
    }
  }, [patients]);

  const deletePatient = useCallback(async (patientId) => {
    try {
      await supabase.from('pacientes').delete().eq('id', patientId);
      setPatients(prev => prev.filter(p => p.id !== patientId));
      if (activePatientId === patientId) setActivePatientId(null);
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  }, [activePatientId]);

  const deleteSession = useCallback(async (patientId, sessionId) => {
    try {
      await supabase.from('sesiones_clinicas').delete().eq('id', sessionId);
      await fetchPatients();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [fetchPatients]);

  const getPatient = useCallback((id) => {
    return patients.find(p => p.id === id);
  }, [patients]);

  return {
    patients,
    activePatientId,
    setActivePatientId,
    createPatient,
    addSession,
    deletePatient,
    deleteSession,
    getPatient,
    refreshData: fetchPatients
  };
}
