'use client';
import { useVisuospatialTest } from '../hooks/useVisuospatialTest';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { useEffect, useRef, useState } from 'react';
import Cube3DViewer from './Cube3DViewer';

// Representando Blanco, Amarillo, Rojo, Naranjo, Azul. La cara 'B' / Verde está desactivada.
const FACE_FREQUENCIES = {
  U: 440, // La
  D: 554, // Do#
  R: 659, // Mi
  L: 880, // La (Octava)
  F: 330  // Mi (Grave)
};

const FACE_METADATA = {
  U: { name: 'Superior (U)', color: 'bg-white border-white/20', text: 'text-white', note: 'La' },
  D: { name: 'Inferior (D)', color: 'bg-yellow-400 border-yellow-500/20 text-black', text: 'text-yellow-400', note: 'Do#' },
  R: { name: 'Derecha (R)', color: 'bg-orange-500 border-orange-600/20', text: 'text-orange-500', note: 'Mi' },
  L: { name: 'Izquierda (L)', color: 'bg-red-500 border-red-600/20', text: 'text-red-500', note: 'La (Octava)' },
  F: { name: 'Frontal (F)', color: 'bg-blue-600 border-blue-700/20', text: 'text-blue-500', note: 'Mi (Grave)' }
};

// Sintetizador Web Audio API puro
const playTone = (frequency, type = 'triangle', duration = 0.4) => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05); // volume 0.25
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio Context failed to play:', e);
  }
};

export default function SimonGame({ onExit, playerName, sessionMeta, sessionStartTime, onTelemetryUpdate, isDemoMode = false }) {
  const { isConnected, subscribeToMoves, openScanner } = useBluetoothCube();

  const wasConnectedAtStartRef = useRef(isConnected);
  const requireBluetooth = wasConnectedAtStartRef.current;

  const { 
    gameState, 
    level, 
    trial,
    sequence, 
    activeFace, 
    userIndex,
    showingIndex,
    errorsInLevel, 
    telemetry, 
    startGame, 
    handleCubeInput 
  } = useVisuospatialTest(isConnected, requireBluetooth);

  // Monitor de nivel para finalizar de forma asíncrona y comprimida de 15 segundos si es modo defensa (máx Nivel 3)
  useEffect(() => {
    if (isDemoMode && level > 3 && gameState !== 'finished') {
      console.log('[Demo] Test de Corsi completado rápido en Nivel 3. Finalizando demo.');
      const finalRecord = {
        metrics: {
          corsiSpan: 3,
          maxLevelReached: 3,
          isCompleted: true,
          totalDurationMs: Date.now() - (sessionStartTime || Date.now())
        },
        telemetry: telemetry
      };
      onExit(finalRecord);
    }
  }, [level, isDemoMode, gameState, telemetry, onExit, sessionStartTime]);

  const [demoKey, setDemoKey] = useState(0);
  const [showErrorFlash, setShowErrorFlash] = useState(false);
  const [cubeSize, setCubeSize] = useState(300);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        const width = window.innerWidth;
        if (width < 640) {
          setCubeSize(260); // Móvil
        } else if (width < 1024) {
          setCubeSize(350); // Tablet
        } else {
          setCubeSize(450); // Desktop
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  const prevErrorsRef = useRef(errorsInLevel);
  const [successFlash, setSuccessFlash] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const prevUserIndexRef = useRef(userIndex);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    if (onTelemetryUpdate) {
      onTelemetryUpdate({ level, trial, telemetry, gameState });
    }
  }, [level, trial, telemetry, gameState, onTelemetryUpdate]);

  // Fallas
  useEffect(() => {
    if (errorsInLevel > prevErrorsRef.current) {
      setShowErrorFlash(true);
      setTimeout(() => setShowErrorFlash(false), 600);
    }
    prevErrorsRef.current = errorsInLevel;
  }, [errorsInLevel]);

  // Aciertos
  useEffect(() => {
    if (userIndex > prevUserIndexRef.current) {
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 300);
    }
    prevUserIndexRef.current = userIndex;
  }, [userIndex]);

  // Nivel completado
  useEffect(() => {
    if (level > prevLevelRef.current) {
      setLevelUpFlash(true);
      setTimeout(() => setLevelUpFlash(false), 1500);
    }
    prevLevelRef.current = level;
  }, [level]);

  // Incrementar demoKey cada vez que se enciende una cara nueva en la demo
  useEffect(() => {
    if (activeFace && gameState === 'showing_sequence') {
      setDemoKey(k => k + 1);
    }
  }, [activeFace, gameState]);

  // Suscribirse a los movimientos del cubo y reproducir tono
  useEffect(() => {
    const unsubscribe = subscribeToMoves((move) => {
      const face = move.replace("'", "");
      handleCubeInput(face);

      // Feedback de audio durante el turno del usuario
      if (gameState === 'waiting_for_user' && FACE_FREQUENCIES[face]) {
        playTone(FACE_FREQUENCIES[face], 'triangle', 0.35);
      }
    });
    return () => unsubscribe();
  }, [subscribeToMoves, handleCubeInput, gameState]);

  // Atajos de teclado para simulación de giros en SimonGame (Memory Mirror)
  useEffect(() => {
    const onKey = (e) => {
      if (gameState !== 'waiting_for_user') return;
      const keyUpper = e.key.toUpperCase();
      let face = null;

      if (e.key === 'ArrowRight' || keyUpper === 'L') face = 'R';
      else if (e.key === 'ArrowLeft' || keyUpper === 'A') face = 'L';
      else if (e.key === 'ArrowUp' || keyUpper === 'U') face = 'U';
      else if (e.key === 'ArrowDown' || keyUpper === 'D') face = 'D';
      else if (e.key === ' ' || e.key === 'Enter' || keyUpper === 'F') face = 'F';

      if (face) {
        handleCubeInput(face);
        // Feedback de audio durante el turno del usuario
        if (FACE_FREQUENCIES[face]) {
          playTone(FACE_FREQUENCIES[face], 'triangle', 0.35);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCubeInput, gameState]);

  // Audio durante la reproducción de la secuencia del cubo virtual
  useEffect(() => {
    if (activeFace && FACE_FREQUENCIES[activeFace]) {
      playTone(FACE_FREQUENCIES[activeFace], 'triangle', 0.4);
    }
  }, [activeFace]);

  const handleFinishTest = () => {
    const correctMoves = telemetry.filter(t => t.isCorrect);
    const avgLatencyMs = correctMoves.length > 0 
      ? Math.round(correctMoves.reduce((acc, curr) => acc + curr.latencyMs, 0) / correctMoves.length)
      : 0;

    const totalErrors = telemetry.filter(t => !t.isCorrect).length;
    const corsiSpan = level > 2 ? level - 1 : 0;
    const totalCorrectTrials = corsiSpan;

    // Resistencia Supra-Span (Tolerancia a la Sobrecarga)
    let supra_span_resistance_percentage = 0;
    if (telemetry.length > 0) {
      const lastMove = telemetry[telemetry.length - 1];
      const lastLevelTelemetry = telemetry.filter(t => t.level === lastMove.level && t.trial === lastMove.trial);
      const lastLevelCorrects = lastLevelTelemetry.filter(t => t.isCorrect).length;
      supra_span_resistance_percentage = Math.round((lastLevelCorrects / lastMove.level) * 100);
    }

    const record = {
      id: crypto.randomUUID(),
      playerName: playerName || 'Anónimo',
      date: new Date().toISOString(),
      sessionMeta,
      sessionDurationMs: Date.now() - (sessionStartTime || Date.now()),
      metrics: {
        maxLevelReached: level,
        corsiSpan,
        totalCorrectTrials,
        totalErrors,
        avgLatencyMs,
        supra_span_resistance_percentage
      },
      telemetry
    };

    // Salir y mostrar el reporte clínico
    onExit(record);
  };

  const activeMeta = FACE_METADATA[activeFace];

  const isGameActive = gameState !== 'idle' && gameState !== 'finished';
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

  return (
    <>
      <style>{`
        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-15px); }
          40%, 80% { transform: translateX(15px); }
        }
        .animate-error-shake {
          animation: error-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes success-pulse {
          0% { box-shadow: inset 0 0 0 rgba(57,255,20,0); }
          50% { box-shadow: inset 0 0 50px rgba(57,255,20,0.5); }
          100% { box-shadow: inset 0 0 0 rgba(57,255,20,0); }
        }
        .animate-success-pulse {
          animation: success-pulse 0.3s ease-out;
        }
      `}</style>
      <div className={`h-screen overflow-hidden bg-[#07080f] text-white font-sans flex flex-col selection:bg-[#c084fc]/30 w-full relative ${showErrorFlash ? 'animate-error-shake' : ''} ${successFlash ? 'animate-success-pulse' : ''}`}>
        {showErrorFlash && (
          <div className="absolute inset-0 bg-red-600/30 z-[100] pointer-events-none transition-opacity duration-300" />
        )}
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-[#0a0c10] text-center sm:text-left flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-black italic uppercase tracking-widest flex items-center gap-2">
              <span className="text-[#a855f7]">MEMORY MIRROR</span>
              <span className="text-[9px] sm:text-xs text-white/30 border border-white/10 px-2 py-0.5 rounded-full font-black font-mono">CORSI TEST</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold tracking-widest uppercase">
            <div className="text-white/40">
              Nivel: <span className="text-[#a855f7] text-lg sm:text-xl font-black drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">{level}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all ${
                trial === 'A' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
              }`}>
                {trial === 'A' ? 'Oportunidad 1 de 2' : 'ÚLTIMO INTENTO'}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <div className="flex flex-1 overflow-hidden relative min-h-0">
          {/* PANEL IZQUIERDO: GEMELO DIGITAL Y ESTADO */}
          <div className="flex-1 flex flex-col items-center justify-center relative p-4 sm:p-8 min-h-0">
            
            <div className="absolute top-4 sm:top-8 text-center w-full z-10 px-4">
              {gameState === 'idle' && (
                <p className="text-white/40 font-bold tracking-[0.25em] uppercase text-[10px] sm:text-sm">
                  MEMORIA VISOESPACIAL DE TRABAJO (TEST DE CORSI)
                </p>
              )}
              {gameState === 'showing_sequence' && (
                <div className="flex flex-col items-center gap-2 sm:gap-4">
                  <p className="text-[#00FFFF] font-black tracking-[0.3em] uppercase text-sm sm:text-xl animate-pulse drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                    OBSERVA LA SECUENCIA
                  </p>
                  <div className="flex gap-1.5">
                    {sequence.map((_, i) => (
                      <div key={i} className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${i <= showingIndex ? 'bg-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.8)] scale-110' : 'border-2 border-[#00FFFF]/30 bg-transparent'}`} />
                    ))}
                  </div>
                </div>
              )}
              {gameState === 'waiting_for_user' && (
                <div className="flex flex-col items-center gap-2 sm:gap-4">
                  <p className="text-[#39FF14] font-black tracking-[0.3em] uppercase text-sm sm:text-xl drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
                    TU TURNO (REPLICA)
                  </p>
                  <div className="flex gap-1.5">
                    {sequence.map((_, i) => (
                      <div key={i} className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${i < userIndex ? 'bg-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.8)]' : i === userIndex ? 'bg-[#39FF14]/50 animate-pulse border-2 border-[#39FF14]' : 'border-2 border-[#39FF14]/30 bg-transparent'}`} />
                    ))}
                  </div>
                </div>
              )}
              {gameState === 'error_delay' && (
                <div className="flex flex-col items-center justify-center h-full animate-pulse">
                  <p className="text-[#FF5F1F] font-black tracking-[0.3em] uppercase text-lg sm:text-2xl drop-shadow-[0_0_20px_rgba(255,95,31,0.8)]">
                    ¡ERROR DE SECUENCIA!
                  </p>
                  <p className="text-white/60 font-bold tracking-widest mt-1 sm:mt-2 text-xs sm:text-sm">PREPARANDO NUEVO INTENTO...</p>
                </div>
              )}
              {gameState === 'level_up_delay' && (
                <div className="flex flex-col items-center justify-center h-full animate-pulse">
                  <p className="text-[#39FF14] font-black tracking-[0.3em] uppercase text-xl sm:text-3xl drop-shadow-[0_0_30px_rgba(57,255,20,0.8)]">
                    ¡NIVEL COMPLETADO!
                  </p>
                  <p className="text-white/80 font-bold tracking-widest mt-1 sm:mt-2 text-xs sm:text-sm">PREPARANDO NIVEL {level + 1}...</p>
                </div>
              )}
              {gameState === 'finished' && (
                <p className="text-[#FF5F1F] font-black tracking-[0.3em] uppercase text-sm sm:text-xl drop-shadow-[0_0_10px_rgba(255,95,31,0.5)]">
                  EVALUACIÓN COMPLETADA
                </p>
              )}
            </div>

            {/* FLOAT GLASS HUD PANEL FOR PLAYING CAPAS */}
            {activeMeta && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 md:left-8 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:translate-x-0 bg-[#13161e]/85 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex md:flex-col items-center gap-3 w-64 md:w-48 shadow-2xl z-20 transition-all duration-300 scale-100">
                <span className="text-[9px] font-black tracking-widest text-white/40 uppercase md:block hidden">Capa Activa</span>
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${activeMeta.color} shadow-2xl flex items-center justify-center font-black text-lg md:text-2xl text-black border shrink-0`}>
                  {activeFace}
                </div>
                <div className="text-left md:text-center">
                  <p className={`font-black uppercase tracking-wider text-xs ${activeMeta.text}`}>{activeMeta.name}</p>
                  <p className="text-[9px] text-white/40 font-mono mt-0.5 font-bold">Nota: {activeMeta.note}</p>
                </div>
              </div>
            )}

            {/* ÁREA DEL CUBO */}
            <div style={{ width: `${cubeSize}px`, height: `${cubeSize}px` }} className="relative transition-all duration-300 flex items-center justify-center">
              {activeFace && gameState === 'showing_sequence' && (
                <div className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50 -mt-6 sm:-mt-8">
                  <span className="text-[1.8rem] sm:text-[3rem] font-black text-white/90 drop-shadow-[0_0_30px_rgba(255,255,255,1)] tracking-[0.3em] uppercase">
                    {activeFace === 'U' ? 'BLANCO' : 
                     activeFace === 'D' ? 'AMARILLO' : 
                     activeFace === 'R' ? 'NARANJA' : 
                     activeFace === 'L' ? 'ROJO' : 
                     activeFace === 'F' ? 'AZUL' : ''}
                  </span>
                </div>
              )}
              <Cube3DViewer 
                status={gameState === 'finished' ? 'eval_celebration' : 'gyro_active'} 
                size={cubeSize} 
                highlightFace={activeFace} 
                demoMoves={activeFace && gameState === 'showing_sequence' ? [activeFace, `${activeFace}'`] : null}
                demoKey={demoKey}
                ignoreSensor={gameState !== 'waiting_for_user' && gameState !== 'idle'}
              />
            </div>

            <div className="absolute bottom-6 sm:bottom-8 text-center w-full z-10 px-4">
               {gameState === 'idle' && (
                  <button 
                    onClick={startGame}
                    disabled={!isConnected}
                    className={`px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-xs sm:text-sm tracking-[0.25em] transition-all max-w-[280px] sm:max-w-none
                      ${isConnected 
                        ? 'bg-gradient-to-r from-[#a855f7] to-[#c084fc] hover:scale-105 shadow-[0_0_30px_rgba(168,85,247,0.4)] text-white cursor-pointer' 
                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                      }`}
                  >
                    {isConnected ? 'INICIAR PRUEBA' : 'CONECTA EL CUBO PRIMERO'}
                  </button>
               )}
               {gameState === 'finished' && (
                  <button 
                    onClick={handleFinishTest}
                    className="px-8 py-4 bg-white text-black font-black uppercase text-sm tracking-[0.3em] rounded-2xl hover:bg-[#a855f7] hover:text-white hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] cursor-pointer"
                  >
                    FINALIZAR PRUEBA
                  </button>
               )}
            </div>
          </div>

        {/* PANEL DERECHO: TELEMETRÍA (Solo visible en debug/clínico en desktop) */}
        <div className="hidden lg:flex w-96 bg-[#13161e] border-l border-white/5 p-6 flex-col min-h-0">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-4 pb-4 border-b border-white/5 shrink-0">
            Telemetría en Vivo
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 font-mono text-xs custom-scrollbar min-h-0">
            {telemetry.length === 0 ? (
              <div className="text-white/20 italic">Esperando movimientos del cubo inteligente...</div>
            ) : (
              telemetry.map((t, i) => (
                <div key={i} className={`p-3 rounded-lg border flex flex-col gap-1.5 ${
                  t.isCorrect 
                    ? 'bg-[#39FF14]/5 border-[#39FF14]/20' 
                    : 'bg-[#FF5F1F]/5 border-[#FF5F1F]/20'
                }`}>
                  <div className="flex justify-between items-center text-white/60">
                    <span className="font-black">Lvl {t.level} (Intento {t.trial})</span>
                    <span className="font-bold">{t.latencyMs}ms</span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span>Esperado: {t.expectedFace}</span>
                    <span className={t.isCorrect ? 'text-[#39FF14]' : 'text-[#FF5F1F]'}>
                      Girado: {t.userFace}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
