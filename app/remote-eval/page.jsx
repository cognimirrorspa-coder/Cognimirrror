'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabaseClient';
import { usePatientsDB } from '../../hooks/usePatientsDB';
import { useBluetoothCube } from '../../contexts/BluetoothContext';
import ReactionGame from '../../components/ReactionGame';
import SimonGame from '../../components/SimonGame';
import { Link2, AlertTriangle, ShieldCheck, Bluetooth, Activity, Wifi, Zap } from 'lucide-react';

function RemoteEvalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { addSession, getPatient } = usePatientsDB();
  const { isConnected, device, openScanner, broadcastMove, subscribeToGyro, subscribeToMoves } = useBluetoothCube();

  // Verification States
  const [verifying, setVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [evalRecord, setEvalRecord] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Game Play States
  const [step, setStep] = useState('welcome'); // welcome, instructions, playing, completed
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentTestType, setCurrentTestType] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const channelRef = useRef(null);
  const lastTelemetryRef = useRef(null);
  const isSubscribedRef = useRef(false);

  // Keyboard Simulation helper
  useEffect(() => {
    const handleKeys = (e) => {
      if (step !== 'playing') return;
      const keyUpper = e.key.toUpperCase();
      let face = null;

      if (e.key === 'ArrowRight' || keyUpper === 'L') face = 'R';
      else if (e.key === 'ArrowLeft' || keyUpper === 'A') face = 'L';
      else if (e.key === 'ArrowUp' || keyUpper === 'U') face = 'U';
      else if (e.key === 'ArrowDown' || keyUpper === 'D') face = 'D';
      else if (e.key === ' ' || e.key === 'Enter' || keyUpper === 'F') face = 'F';
      else if (keyUpper === 'B') face = 'B';

      if (face) {
        broadcastMove(face);
        if (channelRef.current && isSubscribedRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'move',
            payload: { notation: face }
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [step, broadcastMove]);

  // Verify the Magic Link Token
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setIsValid(false);
      setErrorMsg('Token de acceso no proporcionado. Verifica el enlace enviado por tu psicólogo.');
      return;
    }

    if (token === 'demo-token') {
      setIsValid(true);
      setEvalRecord({
        id: 'demo-eval-id',
        token: 'demo-token',
        activo: true,
        tipo_test: 'reaction',
        expira_en: new Date(Date.now() + 86400000).toISOString()
      });
      setPatientData({
        id: 'demo-patient-id',
        nombre: 'Paciente',
        apellido: 'de Demostración',
        id_sujeto: 'S-DEMO'
      });
      setCurrentTestType('reaction');
      setVerifying(false);
      return;
    }

    async function verify() {
      try {
        const { data, error } = await supabase
          .from('evaluaciones_remotas')
          .select('*, pacientes(*)')
          .eq('token', token)
          .single();

        if (error || !data) {
          setIsValid(false);
          setErrorMsg('El enlace de evaluación no existe o es inválido.');
        } else if (!data.activo) {
          setIsValid(false);
          setErrorMsg('Este enlace de evaluación ya fue utilizado y se encuentra desactivado.');
        } else if (new Date(data.expira_en) < new Date()) {
          setIsValid(false);
          setErrorMsg('Este enlace ha expirado (validez máxima de 24 horas). Solicita uno nuevo.');
        } else {
          setIsValid(true);
          setEvalRecord(data);
          setPatientData(data.pacientes);
          setCurrentTestType(data.tipo_test);
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        setIsValid(false);
        setErrorMsg('Error de conexión con el servidor. Inténtalo de nuevo.');
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [token]);

  // Realtime channel for remote commands
  useEffect(() => {
    if (!token) return;

    const channel = supabase.channel(`eval_${token}`);

    channel.on('broadcast', { event: 'command' }, (event) => {
      const payload = event.payload;
      console.log('Comando remoto recibido:', payload);
      if (payload.type === 'CHANGE_TEST') {
        setCurrentTestType(payload.testType);
        setGameKey(k => k + 1);
      } else if (payload.type === 'START') {
        setSessionStartTime(Date.now());
        setStep('playing');
      } else if (payload.type === 'RESTART') {
        setGameKey(k => k + 1);
      } else if (payload.type === 'CANCEL') {
        setStep('welcome');
      }
    });

    channel.subscribe(async (status, err) => {
      console.log(`[Realtime Alumno] Canal para token ${token} status:`, status, err || '');
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        const tracked = await channel.track({ online: true, device: isConnected ? 'Cubo BLE' : 'Teclado' });
        console.log('[Realtime Alumno] Presence track result:', tracked);

        // Send queued telemetry if it exists
        if (lastTelemetryRef.current) {
          channel.send({
            type: 'broadcast',
            event: 'telemetry',
            payload: lastTelemetryRef.current
          });
          console.log('[Realtime Alumno] Telemetría inicial enviada');
        }
      } else {
        isSubscribedRef.current = false;
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      isSubscribedRef.current = false;
    };
  }, [token]);

  // Actualizar presencia al conectar/desconectar el cubo por BLE
  useEffect(() => {
    if (channelRef.current && isSubscribedRef.current) {
      channelRef.current.track({ online: true, device: isConnected ? 'Cubo BLE' : 'Teclado' });
      console.log('[Realtime Alumno] Presence track actualizado para dispositivo:', isConnected ? 'Cubo BLE' : 'Teclado');
    }
  }, [isConnected]);

  // Realtime broadcast for gyro and BLE moves
  useEffect(() => {
    if (!channelRef.current || !isConnected) return;

    const unsubscribeGyro = subscribeToGyro((data) => {
      if (channelRef.current && isSubscribedRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'gyro',
          payload: data
        });
      }
    });

    const unsubscribeMoves = subscribeToMoves((notation) => {
      if (channelRef.current && isSubscribedRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'move',
          payload: { notation }
        });
      }
    });

    return () => {
      unsubscribeGyro();
      unsubscribeMoves();
    };
  }, [isConnected, subscribeToGyro, subscribeToMoves]);

  const handleTelemetryUpdate = (data) => {
    lastTelemetryRef.current = data;
    if (channelRef.current && isSubscribedRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'telemetry',
        payload: data
      });
    }
  };

  // Complete Remote Session and Revoke Token
  const handleFinishRemoteTest = async (testType, stats, telemetry, savedSessionId = null) => {
    try {
      console.log('[Realtime Alumno] Finalizando test. Sesión guardada ID:', savedSessionId);
      if (channelRef.current && isSubscribedRef.current && savedSessionId) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'finished_session',
          payload: { sessionId: savedSessionId }
        });
        console.log('[Realtime Alumno] Evento finished_session enviado');
      }

      // 1. Invalidate Token in DB
      await supabase
        .from('evaluaciones_remotas')
        .update({ activo: false })
        .eq('id', evalRecord.id);

      // 2. Sincronización final exitosa
      setStep('completed');
    } catch (err) {
      console.error('Error completing remote test:', err);
      // Even if invalidation fails, let the student know they finished
      setStep('completed');
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#07080f] flex flex-col items-center justify-center font-sans text-white">
        <div className="animate-spin inline-block w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-white/50 tracking-widest uppercase font-mono animate-pulse">
          Validando token de seguridad...
        </p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center font-sans px-6">
        <div className="relative w-full max-w-md bg-[#13161e] border border-white/5 p-8 rounded-3xl text-center shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500" />
          <AlertTriangle className="mx-auto text-red-500 mb-6" size={48} />
          <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-4">Acceso Denegado</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">{errorMsg}</p>
          <div className="text-[10px] text-white/20 font-mono tracking-wider uppercase">
            CogniMirror Secure Link System
          </div>
        </div>
      </div>
    );
  }

  const testName = currentTestType === 'reaction' ? 'Reaction Mirror (Test de Reacción)' : 'Memory Mirror (Simón Dice)';
  const testDesc = currentTestType === 'reaction' 
    ? 'Mide tus reflejos cognitivos y control de impulsos. Gira el color indicado o inhibe la acción.'
    : 'Prueba de retención espacial. Observa y memoriza el patrón de colores que realiza el gemelo digital.';

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-200 font-sans flex flex-col relative overflow-hidden select-none">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1d4ed8/10_0%,transparent_70%)] pointer-events-none" />

      {/* STEP 1: WELCOME SCREEN */}
      {step === 'welcome' && (
        <div className="my-auto mx-auto w-full max-w-xl p-4 sm:p-8 relative z-10">
          <div className="bg-[#13161e] border border-white/5 p-5 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
            
            {/* Tag */}
            <span className="px-3 py-1 bg-cyan-950/40 text-cyan-400 border border-cyan-800/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              Programa de Integración Escolar (PIE)
            </span>

            <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
              Evaluación Remota
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              Hola, <strong className="text-white">{patientData.nombre}</strong>. Tu especialista te ha asignado una prueba cognitiva interactiva.
            </p>

            {/* Test Card */}
            <div className="w-full bg-black/40 border border-white/5 p-4 sm:p-6 rounded-2xl text-left mb-8 flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center rounded-xl text-cyan-400 flex-shrink-0">
                {currentTestType === 'reaction' ? <Zap size={24} /> : <Activity size={24} />}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">{testName}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{testDesc}</p>
              </div>
            </div>

            {/* Connection Area */}
            <div className="w-full flex flex-col gap-4 mb-8">
              <button 
                onClick={openScanner}
                className={`w-full py-4.5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest border transition-all ${
                  isConnected 
                    ? 'bg-green-950/20 border-green-800 text-green-400' 
                    : 'bg-cyan-500 text-black border-transparent hover:bg-cyan-400 hover:scale-[1.02]'
                }`}
              >
                <Bluetooth size={16} className={isConnected ? 'text-green-400' : 'text-black'} />
                {isConnected ? `Conectado: ${device}` : 'Conectar Cubo Inteligente'}
              </button>

              {!isConnected && (
                <div className="text-[10px] text-slate-500 leading-relaxed">
                  * Si no cuentas con el Cubo físico a mano, puedes usar el teclado de tu PC como control alternativo (teclas <strong>U, D, R, L, F</strong>).
                </div>
              )}
            </div>

            <button
              onClick={() => setStep('instructions')}
              className="px-8 py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg"
            >
              Comenzar Evaluación
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: RULES / INSTRUCTIONS */}
      {step === 'instructions' && (
        <div className="my-auto mx-auto w-full max-w-xl p-4 sm:p-8 relative z-10">
          <div className="bg-[#13161e] border border-white/5 p-5 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-6">Reglas Generales</h2>
            
            <div className="w-full flex flex-col gap-4 text-left text-sm text-slate-400 leading-relaxed mb-8">
              {currentTestType === 'reaction' ? (
                <>
                  <div className="flex gap-4 items-center p-3 bg-black/30 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded bg-red-500 flex-shrink-0" />
                    <p className="text-xs">Si la pantalla se enciende <strong className="text-white">ROJO</strong>, gira el lado <strong className="text-white">IZQUIERDO</strong> del cubo (Cara Roja) o pulsa <strong>L</strong>.</p>
                  </div>
                  <div className="flex gap-4 items-center p-3 bg-black/30 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded bg-orange-500 flex-shrink-0" />
                    <p className="text-xs">Si la pantalla se enciende <strong className="text-white">NARANJO</strong>, gira el lado <strong className="text-white">DERECHO</strong> (Cara Naranja) o pulsa <strong>R</strong>.</p>
                  </div>
                  <div className="flex gap-4 items-center p-3 bg-black/30 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded bg-blue-600 flex-shrink-0" />
                    <p className="text-xs">Si es <strong className="text-white">OTRO COLOR</strong>, mantén el cubo quieto. <strong className="text-white">¡No gires nada!</strong></p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-4 items-start p-3 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-xl flex-shrink-0">👁️</span>
                    <p className="text-xs">Observa atentamente el gemelo digital en pantalla para memorizar la secuencia que se enciende.</p>
                  </div>
                  <div className="flex gap-4 items-start p-3 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-xl flex-shrink-0">🧩</span>
                    <p className="text-xs">Replica el patrón exacto en el mismo orden usando las caras correspondientes del cubo inteligente o tu teclado.</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => {
                setSessionStartTime(Date.now());
                setStep('playing');
              }}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg"
            >
              Iniciar Prueba Real
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: THE GAME PLAY */}
      {step === 'playing' && (
        <div className="flex-1 flex flex-col relative">
          {currentTestType === 'reaction' ? (
            <ReactionGame
              key={gameKey}
              activePatientId={patientData.id}
              addSession={async (patId, sessionData) => {
                // Intercept and enrich with remote tag
                const enrichedData = {
                  ...sessionData,
                  clinicalLabel: 'Evaluación Remota',
                  etiquetaEstudio: 'EVALUACION_REMOTE_PIE'
                };
                const saved = await addSession(patId, enrichedData);
                return saved;
              }}
              getPatient={getPatient}
              sessionMeta={{ attemptNumber: 1, clinicalLabel: 'Evaluación Remota' }}
              sessionStartTime={sessionStartTime}
              isWarmup={false}
              etiquetaEstudio="EVALUACION_REMOTE_PIE"
              idSujeto={patientData.id_sujeto}
              onExit={async (savedSession) => {
                if (savedSession) {
                  await handleFinishRemoteTest('reaction', savedSession.stats, savedSession.rawTurnsData, savedSession.id);
                } else {
                  setStep('welcome');
                }
              }}
              onTelemetryUpdate={handleTelemetryUpdate}
            />
          ) : (
            <SimonGame
              key={gameKey}
              playerName={patientData.nombre}
              sessionMeta={{ attemptNumber: 1, clinicalLabel: 'Evaluación Remota' }}
              sessionStartTime={sessionStartTime}
              onExit={async (record) => {
                if (record) {
                  // Save memory session clinical data
                  const saved = await addSession(patientData.id, {
                    testType: 'memory',
                    attemptNumber: 1,
                    clinicalLabel: 'Evaluación Remota',
                    etiquetaEstudio: 'EVALUACION_REMOTE_PIE',
                    idSujeto: patientData.id_sujeto,
                    stats: record.metrics,
                    telemetry: record.telemetry,
                    date: new Date().toISOString()
                  });
                  await handleFinishRemoteTest('memory', record.metrics, record.telemetry, saved?.id);
                } else {
                  setStep('welcome');
                }
              }}
              onTelemetryUpdate={handleTelemetryUpdate}
            />
          )}
        </div>
      )}

      {/* STEP 4: COMPLETED SCREEN */}
      {step === 'completed' && (
        <div className="my-auto mx-auto w-full max-w-md p-4 sm:p-8 relative z-10 animate-fade-in">
          <div className="bg-[#13161e] border border-white/5 p-5 sm:p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500" />
            <ShieldCheck className="mx-auto text-green-400 mb-6" size={54} />
            <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-4">Evaluación Enviada</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              ¡Muchas gracias, <strong className="text-white">{patientData.nombre}</strong>! Los resultados cuantitativos y de telemetría de tu cubo se han transmitido de manera exitosa y segura a la base de datos de tu especialista.
            </p>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-500 mb-6">
              El enlace temporal ha sido revocado y no se puede reutilizar para resguardar la validez científica del test.
            </div>
            <p className="text-[10px] text-white/20 font-mono tracking-widest uppercase mb-2">
              Seguridad de Datos Ley N° 19.628
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default function RemoteEvalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07080f] flex flex-col items-center justify-center font-sans text-white">
        <div className="animate-spin inline-block w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-white/50 tracking-widest uppercase font-mono animate-pulse">
          Cargando entorno de evaluación remota...
        </p>
      </div>
    }>
      <RemoteEvalContent />
    </Suspense>
  );
}
