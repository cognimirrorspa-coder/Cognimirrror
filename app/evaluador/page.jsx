'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabaseClient';
import { usePatientsDB } from '../../hooks/usePatientsDB';
import { Play, AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function EvaluadorPanel() {
  const router = useRouter();
  const { createPatient, patients, refreshData } = usePatientsDB();
  const { signOut } = useAuth();
  const [subjectId, setSubjectId] = useState('S-01');
  const [selectedGame, setSelectedGame] = useState('reaction');
  const [testMode, setTestMode] = useState('official'); // 'official' o 'practice'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [recentSessions, setRecentSessions] = useState([]);
  const [panicLoading, setPanicLoading] = useState(false);

  // Formatear automáticamente a S-XX si ingresa solo números
  const handleSubjectIdChange = (val) => {
    let formatted = val.toUpperCase().trim();
    if (/^\d+$/.test(formatted)) {
      formatted = `S-${formatted.padStart(2, '0')}`;
    }
    setSubjectId(formatted);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Cargar las últimas sesiones para el sujeto ingresado
  const fetchRecentSessions = async (idSujeto) => {
    if (!idSujeto) return;
    try {
      // Buscar paciente
      const { data: paciente, error: errPac } = await supabase
        .from('pacientes')
        .select('id')
        .eq('id_sujeto', idSujeto)
        .maybeSingle();

      if (errPac) throw errPac;

      if (!paciente) {
        // Fallback local: Buscar en la lista de pacientes cargados
        const localP = patients.find(p => p.idSujeto === idSujeto);
        if (localP) {
          const sessionsMapped = localP.sessions.map(s => ({
            id: s.sessionId,
            intento_numero: s.attemptNumber,
            etiqueta_clinica: s.clinicalLabel,
            fecha_sesion: s.date,
            intento_valido: s.intentoValido,
            etiqueta_estudio: s.etiquetaEstudio
          })).slice().reverse().slice(0, 5);
          setRecentSessions(sessionsMapped);
        } else {
          setRecentSessions([]);
        }
        return;
      }

      // Buscar sesiones
      const { data: sesiones, error: errSes } = await supabase
        .from('sesiones_clinicas')
        .select('id, intento_numero, etiqueta_clinica, fecha_sesion, intento_valido, etiqueta_estudio')
        .eq('id_paciente', paciente.id)
        .order('fecha_sesion', { ascending: false })
        .limit(5);

      if (!errSes && sesiones) {
        setRecentSessions(sesiones);
      } else {
        setRecentSessions([]);
      }
    } catch (err) {
      console.warn('Error fetching recent sessions from Supabase, trying offline fallback:', err);
      // Fallback local: Buscar en la lista de pacientes cargados
      const localP = patients.find(p => p.idSujeto === idSujeto);
      if (localP) {
        const sessionsMapped = localP.sessions.map(s => ({
          id: s.sessionId,
          intento_numero: s.attemptNumber,
          etiqueta_clinica: s.clinicalLabel,
          fecha_sesion: s.date,
          intento_valido: s.intentoValido,
          etiqueta_estudio: s.etiquetaEstudio
        })).slice().reverse().slice(0, 5);
        setRecentSessions(sessionsMapped);
      } else {
        setRecentSessions([]);
      }
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRecentSessions(subjectId);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [subjectId, patients]);

  const handleStartTest = async () => {
    if (!subjectId.trim()) {
      setErrorMsg('Por favor ingresa un ID Sujeto válido (ej. S-01).');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let patientUuid = '';

      // 1. Intentar buscar en Supabase
      try {
        let { data: paciente, error: errFind } = await supabase
          .from('pacientes')
          .select('id, nombre, apellido')
          .eq('id_sujeto', subjectId.trim())
          .maybeSingle();

        if (errFind) throw errFind;

        if (!paciente) {
          // 2. Crear de forma automática el paciente si no existe
          console.log(`Creando sujeto autogenerado para: ${subjectId}`);
          const newP = await createPatient(`Sujeto ${subjectId}`, subjectId.trim());
          if (newP) {
            patientUuid = newP.id;
          } else {
            throw new Error('No se pudo crear el perfil del paciente.');
          }
        } else {
          patientUuid = paciente.id;
        }
      } catch (supabaseErr) {
        console.warn('Supabase offline in handleStartTest, falling back to local patients:', supabaseErr);
        // Fallback local
        let localP = patients.find(p => p.idSujeto === subjectId.trim());
        if (!localP) {
          const newP = await createPatient(`Sujeto ${subjectId}`, subjectId.trim());
          if (newP) {
            patientUuid = newP.id;
          } else {
            throw new Error('No se pudo crear el perfil local del paciente.');
          }
        } else {
          patientUuid = localP.id;
        }
      }

      // Refrescar el estado de los pacientes locales en el hook
      await refreshData();

      // 3. Redirigir al juego correspondiente con los query params de estudio o práctica
      const gamePath = selectedGame === 'reaction' ? '/reaction-game' : '/simon-game';
      if (testMode === 'official') {
        router.push(`${gamePath}?subjectId=${subjectId.trim()}&etiquetaEstudio=VALIDACION_JUNIO_2026`);
      } else {
        router.push(`${gamePath}?subjectId=${subjectId.trim()}&warmup=true`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
      setLoading(false);
    }
  };

  const handleAnularIntento = async () => {
    if (!subjectId.trim()) {
      setErrorMsg('Ingresa el ID del Sujeto para anular su último intento.');
      return;
    }

    setPanicLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let success = false;
      let attemptNum = 0;
      let sessionTime = '';

      try {
        // 1. Buscar paciente
        const { data: paciente, error: errPac } = await supabase
          .from('pacientes')
          .select('id')
          .eq('id_sujeto', subjectId.trim())
          .maybeSingle();

        if (errPac) throw errPac;
        
        if (paciente) {
          // 2. Buscar su última sesión
          const { data: sesiones, error: errSes } = await supabase
            .from('sesiones_clinicas')
            .select('id, intento_numero, fecha_sesion')
            .eq('id_paciente', paciente.id)
            .order('fecha_sesion', { ascending: false })
            .limit(1);

          if (errSes) throw errSes;

          if (sesiones && sesiones.length > 0) {
            const ultimaSesion = sesiones[0];
            // 3. Marcar intento_valido = false
            const { error: errUpd } = await supabase
              .from('sesiones_clinicas')
              .update({ intento_valido: false })
              .eq('id', ultimaSesion.id);

            if (errUpd) throw errUpd;

            attemptNum = ultimaSesion.intento_numero;
            sessionTime = new Date(ultimaSesion.fecha_sesion).toLocaleTimeString();
            success = true;
          }
        }
      } catch (supabaseErr) {
        console.warn('Supabase error in handleAnularIntento, doing local-only cancellation:', supabaseErr);
      }

      // Si no se pudo en Supabase o falló la conexión, anular localmente
      if (!success) {
        const localP = patients.find(p => p.idSujeto === subjectId.trim());
        if (!localP || localP.sessions.length === 0) {
          setErrorMsg(`No se encontraron sesiones locales para el sujeto ${subjectId} para anular.`);
          setPanicLoading(false);
          return;
        }

        // El último intento local
        const ultimaSes = localP.sessions[localP.sessions.length - 1];
        
        // Modificar el estado local
        localP.sessions[localP.sessions.length - 1].intentoValido = false;
        
        // Guardar la actualización en local storage
        if (typeof window !== 'undefined') {
          const updatedPatients = patients.map(p => p.id === localP.id ? localP : p);
          localStorage.setItem('cognimirror_offline_patients', JSON.stringify(updatedPatients));
        }

        attemptNum = ultimaSes.attemptNumber;
        sessionTime = new Date(ultimaSes.date).toLocaleTimeString();
        success = true;
      }

      setSuccessMsg(`¡Botón de Pánico Activado! El Intento N° ${attemptNum} realizado a las ${sessionTime} fue ANULADO con éxito (marcado como inválido localmente).`);
      
      // Actualizar listado y base de datos local
      await refreshData();
      fetchRecentSessions(subjectId);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error al procesar la anulación.');
    } finally {
      setPanicLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06070c] text-slate-100 font-sans relative overflow-x-hidden flex flex-col justify-between py-12 px-6">
      {/* Brillo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-600/10 blur-[130px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="max-w-xl mx-auto w-full relative z-10 flex-1 flex flex-col justify-center">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-between items-center w-full mb-6">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/30 hover:text-white text-xs tracking-widest uppercase font-bold transition-colors">
              <ArrowLeft size={12} /> Volver al Panel General
            </Link>
            <button 
              onClick={signOut} 
              className="inline-flex items-center gap-2 text-red-400/60 hover:text-red-400 text-xs tracking-widest uppercase font-bold transition-colors bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 px-3 py-1.5 rounded"
            >
              🔒 Cerrar Sesión
            </button>
          </div>
          <div className="flex justify-center items-center gap-3 text-3xl font-black text-white tracking-tight">
            <span>🧊</span>
            <span>Cogni<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Mirror</span></span>
          </div>
          <h1 className="text-sm font-black tracking-[0.3em] text-white/40 uppercase mt-2">
            Módulo Evaluador Clínico
          </h1>
        </div>

        {/* Panel Principal Glassmorphic */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl flex flex-col gap-6">
          
          {/* Campo de ID Sujeto */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Identificador del Sujeto (Excel ID)
            </label>
            <input 
              type="text"
              value={subjectId}
              onChange={(e) => handleSubjectIdChange(e.target.value)}
              placeholder="Ej: S-01"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-2xl font-mono text-center text-white focus:outline-none focus:border-purple-500 transition-all uppercase placeholder:text-white/10 tracking-widest font-black"
              autoFocus
            />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Tip: Escribe solo el número (ej: <span className="font-mono text-purple-400">1</span>) y se autocompletará como <span className="font-mono text-purple-400">S-01</span>.
            </p>
          </div>

          {/* Selección de Juego */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Seleccionar Test Cognitivo
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Opción Reaction */}
              <div 
                onClick={() => setSelectedGame('reaction')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedGame === 'reaction'
                    ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.02]'
                    : 'bg-black/30 border-white/5 hover:bg-white/[0.02] opacity-60 hover:opacity-100'
                }`}
              >
                <span className="text-3xl">⚡</span>
                <div className="text-center">
                  <p className="text-xs font-bold text-white">Reaction Mirror</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Reacción e Inhibición</p>
                </div>
              </div>

              {/* Opción Memory */}
              <div 
                onClick={() => setSelectedGame('memory')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedGame === 'memory'
                    ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] scale-[1.02]'
                    : 'bg-black/30 border-white/5 hover:bg-white/[0.02] opacity-60 hover:opacity-100'
                }`}
              >
                <span className="text-3xl">🧬</span>
                <div className="text-center">
                  <p className="text-xs font-bold text-white">Memory Mirror</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Memoria Visoespacial</p>
                </div>
              </div>
            </div>
          </div>

          {/* Modalidad de Prueba */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Modalidad de la Evaluación
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Opción Oficial */}
              <div 
                onClick={() => setTestMode('official')}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  testMode === 'official'
                    ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] scale-[1.01]'
                    : 'bg-black/30 border-white/5 hover:bg-white/[0.02] opacity-65 hover:opacity-100'
                }`}
              >
                <span className="text-2xl">🚀</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Evaluación Oficial</p>
                  <p className="text-[8px] text-purple-400 font-black uppercase tracking-wider mt-0.5">Sincroniza en Supabase</p>
                </div>
              </div>

              {/* Opción Práctica */}
              <div 
                onClick={() => setTestMode('practice')}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  testMode === 'practice'
                    ? 'bg-gradient-to-r from-orange-900/30 to-amber-900/30 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-[1.01]'
                    : 'bg-black/30 border-white/5 hover:bg-white/[0.02] opacity-65 hover:opacity-100'
                }`}
              >
                <span className="text-2xl">🔥</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Ensayo / Práctica</p>
                  <p className="text-[8px] text-orange-400 font-black uppercase tracking-wider mt-0.5">Sin persistencia (Local)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback de Estado */}
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold leading-relaxed">
              ✅ {successMsg}
            </div>
          )}

          {/* Botón Iniciar Módulo */}
          <button
            onClick={handleStartTest}
            disabled={loading || !subjectId.trim()}
            className={`
              w-full py-5 rounded-xl font-black text-lg text-white tracking-wider uppercase
              flex items-center justify-center gap-3 transition-all duration-300
              ${loading || !subjectId.trim()
                ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-95 cursor-pointer border border-purple-500/20'}
            `}
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Cargando Módulo...
              </>
            ) : (
              <>
                <Play size={20} className="fill-current" />
                Iniciar Módulo CogniMirror
              </>
            )}
          </button>

          {/* Línea divisoria */}
          <div className="h-px bg-white/10 my-2" />

          {/* Botón de Pánico [Anular Intento] */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Zona de Control de Errores
              </span>
            </div>
            
            <button
              onClick={handleAnularIntento}
              disabled={panicLoading || !subjectId.trim()}
              className={`
                w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase
                flex items-center justify-center gap-2 transition-all duration-200 border
                ${panicLoading || !subjectId.trim()
                  ? 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'
                  : 'bg-red-500/10 hover:bg-red-600 border-red-500/30 hover:border-red-600 text-red-400 hover:text-white cursor-pointer active:scale-98'}
              `}
            >
              {panicLoading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                '⚠️ Anular Último Intento'
              )}
            </button>
            <p className="text-[9px] text-slate-500 text-center leading-relaxed px-4">
              Presiona este botón si el sujeto cometió un error metodológico, el sensor falló, o el intento debe descartarse para el estudio. Se marcará como no válido en Supabase.
            </p>
          </div>

        </div>

        {/* Últimos Intentos del Sujeto */}
        {recentSessions.length > 0 && (
          <div className="mt-8 bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center justify-between">
              <span>Historial del Sujeto ({subjectId})</span>
              <span className="text-[10px] font-mono text-purple-400">Estudio: VALIDACION_JUNIO_2026</span>
            </h3>
            <div className="flex flex-col gap-2.5">
              {recentSessions.map((s) => (
                <div 
                  key={s.id} 
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                    s.intento_valido !== false 
                      ? 'bg-black/20 border-white/5 text-slate-300' 
                      : 'bg-red-500/5 border-red-500/20 text-red-400/80 line-through'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">
                      Intento N° {s.intento_numero} ({s.etiqueta_clinica})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(s.fecha_sesion).toLocaleDateString()} · {new Date(s.fecha_sesion).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {s.intento_valido !== false ? (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
                        <CheckCircle2 size={10} /> Válido
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
                        <XCircle size={10} /> Anulado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      
      {/* Footer Leyenda */}
      <footer className="text-center text-[10px] text-slate-600 mt-10 max-w-sm mx-auto leading-relaxed">
        Desarrollado para la validación clínica CogniMirror. Cruce con Gold Standard automatizado vía ID Sujeto.
      </footer>
    </div>
  );
}
