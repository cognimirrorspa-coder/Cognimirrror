// AnalysisHistoryViewer.tsx - Visualizador del Historial de Análisis Cognitivo
import { X, Brain, Clock, Target, Zap, TrendingUp, Calendar } from 'lucide-react';
import { useAnalysisHistory } from '../../context/AnalysisHistoryContext';
import { AnalysisGameSession } from '../../types';

interface AnalysisHistoryViewerProps {
  onClose: () => void;
  userId?: string;
}

export const AnalysisHistoryViewer = ({ onClose, userId }: AnalysisHistoryViewerProps) => {
  const { gameHistory, getSessionsByUser } = useAnalysisHistory();
  
  // Filtrar por usuario si se especifica
  const sessions = userId 
    ? getSessionsByUser(userId)
    : gameHistory;

  // Ordenar por fecha descendente (más reciente primero)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const SessionCard = ({ session }: { session: AnalysisGameSession }) => {
    const { metrics } = session;
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-cyan-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-cyan-600" />
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {session.gameId === 'memory_mirror_v1' ? 'Memory Mirror' : session.gameId}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(session.startTime)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Usuario</p>
            <p className="font-semibold text-gray-900">{session.userName}</p>
          </div>
        </div>

        {/* Métricas Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {/* Max Span */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-cyan-600" />
              <p className="text-xs font-semibold text-cyan-800">Max Span</p>
            </div>
            <p className="text-2xl font-bold text-cyan-700">{metrics.maxSpan}</p>
          </div>

          {/* Tiempo Total */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-800">Duración</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {formatDuration(metrics.totalSessionTime)}
            </p>
          </div>

          {/* Fluidez Cognitiva */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-semibold text-purple-800">Fluidez</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {Math.round(metrics.cognitiveFluency)}ms
            </p>
          </div>

          {/* Auto-Corrección */}
          <div className={`bg-gradient-to-br rounded-lg p-3 ${
            metrics.selfCorrectionIndex > 10 
              ? 'from-green-50 to-green-100' 
              : metrics.selfCorrectionIndex < -10 
              ? 'from-red-50 to-red-100' 
              : 'from-gray-50 to-gray-100'
          }`}>
            <div className="flex items-center space-x-2 mb-1">
              <Brain className={`w-4 h-4 ${
                metrics.selfCorrectionIndex > 10 
                  ? 'text-green-600' 
                  : metrics.selfCorrectionIndex < -10 
                  ? 'text-red-600' 
                  : 'text-gray-600'
              }`} />
              <p className={`text-xs font-semibold ${
                metrics.selfCorrectionIndex > 10 
                  ? 'text-green-800' 
                  : metrics.selfCorrectionIndex < -10 
                  ? 'text-red-800' 
                  : 'text-gray-800'
              }`}>Auto-Corr.</p>
            </div>
            <p className={`text-2xl font-bold ${
              metrics.selfCorrectionIndex > 10 
                ? 'text-green-700' 
                : metrics.selfCorrectionIndex < -10 
                ? 'text-red-700' 
                : 'text-gray-700'
            }`}>
              {metrics.selfCorrectionIndex > 0 ? '+' : ''}{metrics.selfCorrectionIndex.toFixed(1)}%
            </p>
          </div>

          {/* Persistencia */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-800">Persistencia</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{metrics.persistence}</p>
          </div>
        </div>

        {/* Stats secundarias */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200">
          <span>
            Tasa de Error: <strong className="text-red-600">{metrics.errorRate.toFixed(1)}%</strong>
          </span>
          <span>
            Intentos: <strong className="text-gray-900">{metrics.successfulAttempts}/{metrics.totalAttempts}</strong>
          </span>
          <span>
            Rondas: <strong className="text-gray-900">{metrics.roundsData.length}</strong>
          </span>
          <span>
            Taps: <strong className="text-gray-900">{metrics.allTaps.length}</strong>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Historial de Análisis Cognitivo</h2>
              <p className="text-cyan-100 text-sm">Log de Batalla - Todas tus sesiones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Summary */}
        {sessions.length > 0 && (
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Sesiones</p>
                <p className="text-3xl font-bold text-cyan-600">{sessions.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Max Span Promedio</p>
                <p className="text-3xl font-bold text-purple-600">
                  {(sessions.reduce((sum, s) => sum + s.metrics.maxSpan, 0) / sessions.length).toFixed(1)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Fluidez Promedio</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(sessions.reduce((sum, s) => sum + s.metrics.cognitiveFluency, 0) / sessions.length)}ms
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Auto-Corrección</p>
                <p className="text-3xl font-bold text-green-600">
                  {sessions.reduce((sum, s) => sum + s.metrics.selfCorrectionIndex, 0) / sessions.length > 0 ? '+' : ''}
                  {(sessions.reduce((sum, s) => sum + s.metrics.selfCorrectionIndex, 0) / sessions.length).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Persistencia Total</p>
                <p className="text-3xl font-bold text-amber-600">
                  {sessions.reduce((sum, s) => sum + s.metrics.persistence, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Error Promedio</p>
                <p className="text-3xl font-bold text-red-600">
                  {(sessions.reduce((sum, s) => sum + s.metrics.errorRate, 0) / sessions.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedSessions.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-2">No hay sesiones registradas</p>
              <p className="text-gray-500">
                Completa tu primera partida para ver tu análisis cognitivo aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSessions.map((session, index) => (
                <SessionCard key={`${session.userId}_${session.startTime}_${index}`} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
