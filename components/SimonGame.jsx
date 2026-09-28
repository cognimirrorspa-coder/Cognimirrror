'use client';

import { useVisuospatialTest } from '../hooks/useVisuospatialTest';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import Cube3DViewer from './Cube3DViewer';
import { 
  Brain, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Keyboard 
} from 'lucide-react';

// Frecuencias pentatónicas armoniosas para las 5 caras principales
const FACE_FREQUENCIES = {
  U: 440, // La
  D: 554, // Do#
  R: 659, // Mi
  L: 880, // La (Octava)
  F: 330  // Mi (Grave)
};

const FACE_METADATA = {
  U: { name: 'Superior (U)', colorName: 'BLANCO', color: 'bg-white border-white/40 text-black', text: 'text-white', note: 'La', hex: '#FFFFFF', key: 'W / U' },
  D: { name: 'Inferior (D)', colorName: 'AMARILLO', color: 'bg-yellow-400 border-yellow-500/40 text-black', text: 'text-yellow-400', note: 'Do#', hex: '#EAB308', key: 'S / D' },
  R: { name: 'Derecha (R)', colorName: 'NARANJA', color: 'bg-orange-500 border-orange-600/40 text-white', text: 'text-orange-400', note: 'Mi', hex: '#F97316', key: 'L / →' },
  L: { name: 'Izquierda (L)', colorName: 'ROJO', color: 'bg-red-500 border-red-600/40 text-white', text: 'text-red-400', note: 'La (Octava)', hex: '#EF4444', key: 'A / ←' },
  F: { name: 'Frontal (F)', colorName: 'AZUL', color: 'bg-blue-600 border-blue-700/40 text-white', text: 'text-blue-400', note: 'Mi (Grave)', hex: '#2563EB', key: 'Espacio / F' }
};

// Sintetizador Web Audio API puro y seguro
let audioCtxInstance = null;
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtxInstance) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtxInstance = new AudioCtx();
    }
    if (audioCtxInstance && audioCtxInstance.state === 'suspended') {
      audioCtxInstance.resume();
    }
    return audioCtxInstance;
  } catch (e) {
    return null;
  }
};

const playTone = (frequency, type = 'triangle', duration = 0.4) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
};

export default function SimonGame({
  onExit,
  playerName = 'Estudiante',
  sessionMeta = null,
  sessionStartTime = null,
  onTelemetryUpdate = null,
  isDemoMode = false
}) {
  const { isConnected, subscribeToMoves, openScanner, isKeyboardMode } = useBluetoothCube();

  const wasConnectedAtStartRef = useRef(isConnected);
  const requireBluetooth = !isKeyboardMode && wasConnectedAtStartRef.current;

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
  } = useVisuospatialTest(isKeyboardMode ? true : isConnected, requireBluetooth);

  const [demoKey, setDemoKey] = useState(0);
  const [showErrorFlash, setShowErrorFlash] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [cubeSize, setCubeSize] = useState(300);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Responsive cube sizing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        const width = window.innerWidth;
        if (width < 640) setCubeSize(240);
        else if (width < 1024) setCubeSize(320);
        else setCubeSize(400);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const prevErrorsRef = useRef(errorsInLevel);
  const prevUserIndexRef = useRef(userIndex);

  // Actualización de telemetría a componentes padre
  useEffect(() => {
    if (onTelemetryUpdate) {
      onTelemetryUpdate({ level, trial, telemetry, gameState });
    }
  }, [level, trial, telemetry, gameState, onTelemetryUpdate]);

  // Flash visual de error
  useEffect(() => {
    if (errorsInLevel > prevErrorsRef.current) {
      setShowErrorFlash(true);
      setTimeout(() => setShowErrorFlash(false), 500);
    }
    prevErrorsRef.current = errorsInLevel;
  }, [errorsInLevel]);

  // Flash visual de acierto
  useEffect(() => {
    if (userIndex > prevUserIndexRef.current) {
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 250);
    }
    prevUserIndexRef.current = userIndex;
  }, [userIndex]);

  // Incrementar demoKey cada vez que se enciende una cara nueva en la secuencia
  useEffect(() => {
    if (activeFace && gameState === 'showing_sequence') {
      setDemoKey(k => k + 1);
    }
  }, [activeFace, gameState]);

  // Suscribirse a movimientos BLE del cubo inteligente
  useEffect(() => {
    const unsub = subscribeToMoves((move) => {
      if (!move) return;
      const face = move.replace("'", "").charAt(0).toUpperCase();
      handleCubeInput(face);

      // Feedback sonoro durante el turno del usuario
      if (gameState === 'waiting_for_user' && soundEnabled && FACE_FREQUENCIES[face]) {
        playTone(FACE_FREQUENCIES[face], 'triangle', 0.35);
      }
    });
    return () => unsub();
  }, [subscribeToMoves, handleCubeInput, gameState, soundEnabled]);

  // Controles de teclado
  useEffect(() => {
    const onKey = (e) => {
      const keyUpper = e.key.toUpperCase();

      if (gameState === 'idle' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startGame();
        return;
      }

      if (gameState !== 'waiting_for_user') return;

      let face = null;
      if (e.key === 'ArrowRight' || keyUpper === 'L' || keyUpper === 'R') face = 'R';
      else if (e.key === 'ArrowLeft' || keyUpper === 'A') face = 'L';
      else if (e.key === 'ArrowUp' || keyUpper === 'W' || keyUpper === 'U') face = 'U';
      else if (e.key === 'ArrowDown' || keyUpper === 'S' || keyUpper === 'D') face = 'D';
      else if (e.key === ' ' || e.key === 'Enter' || keyUpper === 'F') face = 'F';

      if (face) {
        e.preventDefault();
        handleCubeInput(face);
        if (soundEnabled && FACE_FREQUENCIES[face]) {
          playTone(FACE_FREQUENCIES[face], 'triangle', 0.35);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCubeInput, gameState, startGame, soundEnabled]);

  // Audio durante la reproducción de la secuencia del cubo virtual
  useEffect(() => {
    if (activeFace && soundEnabled && FACE_FREQUENCIES[activeFace]) {
      playTone(FACE_FREQUENCIES[activeFace], 'triangle', 0.4);
    }
  }, [activeFace, soundEnabled]);

  // Auto-finalización en modo demo si pasa el nivel 3
  useEffect(() => {
    if (isDemoMode && level > 3 && gameState !== 'finished') {
      console.log('[Demo] Test de Corsi completado en Nivel 3. Finalizando.');
      handleFinishTest();
    }
  }, [level, isDemoMode, gameState]);

  // Manejo de finalización y cálculo de métricas clínicas Corsi
  const handleFinishTest = useCallback(() => {
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
      supra_span_resistance_percentage = Math.round((lastLevelCorrects / (lastMove.level || 2)) * 100);
    }

    const record = {
      id: crypto.randomUUID(),
      playerName: playerName || 'Estudiante',
      date: new Date().toISOString(),
      sessionMeta,
      sessionDurationMs: Date.now() - (sessionStartTime || Date.now()),
      metrics: {
        maxLevelReached: level,
        corsiSpan,
        totalCorrectTrials,
        totalErrors,
        avgLatencyMs,
        supra_span_resistance_percentage,
        isKeyboardMode: Boolean(isKeyboardMode),
        modo_evaluacion: isKeyboardMode ? 'teclado_sin_cubo' : 'cubo_bluetooth'
      },
      stats: {
        maxLevelReached: level,
        corsiSpan,
        totalCorrectTrials,
        totalErrors,
        avgLatencyMs,
        supra_span_resistance_percentage
      },
      telemetry
    };

    onExit(record);
  }, [telemetry, level, playerName, sessionMeta, sessionStartTime, isKeyboardMode, onExit]);

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
            Se ha interrumpido la conexión Bluetooth con el cubo. Pausamos la prueba para que no pierdas tu progreso.
          </p>
          
          <button
            onClick={openScanner}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 transition-all text-white font-black uppercase text-[10px] tracking-widest rounded-2xl cursor-pointer mb-4 animate-pulse"
          >
            Reconectar Cubo
          </button>
          
          <button
            onClick={() => onExit(null)}
            className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-300 font-bold uppercase text-[10px] tracking-widest rounded-2xl cursor-pointer"
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
        
        {/* Flash de error en pantalla completa */}
        {showErrorFlash && (
          <div className="absolute inset-0 bg-red-600/30 z-[100] pointer-events-none transition-opacity duration-300" />
        )}

        {/* ── HEADER SUPERIOR CLÍNICO ── */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-[#0a0c10] text-center sm:text-left shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onExit(null)}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all cursor-pointer"
              title="Volver"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-base sm:text-xl font-black italic uppercase tracking-widest flex items-center gap-2">
              <span className="text-[#a855f7]">MEMORY MIRROR</span>
              <span className="text-[9px] sm:text-xs text-white/30 border border-white/10 px-2 py-0.5 rounded-full font-black font-mono">CORSI SPAN</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold tracking-widest uppercase">
            <div className="text-white/40 font-mono">
              Nivel: <span className="text-[#a855f7] text-lg sm:text-xl font-black drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">{level}</span>
            </div>
            
            <div className={`px-3 sm:px-4 py-1 rounded-full border-2 text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all ${
              trial === 'A' 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
            }`}>
              {trial === 'A' ? 'Intento 1 de 2' : 'ÚLTIMO INTENTO'}
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all cursor-pointer"
              title={soundEnabled ? 'Silenciar Audio' : 'Activar Audio'}
            >
              {soundEnabled ? <Volume2 size={16} className="text-purple-400" /> : <VolumeX size={16} className="text-white/30" />}
            </button>
          </div>
        </header>

        {/* ── CUERPO PRINCIPAL DEL JUEGO ── */}
        <div className="flex flex-1 overflow-hidden relative min-h-0">
          
          {/* PANEL CENTRAL: GEMELO DIGITAL, TEXTO Y ESTADO */}
          <div className="flex-1 flex flex-col items-center justify-between relative p-4 sm:p-6 min-h-0">
            
            {/* Mensaje de Estado Superior */}
            <div className="text-center w-full z-10 pt-2 shrink-0">
              {gameState === 'idle' && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-white/40 font-bold tracking-[0.25em] uppercase text-[11px] sm:text-xs font-mono">
                    MEMORIA VISOESPACIAL DE TRABAJO (TEST DE CORSI)
                  </p>
                  <p className="text-slate-300 text-xs mt-1">
                    {isKeyboardMode ? 'Presiona ENTER o haz clic abajo para iniciar la prueba.' : 'Conecta el cubo y presiona el botón para comenzar.'}
                  </p>
                </div>
              )}

              {gameState === 'showing_sequence' && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[#00FFFF] font-black tracking-[0.3em] uppercase text-sm sm:text-xl animate-pulse drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                    OBSERVA LA SECUENCIA
                  </p>
                  <div className="flex gap-2">
                    {sequence.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                          i <= showingIndex 
                            ? 'bg-[#00FFFF] shadow-[0_0_12px_rgba(0,255,255,0.9)] scale-110' 
                            : 'border-2 border-[#00FFFF]/30 bg-transparent'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {gameState === 'waiting_for_user' && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[#39FF14] font-black tracking-[0.3em] uppercase text-sm sm:text-xl drop-shadow-[0_0_10px_rgba(57,255,20,0.5)] animate-bounce">
                    ¡TU TURNO! (REPLICA LA SECUENCIA)
                  </p>
                  <div className="flex gap-2">
                    {sequence.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                          i < userIndex 
                            ? 'bg-[#39FF14] shadow-[0_0_12px_rgba(57,255,20,0.9)]' 
                            : i === userIndex 
                              ? 'bg-[#39FF14]/50 animate-pulse border-2 border-[#39FF14]' 
                              : 'border-2 border-[#39FF14]/30 bg-transparent'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {gameState === 'error_delay' && (
                <div className="flex flex-col items-center justify-center animate-pulse">
                  <p className="text-[#FF5F1F] font-black tracking-[0.3em] uppercase text-lg sm:text-2xl drop-shadow-[0_0_20px_rgba(255,95,31,0.8)]">
                    ¡ERROR DE SECUENCIA!
                  </p>
                  <p className="text-white/60 font-bold tracking-widest mt-1 text-xs sm:text-sm">
                    {trial === 'A' ? 'PREPARANDO SEGUNDO INTENTO...' : 'EVALUACIÓN FINALIZADA'}
                  </p>
                </div>
              )}

              {gameState === 'level_up_delay' && (
                <div className="flex flex-col items-center justify-center animate-pulse">
                  <p className="text-[#39FF14] font-black tracking-[0.3em] uppercase text-xl sm:text-3xl drop-shadow-[0_0_30px_rgba(57,255,20,0.8)]">
                    ¡NIVEL COMPLETADO!
                  </p>
                  <p className="text-white/80 font-bold tracking-widest mt-1 text-xs sm:text-sm">
                    PREPARANDO NIVEL {level + 1}...
                  </p>
                </div>
              )}

              {gameState === 'finished' && (
                <p className="text-[#FF5F1F] font-black tracking-[0.3em] uppercase text-sm sm:text-xl drop-shadow-[0_0_10px_rgba(255,95,31,0.5)]">
                  EVALUACIÓN COMPLETADA
                </p>
              )}
            </div>

            {/* FLOATING GLASS HUD PANEL PARA LA CARA ACTIVA */}
            {activeMeta && (
              <div className="absolute top-20 left-4 sm:left-8 bg-[#13161e]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl z-20 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl ${activeMeta.color} shadow-lg flex items-center justify-center font-black text-xl text-black border shrink-0`}>
                  {activeFace}
                </div>
                <div className="text-left">
                  <p className={`font-black uppercase tracking-wider text-xs ${activeMeta.text}`}>
                    {activeMeta.colorName}
                  </p>
                  <p className="text-[10px] text-white/40 font-mono font-bold">
                    Cara {activeMeta.name}
                  </p>
                </div>
              </div>
            )}

            {/* ÁREA CENTRAL DEL CUBO 3D */}
            <div style={{ width: `${cubeSize}px`, height: `${cubeSize}px` }} className="relative transition-all duration-300 flex items-center justify-center my-auto">
              
              {/* Texto Gigante de Color durante la secuencia demostrada */}
              {activeFace && gameState === 'showing_sequence' && (
                <div className="absolute -top-10 left-0 right-0 flex items-center justify-center pointer-events-none z-50">
                  <span className="text-[2rem] sm:text-[3.2rem] font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,1)] tracking-[0.3em] uppercase">
                    {FACE_METADATA[activeFace]?.colorName || activeFace}
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

            {/* ── BOTONERA TÁCTIL Y DE RESPUESTA EN PANTALLA (MEJORA ACCESIBLE) ── */}
            {gameState === 'waiting_for_user' && (
              <div className="w-full max-w-xl z-20 flex flex-col items-center gap-2 pb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Gira en el cubo físico o haz clic en la cara:
                </p>
                <div className="grid grid-cols-5 gap-2 w-full px-2">
                  {Object.entries(FACE_METADATA).map(([faceKey, meta]) => (
                    <button
                      key={faceKey}
                      onClick={() => {
                        handleCubeInput(faceKey);
                        if (soundEnabled && FACE_FREQUENCIES[faceKey]) {
                          playTone(FACE_FREQUENCIES[faceKey], 'triangle', 0.35);
                        }
                      }}
                      className="flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border border-white/10 hover:border-white/40 bg-white/5 hover:bg-white/15 transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer group"
                    >
                      <span 
                        className="w-5 h-5 rounded-lg mb-1 shadow-md border border-white/30" 
                        style={{ backgroundColor: meta.hex }} 
                      />
                      <span className="text-[11px] font-black text-white tracking-wider">
                        {meta.colorName}
                      </span>
                      <span className="text-[9px] font-mono text-white/40 group-hover:text-white/80">
                        {meta.key}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* BOTONES INFERIORES DE CONTROL */}
            <div className="text-center w-full z-10 pb-4 shrink-0">
              {gameState === 'idle' && (
                <button 
                  onClick={startGame}
                  disabled={!isConnected && !isKeyboardMode}
                  className={`px-8 py-4 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-[0.25em] transition-all shadow-xl
                    ${(isConnected || isKeyboardMode)
                      ? 'bg-gradient-to-r from-[#a855f7] to-[#c084fc] hover:scale-105 shadow-[0_0_30px_rgba(168,85,247,0.4)] text-white cursor-pointer' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                    }`}
                >
                  {(isConnected || isKeyboardMode) ? 'INICIAR PRUEBA DE MEMORIA' : 'CONECTA EL CUBO PRIMERO'}
                </button>
              )}

              {gameState === 'finished' && (
                <button 
                  onClick={handleFinishTest}
                  className="px-8 py-4 bg-white text-black font-black uppercase text-sm tracking-[0.3em] rounded-2xl hover:bg-[#a855f7] hover:text-white hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] cursor-pointer"
                >
                  FINALIZAR Y VER INFORME
                </button>
              )}
            </div>

          </div>

          {/* PANEL DERECHO: TELEMETRÍA EN VIVO (DESKTOP) */}
          <div className="hidden lg:flex w-80 bg-[#13161e] border-l border-white/5 p-5 flex-col min-h-0">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-3 pb-3 border-b border-white/5 shrink-0 flex items-center gap-2">
              <Brain size={14} className="text-purple-400" /> Telemetría de Corsi
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 font-mono text-xs custom-scrollbar min-h-0">
              {telemetry.length === 0 ? (
                <div className="text-white/20 italic text-center py-10">
                  Esperando respuestas...
                </div>
              ) : (
                telemetry.map((t, i) => (
                  <div 
                    key={i} 
                    className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                      t.isCorrect 
                        ? 'bg-[#39FF14]/5 border-[#39FF14]/20' 
                        : 'bg-[#FF5F1F]/5 border-[#FF5F1F]/20'
                    }`}
                  >
                    <div className="flex justify-between items-center text-white/60">
                      <span className="font-black">Nivel {t.level} ({t.trial})</span>
                      <span className="font-bold">{t.latencyMs} ms</span>
                    </div>
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-white/70">Esperado: {t.expectedFace}</span>
                      <span className={t.isCorrect ? 'text-[#39FF14]' : 'text-[#FF5F1F]'}>
                        Girado: {t.userFace}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-white/40 font-mono">
              Amplitud Máxima: <span className="text-white font-bold">{level > 2 ? level - 1 : 0} ítems</span>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
