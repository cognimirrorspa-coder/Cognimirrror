//PatientProfile.tsx

import { useState } from 'react';
import { Eye, Gamepad2, Lock, Trophy, Sparkles, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MetricsViewer } from '../components/common/MetricsViewer';

import { BrainWidget3D } from '../components/common/BrainWidget3D';
import { EnhancedSessionDashboard } from '../components/training/EnhancedSessionDashboard';
import { GameStatisticsDashboard } from '../components/dashboard/GameStatisticsDashboard';

interface PatientProfileProps {
  onNavigate: (page: string) => void;
}

export const PatientProfile = ({ onNavigate }: PatientProfileProps) => {
  const { selectedPatient, gameMode, switchGameMode } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [parentPassword, setParentPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);

  // Estado para datos analíticos profundos


  const [viewDemoData, setViewDemoData] = useState(false);





  if (!selectedPatient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No hay paciente seleccionado</p>
      </div>
    );
  }

  const handleModeSwitch = () => {
    if (gameMode === 'juego') {
      setShowPasswordModal(true);
    } else {
      switchGameMode('juego');
    }
  };

  const handlePasswordSubmit = () => {
    const success = switchGameMode('observador', parentPassword);
    if (success) {
      setShowPasswordModal(false);
      setParentPassword('');
      setPasswordError('');
    } else {
      setPasswordError('Contraseña incorrecta');
    }
  };

  const unlockedAchievements = selectedPatient.achievements.filter((a) => a.unlockedAt);
  const inProgressAchievements = selectedPatient.achievements.filter(
    (a) => !a.unlockedAt && a.progress
  );



  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 pb-12">
      <div
        className={`${gameMode === 'juego'
          ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
          : 'bg-gradient-to-r from-blue-600 to-cyan-500'
          } text-white py-8 transition-all`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {gameMode === 'juego' ? '¡Hola!' : 'Panel de Observación'}
              </h1>
              <p className={gameMode === 'juego' ? 'text-orange-100' : 'text-blue-100'}>
                {selectedPatient.name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {gameMode !== 'juego' && (
                <>
                  <button
                    onClick={() => setViewDemoData(!viewDemoData)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all backdrop-blur-sm ${viewDemoData
                      ? 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 border border-yellow-500/50'
                      : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{viewDemoData ? 'Viendo Demo (Lucas)' : 'Ver Demo'}</span>
                  </button>


                </>
              )}
              <button
                onClick={handleModeSwitch}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${gameMode === 'juego'
                  ? 'bg-white text-orange-600 hover:bg-orange-50'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
              >
                {gameMode === 'juego' ? (
                  <>
                    <Eye className="w-5 h-5" />
                    <span>Modo Observador</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-5 h-5" />
                    <span>Modo Juego</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Modo Observador</h3>
              <p className="text-gray-600 mt-2">
                Ingresa la contraseña parental para continuar
              </p>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{passwordError}</p>
              </div>
            )}

            <input
              type="password"
              value={parentPassword}
              onChange={(e) => {
                setParentPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="Contraseña parental"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />

            <div className="flex space-x-3">
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setParentPassword('');
                  setPasswordError('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Contraseña de prueba: 1234 o {selectedPatient.password}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 -mt-6">
        {gameMode === 'juego' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Mi Progreso</h2>
                <div className="text-right">
                  <p className="text-3xl font-bold text-yellow-600">
                    {(() => {
                      // Calculate progress based on games tried (25% per game out of 4 games)
                      const gamesPlayed = new Set(selectedPatient.sessions.map(s => s.gameType)).size;
                      return Math.min(gamesPlayed * 25, 100);
                    })()}%
                  </p>
                  <p className="text-sm text-gray-600">Completado</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-4 rounded-full transition-all"
                  style={{
                    width: `${(() => {
                      const gamesPlayed = new Set(selectedPatient.sessions.map(s => s.gameType)).size;
                      return Math.min(gamesPlayed * 25, 100);
                    })()}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Botón para ver métricas de tiempo - COMENTADO
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    <span>Métricas de Tiempo</span>
                  </h3>
                  <p className="text-gray-600">
                    Revisa cuánto tiempo has dedicado a cada juego y sesión
                  </p>
                </div>
                <button
                  onClick={() => setShowMetrics(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  <Clock className="w-5 h-5" />
                  <span>Ver Métricas</span>
                </button>
              </div>
            </div>
            */}

            {/* Acceso al dashboard cognitivo - COMENTADO
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center space-x-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <span>Dashboard Cognitivo</span>
                </h3>
                <p className="text-gray-600">
                  Visualiza análisis avanzados con métricas de Firebase.
                </p>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Dashboard
              </button>
            </div>
            */}

            {/* Botón destacado para MirrorHub */}
            <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Brain className="w-10 h-10 text-yellow-300" />
                    <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Espejos Cognitivos
                  </h2>
                  <p className="text-purple-100 text-lg mb-4">
                    Descubre los patrones únicos de tu mente a través de experiencias gamificadas
                  </p>
                  <button
                    onClick={() => onNavigate('mirror-hub')}
                    className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                  >
                    <Brain className="w-5 h-5" />
                    <span>Explorar Mis Espejos</span>
                  </button>
                </div>
                <div className="hidden md:block text-8xl opacity-20">
                  🧠
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Trophy className="w-7 h-7 text-yellow-600" />
                <span>Mis Logros</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-md"
                  >
                    <div className="text-4xl mb-2 text-center">{achievement.icon}</div>
                    <h3 className="font-bold text-gray-900 text-center mb-1">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-600 text-center">
                      {achievement.description}
                    </p>
                  </div>
                ))}

                {inProgressAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl"
                  >
                    <div className="text-4xl mb-2 text-center opacity-50">
                      {achievement.icon}
                    </div>
                    <h3 className="font-bold text-gray-700 text-center mb-1">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-600 text-center mb-2">
                      {achievement.description}
                    </p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>
                          {achievement.progress}/{achievement.goal}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${((achievement.progress || 0) / (achievement.goal || 1)) * 100
                              }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div id="observer-dashboard" className="space-y-8 mt-10">

            {/* Dashboards de Entrenamiento */}
            <div className="space-y-8">
              <EnhancedSessionDashboard
                userId={viewDemoData ? 'pat-1' : selectedPatient.id}
                userName={viewDemoData ? 'Lucas Martínez' : selectedPatient.name}
              />

              <GameStatisticsDashboard
                userId={viewDemoData ? 'pat-1' : selectedPatient.id}
                userName={viewDemoData ? 'Lucas Martínez' : selectedPatient.name}
              />

            </div>
            {/* Cerebro 3D Amelia (Mantener) */}
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 rounded-2xl shadow-2xl p-8 border-2 border-purple-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Mapa Cognitivo 3D</h2>
                  <p className="text-gray-600">Visualización cerebral de {selectedPatient.name}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 rounded-xl shadow-lg border border-purple-200 py-6">
                <div className="text-center space-y-4 px-6">
                  <BrainWidget3D />

                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      Visualización Cerebral 3D
                    </h3>
                    <p className="text-sm text-gray-600">
                      Mapa cognitivo de <span className="font-semibold text-purple-600">{selectedPatient.name}</span>
                    </p>
                    <div className="mt-2 inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>Análisis en tiempo real</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Métricas */}
      {showMetrics && (
        <MetricsViewer
          onClose={() => setShowMetrics(false)}
          userId={selectedPatient.id}
          userName={selectedPatient.name}
        />
      )}
    </div>
  );
};
