// CognitiveDashboard.tsx - Dashboard de Análisis Cognitivo
import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Clock, Award, Users, RefreshCw, Gamepad2, RotateCcw, XCircle } from 'lucide-react';
import { cognitiveAnalytics, UserCognitiveMetrics, UserGameAnalysis } from '../../services/cognitiveAnalytics';

interface CognitiveDashboardProps {
  userId: string;
  userName?: string;
}

export const CognitiveDashboard = ({ userId, userName }: CognitiveDashboardProps) => {
  const [metrics, setMetrics] = useState<UserCognitiveMetrics | null>(null);
  const [gameAnalysis, setGameAnalysis] = useState<UserGameAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [userId]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      console.log(' [Dashboard] Cargando métricas para:', userId, userName);
      const [metricsData, gameData] = await Promise.all([
        cognitiveAnalytics.calculateUserMetrics(userId, userName),
        cognitiveAnalytics.getGameSpecificAnalysis(userId, userName)
      ]);
      console.log(' [Dashboard] Métricas cargadas:', metricsData);
      console.log(' [Dashboard] Análisis por juego:', gameData);
      setMetrics(metricsData);
      setGameAnalysis(gameData);
    } catch (error) {
      console.error(' [Dashboard] Error cargando métricas cognitivas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!metrics || metrics.totalSessions === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-semibold mb-2">
          No hay datos suficientes para generar un análisis cognitivo.
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Juega algunas sesiones para ver tu perfil cognitivo.
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
          <p className="text-xs text-gray-600 mb-2">
            <span className="font-semibold">Usuario ID:</span> {userId}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Abre la consola del navegador (F12) para ver los logs de búsqueda.
          </p>
          <button
            onClick={loadMetrics}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refrescar Datos</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panel Resumen */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <span>Panel Cognitivo - {userName || userId}</span>
          </h3>
          <button
            onClick={loadMetrics}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refrescar</span>
          </button>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <p className="text-sm text-gray-600">Sesiones</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{metrics.totalSessions}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <p className="text-sm text-gray-600">Precisión</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{metrics.accuracy.toFixed(1)}%</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-cyan-600" />
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
            </div>
            <p className="text-2xl font-bold text-cyan-600">{(metrics.averageTimeTaken / 1000).toFixed(1)}s</p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-pink-600" />
              <p className="text-sm text-gray-600">Nivel Máximo</p>
            </div>
            <p className="text-2xl font-bold text-pink-600">{metrics.maxLevel}</p>
          </div>
        </div>

        {/* Métricas Secundarias */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Tiempo Total</p>
            <p className="text-lg font-semibold text-gray-700">{formatTime(metrics.totalSessionTime)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Índice Corrección</p>
            <p className="text-lg font-semibold text-gray-700">{metrics.correctionIndex.toFixed(2)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Tasa de Errores</p>
            <p className="text-lg font-semibold text-gray-700">{metrics.mistakeRate.toFixed(1)}%</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Mejora</p>
            <p className={`text-lg font-semibold ${metrics.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.improvementRate >= 0 ? '+' : ''}{metrics.improvementRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Perfil Cognitivo - Radar Chart */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>Perfil Cognitivo</span>
        </h3>
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
          <RadarChart profile={metrics.cognitiveProfile} />

          {/* Barras de Inteligencias */}
          <div className="mt-6 space-y-3">
            <IntelligenceBar
              name="Lógico-Matemática"
              value={metrics.cognitiveProfile.logicalMathematical}
              color="purple"
            />
            <IntelligenceBar
              name="Espacial"
              value={metrics.cognitiveProfile.spatial}
              color="blue"
            />
            <IntelligenceBar
              name="Intrapersonal"
              value={metrics.cognitiveProfile.intrapersonal}
              color="green"
            />
            <IntelligenceBar
              name="Interpersonal"
              value={metrics.cognitiveProfile.interpersonal}
              color="cyan"
            />
            <IntelligenceBar
              name="Atencional"
              value={metrics.cognitiveProfile.attentional}
              color="pink"
            />
          </div>
        </div>
      </div>

      {/* Interpretación */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Interpretación Cognitiva</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Inteligencia Predominante:</span>{' '}
            <span className="text-purple-600 font-bold">{metrics.dominantIntelligence}</span>
          </p>
          {metrics.strengths.length > 0 && (
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Fortalezas:</span>{' '}
              {metrics.strengths.join(', ')}
            </p>
          )}
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">
            {metrics.interpretation}
          </p>
        </div>
      </div>

      {/* Evolución Temporal */}
      {metrics.evolution.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Evolución Temporal</span>
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <EvolutionChart evolution={metrics.evolution} />
          </div>
        </div>
      )}

      {/* Cronograma de Sesiones */}
      {metrics.evolution.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-600" />
            <span>Cronograma de Sesiones</span>
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <SessionTimeline evolution={metrics.evolution} />
          </div>
        </div>
      )}

      {/* Análisis Detallado por Juego */}
      {gameAnalysis && gameAnalysis.gameStats.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Gamepad2 className="w-5 h-5 text-indigo-600" />
            <span>Estadísticas por Juego</span>
          </h3>
          <GameStatsSection gameAnalysis={gameAnalysis} />
        </div>
      )}
    </div>
  );
};

// Componente de Barra de Inteligencia
const IntelligenceBar = ({ name, value, color }: { name: string; value: number; color: string }) => {
  const colorClasses = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    cyan: 'bg-cyan-500',
    pink: 'bg-pink-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <span className="text-sm font-bold text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${colorClasses[color as keyof typeof colorClasses]} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
};

// Componente de Gráfico Radar (Pentágono)
const RadarChart = ({ profile }: { profile: UserCognitiveMetrics['cognitiveProfile'] }) => {
  const size = 300;
  const center = size / 2;
  const radius = size / 2 - 40;

  const points = [
    { name: 'Lógico-Mat.', value: profile.logicalMathematical, angle: -90 },
    { name: 'Espacial', value: profile.spatial, angle: -18 },
    { name: 'Intrapersonal', value: profile.intrapersonal, angle: 54 },
    { name: 'Interpersonal', value: profile.interpersonal, angle: 126 },
    { name: 'Atencional', value: profile.attentional, angle: 198 }
  ];

  const getPoint = (angle: number, distance: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + distance * Math.cos(rad),
      y: center + distance * Math.sin(rad)
    };
  };

  const dataPoints = points.map(p => getPoint(p.angle, (p.value / 100) * radius));
  const pathData = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Círculos de referencia */}
        {[20, 40, 60, 80, 100].map(percent => (
          <circle
            key={percent}
            cx={center}
            cy={center}
            r={(percent / 100) * radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Líneas de ejes */}
        {points.map((p, i) => {
          const end = getPoint(p.angle, radius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#d1d5db"
              strokeWidth="1"
            />
          );
        })}

        {/* Polígono de datos */}
        <path
          d={pathData}
          fill="rgba(147, 51, 234, 0.3)"
          stroke="rgb(147, 51, 234)"
          strokeWidth="2"
        />

        {/* Puntos de datos */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="rgb(147, 51, 234)"
          />
        ))}

        {/* Etiquetas */}
        {points.map((p, i) => {
          const labelPoint = getPoint(p.angle, radius + 25);
          return (
            <text
              key={i}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              className="text-xs font-medium fill-gray-700"
            >
              {p.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// Componente de Gráfico de Evolución
const EvolutionChart = ({ evolution }: { evolution: UserCognitiveMetrics['evolution'] }) => {
  if (evolution.length === 0) return null;

  const maxAccuracy = 100;
  const maxLevel = Math.max(...evolution.map(e => e.level), 10);
  const height = 200;
  const width = Math.min(800, evolution.length * 60);
  const padding = 40;

  const xStep = (width - padding * 2) / (evolution.length - 1 || 1);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height + 60} className="overflow-visible">
        {/* Eje Y - Accuracy */}
        <line x1={padding} y1={padding} x2={padding} y2={height} stroke="#d1d5db" strokeWidth="2" />
        <text x={10} y={padding - 10} className="text-xs fill-gray-600">100%</text>
        <text x={10} y={height} className="text-xs fill-gray-600">0%</text>

        {/* Línea de Accuracy */}
        {evolution.map((e, i) => {
          if (i === 0) return null;
          const prev = evolution[i - 1];
          return (
            <line
              key={`accuracy-${i}`}
              x1={padding + (i - 1) * xStep}
              y1={height - (prev.accuracy / maxAccuracy) * (height - padding)}
              x2={padding + i * xStep}
              y2={height - (e.accuracy / maxAccuracy) * (height - padding)}
              stroke="rgb(34, 197, 94)"
              strokeWidth="3"
            />
          );
        })}

        {/* Puntos de Accuracy */}
        {evolution.map((e, i) => (
          <circle
            key={`point-accuracy-${i}`}
            cx={padding + i * xStep}
            cy={height - (e.accuracy / maxAccuracy) * (height - padding)}
            r="5"
            fill="rgb(34, 197, 94)"
          />
        ))}

        {/* Línea de Nivel */}
        {evolution.map((e, i) => {
          if (i === 0) return null;
          const prev = evolution[i - 1];
          return (
            <line
              key={`level-${i}`}
              x1={padding + (i - 1) * xStep}
              y1={height - (prev.level / maxLevel) * (height - padding)}
              x2={padding + i * xStep}
              y2={height - (e.level / maxLevel) * (height - padding)}
              stroke="rgb(147, 51, 234)"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Puntos de Nivel */}
        {evolution.map((e, i) => (
          <circle
            key={`point-level-${i}`}
            cx={padding + i * xStep}
            cy={height - (e.level / maxLevel) * (height - padding)}
            r="5"
            fill="rgb(147, 51, 234)"
          />
        ))}

        {/* Etiquetas de fechas */}
        {evolution.map((e, i) => (
          <text
            key={`date-${i}`}
            x={padding + i * xStep}
            y={height + 20}
            textAnchor="middle"
            className="text-xs fill-gray-600"
            transform={`rotate(-45, ${padding + i * xStep}, ${height + 20})`}
          >
            {e.date}
          </text>
        ))}

        {/* Leyenda */}
        <g transform={`translate(${width - 150}, 20)`}>
          <line x1={0} y1={0} x2={20} y2={0} stroke="rgb(34, 197, 94)" strokeWidth="3" />
          <text x={25} y={5} className="text-xs fill-gray-700">Precisión</text>

          <line x1={0} y1={20} x2={20} y2={20} stroke="rgb(147, 51, 234)" strokeWidth="3" strokeDasharray="5,5" />
          <text x={25} y={25} className="text-xs fill-gray-700">Nivel</text>
        </g>
      </svg>
    </div>
  );
};

// Componente de Cronograma de Sesiones
export const SessionTimeline = ({ evolution }: { evolution: UserCognitiveMetrics['evolution'] }) => {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {evolution.map((session, index) => (
        <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-shrink-0 w-24 text-sm text-gray-600">
            {session.date}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Nivel {session.level}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                  {session.gameName || 'Juego'}
                </span>
              </div>
              <span className="text-sm text-gray-600">{session.accuracy.toFixed(1)}% precisión</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                style={{ width: `${session.accuracy}%` }}
              ></div>
            </div>
          </div>
          <div className="flex-shrink-0 text-sm text-gray-500">
            {(session.sessionDuration / 60000).toFixed(0)}min
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente de Estadísticas por Juego
export const GameStatsSection = ({ gameAnalysis }: { gameAnalysis: UserGameAnalysis }) => {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumen General */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600 mb-1">Juegos Diferentes</p>
            <p className="text-2xl font-bold text-indigo-600">{gameAnalysis.totalGamesPlayed}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Juego Favorito</p>
            <p className="text-lg font-bold text-purple-600">{gameAnalysis.favoriteGame}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Tiempo Total</p>
            <p className="text-2xl font-bold text-pink-600">{formatTime(gameAnalysis.totalPlayTime)}</p>
          </div>
        </div>
      </div>

      {/* Estadísticas por Juego Individual */}
      {gameAnalysis.gameStats.map((game, index) => (
        <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{game.gameName}</h4>
                <p className="text-xs text-gray-500">Última vez: {game.lastPlayed}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">{game.totalSessions}</p>
              <p className="text-xs text-gray-500">sesiones</p>
            </div>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Rondas Jugadas</p>
              <p className="text-xl font-bold text-blue-600">{game.totalRoundsPlayed}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Ronda Máxima</p>
              <p className="text-xl font-bold text-green-600">{game.maxRoundReached}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center space-x-1 mb-1">
                <XCircle className="w-3 h-3 text-gray-600" />
                <p className="text-xs text-gray-600">Errores</p>
              </div>
              <p className="text-xl font-bold text-red-600">{game.totalMistakes}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center space-x-1 mb-1">
                <RotateCcw className="w-3 h-3 text-gray-600" />
                <p className="text-xs text-gray-600">Reintentos</p>
              </div>
              <p className="text-xl font-bold text-purple-600">{game.retryCount}</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Tiempo Total</p>
              <p className="text-lg font-bold text-pink-600">{formatTime(game.totalPlayTime)}</p>
            </div>
          </div>

          {/* Métricas Secundarias */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">Promedio Rondas/Sesión</p>
              <p className="text-sm font-semibold text-gray-700">{game.averageRoundsPerSession.toFixed(1)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">Tasa de Completación</p>
              <p className="text-sm font-semibold text-gray-700">{game.completionRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Historial de Sesiones */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-2">
              <span>Ver historial de sesiones ({game.sessions.length})</span>
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {game.sessions.map((session, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                  <span className="text-gray-600 w-20">{session.date}</span>
                  <span className="font-medium text-gray-700">{session.roundsPlayed} rondas</span>
                  <span className="text-gray-600">Nivel {session.maxRound}</span>
                  <span className="text-red-600 font-semibold">{session.mistakes} errores</span>
                  <span className="text-gray-500">{formatTime(session.duration)}</span>
                  {session.completed && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      ✓ Completado
                    </span>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
};