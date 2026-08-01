import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Award, Clock, Target, TrendingUp } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../data/firebase';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

interface SessionEvent {
  type: string;
  timestamp: string;
  [key: string]: any;
}

interface SessionRound {
  level: number;
  isCorrect: boolean;
  timeTaken: number;
  [key: string]: any;
}

interface Session {
  id: string;
  userId: string;
  metrics?: {
    maxSpan?: number;
    errorRate?: number;
    [key: string]: any;
  };
  events?: SessionEvent[];
  roundsData?: SessionRound[];
  startTime?: string;
  endTime?: string;
}

interface ProcessedMetrics {
  maxSpan: number;
  errorRate: number;
  averageReactionTime: number;
  averagePersistenceTime: number;
  levelStats: Record<number, LevelStats>;
}

interface LevelStats {
  attempts: number;
  correct: number;
  totalTime: number;
}

const defaultMetrics: ProcessedMetrics = {
  maxSpan: 0,
  errorRate: 0,
  averageReactionTime: 0,
  averagePersistenceTime: 0,
  levelStats: {}
};

async function getUserSessions(userId: string): Promise<Session[]> {
  console.log('Firebase: Iniciando consulta para userId:', userId);
  const sessionsRef = collection(db, 'sessions');
  const q = query(sessionsRef, where('userId', '==', userId));
  
  try {
    console.log('Firebase: Ejecutando query...');
    const snapshot = await getDocs(q);
    console.log('Firebase: Query completado, documentos encontrados:', snapshot.size);
    
    const sessions: Session[] = [];
    snapshot.forEach((doc) => {
      console.log('Firebase: Procesando documento:', doc.id, 'data:', doc.data());
      sessions.push({ id: doc.id, ...(doc.data() as Omit<Session, 'id'>) });
    });

    return sessions;
  } catch (error) {
    console.error('Firebase: Error en consulta:', error);
    throw error;
  }
}

function extractReactionTimes(events: SessionEvent[] = []): number[] {
  const times: number[] = [];
  let lastSequenceStart: number | null = null;

  events.forEach((event) => {
    if (event.type === 'sequence_start') {
      lastSequenceStart = Date.parse(event.timestamp);
    }
    if (event.type === 'user_input' && lastSequenceStart) {
      const current = Date.parse(event.timestamp);
      times.push(current - lastSequenceStart);
      lastSequenceStart = null;
    }
  });

  return times;
}

function extractPersistenceTimes(events: SessionEvent[] = []): number[] {
  const times: number[] = [];
  let lastMistake: number | null = null;

  events.forEach((event) => {
    if (event.type === 'mistake') {
      lastMistake = Date.parse(event.timestamp);
    }
    if (event.type === 'user_input' && lastMistake) {
      const current = Date.parse(event.timestamp);
      times.push(current - lastMistake);
      lastMistake = null;
    }
  });

  return times;
}

function aggregateLevelStats(rounds: SessionRound[] = []): Record<number, LevelStats> {
  return rounds.reduce<Record<number, LevelStats>>((acc, round) => {
    const { level, isCorrect, timeTaken = 0 } = round;
    if (!acc[level]) {
      acc[level] = { attempts: 0, correct: 0, totalTime: 0 };
    }

    acc[level].attempts += 1;
    acc[level].totalTime += timeTaken;
    if (isCorrect) {
      acc[level].correct += 1;
    }

    return acc;
  }, {});
}

function formatMs(ms: number): string {
  if (ms <= 0) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export const Dashboard = ({ onNavigate }: DashboardPageProps) => {
  const { currentUser, selectedPatient } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [metrics, setMetrics] = useState<ProcessedMetrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeUserId = currentUser?.id || selectedPatient?.id;

  useEffect(() => {
    const loadSessions = async () => {
      console.log('Dashboard: Estado de autenticación:', {
        currentUser: currentUser ? { id: currentUser.id, name: currentUser.name } : null,
        selectedPatient: selectedPatient ? { id: selectedPatient.id, name: selectedPatient.name } : null,
        activeUserId
      });

      if (!activeUserId) {
        setError('No hay un usuario activo seleccionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Dashboard: Cargando sesiones para userId:', activeUserId);
        const userSessions = await getUserSessions(activeUserId);
        console.log('Dashboard: Sesiones obtenidas:', userSessions.length, userSessions);

        setSessions(userSessions);

        if (userSessions.length === 0) {
          setMetrics(defaultMetrics);
          setLoading(false);
          return;
        }

        const allReactionTimes = userSessions.flatMap((session) =>
          extractReactionTimes(session.events)
        );

        const allPersistenceTimes = userSessions.flatMap((session) =>
          extractPersistenceTimes(session.events)
        );

        const levelStats = userSessions.reduce<Record<number, LevelStats>>((acc, session) => {
          const perSession = aggregateLevelStats(session.roundsData);
          Object.entries(perSession).forEach(([level, stats]) => {
            const numericLevel = Number(level);
            if (!acc[numericLevel]) {
              acc[numericLevel] = { attempts: 0, correct: 0, totalTime: 0 };
            }

            acc[numericLevel].attempts += stats.attempts;
            acc[numericLevel].correct += stats.correct;
            acc[numericLevel].totalTime += stats.totalTime;
          });
          return acc;
        }, {});

        setMetrics({
          maxSpan: Math.max(...userSessions.map((s) => s.metrics?.maxSpan || 0), 0),
          errorRate:
            userSessions.length > 0
              ? userSessions.reduce((sum, s) => sum + (s.metrics?.errorRate || 0), 0) /
                userSessions.length
              : 0,
          averageReactionTime:
            allReactionTimes.length > 0
              ? allReactionTimes.reduce((sum, value) => sum + value, 0) / allReactionTimes.length
              : 0,
          averagePersistenceTime:
            allPersistenceTimes.length > 0
              ? allPersistenceTimes.reduce((sum, value) => sum + value, 0) / allPersistenceTimes.length
              : 0,
          levelStats
        });

        setLoading(false);
      } catch (err) {
        console.error('Error cargando sesiones:', err);
        console.error('Error details:', {
          userId: activeUserId,
          errorMessage: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });
        setError('No se pudieron cargar las sesiones desde Firebase');
        setLoading(false);
      }
    };

    loadSessions();
  }, [activeUserId]);

  const totalAttempts = useMemo(
    () => Object.values(metrics.levelStats).reduce((sum, stats) => sum + stats.attempts, 0),
    [metrics.levelStats]
  );

  const successfulAttempts = useMemo(
    () => Object.values(metrics.levelStats).reduce((sum, stats) => sum + stats.correct, 0),
    [metrics.levelStats]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Cargando dashboard cognitivo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <p className="text-lg text-red-600 font-semibold mb-2">{error}</p>
        <p className="text-sm text-gray-600 mb-6">Verifica tu conexión o intenta nuevamente.</p>
        <button
          onClick={() => onNavigate('patient-profile')}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Volver al perfil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('patient-profile')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div>
            <p className="text-sm text-gray-500">Panel de análisis avanzado</p>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Cognitivo</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            label="Sesiones Registradas"
            value={sessions.length}
            icon={<Target className="w-6 h-6 text-blue-600" />}
          />
          <SummaryCard
            label="Intentos Exitosos"
            value={`${successfulAttempts}/${totalAttempts}`}
            icon={<Award className="w-6 h-6 text-green-600" />}
          />
          <SummaryCard
            label="Tiempo de reacción"
            value={formatMs(metrics.averageReactionTime)}
            icon={<Clock className="w-6 h-6 text-amber-600" />}
          />
          <SummaryCard
            label="Nivel máximo"
            value={metrics.maxSpan}
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Evolución de errores</h2>
            <div className="space-y-3">
              {sessions.slice(-5).map((session) => (
                <div key={session.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(session.startTime || '').toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">Sesión #{session.id.slice(-4)}</p>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">
                    {((1 - (session.metrics?.errorRate || 0)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-sm text-gray-500 text-center">Aún no hay sesiones registradas.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Persistencia</h2>
            <p className="text-4xl font-bold text-gray-900">
              {formatMs(metrics.averagePersistenceTime)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Tiempo promedio que tarda en corregir un error desde que ocurre hasta que vuelve a intentarlo.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Desempeño por nivel</h2>
            <p className="text-sm text-gray-500">Intentos agregados por nivel alcanzado</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intentos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aciertos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasa de éxito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiempo promedio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(metrics.levelStats).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                      Aún no hay rondas registradas.
                    </td>
                  </tr>
                )}
                {Object.entries(metrics.levelStats)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([level, stats]) => {
                    const successRate = stats.attempts > 0 ? stats.correct / stats.attempts : 0;
                    const avgTime = stats.attempts > 0 ? stats.totalTime / stats.attempts : 0;
                    return (
                      <tr key={level} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Nivel {level}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{stats.attempts}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{stats.correct}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              successRate >= 0.7
                                ? 'bg-green-100 text-green-700'
                                : successRate >= 0.4
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {(successRate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{formatMs(avgTime)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function SummaryCard({
  label,
  value,
  icon
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">{icon}</div>
    </div>
  );
}

export default Dashboard;