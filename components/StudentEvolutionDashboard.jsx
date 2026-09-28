'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  Crosshair, 
  ArrowLeft, 
  ShieldAlert, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Play,
  ClipboardList,
  Palette,
  Check
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { analyzeData } from '../utils/analytics';

// Paleta cromática clínica disponible para asignación de líneas
const AVAILABLE_COLORS = [
  { name: 'Cian Neón', hex: '#06b6d4' },
  { name: 'Azul Eléctrico', hex: '#3b82f6' },
  { name: 'Púrpura Profundo', hex: '#a855f7' },
  { name: 'Magenta / Rosa', hex: '#ec4899' },
  { name: 'Rojo Coral', hex: '#ef4444' },
  { name: 'Naranja Fuego', hex: '#f97316' },
  { name: 'Ámbar Dorado', hex: '#f59e0b' },
  { name: 'Verde Esmeralda', hex: '#10b981' }
];

// Configuración base de los 5 canales de evaluación
const DEFAULT_TEST_CONFIGS = {
  reaction: {
    id: 'reaction',
    name: 'Reaction Mirror',
    shortName: 'Reaction',
    defaultColor: '#06b6d4',
    icon: Activity,
    unit: 'ms',
    metricKey: 'rt_reaction',
    dataLabel: 'Latencia Reaction (ms)'
  },
  memory: {
    id: 'memory',
    name: 'Memory Mirror',
    shortName: 'Memory',
    defaultColor: '#a855f7',
    icon: Brain,
    unit: 'Span / %',
    metricKey: 'rt_memory',
    dataLabel: 'Span / Precisión Memory'
  },
  single_face: {
    id: 'single_face',
    name: 'Control Inhibitorio (Go / No-Go)',
    shortName: 'Go/No-Go',
    defaultColor: '#ef4444',
    icon: Crosshair,
    unit: 'ms',
    metricKey: 'rt_gonogo',
    dataLabel: 'Latencia Go/No-Go (ms)'
  },
  bilateral_pure: {
    id: 'bilateral_pure',
    name: 'Coordinación Bimanual',
    shortName: 'Bimanual',
    defaultColor: '#10b981',
    icon: Zap,
    unit: 'ms',
    metricKey: 'rt_bilateral',
    dataLabel: 'Latencia Bimanual (ms)'
  },
  checklist: {
    id: 'checklist',
    name: 'Checklist Conductual PIE',
    shortName: 'Checklist',
    defaultColor: '#f59e0b',
    icon: ClipboardList,
    unit: 'Puntos %',
    metricKey: 'score_checklist',
    dataLabel: 'Regulación Checklist (%)'
  }
};

export default function StudentEvolutionDashboard({ 
  patient: student, 
  onBack, 
  hideHeader = false,
  activeFilter = 'general', // 'general' | 'reaction' | 'memory' | 'single_face' | 'bilateral_pure' | 'checklist'
  externalLineColors = null,
  onColorChange = null
}) {
  // Estado local de colores asignados a cada línea
  const [lineColors, setLineColors] = useState(() => {
    try {
      const stored = localStorage.getItem('cognimirror_user_line_colors');
      if (stored) return { ...JSON.parse(stored), ...(externalLineColors || {}) };
    } catch (_) {}
    return {
      reaction: '#06b6d4',
      memory: '#a855f7',
      single_face: '#ef4444',
      bilateral_pure: '#10b981',
      checklist: '#f59e0b'
    };
  });

  // Estado de líneas activas / combinadas en el gráfico
  const [activeLines, setActiveLines] = useState({
    reaction: true,
    memory: true,
    single_face: true,
    bilateral_pure: true,
    checklist: true
  });

  // Selector de paleta de color abierto para un canal específico
  const [colorPickerTarget, setColorPickerTarget] = useState(null); // 'reaction' | 'memory' | ...

  // Si cambia el filtro exterior a un test específico, ajustar líneas visibles
  useEffect(() => {
    if (activeFilter && activeFilter !== 'general') {
      setActiveLines({
        reaction: activeFilter === 'reaction',
        memory: activeFilter === 'memory',
        single_face: activeFilter === 'single_face',
        bilateral_pure: activeFilter === 'bilateral_pure',
        checklist: activeFilter === 'checklist'
      });
    } else if (activeFilter === 'general') {
      setActiveLines({
        reaction: true,
        memory: true,
        single_face: true,
        bilateral_pure: true,
        checklist: true
      });
    }
  }, [activeFilter]);

  // Cambiar color de una línea y persistir
  const handleAssignColor = (testKey, hexColor) => {
    const updated = { ...lineColors, [testKey]: hexColor };
    setLineColors(updated);
    setColorPickerTarget(null);
    try {
      localStorage.setItem('cognimirror_user_line_colors', JSON.stringify(updated));
    } catch (_) {}
    if (onColorChange) onColorChange(testKey, hexColor);
  };

  // Alternar visibilidad de una línea
  const toggleLineVisibility = (testKey) => {
    setActiveLines(prev => ({
      ...prev,
      [testKey]: !prev[testKey]
    }));
  };

  // Cargar Checklists del estudiante desde localStorage y unirlos
  const studentCheckins = useMemo(() => {
    try {
      const stored = localStorage.getItem('cognimirror_daily_checkins');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(c => 
            c.studentId === student?.id || 
            c.studentId === student?.idSujeto ||
            c.id_paciente === student?.id ||
            c.id_sujeto === student?.idSujeto
          );
        }
      }
    } catch (_) {}
    return [];
  }, [student]);

  // Procesar series temporales consolidadas
  const { chartData, badges, totalSessionsCount } = useMemo(() => {
    const rawSessions = [...(student?.sessions || [])];
    const totalSessionsCount = rawSessions.length + studentCheckins.length;

    if (totalSessionsCount === 0) {
      return { chartData: [], badges: [], totalSessionsCount: 0 };
    }

    // Ordenar cronológicamente todas las sesiones del alumno
    const sortedSessions = rawSessions.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    // Si tiene sesiones, construir puntos de tiempo
    const pointsMap = new Map();

    sortedSessions.forEach((s, idx) => {
      const d = s.date ? new Date(s.date) : new Date();
      const dateKey = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
      const attemptName = idx === 0 ? 'Línea Base' : `Eval ${idx + 1}`;

      // Detectar tipo de test
      let testType = s.testType || 'reaction';
      const label = (s.clinicalLabel || '').toLowerCase();
      const mode = (s.gameMode || '').toLowerCase();

      if (testType === 'memory' || /memory|simon|corsi/i.test(label)) {
        testType = 'memory';
      } else if (mode === 'single_face' || /single_face|go\/no-go|inhibitorio/i.test(label)) {
        testType = 'single_face';
      } else if (mode === 'bilateral_pure' || /bilateral/i.test(label)) {
        testType = 'bilateral_pure';
      } else {
        testType = 'reaction';
      }

      // Extraer métricas clave
      const avg = Math.round(
        (s.stats?.tiempo_promedio_por_mano?.L + s.stats?.tiempo_promedio_por_mano?.R) / 2
      ) || s.stats?.averageReactionTime || s.stats?.tiempo_total || 420;

      const metrics = analyzeData(s.rawTurnsData || []);

      if (!pointsMap.has(dateKey)) {
        pointsMap.set(dateKey, {
          name: attemptName,
          fullDate: d.toLocaleDateString(),
          timestamp: d.getTime(),
          rt_reaction: null,
          rt_memory: null,
          rt_gonogo: null,
          rt_bilateral: null,
          score_checklist: null,
          stdDev: metrics.stdDev || s.stats?.sdReactionTime || 40,
          falseStarts: metrics.falseStartCount || s.stats?.nogoFails || 0,
          omissions: metrics.omissionCount || 0
        });
      }

      const point = pointsMap.get(dateKey);
      if (testType === 'reaction') point.rt_reaction = avg;
      if (testType === 'memory') point.rt_memory = avg;
      if (testType === 'single_face') point.rt_gonogo = avg;
      if (testType === 'bilateral_pure') point.rt_bilateral = avg;
    });

    // Integrar datos del Checklist conductual si existen
    studentCheckins.forEach((c, cIdx) => {
      const d = c.date ? new Date(c.date) : new Date();
      const dateKey = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });

      // Calcular score de regulación del checklist (0 - 100)
      let regScore = 80;
      if (c.regulacion === 'verde') regScore = 95;
      else if (c.regulacion === 'amarillo') regScore = 75;
      else if (c.regulacion === 'azul') regScore = 55;
      else if (c.regulacion === 'rojo') regScore = 35;

      // Factor atención
      if (c.atencion === 'enfocado') regScore = Math.min(100, regScore + 5);
      if (c.atencion === 'disperso') regScore = Math.max(20, regScore - 10);
      if (c.atencion === 'hiperactivo') regScore = Math.max(20, regScore - 10);

      if (!pointsMap.has(dateKey)) {
        pointsMap.set(dateKey, {
          name: `Check ${cIdx + 1}`,
          fullDate: d.toLocaleDateString(),
          timestamp: d.getTime(),
          rt_reaction: null,
          rt_memory: null,
          rt_gonogo: null,
          rt_bilateral: null,
          score_checklist: regScore,
          stdDev: 30,
          falseStarts: 0,
          omissions: 0
        });
      } else {
        pointsMap.get(dateKey).score_checklist = regScore;
      }
    });

    // Convertir mapa a array ordenado
    const chartData = Array.from(pointsMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Si solo hay un punto pero queremos trazar proyección visual
    if (chartData.length === 1) {
      const p = chartData[0];
      // Mantener el punto único para rendering
    }

    // Badges clínicos de evolución
    const badges = [];
    if (chartData.length >= 2) {
      const first = chartData[0];
      const last = chartData[chartData.length - 1];

      if (first.rt_reaction && last.rt_reaction) {
        const delta = first.rt_reaction - last.rt_reaction;
        if (delta > 20) {
          badges.push({
            type: 'success',
            text: `Velocidad atencional mejorada en ${Math.round(delta)} ms respecto a la Línea Base.`,
            icon: <ShieldCheck size={18} className="text-emerald-400" />
          });
        }
      }

      if (last.score_checklist !== null) {
        badges.push({
          type: last.score_checklist >= 70 ? 'success' : 'warning',
          text: `Índice de Regulación Conductual actual: ${last.score_checklist}% (${last.score_checklist >= 70 ? 'Foco Estable' : 'Requiere Apoyo'}).`,
          icon: <Activity size={18} className={last.score_checklist >= 70 ? 'text-emerald-400' : 'text-amber-400'} />
        });
      }
    }

    return { chartData, badges, totalSessionsCount };
  }, [student, studentCheckins]);

  // Si no hay datos, renderizar estado amigable con botón de inicio
  if (totalSessionsCount === 0) {
    return (
      <div className={`bg-[#0d1017] p-8 flex flex-col items-center justify-center text-center ${hideHeader ? 'min-h-[420px] rounded-3xl' : 'min-h-screen'}`}>
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">
          Sin Evaluaciones Registradas
        </h3>
        <p className="text-slate-400 max-w-md text-xs leading-relaxed mb-6">
          El estudiante aún no cuenta con sesiones de prueba o checklist conductual. Realiza su primera prueba para establecer la <strong className="text-indigo-300">Línea Base</strong> de evolución.
        </p>

        {onBack && !hideHeader && (
          <button 
            onClick={onBack} 
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
          >
            Volver al Expediente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-[#0d1017] text-slate-200 font-sans p-4 md:p-6 rounded-3xl space-y-6 ${hideHeader ? '' : 'min-h-screen'}`}>
      {/* ── HEADER DE CONTROL MULTI-LÍNEA Y ASIGNACIÓN DE COLOR ── */}
      <div className="bg-[#121622] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className="text-sm font-black text-white tracking-wide uppercase">
                Panel de Evolución Multidimensional Combinada
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Activa o combina las líneas en el gráfico y haz clic en la muestra de color para personalizar su trazado.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              Puntos: <strong className="text-white">{chartData.length}</strong>
            </span>
          </div>
        </div>

        {/* ── BARRA DE SELECCIÓN Y ASIGNACIÓN DE COLOR POR PRUEBA ── */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          {Object.entries(DEFAULT_TEST_CONFIGS).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isVisible = Boolean(activeLines[key]);
            const currentColor = lineColors[key] || cfg.defaultColor;

            return (
              <div 
                key={key}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all relative ${
                  isVisible 
                    ? 'bg-white/10 border-white/20 text-white shadow-sm' 
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300'
                }`}
              >
                {/* Checkbox de activación de línea */}
                <button
                  type="button"
                  onClick={() => toggleLineVisibility(key)}
                  className="flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                  title={isVisible ? `Ocultar línea de ${cfg.name}` : `Mostrar línea de ${cfg.name}`}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: isVisible ? currentColor : undefined }} />
                  <span>{cfg.shortName}</span>
                </button>

                {/* Muestra interactiva de color para reasignar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setColorPickerTarget(colorPickerTarget === key ? null : key);
                  }}
                  className="w-4 h-4 rounded-full border border-white/40 shadow-sm cursor-pointer hover:scale-125 transition-transform shrink-0"
                  style={{ backgroundColor: currentColor }}
                  title={`Asignar nuevo color a ${cfg.name}`}
                />

                {/* Popover con Paleta de 8 Colores */}
                {colorPickerTarget === key && (
                  <div className="absolute top-full mt-2 left-0 z-50 bg-[#161a29] border border-white/20 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 min-w-[200px]">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                      <span className="text-[10px] font-black uppercase text-slate-300 flex items-center gap-1">
                        <Palette className="w-3 h-3 text-purple-400" />
                        Color: {cfg.shortName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setColorPickerTarget(null)}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {AVAILABLE_COLORS.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => handleAssignColor(key, c.hex)}
                          className="w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer relative"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {currentColor.toLowerCase() === c.hex.toLowerCase() && (
                            <Check className="w-4 h-4 text-black drop-shadow-md stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BADGES CLÍNICOS SI EXISTEN ── */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {badges.map((b, i) => (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              key={i} 
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-sm ${
                b.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {b.icon}
              <span>{b.text}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── GRÁFICO 1: EVOLUCIÓN MULTIDIMENSIONAL COMBINADA ── */}
      <div className="bg-[#11141e] rounded-2xl p-6 shadow-xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <TrendingUp className="text-cyan-400 w-4 h-4" />
              <span>Curva Evolutiva Comparativa (Líneas Multitest)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Superposición longitudinal de Reaction, Memory, Go/No-Go, Bilateral y Checklist.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Eje Y: Latencia (ms) / Score (%)</span>
          </div>
        </div>

        <div className="h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} fontBold="700" />
              <YAxis stroke="#ffffff60" fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0c101a', 
                  border: '1px solid rgba(255,255,255,0.15)', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  fontSize: '11px',
                  color: '#fff'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {/* Línea 1: Reaction Mirror */}
              {activeLines.reaction && (
                <Line 
                  type="monotone" 
                  dataKey="rt_reaction" 
                  name="Reaction Mirror (ms)" 
                  stroke={lineColors.reaction || '#06b6d4'} 
                  strokeWidth={3} 
                  activeDot={{ r: 7 }} 
                  dot={{ r: 4 }}
                  connectNulls={true}
                />
              )}

              {/* Línea 2: Memory Mirror */}
              {activeLines.memory && (
                <Line 
                  type="monotone" 
                  dataKey="rt_memory" 
                  name="Memory Mirror (ms)" 
                  stroke={lineColors.memory || '#a855f7'} 
                  strokeWidth={3} 
                  activeDot={{ r: 7 }} 
                  dot={{ r: 4 }}
                  connectNulls={true}
                />
              )}

              {/* Línea 3: Go / No-Go */}
              {activeLines.single_face && (
                <Line 
                  type="monotone" 
                  dataKey="rt_gonogo" 
                  name="Control Inhibitorio (ms)" 
                  stroke={lineColors.single_face || '#ef4444'} 
                  strokeWidth={3} 
                  activeDot={{ r: 7 }} 
                  dot={{ r: 4 }}
                  connectNulls={true}
                />
              )}

              {/* Línea 4: Bilateralidad */}
              {activeLines.bilateral_pure && (
                <Line 
                  type="monotone" 
                  dataKey="rt_bilateral" 
                  name="Coordinación Bimanual (ms)" 
                  stroke={lineColors.bilateral_pure || '#10b981'} 
                  strokeWidth={3} 
                  activeDot={{ r: 7 }} 
                  dot={{ r: 4 }}
                  connectNulls={true}
                />
              )}

              {/* Línea 5: Checklist Conductual */}
              {activeLines.checklist && (
                <Line 
                  type="monotone" 
                  dataKey="score_checklist" 
                  name="Checklist Regulación (%)" 
                  stroke={lineColors.checklist || '#f59e0b'} 
                  strokeWidth={2.5} 
                  strokeDasharray="4 4"
                  activeDot={{ r: 7 }} 
                  dot={{ r: 4 }}
                  connectNulls={true}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── GRÁFICO 2: AUTORREGULACIÓN, IMPULSIVIDAD Y OMISIONES ── */}
      <div className="bg-[#11141e] rounded-2xl p-6 shadow-xl border border-white/10">
        <h3 className="text-base font-black text-white flex items-center gap-2 mb-2">
          <Crosshair className="text-red-400 w-4 h-4" />
          <span>Freno Inhibitorio y Errores de Impulsividad</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Compara los falsos inicios (comisiones en No-Go) frente a omisiones temporales a lo largo de las sesiones.
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} />
              <YAxis stroke="#ffffff60" fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0c101a', 
                  border: '1px solid rgba(255,255,255,0.15)', 
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="falseStarts" name="Falsos Inicios (Comisiones)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="omissions" name="Omisiones (Desconexión Atencional)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
