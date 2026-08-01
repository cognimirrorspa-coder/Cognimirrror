// MirrorHub.tsx - Selector de Espejos Cognitivos (Modelo Waze)
import { Brain, Sparkles, Lock, Zap, ArrowLeft } from 'lucide-react';
import { MIRROR_CATALOG, MirrorType } from '../types';
import { CoachDialog, useCoachDialog } from '../components/common/CoachDialog';

interface MirrorHubProps {
  onNavigate: (page: string) => void;
  userName: string;
}

export const MirrorHub = ({ onNavigate, userName }: MirrorHubProps) => {
  const { dialogType, closeDialog } = useCoachDialog();

  const getMirrorStatus = (mirrorId: MirrorType): 'recommended' | 'ready' | 'advanced' | 'locked' => {
    if (mirrorId === 'memory_mirror_v1') return 'recommended';
    if (mirrorId === 'digit_span_v1') return 'recommended';
    if (mirrorId === 'strategy_mirror_v1') return 'ready';
    if (mirrorId === 'tetris_mirror_v1') return 'advanced';
    return 'locked';
  };

  const handleMirrorClick = (mirrorType: MirrorType) => {
    const status = getMirrorStatus(mirrorType);

    if (status === 'locked') {
      // Próximamente
      return;
    }

    if (mirrorType === 'memory_mirror_v1') {
      onNavigate('memory-mirror');
    } else if (mirrorType === 'digit_span_v1') {
      onNavigate('digit-span');
    } else if (mirrorType === 'strategy_mirror_v1') {
      onNavigate('rubik-game');
    } else if (mirrorType === 'tetris_mirror_v1') {
      onNavigate('tetris-game');
    } else if (mirrorType === 'spatial_mirror_v1') {
      alert('Este espejo estará disponible pronto 🔮');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          {/* Botón Volver */}
          <button
            onClick={() => onNavigate('patient-profile')}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </button>
          {/* COMENTADO - Botón para ver Analytics
          <div className="flex justify-end mb-4">
            <button
              onClick={() => onNavigate('analytics-dashboard')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all shadow"
            >
              demo
            </button>
          </div>
          */}
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Brain className="w-16 h-16" />
              <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold">
              ¡Hola, {userName}!
            </h1>
            <p className="text-2xl md:text-3xl font-light">
              Bienvenido a tu espacio de <span className="font-bold text-yellow-300">autodescubrimiento cognitivo</span>
            </p>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto">
              Cada espejo revela una faceta única de tu mente. No estamos aquí para evaluarte, sino para mostrarte tu genialidad única.
            </p>
          </div>
        </div>
      </div>

      {/* Espejos Grid */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-7xl mx-auto">
          {Object.values(MIRROR_CATALOG).map((mirror) => {
            const status = getMirrorStatus(mirror.id);

            return (
              <div
                key={mirror.id}
                onClick={() => handleMirrorClick(mirror.id)}
                className={`
                  relative rounded-2xl p-8 shadow-2xl transition-all duration-300
                  ${status === 'recommended'
                    ? 'bg-gradient-to-br ' + mirror.gradient + ' cursor-pointer transform hover:scale-110 ring-4 ring-yellow-400 ring-offset-4 ring-offset-gray-900 animate-pulse'
                    : status === 'ready'
                      ? 'bg-gradient-to-br ' + mirror.gradient + ' cursor-pointer transform hover:scale-110 ring-4 ring-emerald-500 ring-offset-4 ring-offset-gray-900'
                      : status === 'advanced'
                        ? 'bg-gradient-to-br ' + mirror.gradient + ' opacity-70 cursor-pointer hover:opacity-90 transform hover:scale-105'
                        : 'bg-gradient-to-br ' + mirror.gradient + ' opacity-40 cursor-not-allowed'
                  }
                `}
              >
                {/* Badge de Estado */}
                {status === 'recommended' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                    <Zap className="w-3 h-3" />
                    <span>RECOMENDADO PARA EMPEZAR</span>
                  </div>
                )}
                {status === 'ready' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                    <Zap className="w-3 h-3 text-yellow-300 animate-bounce" />
                    <span>LISTO PARA EMPEZAR</span>
                  </div>
                )}
                {status === 'advanced' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    demo
                  </div>
                )}
                {status === 'locked' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl">
                    <div className="text-center text-white">
                      <Lock className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-lg font-bold">PRÓXIMAMENTE</p>
                    </div>
                  </div>
                )}

                {/* Contenido del Espejo */}
                <div className="text-6xl mb-4 text-center">{mirror.icon}</div>
                <h3 className="text-2xl font-bold text-white text-center mb-2">
                  {mirror.displayName}
                </h3>
                <p className="text-white text-center opacity-90 mb-4 text-sm">
                  {mirror.description}
                </p>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 text-xs text-white space-y-1">
                  <p>📊 {mirror.scientificBasis}</p>
                  <p>⏱️ ~{mirror.estimatedDuration} min</p>
                  <p>🎯 Dificultad: {mirror.difficulty === 'easy' ? 'Fácil' : mirror.difficulty === 'medium' ? 'Media' : 'Alta'}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensaje de Guía */}
        <div className="mt-12 max-w-2xl mx-auto bg-gradient-to-r from-cyan-900 to-blue-900 rounded-xl p-6 text-white text-center shadow-xl">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Brain className="w-6 h-6 text-cyan-300" />
            <h3 className="text-xl font-bold">💡 Consejo del Coach</h3>
          </div>
          <p className="text-cyan-100">
            Te recomendamos empezar con el <span className="font-bold text-yellow-300">Memory Mirror</span> o{' '}
            <span className="font-bold text-yellow-300">Digit Span</span> para
            calibrar tu perfil cognitivo. Pero recuerda: <span className="italic">tienes libertad total para explorar</span>.
          </p>
        </div>
      </div>

      {/* Coach Dialog */}
      <CoachDialog
        userName={userName}
        onClose={closeDialog}
        onNavigate={onNavigate}
        type={dialogType}
      />
    </div>
  );
};