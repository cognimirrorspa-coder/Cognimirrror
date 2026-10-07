'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Timer,
  ArrowRight,
  Save,
  Target,
  Settings
} from 'lucide-react';
import ModalOrdenarCubo from './ModalOrdenarCubo';

/**
 * Hook de conteo progresivo animado (Interpolación suave 800ms)
 */
function useAnimatedNumber(target, duration = 800) {
  const [currentVal, setCurrentVal] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animId;
    const initial = 0;
    const diff = Number(target || 0) - initial;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Curva easeOutExpo para sensación de telemetría de precisión
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrentVal(Math.round(initial + diff * eased));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    }

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return currentVal;
}

/**
 * Botón reactivo con efecto Ripple interactivo y escala suave
 */
function ReactiveButton({ children, onClick, className = '', ...props }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] hover:brightness-125 cursor-pointer ${className}`}
      {...props}
    >
      {/* Efecto Ripple al hacer clic */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
          style={{
            left: r.x - 25,
            top: r.y - 25,
            width: 50,
            height: 50
          }}
        />
      ))}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

/**
 * QuickInsightsModal (Snapshot Clínico Post-Evaluación - Cyber-Clínico V2)
 */
export default function QuickInsightsModal({
  isOpen = true,
  onClose,
  onOpenFullReport,
  onNextStudent = null,
  nextStudent = null,
  metrics = {}
}) {
  if (!isOpen) return null;

  const {
    averageReactionTime = 414,
    sdReactionTime = 155,
    inhibitoryControl = 75,
    nogoFails = 2,
    nogoTotal = 8,
    dominanceHand = 'Mano Derecha (Naranja)',
    asymmetryDelta = 45,
    levelTitle = 'Nivel 2: Go/No-Go Simple (1 Cara)',
    patientName = 'Mateo Silva Gómez'
  } = metrics;

  const [isSolverOpen, setIsSolverOpen] = useState(false);

  // 1. Contadores numéricos progresivos (800ms)
  const animatedLatency = useAnimatedNumber(averageReactionTime, 800);
  const animatedInhibition = useAnimatedNumber(inhibitoryControl, 850);

  // 2. Dial digital segmentado (10 barras HUD)
  const totalLedBars = 10;
  // Calculamos cuántas barras deben encenderse en función de la latencia
  const targetLedBars = Math.min(
    totalLedBars,
    Math.max(2, Math.round(((700 - Math.min(650, averageReactionTime)) / 450) * totalLedBars) || 8)
  );

  // 3. Tacómetro radial para Inhibición
  const radius = 38;
  const arcLength = Math.PI * radius; // ~119.38
  const clampedInhibition = Math.min(100, Math.max(0, animatedInhibition));
  const dashOffset = arcLength * (1 - clampedInhibition / 100);

  // Coordenadas dinámicas del nodo brillante sobre el arco
  const angleRad = Math.PI - (clampedInhibition / 100) * Math.PI;
  const dotX = 50 + radius * Math.cos(angleRad);
  const dotY = 46 - radius * Math.sin(angleRad);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        
        {/* Contenedor Exterior con Crosshairs HUD (+) */}
        <div className="relative w-full max-w-xl">
          
          {/* Marcadores de telemetría exterior en esquinas */}
          <span className="absolute -top-3.5 -left-3.5 text-cyan-400/50 font-mono text-sm select-none pointer-events-none">+</span>
          <span className="absolute -top-3.5 -right-3.5 text-purple-400/50 font-mono text-sm select-none pointer-events-none">+</span>
          <span className="absolute -bottom-3.5 -left-3.5 text-cyan-400/50 font-mono text-sm select-none pointer-events-none">+</span>
          <span className="absolute -bottom-3.5 -right-3.5 text-purple-400/50 font-mono text-sm select-none pointer-events-none">+</span>

          {/* Card Principal (Entrada con Fade & Scale suave 300ms) */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full rounded-3xl p-[1.5px] bg-gradient-to-br from-cyan-500/50 via-purple-500/30 to-pink-500/50 shadow-[0_0_50px_rgba(6,182,212,0.18),0_0_80px_rgba(168,85,247,0.14)] relative"
          >
            {/* Contenedor Glassmorphism (Fondo semi-transparente oscuro con blur e iluminación interna) */}
            <div
              className="w-full rounded-[calc(1.5rem-1.5px)] p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl"
              style={{
                background: 'rgba(10, 15, 30, 0.72)',
                border: '1px solid rgba(0, 242, 254, 0.16)'
              }}
            >
              
              {/* Esquinas técnicas decorativas interiores */}
              <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-cyan-400/50 pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-purple-400/50 pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-cyan-400/50 pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-purple-400/50 pointer-events-none" />

              {/* ── HEADER SUPERIOR ── */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase text-cyan-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>SNAPSHOT CLÍNICO POST-EVALUACIÓN</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
                    {patientName}
                  </h2>

                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {levelTitle}
                  </p>
                </div>

                {/* Badge Completado con Resplandor Neón */}
                <div className="px-3 py-1 rounded-md bg-[#0a1f18] border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase shadow-[0_0_12px_rgba(16,185,129,0.3)] shrink-0">
                  COMPLETADO
                </div>
              </div>

              {/* ── 3 MÉTRICAS PRINCIPALES ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                
                {/* 1. Métrica: LATENCIA (Dial Segmentado HUD) */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-all backdrop-blur-md"
                  style={{
                    background: 'rgba(13, 20, 38, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.15)'
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                        LATENCIA
                      </span>
                      <Timer className="w-4 h-4 text-cyan-400/70" />
                    </div>

                    {/* Barras LED segmentadas con encendido secuencial (Micro-Glow) */}
                    <div className="flex items-center gap-1.5 mb-3 py-1">
                      {Array.from({ length: totalLedBars }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0.2, scaleY: 0.6 }}
                          animate={{
                            opacity: i < targetLedBars ? 1 : 0.2,
                            scaleY: 1
                          }}
                          transition={{
                            delay: i * 0.05,
                            duration: 0.25,
                            ease: 'easeOut'
                          }}
                          className={`h-4.5 flex-1 rounded-[2px] transition-all duration-300 ${
                            i < targetLedBars
                              ? 'bg-gradient-to-t from-cyan-500 via-cyan-400 to-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.85)]'
                              : 'bg-slate-800/60 border border-slate-700/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                      {animatedLatency}
                      <span className="text-xs font-normal text-slate-400 ml-1 font-mono">ms</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      {sdReactionTime ? `SD: ±${sdReactionTime}ms` : 'Velocidad Media'}
                    </p>
                  </div>
                </div>

                {/* 2. Métrica: INHIBICIÓN (Hero Card con Tacómetro Radial & Resplandor Neón) */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden backdrop-blur-md"
                  style={{
                    background: 'rgba(15, 20, 40, 0.75)',
                    border: '1px solid rgba(236, 72, 153, 0.45)',
                    boxShadow: '0 0 20px rgba(255, 0, 128, 0.28), inset 0 0 15px rgba(168, 85, 247, 0.15)'
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
                        INHIBICIÓN
                      </span>
                      <Target className="w-4 h-4 text-purple-400" />
                    </div>

                    {/* Tacómetro Radial de Arco de Neón con degradado activo */}
                    <div className="relative w-full flex items-center justify-center my-0.5">
                      <svg viewBox="0 0 100 52" className="w-24 h-12 overflow-visible">
                        <defs>
                          <linearGradient id="inhibit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00f2fe" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                          <filter id="glow-indicator" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ec4899" />
                            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ec4899" floodOpacity="0.8" />
                          </filter>
                        </defs>
                        {/* Pista de fondo */}
                        <path
                          d="M 12 46 A 38 38 0 0 1 88 46"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        {/* Arco de progreso degradado azul a magenta */}
                        <path
                          d="M 12 46 A 38 38 0 0 1 88 46"
                          fill="none"
                          stroke="url(#inhibit-grad)"
                          strokeWidth="5.5"
                          strokeLinecap="round"
                          strokeDasharray={arcLength}
                          strokeDashoffset={dashOffset}
                        />
                        {/* Nodo brillante en la punta del arco */}
                        <circle
                          cx={dotX}
                          cy={dotY}
                          r="3.5"
                          fill="#ec4899"
                          filter="url(#glow-indicator)"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center mt-1">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_12px_rgba(236,72,153,0.5)]">
                      {clampedInhibition}%
                    </div>
                    <p className="text-[11px] font-mono text-purple-300/80 mt-1 truncate">
                      {nogoTotal > 0 ? `${nogoTotal - nogoFails}/${nogoTotal} No-Go Exitosos` : 'Sin Impulsividad'}
                    </p>
                  </div>
                </div>

                {/* 3. Métrica: DOMINANCIA (Malla de Puntos Wireframe / Dot-Mesh Neurocientífico) */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/40 transition-all backdrop-blur-md"
                  style={{
                    background: 'rgba(13, 20, 38, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.15)'
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                        DOMINANCIA
                      </span>
                      <Activity className="w-4 h-4 text-purple-400" />
                    </div>

                    {/* Malla de Puntos de Mano / Dot-Mesh Neurocientífica */}
                    <div className="flex items-center justify-center py-1 relative">
                      <svg viewBox="0 0 68 50" className="w-18 h-12 text-cyan-400" fill="none">
                        {/* Anillos de pulsos sensoriales concéntricos */}
                        <ellipse cx="34" cy="25" rx="30" ry="20" stroke="rgba(168,85,247,0.2)" strokeWidth="0.8" strokeDasharray="3 3" />
                        <ellipse cx="34" cy="25" rx="22" ry="14" stroke="rgba(0,242,254,0.25)" strokeWidth="0.8" />
                        
                        {/* Silueta de mano en malla de puntos interconectados */}
                        <g opacity="0.9">
                          {/* Pulgar */}
                          <circle cx="18" cy="29" r="1.5" fill="#00f2fe" />
                          <circle cx="21" cy="25" r="1.4" fill="#38bdf8" />
                          <circle cx="25" cy="27" r="1.3" fill="#818cf8" />
                          {/* Índice */}
                          <circle cx="26.5" cy="12" r="1.5" fill="#00f2fe" />
                          <circle cx="27" cy="18" r="1.4" fill="#38bdf8" />
                          <circle cx="28" cy="24" r="1.3" fill="#818cf8" />
                          {/* Medio */}
                          <circle cx="33" cy="8" r="1.6" fill="#a855f7" />
                          <circle cx="33.5" cy="15" r="1.4" fill="#c084fc" />
                          <circle cx="34" cy="22" r="1.3" fill="#818cf8" />
                          {/* Anular */}
                          <circle cx="39.5" cy="10.5" r="1.5" fill="#ec4899" />
                          <circle cx="40" cy="17" r="1.4" fill="#f472b6" />
                          <circle cx="40.5" cy="24" r="1.3" fill="#818cf8" />
                          {/* Meñique */}
                          <circle cx="46" cy="17" r="1.4" fill="#00f2fe" />
                          <circle cx="46" cy="22" r="1.3" fill="#38bdf8" />
                          <circle cx="45" cy="27" r="1.3" fill="#818cf8" />
                          {/* Palma y Muñeca */}
                          <circle cx="29" cy="32" r="1.4" fill="#818cf8" />
                          <circle cx="35" cy="31" r="1.4" fill="#c084fc" />
                          <circle cx="41" cy="33" r="1.4" fill="#818cf8" />
                          <circle cx="32" cy="38" r="1.5" fill="#38bdf8" />
                          <circle cx="38" cy="39" r="1.5" fill="#a855f7" />

                          {/* Líneas tenues de interconexión wireframe */}
                          <path
                            d="M 18 29 L 21 25 L 25 27 L 29 32 L 32 38 M 26.5 12 L 27 18 L 28 24 L 29 32 M 33 8 L 33.5 15 L 34 22 L 35 31 M 39.5 10.5 L 40 17 L 40.5 24 L 41 33 M 46 17 L 46 22 L 45 27 L 41 33 M 32 38 L 38 39"
                            stroke="rgba(0, 242, 254, 0.45)"
                            strokeWidth="0.8"
                            strokeDasharray="2 2"
                          />
                        </g>
                      </svg>
                    </div>
                  </div>

                  <div>
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight truncate drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]" title={dominanceHand}>
                      {dominanceHand.split(' ')[0] || 'Mano'}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      {asymmetryDelta ? `Delta: +${asymmetryDelta}ms` : 'Alternancia Motora'}
                    </p>
                  </div>
                </div>

              </div>

              {/* ── CUADRO DIAGNÓSTICO PRELIMINAR (DATA GRID TÉCNICA) ── */}
              <div
                className="relative rounded-xl p-4 mb-4 overflow-hidden backdrop-blur-md"
                style={{
                  background: 'rgba(10, 16, 32, 0.78)',
                  border: '1px solid rgba(0, 242, 254, 0.16)',
                  backgroundImage:
                    'linear-gradient(to right, rgba(0, 242, 254, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 242, 254, 0.05) 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              >
                {/* Micro-detalles y esquineros cyber tipo "+" */}
                <span className="absolute top-1.5 left-2 text-[9px] font-mono text-cyan-400/60 select-none">+</span>
                <span className="absolute top-1.5 right-2 text-[9px] font-mono text-purple-400/60 select-none">+</span>
                <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-cyan-400/60 select-none">+</span>
                <span className="absolute bottom-1.5 right-2 text-[9px] font-mono text-purple-400/60 select-none">+</span>

                {/* Ticks laterales de ingeniería */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0.5 w-1 h-3 border-l border-cyan-400/40" />
                <div className="absolute top-1/2 -translate-y-1/2 right-0.5 w-1 h-3 border-r border-purple-400/40" />

                <h4 className="text-xs font-bold text-white mb-1 tracking-wide">
                  Diagnóstico Preliminar de la Sesión:
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  El estudiante completó la evaluación con una latencia de{' '}
                  <span className="font-bold font-mono text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]">
                    {averageReactionTime} ms
                  </span>{' '}
                  y un control inhibitorio del{' '}
                  <span className="font-bold font-mono text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]">
                    {inhibitoryControl}%
                  </span>.
                </p>
              </div>

              {/* ── BANNER REARMAR CUBO (CUBO 3D WIREFRAME CON ESCÁNER LÁSER) ── */}
              <div
                className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 relative overflow-hidden backdrop-blur-md"
                style={{
                  background: 'rgba(12, 19, 36, 0.75)',
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.12)'
                }}
              >
                
                {/* Cubo Holográfico Isométrico con Animación de Escaneo Láser */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-18 h-18 shrink-0 relative flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                      <defs>
                        <filter id="cube-glow-tech" x="-30%" y="-30%" width="160%" height="160%">
                          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#00f2fe" floodOpacity="0.7" />
                        </filter>
                        <linearGradient id="cube-top-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgba(0,242,254,0.35)" />
                          <stop offset="100%" stopColor="rgba(168,85,247,0.2)" />
                        </linearGradient>
                        <linearGradient id="cube-left-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(0,242,254,0.28)" />
                          <stop offset="100%" stopColor="rgba(15,23,42,0.4)" />
                        </linearGradient>
                        <linearGradient id="cube-right-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(236,72,153,0.3)" />
                          <stop offset="100%" stopColor="rgba(147,51,234,0.2)" />
                        </linearGradient>
                        <linearGradient id="laser-beam" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0" />
                          <stop offset="50%" stopColor="#00f2fe" stopOpacity="1" />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Partículas de datos flotantes */}
                      <circle cx="14" cy="28" r="1.5" fill="#00f2fe" opacity="0.8" />
                      <circle cx="18" cy="74" r="1.2" fill="#ec4899" opacity="0.7" />
                      <circle cx="86" cy="26" r="1.6" fill="#a855f7" opacity="0.8" />
                      <circle cx="82" cy="70" r="1.3" fill="#00f2fe" opacity="0.7" />

                      {/* Cara Superior Isométrica (3x3 grid) */}
                      <path d="M 50 14 L 80 30 L 50 46 L 20 30 Z" fill="url(#cube-top-grad)" stroke="#00f2fe" strokeWidth="1.3" filter="url(#cube-glow-tech)" />
                      <line x1="30" y1="24.7" x2="60" y2="40.7" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
                      <line x1="40" y1="19.3" x2="70" y2="35.3" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
                      <line x1="40" y1="35.3" x2="70" y2="19.3" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
                      <line x1="30" y1="40.7" x2="60" y2="24.7" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />

                      {/* Cara Izquierda Isométrica */}
                      <path d="M 20 30 L 50 46 L 50 82 L 20 66 Z" fill="url(#cube-left-grad)" stroke="#00f2fe" strokeWidth="1.3" />
                      <line x1="30" y1="35.3" x2="30" y2="71.3" stroke="#00f2fe" strokeWidth="0.8" opacity="0.65" />
                      <line x1="40" y1="40.7" x2="40" y2="76.7" stroke="#00f2fe" strokeWidth="0.8" opacity="0.65" />
                      <line x1="20" y1="42" x2="50" y2="58" stroke="#00f2fe" strokeWidth="0.8" opacity="0.65" />
                      <line x1="20" y1="54" x2="50" y2="70" stroke="#00f2fe" strokeWidth="0.8" opacity="0.65" />

                      {/* Cara Derecha Isométrica */}
                      <path d="M 50 46 L 80 30 L 80 66 L 50 82 Z" fill="url(#cube-right-grad)" stroke="#ec4899" strokeWidth="1.3" />
                      <line x1="60" y1="40.7" x2="60" y2="76.7" stroke="#a855f7" strokeWidth="0.8" opacity="0.65" />
                      <line x1="70" y1="35.3" x2="70" y2="71.3" stroke="#a855f7" strokeWidth="0.8" opacity="0.65" />
                      <line x1="50" y1="58" x2="80" y2="42" stroke="#a855f7" strokeWidth="0.8" opacity="0.65" />
                      <line x1="50" y1="70" x2="80" y2="54" stroke="#a855f7" strokeWidth="0.8" opacity="0.65" />

                      {/* Vértices brillantes */}
                      <circle cx="50" cy="14" r="2.2" fill="#ffffff" />
                      <circle cx="20" cy="30" r="1.8" fill="#00f2fe" />
                      <circle cx="80" cy="30" r="1.8" fill="#ec4899" />
                      <circle cx="50" cy="46" r="2.2" fill="#00f2fe" />
                      <circle cx="50" cy="82" r="2.2" fill="#ec4899" />

                      {/* Haz de luz de escaneo horizontal animado (Láser Scan) */}
                      <g>
                        <line x1="10" y1="0" x2="90" y2="0" stroke="url(#laser-beam)" strokeWidth="2.5" filter="url(#cube-glow-tech)">
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,15; 0,80; 0,15"
                            dur="2.8s"
                            repeatCount="indefinite"
                          />
                        </line>
                      </g>
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-white tracking-tight">
                      ¿El cubo quedó desarmado?
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sigue el patrón de movimientos para dejarlo listo.
                    </p>
                  </div>
                </div>

                {/* Botón Rearmar Cubo con Glow & Ripple */}
                <ReactiveButton
                  onClick={() => setIsSolverOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600/35 to-indigo-600/35 border border-cyan-400/50 text-cyan-200 hover:text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rearmar Cubo</span>
                </ReactiveButton>
              </div>

              {/* ── MODAL ORDENAR CUBO ── */}
              <ModalOrdenarCubo
                isOpen={isSolverOpen}
                onClose={() => setIsSolverOpen(false)}
                isDark={true}
              />

              {/* ── BOTONES DE ACCIÓN FOOTER ── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {/* Siguiente Alumno (si aplica en flujo clínico) */}
                {nextStudent && onNextStudent ? (
                  <ReactiveButton
                    onClick={() => onNextStudent(nextStudent)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/25"
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[9px] uppercase tracking-wider text-blue-200">Siguiente en sala</span>
                      <span className="text-xs font-bold truncate max-w-[180px]">
                        {nextStudent.name}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </ReactiveButton>
                ) : <div />}

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Botón Guardar y Salir */}
                  <ReactiveButton
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-semibold tracking-wide"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar y Salir</span>
                  </ReactiveButton>

                  {/* Botón Ver Reporte (Gradiente Índigo-Púrpura con Resplandor) */}
                  <ReactiveButton
                    onClick={onOpenFullReport}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-bold shadow-[0_0_22px_rgba(99,102,241,0.45)] hover:shadow-[0_0_28px_rgba(168,85,247,0.6)]"
                  >
                    <span>Ver Reporte</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </ReactiveButton>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
