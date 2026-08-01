'use client'; // Necesario en Next.js App Router

import ReactionGame from './ReactionGame';
import ExecutiveReport from './ExecutiveReport';
import ReactionDashboard from './ReactionDashboard';
import OnboardingForm from './OnboardingForm';
import TutorialPhase from './TutorialPhase';
import Cube3DViewer from './Cube3DViewer';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PasscodeModal from './PasscodeModal';
import { usePatientsDB } from '../hooks/usePatientsDB';
import PatientSelector from './PatientSelector';
import ConfirmModal from './ConfirmModal';
import PatientEvolutionDashboard from './PatientEvolutionDashboard';
import { Zap } from 'lucide-react';

function CountdownPhase({ onComplete }) {
  const [phase, setPhase] = useState('waiting');
  const [count, setCount] = useState(3);
  const { subscribeToMoves } = useBluetoothCube();
  const moveHistory = useRef([]);

  useEffect(() => {
    if (phase !== 'counting') return;
    if (count === 0) {
      const timer = setTimeout(() => onComplete(), 600);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, phase, onComplete]);

  useEffect(() => {
    if (phase === 'counting') return;
    const unsub = subscribeToMoves((movimiento) => {
      const now = Date.now();
      moveHistory.current.push({ m: movimiento, t: now });
      moveHistory.current = moveHistory.current.filter(x => now - x.t < 3500);

      const lTotal = moveHistory.current.filter(x => x.m === 'L' || x.m === "L'").length;
      const isL2 = movimiento === 'L2' || movimiento === "L2'" || lTotal >= 2;

      if (isL2) {
        setPhase('counting');
      }
    });
    return unsub;
  }, [subscribeToMoves, phase]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') setPhase('counting');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-[100dvh] py-12 overflow-y-auto overflow-x-hidden bg-[#07080f]/95 text-white absolute inset-0 z-50">
      <div className="text-center flex flex-col items-center my-auto">
        {phase === 'waiting' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full max-w-2xl px-4"
          >
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-[0.1em] mb-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              REGLAS DEL TEST
            </h1>

            <div className="w-full flex flex-col gap-4 mb-10">
              {/* Regla Naranjo */}
              <div className="flex items-center gap-6 bg-[#111218] border border-white/5 rounded-2xl p-5 shadow-lg">
                <div className="w-14 h-14 rounded-xl bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] flex-shrink-0" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-orange-500 font-black tracking-widest uppercase mb-1">SI ES NARANJO</span>
                  <span className="text-white/60 text-sm font-medium">Gira la cara NARANJA (Derecha) lo más rápido posible.</span>
                </div>
              </div>

              {/* Regla Rojo */}
              <div className="flex items-center gap-6 bg-[#111218] border border-white/5 rounded-2xl p-5 shadow-lg">
                <div className="w-14 h-14 rounded-xl bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex-shrink-0" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-red-500 font-black tracking-widest uppercase mb-1">SI ES ROJO</span>
                  <span className="text-white/60 text-sm font-medium">Gira la cara ROJA (Izquierda) lo más rápido posible.</span>
                </div>
              </div>

              {/* Regla Otro Color */}
              <div className="flex items-center gap-6 bg-[#111218] border border-white/5 rounded-2xl p-5 shadow-lg">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-blue-300 to-white shadow-[0_0_20px_rgba(147,197,253,0.3)] flex-shrink-0" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-blue-400 font-black tracking-widest uppercase mb-1">SI ES OTRO COLOR (AZUL, BLANCO)</span>
                  <span className="text-white font-black text-sm uppercase">¡NO MUEVAS NADA! INHIBE TU REACCIÓN.</span>
                </div>
              </div>
            </div>

            {/* Confirmación */}
            <div className="w-full bg-[#0a0b10] border border-red-500/20 rounded-2xl p-6 flex flex-col items-center">
              <span className="text-red-500/80 font-black tracking-[0.2em] text-[10px] uppercase mb-2">Confirmar Lectura</span>
              <span className="text-white/80 font-black text-lg md:text-xl uppercase tracking-wide text-center">
                MUEVE 2 VECES LA CARA ROJA (L2)<br/>PARA COMENZAR
              </span>
            </div>
            
            <button onClick={() => setPhase('counting')} className="mt-6 opacity-20 text-[10px] hover:opacity-100 transition-opacity uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full">
              Comenzar Manualmente
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.h1 
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className={`text-[12rem] font-black leading-none drop-shadow-[0_0_40px_rgba(168,85,247,0.5)] ${count === 0 ? 'text-green-400 drop-shadow-[0_0_40px_rgba(74,222,128,0.5)]' : 'text-purple-500'}`}
            >
              {count > 0 ? count : '¡YA!'}
            </motion.h1>
          </AnimatePresence>
        )}
        
        {phase === 'counting' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 bg-white/5 border border-white/10 p-6 rounded-2xl max-w-lg w-full backdrop-blur-md shadow-2xl"
          >
            <p className="text-xs font-black text-white/50 uppercase tracking-[0.3em] mb-4">Preparación Motora</p>
            <p className="text-xl sm:text-2xl font-bold leading-relaxed text-white/90">
              Recuerda: Cara <span className="text-red-400 font-black">ROJA</span> a tu mano <span className="underline decoration-red-400/50 underline-offset-4">Izquierda</span>,<br/>
              Cara <span className="text-orange-400 font-black">NARANJA</span> a tu mano <span className="underline decoration-orange-400/50 underline-offset-4">Derecha</span>.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── ESTADO 1: MENÚ ──────────────────────────────────────────
function StepMenu({ onStartWarmup, onStartOfficial, onHistory, activePatient, setActivePatientId, patients, createPatient }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const {
    isConnected,
    latencyOffset,
  } = useBluetoothCube();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 px-6 text-center">
      {/* Brillo ambiental decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-3 sm:gap-4 scale-90 sm:scale-100">
        <Zap size={64} className="text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Reaction{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            Mirror
          </span>
        </h1>
        <p className="text-white/50 text-sm sm:text-lg max-w-[280px] sm:max-w-sm leading-relaxed">
          Mide tu velocidad de reacción motora y tus funciones ejecutivas en tiempo real.
        </p>
      </div>

      {/* Latency Status Badge */}
      <div className="relative z-10 -mt-4">
        {latencyOffset > 0 ? (
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Offset Calibrado: −{latencyOffset}ms
            </span>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              Sin calibrar (Precisión Estándar)
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">
        <PatientSelector 
          patients={patients}
          onSelect={setActivePatientId}
          onCreate={async (name) => {
            const newP = await createPatient(name);
            if (newP && newP.id) setActivePatientId(newP.id);
          }}
        />

        <div className="flex flex-col gap-4">
          <button
            onClick={onStartWarmup}
            disabled={!activePatient || !acceptedTerms}
            className={`
              relative group px-8 py-5 rounded-2xl font-bold text-lg text-white
              transition-all duration-200 ease-out shadow-[0_0_30px_rgba(249,115,22,0.3)]
              ${(activePatient && acceptedTerms)
                ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] hover:scale-105 active:scale-95 cursor-pointer' 
                : 'bg-white/10 text-white/40 cursor-not-allowed shadow-none'}
            `}
          >
            Modo Calentamiento (15 seg)
            <span className="ml-3 inline-block group-hover:translate-x-1 transition-transform">🔥</span>
          </button>

          <button
            onClick={onStartOfficial}
            disabled={!activePatient || !acceptedTerms}
            className={`
              relative group px-8 py-5 rounded-2xl font-bold text-lg text-white
              transition-all duration-200 ease-out shadow-[0_0_40px_rgba(168,85,247,0.4)]
              ${(activePatient && acceptedTerms)
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95 cursor-pointer' 
                : 'bg-white/10 text-white/40 cursor-not-allowed shadow-none'}
            `}
          >
            Iniciar Evaluación Oficial
            <span className="ml-3 inline-block group-hover:translate-x-1 transition-transform">🚀</span>
          </button>

          <button
            onClick={onHistory}
            className="w-full py-4 rounded-2xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm uppercase tracking-widest border border-white/5 cursor-pointer mt-1"
          >
            📜 Ver Historial Clínico
          </button>
        </div>

        {/* Disclaimer Legal Ley N° 19.628 */}
        <div className="mt-4 flex flex-col items-center max-w-sm mx-auto gap-3 text-left bg-white/5 border border-white/5 p-4 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border border-white/20 bg-white/5 appearance-none checked:bg-purple-600 checked:border-purple-500 relative flex-shrink-0 transition-colors after:content-['✓'] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:text-white after:font-black after:text-[12px] after:opacity-0 checked:after:opacity-100"
            />
            <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
              Comprendo y Acepto
            </span>
          </label>
          <p className="text-[10px] text-gray-500 leading-relaxed text-justify">
            "Al iniciar esta evaluación, autorizo el procesamiento temporal de mis datos para la generación del Reporte Ejecutivo Neuromotriz. Acepto que mis métricas de interacción (milisegundos y patrones de movimiento) sean encriptadas, estrictamente anonimizadas y desvinculadas de mi identidad, para ser utilizadas de forma estadística en la mejora de algoritmos de salud preventiva, en total cumplimiento de la Ley N° 19.628 sobre Protección de la Vida Privada."
          </p>
        </div>
      </div>
    </div>
  );
}

// ── ESTADO: HISTORIAL ──────────────────────────────────────
function StepHistory({ onBack, onOpenReport, onOpenEvolution, patients, deletePatient, deleteSession }) {
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, payload: null });

  const confirmDeleteSession = (patientId, sessionId) => {
    setConfirmModal({
      isOpen: true,
      type: 'session',
      payload: { patientId, sessionId },
      title: 'Eliminar Sesión',
      message: '¿Estás seguro de eliminar este registro? Esta acción es irreversible.'
    });
  };

  const confirmDeletePatient = (patientId, name) => {
    setConfirmModal({
      isOpen: true,
      type: 'patient',
      payload: { patientId },
      title: `Eliminar a ${name}`,
      message: '¿Estás seguro de eliminar este paciente y todas sus sesiones asociadas? Esta acción es irreversible.'
    });
  };

  const handleConfirm = () => {
    if (confirmModal.type === 'session') {
      deleteSession(confirmModal.payload.patientId, confirmModal.payload.sessionId);
    } else if (confirmModal.type === 'patient') {
      deletePatient(confirmModal.payload.patientId);
    }
    setConfirmModal({ isOpen: false, type: null, payload: null });
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-20 max-w-2xl mx-auto w-full relative">
      <div className="flex items-center justify-between w-full mb-8">
        <h2 className="text-3xl font-black text-white">Historial</h2>
      </div>

      <div className="w-full space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {patients.length === 0 ? (
          <p className="text-white/30 text-center py-20">No hay pacientes registrados aún.</p>
        ) : (
          patients.map(patient => (
            <div key={patient.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-bold text-xl">{patient.name}</h3>
                  {patient.sessions.length >= 2 && (
                    <button 
                      onClick={() => onOpenEvolution(patient)}
                      className="px-3 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 hover:text-white rounded-full text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-500/30"
                    >
                      📈 Ver Evolución Clínica
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => confirmDeletePatient(patient.id, patient.name)}
                  className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                  title="Eliminar Paciente"
                >
                  🗑️
                </button>
              </div>
              
              {patient.sessions.length === 0 ? (
                 <p className="text-white/30 text-sm">Sin sesiones.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {patient.sessions.map(session => (
                    <div 
                      key={session.sessionId}
                      className="bg-black/20 p-3 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all group"
                    >
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => onOpenReport({...session, playerName: patient.name, patient})}
                      >
                        <p className="text-white font-semibold text-sm">Intento {session.attemptNumber} <span className="text-purple-400 text-xs ml-2">({session.clinicalLabel})</span></p>
                        <p className="text-white/40 text-[10px] mt-1">{new Date(session.date).toLocaleDateString()} · Promedio: {Math.round((session.stats?.tiempo_promedio_por_mano?.L + session.stats?.tiempo_promedio_por_mano?.R) / 2) || session.stats?.averageReactionTime || 0} ms</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); confirmDeleteSession(patient.id, session.sessionId); }}
                        className="text-red-400/50 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar Sesión"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <button onClick={onBack} className="mt-8 text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs cursor-pointer">
        ← Volver al Menú
      </button>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, payload: null })}
      />
    </div>
  );
}

export default function ReactionGameView({ onExit, onGameReady, subjectId, etiquetaEstudio, isWarmupUrl = false, isDemoMode = false }) {
  const [step, setStep] = useState('menu');
  const [isWarmupMode, setIsWarmupMode] = useState(false);
  
  const {
    patients,
    activePatientId,
    setActivePatientId,
    createPatient,
    addSession,
    deletePatient,
    deleteSession,
    getPatient
  } = usePatientsDB();

  const activePatient = getPatient(activePatientId);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedEvolutionPatient, setSelectedEvolutionPatient] = useState(null);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);



  // Efecto de Auto-onboarding para el Modo Evaluador
  useEffect(() => {
    if (!subjectId || patients.length === 0) return;

    const autoOnboarding = async () => {
      // Evitar bucle si ya está seleccionado
      const currentPatient = getPatient(activePatientId);
      if (currentPatient && currentPatient.idSujeto === subjectId) return;

      // Buscar si el paciente ya existe por su idSujeto
      let p = patients.find(x => x.idSujeto === subjectId);
      
      if (!p) {
        // Intentar buscarlo por nombre por si acaso
        p = patients.find(x => x.name.trim().toLowerCase() === `sujeto ${subjectId}`.toLowerCase());
      }

      if (!p) {
        console.log(`[Evaluador] Creando nuevo perfil para sujeto: ${subjectId}`);
        p = await createPatient(`Sujeto ${subjectId}`, subjectId);
      }

      if (p && p.id) {
        setActivePatientId(p.id);
        setIsWarmupMode(isWarmupUrl);
        setSessionStartTime(Date.now());
        setSessionMeta({
          fatiga: 'No',
          sueno: 'Bueno',
          horasSueno: '8',
          medicamentos: 'No',
          observaciones: isWarmupUrl ? 'Sesión de práctica clínica' : 'Evaluación rápida de estudio'
        });
        setStep('countdown');
      }
    };

    autoOnboarding();
  }, [subjectId, patients, activePatientId, getPatient, createPatient, setActivePatientId, isWarmupUrl]);

  // Seguridad Modo Kiosco
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
  const [onPasscodeSuccess, setOnPasscodeSuccess] = useState(() => () => {});

  const triggerSecurity = (action) => {
    setOnPasscodeSuccess(() => () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cognimirror_kiosco_active');
      }
      action();
    });
    setIsPasscodeOpen(true);
  };

  function handleOpenReport(sessionRecord) {
    setSelectedRecord(sessionRecord);
    setStep('view_report');
  }

  return (
    <div className="relative min-h-screen bg-[#07080f] overflow-hidden font-sans">
      <button
        onClick={() => {
          triggerSecurity(() => {
            if (step === 'view_report' || step === 'patient_evolution' || step === 'history') {
              setStep('menu');
            } else {
              localStorage.removeItem('cognimirror_kiosco_active');
              onExit();
            }
          });
        }}
        className="absolute top-5 left-5 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white/80 text-sm hover:bg-white/5 transition-all duration-150 no-print cursor-pointer"
      >
        ← Volver
      </button>

      {step === 'menu' && (
        <StepMenu 
          onStartWarmup={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('cognimirror_kiosco_active', 'true');
            }
            setIsWarmupMode(true);
            setSessionStartTime(Date.now());
            setStep('countdown');
          }}
          onStartOfficial={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('cognimirror_kiosco_active', 'true');
            }
            setIsWarmupMode(false);
            setSessionStartTime(Date.now());
            setStep('tutorial');
          }} 
          onHistory={() => setStep('history')}
          activePatient={activePatient}
          setActivePatientId={setActivePatientId}
          patients={patients}
          createPatient={createPatient}
        />
      )}

      {step === 'history' && (
        <StepHistory 
          onBack={() => setStep('menu')} 
          onOpenReport={handleOpenReport} 
          onOpenEvolution={(p) => {
            setSelectedEvolutionPatient(p);
            setStep('patient_evolution');
          }}
          patients={patients}
          deletePatient={deletePatient}
          deleteSession={deleteSession}
        />
      )}

      {step === 'patient_evolution' && selectedEvolutionPatient && (
        <PatientEvolutionDashboard 
          patient={selectedEvolutionPatient} 
          onBack={() => triggerSecurity(() => setStep('history'))} 
        />
      )}

      {step === 'view_report' && selectedRecord && (
        <ReactionDashboard
          playerName={selectedRecord.playerName}
          date={selectedRecord.date}
          rawTurnsData={selectedRecord.rawTurnsData}
          latencyOffset={selectedRecord.stats?.latencyOffset || 0}
          onRestart={() => triggerSecurity(() => setStep('menu'))}
          onExit={() => triggerSecurity(() => setStep('history'))}
          recordId={selectedRecord.sessionId}
          attemptNumber={selectedRecord.attemptNumber}
          clinicalLabel={selectedRecord.clinicalLabel}
          patient={selectedRecord.patient}
        />
      )}

      {step === 'tutorial' && (
        <TutorialPhase onCompleteTutorial={() => setStep('questions')} />
      )}
      {step === 'questions' && (
        <OnboardingForm 
          playerName={activePatient?.name || 'Paciente'} 
          onComplete={(data) => { 
            setSessionMeta(data); 
            setStep('countdown'); 
          }} 
        />
      )}
      {step === 'countdown' && (
        <CountdownPhase onComplete={() => setStep('playing')} />
      )}
      {step === 'playing' && (
        <ReactionGame
          onExit={(savedSession, patientObj) => { 
            if (savedSession) {
              setSelectedRecord({ ...savedSession, playerName: activePatient.name, patient: patientObj });
              setStep('view_report');
            } else {
              // Si aborta el juego a mitad de camino, requerir PIN de supervisor
              triggerSecurity(() => {
                localStorage.removeItem('cognimirror_kiosco_active');
                if (subjectId) {
                  window.location.href = `/evaluador?subjectId=${subjectId}`;
                } else {
                  setStep('menu'); 
                }
                setSessionMeta(null);
              });
            }
          }}
          activePatientId={activePatientId}
          addSession={addSession}
          getPatient={getPatient}
          sessionMeta={sessionMeta}
          sessionStartTime={sessionStartTime}
          isWarmup={isWarmupMode}
          isDemoMode={isDemoMode}
          etiquetaEstudio={etiquetaEstudio}
          idSujeto={subjectId}
        />
      )}

      {/* Modal de Kiosco */}
      <PasscodeModal
        isOpen={isPasscodeOpen}
        onClose={() => setIsPasscodeOpen(false)}
        onVerify={onPasscodeSuccess}
      />
    </div>
  );
}
