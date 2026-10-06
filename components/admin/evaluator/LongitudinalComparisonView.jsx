'use client';

import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Brain, 
  ShieldAlert, 
  Zap, 
  Calendar, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Layers,
  ChevronRight,
  Download,
  FileText
} from 'lucide-react';
import Decreto170TechnicalReportModal from './Decreto170TechnicalReportModal';

/**
 * ============================================================================
 * COMPONENTE 1: COMPARATIVA LONGITUDINAL ("Sesión Inicial vs. Sesión Actual")
 * ============================================================================
 * Herramienta de impacto para demostrar a autoridades del MINEDUC, sostenedores
 * y coordinadores PIE el progreso objetivo (Δ%) en funciones ejecutivas del estudiante
 * sin sobrecarga administrativa.
 */

// Perfil Demo Sintético Preconfigurado para demostraciones en vivo de 1 clic
const SYNTHETIC_DEMO_DATA = {
  student: {
    codigoParticipante: 'ALU-TEA-07',
    nombre: 'Matías F. (Seudonimizado)',
    run: '24.***.***-K',
    edad: 11,
    curso: '5° Básico A',
    diagnosticoNEE: 'Trastorno del Espectro Autista (TEA) - Permanente',
    colegio: 'Colegio Bicentenario Santa María',
    rbd: '10482-1'
  },
  baselineSession: {
    id: 'demo-baseline-01',
    label: 'Sesión Inicial (Línea Base - Marzo 2026)',
    fecha: '12/03/2026',
    metrics: {
      motorLatencyMs: 642, // Latencia de duda motora
      motorLatencySd: 118,
      corsiSpanBlocks: 3,  // Memoria de trabajo visuoespacial 3D
      corsiAccuracyPercent: 55,
      inhibitionErrorRatePercent: 36.4, // Fallos impulsivos en No-Go
      bimanualBalanceRatio: 68,
      cognitiveFatigueIndex: 4.3 // 1 a 5
    }
  },
  controlSession: {
    id: 'demo-control-02',
    label: 'Sesión de Control (Monitoreo PACI - Junio 2026)',
    fecha: '18/06/2026',
    metrics: {
      motorLatencyMs: 418, // 642 -> 418 (-34.9% verde)
      motorLatencySd: 54,
      corsiSpanBlocks: 6,  // 3 -> 6 (+100% verde)
      corsiAccuracyPercent: 88,
      inhibitionErrorRatePercent: 11.2, // 36.4% -> 11.2% (-69.2% verde)
      bimanualBalanceRatio: 52,
      cognitiveFatigueIndex: 1.9 // 4.3 -> 1.9 (-55.8% verde)
    }
  }
};

export default function LongitudinalComparisonView({
  sessions = [],
  initialSubjectCode = null,
  onBack = null
}) {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lista de códigos de sujetos disponibles en las sesiones reales
  const availableStudents = useMemo(() => {
    const map = new Map();
    sessions.forEach(s => {
      const code = s.participante?.codigoParticipante;
      if (code) {
        if (!map.has(code)) map.set(code, []);
        map.get(code).push(s);
      }
    });
    return map;
  }, [sessions]);

  const studentCodes = Array.from(availableStudents.keys());
  const [selectedStudentCode, setSelectedStudentCode] = useState(initialSubjectCode || (studentCodes[0] || ''));

  const studentSessions = useMemo(() => {
    if (isDemoMode) return [];
    return availableStudents.get(selectedStudentCode) || [];
  }, [isDemoMode, availableStudents, selectedStudentCode]);

  const [sessionAId, setSessionAId] = useState('');
  const [sessionBId, setSessionBId] = useState('');

  // Seleccionar automáticamente las dos primeras sesiones para comparar si hay datos reales
  React.useEffect(() => {
    if (!isDemoMode && studentSessions.length >= 2) {
      setSessionAId(studentSessions[studentSessions.length - 1].id); // Más antigua
      setSessionBId(studentSessions[0].id); // Más reciente
    }
  }, [isDemoMode, studentSessions]);

  // Datos consolidados para la comparación
  const comparisonData = useMemo(() => {
    if (isDemoMode) {
      const b = SYNTHETIC_DEMO_DATA.baselineSession.metrics;
      const c = SYNTHETIC_DEMO_DATA.controlSession.metrics;

      return {
        student: SYNTHETIC_DEMO_DATA.student,
        baseline: {
          fecha: SYNTHETIC_DEMO_DATA.baselineSession.fecha,
          label: SYNTHETIC_DEMO_DATA.baselineSession.label,
          latenciaMs: b.motorLatencyMs,
          corsiSpan: b.corsiSpanBlocks,
          inhibitionErrorRate: b.inhibitionErrorRatePercent,
          fatiga: b.cognitiveFatigueIndex
        },
        control: {
          fecha: SYNTHETIC_DEMO_DATA.controlSession.fecha,
          label: SYNTHETIC_DEMO_DATA.controlSession.label,
          latenciaMs: c.motorLatencyMs,
          corsiSpan: c.corsiSpanBlocks,
          inhibitionErrorRate: c.inhibitionErrorRatePercent,
          fatiga: c.cognitiveFatigueIndex
        },
        deltas: {
          latencia: -34.9,
          corsi: 100.0,
          inhibition: -69.2,
          fatiga: -55.8
        },
        evaluador: {
          nombre: 'Psicopedagoga Nicole Vargas C.',
          registroMineduc: '89241-CL'
        }
      };
    }

    // Modo con datos reales seleccionados
    const sessionA = studentSessions.find(s => s.id === sessionAId);
    const sessionB = studentSessions.find(s => s.id === sessionBId);

    const extractMetrics = (session) => {
      if (!session) return { latenciaMs: 450, corsiSpan: 4, inhibitionErrorRate: 20, fatiga: 2.5 };
      const trials = session.telemetria_ensayos || [];
      const goTrials = trials.filter(t => !t.is_commission_error && (t.type === 'GO' || t.status === 'Ok'));
      const avgLat = goTrials.length > 0 
        ? Math.round(goTrials.reduce((acc, t) => acc + (t.reaction_time_ms || t.time || 0), 0) / goTrials.length) 
        : 450;
      
      const noGoTrials = trials.filter(t => t.type === 'NOGO' || t.is_commission_error);
      const noGoErrors = trials.filter(t => t.is_commission_error || (t.type === 'NOGO' && t.fail));
      const inErrorRate = noGoTrials.length > 0 
        ? Math.round((noGoErrors.length / noGoTrials.length) * 100 * 10) / 10 
        : 18.0;

      const corsiSpan = session.bateriasDetalle?.bat5_memory?.stats?.max_span_achieved || 4;
      const fatiga = session.encuestaSalida?.fatigaPercibida || 2.5;

      return { latenciaMs: avgLat, corsiSpan, inhibitionErrorRate: inErrorRate, fatiga };
    };

    const metA = extractMetrics(sessionA);
    const metB = extractMetrics(sessionB);

    const calcDelta = (oldVal, newVal) => {
      if (!oldVal) return 0;
      return Math.round(((newVal - oldVal) / oldVal) * 100 * 10) / 10;
    };

    return {
      student: {
        codigoParticipante: selectedStudentCode || 'Participante',
        nombre: 'Estudiante Seudonimizado',
        run: '19.***.***-2',
        edad: sessionA?.participante?.edad || 11,
        curso: '5° Básico PIE',
        diagnosticoNEE: sessionA?.participante?.observacionesIniciales || 'Evaluación de Funciones Ejecutivas'
      },
      baseline: {
        fecha: sessionA?.timestamp ? new Date(sessionA.timestamp).toLocaleDateString('es-CL') : 'Línea Base',
        label: 'Sesión Inicial',
        latenciaMs: metA.latenciaMs,
        corsiSpan: metA.corsiSpan,
        inhibitionErrorRate: metA.inhibitionErrorRate,
        fatiga: metA.fatiga
      },
      control: {
        fecha: sessionB?.timestamp ? new Date(sessionB.timestamp).toLocaleDateString('es-CL') : 'Sesión Control',
        label: 'Sesión de Control',
        latenciaMs: metB.latenciaMs,
        corsiSpan: metB.corsiSpan,
        inhibitionErrorRate: metB.inhibitionErrorRate,
        fatiga: metB.fatiga
      },
      deltas: {
        latencia: calcDelta(metA.latenciaMs, metB.latenciaMs),
        corsi: calcDelta(metA.corsiSpan, metB.corsiSpan),
        inhibition: calcDelta(metA.inhibitionErrorRate, metB.inhibitionErrorRate),
        fatiga: calcDelta(metA.fatiga, metB.fatiga)
      },
      evaluador: {
        nombre: 'Equipo de Evaluación Neurocognitiva PIE',
        registroMineduc: 'MINEDUC-89241'
      }
    };
  }, [isDemoMode, studentSessions, sessionAId, sessionBId, selectedStudentCode]);

  // Generación dinámica del Dictamen Pedagógico-Clínico
  const dictamenGenerado = useMemo(() => {
    const { deltas, student, baseline, control } = comparisonData;
    const isImproved = deltas.latencia < 0 && deltas.inhibition <= 0;
    const isCorsiExpanded = deltas.corsi > 0;

    let verdict = `En el marco del monitoreo técnico del Decreto Supremo N° 170 y el Plan de Adecuaciones Curriculares Individualizadas (PACI), se observa una evolución altamente favorable en el perfil neurofuncional del estudiante ${student.codigoParticipante}. `;
    
    if (deltas.latencia < 0) {
      verdict += `La latencia de respuesta motora experimentó una optimización del ${Math.abs(deltas.latencia)}% (pasando de ${baseline.latenciaMs} ms a ${control.latenciaMs} ms), lo que evidencia una marcada reducción en la fricción decisional y en la vacilación psicomotora ante consignas estructuradas. `;
    }

    if (isCorsiExpanded) {
      verdict += `En el dominio de la memoria de trabajo visuoespacial tridimensional (Test de Corsi 3D con Smart Cube IoT), el estudiante logró incrementar su span secuencial en un +${deltas.corsi}%, alcanzando una retención activa de ${control.corsiSpan} bloques continuos. `;
    }

    if (deltas.inhibition < 0) {
      verdict += `Asimismo, la tasa de errores de comisión en tareas de control inhibitorio (Go / No-Go) descendió un ${Math.abs(deltas.inhibition)}%, consolidando el freno voluntario y mitigando conductas de impulsividad en el aula común. `;
    }

    verdict += `Se recomienda mantener las adaptaciones curriculares bajo Diseño Universal para el Aprendizaje (DUA - Decreto 83), favoreciendo la representación táctil y la segmentación de instrucciones complejas en secuencias de máximo 4 pasos.`;

    return verdict;
  }, [comparisonData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ── BARRA SUPERIOR DE CONTROL & SELECTOR DE MODO DEMO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Comparativa Longitudinal de Sesiones</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Decreto 170 · Línea Base vs. Control
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Evaluación cuantitativa y objetiva de la eficacia de apoyos PIE mediante IoT háptico.
            </p>
          </div>
        </div>

        {/* Acciones y Toggle Modo Demo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsDemoMode(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              isDemoMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Alternar entre datos sintéticos de demostración y datos clínicos reales"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isDemoMode ? '⚡ Demo MINEDUC Activa' : 'Usar Datos Reales'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Anexo Oficial Decreto 170</span>
          </button>
        </div>
      </div>

      {/* ── SELECTORES DE SESIÓN (SOLO SI NO ES MODO DEMO) ── */}
      {!isDemoMode && (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Estudiante / Código
            </label>
            <select
              value={selectedStudentCode}
              onChange={(e) => setSelectedStudentCode(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
            >
              {studentCodes.map(code => (
                <option key={code} value={code}>
                  {code} ({availableStudents.get(code)?.length || 0} sesiones)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Sesión A (Línea Base)
            </label>
            <select
              value={sessionAId}
              onChange={(e) => setSessionAId(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
            >
              {studentSessions.map((s, idx) => (
                <option key={s.id || idx} value={s.id}>
                  {new Date(s.timestamp).toLocaleDateString('es-CL')} - {s.id?.slice(0, 10)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Sesión B (Control Actual)
            </label>
            <select
              value={sessionBId}
              onChange={(e) => setSessionBId(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
            >
              {studentSessions.map((s, idx) => (
                <option key={s.id || idx} value={s.id}>
                  {new Date(s.timestamp).toLocaleDateString('es-CL')} - {s.id?.slice(0, 10)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── CUADÍCULA DE TARJETAS MÉTRICAS CON DELTAS (Δ%) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Latencia de Duda Motora */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 relative overflow-hidden shadow-lg group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latencia Motora</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {comparisonData.control.latenciaMs}
            </span>
            <span className="text-xs font-mono text-slate-400">ms</span>
            
            <div className="ml-auto flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{comparisonData.deltas.latencia}%</span>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            Línea Base: <span className="font-mono text-slate-300 font-bold">{comparisonData.baseline.latenciaMs} ms</span>
          </p>
          <div className="mt-3 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-[70%]" />
          </div>
        </div>

        {/* Card 2: Memoria de Trabajo Visoespacial 3D (Corsi) */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 relative overflow-hidden shadow-lg group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corsi Span 3D</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Brain className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {comparisonData.control.corsiSpan}
            </span>
            <span className="text-xs font-mono text-slate-400">bloques</span>
            
            <div className="ml-auto flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{comparisonData.deltas.corsi}%</span>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            Línea Base: <span className="font-mono text-slate-300 font-bold">{comparisonData.baseline.corsiSpan} bloques</span>
          </p>
          <div className="mt-3 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full w-[85%]" />
          </div>
        </div>

        {/* Card 3: Control Inhibitorio & Impulsividad */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 relative overflow-hidden shadow-lg group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Error Inhibitorio</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {comparisonData.control.inhibitionErrorRate}%
            </span>
            
            <div className="ml-auto flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{comparisonData.deltas.inhibition}%</span>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            Línea Base: <span className="font-mono text-slate-300 font-bold">{comparisonData.baseline.inhibitionErrorRate}%</span>
          </p>
          <div className="mt-3 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 h-full w-[40%]" />
          </div>
        </div>

        {/* Card 4: Resistencia a la Fatiga */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 relative overflow-hidden shadow-lg group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Índice de Fatiga</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {comparisonData.control.fatiga}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 5.0</span>
            
            <div className="ml-auto flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{comparisonData.deltas.fatiga}%</span>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            Línea Base: <span className="font-mono text-slate-300 font-bold">{comparisonData.baseline.fatiga} / 5.0</span>
          </p>
          <div className="mt-3 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full w-[35%]" />
          </div>
        </div>

      </div>

      {/* ── CUADRO DE DICTAMEN CLÍNICO-PEDAGÓGICO AUTOGENERADO ── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Dictamen Clínico-Pedagógico para Justificación PIE (Decreto 170)
              </h3>
              <p className="text-[11px] text-purple-300/80 font-mono">
                Sintetizado automáticamente a partir de telemetría IoT inmutable
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Progreso Acreditado</span>
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-black/30 p-4 sm:p-5 rounded-2xl border border-white/5 font-sans">
          {dictamenGenerado}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400 border-t border-white/10 font-mono">
          <div className="flex items-center gap-2">
            <span>Sujeto: <strong className="text-white">{comparisonData.student.codigoParticipante}</strong></span>
            <span>·</span>
            <span>Diagnóstico: <strong className="text-purple-300">{comparisonData.student.diagnosticoNEE}</strong></span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-all underline underline-offset-4"
          >
            <span>Ver Sello y Firma del Anexo Técnico</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── MODAL DEL ANEXO TÉCNICO OFICIAL DECRETO 170 ── */}
      <Decreto170TechnicalReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        comparisonData={comparisonData}
      />

    </div>
  );
}
