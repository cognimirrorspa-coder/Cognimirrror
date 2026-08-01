'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { useCubeState } from '../contexts/CubeStateContext';
import { useJoicube } from '../contexts/JoicubeContext';
import Cube3DViewer from './Cube3DViewer';

// ── GENERADOR DE MAZO CLÍNICO ESTRICTO ──
function generateDeck() {
  const NOGO_COLORS = [
    { id: 'NONE', label: 'VERDE', hex: '#22c55e', type: 'NOGO' },
    { id: 'NONE', label: 'AZUL', hex: '#3b82f6', type: 'NOGO' }
  ];

  const TOTAL_ROUNDS = 40;

  let validDeck = false;
  let attempt = [];

  while (!validDeck) {
    attempt = [];
    let counts = { R: 16, L: 16, NOGO: 8 };
    let failed = false;

    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      let available = [];
      if (counts.R > 0) available.push('R');
      if (counts.L > 0) available.push('L');
      if (counts.NOGO > 0) available.push('NOGO');

      // Regla de Orden: Los primeros 4 deben ser SIEMPRE GO (Respuesta Prepotente / Arranque Ciego)
      if (i < 4) {
        available = available.filter(t => t !== 'NOGO');
      }

      // Regla: No terminar con falso (NOGO)
      if (i === TOTAL_ROUNDS - 1) {
        available = available.filter(t => t !== 'NOGO');
      }

      // Regla Clínica: Distancia mínima de 2 estímulos GO entre NOGOs (Prohibido juntar trampas)
      if (i > 0 && (attempt[i - 1] === 'NOGO' || (i > 1 && attempt[i - 2] === 'NOGO'))) {
        available = available.filter(t => t !== 'NOGO');
      }

      // Regla: No repetir más de 2 colores seguidos
      if (i >= 2) {
        const prev1 = attempt[i - 1];
        const prev2 = attempt[i - 2];
        if (prev1 === prev2 && prev1 !== 'NOGO') {
          available = available.filter(t => t !== prev1);
        }
      }

      if (available.length === 0) {
        failed = true;
        break; 
      }

      const pick = available[Math.floor(Math.random() * available.length)];
      counts[pick]--;
      attempt.push(pick);
    }

    if (!failed) validDeck = true;
  }

  // Traducción a objetos ricos
  return attempt.map(t => {
    if (t === 'R') return { id: 'R', label: 'NARANJO', hex: '#FF8C00', type: 'GO' };
    if (t === 'L') return { id: 'L', label: 'ROJO', hex: '#FF0000', type: 'GO' };
    return NOGO_COLORS[Math.floor(Math.random() * NOGO_COLORS.length)];
  });
}

export default function ReactionGame({ onExit, activePatientId, addSession, getPatient, sessionMeta, sessionStartTime, isWarmup = false, isDemoMode = false, etiquetaEstudio = null, idSujeto = null, onTelemetryUpdate }) {
  const { subscribeToMoves, isConnected, openScanner } = useBluetoothCube();
  const { cubeRotation: globalRotation } = useCubeState();
  const { deactivate: deactivateJoicube } = useJoicube();

  const wasConnectedAtStartRef = useRef(isConnected);
  const requireBluetooth = wasConnectedAtStartRef.current;

  // --- WARMUP TIMER ---
  const [warmupTimeLeft, setWarmupTimeLeft] = useState(15);
  const [warmupFinished, setWarmupFinished] = useState(false);
  const [cubeSize, setCubeSize] = useState(300);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        const width = window.innerWidth;
        if (width < 640) {
          setCubeSize(240); // Móvil
        } else if (width < 1024) {
          setCubeSize(280); // Tablet
        } else {
          setCubeSize(350); // Desktop
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!isWarmup) return;
    const timer = setInterval(() => {
      setWarmupTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setWarmupFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isWarmup]);

  // Al montar: desactivar Joicube para que el cubo vuelva a BLE nativo
  useEffect(() => {
    deactivateJoicube();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mazo estático y generado para las 15 rondas (cortado a 5 en demo/ensayo)
  const deck = useMemo(() => {
    const fullDeck = generateDeck();
    if (isWarmup || isDemoMode) {
      return fullDeck.slice(0, 5);
    }
    return fullDeck;
  }, [isWarmup, isDemoMode]);

  const [stage, setStage] = useState('waiting'); // waiting | stimulus | finished
  const [round, setRound] = useState(0); 
  const [flash, setFlash] = useState(null); // 'red', 'green', 'black', 'grey'
  const [shake, setShake] = useState(0);

  const [results, setResults] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showRachaReset, setShowRachaReset] = useState(false); // Para efecto humo

  useEffect(() => {
    if (onTelemetryUpdate) {
      onTelemetryUpdate({ round, results, stage });
    }
  }, [round, results, stage, onTelemetryUpdate]);
  
  // Refs para métricas críticas y lógicas temporales
  const timerRef = useRef(0);
  const nogoTimeoutRef = useRef(null);
  const goTimeoutRef = useRef(null);
  const stageRef = useRef('waiting');
  const targetRef = useRef(null);

  // Curva de Dificultad
  const baseDelayRef = useRef(1500); // 1.5s inicial

  // Tiempos Maestros
  const gameStartTimeRef = useRef(null);

  // --- PAUSA POR DESCONEXIÓN BLE ---
  useEffect(() => {
    if (requireBluetooth && !isConnected && stage !== 'finished' && stage !== 'rules' && round < deck.length) {
      if (nogoTimeoutRef.current) clearTimeout(nogoTimeoutRef.current);
      if (goTimeoutRef.current) clearTimeout(goTimeoutRef.current);
      setStage('waiting');
      stageRef.current = 'waiting';
      setFlash(null);
    }
  }, [isConnected, stage, round, deck?.length, requireBluetooth]);

  // ── CICLO DEL JUEGO ──
  useEffect(() => {
    if (requireBluetooth && !isConnected) return; // Si no hay conexión, pausar programación de estímulos

    if (stage === 'waiting' && round < deck.length) {
      // Ritmo Inter-Estímulo (ISI): Aleatorio estricto para crear 'Arousal' (400ms - 800ms)
      const waitTime = 400 + Math.random() * 400; 
      
      const tid = setTimeout(() => {
        const target = deck[round];
        targetRef.current = target;
        
        setStage('stimulus');
        stageRef.current = 'stimulus';
        timerRef.current = performance.now();

        // Si es NOGO, esperamos la ventana de inhibición completa de 800ms
        if (target.type === 'NOGO') {
          nogoTimeoutRef.current = setTimeout(() => {
            // Inhibición Exitosa (No movió)
            setFlash('green');
            setResults(prev => [...prev, { 
              round: round + 1, 
              type: 'NOGO', 
              label: target.label, // Nombre del color distractor
              expected: 'NOGO',
              actualFace: null,
              fail: false, 
              time: null,
              status: 'Ok'
            }]);
            
            // Logica Rachas: Acierto NOGO
            setCurrentStreak(s => {
              const next = s + 1;
              if (next > maxStreak) setMaxStreak(next);
              return next;
            });

            setStage('waiting');
            stageRef.current = 'waiting';
            setRound(r => r + 1);
            setTimeout(() => setFlash(null), 300);
          }, 800); 
        } 
        // Si es GO, le damos un hard timeout de 800ms para responder rápido
        else if (target.type === 'GO') {
          
          goTimeoutRef.current = setTimeout(() => {
            // Límite final excedido (No respondió correctamente a tiempo)
            setFlash('black'); 
            setShake(s => s + 1);
            setCurrentStreak(0);
            setShowRachaReset(true);
            setTimeout(() => setShowRachaReset(false), 600);

            setResults(prev => {
               const existsIdx = prev.findIndex(r => r.round === round + 1);
               if (existsIdx > -1) {
                 const copy = [...prev];
                 copy[existsIdx].timeout = true;
                 copy[existsIdx].status = 'Omisión / Lento';
                 return copy;
               }
               return [...prev, { round: round + 1, type: 'GO', expected: target.id, actualFace: null, time: null, errors: 0, timeout: true, status: 'Omisión / Lento' }];
            });

            setStage('waiting');
            stageRef.current = 'waiting';
            setRound(r => r + 1);
            setTimeout(() => setFlash(null), 300);
          }, 800);
        }

      }, waitTime);
      
      return () => clearTimeout(tid);
    } else if (stage === 'waiting' && round >= deck.length) {
      setStage('finished');
      stageRef.current = 'finished';
      if (!isWarmup) {
        persistData();
      } else {
        setWarmupFinished(true);
      }
    }
  }, [stage, round, deck, isConnected]);
  
  const persistData = async () => {
    const goResults = results.filter(r => r.type === 'GO' && !r.timeout);
    const timeTotal = goResults.reduce((acc, r) => acc + r.time, 0) || 0;
    const gameDuration = gameStartTimeRef.current ? Math.round(performance.now() - gameStartTimeRef.current) : 0;
    const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    
    // Filtros por mano (Aciertos perfectos -> errors === 0)
    const aciertosRojo = goResults.filter(r => r.expected === 'L' && (r.errors === 0 || r.errors === undefined)).length;
    const aciertosNaranja = goResults.filter(r => r.expected === 'R' && (r.errors === 0 || r.errors === undefined)).length;
    
    // Filtros errados
    const goL = goResults.filter(r => r.expected === 'L');
    const goR = goResults.filter(r => r.expected === 'R');

    const avgL = goL.length ? Math.round(goL.reduce((a, r) => a + r.time, 0) / goL.length) : 0;
    const avgR = goR.length ? Math.round(goR.reduce((a, r) => a + r.time, 0) / goR.length) : 0;
    
    const nogoFails = results.filter(r => r.type === 'NOGO' && r.fail).length;

    const sessionData = {
      id: crypto.randomUUID(),
      testType: 'reaction',
      date: new Date().toISOString(),
      sessionMeta,
      clinicalLabel: isWarmup ? 'Calentamiento' : (etiquetaEstudio ? 'Evaluación Oficial' : null),
      etiquetaEstudio: etiquetaEstudio,
      idSujeto: idSujeto || (getPatient(activePatientId)?.idSujeto || null),
      metrics: { 
        tiempo_total: Math.round(timeTotal),
        aciertos_rojo: aciertosRojo,
        aciertos_naranja: aciertosNaranja,
        errores_falsos: nogoFails,
        tiempo_promedio_por_mano: {
          L: avgL,
          R: avgR
        },
        game_duration_ms: gameDuration,
        session_duration_ms: sessionDuration,
        max_streak: maxStreak
      },
      rawTurnsData: results
    };

    let savedSession = null;
    if (!isWarmup) {
      savedSession = await addSession(activePatientId, sessionData);
    } else {
      savedSession = {
        sessionId: 'warmup-' + Date.now(),
        testType: 'reaction',
        attemptNumber: 0,
        clinicalLabel: 'Calentamiento (Práctica)',
        date: new Date().toISOString(),
        stats: sessionData.metrics,
        rawTurnsData: sessionData.rawTurnsData
      };
    }
    const patientObj = getPatient(activePatientId);

    if (onExit) onExit(savedSession, patientObj);
  };

  // ── BLUETOOTH LISTENER ──
  const handleMove = useCallback((movimiento) => {

    if (stageRef.current !== 'stimulus') return;

    const rt = performance.now() - timerRef.current;
    const target = targetRef.current;
    const currentMove = movimiento.replace("'", ""); // Limpiamos giros antihorarios

    if (target.type === 'NOGO') {
      // FALLLO DE INHIBICIÓN SI SE MUEVE
      clearTimeout(nogoTimeoutRef.current);
      setFlash('black'); // Flash obscuro para fallo grave
      setShake(s => s + 1);
      
      setResults(prev => [...prev, { 
        round: round + 1, 
        type: 'NOGO', 
        label: target.label, 
        expected: 'NOGO',
        actualFace: currentMove,
        fail: true, 
        time: Math.round(rt), // Velocidad de Impulso (Clínico)
        status: 'Fallo de Inhibición'
      }]);
      
      // Reset Racha por fallo No-Go
      setCurrentStreak(0);
      setShowRachaReset(true);
      setTimeout(() => setShowRachaReset(false), 600);

      setStage('waiting');
      stageRef.current = 'waiting';
      setRound(r => r + 1);
      setTimeout(() => setFlash(null), 300);

    } else if (target.type === 'GO') {
      if (currentMove === target.id) {
        // ACIERTO
        clearTimeout(goTimeoutRef.current);
        setFlash('green');

        // Aumenta la velocidad para el siguiente Hit! (x0.9)
        baseDelayRef.current = Math.max(500, baseDelayRef.current * 0.9); 
        
        // Logica Rachas
        setCurrentStreak(s => {
          const next = s + 1;
          if (next > maxStreak) setMaxStreak(next);
          return next;
        });

        setResults(prev => {
          // Si ya hubo un error previo en esta ronda, lo marcamos como Corregido
          const hasError = prev.some(r => r.round === round + 1 && r.status === 'Error de Lado');
          return [...prev, { 
            round: round + 1, 
            type: 'GO', 
            expected: target.id, 
            actualFace: target.id,
            time: Math.round(rt), 
            errors: hasError ? 1 : 0, 
            status: hasError ? 'Corregido' : 'Ok' 
          }];
        });

        setStage('waiting');
        stageRef.current = 'waiting';
        setRound(r => r + 1);
        setTimeout(() => setFlash(null), 150); // REFINADO: Transición ultra-rápida (150ms)
      } else {
        // ERROR DE LADO EN GO PROSPECT (Se equivocó de mano)
        setFlash('red');
        setShake(s => s + 1);

        setResults(prev => [...prev, { 
          round: round + 1, 
          type: 'GO', 
          expected: target.id, 
          actualFace: currentMove,
          time: Math.round(rt), 
          errors: 1, 
          status: 'Error de Lado' 
        }]);

        // Reset racha por error de mano
        setCurrentStreak(0);
        setShowRachaReset(true);
        setTimeout(() => setShowRachaReset(false), 600);

        // -- NO CAMBIAMOS EL STAGE --
        // Mantenemos el estímulo activo para permitir Redención
        setTimeout(() => setFlash(null), 300);
      }
    }
  }, [round]);

  useEffect(() => {
    const unsub = subscribeToMoves(handleMove);
    return () => {
      unsub();
      clearTimeout(nogoTimeoutRef.current);
      clearTimeout(goTimeoutRef.current);
    };
  }, [subscribeToMoves, handleMove]);

  // Atajos teclado
  useEffect(() => {
    const onKey = (e) => {
      const keyUpper = e.key.toUpperCase();
      if (e.key === 'ArrowRight' || keyUpper === 'L') handleMove('R');
      if (e.key === 'ArrowLeft' || keyUpper === 'A') handleMove('L');
      if (e.key === 'ArrowUp') handleMove('U');
      if (e.key === 'Enter') handleMove('L2');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMove]);

  // ── RENDER ──
  // --- PAUSA POR DESCONEXIÓN ---
  const isGameActive = stage !== 'finished' && stage !== 'rules' && round < deck.length;
  const showDisconnectOverlay = requireBluetooth && !isConnected && isGameActive;

  if (showDisconnectOverlay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#07080f]/95 text-white absolute inset-0 z-[100] font-sans select-none">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-red-600/10 blur-[130px]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-red-500/5 animate-pulse">
            ⚠️
          </div>
          <h2 className="text-2xl font-black mb-3 text-white tracking-tight uppercase">Conexión Perdida</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-8">
            Se ha interrumpido la conexión Bluetooth con el cubo inteligente. Hemos pausado la prueba para que no pierdas tu progreso.
          </p>
          
          <button
            onClick={openScanner}
            className="w-full py-4.5 bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 transition-all text-white font-black uppercase text-[10px] tracking-widest rounded-2xl cursor-pointer mb-4 animate-pulse"
          >
            Reconectar Cubo
          </button>
          
          <button
            onClick={() => onExit(null)}
            className="w-full py-4.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-300 font-bold uppercase text-[10px] tracking-widest rounded-2xl cursor-pointer"
          >
            Abandonar Prueba
          </button>
        </div>
      </div>
    );
  }

  if (isWarmup && warmupFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#07080f] text-white absolute inset-0 z-50 font-sans select-none">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-orange-600/10 blur-[130px]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-orange-500/5 animate-bounce">
            🔥
          </div>
          <h2 className="text-2xl font-black mb-3 text-white tracking-tight uppercase">Calentamiento Finalizado</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-8">
            Has completado la práctica libre de 15 segundos. Ahora ya sabes cómo reaccionar a las caras del cubo Rubik según los colores de la pantalla.
          </p>
          <button
            onClick={() => onExit(null)}
            className="w-full py-4.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 transition-all text-white font-black uppercase text-[10px] tracking-widest rounded-2xl cursor-pointer"
          >
            Entendido, volver al menú
          </button>
        </div>
      </div>
    );
  }

  const activeColor = stage === 'stimulus' ? targetRef.current.hex : 'transparent';
  let bgColorClass = 'bg-[#07080f]';
  if (flash === 'red') bgColorClass = 'bg-[#4a0000]';
  else if (flash === 'green') bgColorClass = 'bg-[#003a00]';
  else if (flash === 'black') bgColorClass = 'bg-stone-900'; // Flash de error NOGO/TimeOut

  return (
    <div className={`relative w-full h-screen overflow-hidden flex items-center justify-center transition-colors duration-[0.1s] ${bgColorClass}`}>
      {isWarmup && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 bg-orange-500/10 border border-orange-500/25 rounded-full flex items-center gap-3 text-[10px] font-black text-orange-400 uppercase tracking-widest backdrop-blur-md shadow-lg shadow-orange-500/5 select-none">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping shrink-0" />
          Modo Calentamiento (Tiempo: {warmupTimeLeft}s)
        </div>
      )}
      
      {/* ── FASE: JUEGO ── */}
      {stage !== 'rules' && (
        <>
          {/* Estímulo de fondo destellante ultrarrápido */}
          {stage === 'stimulus' && (
            <div 
              className="absolute inset-0 z-0 transition-opacity duration-[0.05s]"
              style={{
                background: `radial-gradient(circle at center, ${activeColor}90 0%, transparent 80%)`
              }}
            />
          )}

          {/* CUBITO VIRTUAL Y TEXTO */}
          <div className="z-10 flex flex-col items-center justify-center w-full max-w-sm gap-8 relative">
            <motion.div 
              animate={{ x: shake ? [-25, 25, -20, 20, -10, 10, 0] : 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-3xl p-2 transition-all duration-[0.05s] ${stage === 'stimulus' ? 'border-[3px] bg-black/60 backdrop-blur-md' : 'border border-white/5 bg-white/[0.02]'}`}
              style={{ 
                borderColor: stage === 'stimulus' ? activeColor : 'rgba(255,255,255,0.05)',
                boxShadow: stage === 'stimulus' ? `0 0 120px ${activeColor}` : 'none'
              }}
            >
              <Cube3DViewer size={cubeSize} status="gyro_active" targetRotation={globalRotation} />
              
              {/* FEEDBACK ON-FIRE */}
              <AnimatePresence>
                {currentStreak > 0 && (
                  <motion.div 
                    initial={{ opacity:0, x: 20 }} animate={{ opacity:1, x: 0 }} exit={{ opacity:0, scale:0.5 }}
                    className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20"
                  >
                    <div 
                      className="relative"
                      style={{ transform: `scale(${Math.min(1 + (currentStreak * 0.05), 2.5)})` }} // REFINADO: Escalamiento dinámico
                    >
                      {currentStreak > 5 && (
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0], filter: ['blur(10px)', 'blur(20px)', 'blur(10px)'] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="absolute inset-0 bg-orange-600 rounded-full opacity-60 z-0" 
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-center">
                         <span className="text-orange-500 font-extrabold text-xs tracking-tighter uppercase">Streak</span>
                         <span className="text-white font-black text-4xl leading-none">{currentStreak}</span>
                         {currentStreak >= 3 && (
                           <motion.span 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="bg-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded mt-1 shadow-[0_0_15px_#f97316]"
                           >
                             x{Math.floor(currentStreak/3) + 1}
                           </motion.span>
                         )}
                         {currentStreak > 5 && <span className="text-2xl mt-1">🔥</span>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* EFECTO HUMO (RESET) */}
              <AnimatePresence>
                {showRachaReset && (
                  <motion.div 
                    initial={{ opacity: 1, scale: 0.5, y: 0 }}
                    animate={{ opacity: 0, scale: 2, y: -50 }}
                    className="absolute inset-0 bg-white/10 rounded-3xl z-40 backdrop-blur-sm pointer-events-none flex items-center justify-center font-black text-white/40 tracking-widest text-lg"
                  >
                    COMBO BREAKER
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Cajas de texto limpias Zero-Scroll */}
            <div className="h-24 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {stage === 'waiting' && round < deck.length && (
                  <motion.p key="wait" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{ duration: 0.1 }} className="text-white/20 uppercase tracking-[0.5em] font-black cursor-default">
                    Atento...
                  </motion.p>
                )}
                {stage === 'stimulus' && (
                  <motion.h1 
                    key="stim" initial={{opacity:0, scale:0.7}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:1.2}}
                    transition={{ duration: 0.05 }}
                    className="text-6xl md:text-8xl font-black uppercase tracking-tighter"
                    style={{ color: activeColor, textShadow: `0 0 50px ${activeColor}` }}
                  >
                    {targetRef.current.label}
                  </motion.h1>
                )}
              </AnimatePresence>
            </div>
            
            <span className="absolute top-4 right-4 text-[10px] font-black tracking-widest text-white/30 uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Ronda {round + 1} / {deck.length}
            </span>
          </div>
        </>
      )}

    </div>
  );
}
