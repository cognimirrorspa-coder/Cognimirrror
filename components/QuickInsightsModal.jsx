'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Timer,
  ArrowRight,
  Save,
  FileText,
  Target,
  Settings
} from 'lucide-react';
import ModalOrdenarCubo from './ModalOrdenarCubo';

/**
 * QuickInsightsModal (Snapshot Clínico Post-Evaluación)
 * 
 * Rediseño visual sci-fi / neuroclínico premium fiel a la referencia de alta fidelidad:
 * - Marco con borde degradado cian a magenta con HUD crosshairs (+)
 * - Medidores de datos dedicados:
 *     1. Barra LED segmentada para Latencia (ms)
 *     2. Tacómetro radial de arco de neón para Control Inhibitorio (%)
 *     3. Silueta biométrica / neural para Dominancia de Mano
 * - Panel de diagnóstico preliminar con cuadrícula técnica de ingeniería
 * - Banner con cubo de Rubik holográfico 3D isométrico para rearmar el cubo
 * - Botones de acción dark-glass y gradiente índigo/púrpura
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

  // Cálculo de barras LED para Latencia (10 segmentos)
  const totalLedBars = 10;
  // Entre 200ms y 700ms normalizamos el llenado (414ms = ~7-8 barras activas)
  const activeLedBars = Math.min(
    totalLedBars,
    Math.max(2, Math.round(((700 - Math.min(650, averageReactionTime)) / 450) * totalLedBars) || 8)
  );

  // Cálculo para Tacómetro Radial de Inhibición (Arco semicircular de 180 grados)
  const radius = 38;
  const arcLength = Math.PI * radius; // ~119.38
  const clampedInhibition = Math.min(100, Math.max(0, inhibitoryControl ?? 75));
  const dashOffset = arcLength * (1 - clampedInhibition / 100);

  // Coordenadas del punto luminoso sobre el arco
  // Ángulo en radianes desde PI (izquierda) hacia 0 (derecha)
  const angleRad = Math.PI - (clampedInhibition / 100) * Math.PI;
  const dotX = 50 + radius * Math.cos(angleRad);
  const dotY = 46 - radius * Math.sin(angleRad);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        
        {/* Contenedor con HUD Crosshairs exteriores */}
        <div className="relative w-full max-w-xl">
          
          {/* Crosshairs exteriores en las 4 esquinas */}
          <span className="absolute -top-3 -left-3 text-cyan-400/40 font-mono text-sm select-none pointer-events-none">+</span>
          <span className="absolute -top-3 -right-3 text-purple-400/40 font-mono text-sm select-none pointer-events-none">+</span>
          <span className="absolute -bottom-3 -left-3 text-cyan-400/40 font-mono text-sm select-none pointer-events-none">+</span>
          <span className="absolute -bottom-3 -right-3 text-purple-400/40 font-mono text-sm select-none pointer-events-none">+</span>

          {/* Card Principal con Borde Gradiente Neón */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full rounded-3xl p-[1.5px] bg-gradient-to-br from-cyan-500/60 via-purple-500/40 to-pink-500/50 shadow-[0_0_50px_rgba(6,182,212,0.15),0_0_80px_rgba(168,85,247,0.1)] relative"
          >
            {/* Cuerpo interior con fondo Glass ultra-oscuro */}
            <div className="w-full bg-[#090d16]/95 backdrop-blur-2xl rounded-[calc(1.5rem-1.5px)] p-6 sm:p-8 relative overflow-hidden">
              
              {/* Esquinas técnicas decorativas interiores */}
              <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-cyan-500/40 pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-purple-500/40 pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-cyan-500/40 pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-purple-500/40 pointer-events-none" />

              {/* ── HEADER SUPERIOR ── */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.18em] uppercase text-cyan-400/90 font-semibold">
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

                {/* Badge Completado */}
                <div className="px-3 py-1 rounded-md bg-[#0a1f18] border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase shadow-[0_0_12px_rgba(16,185,129,0.25)] shrink-0">
                  COMPLETADO
                </div>
              </div>

              {/* ── 3 MÉTRICAS PRINCIPALES ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                
                {/* Métrica 1: LATENCIA */}
                <div className="bg-[#0e1322]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                        LATENCIA
                      </span>
                      <Timer className="w-4 h-4 text-slate-400" />
                    </div>

                    {/* Medidor de Barras LED Segmentadas */}
                    <div className="flex items-center gap-1.5 mb-3 py-1">
                      {Array.from({ length: totalLedBars }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-4.5 flex-1 rounded-[2px] transition-all duration-300 ${
                            i < activeLedBars
                              ? 'bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                              : 'bg-slate-800/60 border border-slate-700/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                      {averageReactionTime}
                      <span className="text-xs font-normal text-slate-400 ml-1 font-mono">ms</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      {sdReactionTime ? `SD: ±${sdReactionTime}ms` : 'Velocidad Media'}
                    </p>
                  </div>
                </div>

                {/* Métrica 2: INHIBICIÓN (Hero Card con Borde Púrpura) */}
                <div className="bg-[#101426]/90 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.18)] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
                        INHIBICIÓN
                      </span>
                      <Target className="w-4 h-4 text-purple-400" />
                    </div>

                    {/* Tacómetro Radial de Arco de Neón */}
                    <div className="relative w-full flex items-center justify-center my-0.5">
                      <svg viewBox="0 0 100 52" className="w-24 h-12 overflow-visible">
                        <defs>
                          <linearGradient id="inhibit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                          <filter id="glow-indicator" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ec4899" />
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
                        {/* Arco de progreso degradado */}
                        <path
                          d="M 12 46 A 38 38 0 0 1 88 46"
                          fill="none"
                          stroke="url(#inhibit-grad)"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={arcLength}
                          strokeDashoffset={dashOffset}
                          className="transition-all duration-700 ease-out"
                        />
                        {/* Punto luminoso en el extremo */}
                        <circle
                          cx={dotX}
                          cy={dotY}
                          r="3"
                          fill="#ec4899"
                          filter="url(#glow-indicator)"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center mt-1">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                      {clampedInhibition}%
                    </div>
                    <p className="text-[11px] font-mono text-purple-300/80 mt-1 truncate">
                      {nogoTotal > 0 ? `${nogoTotal - nogoFails}/${nogoTotal} No-Go Exitosos` : 'Sin Impulsividad'}
                    </p>
                  </div>
                </div>

                {/* Métrica 3: DOMINANCIA */}
                <div className="bg-[#0e1322]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                        DOMINANCIA
                      </span>
                      <Activity className="w-4 h-4 text-purple-400" />
                    </div>

                    {/* Silueta Biométrica de Mano Holográfica */}
                    <div className="flex items-center justify-center py-0.5">
                      <svg viewBox="0 0 64 48" className="w-16 h-11 text-indigo-400/70" fill="none">
                        {/* Anillos de ondas motrices */}
                        <ellipse cx="32" cy="24" rx="28" ry="18" stroke="rgba(139,92,246,0.18)" strokeWidth="1" strokeDasharray="3 3" />
                        <ellipse cx="32" cy="24" rx="20" ry="13" stroke="rgba(99,102,241,0.25)" strokeWidth="1" />
                        
                        {/* Silueta punteada de mano / dedos */}
                        <path
                          d="M 23 20 C 23 14, 25 10, 26 10 C 27 10, 28 14, 28 20 M 28 17 C 28 11, 30 7, 31.5 7 C 33 7, 34 11, 34 17 M 34 18 C 34 12, 36 9, 37.5 9 C 39 9, 40 12, 40 19 M 40 22 C 40 17, 42 14, 43 14 C 44 14, 45 17, 45 24 C 45 32, 40 37, 34 38 C 28 39, 23 35, 23 29 M 23 26 C 21 24, 18 22, 17 23 C 16 24, 18 27, 21 30"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-80"
                        />
                        {/* Nodos de sensores */}
                        <circle cx="26" cy="10" r="1.5" fill="#38bdf8" />
                        <circle cx="31.5" cy="7" r="1.5" fill="#a855f7" />
                        <circle cx="37.5" cy="9" r="1.5" fill="#ec4899" />
                        <circle cx="43" cy="14" r="1.5" fill="#38bdf8" />
                        <circle cx="17" cy="23" r="1.5" fill="#a855f7" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight truncate" title={dominanceHand}>
                      {dominanceHand.split(' ')[0] || 'Mano'}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      {asymmetryDelta ? `Delta: +${asymmetryDelta}ms` : 'Alternancia Motora'}
                    </p>
                  </div>
                </div>

              </div>

              {/* ── CUADRO DIAGNÓSTICO PRELIMINAR (BLUEPRINT GRID) ── */}
              <div
                className="relative bg-[#0c101d]/90 border border-white/10 rounded-xl p-4 mb-4 overflow-hidden"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              >
                {/* Marcas de esquina técnicas */}
                <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-600 select-none">+</span>
                <span className="absolute top-1.5 right-2 text-[9px] font-mono text-slate-600 select-none">+</span>
                <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-slate-600 select-none">+</span>
                <span className="absolute bottom-1.5 right-2 text-[9px] font-mono text-slate-600 select-none">+</span>

                <h4 className="text-xs font-bold text-white mb-1 tracking-wide">
                  Diagnóstico Preliminar de la Sesión:
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  El estudiante completó la evaluación con una latencia de{' '}
                  <span className="font-bold font-mono text-cyan-400">{averageReactionTime} ms</span>{' '}
                  y un control inhibitorio del{' '}
                  <span className="font-bold font-mono text-purple-400">{clampedInhibition}%</span>.
                </p>
              </div>

              {/* ── BANNER REARMAR CUBO (CUBO HOLOGRÁFICO 3D) ── */}
              <div className="bg-[#0d1424]/90 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 relative overflow-hidden shadow-lg shadow-blue-950/20">
                
                {/* Cubo Holográfico Isométrico Vectorial */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                      <defs>
                        <filter id="cube-glow" x="-30%" y="-30%" width="160%" height="160%">
                          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.6" />
                        </filter>
                        <linearGradient id="cube-grad-top" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
                          <stop offset="100%" stopColor="rgba(168,85,247,0.15)" />
                        </linearGradient>
                        <linearGradient id="cube-grad-left" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(6,182,212,0.25)" />
                          <stop offset="100%" stopColor="rgba(30,58,138,0.3)" />
                        </linearGradient>
                        <linearGradient id="cube-grad-right" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(168,85,247,0.25)" />
                          <stop offset="100%" stopColor="rgba(147,51,234,0.15)" />
                        </linearGradient>
                      </defs>

                      {/* Partículas de datos flotantes */}
                      <circle cx="16" cy="30" r="1.5" fill="#38bdf8" opacity="0.7" />
                      <circle cx="20" cy="74" r="1" fill="#ec4899" opacity="0.6" />
                      <circle cx="84" cy="28" r="1.5" fill="#a855f7" opacity="0.8" />
                      <circle cx="80" cy="68" r="1" fill="#38bdf8" opacity="0.7" />

                      {/* Cara Superior Isométrica (3x3 grid) */}
                      <path d="M 50 14 L 80 30 L 50 46 L 20 30 Z" fill="url(#cube-grad-top)" stroke="#06b6d4" strokeWidth="1.2" filter="url(#cube-glow)" />
                      {/* Líneas internas cara superior */}
                      <line x1="30" y1="24.7" x2="60" y2="40.7" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
                      <line x1="40" y1="19.3" x2="70" y2="35.3" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
                      <line x1="40" y1="35.3" x2="70" y2="19.3" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
                      <line x1="30" y1="40.7" x2="60" y2="24.7" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />

                      {/* Cara Izquierda Isométrica */}
                      <path d="M 20 30 L 50 46 L 50 82 L 20 66 Z" fill="url(#cube-grad-left)" stroke="#06b6d4" strokeWidth="1.2" />
                      <line x1="30" y1="35.3" x2="30" y2="71.3" stroke="#06b6d4" strokeWidth="0.8" opacity="0.6" />
                      <line x1="40" y1="40.7" x2="40" y2="76.7" stroke="#06b6d4" strokeWidth="0.8" opacity="0.6" />
                      <line x1="20" y1="42" x2="50" y2="58" stroke="#06b6d4" strokeWidth="0.8" opacity="0.6" />
                      <line x1="20" y1="54" x2="50" y2="70" stroke="#06b6d4" strokeWidth="0.8" opacity="0.6" />

                      {/* Cara Derecha Isométrica */}
                      <path d="M 50 46 L 80 30 L 80 66 L 50 82 Z" fill="url(#cube-grad-right)" stroke="#ec4899" strokeWidth="1.2" />
                      <line x1="60" y1="40.7" x2="60" y2="76.7" stroke="#a855f7" strokeWidth="0.8" opacity="0.6" />
                      <line x1="70" y1="35.3" x2="70" y2="71.3" stroke="#a855f7" strokeWidth="0.8" opacity="0.6" />
                      <line x1="50" y1="58" x2="80" y2="42" stroke="#a855f7" strokeWidth="0.8" opacity="0.6" />
                      <line x1="50" y1="70" x2="80" y2="54" stroke="#a855f7" strokeWidth="0.8" opacity="0.6" />

                      {/* Vértices brillantes */}
                      <circle cx="50" cy="14" r="2" fill="#ffffff" />
                      <circle cx="20" cy="30" r="1.5" fill="#38bdf8" />
                      <circle cx="80" cy="30" r="1.5" fill="#ec4899" />
                      <circle cx="50" cy="46" r="2" fill="#38bdf8" />
                      <circle cx="50" cy="82" r="2" fill="#ec4899" />
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

                {/* Botón Rearmar Cubo */}
                <button
                  type="button"
                  onClick={() => setIsSolverOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 border border-cyan-500/40 text-cyan-200 hover:text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rearmar Cubo</span>
                </button>
              </div>

              {/* ── MODAL ORDENAR CUBO ── */}
              <ModalOrdenarCubo
                isOpen={isSolverOpen}
                onClose={() => setIsSolverOpen(false)}
                isDark={true}
              />

              {/* ── BOTONES DE ACCIÓN FOOTER ── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {/* Siguiente Alumno (si aplica) */}
                {nextStudent && onNextStudent ? (
                  <button
                    type="button"
                    onClick={() => onNextStudent(nextStudent)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[9px] uppercase tracking-wider text-blue-200">Siguiente en sala</span>
                      <span className="text-xs font-bold truncate max-w-[180px]">
                        {nextStudent.name}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                ) : <div />}

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Botón Guardar y Salir */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar y Salir</span>
                  </button>

                  {/* Botón Ver Reporte */}
                  <button
                    type="button"
                    onClick={onOpenFullReport}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>Ver Reporte</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
