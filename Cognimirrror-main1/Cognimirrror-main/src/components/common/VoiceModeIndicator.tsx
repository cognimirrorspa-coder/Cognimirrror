// VoiceModeIndicator.tsx - Indicador visual de modo vocal

import { Mic } from 'lucide-react';

interface VoiceModeIndicatorProps {
  isListening?: boolean;
  isSpeaking?: boolean;
}

export const VoiceModeIndicator = ({ isListening = false, isSpeaking = false }: VoiceModeIndicatorProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Banner principal de modo vocal */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 flex items-center justify-center gap-3 shadow-lg">
        <Mic className={`w-5 h-5 ${isListening || isSpeaking ? 'animate-pulse' : ''}`} />
        <span className="font-bold text-lg">MODO VOCAL ACTIVADO</span>
        <div className={`w-2 h-2 bg-white rounded-full ${isListening || isSpeaking ? 'animate-pulse' : ''}`}></div>
      </div>

      {/* Estado actual */}
      {(isListening || isSpeaking) && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-6 text-center text-sm font-medium animate-pulse">
          {isListening && '🎤 Escuchando tu voz...'}
          {isSpeaking && '🤖 El coach está hablando...'}
        </div>
      )}
    </div>
  );
};
