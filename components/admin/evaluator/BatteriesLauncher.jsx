'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Brain,
  Sparkles,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export default function BatteriesLauncher({ 
  participantData, 
  completedBatteries = {}, 
  onToggleBatteryStatus,
  onNext, 
  onBack 
}) {
  const subjectId = participantData?.codigoParticipante || 'P01';
  const studyTag = 'validacion_n10';

  const batteries = [
    {
      id: 'bat1_warmup',
      number: '01',
      title: 'Batería 1: Calentamiento y Exploración Háptica',
      subtitle: 'Nivel 1 // Familiarización y Adaptación Basal',
      desc: 'Rotaciones libres sin presión temporal para habituación propioceptiva y verificación de recepción BLE.',
      metric: 'Basal / Conectividad',
      duration: '~60 seg',
      color: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      accentColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-300',
      url: `/reaction-game?level=warmup&subjectId=${encodeURIComponent(subjectId)}&etiquetaEstudio=${studyTag}`
    },
    {
      id: 'bat2_inhibitory',
      number: '02',
      title: 'Batería 2: Control Inhibitorio Unilateral',
      subtitle: 'Nivel 2 // Go/No-Go Simple (40 Ensayos)',
      desc: 'Evaluación del freno motor prefrontal: 32 Go (Rojo) vs 8 No-Go (Naranjo - cara contraria). Jitter ISI 1.000-1.800 ms.',
      metric: 'Comisiones / Latencia Go',
      duration: '~2.5 min',
      color: 'from-purple-500/20 to-indigo-500/20',
      border: 'border-purple-500/30',
      accentColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/15 text-purple-300',
      url: `/reaction-game?level=single_face&subjectId=${encodeURIComponent(subjectId)}&etiquetaEstudio=${studyTag}`
    },
    {
      id: 'bat3_bimanual',
      number: '03',
      title: 'Batería 3: Coordinación Bimanual y Alternancia',
      subtitle: 'Nivel 3 // Bilateralidad Pura (24 Ensayos)',
      desc: 'Medición de asimetría hemisférica pura (Mano Izquierda vs Derecha) sin interferencia de distractores No-Go.',
      metric: 'Delta L/R / Velocidad Pura',
      duration: '~2 min',
      color: 'from-indigo-500/20 to-blue-500/20',
      border: 'border-indigo-500/30',
      accentColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/15 text-indigo-300',
      url: `/reaction-game?level=bilateral_pure&subjectId=${encodeURIComponent(subjectId)}&etiquetaEstudio=${studyTag}`
    },
    {
      id: 'bat4_official',
      number: '04',
      title: 'Batería 4: Reaction Mirror Clínico Oficial',
      subtitle: 'Nivel 4 // Batería Completa (40 Ensayos Mixtos)',
      desc: 'Paradigma clínico estandarizado: 30 Go bilaterales vs 10 No-Go distractores (Azul/Verde). Mide fatiga y variabilidad.',
      metric: 'Variabilidad SD / Fatiga Atencional',
      duration: '~3 min',
      color: 'from-pink-500/20 to-rose-500/20',
      border: 'border-pink-500/30',
      accentColor: 'text-pink-400',
      badgeBg: 'bg-pink-500/15 text-pink-300',
      url: `/reaction-game?subjectId=${encodeURIComponent(subjectId)}&etiquetaEstudio=${studyTag}`
    }
  ];

  const totalBatteries = batteries.length;
  const completedCount = Object.values(completedBatteries).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalBatteries) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── HEADER DE PROGRESO DE BATERÍAS ── */}
      <div className="bg-[#0c101a]/95 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Protocolo de Validación Clínica (n=10)
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Sujeto: {subjectId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Aplica las 4 baterías en orden estricto. Cada prueba almacena automáticamente la telemetría milimétrica.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-white">
                {completedCount} de {totalBatteries} Completadas
              </span>
              <p className="text-[10px] text-slate-400">{progressPercent}% del protocolo</p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center font-mono font-black text-xs text-purple-300 bg-purple-600/10">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="w-full bg-white/5 h-2 rounded-full mt-5 overflow-hidden p-0.5 border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── LISTADO DE LAS 4 BATERÍAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {batteries.map((bat) => {
          const isDone = completedBatteries[bat.id];

          return (
            <div
              key={bat.id}
              className={`bg-[#0c101a]/90 border rounded-2xl p-5 shadow-lg backdrop-blur-md flex flex-col justify-between transition-all ${
                isDone 
                  ? 'border-emerald-500/40 bg-[#0d161c]/90' 
                  : `${bat.border} hover:border-white/20`
              }`}
            >
              <div>
                {/* Header de la Card */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-white/10 text-white/70">
                      {bat.number}
                    </span>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${bat.badgeBg}`}>
                      {bat.metric}
                    </span>
                  </div>

                  {/* Toggle Estado Manual */}
                  <button
                    type="button"
                    onClick={() => onToggleBatteryStatus(bat.id)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span>{isDone ? 'Completado' : 'Marcar Hecho'}</span>
                  </button>
                </div>

                {/* Título y Descripción */}
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {bat.title}
                </h4>
                <p className={`text-xs font-semibold ${bat.accentColor} mt-0.5`}>
                  {bat.subtitle}
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {bat.desc}
                </p>
              </div>

              {/* Botón de Lanzamiento */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {bat.duration}
                </span>

                <a
                  href={bat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    // Si abre la prueba, la pre-marca o activa
                    if (!isDone) onToggleBatteryStatus(bat.id);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Lanzar Prueba</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── BATERÍA COMPLEMENTARIA OPCIONAL: CORSI 3D ── */}
      <div className="bg-[#101322]/80 border border-cyan-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Módulo Complementario: Memory Mirror (Test de Corsi 3D)</span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">Opcional</span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluación de la amplitud de memoria de trabajo visoespacial (Corsi Span 3D).
            </p>
          </div>
        </div>

        <a
          href={`/simon-game?subjectId=${encodeURIComponent(subjectId)}&etiquetaEstudio=${studyTag}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
        >
          <span>Abrir Corsi 3D</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* ── NAVEGACIÓN ENTRE PASOS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Verificación BLE</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continuar a Encuesta de Salida</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
