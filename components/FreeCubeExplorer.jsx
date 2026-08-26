'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { useCubeState } from '../contexts/CubeStateContext';
import Cube3DViewer from './Cube3DViewer';
import { Compass, RotateCcw, Sparkles, Volume2, VolumeX, ArrowRight, ShieldCheck, Zap, Hand } from 'lucide-react';

const FACE_INFO = {
  L: { name: 'ROJO', face: 'Izquierda (L)', hand: 'Mano Izquierda', bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/40', glow: 'shadow-red-500/30' },
  R: { name: 'NARANJO', face: 'Derecha (R)', hand: 'Mano Derecha', bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/40', glow: 'shadow-orange-500/30' },
  U: { name: 'BLANCO', face: 'Arriba (U)', hand: 'Cara Superior', bg: 'bg-white', text: 'text-slate-100', border: 'border-white/40', glow: 'shadow-white/20' },
  D: { name: 'AMARILLO', face: 'Abajo (D)', hand: 'Cara Inferior', bg: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400/40', glow: 'shadow-yellow-400/30' },
  F: { name: 'AZUL', face: 'Frente (F)', hand: 'Cara Frontal', bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-500/40', glow: 'shadow-blue-500/30' },
  B: { name: 'VERDE', face: 'Atrás (B)', hand: 'Cara Trasera', bg: 'bg-emerald-600', text: 'text-emerald-400', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/30' },
};

const SOUND_FREQS = {
  L: 880,
  R: 659,
  U: 440,
  D: 554,
  F: 330,
  B: 523
};

let audioCtx = null;
const playTone = (freq) => {
  if (typeof window === 'undefined') return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
};

export default function FreeCubeExplorer({ onBack, onSelectLevel }) {
  const { isConnected, subscribeToMoves, openScanner } = useBluetoothCube();
  const { resetCubeState } = useCubeState();
  const [lastMove, setLastMove] = useState(null);
  const [moveCount, setMoveCount] = useState(0);
  const [recentMoves, setRecentMoves] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [highlightFace, setHighlightFace] = useState(null);

  useEffect(() => {
    const unsub = subscribeToMoves((movimiento) => {
      const cleanFace = movimiento.replace("'", "").charAt(0);
      const isPrime = movimiento.includes("'");
      const info = FACE_INFO[cleanFace] || { name: cleanFace, face: cleanFace, hand: 'Giro', bg: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-500' };

      setMoveCount(c => c + 1);
      setLastMove({ notation: movimiento, cleanFace, isPrime, info, timestamp: Date.now() });
      setRecentMoves(prev => [{ notation: movimiento, cleanFace, isPrime, info, timestamp: Date.now() }, ...prev.slice(0, 7)]);
      setHighlightFace(cleanFace);

      if (audioEnabled && SOUND_FREQS[cleanFace]) {
        playTone(SOUND_FREQS[cleanFace]);
      }

      setTimeout(() => setHighlightFace(null), 400);
    });

    return () => unsub();
  }, [subscribeToMoves, audioEnabled]);

  // Soporte de teclado para modo libre
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toUpperCase();
      let move = null;
      if (k === 'L' || e.key === 'ArrowLeft') move = 'L';
      else if (k === 'R' || e.key === 'ArrowRight') move = 'R';
      else if (k === 'U' || e.key === 'ArrowUp') move = 'U';
      else if (k === 'D' || e.key === 'ArrowDown') move = 'D';
      else if (k === 'F' || e.key === ' ') move = 'F';
      else if (k === 'B') move = 'B';

      if (move) {
        const info = FACE_INFO[move];
        setMoveCount(c => c + 1);
        setLastMove({ notation: move, cleanFace: move, isPrime: false, info, timestamp: Date.now() });
        setRecentMoves(prev => [{ notation: move, cleanFace: move, isPrime: false, info, timestamp: Date.now() }, ...prev.slice(0, 7)]);
        setHighlightFace(move);
        if (audioEnabled && SOUND_FREQS[move]) playTone(SOUND_FREQS[move]);
        setTimeout(() => setHighlightFace(null), 400);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [audioEnabled]);

  return (
    <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-start p-4 sm:p-8 relative overflow-hidden">
      {/* Luces de fondo dinámicas */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Barra Superior */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-all cursor-pointer"
        >
          ← Volver
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-all cursor-pointer"
            title={audioEnabled ? 'Desactivar Sonido' : 'Activar Sonido'}
          >
            {audioEnabled ? <Volume2 size={18} className="text-purple-400" /> : <VolumeX size={18} className="text-white/40" />}
          </button>

          <button
            onClick={() => {
              resetCubeState();
              setMoveCount(0);
              setRecentMoves([]);
              setLastMove(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            Reiniciar Gemelo
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-auto">
        
        {/* Columna Izquierda: Cubo 3D y Feedback */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Nivel 1: Exploración Libre
            </span>
          </div>

          <div className="absolute top-4 right-4 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold text-white/60">
            Giros: <span className="text-white font-black">{moveCount}</span>
          </div>

          {/* Visor 3D */}
          <div className="my-6 relative">
            <Cube3DViewer size={320} highlightFace={highlightFace} />
          </div>

          {/* Feedback del último giro */}
          <div className="w-full min-h-[90px] flex items-center justify-center">
            {lastMove ? (
              <motion.div
                key={lastMove.timestamp}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl border ${lastMove.info.border} bg-black/50 shadow-xl backdrop-blur-md`}
              >
                <div className={`w-8 h-8 rounded-xl ${lastMove.info.bg} shadow-lg flex items-center justify-center font-black text-xs text-black`} />
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-lg ${lastMove.info.text}`}>
                      CARA {lastMove.info.name} ({lastMove.notation})
                    </span>
                  </div>
                  <span className="text-xs text-white/60 font-medium">
                    {lastMove.info.hand} {lastMove.isPrime ? '· Giro Antihorario' : '· Giro Horario'}
                  </span>
                </div>
              </motion.div>
            ) : (
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 animate-pulse">
                Gira cualquier cara del cubo físico o presiona las teclas (A / L / R / U / D / F)
              </p>
            )}
          </div>
        </div>

        {/* Columna Derecha: Guía de Caras y Acceso a los siguientes niveles */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Mapa de Caras y Manos */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-purple-300 mb-4 flex items-center gap-2">
              <Compass size={16} /> Mapa de Reconocimiento de Caras
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(FACE_INFO).map(([face, info]) => (
                <div
                  key={face}
                  className={`p-3 rounded-xl border ${highlightFace === face ? `${info.border} bg-white/10 scale-105` : 'border-white/5 bg-black/20'} transition-all flex items-center gap-3 text-left`}
                >
                  <div className={`w-6 h-6 rounded-lg ${info.bg} shrink-0 shadow-md`} />
                  <div>
                    <p className="text-xs font-bold text-white">{info.name} ({face})</p>
                    <p className="text-[10px] text-white/50">{info.hand}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos Niveles de Entrenamiento */}
          {onSelectLevel && (
            <div className="bg-purple-950/20 border border-purple-500/20 rounded-3xl p-6 flex flex-col gap-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-300 flex items-center gap-2">
                <Sparkles size={16} /> ¿Listo para entrenar? Elige un Nivel
              </h3>

              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={() => onSelectLevel('single_face')}
                  className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between text-left group transition-all cursor-pointer hover:border-purple-400/40"
                >
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-purple-600/40 text-[9px] text-purple-300 font-mono">Nivel 2</span>
                      Go / No-Go Simple (1 Cara)
                    </p>
                    <p className="text-[10px] text-white/50 mt-0.5">Aprende inhibición con una sola mano</p>
                  </div>
                  <ArrowRight size={16} className="text-white/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => onSelectLevel('bilateral_pure')}
                  className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between text-left group transition-all cursor-pointer hover:border-indigo-400/40"
                >
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-600/40 text-[9px] text-indigo-300 font-mono">Nivel 3</span>
                      Bilateralidad Pura (2 Caras)
                    </p>
                    <p className="text-[10px] text-white/50 mt-0.5">Izquierda vs Derecha sin distractores No-Go</p>
                  </div>
                  <ArrowRight size={16} className="text-white/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => onSelectLevel('official')}
                  className="p-3.5 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 border border-purple-500/30 rounded-2xl flex items-center justify-between text-left group transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-purple-500 text-black text-[9px] font-black font-mono">Nivel 4</span>
                      Test Clínico Reaction Mirror
                    </p>
                    <p className="text-[10px] text-purple-200/70 mt-0.5">Bilateralidad + Inhibición completa (40 rondas)</p>
                  </div>
                  <ArrowRight size={16} className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
