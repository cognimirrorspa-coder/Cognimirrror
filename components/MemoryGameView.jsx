'use client';

import { useState, useEffect } from 'react';
import SimonGame from './SimonGame';
import MemoryDashboard from './MemoryDashboard';
import OnboardingForm from './OnboardingForm';
import TutorialPhase from './TutorialPhase';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { motion, AnimatePresence } from 'framer-motion';
import PasscodeModal from './PasscodeModal';
import { usePatientsDB } from '../hooks/usePatientsDB';
import PatientSelector from './PatientSelector';
import ConfirmModal from './ConfirmModal';
import { Brain } from 'lucide-react';

function CountdownPhase({ onComplete }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      const timer = setTimeout(() => onComplete(), 600);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#07080f]/95 text-white absolute inset-0 z-50">
      <div className="text-center flex flex-col items-center">
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
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white/5 border border-white/10 p-6 rounded-2xl max-w-lg w-full backdrop-blur-md shadow-2xl"
        >
          <p className="text-xs font-black text-white/50 uppercase tracking-[0.3em] mb-4">Preparación</p>
          <p className="text-xl sm:text-2xl font-bold leading-relaxed text-white/90">
            Prepárate... Observa atentamente el cubo y memoriza la secuencia de colores.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function StepMenu({ onNext, onHistory, activePatient, setActivePatientId, patients, createPatient }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { isConnected } = useBluetoothCube();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 px-6 text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-3 sm:gap-4 scale-90 sm:scale-100">
        <Brain size={64} className="text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Memory{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            Mirror
          </span>
        </h1>
        <p className="text-white/50 text-sm sm:text-lg max-w-[280px] sm:max-w-sm leading-relaxed">
          Evalúa tu memoria visoespacial de trabajo y precisión de movimiento guiado.
        </p>
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

        <div className="flex flex-col gap-3">
          <button
            onClick={onNext}
            disabled={!activePatient || !acceptedTerms}
            className={`
              relative group px-10 py-5 rounded-2xl font-bold text-xl text-white
              transition-all duration-200 ease-out shadow-[0_0_40px_rgba(168,85,247,0.4)]
              ${(activePatient && acceptedTerms)
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95 cursor-pointer' 
                : 'bg-white/10 text-white/40 cursor-not-allowed shadow-none'}
            `}
          >
            Iniciar Test
            <span className="ml-3 inline-block group-hover:translate-x-1 transition-transform">🚀</span>
          </button>

          <button
            onClick={onHistory}
            className="w-full py-4 rounded-2xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm uppercase tracking-widest border border-white/5 cursor-pointer"
          >
            📜 Ver Historial Clínico
          </button>
        </div>

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
            "Al iniciar esta evaluación, autorizo el procesamiento temporal de mis datos para la generación del Reporte Ejecutivo Neuromotriz. Acepto que mis métricas de interacción sean encriptadas, estrictamente anonimizadas y desvinculadas de mi identidad, para ser utilizadas en total cumplimiento de la Ley N° 19.628 sobre Protección de la Vida Privada."
          </p>
        </div>
      </div>
    </div>
  );
}

function StepHistory({ onBack, onOpenReport, patients, deletePatient, deleteSession }) {
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
                </div>
                <button 
                  onClick={() => confirmDeletePatient(patient.id, patient.name)}
                  className="text-red-500/40 hover:text-red-400 transition-colors p-1"
                  title="Eliminar Paciente"
                >
                  <span className="text-xl">🗑️</span>
                </button>
              </div>

              {patient.sessions.filter(s => s.testType === 'memory').length === 0 ? (
                <p className="text-white/30 text-sm italic">Sin sesiones de Memory Mirror.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {patient.sessions.filter(s => s.testType === 'memory').sort((a, b) => new Date(b.date) - new Date(a.date)).map(session => (
                    <div 
                      key={session.sessionId || session.id}
                      className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 group hover:border-purple-500/30 transition-all cursor-pointer"
                    >
                      <div className="flex-1" onClick={() => onOpenReport({ ...session, playerName: patient.name, patient })}>
                        <p className="text-purple-400 font-black text-sm uppercase tracking-wide">
                          {session.clinicalLabel}
                        </p>
                        <p className="text-white/40 text-xs">
                          {new Date(session.date).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right" onClick={() => onOpenReport({ ...session, playerName: patient.name, patient })}>
                          <p className="text-white font-bold text-sm">Corsi: {session.stats?.maxLevelReached || 2}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirmDeleteSession(patient.id, session.id); }}
                          className="opacity-0 group-hover:opacity-100 text-red-500/40 hover:text-red-400 transition-all p-1"
                        >
                          ✕
                        </button>
                      </div>
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

export default function MemoryGameView({ onExit, subjectId, etiquetaEstudio, isWarmupUrl = false, isDemoMode = false }) {
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

  return (
    <div className="relative min-h-screen bg-[#07080f] overflow-hidden font-sans">
      <button
        onClick={() => {
          triggerSecurity(() => {
            if (step === 'view_report' || step === 'history') {
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
          onNext={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('cognimirror_kiosco_active', 'true');
            }
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
          onOpenReport={(record) => {
            setSelectedRecord(record);
            setStep('view_report');
          }} 
          patients={patients}
          deletePatient={deletePatient}
          deleteSession={deleteSession}
        />
      )}

      {step === 'view_report' && selectedRecord && (
        <MemoryDashboard
          record={selectedRecord}
          onRestart={() => triggerSecurity(() => setStep('menu'))}
          onExit={() => triggerSecurity(() => setStep('history'))}
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
        <SimonGame
          playerName={activePatient?.name || 'Paciente'}
          sessionMeta={sessionMeta}
          sessionStartTime={sessionStartTime}
          isDemoMode={isDemoMode}
          onExit={async (record) => { 
            if (record) {
              const enrichedRecord = { ...record, playerName: activePatient?.name };
              
              if (!isWarmupMode) {
                // Guardar la sesión automáticamente con soporte de estudio y sujeto
                const saved = await addSession(activePatientId, {
                  testType: 'memory',
                  attemptNumber: sessionMeta?.attemptNumber || 1,
                  clinicalLabel: etiquetaEstudio ? 'Evaluación Oficial' : (sessionMeta?.clinicalLabel || 'Línea Base'),
                  etiquetaEstudio: etiquetaEstudio,
                  idSujeto: subjectId || (activePatient?.idSujeto || null),
                  stats: record.metrics,
                  telemetry: record.telemetry,
                  date: new Date().toISOString()
                });
                if (saved && saved.sessionId) {
                  enrichedRecord.sessionId = saved.sessionId;
                }
              } else {
                console.log('[Práctica] Sesión de práctica finalizada. No se guarda en Supabase.');
              }

              setSelectedRecord(enrichedRecord);
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
