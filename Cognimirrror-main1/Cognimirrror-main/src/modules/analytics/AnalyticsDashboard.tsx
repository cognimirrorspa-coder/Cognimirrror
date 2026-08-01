import { useEffect, useState } from 'react';
import { Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { useCognitiveMetrics } from './useCognitiveMetrics';
import { db } from '../../data/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

interface Props {
  userId: string;
  userName?: string;
  onNavigate?: (page: string) => void;
}

export function AnalyticsDashboard({ userId, userName, onNavigate }: Props) {
  const { allUsers } = useAuth();
  const nameMap: Record<string, string> = Object.fromEntries(allUsers.map(u => [u.id, u.name]));
  const [uid, setUid] = useState(userId);
  const [gameId, setGameId] = useState<string | undefined>(undefined);

  const { loading, error, metrics, trend, filteredSessionsCount, totalSessions, perGameCounts } = useCognitiveMetrics({ userId: uid, gameId });
  const [userOptions, setUserOptions] = useState<string[]>([]);
  const [gameOptions, setGameOptions] = useState<string[]>([]);

  useEffect(() => {
    setUid(userId);
  }, [userId]);

  // Cargar lista de usuarios
  useEffect(() => {
    let active = true;
    (async () => {
      const snap = await getDocs(collection(db, 'analysisGameSessions'));
      if (!active) return;
      const ids = new Set<string>();
      snap.forEach((d) => {
        const u = (d.data() as any).userId;
        if (u) ids.add(u);
      });
      setUserOptions(Array.from(ids).sort());
    })();
    return () => { active = false; };
  }, []);

  // Cargar juegos por usuario
  useEffect(() => {
    let active = true;
    (async () => {
      if (!uid) { setGameOptions([]); return; }
      const q1 = query(collection(db, 'analysisGameSessions'), where('userId', '==', uid));
      const snap = await getDocs(q1);
      if (!active) return;
      const games = new Set<string>();
      snap.forEach((d) => {
        const g = (d.data() as any).gameId;
        if (g) games.add(g);
      });
      const arr = Array.from(games).sort();
      setGameOptions(arr);
      if (gameId && !arr.includes(gameId)) setGameId(undefined);
    })();
    return () => { active = false; };
  }, [uid]);

  const fluencyPct = (() => {
    const maxTarget = 1200; // escala simple
    const val = Math.max(0, Math.min(metrics?.fluency || 0, maxTarget));
    return Math.round((val / maxTarget) * 100);
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analítica Cognitiva</h1>
            <p className="text-gray-600">{userName || nameMap[uid] || uid}</p>
          </div>
          {onNavigate && (
            <button onClick={() => onNavigate('mirror-hub')} className="px-4 py-2 bg-white hover:bg-gray-100 rounded-lg shadow">
              Volver
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Usuario</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
              >
                {[uid, ...userOptions.filter((u) => u !== uid)].map((u) => (
                  <option key={u} value={u}>{nameMap[u] || u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Juego (opcional)</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={gameId || ''}
                onChange={(e) => setGameId(e.target.value ? e.target.value : undefined)}
              >
                <option value="">Todos</option>
                {gameOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="w-full md:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                onClick={() => {
                  // trigger re-run via state dependencies already bound
                }}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Kpi title="Precisión" value={loading ? '...' : `${(metrics?.accuracy ?? 0).toFixed(1)}%`} />
          <Kpi title="Tiempo prom." value={loading ? '...' : `${((metrics?.avgRT ?? 0) / 1000).toFixed(2)}s`} />
          <Kpi title="Span máx." value={loading ? '...' : `${metrics?.maxSpan ?? 0}`} />
          <Kpi title="Fatiga" value={loading ? '...' : `${(metrics?.fatigue ?? 0).toFixed(2)}`} />
          <Kpi title="Auto-corrección" value={loading ? '...' : `${((metrics?.selfCorrectionRate ?? 0) * 100).toFixed(0)}%`} />
          <Kpi title="Fluidez" value={loading ? '...' : `${(metrics?.fluency ?? 0).toFixed(1)}`} />
          <Kpi title="Puntaje máx." value={loading ? '...' : `${(metrics?.scoreMax ?? 0).toFixed(0)}`} />
          <Kpi title="Puntaje medio" value={loading ? '...' : `${(metrics?.scoreAvg ?? 0).toFixed(1)}`} />
          <Kpi title="Tasa de error" value={loading ? '...' : `${(metrics?.errorRate ?? 0).toFixed(1)}%`} />
          <Kpi title="Reintentos" value={loading ? '...' : `${metrics?.retryCount ?? 0}`} />
        </div>

        {/* Resumen de sesiones */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Kpi title="Sesiones (filtro)" value={`${filteredSessionsCount}`} />
          <Kpi title="Sesiones totales (usuario)" value={`${totalSessions}`} />
          <Kpi title="Juegos distintos" value={`${Object.keys(perGameCounts || {}).length}`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Tendencia: Precisión y Tiempo de Reacción</h3>
            <div className="w-full h-72">
              <ResponsiveContainer>
                <LineChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={false} name="Precisión (%)" />
                  <Line yAxisId="right" type="monotone" dataKey="avgRT" stroke="#3b82f6" strokeWidth={2} dot={false} name="RT (s)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow border border-gray-200 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Fluidez cognitiva</h3>
            <div className="w-full h-64">
              <ResponsiveContainer>
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={[{ name: 'fluency', value: fluencyPct }]}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar dataKey="value" cornerRadius={8} fill="#a855f7" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-10">
              <div className="text-2xl font-bold text-purple-600">{metrics?.fluency?.toFixed(0) ?? 0}</div>
              <div className="text-xs text-gray-500">objetivo 1200</div>
            </div>
          </div>
        </div>

        {/* Partidas por juego */}
        <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Partidas por juego</h3>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <div className="space-y-2">
            {Object.entries(perGameCounts || {}).length === 0 && (
              <p className="text-gray-600 text-sm">Sin datos para este usuario.</p>
            )}
            {Object.entries(perGameCounts || {}).map(([g, c]) => (
              <div key={g} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{g}</span>
                <span className="font-semibold text-gray-900">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Explicación de métricas */}
        <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">¿Qué significa cada métrica?</h3>
          <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
            <li><strong>Precisión</strong>: porcentaje de aciertos sobre el total de intentos. Si existe <code>errorRate</code> en la sesión se usa 100 - errorRate.</li>
            <li><strong>Tiempo de reacción</strong>: promedio de los intervalos entre taps consecutivos dentro de una sesión (en segundos).</li>
            <li><strong>Fluidez cognitiva</strong>: si la sesión trae <code>metrics.cognitiveFluency</code> se usa ese valor; si no, se estima como (Precisión × 10) − (Tiempo de reacción en ms / 100).</li>
            <li><strong>Span máximo</strong>: mayor nivel o span alcanzado según <code>metrics.maxSpan</code> (o nivel derivado).</li>
            <li><strong>Puntaje</strong>: se muestran el <em>máximo</em> y el <em>promedio</em> detectados en <code>metrics.score</code> de las sesiones filtradas.</li>
            <li><strong>Tasa de error</strong>: promedio de <code>errorRate</code> de las sesiones (si no existe, se aproxima como 100 − Precisión).</li>
            <li><strong>Reintentos</strong>: cantidad de repeticiones por juego en el conjunto filtrado (por juego: sesiones − 1) sumado entre juegos.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
