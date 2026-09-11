'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBluetoothCube } from '../../../contexts/BluetoothContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Coffee, 
  FastForward, 
  Zap, 
  Activity, 
  ShieldAlert, 
  Brain, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Keyboard
} from 'lucide-react';

// ── GENERADORES PSICOMÉTRICOS DE MAZOS ──

// 1. Mazo Batería 1: Go/No-Go Unilateral (40 ensayos)
function generateGoNoGoDeck() {
  const TOTAL = 40;
  const NOGO_COUNT = 8; // 20%
  const GO_COUNT = TOTAL - NOGO_COUNT; // 80%

  const deck = [];
  let currentGoCount = GO_COUNT;
  let currentNoGoCount = NOGO_COUNT;

  for (let i = 0; i < TOTAL; i++) {
    let canNoGo = currentNoGoCount > 0 && i >= 4 && i < TOTAL - 1;
    if (i > 0 && deck[i - 1]?.type === 'NOGO') canNoGo = false;
    if (i > 1 && deck[i - 2]?.type === 'NOGO') canNoGo = false;

    const chooseNoGo = canNoGo && (Math.random() < 0.28 || currentGoCount === 0);

    if (chooseNoGo) {
      deck.push({
        id: 'NONE',
        expectedFace: null,
        label: 'NARANJO',
        hex: '#FF8C00',
        type: 'NOGO'
      });
      currentNoGoCount--;
    } else {
      deck.push({
        id: 'L',
        expectedFace: 'L',
        label: 'ROJO',
        hex: '#EF4444',
        type: 'GO'
      });
      currentGoCount--;
    }
  }
  return deck;
}

// 2. Mazo Batería 2: Bilateralidad Pura (24 ensayos equilibrados)
function generateBilateralDeck() {
  const items = [];
  for (let i = 0; i < 12; i++) items.push('L');
  for (let i = 0; i < 12; i++) items.push('R');

  let deck;
  let valid = false;
  while (!valid) {
    deck = [...items];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    valid = true;
    for (let i = 2; i < deck.length; i++) {
      if (deck[i] === deck[i - 1] && deck[i] === deck[i - 2]) {
        valid = false;
        break;
      }
    }
  }

  return deck.map(face => ({
    id: face,
    expectedFace: face,
    label: face === 'L' ? 'ROJO' : 'NARANJO',
    hex: face === 'L' ? '#EF4444' : '#FF8C00',
    type: 'GO'
  }));
}

// 3. Mazo Batería 3: Batería Mixta de Alta Carga (40 ensayos)
function generateMixedDeck() {
  const TOTAL = 40;
  const NOGO_TOTAL = 10; // 25% (Azul / Verde)
  const GO_L = 15;
  const GO_R = 15;

  let validDeck = false;
  let attempt = [];

  while (!validDeck) {
    attempt = [];
    let counts = { R: GO_R, L: GO_L, NOGO: NOGO_TOTAL };

    for (let i = 0; i < TOTAL; i++) {
      let available = [];
      if (counts.R > 0) available.push('R');
      if (counts.L > 0) available.push('L');
      if (counts.NOGO > 0) available.push('NOGO');

      if (i < 4 || i === TOTAL - 1) {
        available = available.filter(t => t !== 'NOGO');
      }
      if (i > 0 && attempt[i - 1] === 'NOGO') available = available.filter(t => t !== 'NOGO');
      if (i > 1 && attempt[i - 2] === 'NOGO') available = available.filter(t => t !== 'NOGO');

      if (i >= 2) {
        const p1 = attempt[i - 1];
        const p2 = attempt[i - 2];
        if (p1 === p2 && p1 !== 'NOGO') {
          available = available.filter(t => t !== p1);
        }
      }

      if (available.length === 0) break;
      const pick = available[Math.floor(Math.random() * available.length)];
      attempt.push(pick);
      counts[pick]--;
    }

    if (attempt.length === TOTAL) validDeck = true;
  }

  return attempt.map(item => {
    if (item === 'NOGO') {
      const isBlue = Math.random() < 0.5;
      return {
        id: 'NONE',
        expectedFace: null,
        label: isBlue ? 'AZUL' : 'VERDE',
        hex: isBlue ? '#3B82F6' : '#10B981',
        type: 'NOGO'
      };
    }
    return {
      id: item,
      expectedFace: item,
      label: item === 'L' ? 'ROJO' : 'NARANJO',
      hex: item === 'L' ? '#EF4444' : '#FF8C00',
      type: 'GO'
    };
  });
}

// 4. Colores para el Test de Corsi 3D
const CORSI_FACES = [
  { id: 'U', name: 'BLANCO', hex: '#FFFFFF', text: 'text-black' },
  { id: 'D', name: 'AMARILLO', hex: '#EAB308', text: 'text-black' },
  { id: 'L', name: 'ROJO', hex: '#EF4444', text: 'text-white' },
  { id: 'R', name: 'NARANJA', hex: '#F97316', text: 'text-white' },
  { id: 'F', name: 'AZUL', hex: '#3B82F6', text: 'text-white' }
];

export default function BatteryOrchestrator({ 
  participantData, 
  onBatteriesComplete, 
  onAbort 
}) {
  const { isConnected, isKeyboardMode, subscribeToMoves, latencyOffset, simulateMove } = useBluetoothCube();

  // ── ESTADO GENERAL DE LA MÁQUINA DE PRUEBAS ──
  // Estados posibles:
  // 'PREP_BAT1' -> 'RUN_BAT1' -> 'REST_1' ->
  // 'PREP_BAT2' -> 'RUN_BAT2' -> 'REST_2' ->
  // 'PREP_BAT3' -> 'RUN_BAT3' -> 'REST_3' ->
  // 'PREP_BAT4' -> 'RUN_BAT4' -> 'FINISHED'
  const [phase, setPhase] = useState('PREP_BAT1');

  // Array consolidado de telemetría ensayo a ensayo
  const [trialsData, setTrialsData] = useState([]);

  // Estado del descanso (cuenta regresiva)
  const [restSeconds, setRestSeconds] = useState(0);

  // Estados de control de ensayo (Reaction Tests)
  const [deck, setDeck] = useState([]);
  const [currentTrialIdx, setCurrentTrialIdx] = useState(0);
  const [trialState, setTrialState] = useState('waiting_isi'); // 'waiting_isi', 'stimulus_active', 'feedback'
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [trialFeedback, setTrialFeedback] = useState(null);
  const [lastLatencyDisplay, setLastLatencyDisplay] = useState(null);

  // Timers y timestamps de precisión
  const stimulusTimeRef = useRef(0);
  const isiTimerRef = useRef(null);
  const stimulusTimeoutRef = useRef(null);
  const lastErrorRef = useRef(false);
  const lastErrorTimeRef = useRef(0);

  // ── ESTADOS DEL TEST DE CORSI 3D (BATERÍA 4) ──
  const [corsiSpan, setCorsiSpan] = useState(2);
  const [corsiTrial, setCorsiTrial] = useState('A'); // 'A' o 'B'
  const [corsiSequence, setCorsiSequence] = useState([]);
  const [corsiStep, setCorsiStep] = useState('idle'); // 'showing', 'waiting_user', 'feedback'
  const [activeCorsiFace, setActiveCorsiFace] = useState(null);
  const [userCorsiIndex, setUserCorsiIndex] = useState(0);
  const [corsiFailsInSpan, setCorsiFailsInSpan] = useState(0);

  // Modal de pausa de emergencia
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Metadata de los 4 tests para el teleprompter
  const testConfigs = {
    PREP_BAT1: {
      batteryId: 'GO_NOGO_SIMPLE',
      badge: 'BATERÍA 1 DE 4',
      title: 'Control Inhibitorio Unilateral (Go / No-Go Simple)',
      construct: 'Freno Motor Prefrontal, Tiempo de Reacción Simple y Control de Impulsos',
      trialsCount: 40,
      script: `Cuando veas el color ROJO en pantalla, gira la cara ROJA del cubo (con tu mano izquierda) lo más rápido que puedas. Pero si aparece el color NARANJO, es una señal de freno: ¡NO MUEVAS NADA! Quédate completamente quieto.`
    },
    PREP_BAT2: {
      batteryId: 'BILATERAL_ALTERNATION',
      badge: 'BATERÍA 2 DE 4',
      title: 'Coordinación Bimanual y Alternancia Pura',
      construct: 'Coordinación Interhemisférica y Asimetría de Latencia Bilateral',
      trialsCount: 24,
      script: `En esta prueba no hay señales de freno; siempre debes girar. Si ves ROJO, gira con la mano izquierda la cara ROJA. Si ves NARANJO, gira con la mano derecha la cara NARANJA. Responde lo más rápido y preciso posible.`
    },
    PREP_BAT3: {
      batteryId: 'REACTION_MIRROR_MIXED',
      badge: 'BATERÍA 3 DE 4',
      title: 'Reaction Mirror Clínico Oficial (Batería Mixta)',
      construct: 'Atención Sostenida Compleja, Resistencia a la Fatiga y Control Mixto',
      trialsCount: 40,
      script: `Esta es la prueba principal. Si ves ROJO, gira la cara roja con la mano izquierda. Si ves NARANJO, gira la cara naranja con la mano derecha. Pero si aparece AZUL o VERDE, ¡FRENO TOTAL! No toques el cubo.`
    },
    PREP_BAT4: {
      batteryId: 'MEMORY_MIRROR_CORSI',
      badge: 'BATERÍA 4 DE 4',
      title: 'Memory Mirror 3D (Test de Bloques de Corsi Háptico)',
      construct: 'Amplitud de Memoria de Trabajo Visoespacial y Retención Secuencial',
      trialsCount: 'Adaptativo (Longitud 2 a 6)',
      script: `Observa atentamente la secuencia de colores que se encenderán en el cubo tridimensional. Cuando termine la secuencia, repite los colores en el mismo orden exacto girando las caras del cubo.`
    }
  };

  // Lector de voz automatizado (Web Speech API)
  const speakScript = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CL';
    utterance.rate = 0.92;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // ── INICIALIZADOR DE CADA BATERÍA DE REACCIÓN ──
  const startReactionBattery = (mode) => {
    let newDeck = [];
    if (mode === 'BAT1') newDeck = generateGoNoGoDeck();
    if (mode === 'BAT2') newDeck = generateBilateralDeck();
    if (mode === 'BAT3') newDeck = generateMixedDeck();

    setDeck(newDeck);
    setCurrentTrialIdx(0);
    setTrialFeedback(null);
    setLastLatencyDisplay(null);
    lastErrorRef.current = false;

    if (mode === 'BAT1') setPhase('RUN_BAT1');
    if (mode === 'BAT2') setPhase('RUN_BAT2');
    if (mode === 'BAT3') setPhase('RUN_BAT3');

    triggerNextTrial(newDeck, 0, mode);
  };

  // Dispara el siguiente ensayo con jitter ISI pseudo-aleatorio de 1.000 a 1.800 ms
  const triggerNextTrial = (currentDeck, index, batteryKey) => {
    if (index >= currentDeck.length) {
      handleBatteryFinish(batteryKey);
      return;
    }

    setTrialState('waiting_isi');
    setCurrentStimulus(null);
    setTrialFeedback(null);

    // Jitter ISI aleatorio (1000 a 1800 ms)
    const jitter = Math.floor(Math.random() * 800) + 1000;

    if (isiTimerRef.current) clearTimeout(isiTimerRef.current);
    isiTimerRef.current = setTimeout(() => {
      const stimulus = currentDeck[index];
      setCurrentStimulus(stimulus);
      setTrialState('stimulus_active');
      stimulusTimeRef.current = performance.now();

      // Timeout en caso de no respuesta (2.500 ms)
      if (stimulusTimeoutRef.current) clearTimeout(stimulusTimeoutRef.current);
      stimulusTimeoutRef.current = setTimeout(() => {
        handleTrialTimeout(stimulus, index, batteryKey, currentDeck);
      }, 2500);
    }, jitter);
  };

  // Manejador de Timeout (Omisión en Go o Acierto en No-Go)
  const handleTrialTimeout = (stimulus, index, batteryKey, currentDeck) => {
    const isNoGo = stimulus.type === 'NOGO';
    const isSuccess = isNoGo; // En No-Go, no responder es el objetivo clínico (inhibición exitosa)
    const now = performance.now();

    const trialRecord = {
      battery_type: batteryKey,
      trial_number: index + 1,
      stimulus_color: stimulus.label,
      stimulus_time_ms: Math.round(stimulusTimeRef.current),
      response_time_ms: Math.round(now),
      reaction_time_ms: isNoGo ? 0 : 2500,
      is_correct: isSuccess,
      is_commission_error: false,
      is_omission_error: !isNoGo,
      face_turned: null,
      post_error_delay_ms: lastErrorRef.current ? Math.round(stimulusTimeRef.current - lastErrorTimeRef.current) : 0
    };

    setTrialsData(prev => [...prev, trialRecord]);
    lastErrorRef.current = !isSuccess;
    if (!isSuccess) lastErrorTimeRef.current = now;

    setTrialFeedback({
      type: isSuccess ? 'success' : 'omission',
      msg: isSuccess ? '¡INHIBICIÓN EXITOSA!' : 'OMISIÓN (TIEMPO AGOTADO)'
    });

    setTrialState('feedback');
    setTimeout(() => {
      setCurrentTrialIdx(index + 1);
      triggerNextTrial(currentDeck, index + 1, batteryKey);
    }, 600);
  };

  // Procesador de Respuesta (Giro BLE o Teclado)
  const handleUserTurn = useCallback((faceTurned) => {
    if (trialState !== 'stimulus_active' || !currentStimulus) return;

    if (stimulusTimeoutRef.current) clearTimeout(stimulusTimeoutRef.current);

    const now = performance.now();
    const cleanFace = faceTurned.replace("'", "");
    const rawLatency = now - stimulusTimeRef.current;
    // Corrección por offset de latencia Bluetooth BLE
    const correctedLatency = Math.max(120, Math.round(rawLatency - (latencyOffset || 0)));

    const isNoGo = currentStimulus.type === 'NOGO';
    const isCorrect = !isNoGo && cleanFace === currentStimulus.expectedFace;
    const isCommissionError = isNoGo;

    const trialRecord = {
      battery_type: phase === 'RUN_BAT1' ? 'GO_NOGO' : phase === 'RUN_BAT2' ? 'BILATERAL' : 'MIXED',
      trial_number: currentTrialIdx + 1,
      stimulus_color: currentStimulus.label,
      stimulus_time_ms: Math.round(stimulusTimeRef.current),
      response_time_ms: Math.round(now),
      reaction_time_ms: correctedLatency,
      is_correct: isCorrect,
      is_commission_error: isCommissionError,
      is_omission_error: false,
      face_turned: cleanFace,
      post_error_delay_ms: lastErrorRef.current ? Math.round(stimulusTimeRef.current - lastErrorTimeRef.current) : 0
    };

    setTrialsData(prev => [...prev, trialRecord]);
    setLastLatencyDisplay(correctedLatency);

    lastErrorRef.current = !isCorrect;
    if (!isCorrect) lastErrorTimeRef.current = now;

    setTrialFeedback({
      type: isCorrect ? 'success' : 'error',
      msg: isCorrect 
        ? `${correctedLatency} ms` 
        : isCommissionError 
          ? '¡ERROR DE COMISIÓN (NO-GO)!' 
          : 'CARA INCORRECTA'
    });

    setTrialState('feedback');
    const batteryKey = phase === 'RUN_BAT1' ? 'BAT1' : phase === 'RUN_BAT2' ? 'BAT2' : 'BAT3';

    setTimeout(() => {
      setCurrentTrialIdx(prev => prev + 1);
      triggerNextTrial(deck, currentTrialIdx + 1, batteryKey);
    }, 600);
  }, [trialState, currentStimulus, latencyOffset, phase, currentTrialIdx, deck]);

  // Suscripción al sensor BLE en tiempo real
  useEffect(() => {
    const unsub = subscribeToMoves((notation) => {
      if (phase.startsWith('RUN_BAT') && phase !== 'RUN_BAT4') {
        handleUserTurn(notation);
      } else if (phase === 'RUN_BAT4') {
        handleCorsiTurn(notation);
      }
    });
    return unsub;
  }, [subscribeToMoves, handleUserTurn, phase]);

  // Soporte Teclado para evaluación (A para L/Rojo, L para R/Naranjo, Espacio)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isKeyboardMode || trialState !== 'stimulus_active') return;
      if (e.key === 'a' || e.key === 'A') handleUserTurn('L');
      if (e.key === 'l' || e.key === 'L') handleUserTurn('R');
      if (e.key === ' ' || e.key === 'Enter') handleUserTurn('L');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKeyboardMode, trialState, handleUserTurn]);

  // ── FINALIZACIÓN DE CADA BATERÍA Y PAUSA CLÍNICA ──
  const handleBatteryFinish = (batteryKey) => {
    if (batteryKey === 'BAT1') {
      startRestCountdown(45, 'PREP_BAT2');
    } else if (batteryKey === 'BAT2') {
      startRestCountdown(45, 'PREP_BAT3');
    } else if (batteryKey === 'BAT3') {
      startRestCountdown(60, 'PREP_BAT4');
    }
  };

  const startRestCountdown = (seconds, nextPhase) => {
    setRestSeconds(seconds);
    const restKey = nextPhase === 'PREP_BAT2' ? 'REST_1' : nextPhase === 'PREP_BAT3' ? 'REST_2' : 'REST_3';
    setPhase(restKey);

    let remaining = seconds;
    const interval = setInterval(() => {
      remaining -= 1;
      setRestSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setPhase(nextPhase);
      }
    }, 1000);
  };

  const skipRest = (nextPhase) => {
    setRestSeconds(0);
    setPhase(nextPhase);
  };

  // ── TEST DE CORSI 3D (BATERÍA 4) ──
  const startCorsiBattery = () => {
    setCorsiSpan(2);
    setCorsiTrial('A');
    setCorsiFailsInSpan(0);
    setPhase('RUN_BAT4');
    launchCorsiSequence(2, 'A');
  };

  const generateCorsiSeq = (length) => {
    const seq = [];
    for (let i = 0; i < length; i++) {
      let face;
      do {
        face = CORSI_FACES[Math.floor(Math.random() * CORSI_FACES.length)].id;
      } while (seq.length > 0 && face === seq[seq.length - 1]);
      seq.push(face);
    }
    return seq;
  };

  const launchCorsiSequence = (span, trialLetter) => {
    const seq = generateCorsiSeq(span);
    setCorsiSequence(seq);
    setCorsiStep('showing');
    setUserCorsiIndex(0);
    setActiveCorsiFace(null);

    // Reproducción visual secuencial de estímulos (650ms ON, 250ms OFF)
    let idx = 0;
    const playInterval = setInterval(() => {
      if (idx < seq.length) {
        setActiveCorsiFace(seq[idx]);
        setTimeout(() => setActiveCorsiFace(null), 600);
        idx++;
      } else {
        clearInterval(playInterval);
        setActiveCorsiFace(null);
        setCorsiStep('waiting_user');
        stimulusTimeRef.current = performance.now();
      }
    }, 900);
  };

  const handleCorsiTurn = (faceTurned) => {
    if (corsiStep !== 'waiting_user') return;

    const cleanFace = faceTurned.replace("'", "");
    const now = performance.now();
    const latency = Math.round(now - stimulusTimeRef.current);
    stimulusTimeRef.current = now;

    const expected = corsiSequence[userCorsiIndex];
    const isCorrect = cleanFace === expected;

    const trialRecord = {
      battery_type: 'CORSI_3D',
      trial_number: `${corsiSpan}-${corsiTrial}-${userCorsiIndex + 1}`,
      stimulus_color: expected,
      stimulus_time_ms: Math.round(now - latency),
      response_time_ms: Math.round(now),
      reaction_time_ms: latency,
      is_correct: isCorrect,
      is_commission_error: !isCorrect,
      is_omission_error: false,
      face_turned: cleanFace,
      post_error_delay_ms: 0
    };
    setTrialsData(prev => [...prev, trialRecord]);

    if (!isCorrect) {
      // Fallo en la secuencia actual
      setCorsiStep('feedback');
      const newFails = corsiFailsInSpan + 1;
      setCorsiFailsInSpan(newFails);

      if (corsiTrial === 'A') {
        // Pasa al segundo intento (Intento B) en el mismo span
        setTimeout(() => {
          setCorsiTrial('B');
          launchCorsiSequence(corsiSpan, 'B');
        }, 1200);
      } else {
        // Falló intento A y B en el mismo span -> Regla de Discontinuación Clínica
        finishOrchestrator();
      }
    } else {
      // Acierto en este paso
      const nextIndex = userCorsiIndex + 1;
      if (nextIndex < corsiSequence.length) {
        setUserCorsiIndex(nextIndex);
      } else {
        // Secuencia completada exitosamente!
        setCorsiStep('feedback');
        setCorsiFailsInSpan(0);

        if (corsiSpan < 6) {
          // Aumenta span
          setTimeout(() => {
            const nextSpan = corsiSpan + 1;
            setCorsiSpan(nextSpan);
            setCorsiTrial('A');
            launchCorsiSequence(nextSpan, 'A');
          }, 1200);
        } else {
          // Máximo span alcanzado
          finishOrchestrator();
        }
      }
    }
  };

  const finishOrchestrator = () => {
    setPhase('FINISHED');
    if (onBatteriesComplete) {
      onBatteriesComplete(trialsData);
    }
  };

  // Limpieza de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (isiTimerRef.current) clearTimeout(isiTimerRef.current);
      if (stimulusTimeoutRef.current) clearTimeout(stimulusTimeoutRef.current);
      if (window?.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="bg-[#0c101a]/95 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* ── MODAL DE PAUSA DE EMERGENCIA ── */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12172a] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Batería Pausada</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              La prueba se encuentra en pausa. Si hubo un fallo en el Bluetooth, reconecta el cubo antes de reanudar.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Reanudar Evaluación
              </button>
              <button
                type="button"
                onClick={onAbort}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Abortar al Menú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FASES DE PREPARACIÓN (TELEPROMPTER PRE-TEST) ── */}
      {phase.startsWith('PREP_') && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {testConfigs[phase]?.badge}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {testConfigs[phase]?.title}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Ensayos: {testConfigs[phase]?.trialsCount}
            </span>
          </div>

          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block mb-1">
              Constructo Neuropsicológico Evaluado
            </span>
            <p className="text-xs text-slate-300 font-medium">
              {testConfigs[phase]?.construct}
            </p>
          </div>

          {/* Caja Teleprompter */}
          <div className="bg-[#151a2d] border border-purple-500/30 rounded-xl p-5 shadow-inner relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Guion Verbal del Evaluador (Leer en voz alta):
              </span>
              <button
                type="button"
                onClick={() => speakScript(testConfigs[phase]?.script)}
                className="text-xs text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? 'Detener' : 'Escuchar'}</span>
              </button>
            </div>
            <blockquote className="text-base sm:text-lg text-slate-100 italic leading-relaxed">
              &ldquo;{testConfigs[phase]?.script}&rdquo;
            </blockquote>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Verifica que el participante tenga el cubo bien sostenido antes de arrancar.
            </span>

            <button
              type="button"
              onClick={() => {
                if (phase === 'PREP_BAT1') startReactionBattery('BAT1');
                if (phase === 'PREP_BAT2') startReactionBattery('BAT2');
                if (phase === 'PREP_BAT3') startReactionBattery('BAT3');
                if (phase === 'PREP_BAT4') startCorsiBattery();
              }}
              className="px-7 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Lanzar Batería</span>
            </button>
          </div>
        </div>
      )}

      {/* ── FASE DE PAUSA CLÍNICA / REST (CONTADOR) ── */}
      {phase.startsWith('REST_') && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Coffee className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Pausa Clínica Estandarizada
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Descanso breve para disipar la fatiga atencional residual antes del siguiente bloque.
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              {restSeconds}s
            </div>
          </div>

          <p className="text-xs text-slate-400 italic">
            El evaluador puede ofrecer agua o indicar al sujeto que relaje las manos.
          </p>

          <button
            type="button"
            onClick={() => {
              if (phase === 'REST_1') skipRest('PREP_BAT2');
              if (phase === 'REST_2') skipRest('PREP_BAT3');
              if (phase === 'REST_3') skipRest('PREP_BAT4');
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Omitir Descanso y Continuar</span>
          </button>
        </div>
      )}

      {/* ── FASE DE EJECUCIÓN: BATERÍAS 1, 2 Y 3 ── */}
      {phase.startsWith('RUN_BAT') && phase !== 'RUN_BAT4' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Barra Superior de Ejecución */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-purple-400 uppercase font-mono">
                {phase === 'RUN_BAT1' ? 'BATERÍA 1' : phase === 'RUN_BAT2' ? 'BATERÍA 2' : 'BATERÍA 3'}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Ensayo {currentTrialIdx + 1} de {deck.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {lastLatencyDisplay !== null && (
                <span className="text-xs font-mono font-bold text-cyan-300 px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/30">
                  {lastLatencyDisplay} ms
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsPaused(true)}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Pause className="w-3 h-3" />
                <span>Pausar</span>
              </button>
            </div>
          </div>

          {/* Área Principal de Estímulo */}
          <div className="min-h-[260px] rounded-2xl bg-[#090d16] border border-white/10 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {trialState === 'waiting_isi' && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white/20 animate-ping" />
                <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">
                  Preparando estímulo...
                </span>
              </div>
            )}

            {trialState === 'stimulus_active' && currentStimulus && (
              <div className="flex flex-col items-center gap-3 animate-in zoom-in-90 duration-100">
                <div 
                  className="w-32 h-32 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center transition-all"
                  style={{ backgroundColor: currentStimulus.hex }}
                >
                  <span className="text-2xl font-black text-white drop-shadow-md">
                    {currentStimulus.label}
                  </span>
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                  {currentStimulus.type === 'GO' ? '¡GIRA AHORA!' : '¡FRENO TOTAL (NO-GO)!'}
                </span>
              </div>
            )}

            {trialState === 'feedback' && trialFeedback && (
              <div className="flex flex-col items-center gap-2 animate-in zoom-in-95 duration-100">
                <span className={`text-2xl font-black font-mono ${
                  trialFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {trialFeedback.msg}
                </span>
              </div>
            )}
          </div>

          {/* Controles de Teclado de Respaldo */}
          {isKeyboardMode && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                <span>Modo Teclado: Presiona <strong>A</strong> (Rojo/Izquierda) o <strong>L</strong> (Naranjo/Derecha)</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUserTurn('L')}
                  className="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-500 cursor-pointer"
                >
                  Girar Rojo (A)
                </button>
                <button
                  type="button"
                  onClick={() => handleUserTurn('R')}
                  className="px-3 py-1 bg-orange-600 text-white rounded font-bold hover:bg-orange-500 cursor-pointer"
                >
                  Girar Naranja (L)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FASE DE EJECUCIÓN: BATERÍA 4 (CORSI 3D) ── */}
      {phase === 'RUN_BAT4' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono">
                BATERÍA 4 // CORSI 3D
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Span: {corsiSpan} · Intento {corsiTrial}
              </span>
            </div>

            <button
              type="button"
              onClick={finishOrchestrator}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Finalizar Batería
            </button>
          </div>

          {/* Área de Visualización Corsi */}
          <div className="min-h-[260px] rounded-2xl bg-[#090d16] border border-white/10 flex flex-col items-center justify-center p-6 text-center">
            {corsiStep === 'showing' && (
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                  Memorizando Secuencia...
                </span>
                <div 
                  className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300"
                  style={{ 
                    backgroundColor: activeCorsiFace 
                      ? CORSI_FACES.find(f => f.id === activeCorsiFace)?.hex 
                      : '#1e2538'
                  }}
                >
                  <span className="text-lg font-black text-black">
                    {activeCorsiFace ? CORSI_FACES.find(f => f.id === activeCorsiFace)?.name : '...'}
                  </span>
                </div>
              </div>
            )}

            {corsiStep === 'waiting_user' && (
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold animate-pulse">
                  ¡TU TURNO! Recrea la secuencia ({userCorsiIndex + 1} de {corsiSequence.length})
                </span>
                <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                  {CORSI_FACES.map((face) => (
                    <button
                      key={face.id}
                      type="button"
                      onClick={() => handleCorsiTurn(face.id)}
                      className="px-3.5 py-2 rounded-xl font-bold text-xs border border-white/10 text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      style={{ backgroundColor: face.hex, color: face.id === 'U' || face.id === 'D' ? '#000' : '#fff' }}
                    >
                      {face.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {corsiStep === 'feedback' && (
              <span className="text-xl font-bold font-mono text-purple-300">
                Verificando intento...
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── FASE FINAL: COMPLETADO ── */}
      {phase === 'FINISHED' && (
        <div className="py-8 text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              ¡Protocolo de Baterías Clínicas Finalizado!
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Se han recolectado {trialsData.length} ensayos con telemetría milimétrica continua.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onBatteriesComplete(trialsData)}
            className="px-7 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center gap-2 mx-auto cursor-pointer"
          >
            <span>Continuar a Encuesta de Salida</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
