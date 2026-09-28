'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactionGame from '../../ReactionGame';
import FreeCubeExplorer from '../../FreeCubeExplorer';
import { useBluetoothCube } from '../../../contexts/BluetoothContext';
import { 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Brain, 
  Sparkles, 
  HelpCircle, 
  Volume2, 
  VolumeX,
  FastForward,
  RotateCcw,
  Check,
  AlertTriangle,
  UserCheck,
  Award,
  Layers,
  Hand,
  Clock
} from 'lucide-react';

export default function EvaluatorOfficialBatteriesManager({
  participantData,
  completedBatteries = {},
  batterySessions = {},
  auditFases = {},
  onBatteryCompleted,
  onAuditFaseUpdate,
  onNext,
  onBack
}) {
  const { isConnected, isKeyboardMode } = useBluetoothCube();
  const subjectId = participantData?.codigoParticipante || 'P01';

  // Batería activa seleccionada para visualización/ejecución (0, 1, 2, 3)
  const [selectedBatteryIdx, setSelectedBatteryIdx] = useState(0);

  // Estado del modal de juego a pantalla completa
  // activeGameConfig: null | { type: 'explorer' | 'reaction', mode: 'single_face'|'bilateral_pure'|'official'|'warmup', isDemo: boolean, isPractice: boolean, maxRounds: number|null, banner: string, batteryKey: string }
  const [activeGameConfig, setActiveGameConfig] = useState(null);

  // Estado de reproducción de voz clínica (Web Speech API)
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Bloquear scroll de la ventana mientras el test a pantalla completa está activo
  useEffect(() => {
    if (activeGameConfig) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [activeGameConfig]);

  // Definición de las 4 Baterías Clínicas Creadas
  const BATTERIES_CONFIG = [
    {
      id: 'bat1_warmup',
      code: 'BAT-01',
      title: 'Batería 1: Calentamiento & Exploración Háptica',
      subtitle: 'Nivel 1 // Habituación Sensorial y Verificación BLE',
      gameMode: 'warmup',
      gameType: 'explorer',
      roundsOfficial: 15,
      construct: 'Familiarización propioceptiva con el cubo físico, verificación de latencia BLE y adaptación sin presión temporal.',
      durationEst: '~1 min',
      color: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/40',
      textAccent: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      rules: [
        {
          colorName: 'EXPLORACIÓN LIBRE',
          hex: '#10B981',
          hand: 'Ambas manos',
          action: 'Gira cualquier cara del cubo libremente para sentir la resistencia mecánica y escuchar los tonos armónicos.',
          badge: 'SIN PRESIÓN'
        }
      ],
      script: `Hola ${subjectId}. En esta primera etapa vas a explorar el cubo libremente. Gira sus caras con ambas manos para acostumbrarte al movimiento y al tacto. No hay respuestas correctas ni incorrectas.`
    },
    {
      id: 'bat2_inhibitory',
      code: 'BAT-02',
      title: 'Batería 2: Control Inhibitorio Unilateral (Go / No-Go)',
      subtitle: 'Nivel 2 // Freno Motor Prefrontal (1 Cara Activa)',
      gameMode: 'single_face',
      gameType: 'reaction',
      roundsOfficial: 40,
      construct: 'Freno motor voluntario, prepotencia motriz, errores de comisión y latencia de respuesta simple.',
      durationEst: '~2.5 min',
      color: 'from-purple-500/20 to-indigo-500/20',
      border: 'border-purple-500/40',
      textAccent: 'text-purple-400',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      rules: [
        {
          colorName: 'ROJO (GO)',
          hex: '#EF4444',
          hand: 'Mano Izquierda (Cara Roja L)',
          action: 'Gira la cara ROJA (con tu mano izquierda) lo más rápido que puedas apenas aparezca el color en pantalla.',
          badge: '⚡ GIRA RÁPIDO'
        },
        {
          colorName: 'NARANJO (NO-GO)',
          hex: '#F97316',
          hand: 'Cara Contraria (Freno Motor)',
          action: '¡SEÑAL DE FRENO! NO muevas nada. Mantén las manos completamente quietas y no toques el cubo.',
          badge: '✋ FRENO TOTAL'
        }
      ],
      script: `Atento ${subjectId}. Cuando la pantalla se ilumine de color ROJO, gira inmediatamente la cara ROJA con tu mano izquierda lo más rápido posible. Pero si ves color NARANJO, es una señal de freno: ¡NO MUEVAS NADA! Quédate completamente inmóvil.`
    },
    {
      id: 'bat3_bimanual',
      code: 'BAT-03',
      title: 'Batería 3: Coordinación Bimanual & Alternancia Pura',
      subtitle: 'Nivel 3 // Bilateralidad Equilibrada (2 Caras, Sin No-Go)',
      gameMode: 'bilateral_pure',
      gameType: 'reaction',
      roundsOfficial: 24,
      construct: 'Coordinación interhemisférica, asimetría de tiempo de reacción (Mano Izquierda vs Mano Derecha) y velocidad pura.',
      durationEst: '~2 min',
      color: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/40',
      textAccent: 'text-blue-400',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      rules: [
        {
          colorName: 'ROJO (GO)',
          hex: '#EF4444',
          hand: 'Mano Izquierda (Cara L)',
          action: 'Gira la cara ROJA con tu mano izquierda.',
          badge: 'MANO IZQUIERDA'
        },
        {
          colorName: 'NARANJO (GO)',
          hex: '#F97316',
          hand: 'Mano Derecha (Cara R)',
          action: 'Gira la cara NARANJA con tu mano derecha.',
          badge: 'MANO DERECHA'
        }
      ],
      script: `En esta prueba no hay señales de freno; siempre debes girar una cara. Si ves ROJO, gira con la mano izquierda la cara roja. Si ves NARANJO, gira con la mano derecha la cara naranja. Responde tan rápido y preciso como puedas.`
    },
    {
      id: 'bat4_official',
      code: 'BAT-04',
      title: 'Batería 4: Reaction Mirror Clínico Oficial (Mixto)',
      subtitle: 'Nivel 4 // Paradigma Completo Go/No-Go Bilateral',
      gameMode: 'official',
      gameType: 'reaction',
      roundsOfficial: 40,
      construct: 'Atención sostenida compleja, resistencia a la fatiga atencional, variabilidad (SD) y control inhibitorio mixto.',
      durationEst: '~3 min',
      color: 'from-pink-500/20 to-rose-500/20',
      border: 'border-pink-500/40',
      textAccent: 'text-pink-400',
      badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      rules: [
        {
          colorName: 'ROJO (GO)',
          hex: '#EF4444',
          hand: 'Mano Izquierda (L)',
          action: 'Gira la cara ROJA.',
          badge: 'MANO IZQ'
        },
        {
          colorName: 'NARANJO (GO)',
          hex: '#F97316',
          hand: 'Mano Derecha (R)',
          action: 'Gira la cara NARANJA.',
          badge: 'MANO DER'
        },
        {
          colorName: 'VERDE / AZUL (NO-GO)',
          hex: '#10B981',
          hand: 'Distractor / Freno',
          action: '¡FRENO TOTAL! Si aparece Verde o Azul, NO gires ninguna cara. Espera quieto.',
          badge: '✋ FRENO TOTAL'
        }
      ],
      script: `Esta es la prueba principal. Si aparece ROJO, gira la cara roja con la mano izquierda. Si aparece NARANJO, gira la cara naranja con la mano derecha. Pero si aparece AZUL o VERDE, ¡FRENO TOTAL! No toques el cubo.`
    }
  ];

  const currentBattery = BATTERIES_CONFIG[selectedBatteryIdx];
  const currentAudit = auditFases[currentBattery.id] || { demo: null, practice: null };
  const isBatteryCompleted = Boolean(completedBatteries[currentBattery.id]);
  const currentSession = batterySessions[currentBattery.id];

  // Voz sintetizada estandarizada
  const toggleSpeech = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-CL';
    utter.rate = 0.93;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
  };

  // Lanzadores a pantalla completa original
  const handleLaunchExaminerDemo = () => {
    setActiveGameConfig({
      type: currentBattery.gameType,
      mode: currentBattery.gameMode,
      isDemo: true,
      isPractice: true,
      maxRounds: 10,
      banner: `🧑‍🏫 DEMOSTRACIÓN DEL EXAMINADOR (10 RONDAS) — ${currentBattery.code}`,
      batteryKey: currentBattery.id,
      phaseType: 'demo'
    });
  };

  const handleLaunchStudentPractice = () => {
    setActiveGameConfig({
      type: currentBattery.gameType,
      mode: currentBattery.gameMode,
      isDemo: false,
      isPractice: true,
      maxRounds: 10,
      banner: `🧑‍🎓 PRÁCTICA DEL EVALUADO (10 RONDAS DE CALIBRACIÓN) — ${currentBattery.code}`,
      batteryKey: currentBattery.id,
      phaseType: 'practice'
    });
  };

  const handleLaunchOfficialTest = () => {
    setActiveGameConfig({
      type: currentBattery.gameType,
      mode: currentBattery.gameMode,
      isDemo: false,
      isPractice: false,
      maxRounds: null, // Rondas oficiales completas (40 o 24)
      banner: `🚀 EVALUACIÓN OFICIAL: ${currentBattery.title.toUpperCase()} (SUJETO: ${subjectId})`,
      batteryKey: currentBattery.id,
      phaseType: 'official'
    });
  };

  // Omitir fases
  const handleOmitExaminerDemo = () => {
    if (onAuditFaseUpdate) {
      onAuditFaseUpdate(currentBattery.id, 'demo', 'omitted');
    }
  };

  const handleOmitStudentPractice = () => {
    if (onAuditFaseUpdate) {
      onAuditFaseUpdate(currentBattery.id, 'practice', 'omitted');
    }
  };

  // Callback al terminar o salir del juego a pantalla completa
  const handleGameFinished = (savedSession) => {
    const cfg = activeGameConfig;
    setActiveGameConfig(null);

    if (!cfg) return;

    if (cfg.phaseType === 'demo') {
      if (onAuditFaseUpdate) {
        onAuditFaseUpdate(cfg.batteryKey, 'demo', 'completed');
      }
    } else if (cfg.phaseType === 'practice') {
      if (onAuditFaseUpdate) {
        onAuditFaseUpdate(cfg.batteryKey, 'practice', 'completed');
      }
    } else if (cfg.phaseType === 'official') {
      if (savedSession) {
        if (onBatteryCompleted) {
          onBatteryCompleted(cfg.batteryKey, savedSession, {
            demo: currentAudit.demo || 'omitted',
            practice: currentAudit.practice || 'omitted',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  };

  const completedCount = Object.values(completedBatteries).filter(Boolean).length;
  const allCompleted = completedCount >= 4;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── SELECTOR HORIZONTAL DE LAS 4 BATERÍAS ── */}
      <div className="bg-[#0c101a]/90 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Baterías del Protocolo Clínico CogniMirror
            </h3>
          </div>
          <div className="text-xs font-mono font-bold text-slate-400">
            Progreso: <span className="text-emerald-400 font-black">{completedCount}</span> / 4 Oficiales
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {BATTERIES_CONFIG.map((b, idx) => {
            const isDone = Boolean(completedBatteries[b.id]);
            const isSelected = selectedBatteryIdx === idx;

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBatteryIdx(idx)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-purple-600/25 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/15'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                    isDone 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-white/10 text-slate-300'
                  }`}>
                    {b.code}
                  </span>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Listo
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {b.roundsOfficial} r
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-white truncate">
                  {b.title.split(':')[1]?.trim() || b.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {b.subtitle.split('//')[1]?.trim() || b.durationEst}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CARD PRINCIPAL DE LA BATERÍA ACTIVA ── */}
      <div className={`bg-[#0c101a]/95 border rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md transition-all ${
        isBatteryCompleted 
          ? 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
          : currentBattery.border
      }`}>
        {/* Header de la Batería */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${currentBattery.badgeBg}`}>
                {currentBattery.code} // {currentBattery.durationEst}
              </span>
              {isBatteryCompleted && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Prueba Oficial Registrada
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {currentBattery.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              <span className="font-semibold text-slate-300">Constructo evaluado:</span> {currentBattery.construct}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSpeech(currentBattery.script)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
              title="Escuchar audio de instrucciones"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              <span>{isSpeaking ? 'Detener Voz' : 'Instrucción con Voz'}</span>
            </button>
          </div>
        </div>

        {/* ── PANEL DE COMPRENSIÓN: EJEMPLOS GRÁFICOS VISUALES ── */}
        <div className="my-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Guía de Comprensión con Ejemplos Concretos</span>
            </h4>
            <span className="text-[10px] text-slate-400">
              Explica esto al evaluado antes de comenzar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentBattery.rules.map((rule, rIdx) => (
              <div 
                key={rIdx}
                className="bg-[#111624] border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 pointer-events-none blur-xl"
                  style={{ backgroundColor: rule.hex }}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-4 h-4 rounded-md shadow-sm shrink-0" 
                        style={{ backgroundColor: rule.hex }} 
                      />
                      <span className="text-xs font-black text-white">
                        {rule.colorName}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      {rule.badge}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-purple-300 mb-1">
                    {rule.hand}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rule.action}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Guion Verbal Clínico para el Evaluador */}
          <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3.5 mt-3 text-xs text-purple-200/90 leading-relaxed">
            <span className="font-bold text-purple-300 block mb-1">💬 Guion Verbal Estandarizado (Léelo al evaluado):</span>
            "{currentBattery.script}"
          </div>
        </div>

        {/* ── MÓDULO DE 3 FASES: DEMOSTRACIÓN -> PRÁCTICA -> PRUEBA OFICIAL ── */}
        <div className="pt-5 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Protocolo de 3 Fases Clínicas Estandarizadas:
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Modo Confortable para el Evaluador
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {/* FASE 1: DEMOSTRACIÓN DEL EXAMINADOR */}
            <div className={`p-4 rounded-xl border transition-all ${
              currentAudit.demo === 'completed'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-200'
                : currentAudit.demo === 'omitted'
                  ? 'bg-amber-500/10 border-amber-500/30 text-slate-300'
                  : 'bg-white/[0.03] border-white/10 text-slate-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-purple-400 flex items-center gap-1.5">
                  <span>1. Demostración</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10">
                  10 rondas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-snug">
                El examinador modela la prueba frente al participante para mostrar cómo girar o frenar.
              </p>

              {currentAudit.demo === 'completed' ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/15 p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Demostración Realizada</span>
                </div>
              ) : currentAudit.demo === 'omitted' ? (
                <div className="flex items-center justify-between text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                  <span>Omitida por examinador</span>
                  <button
                    type="button"
                    onClick={handleLaunchExaminerDemo}
                    className="text-[10px] underline hover:text-white cursor-pointer"
                  >
                    Hacer ahora
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLaunchExaminerDemo}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Demostrar (10 r)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOmitExaminerDemo}
                    className="px-2.5 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                    title="Omitir demostración (quedará registrado)"
                  >
                    Omitir
                  </button>
                </div>
              )}
            </div>

            {/* FASE 2: PRÁCTICA DEL EVALUADO */}
            <div className={`p-4 rounded-xl border transition-all ${
              currentAudit.practice === 'completed'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-200'
                : currentAudit.practice === 'omitted'
                  ? 'bg-amber-500/10 border-amber-500/30 text-slate-300'
                  : 'bg-white/[0.03] border-white/10 text-slate-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1.5">
                  <span>2. Práctica Evaluado</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10">
                  10 rondas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-snug">
                El estudiante ensaya 10 rondas para verificar que comprendió antes de la medición oficial.
              </p>

              {currentAudit.practice === 'completed' ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/15 p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Práctica Realizada</span>
                </div>
              ) : currentAudit.practice === 'omitted' ? (
                <div className="flex items-center justify-between text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                  <span>Omitida por evaluado</span>
                  <button
                    type="button"
                    onClick={handleLaunchStudentPractice}
                    className="text-[10px] underline hover:text-white cursor-pointer"
                  >
                    Hacer ahora
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLaunchStudentPractice}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Practicar (10 r)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOmitStudentPractice}
                    className="px-2.5 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                    title="Omitir práctica (quedará registrado)"
                  >
                    Omitir
                  </button>
                </div>
              )}
            </div>

            {/* FASE 3: PRUEBA OFICIAL COMPLETA */}
            <div className={`p-4 rounded-xl border transition-all ${
              isBatteryCompleted
                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>3. Prueba Oficial</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-500/30">
                  {currentBattery.roundsOfficial} rondas
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-3 leading-snug">
                {isBatteryCompleted 
                  ? 'Prueba completada con éxito. Datos y métricas clínicas asegurados.' 
                  : 'Lanza el juego original a pantalla completa con registro de telemetría.'}
              </p>

              {isBatteryCompleted ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Completada Oficialmente</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLaunchOfficialTest}
                    className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold rounded-lg border border-white/10 transition-all cursor-pointer"
                  >
                    Repetir Prueba Oficial
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLaunchOfficialTest}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Iniciar Prueba Oficial</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resumen de Métricas de la Batería si ya está completada */}
        {isBatteryCompleted && currentSession?.stats && (
          <div className="mt-5 p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2 animate-in fade-in">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-400">
              📊 Métricas Clínicas Obtenidas en {currentBattery.code}:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block">Hit RT Medio</span>
                <span className="text-sm font-mono font-black text-white">
                  {currentSession.stats.averageReactionTime || currentSession.stats.tiempo_total || '—'} ms
                </span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block">Precisión Go</span>
                <span className="text-sm font-mono font-black text-emerald-400">
                  {currentSession.stats.goTrials > 0 
                    ? `${Math.round(((currentSession.stats.aciertos_rojo || 0) + (currentSession.stats.aciertos_naranja || 0)) / currentSession.stats.goTrials * 100)}%`
                    : '100%'}
                </span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block">Comisión No-Go</span>
                <span className="text-sm font-mono font-black text-rose-400">
                  {currentSession.stats.nogoFails ?? currentSession.stats.errores_falsos ?? 0}
                </span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block">Asimetría L/R</span>
                <span className="text-sm font-mono font-black text-purple-300">
                  {currentSession.stats.asymmetryDelta ? `${Math.round(currentSession.stats.asymmetryDelta)} ms` : '0 ms'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BARRA INFERIOR DE NAVEGACIÓN ENTRE BATERÍAS ── */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Enlace BLE</span>
        </button>

        <div className="flex items-center gap-3">
          {selectedBatteryIdx < BATTERIES_CONFIG.length - 1 ? (
            <button
              type="button"
              onClick={() => setSelectedBatteryIdx(prev => prev + 1)}
              className="px-5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-bold text-purple-200 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Siguiente Batería ({BATTERIES_CONFIG[selectedBatteryIdx + 1]?.code})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                allCompleted
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.4)]'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              }`}
            >
              <span>{allCompleted ? 'Continuar a Encuesta y Guardado' : 'Avanzar a Paso 4 (Finalizar)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── MODAL A PANTALLA COMPLETA DEL JUEGO ORIGINAL (PORTAL AISLADO) ── */}
      {activeGameConfig && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#07080f] w-screen h-screen flex flex-col overflow-hidden animate-in fade-in duration-150">
          {activeGameConfig.type === 'explorer' ? (
            <FreeCubeExplorer
              onBack={() => handleGameFinished(null)}
              onSelectLevel={() => handleGameFinished(null)}
            />
          ) : (
            <ReactionGame
              onExit={handleGameFinished}
              gameMode={activeGameConfig.mode}
              isWarmup={activeGameConfig.isDemo}
              isPracticeMode={activeGameConfig.isPractice}
              maxRounds={activeGameConfig.maxRounds}
              modeBanner={activeGameConfig.banner}
              idSujeto={subjectId}
              etiquetaEstudio="validacion_n10"
              omissionTimeoutMs={1200}
            />
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
