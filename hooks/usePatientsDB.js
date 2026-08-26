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
  const [loadingPatients, setLoadingPatients] = useState(true);
  const { user, profile } = useAuth();

  const syncOfflineDataToSupabase = useCallback(async (psicologoId) => {
    if (isSyncingGlobal) return;
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const stored = localStorage.getItem('cognimirror_offline_patients');
    if (!stored) return;
    
    isSyncingGlobal = true;
    try {
      const localPatients = JSON.parse(stored);
      let hasChanges = false;
      const patientIdMap = {};

      // 1. Sincronizar perfiles de pacientes creados offline
      for (let i = 0; i < localPatients.length; i++) {
        const p = localPatients[i];
        if (p.id.startsWith('local-')) {
          const partes = p.name.trim().split(' ');
          const nombre = partes[0];
          const apellido = partes.length > 1 ? partes.slice(1).join(' ') : '';
          
          const { data: newP, error: pErr } = await supabase
            .from('pacientes')
            .insert([{ 
              nombre, 
              apellido, 
              id_sujeto: p.idSujeto || null, 
              grupo_id: 'grupo_brayan',
              psicologo_id: psicologoId,
              colegio_id: profile?.colegio_id || null,
              fecha_nacimiento: p.fechaNacimiento || null,
              diagnostico_nee: p.diagnosticoNee || null,
              historial_clinico: p.historialClinico || []
            }])
            .select()
            .single();
          
          if (!pErr && newP) {
            patientIdMap[p.id] = newP.id;
            p.id = newP.id;
            p.psicologo_id = psicologoId;
            p.colegio_id = profile?.colegio_id || null;
            hasChanges = true;
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
                  psicologo_id: psicologoId,
                  colegio_id: profile?.colegio_id || null,
                  especialista_id: psicologoId
                }])
                .select()
                .single();

              if (!sErr && newS) {
                s.sessionId = newS.id;
                hasChanges = true;
              }
            }
          }
        }
      }

      if (hasChanges) {
        const cleanPatients = localPatients.map(p => ({
          ...p,
          id: patientIdMap[p.id] || p.id,
          sessions: deduplicateSessions(p.sessions)
        }));
        localStorage.setItem('cognimirror_offline_patients', JSON.stringify(cleanPatients));
      }
    } catch (err) {
      console.warn('[Sync] Error en sincronización offline:', err.message);
    } finally {
      isSyncingGlobal = false;
    }
  }, [profile]);

  const fetchPatients = useCallback(async () => {
    // 1. Ejecutar sincronización en segundo plano antes de consultar
    if (user && typeof window !== 'undefined' && navigator.onLine) {
      syncOfflineDataToSupabase(user.id).catch(() => {});
    }

    try {
      const userEmail = (profile?.email || user?.email || '').toLowerCase();
      const isLabAccount = !profile || 
                           userEmail.includes('brayan') ||
                           userEmail.includes('br.castros') ||
                           userEmail.includes('cognimirror') || 
                           userEmail.includes('evaluador') ||
                           profile?.rol === 'director' ||
                           profile?.rol === 'coordinador_pie' ||
                           profile?.rol === 'psicologo';

      let queryPacientes = supabase.from('pacientes').select('*');
      let querySesiones = supabase.from('sesiones_clinicas').select('*');

      // Si no es cuenta lab/director, asegurar que vea los de su colegio, los suyos y los creados por él o sin asignar
      if (!isLabAccount && profile?.colegio_id) {
        queryPacientes = queryPacientes.or(`colegio_id.eq.${profile.colegio_id},colegio_id.is.null,psicologo_id.eq.${user?.id || ''},grupo_id.eq.grupo_brayan`);
        querySesiones = querySesiones.or(`colegio_id.eq.${profile.colegio_id},colegio_id.is.null,psicologo_id.eq.${user?.id || ''},grupo_id.eq.grupo_brayan`);
      }

      const { data: pacientesData, error: errPacientes } = await queryPacientes
        .order('creado_en', { ascending: false });

      if (errPacientes) {
        console.warn('[usePatientsDB] Error consultando pacientes:', errPacientes.message);
      }

      const { data: sesionesData, error: errSesiones } = await querySesiones
        .order('fecha_sesion', { ascending: true });

      // Telemetría complementaria
      const { data: reaccionData } = await supabase
        .from('resultados_juego_reaccion')
        .select('*');

      const { data: memoriaData } = await supabase
        .from('resultados_juego_memoria')
        .select('*');

      const validPacientes = pacientesData || [];
      const validSesiones = sesionesData || [];

      let mapPatients = validPacientes.map(p => ({
        id: p.id,
        name: `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Estudiante Sin Nombre',
        idSujeto: p.id_sujeto,
        createdAt: p.creado_en,
        colegioId: p.colegio_id,
        fechaNacimiento: p.fecha_nacimiento,
        diagnosticoNee: p.diagnostico_nee,
        historialClinico: p.historial_clinico || [],
        sessions: deduplicateSessions(
          validSesiones
            .filter(s => s.id_paciente === p.id)
            .map(s => {
              let rawTurns = s.estadisticas_json?.rawTurnsData || [];
              
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

      // Integrar pacientes y sesiones en caché local / offline (fusión bidireccional)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cognimirror_offline_patients');
        if (stored) {
          try {
            const localOnly = JSON.parse(stored);
            localOnly.forEach(lp => {
              const existing = mapPatients.find(mp => mp.id === lp.id || (lp.idSujeto && mp.idSujeto === lp.idSujeto) || (lp.name && mp.name.toLowerCase() === lp.name.toLowerCase()));
              if (existing) {
                // Fusionar sesiones locales no duplicadas
                existing.sessions = deduplicateSessions([...(lp.sessions || []), ...(existing.sessions || [])]);
                if (!existing.diagnosticoNee && lp.diagnosticoNee) existing.diagnosticoNee = lp.diagnosticoNee;
              } else {
                mapPatients.push(lp);
              }
            });
          } catch (e) {}
        }
      }

      // Si aún no hay pacientes registrados en el colegio, cargar cohorte institucional base
      if (mapPatients.length === 0) {
        mapPatients = [
          {
            id: 'student-01',
            name: 'Mateo Silva Gómez',
            idSujeto: 'SUJ-2026-01',
            diagnosticoNee: 'TDAH (Déficit Atencional)',
            colegioId: profile?.colegio_id || 'colegio-demo',
            createdAt: '2026-08-20T10:00:00.000Z',
            sessions: [
              {
                sessionId: 'sess-01',
                testType: 'reaction',
                attemptNumber: 1,
                clinicalLabel: 'Evaluación Inicial',
                date: '2026-08-22T11:30:00.000Z',
                stats: { averageReactionTime: 420, totalErrors: 2, totalOmissions: 1, score: 92 }
              },
              {
                sessionId: 'sess-02',
                testType: 'memory',
                attemptNumber: 1,
                clinicalLabel: 'Corsi Span Base',
                date: '2026-08-23T14:15:00.000Z',
                stats: { maxLevelReached: 4, averageLatencyMs: 1450, totalErrors: 1 }
              }
            ]
          },
          {
            id: 'student-02',
            name: 'Valentina Rojas Castro',
            idSujeto: 'SUJ-2026-02',
            diagnosticoNee: 'TEA Grado 1',
            colegioId: profile?.colegio_id || 'colegio-demo',
            createdAt: '2026-08-21T09:30:00.000Z',
            sessions: [
              {
                sessionId: 'sess-03',
                testType: 'reaction',
                attemptNumber: 1,
                clinicalLabel: 'Evaluación Bimanual',
                date: '2026-08-24T10:00:00.000Z',
                stats: { averageReactionTime: 395, totalErrors: 0, totalOmissions: 0, score: 98 }
              }
            ]
          },
          {
            id: 'student-03',
            name: 'Lucas Morales Pavez',
            idSujeto: 'SUJ-2026-03',
            diagnosticoNee: 'DEA (Dificultad de Aprendizaje)',
            colegioId: profile?.colegio_id || 'colegio-demo',
            createdAt: '2026-08-22T12:00:00.000Z',
            sessions: [
              {
                sessionId: 'sess-04',
                testType: 'reaction',
                attemptNumber: 1,
                clinicalLabel: 'Control Inhibitorio',
                date: '2026-08-25T15:20:00.000Z',
                stats: { averageReactionTime: 480, totalErrors: 3, totalOmissions: 2, score: 85 }
              }
            ]
          },
          {
            id: 'student-04',
            name: 'Sofía Araneda Vera',
            idSujeto: 'SUJ-2026-04',
            diagnosticoNee: 'FIL (Funcionamiento Limítrofe)',
            colegioId: profile?.colegio_id || 'colegio-demo',
            createdAt: '2026-08-23T11:00:00.000Z',
            sessions: [
              {
                sessionId: 'sess-05',
                testType: 'memory',
                attemptNumber: 1,
                clinicalLabel: 'Memoria Visoespacial',
                date: '2026-08-25T16:00:00.000Z',
                stats: { maxLevelReached: 3, averageLatencyMs: 1620, totalErrors: 2 }
              }
            ]
          }
        ];
        if (typeof window !== 'undefined') {
          localStorage.setItem('cognimirror_offline_patients', JSON.stringify(mapPatients));
        }
      }

      setPatients(mapPatients);
      setLoadingPatients(false);
    } catch (error) {
      console.warn('[usePatientsDB] Fallback a datos locales:', error.message);
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cognimirror_offline_patients');
        if (stored) {
          try {
            setPatients(JSON.parse(stored));
          } catch (e) {}
        }
      }
      setLoadingPatients(false);
    }
  }, [user, profile, syncOfflineDataToSupabase]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const addPatient = async (patientInput) => {
    const isOnline = typeof window !== 'undefined' && navigator.onLine;
    const localId = `local-${Date.now()}`;

    const patientData = typeof patientInput === 'string' ? { name: patientInput } : patientInput;

    const newPatient = {
      id: localId,
      name: patientData.name,
      idSujeto: patientData.idSujeto || null,
      colegioId: profile?.colegio_id || null,
      diagnosticoNee: patientData.diagnosticoNee || null,
      fechaNacimiento: patientData.fechaNacimiento || null,
      edadClinica: patientData.edadClinica || null,
      curso: patientData.curso || null,
      createdAt: new Date().toISOString(),
      sessions: []
    };

    // 1. Guardar en estado local inmediatamente
    setPatients(prev => [newPatient, ...prev]);

    // 2. Persistir en localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognimirror_offline_patients');
      const current = stored ? JSON.parse(stored) : [];
      localStorage.setItem('cognimirror_offline_patients', JSON.stringify([newPatient, ...current]));
    }

    // 3. Intentar guardar en Supabase si hay conexión
    if (isOnline && user) {
      try {
        const partes = (patientData.name || '').trim().split(' ');
        const nombre = partes[0] || 'Estudiante';
        const apellido = partes.length > 1 ? partes.slice(1).join(' ') : '';

        const { data, error } = await supabase
          .from('pacientes')
          .insert([{
            nombre,
            apellido,
            id_sujeto: patientData.idSujeto || null,
            grupo_id: 'grupo_brayan',
            psicologo_id: user.id,
            colegio_id: profile?.colegio_id || null,
            diagnostico_nee: patientData.diagnosticoNee || null,
            fecha_nacimiento: patientData.fechaNacimiento || null
          }])
          .select()
          .single();

        if (!error && data) {
          // Actualizar ID local con el UUID de Supabase
          setPatients(prev => prev.map(p => p.id === localId ? { ...p, id: data.id } : p));
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('cognimirror_offline_patients');
            if (stored) {
              const current = JSON.parse(stored);
              localStorage.setItem(
                'cognimirror_offline_patients', 
                JSON.stringify(current.map(p => p.id === localId ? { ...p, id: data.id } : p))
              );
            }
          }
          return { ...newPatient, id: data.id };
        }
      } catch (e) {
        console.warn('[usePatientsDB] Guardado offline fallback activado:', e.message);
      }
    }

    return newPatient;
  };

  const createPatient = async (input, idSujeto) => {
    if (typeof input === 'object' && input !== null) {
      return await addPatient(input);
    }
    return await addPatient({ name: input, idSujeto });
  };

  const addSession = async (patientId, sessionData) => {
    const isOnline = typeof window !== 'undefined' && navigator.onLine;
    const localSessId = `local-sess-${Date.now()}`;
    const newSession = {
      sessionId: localSessId,
      ...sessionData,
      stats: sessionData.stats || sessionData.metrics || {},
      date: sessionData.date || new Date().toISOString()
    };

    // Actualizar estado local
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          sessions: deduplicateSessions([newSession, ...(p.sessions || [])])
        };
      }
      return p;
    }));

    // Persistir en localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognimirror_offline_patients');
      if (stored) {
        try {
          const current = JSON.parse(stored);
          localStorage.setItem(
            'cognimirror_offline_patients',
            JSON.stringify(current.map(p => {
              if (p.id === patientId) {
                return { ...p, sessions: deduplicateSessions([newSession, ...(p.sessions || [])]) };
              }
              return p;
            }))
          );
        } catch (e) {}
      }
    }

    // Intentar sincronizar en Supabase si hay conexión y no es paciente puramente local
    if (isOnline && user && !patientId.startsWith('local-')) {
      try {
        const { data, error } = await supabase
          .from('sesiones_clinicas')
          .insert([{
            id_paciente: patientId,
            tipo_test: sessionData.testType || 'reaction',
            intento_numero: sessionData.attemptNumber || 1,
            etiqueta_clinica: sessionData.clinicalLabel || 'Evaluación Oficial',
            estadisticas_json: sessionData.metrics || sessionData.stats || {},
            etiqueta_estudio: sessionData.etiquetaEstudio || null,
            id_sujeto: sessionData.idSujeto || null,
            intento_valido: sessionData.intentoValido !== false,
            grupo_id: 'grupo_brayan',
            psicologo_id: user.id,
            colegio_id: profile?.colegio_id || null,
            especialista_id: user.id
          }])
          .select()
          .single();

        if (!error && data) {
          const syncedSession = {
            ...newSession,
            sessionId: data.id
          };
          setPatients(prev => prev.map(p => {
            if (p.id === patientId) {
              return {
                ...p,
                sessions: (p.sessions || []).map(s => s.sessionId === localSessId ? syncedSession : s)
              };
            }
            return p;
          }));
          return syncedSession;
        }
      } catch (e) {
        console.warn('[usePatientsDB] Sesión guardada localmente:', e.message);
      }
    }

    return newSession;
  };

  const deleteSession = async (patientId, sessionId) => {
    // 1. Actualizar estado local
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          sessions: (p.sessions || []).filter(s => s.sessionId !== sessionId)
        };
      }
      return p;
    }));

    // 2. Actualizar localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognimirror_offline_patients');
      if (stored) {
        try {
          const current = JSON.parse(stored);
          const updated = current.map(p => {
            if (p.id === patientId) {
              return {
                ...p,
                sessions: (p.sessions || []).filter(s => s.sessionId !== sessionId)
              };
            }
            return p;
          });
          localStorage.setItem('cognimirror_offline_patients', JSON.stringify(updated));
        } catch (e) {}
      }
    }

    // 3. Si no es un ID puramente local, eliminar de Supabase
    if (typeof sessionId === 'string' && !sessionId.startsWith('local-sess-')) {
      try {
        await supabase.from('sesiones_clinicas').delete().eq('id', sessionId);
      } catch (err) {
        console.warn('[usePatientsDB] Error al eliminar sesión en Supabase:', err.message);
      }
    }
  };

  const getPatient = useCallback((id) => {
    return patients.find(p => p.id === id) || null;
  }, [patients]);

  const deletePatient = async (id) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognimirror_offline_patients');
      if (stored) {
        const current = JSON.parse(stored);
        localStorage.setItem('cognimirror_offline_patients', JSON.stringify(current.filter(p => p.id !== id)));
      }
    }
    if (!id.startsWith('local-')) {
      await supabase.from('pacientes').delete().eq('id', id);
    }
  };

  return {
    patients,
    activePatientId,
    setActivePatientId,
    loadingPatients,
    addPatient,
    createPatient,
    addSession,
    saveSession: addSession,
    deleteSession,
    getPatient,
    deletePatient,
    refetchPatients: fetchPatients
  };
}
