import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Activity, Crosshair, ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyzeData } from '../utils/analytics';

export default function StudentEvolutionDashboard({ patient: student, onBack, hideHeader = false }) {
  const { data, badges } = useMemo(() => {
    const validSessions = [...(student.sessions || [])]
      .filter(s => s.attemptNumber >= 2)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);

    if (validSessions.length === 0) return { data: [], badges: [] };

    const processed = validSessions.map(session => {
      const metrics = analyzeData(session.rawTurnsData || []);
      const avg = Math.round((session.stats?.tiempo_promedio_por_mano?.L + session.stats?.tiempo_promedio_por_mano?.R) / 2) || session.stats?.averageReactionTime || 0;
      
      return {
        attempt: session.attemptNumber,
        name: session.attemptNumber === 2 ? 'Línea Base' : `Evaluación ${session.attemptNumber}`,
        date: session.date,
        avgTotal: avg,
        stdDev: metrics.stdDev || 0,
        falseStarts: metrics.falseStartCount || 0,
        omissions: metrics.omissionCount || 0,
        avgLeft: metrics.avgLeft || 0,
        avgRight: metrics.avgRight || 0,
        fatigue: metrics.fatiguePercent || 0,
      };
    });

    const base = processed.find(p => p.attempt === 2);
    const latest = processed[processed.length - 1];
    const generatedBadges = [];

    if (base && latest && processed.length > 1) {
      // Badge: Impulsividad (Falsos + Omisiones)
      const baseImpulsivity = base.falseStarts + base.omissions;
      const latestImpulsivity = latest.falseStarts + latest.omissions;
      if (latestImpulsivity < baseImpulsivity) {
        const impPct = Math.round(((baseImpulsivity - latestImpulsivity) / baseImpulsivity) * 100);
        generatedBadges.push({
          type: 'success',
          text: `La impulsividad se ha reducido un ${impPct}% desde la Línea Base.`,
          icon: <ShieldCheck size={18} className="text-emerald-500" />
        });
      } else if (latestImpulsivity > baseImpulsivity + 2) {
        generatedBadges.push({
          type: 'warning',
          text: `Alerta: Los errores por impulsividad aumentaron comparados con la Línea Base.`,
          icon: <ShieldAlert size={18} className="text-amber-500" />
        });
      }

      // Badge: Asimetría Motriz
      const baseAsym = Math.abs(base.avgLeft - base.avgRight);
      const latestAsym = Math.abs(latest.avgLeft - latest.avgRight);
      if (latestAsym < baseAsym - 20) {
        generatedBadges.push({
          type: 'success',
          text: `La asimetría motriz ha mejorado, reduciéndose en ${Math.round(baseAsym - latestAsym)}ms.`,
          icon: <ShieldCheck size={18} className="text-emerald-500" />
        });
      }

      // Badge: Fatiga
      if (latest.fatigue > base.fatigue + 10) {
        generatedBadges.push({
          type: 'warning',
          text: `Alerta: La fatiga cognitiva aumentó en la última sesión (${latest.fatigue}% caída).`,
          icon: <ShieldAlert size={18} className="text-amber-500" />
        });
      } else if (latest.fatigue < base.fatigue - 10) {
        generatedBadges.push({
          type: 'success',
          text: `Mejoró la tolerancia a la frustración. La fatiga cayó de ${base.fatigue}% a ${latest.fatigue}%.`,
          icon: <ShieldCheck size={18} className="text-emerald-500" />
        });
      }
    }

    return { data: processed, badges: generatedBadges };
  }, [student]);

  if (data.length === 0) {
    return (
      <div className={`bg-[#13161e] p-8 flex flex-col items-center justify-center ${hideHeader ? 'min-h-[400px] rounded-3xl' : 'min-h-screen'}`}>
        <h2 className="text-2xl font-black text-white mb-4">No hay datos suficientes</h2>
        <p className="text-slate-500 mb-6 text-center text-sm">El estudiante debe completar al menos el Ensayo 2 (Línea Base) para poder visualizar su evolución longitudinal.</p>
        {!hideHeader && (
          <button onClick={onBack} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition cursor-pointer">
            Volver
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-[#13161e] text-slate-200 font-sans p-4 md:p-8 ${hideHeader ? 'rounded-3xl' : 'min-h-screen'}`}>
      {!hideHeader && (
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold mb-2 transition-colors cursor-pointer">
              <ArrowLeft size={16} /> Volver al Historial
            </button>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Evolución Cognitiva
            </h1>
            <p className="text-slate-400 font-medium mt-1">
              Estudiante: <span className="text-indigo-400 font-bold">{student.name}</span>
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* BADGES */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {badges.map((b, i) => (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                  b.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                } shadow-sm`}
              >
                {b.icon}
                <span className="font-semibold text-sm">{b.text}</span>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-left">
          {/* GRÁFICO 1: Evolución Atencional */}
          <div className="bg-[#0b0c10] rounded-2xl p-6 shadow-sm border border-white/5">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
              <Activity className="text-blue-400" />
              Evolución Atencional (Gráfico Principal)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Muestra la consistencia del alumno. Una desviación estándar baja refleja mayor estabilidad de atención y menor número de micro-lapsus.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: '#13161e', border: '1px solid #333', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="avgTotal" name="Latencia Promedio (ms)" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="stdDev" name="Desviación Estándar (ms)" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 2: Impulsividad y Respuestas Erradas */}
          <div className="bg-[#0b0c10] rounded-2xl p-6 shadow-sm border border-white/5">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
              <Crosshair className="text-red-400" />
              Impulsividad y Control Inhibitorio
            </h3>
            <p className="text-xs text-slate-500 mb-4">Mide la autorregulación. Los falsos inicios representan respuestas impulsivas a estímulos distractores, mientras que las omisiones denotan fallos de atención.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: '#13161e', border: '1px solid #333', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="falseStarts" name="Falsos Inicios (Impulsividad)" fill="#ef4444" />
                  <Bar dataKey="omissions" name="Omisiones (Fallo Atencional)" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
