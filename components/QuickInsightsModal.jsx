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
import MetallicCube3D from './animations/MetallicCube3D';

/**
 * Ilustración anatómica profesional de mano con sensores biométricos
 */
function BiometricHandMesh({ className = '' }) {
  return (
    <svg viewBox="0 0 100 85" className={className} fill="none">
      <defs>
        <filter id="hand-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#00f2fe" floodOpacity="0.6" />
        </filter>
        <linearGradient id="hand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#818cf8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="hand-laser-beam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0" />
          <stop offset="50%" stopColor="#00f2fe" stopOpacity="1" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Silueta de mano anatómica profesional */}
      <path
        d="M 40 76 
           C 36 70, 31 63, 27 54
           C 25 50, 21 44, 18 42
           C 15 40, 14 36, 17 34
           C 20 32, 23 35, 27 38
           C 30 40, 32 44, 34 46
           L 34 26
           C 34 21, 35 17, 38.5 17
           C 42 17, 43 21, 43 26
           L 43 38 L 44 21
           C 44 16, 45 12, 49 12
           C 53 12, 54 16, 54 21
           L 54 38 L 55 24
           C 55 19, 56.5 16, 60 16
           C 63.5 16, 64.5 19, 64.5 24
           L 64.5 40 L 65.5 30
           C 65.5 26, 67 24, 70 24
           C 73 24, 74 27, 74 32
           C 74 44, 71 52, 69 57
           C 66 65, 62 71, 58 76
           Z"
        stroke="url(#hand-grad)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(0, 242, 254, 0.05)"
        filter="url(#hand-glow)"
      />

      {/* Haz de láser biométrico animado que escanea de abajo hacia arriba */}
      <line x1="16" y1="0" x2="74" y2="0" stroke="url(#hand-laser-beam)" strokeWidth="2.2" filter="url(#hand-glow)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,75; 0,16; 0,75"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </line>

      {/* Líneas de articulaciones falángicas */}
      <path d="M 36 29 L 41 29 M 36 23 L 41 23" stroke="rgba(0, 242, 254, 0.5)" strokeWidth="0.8" />
      <path d="M 46 25 L 52 25 M 46 19 L 52 19" stroke="rgba(0, 242, 254, 0.5)" strokeWidth="0.8" />
      <path d="M 57 28 L 62 28 M 57 22 L 62 22" stroke="rgba(0, 242, 254, 0.5)" strokeWidth="0.8" />
      <path d="M 67 33 L 72 33 M 67 38 L 72 38" stroke="rgba(0, 242, 254, 0.5)" strokeWidth="0.8" />
      <path d="M 21 39 L 26 42" stroke="rgba(0, 242, 254, 0.5)" strokeWidth="0.8" />

      {/* Pliegues palmares de flexión motriz */}
      <path d="M 33 49 C 42 49, 55 53, 67 47" stroke="rgba(129, 140, 248, 0.45)" strokeWidth="0.9" strokeDasharray="2 2" />
      <path d="M 31 56 C 40 59, 50 63, 61 62" stroke="rgba(129, 140, 248, 0.45)" strokeWidth="0.9" strokeDasharray="2 2" />

      {/* Nodos de sensores biométricos en yemas (con halo pulsante) */}
      <circle cx="17" cy="34" r="1.8" fill="#00f2fe">
        <animate attributeName="r" values="1.6;2.5;1.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="38.5" cy="17" r="1.8" fill="#00f2fe">
        <animate attributeName="r" values="1.6;2.5;1.6" dur="2s" begin="0.3s" repeatCount="indefinite" />
      </circle>
      <circle cx="49" cy="12" r="1.8" fill="#a855f7">
        <animate attributeName="r" values="1.6;2.5;1.6" dur="2s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="16" r="1.8" fill="#ec4899">
        <animate attributeName="r" values="1.6;2.5;1.6" dur="2s" begin="0.9s" repeatCount="indefinite" />
      </circle>
      <circle cx="70" cy="24" r="1.8" fill="#00f2fe">
        <animate attributeName="r" values="1.6;2.5;1.6" dur="2s" begin="1.2s" repeatCount="indefinite" />
      </circle>

      {/* Puntos de telemetría sensorial en la palma */}
      <circle cx="48" cy="46" r="1.4" fill="#38bdf8" opacity="0.9" />
      <circle cx="42" cy="52" r="1.2" fill="#818cf8" opacity="0.8" />
      <circle cx="54" cy="53" r="1.2" fill="#818cf8" opacity="0.8" />
      <circle cx="48" cy="60" r="1.2" fill="#c084fc" opacity="0.8" />
    </svg>
  );
}

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

  // 1. Contadores numéricos progresivos (Interpolación suave de 850ms)
  const animatedLatency = useAnimatedNumber(averageReactionTime, 850);
  const animatedInhibition = useAnimatedNumber(inhibitoryControl, 900);
  const animatedDelta = useAnimatedNumber(asymmetryDelta, 900);

  // 2. Medidor de Latencia (Velocidad de reacción en % entre 180ms y 650ms)
  // Menor latencia = mayor rendimiento (barra más llena)
  const latencyScore = Math.max(18, Math.min(100, Math.round(((650 - Math.min(650, averageReactionTime)) / 450) * 82 + 18)));
  const totalLedBars = 12;
  const targetLedBars = Math.min(
    totalLedBars,
    Math.max(2, Math.round((latencyScore / 100) * totalLedBars))
  );

  // 3. Tacómetro radial para Inhibición (Radio calibrado)
  const radius = 38;
  const arcLength = Math.PI * radius; // ~119.38
  const clampedInhibition = Math.min(100, Math.max(0, animatedInhibition));
  const dashOffset = arcLength * (1 - clampedInhibition / 100);

  // Coordenadas dinámicas del nodo brillante sobre el arco
  const angleRad = Math.PI - (clampedInhibition / 100) * Math.PI;
  const dotX = 50 + radius * Math.cos(angleRad);
  const dotY = 46 - radius * Math.sin(angleRad);

  // 4. Parámetros de Dominancia Motriz
  const isRightHand = !dominanceHand.toLowerCase().includes('izq');
  // Ancho de la barra de balance bilateral (15% a 48%)
  const dominanceBalancePercent = Math.min(48, Math.max(18, Math.round((asymmetryDelta / 120) * 45 + 15)));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        
        {/* Contenedor Exterior Ampliado con Crosshairs HUD (+) */}
        <div className="relative w-full max-w-3xl lg:max-w-4xl">
          
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

              {/* ── 3 MÉTRICAS PRINCIPALES CON ANIMACIONES DE LLENADO HUD ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                
                {/* 1. Métrica: LATENCIA (Barra de Energía HUD + LEDs Secuenciales) */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/50 transition-all backdrop-blur-md"
                  style={{
                    background: 'rgba(12, 19, 36, 0.78)',
                    border: '1px solid rgba(0, 242, 254, 0.22)',
                    boxShadow: '0 0 25px rgba(6, 182, 212, 0.14)'
                  }}
                >
                  {/* Micro-detalles cyber esquineros */}
                  <span className="absolute top-1.5 left-2 text-[8px] font-mono text-cyan-400/40 select-none">+</span>
                  <span className="absolute top-1.5 right-2 text-[8px] font-mono text-cyan-400/40 select-none">+</span>

                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                          LATENCIA
                        </span>
                      </div>
                      {/* Badge de velocidad dinámica */}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border tracking-wider ${
                        averageReactionTime < 400
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : averageReactionTime < 520
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      }`}>
                        {averageReactionTime < 400 ? '⚡ RÁPIDO' : averageReactionTime < 520 ? '🎯 ÓPTIMO' : '⏱️ MODERADO'}
                      </span>
                    </div>

                    {/* Barra de Energía HUD con Relleno Dinámico y Resplandor Neón */}
                    <div className="relative w-full h-3 bg-slate-950/90 rounded-full border border-cyan-500/35 overflow-hidden p-0.5 shadow-inner my-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${latencyScore}%` }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-300 shadow-[0_0_12px_rgba(6,182,212,0.9)] relative"
                      >
                        {/* Chispa / Cursor brillante en la punta del avance */}
                        <span className="absolute right-0 top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_8px_#ffffff] animate-pulse" />
                      </motion.div>
                    </div>

                    {/* Micro-Segmentos LED con encendido secuencial escalonado */}
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: totalLedBars }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0.15, scaleY: 0.6 }}
                          animate={{
                            opacity: i < targetLedBars ? 1 : 0.15,
                            scaleY: 1
                          }}
                          transition={{
                            delay: i * 0.045,
                            duration: 0.2,
                            ease: 'easeOut'
                          }}
                          className={`h-2 flex-1 rounded-[1.5px] transition-all duration-300 ${
                            i < targetLedBars
                              ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]'
                              : 'bg-slate-800/60 border border-slate-700/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-1">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                      {animatedLatency}
                      <span className="text-xs font-normal text-cyan-400 ml-1 font-mono">ms</span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      {sdReactionTime ? `SD: ±${sdReactionTime}ms · Precisión Alta` : 'Velocidad Media de Respuesta'}
                    </p>
                  </div>
                </div>

                {/* 2. Métrica: INHIBICIÓN (Hero Card Tacómetro Radial HUD & Neón) */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden backdrop-blur-md"
                  style={{
                    background: 'rgba(16, 20, 42, 0.82)',
                    border: '1px solid rgba(236, 72, 153, 0.55)',
                    boxShadow: '0 0 30px rgba(255, 0, 128, 0.32), inset 0 0 18px rgba(168, 85, 247, 0.18)'
                  }}
                >
                  {/* Micro-detalles cyber esquineros */}
                  <span className="absolute top-1.5 left-2 text-[8px] font-mono text-pink-400/50 select-none">+</span>
                  <span className="absolute top-1.5 right-2 text-[8px] font-mono text-pink-400/50 select-none">+</span>

                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-300">
                          INHIBICIÓN
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border tracking-wider ${
                        inhibitoryControl >= 80
                          ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                          : inhibitoryControl >= 60
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      }`}>
                        {inhibitoryControl >= 80 ? '🎯 ALTO' : inhibitoryControl >= 60 ? '✨ BUENO' : '⚠️ REFUERZO'}
                      </span>
                    </div>

                    {/* Tacómetro Radial HUD con Calibración y Arco Dinámico */}
                    <div className="relative w-full flex items-center justify-center my-0.5">
                      <svg viewBox="0 0 100 52" className="w-28 h-14 overflow-visible">
                        <defs>
                          <linearGradient id="inhibit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00f2fe" />
                            <stop offset="45%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                          <filter id="glow-indicator" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#ec4899" />
                            <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#ec4899" floodOpacity="0.85" />
                          </filter>
                        </defs>

                        {/* Pista de calibración con ticks de ingeniería */}
                        <path
                          d="M 12 46 A 38 38 0 0 1 88 46"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        {/* Marcas de referencia (0%, 25%, 50%, 75%, 100%) */}
                        <line x1="12" y1="46" x2="16" y2="46" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                        <line x1="50" y1="8" x2="50" y2="12" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                        <line x1="88" y1="46" x2="84" y2="46" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

                        {/* Arco de progreso degradado azul a magenta con Relleno Fluido */}
                        <path
                          d="M 12 46 A 38 38 0 0 1 88 46"
                          fill="none"
                          stroke="url(#inhibit-grad)"
                          strokeWidth="6.5"
                          strokeLinecap="round"
                          strokeDasharray={arcLength}
                          strokeDashoffset={dashOffset}
                          style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
                        />

                        {/* Nodo brillante en la punta del arco */}
                        <circle
                          cx={dotX}
                          cy={dotY}
                          r="4"
                          fill="#ec4899"
                          filter="url(#glow-indicator)"
                        />
                        <circle
                          cx={dotX}
                          cy={dotY}
                          r="1.8"
                          fill="#ffffff"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center mt-1">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_14px_rgba(236,72,153,0.6)]">
                      {clampedInhibition}%
                    </div>
                    {/* Visualizador de Ensayos No-Go con dots individuales */}
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      {Array.from({ length: Math.min(8, nogoTotal || 8) }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            idx < (nogoTotal - nogoFails)
                              ? 'bg-pink-400 shadow-[0_0_6px_#ec4899]'
                              : 'bg-slate-700/60 border border-slate-600/40'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-mono text-purple-300/90 mt-1">
                      {nogoTotal > 0 ? `${nogoTotal - nogoFails}/${nogoTotal} No-Go Exitosos` : 'Sin Impulsividad'}
                    </p>
                  </div>
                </div>

                {/* 3. Métrica: DOMINANCIA (Mano Biométrica con Escáner Láser + Barra Bilateral HUD) */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/50 transition-all backdrop-blur-md"
                  style={{
                    background: 'rgba(13, 20, 38, 0.78)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    boxShadow: '0 0 25px rgba(168, 85, 247, 0.15)'
                  }}
                >
                  {/* Micro-detalles cyber esquineros */}
                  <span className="absolute top-1.5 left-2 text-[8px] font-mono text-purple-400/40 select-none">+</span>
                  <span className="absolute top-1.5 right-2 text-[8px] font-mono text-purple-400/40 select-none">+</span>

                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
                          DOMINANCIA
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border tracking-wider ${
                        isRightHand
                          ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                          : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                      }`}>
                        {isRightHand ? '🖐️ DER' : '🖐️ IZQ'}
                      </span>
                    </div>

                    {/* Visualizador Biométrico: Mano Anatómica con Escáner Láser Activo */}
                    <div className="relative w-full h-15 flex items-center justify-center my-0.5">
                      {/* Aura sutil de pulso biométrico */}
                      <div className="absolute w-14 h-14 rounded-full bg-cyan-500/10 blur-lg pointer-events-none" />
                      
                      {/* Mano Anatómica Profesional con haz láser animado */}
                      <div className="relative z-10 flex items-center justify-center pointer-events-none drop-shadow-[0_0_12px_rgba(0,242,254,0.45)]">
                        <BiometricHandMesh className="w-18 h-14" />
                      </div>
                    </div>

                    {/* Barra de Balance Bilateral HUD (Animación de relleno hacia el lado dominante) */}
                    <div className="w-full mt-2">
                      <div className="flex items-center justify-between text-[8px] font-mono font-bold text-slate-400 mb-0.5">
                        <span className={!isRightHand ? "text-cyan-400 font-bold" : "text-slate-500"}>IZQ</span>
                        <span className="text-[7px] text-slate-500 tracking-widest">BALANCE</span>
                        <span className={isRightHand ? "text-orange-400 font-bold" : "text-slate-500"}>DER</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950/90 rounded-full border border-purple-500/30 relative flex items-center overflow-hidden">
                        {/* Línea divisoria central neutral */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-slate-600 z-10" />
                        
                        {/* Relleno animado dinámico hacia el lado dominante */}
                        {isRightHand ? (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dominanceBalancePercent}%` }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute left-1/2 h-full bg-gradient-to-r from-purple-500 to-orange-400 rounded-r-full shadow-[0_0_10px_rgba(251,146,60,0.85)]"
                          />
                        ) : (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dominanceBalancePercent}%` }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute right-1/2 h-full bg-gradient-to-l from-purple-500 to-cyan-400 rounded-l-full shadow-[0_0_10px_rgba(6,182,212,0.85)]"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-1">
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(168,85,247,0.35)]" title={dominanceHand}>
                      {dominanceHand.split('(')[0].trim() || 'Mano Derecha'}
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      {asymmetryDelta ? `Delta: +${animatedDelta}ms · Ventaja Motriz` : 'Alternancia Bilateral'}
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

              {/* ── BANNER REARMAR CUBO (CUBO 3D METÁLICO PLATEADO ANIMADO) ── */}
              <div
                className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 relative overflow-hidden backdrop-blur-md"
                style={{
                  background: 'rgba(12, 19, 36, 0.78)',
                  border: '1px solid rgba(0, 242, 254, 0.22)',
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.14)'
                }}
              >
                {/* Cubo de Rubik 3D Metálico Plateado con Giros Continuos y Capas Aleatorias */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-[82px] h-[82px] shrink-0 relative flex items-center justify-center">
                    <MetallicCube3D size={82} />
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
