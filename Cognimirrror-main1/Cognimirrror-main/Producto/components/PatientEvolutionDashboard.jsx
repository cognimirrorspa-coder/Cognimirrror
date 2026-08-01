import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Activity, Crosshair, ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyzeData } from '../utils/analytics';

export default function PatientEvolutionDashboard({ patient, onBack, hideHeader = false }) {
  const { data, badges } = useMemo(() => {
    // 1. Filtrar solo sesiones válidas (Intentos >= 2, donde 2 es la línea base)
    const validSessions = [...(patient.sessions || [])]
      .filter(s => s.attemptNumber >= 2)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);

    if (validSessions.length === 0) return { data: [], badges: [] };

    // 2. Procesar datos por sesión
    const processed = validSessions.map(session => {
      const metrics = analyzeData(session.rawTurnsData || []);
      const avg = Math.round((session.stats?.tiempo_promedio_por_mano?.L + session.stats?.tiempo_promedio_por_mano?.R) / 2) || session.stats?.averageReactionTime || 0;
      
      return {
        attempt: session.attemptNumber,
        name: session.attemptNumber === 2 ? 'Línea Base' : `Intento ${session.attemptNumber}`,
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

    // 3. Generar Badges (Comparar Línea Base vs Último Intento)
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
  }, [patient]);

  if (data.length === 0) {
    return (
      <div className={`bg-[#f8fafc] p-8 flex flex-col items-center justify-center ${hideHeader ? 'min-h-[400px] rounded-3xl' : 'min-h-screen'}`}>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">No hay datos suficientes</h2>
        <p className="text-slate-500 mb-6">El paciente debe completar al menos el Intento 2 (Línea Base) para ver la evolución.</p>
        {!hideHeader && (
          <button onClick={onBack} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition">
            Volver
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-[#f8fafc] text-slate-800 font-sans p-4 md:p-8 ${hideHeader ? 'rounded-3xl' : 'min-h-screen'}`}>
      {!hideHeader && (
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold mb-2 transition-colors">
              <ArrowLeft size={16} /> Volver al Historial
            </button>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              Evolución Clínica
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Paciente: <span className="text-indigo-600 font-bold">{patient.name}</span>
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
                  b.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'
                } shadow-sm`}
              >
                {b.icon}
                <span className="font-semibold text-sm">{b.text}</span>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* GRÁFICO 1: Evolución Atencional */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <Activity className="text-blue-500" />
              Evolución Atencional (Gráfico Rey)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Muestra la mejora en consistencia. Si la Desviación baja, significa menos microlapsus de inatención.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#4f46e5'}} axisLine={false} tickLine={false} width={40} />
                  <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#059669'}} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" name="Tiempo Promedio (ms)" dataKey="avgTotal" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" name="Consistencia (SD)" dataKey="stdDev" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 2: Trayectoria de Impulsividad */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <ShieldAlert className="text-rose-500" />
              Trayectoria de Impulsividad
            </h3>
            <p className="text-xs text-slate-500 mb-4">Evalúa el control inhibitorio. Muestra cuántos errores por anticipación (Falsos) u Omisiones ocurrieron por sesión.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Bar dataKey="falseStarts" stackId="a" name="Falsos (Impulsividad)" fill="#ef4444" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="omissions" stackId="a" name="Omisiones (Inatención)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 3: Convergencia Motriz */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <Crosshair className="text-orange-500" />
              Convergencia de Asimetría Motriz
            </h3>
            <p className="text-xs text-slate-500 mb-4">Si las líneas se acercan con el tiempo, el paciente está mejorando su planificación motora cruzada y lateralidad.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Line type="monotone" name="Mano Izquierda (Roja)" dataKey="avgLeft" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                  <Line type="monotone" name="Mano Derecha (Naranja)" dataKey="avgRight" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 4: Batería Cognitiva (Fatiga) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <TrendingUp className="text-purple-500" />
              Batería Cognitiva (Fatiga)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Porcentaje de caída del rendimiento hacia el final de la prueba. Valores más bajos indican mayor resistencia mental.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `${val}%`} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Line type="monotone" name="Curva de Fatiga (%)" dataKey="fatigue" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
