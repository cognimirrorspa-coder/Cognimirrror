// ObserverDashboard.tsx - Panel del Observador (Vista para Padres/Tutores) - v2.1
// Con Dashboards Avanzados, Mapa Cognitivo 3D y Guía Educativa
import { ArrowLeft, Activity, Brain } from 'lucide-react';

import { BrainWidget3D } from '../components/common/BrainWidget3D';
import { EnhancedSessionDashboard } from '../components/training/EnhancedSessionDashboard';
import { GameStatisticsDashboard } from '../components/dashboard/GameStatisticsDashboard';

interface ObserverDashboardProps {
  onNavigate: (page: string) => void;
  userId: string;
  userName: string;
}

export const ObserverDashboard = ({ onNavigate, userId, userName }: ObserverDashboardProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-100 rounded-lg transition-all shadow"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Volver</span>
          </button>

          <div className="flex items-center space-x-3">
            <Activity className="w-10 h-10 text-purple-600" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Panel de Observación</h1>
              <p className="text-gray-600">{userName}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('mirror-hub')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg transition-all shadow-lg"
          >
            Modo Juego
          </button>
        </div>

        <div className="space-y-8">


          {/* Dashboards de Entrenamiento */}
          <EnhancedSessionDashboard
            userId={userId}
            userName={userName}
          />

          <GameStatisticsDashboard
            userId={userId}
            userName={userName}
          />

          {/* Mapa Cognitivo 3D */}
          <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 rounded-2xl shadow-2xl p-8 border-2 border-purple-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mapa Cognitivo 3D</h2>
                <p className="text-gray-600">Visualización cerebral de {userName}</p>
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
                    Mapa cognitivo de <span className="font-semibold text-purple-600">{userName}</span>
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
      </div>
    </div>
  );
};
