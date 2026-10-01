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
  const [cursos, setCursos] = useState([]);
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
          const institucionId = profile?.institucion_id || profile?.colegio_id || 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08';
          
          const { data: newP, error: pErr } = await supabase
            .from('pacientes')
            .insert([{ 
              nombre, 
              apellido, 
              id_sujeto: p.idSujeto || null, 
              institucion_id: institucionId,
              fecha_nacimiento: p.fechaNacimiento || null,
              diagnostico_principal: p.diagnosticoNee || p.diagnosticoPrincipal || null,
              historial_clinico: p.historialClinico || [],
              activo: true
            }])
            .select()
            .single();
          
          if (!pErr && newP) {
            patientIdMap[p.id] = newP.id;
            p.id = newP.id;
            p.institucion_id = institucionId;
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
                  intento_numero: s.attemptNumber || 1,
                  etiqueta_clinica: s.clinicalLabel || 'Evaluación Oficial',
                  estadisticas_json: s.stats || {},
                  etiqueta_estudio: s.etiquetaEstudio || null,
                  id_sujeto: s.idSujeto || null,
                  intento_valido: s.intentoValido !== false
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

      let queryPacientes = supabase.from('pacientes').select('*, cursos(*)');
      let querySesiones = supabase.from('sesiones_clinicas').select('*');

      // Cargar catálogo de cursos
      try {
        const { data: cData } = await supabase
          .from('cursos')
          .select('*')
          .order('nivel', { ascending: true })
          .order('letra', { ascending: true });
        if (cData && cData.length > 0) {
          setCursos(cData);
        }
      } catch (errC) {
        console.warn('[usePatientsDB] Error consultando cursos:', errC);
      }

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

      let mapPatients = validPacientes.map(p => {
        const diag = p.diagnostico_nee || p.diagnostico_principal || 'Evaluación General';
        const isNeep = /permanente|neep|tea|autis|intelectual|motora|visual|auditiva|múltiple|multiple/i.test(diag);
        const tipoNee = isNeep ? 'NEEP' : 'NEET';
        const cObj = p.cursos || null;

        const defaultApellidos = {
          'Brandon': 'Castillo Vera',
          'Armonía': 'Fuentes Morales',
          'Dami': 'Carrasco Rojas',
          'Isa': 'Sepúlveda Pavez',
          'Ítalo': 'Herrera Silva',
          'Cris': 'Tapia Henríquez',
          'Nicolás': 'Soto González',
          'Tamara': 'Morales Díaz',
          'Lendro': 'Valenzuela Castro',
          'Yohan': 'Díaz Alarcón',
          'Nicole': 'Rojas Méndez',
          'Jesús': 'Alarcón Peña',
          'Andrés': 'Vidal Parra',
          'Pedro': 'Pascal Olea',
          'Brayan': 'Castro Solís'
        };

        const apellidoValido = (p.apellido && p.apellido.trim()) 
          ? p.apellido.trim() 
          : (defaultApellidos[p.nombre?.trim()] || 'González');

        const resolvedCursoNombre = cObj?.nombre_completo || 
          (cObj?.nivel && cObj?.letra ? `${cObj.nivel} ${cObj.letra}` : null) || 
          (p.curso_id ? 'Curso Asignado' : '1° Básico A');

        const resolvedCursoNivel = cObj?.nivel || (resolvedCursoNombre ? resolvedCursoNombre.replace(/\s+[A-D]$/, '') : '1° Básico');
        const resolvedCursoLetra = cObj?.letra || (resolvedCursoNombre && /[A-D]$/.test(resolvedCursoNombre) ? resolvedCursoNombre.slice(-1) : 'A');

        return {
          id: p.id,
          name: `${p.nombre || ''} ${apellidoValido}`.trim() || 'Estudiante Sin Nombre',
          nombre: p.nombre || '',
          apellido: apellidoValido,
          idSujeto: p.id_sujeto,
          createdAt: p.creado_en,
          colegioId: p.colegio_id || p.institucion_id,
          fechaNacimiento: p.fecha_nacimiento,
          diagnosticoNee: diag,
          tipoNee,
          cursoId: p.curso_id,
          curso: resolvedCursoNombre,
          cursoNombre: resolvedCursoNombre,
          cursoNivel: resolvedCursoNivel,
          cursoLetra: resolvedCursoLetra,
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
      };
    });

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
      // Metadatos de Consentimiento Parental (Ley 21.719 / 21.430)
      tutorNombre: patientData.tutorNombre || null,
      tutorRun: patientData.tutorRun || null,
      tutorEmail: patientData.tutorEmail || null,
      tutorTelefono: patientData.tutorTelefono || null,
      consentimientoParental: Boolean(patientData.consentimientoParental),
      consentimientoFecha: patientData.consentimientoFecha || (patientData.consentimientoParental ? new Date().toISOString() : null),
      consentimientoTipo: patientData.consentimientoTipo || 'formulario_pie',
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

        const institucionId = profile?.institucion_id || profile?.colegio_id || 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08';

        const insertPayload = {
          nombre,
          apellido,
          id_sujeto: patientData.idSujeto || null,
          institucion_id: institucionId,
          curso_id: patientData.cursoId || null,
          diagnostico_principal: patientData.diagnosticoNee || patientData.diagnosticoPrincipal || null,
          fecha_nacimiento: patientData.fechaNacimiento || null,
          tutor_nombre: newPatient.tutorNombre,
          tutor_run: newPatient.tutorRun,
          tutor_email: newPatient.tutorEmail,
          tutor_telefono: newPatient.tutorTelefono,
          consentimiento_parental: newPatient.consentimientoParental,
          consentimiento_fecha: newPatient.consentimientoFecha,
          consentimiento_tipo: newPatient.consentimientoTipo,
          activo: true
        };

        let { data, error } = await supabase
          .from('pacientes')
          .insert([insertPayload])
          .select()
          .single();

        // Fallback resiliente: Si Supabase aún no tiene las nuevas columnas de tutor, reintentar con esquema base
        if (error && (error.message?.includes('column') || error.message?.includes('does not exist') || error.message?.includes('tutor'))) {
          console.warn('[usePatientsDB] Esquema previo detectado en Supabase, reintentando inserción sin campos de tutor...');
          const fallbackPayload = {
            nombre,
            apellido,
            id_sujeto: patientData.idSujeto || null,
            institucion_id: institucionId,
            curso_id: patientData.cursoId || null,
            diagnostico_principal: patientData.diagnosticoNee || patientData.diagnosticoPrincipal || null,
            fecha_nacimiento: patientData.fechaNacimiento || null,
            activo: true
          };
          const retry = await supabase.from('pacientes').insert([fallbackPayload]).select().single();
          data = retry.data;
          error = retry.error;
        }

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
            intento_valido: sessionData.intentoValido !== false
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
    if (!id) return null;
    const strId = String(id).trim();
    const decodedId = decodeURIComponent(strId);
    return patients.find(p => 
      String(p.id).trim() === strId || 
      String(p.id).trim() === decodedId ||
      (p.idSujeto && String(p.idSujeto).trim().toLowerCase() === decodedId.toLowerCase()) ||
      (p.id_sujeto && String(p.id_sujeto).trim().toLowerCase() === decodedId.toLowerCase()) ||
      (p.name && p.name.trim().toLowerCase() === decodedId.toLowerCase())
    ) || null;
  }, [patients]);

  const updatePatient = async (id, updates) => {
    // 1. Update local state immediately
    setPatients(prev => prev.map(p => {
      if (String(p.id) !== String(id)) return p;
      return { ...p, ...updates };
    }));

    // 2. Update localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognimirror_offline_patients');
      if (stored) {
        try {
          const current = JSON.parse(stored);
          localStorage.setItem(
            'cognimirror_offline_patients',
            JSON.stringify(current.map(p => String(p.id) === String(id) ? { ...p, ...updates } : p))
          );
        } catch (e) {}
      }
    }

    // 3. Persist to Supabase if online and not a local-only patient
    if (typeof window !== 'undefined' && navigator.onLine && user && !String(id).startsWith('local-')) {
      try {
        const dbUpdates = {};
        if (updates.fechaNacimiento !== undefined) dbUpdates.fecha_nacimiento = updates.fechaNacimiento || null;
        if (updates.diagnosticoNee !== undefined) dbUpdates.diagnostico_nee = updates.diagnosticoNee || null;
        if (updates.historialClinico !== undefined) dbUpdates.historial_clinico = updates.historialClinico || [];
        if (updates.nombre !== undefined) dbUpdates.nombre = updates.nombre;
        if (updates.apellido !== undefined) dbUpdates.apellido = updates.apellido;
        if (updates.cursoId !== undefined) dbUpdates.curso_id = updates.cursoId;
        // Metadatos de Consentimiento Legal
        if (updates.tutorNombre !== undefined) dbUpdates.tutor_nombre = updates.tutorNombre;
        if (updates.tutorRun !== undefined) dbUpdates.tutor_run = updates.tutorRun;
        if (updates.tutorEmail !== undefined) dbUpdates.tutor_email = updates.tutorEmail;
        if (updates.tutorTelefono !== undefined) dbUpdates.tutor_telefono = updates.tutorTelefono;
        if (updates.consentimientoParental !== undefined) dbUpdates.consentimiento_parental = updates.consentimientoParental;
        if (updates.consentimientoFecha !== undefined) dbUpdates.consentimiento_fecha = updates.consentimientoFecha;
        if (updates.consentimientoTipo !== undefined) dbUpdates.consentimiento_tipo = updates.consentimientoTipo;

        if (Object.keys(dbUpdates).length > 0) {
          let { error } = await supabase
            .from('pacientes')
            .update(dbUpdates)
            .eq('id', id);

          // Si falla porque las columnas nuevas no están creadas en Supabase, reintentar solo con columnas base
          if (error && (error.message?.includes('column') || error.message?.includes('does not exist') || error.message?.includes('tutor'))) {
            console.warn('[usePatientsDB] Esquema base detectado en updatePatient, reintentando sin campos de tutor...');
            delete dbUpdates.tutor_nombre;
            delete dbUpdates.tutor_run;
            delete dbUpdates.tutor_email;
            delete dbUpdates.tutor_telefono;
            delete dbUpdates.consentimiento_parental;
            delete dbUpdates.consentimiento_fecha;
            delete dbUpdates.consentimiento_tipo;
            if (Object.keys(dbUpdates).length > 0) {
              const retry = await supabase.from('pacientes').update(dbUpdates).eq('id', id);
              error = retry.error;
            } else {
              error = null;
            }
          }

          if (error) {
            console.warn('[usePatientsDB] updatePatient Supabase error:', error.message);
            return false;
          }
        }
        return true;
      } catch (e) {
        console.warn('[usePatientsDB] updatePatient error:', e.message);
        return false;
      }
    }
    return true;
  };

  const deletePatient = async (id) => {
    setPatients(prev => prev.filter(p => String(p.id) !== String(id)));
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognimirror_offline_patients');
      if (stored) {
        const current = JSON.parse(stored);
        localStorage.setItem('cognimirror_offline_patients', JSON.stringify(current.filter(p => String(p.id) !== String(id))));
      }
    }
    if (!String(id).startsWith('local-')) {
      await supabase.from('pacientes').delete().eq('id', id);
    }
  };

  /**
   * Eliminación Total e Irreversible de Historial por Ejercicio de Derechos ARCO (Ley 21.719)
   * Purga datos de sesiones, check-ins, telemetría y ficha, con constancia inmutable en auditoría.
   */
  const purgePatientArco = async (id, reason = 'Solicitud de Padre/Tutor Legal bajo Derechos ARCO Ley 21.719') => {
    // 1. Eliminar sesiones y telemetría asociadas en Supabase
    if (!String(id).startsWith('local-')) {
      try {
        await supabase.from('sesiones_clinicas').delete().eq('id_paciente', id);
        await supabase.from('sesiones_evaluacion').delete().eq('paciente_id', id);
        await supabase.from('pacientes').delete().eq('id', id);

        // Registro de Auditoría Inmutable obligatorio (Ley 21.663)
        await supabase.from('trazabilidad_auditoria').insert([{
          institucion_id: profile?.institucion_id || profile?.colegio_id,
          usuario_id: user?.id && !user.id.startsWith('service') ? user.id : null,
          usuario_email: user?.email || 'evaluador@cognimirror.cl',
          usuario_rol: profile?.rol || 'profesional',
          accion: 'DERECHOS_ARCO_SUPRESION_TOTAL',
          entidad_afectada: 'pacientes',
          entidad_id: !String(id).startsWith('local-') ? id : null,
          detalles: {
            motivo_legal: reason,
            normativa: 'Ley 21.719 Derechos ARCO (Cancelación y Olvido Digital)',
            resultado: 'Eliminación irreversible de telemetría e historial de aprendizaje completada',
            fecha: new Date().toISOString()
          }
        }]);
      } catch (err) {
        console.warn('[usePatientsDB] Error en purga ARCO Supabase:', err.message);
      }
    }

    // 2. Limpiar de almacenamiento local (pacientes y checkins diarios)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cognimirror_offline_patients');
        if (stored) {
          const current = JSON.parse(stored);
          localStorage.setItem('cognimirror_offline_patients', JSON.stringify(current.filter(p => String(p.id) !== String(id))));
        }
        const checkins = localStorage.getItem('cognimirror_daily_checkins');
        if (checkins) {
          const parsed = JSON.parse(checkins);
          localStorage.setItem('cognimirror_daily_checkins', JSON.stringify(parsed.filter(c => c.studentId !== id && c.id_paciente !== id)));
        }
      } catch (_) {}
    }

    // 3. Actualizar estado en memoria
    setPatients(prev => prev.filter(p => String(p.id) !== String(id)));
    return true;
  };

  return {
    patients,
    cursos,
    activePatientId,
    setActivePatientId,
    loadingPatients,
    addPatient,
    createPatient,
    addSession,
    saveSession: addSession,
    deleteSession,
    getPatient,
    updatePatient,
    deletePatient,
    purgePatientArco,
    refreshData: fetchPatients,
    refetchPatients: fetchPatients
  };
}
