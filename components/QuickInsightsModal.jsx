'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Save,
  FileText,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

/**
 * Modal de Snapshot Post-Evaluación (Quick Insights)
 * 
 * Muestra un resumen visual, sobrio y digerible inmediatamente al finalizar una prueba clínica.
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void (Guardar y Salir)
 * - onOpenFullReport: () => void (Generar Reporte Completo)
 * - metrics: {
 *     averageReactionTime: number,  // ej. 395 (ms)
 *     sdReactionTime?: number,       // ej. 34 (ms)
 *     inhibitoryControl?: number,    // ej. 92 (%)
 *     nogoFails?: number,            // ej. 0
 *     nogoTotal?: number,            // ej. 4
 *     dominanceHand?: string,        // ej. 'Mano Derecha (Naranja)'
 *     asymmetryDelta?: number,       // ej. 45 (ms)
 *     levelTitle?: string,           // ej. 'Nivel 4: Reaction Mirror (Clínico)'
 *     patientName?: string           // ej. 'Mateo Silva Gómez'
 *   }
 */
export default function QuickInsightsModal({
  isOpen = true,
  onClose,
  onOpenFullReport,
  metrics = {}
}) {
  if (!isOpen) return null;

  const {
    averageReactionTime = 395,
    sdReactionTime = 34,
    inhibitoryControl = 92,
    nogoFails = 0,
    nogoTotal = 4,
    dominanceHand = 'Mano Derecha (Naranja)',
    asymmetryDelta = 45,
    levelTitle = 'Evaluación Oficial Reaction Mirror',
    patientName = 'Estudiante'
  } = metrics;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        
        {/* Card Modal Principal (Clean Swiss UI) */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden relative"
        >
          {/* Header Superior Sobrio */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>SNAPSHOT CLINICO POST-EVALUACIÓN</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                Resultados Preliminares
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[280px] sm:max-w-[340px]">
                {patientName} · {levelTitle}
              </p>
            </div>

            <div className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-semibold uppercase tracking-wider">
              Completado
            </div>
          </div>

          {/* 3 Métricas Destacadas Visuales (Clean Data Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            
            {/* Métrica 1: Latencia Media */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                  LATENCIA
                </span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <div className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  {averageReactionTime}
                  <span className="text-xs font-normal text-slate-500 ml-1">ms</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {sdReactionTime ? `SD: ±${sdReactionTime}ms` : 'Velocidad Media'}
                </p>
              </div>
            </div>

            {/* Métrica 2: Control Inhibitorio */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                  INHIBICIÓN
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  {inhibitoryControl !== null ? `${inhibitoryControl}%` : '100%'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                  {nogoTotal > 0 ? `${nogoTotal - nogoFails}/${nogoTotal} No-Go Exitosos` : 'Sin Impulsividad'}
                </p>
              </div>
            </div>

            {/* Métrica 3: Dominancia Motriz */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                  DOMINANCIA
                </span>
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 tracking-tight leading-snug truncate" title={dominanceHand}>
                  {dominanceHand.split(' ')[0] || 'Mano Derecha'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {asymmetryDelta ? `Delta: +${asymmetryDelta}ms` : 'Alternancia Motora'}
                </p>
              </div>
            </div>

          </div>

          {/* Resumen Clínico Rápido */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 mb-6 text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-900 block mb-0.5">Diagnóstico Preliminar de la Sesión:</span>
            El estudiante completó la evaluación con una latencia de <strong className="text-slate-900">{averageReactionTime} ms</strong> y un control inhibitorio del <strong className="text-slate-900">{inhibitoryControl}%</strong>. 
          </div>

          {/* Dos Botones de Acción Requeridos */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            {/* Botón Secundario */}
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar y Salir</span>
            </button>

            {/* Botón Primario */}
            <button
              type="button"
              onClick={onOpenFullReport}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Generar Reporte Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
