'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { useBluetoothCube } from '../../../contexts/BluetoothContext';
import ParticipantForm from '../../../components/admin/evaluator/ParticipantForm';
import BleVerificationCard from '../../../components/admin/evaluator/BleVerificationCard';
import ClinicalTeleprompter from '../../../components/admin/evaluator/ClinicalTeleprompter';
import EvaluatorOfficialBatteriesManager from '../../../components/admin/evaluator/EvaluatorOfficialBatteriesManager';
import SessionSummaryAndSave from '../../../components/admin/evaluator/SessionSummaryAndSave';
import EvaluatedDirectoryAndReports from '../../../components/admin/evaluator/EvaluatedDirectoryAndReports';
import LongitudinalComparisonView from '../../../components/admin/evaluator/LongitudinalComparisonView';

import { 
  User, 
  Bluetooth, 
  Play, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  FileSpreadsheet, 
  Clock, 
  Activity, 
  Award, 
  Layers, 
  HelpCircle, 
  Users, 
  FolderOpen,
  GitCompare,
  Zap
} from 'lucide-react';

const STEPS = [
  { id: 'FICHA_PARTICIPANTE', label: '1. Ficha y Contexto', icon: User, desc: 'Identificación y check-in' },
  { id: 'VERIFICACION_BLE', label: '2. Enlace BLE & Guion', icon: Bluetooth, desc: 'Hardware y teleprompter' },
  { id: 'BATERIAS_EVALUACION', label: '3. Baterías Clínicas', icon: Play, desc: '4 Baterías Reales (Demo/Práctica/Oficial)' },
  { id: 'ENCUESTA_SALIDA', label: '4. Encuesta y Cierre', icon: CheckCircle2, desc: 'Feedback y guardado' }
];

export default function EvaluadorAdminPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { isConnected, device, latencyOffset, isKeyboardMode } = useBluetoothCube();

  // Selector de vista principal: Protocolo en Vivo vs Directorio de Evaluados
  const [mainView, setMainView] = useState('live_protocol'); // 'live_protocol' | 'evaluated_directory'

  // Máquina de estados secuencial del protocolo en vivo
  const [currentStep, setCurrentStep] = useState('FICHA_PARTICIPANTE');

  // Estado del Formulario de Participante (Paso 1)
  const [participantData, setParticipantData] = useState({
    codigoParticipante: 'P01',
    edad: 18,
    sexo: 'Masculino',
    manoDominante: 'Derecha',
    experienciaRubik: 'Nunca',
    desayuno: true,
    calidadSueno: 4,
    animoInicial: 4,
    toleranciaFrustracion: 4,
    observacionesIniciales: ''
  });

  // Estado de las Baterías Clínicas (Paso 3)
  const [completedBatteries, setCompletedBatteries] = useState({
    bat1_warmup: false,
    bat2_inhibitory: false,
    bat3_bimanual: false,
    bat4_official: false,
    bat5_memory: false
  });

  // Control de pantalla completa sin superposición
  const [isGameRunning, setIsGameRunning] = useState(false);

  // Sesiones individuales registradas para cada batería
  const [batterySessions, setBatterySessions] = useState({});

  // Auditoría de fases previas (Demostración examinador / Práctica evaluado)
  const [auditFases, setAuditFases] = useState({
    bat1_warmup: { demo: null, practice: null },
    bat2_inhibitory: { demo: null, practice: null },
    bat3_bimanual: { demo: null, practice: null },
    bat4_official: { demo: null, practice: null },
    bat5_memory: { demo: null, practice: null }
  });

  // Telemetría acumulada ensayo a ensayo
  const [collectedTrials, setCollectedTrials] = useState([]);

  // Estado de la Encuesta de Salida (Paso 4)
  const [surveyData, setSurveyData] = useState({
    fatigaPercibida: 2,
    disfrute: 5,
    claridadInstrucciones: 5,
    observacionesFinales: ''
  });

  // Estados de guardado y auditoría
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sessionCountToday, setSessionCountToday] = useState(0);

  // Cargar contador de sesiones del día desde LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cognimirror_validation_n10_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessionCountToday(parsed.length);
        
        // Auto-calcular siguiente código sugerido (ej: P01, P02...)
        const nextNum = parsed.length + 1;
        const nextCode = `P${String(nextNum).padStart(2, '0')}`;
        setParticipantData(prev => ({
          ...prev,
          codigoParticipante: prev.codigoParticipante === 'P01' && nextNum > 1 ? nextCode : prev.codigoParticipante
        }));
      }
    } catch (_) {}
  }, []);

  // Handlers para actualizar datos
  const handleParticipantChange = (field, value) => {
    setParticipantData(prev => ({ ...prev, [field]: value }));
  };

  const handleSurveyChange = (field, value) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  // Modo Demo Rápido / Visitante (<5 segundos para autoridades y sostenedores)
  const handleQuickDemo = () => {
    const demoParticipant = {
      codigoParticipante: 'DEMO-MINEDUC',
      edad: 10,
      sexo: 'Femenino',
      manoDominante: 'Derecha',
      experienciaRubik: 'Principiante',
      desayuno: true,
      calidadSueno: 5,
      animoInicial: 5,
      toleranciaFrustracion: 4,
      observacionesIniciales: 'Demostración en vivo ante Autoridades MINEDUC / Sostenedores (Decreto 170)'
    };
    setParticipantData(demoParticipant);
    setMainView('live_protocol');
    if (isConnected || isKeyboardMode) {
      setCurrentStep('BATERIAS_EVALUACION');
    } else {
      setCurrentStep('VERIFICACION_BLE');
    }
  };

  // Callback cuando una batería oficial es completada
  const handleBatteryCompleted = (batteryId, sessionResult, auditData) => {
    setCompletedBatteries(prev => ({
      ...prev,
      [batteryId]: true
    }));

    setBatterySessions(prev => ({
      ...prev,
      [batteryId]: {
        ...sessionResult,
        audit: auditData
      }
    }));

    if (auditData) {
      setAuditFases(prev => ({
        ...prev,
        [batteryId]: {
          demo: auditData.demo,
          practice: auditData.practice
        }
      }));
    }

    // Acumular telemetría trial-by-trial
    if (sessionResult?.rawTurnsData && Array.isArray(sessionResult.rawTurnsData)) {
      const mappedTrials = sessionResult.rawTurnsData.map((t, idx) => ({
        battery_type: batteryId,
        trial_number: idx + 1,
        stimulus_color: t.label || t.expected || 'DESCONOCIDO',
        stimulus_time_ms: t.time || 0,
        response_time_ms: t.time || 0,
        reaction_time_ms: t.time || 0,
        is_correct: t.status === 'Ok' || (t.type === 'NOGO' && !t.fail),
        is_commission_error: Boolean(t.fail || (t.type === 'NOGO' && t.actualFace)),
        is_omission_error: Boolean(t.timeout),
        face_turned: t.actualFace || null,
        type: t.type
      }));
      setCollectedTrials(prev => [...prev, ...mappedTrials]);
    }
  };

  // Handler para actualizar estado de omisión / realización de demo o práctica
  const handleAuditFaseUpdate = (batteryId, phase, status) => {
    setAuditFases(prev => ({
      ...prev,
      [batteryId]: {
        ...(prev[batteryId] || {}),
        [phase]: status
      }
    }));
  };

  // Reanudar evaluación desde el Directorio
  const handleResumeEvaluation = (session) => {
    if (session?.participante) {
      setParticipantData(session.participante);
    }
    if (session?.bateriasCompletadas) {
      setCompletedBatteries(session.bateriasCompletadas);
    }
    if (session?.bateriasDetalle) {
      setBatterySessions(session.bateriasDetalle);
    }
    if (session?.telemetria_ensayos) {
      setCollectedTrials(session.telemetria_ensayos);
    }

    setMainView('live_protocol');
    setCurrentStep('BATERIAS_EVALUACION');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función de Guardado Maestro (Supabase + Respaldo Offline LocalStorage)
  const handleSaveSession = async () => {
    setIsSaving(true);
    const sessionPayload = {
      id: `val-n10-${Date.now()}-${participantData.codigoParticipante}`,
      timestamp: new Date().toISOString(),
      evaluador: {
        id: user?.id || 'evaluador_fundador',
        email: user?.email || 'fundador@cognimirror.com'
      },
      participante: participantData,
      hardware: {
        isConnected: Boolean(isConnected),
        device: device || (isKeyboardMode ? 'Teclado/Pantalla' : 'Sin Cubo'),
        latencyOffset: latencyOffset || 0,
        isKeyboardMode: Boolean(isKeyboardMode)
      },
      bateriasCompletadas: completedBatteries,
      bateriasDetalle: batterySessions,
      auditFases: auditFases,
      telemetria_ensayos: collectedTrials,
      encuestaSalida: surveyData
    };

    try {
      // 1. Respaldo Local Inmediato
      let currentLocal = [];
      try {
        const stored = localStorage.getItem('cognimirror_validation_n10_sessions');
        if (stored) currentLocal = JSON.parse(stored);
      } catch (_) {}
      
      // Reemplazar si ya existía el mismo código o agregar
      const existingIdx = currentLocal.findIndex(s => s.participante?.codigoParticipante === participantData.codigoParticipante);
      if (existingIdx >= 0) {
        currentLocal[existingIdx] = sessionPayload;
      } else {
        currentLocal.push(sessionPayload);
      }

      localStorage.setItem('cognimirror_validation_n10_sessions', JSON.stringify(currentLocal));
      setSessionCountToday(currentLocal.length);

      // 2. Inserción en Supabase (tabla pacientes y sesiones_clinicas)
      try {
        const { data: pacienteExistente } = await supabase
          .from('pacientes')
          .select('id')
          .eq('id_sujeto', participantData.codigoParticipante)
          .maybeSingle();

        let pacienteId = pacienteExistente?.id;

        if (!pacienteId) {
          const { data: nuevoP } = await supabase
            .from('pacientes')
            .insert([{
              nombre: participantData.codigoParticipante,
              apellido: `[Validación n=10]`,
              id_sujeto: participantData.codigoParticipante,
              grupo_id: 'validacion_n10',
              diagnostico_nee: 'Protocolo Validación',
              psicologo_id: user?.id || null,
              colegio_id: profile?.colegio_id || null
            }])
            .select()
            .single();

          if (nuevoP) pacienteId = nuevoP.id;
        }

        if (pacienteId) {
          await supabase
            .from('sesiones_clinicas')
            .insert([{
              id_paciente: pacienteId,
              tipo_test: 'bateria_completa_n10',
              intento_numero: 1,
              etiqueta_clinica: 'Protocolo Validación n=10 (Oficial)',
              etiqueta_estudio: 'validacion_n10',
              id_sujeto: participantData.codigoParticipante,
              estadisticas_json: sessionPayload,
              intento_valido: true,
              grupo_id: 'validacion_n10',
              psicologo_id: user?.id || null,
              colegio_id: profile?.colegio_id || null
            }]);
        }
      } catch (sbErr) {
        console.warn('[Admin Evaluador] Registro remoto en Supabase continuó con respaldo offline:', sbErr);
      }

      setSaveSuccess(true);
    } catch (err) {
      console.error('[Admin Evaluador] Error al guardar sesión:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reiniciar flujo para el siguiente participante (P02, P03...)
  const handleResetForNextParticipant = () => {
    const currentCode = participantData.codigoParticipante;
    let nextCode = 'P02';
    
    const match = currentCode.match(/^P(\d+)$/i);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      nextCode = `P${String(nextNum).padStart(2, '0')}`;
    }

    setParticipantData({
      codigoParticipante: nextCode,
      edad: 18,
      sexo: 'Masculino',
      manoDominante: 'Derecha',
      experienciaRubik: 'Nunca',
      desayuno: true,
      calidadSueno: 4,
      animoInicial: 4,
      toleranciaFrustracion: 4,
      observacionesIniciales: ''
    });

    setCompletedBatteries({
      bat1_warmup: false,
      bat2_inhibitory: false,
      bat3_bimanual: false,
      bat4_official: false,
      bat5_memory: false
    });

    setBatterySessions({});
    setAuditFases({
      bat1_warmup: { demo: null, practice: null },
      bat2_inhibitory: { demo: null, practice: null },
      bat3_bimanual: { demo: null, practice: null },
      bat4_official: { demo: null, practice: null },
      bat5_memory: { demo: null, practice: null }
    });
    setCollectedTrials([]);

    setSurveyData({
      fatigaPercibida: 2,
      disfrute: 5,
      claridadInstrucciones: 5,
      observacionesFinales: ''
    });

    setSaveSuccess(false);
    setCurrentStep('FICHA_PARTICIPANTE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-white">
      {/* ── BARRA SUPERIOR DE NAVEGACIÓN Y AUDITORÍA ── */}
      {!isGameRunning && (
        <header className="sticky top-0 z-40 bg-[#07080f]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 uppercase">
                  COGNIMIRROR PROTOCOL CORE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  PRIVADO // N=10
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Módulo del Evaluador Clínico & Validación Escolar
              </h1>
            </div>
          </div>

          {/* Selector de Vista Principal: Protocolo en Vivo vs Directorio & Informes */}
          <div className="flex items-center gap-2">
            <div className="bg-[#0a0d18] border border-white/10 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMainView('live_protocol')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mainView === 'live_protocol'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Protocolo en Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => setMainView('evaluated_directory')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mainView === 'evaluated_directory'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Fichas & Informes</span>
              </button>

              <button
                type="button"
                onClick={() => setMainView('longitudinal_comparison')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mainView === 'longitudinal_comparison'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Comparativa (Dec. 170)</span>
              </button>
            </div>

            {/* Botón Acceso Rápido Demo MINEDUC (<5s) */}
            <button
              type="button"
              onClick={handleQuickDemo}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              title="Iniciar sesión en vivo en menos de 5 segundos con datos de demostración"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Demo Rápido MINEDUC</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Métricas y Estado de Hardware */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400">Evaluados Hoy:</span>
              <span className="font-mono font-bold text-white">{sessionCountToday} / 10</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <Bluetooth className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : isKeyboardMode ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline text-slate-300 font-medium font-mono">
                {isConnected ? (device || 'Cubo Conectado') : isKeyboardMode ? 'Modo Teclado' : 'Sin Cubo'}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* ── MODO 1: PROTOCOLO EN VIVO ── */}
      {mainView === 'live_protocol' && (
        <>
          {/* STEPPER BAR (BARRA DE 4 PASOS) */}
          {!isGameRunning && (
            <div className="border-b border-white/5 bg-[#0a0d18]/60 px-4 sm:px-8 py-3">
              <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                const isDone = 
                  (step.id === 'FICHA_PARTICIPANTE' && currentStep !== 'FICHA_PARTICIPANTE') ||
                  (step.id === 'VERIFICACION_BLE' && (currentStep === 'BATERIAS_EVALUACION' || currentStep === 'ENCUESTA_SALIDA')) ||
                  (step.id === 'BATERIAS_EVALUACION' && currentStep === 'ENCUESTA_SALIDA') ||
                  (step.id === 'ENCUESTA_SALIDA' && saveSuccess);

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                        : isDone
                          ? 'bg-white/5 border-emerald-500/30 text-emerald-300 hover:bg-white/10'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/5 text-slate-500 border border-white/10'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>

                    <div className="truncate">
                      <span className="block text-xs font-bold truncate">
                        {step.label}
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        {step.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL DEL PASO ACTIVO */}
          <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8">
            {/* PASO 1: FICHA Y CONTEXTO */}
            {currentStep === 'FICHA_PARTICIPANTE' && (
              <ParticipantForm
                formData={participantData}
                onChange={handleParticipantChange}
                onNext={() => {
                  setCurrentStep('VERIFICACION_BLE');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onQuickDemo={handleQuickDemo}
              />
            )}

            {/* PASO 2: VERIFICACIÓN BLE & GUION */}
            {currentStep === 'VERIFICACION_BLE' && (
              <div className="space-y-6">
                <BleVerificationCard
                  participantCode={participantData.codigoParticipante}
                  onBack={() => {
                    setCurrentStep('FICHA_PARTICIPANTE');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNext={() => {
                    setCurrentStep('BATERIAS_EVALUACION');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />

                <ClinicalTeleprompter
                  participantCode={participantData.codigoParticipante}
                />
              </div>
            )}

            {/* PASO 3: LAS BATERÍAS CLÍNICAS OFICIALES EN TAMAÑO COMPLETO */}
            {currentStep === 'BATERIAS_EVALUACION' && (
              <EvaluatorOfficialBatteriesManager
                participantData={participantData}
                completedBatteries={completedBatteries}
                batterySessions={batterySessions}
                auditFases={auditFases}
                onBatteryCompleted={handleBatteryCompleted}
                onAuditFaseUpdate={handleAuditFaseUpdate}
                onGameRunningChange={setIsGameRunning}
                onNext={() => {
                  setCurrentStep('ENCUESTA_SALIDA');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onBack={() => {
                  setCurrentStep('VERIFICACION_BLE');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* PASO 4: ENCUESTA DE SALIDA, MÉTRICAS Y GUARDADO */}
            {currentStep === 'ENCUESTA_SALIDA' && (
              <SessionSummaryAndSave
                participantData={participantData}
                collectedTrials={collectedTrials}
                onSaveSuccess={() => {
                  handleSaveSession();
                }}
                onResetForNextParticipant={handleResetForNextParticipant}
                onBack={() => {
                  setCurrentStep('BATERIAS_EVALUACION');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </main>
        </>
      )}

      {/* ── MODO 2: DIRECTORIO DE EVALUADOS & LOS INFORMES ── */}
      {mainView === 'evaluated_directory' && (
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8">
          <EvaluatedDirectoryAndReports
            onResumeEvaluation={handleResumeEvaluation}
            onOpenLongitudinalComparison={() => setMainView('longitudinal_comparison')}
          />
        </main>
      )}

      {/* ── MODO 3: COMPARATIVA LONGITUDINAL (DECRETO 170) ── */}
      {mainView === 'longitudinal_comparison' && (
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8">
          <LongitudinalComparisonView
            onBack={() => setMainView('live_protocol')}
          />
        </main>
      )}

      {/* ── FOOTER DISCRETO ── */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        COGNIMIRROR SYSTEM V5.2 · PROTOCOLO DE VALIDACIÓN CLÍNICA Y ESCOLAR (DECRETO 170 MINEDUC)
      </footer>
    </div>
  );
}
