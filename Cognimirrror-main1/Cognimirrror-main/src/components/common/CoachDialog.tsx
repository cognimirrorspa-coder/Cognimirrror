// CoachDialog.tsx - Modal de Guía Inteligente del Coach IA
import { X, Sparkles, Brain, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

type DialogType = 'welcome' | 'redirect' | null;

interface CoachDialogProps {
  userName: string;
  onClose: () => void;
  onNavigate?: (page: string) => void;
  type: DialogType;
}

export const CoachDialog = ({ userName, onClose, onNavigate, type }: CoachDialogProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setTimeout(() => setIsVisible(true), 300);
    }
  }, [type]);

  if (!type) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAcceptRedirect = () => {
    if (onNavigate) {
      onNavigate('memory-mirror');
    }
    handleClose();
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div 
        className={`bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative transform transition-transform duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {type === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
              <Sparkles className="w-10 h-10 text-yellow-300" />
            </div>
            
            <h2 className="text-3xl font-bold text-white">
              ¡Bienvenido a tu viaje cognitivo, {userName}!
            </h2>
            
            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <p className="text-cyan-100 text-lg leading-relaxed">
                Para empezar a revelar los patrones únicos de tu mente, te recomiendo comenzar con el{' '}
                <span className="font-bold text-yellow-300">Memory Mirror</span> o{' '}
                <span className="font-bold text-yellow-300">Digit Span</span>.
              </p>
              <p className="text-cyan-200 mt-3">
                ¡Es la puerta de entrada perfecta a tu universo interior!
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              ¡Entendido!
            </button>
          </div>
        )}

        {type === 'redirect' && (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="w-12 h-12 text-yellow-400" />
              <Sparkles className="w-10 h-10 text-cyan-300 animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-bold text-white">
              ¡Un consejo de tu Coach!
            </h2>
            
            <div className="bg-white bg-opacity-10 rounded-xl p-6 space-y-4">
              <p className="text-yellow-100 text-lg">
                ¡Este es un desafío de élite! Veo que estás explorando los límites de tu mente.
              </p>
              <p className="text-cyan-100">
                Muchos estrategas brillantes empezaron con el <span className="font-bold text-yellow-300">Spatial Mirror</span> para afinar su pensamiento 3D antes de conquistar este nivel.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleAcceptRedirect}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
              >
                Sí, vamos allá
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600"
              >
                No, seguiré aquí
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const useCoachDialog = () => {
  const [dialogType, setDialogType] = useState<DialogType>(null);

  useEffect(() => {
    const welcomed = localStorage.getItem('cognimirror_welcomed');
    if (!welcomed) {
      setTimeout(() => {
        setDialogType('welcome');
        localStorage.setItem('cognimirror_welcomed', 'true');
      }, 1000);
    }
  }, []);

  const showRedirect = () => setDialogType('redirect');
  const closeDialog = () => setDialogType(null);

  return { dialogType, showRedirect, closeDialog };
};