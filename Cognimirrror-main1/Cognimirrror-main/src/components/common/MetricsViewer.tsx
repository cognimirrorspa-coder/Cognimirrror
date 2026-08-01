// MetricsViewer.tsx - Visualizador de Métricas de Tiempo
import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Award, BarChart3, X, Brain, Activity } from 'lucide-react';
import { metrics } from '../../services/metrics';
import { ExportMetrics } from './ExportMetrics';
import { CognitiveDashboard } from './CognitiveDashboard';

interface MetricsViewerProps {
  onClose: () => void;
  userId?: string;
  userName?: string;
}

export const MetricsViewer = ({ onClose, userId, userName }: MetricsViewerProps) => {
  const [stats, setStats] = useState<any>(null);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [rubikStats, setRubikStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'cognitive'>('basic');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const sessionStats = metrics.getSessionStats();
    const memoryMirrorStats = metrics.getGameStats('memory_mirror');
    const rubikMirrorStats = metrics.getGameStats('strategy_mirror_rubik');
    
    setStats(sessionStats);
    setMemoryStats(memoryMirrorStats);
    setRubikStats(rubikMirrorStats);
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

  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <p className="text-gray-700">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Métricas de Uso</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-purple-100 mt-2">
            Análisis detallado de tu tiempo en CogniMirror
          </p>
          
          {/* Tabs */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'basic'
                  ? 'bg-white text-purple-600 font-semibold'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Métricas Básicas</span>
            </button>
            <button
              onClick={() => setActiveTab('cognitive')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'cognitive'
                  ? 'bg-white text-purple-600 font-semibold'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Análisis Cognitivo</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Dashboard Cognitivo */}
          {activeTab === 'cognitive' && userId && (
            <CognitiveDashboard userId={userId} userName={userName} />
          )}
          
          {/* Métricas Básicas */}
          {activeTab === 'basic' && (
            <>
              {/* Resumen General */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Clock className="w-6 h-6 text-purple-600" />
                  <span>Resumen General</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Total de Sesiones</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalSessions}</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Tiempo Total</p>
                    <p className="text-3xl font-bold text-cyan-600">{formatTime(stats.totalTime)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Total de Juegos</p>
                    <p className="text-3xl font-bold text-pink-600">{stats.totalGames}</p>
                  </div>
                </div>
              </div>

              {/* Memory Mirror Stats */}
              {memoryStats && memoryStats.totalPlays > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Award className="w-6 h-6 text-cyan-600" />
                    <span>Memory Mirror</span>
                  </h3>
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Partidas Jugadas</p>
                        <p className="text-2xl font-bold text-cyan-600">{memoryStats.totalPlays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tiempo Total</p>
                        <p className="text-2xl font-bold text-cyan-600">{formatTime(memoryStats.totalTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tiempo Promedio</p>
                        <p className="text-2xl font-bold text-cyan-600">{formatTime(memoryStats.averageTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Mejor Nivel</p>
                        <p className="text-2xl font-bold text-cyan-600">{memoryStats.bestLevel || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-cyan-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tasa de Completación</span>
                        <span className="text-lg font-bold text-cyan-600">{memoryStats.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-cyan-200 rounded-full h-3 mt-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${memoryStats.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Strategy Mirror (Rubik) Stats */}
              {rubikStats && rubikStats.totalPlays > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Award className="w-6 h-6 text-pink-600" />
                    <span>Strategy Mirror (Rubik)</span>
                  </h3>
                  <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Partidas Jugadas</p>
                        <p className="text-2xl font-bold text-pink-600">{rubikStats.totalPlays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tiempo Total</p>
                        <p className="text-2xl font-bold text-pink-600">{formatTime(rubikStats.totalTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tiempo Promedio</p>
                        <p className="text-2xl font-bold text-pink-600">{formatTime(rubikStats.averageTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tasa de Completación</p>
                        <p className="text-2xl font-bold text-pink-600">{rubikStats.completionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Distribución por Juego */}
              {stats.totalGames > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <span>Distribución de Juegos</span>
                  </h3>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                    <div className="space-y-3">
                      {Object.entries(stats.gamesByType).map(([gameName, count]: [string, any]) => (
                        <div key={gameName} className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium capitalize">
                            {gameName.replace('_', ' ')}
                          </span>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-green-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                                style={{ width: `${(count / stats.totalGames) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-lg font-bold text-green-600 w-12 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje si no hay datos */}
              {stats.totalSessions === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    Aún no hay métricas registradas. ¡Comienza a jugar para ver tus estadísticas!
                  </p>
                </div>
              )}

              {/* Botones de exportación */}
              {stats.totalSessions > 0 && userId && userName && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Exportar Métricas</h3>
                  <ExportMetrics userId={userId} userName={userName} />
                </div>
              )}

              {/* Botón para limpiar métricas */}
              {stats.totalSessions > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      metrics.clearAllMetrics();
                      loadStats();
                    }}
                    className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors"
                  >
                    Limpiar Todas las Métricas
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
