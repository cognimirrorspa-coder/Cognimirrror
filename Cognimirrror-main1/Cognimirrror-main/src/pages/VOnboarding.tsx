// VOnboarding.tsx - Componente principal de Voice Onboarding con FSM

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, User, Calendar, CheckCircle } from 'lucide-react';
import { VoiceRecognitionService, VoiceSynthesisService, intentFilters } from '../services/voiceRecognition';
import { useAuth } from '../context/AuthContext';

interface VOnboardingProps {
  onNavigate: (page: string) => void;
}

// Estados de la máquina de estados finitos (FSM)
type DialogState = 
  | 'welcome'           // Estado inicial: Bienvenida
  | 'askName'           // Estado 2: Pregunta nombre
  | 'confirmName'       // Estado 3: Confirmación de nombre
  | 'askAge'            // Estado 4: Pregunta edad
  | 'finalCheck'        // Estado 5: Verificación final
  | 'completed';        // Estado final: Completado

export const VOnboarding = ({ onNavigate }: VOnboardingProps) => {
  const { quickTry } = useAuth();
  
  // Estado de la FSM
  const [dialogPhase, setDialogPhase] = useState<DialogState>('welcome');
  
  // Estados de UI
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Datos capturados
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState<number | null>(null);
  
  // Historial
  const [stateHistory, setStateHistory] = useState<string[]>(['💬 Esperando inicio...']);

  const voiceRecognitionRef = useRef<VoiceRecognitionService | null>(null);
  const voiceSynthesisRef = useRef<VoiceSynthesisService | null>(null);

  useEffect(() => {
    voiceRecognitionRef.current = new VoiceRecognitionService();
    voiceSynthesisRef.current = new VoiceSynthesisService();

    return () => {
      voiceRecognitionRef.current?.stopListening();
      voiceSynthesisRef.current?.stop();
    };
  }, []);

  const startVoiceOnboarding = () => {
    setHasStarted(true);
    addToHistory('🎬 Iniciando V-Onboarding...');
    setTimeout(() => {
      transitionToState('welcome');
    }, 300);
  };

  const addToHistory = (message: string) => {
    setStateHistory(prev => [...prev, message]);
  };

  const speak = (text: string, onEnd?: () => void) => {
    setIsSpeaking(true);
    addToHistory(`🤖 Coach: ${text}`);
    voiceSynthesisRef.current?.speak(text, {
      onEnd: () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      }
    });
  };

  const startListening = () => {
    setIsListening(true);
    voiceRecognitionRef.current?.startListening(
      (text) => {
        addToHistory(`👤 Usuario: ${text}`);
        setIsListening(false);
        handleVoiceInput(text);
      },
      (error) => {
        console.error('Error de reconocimiento:', error);
        setIsListening(false);
        speak('Hubo un error al escucharte. Por favor, intenta de nuevo.', () => {
          setTimeout(() => startListening(), 500);
        });
      },
      () => {
        setIsListening(false);
      },
      true  // autoRestart habilitado
    );
  };

  // FUNCIÓN DE TRANSICIÓN DE ESTADOS (FSM)
  const transitionToState = (newState: DialogState) => {
    setDialogPhase(newState);
    addToHistory(`📍 Estado: ${getStateLabel(newState)}`);

    switch (newState) {
      case 'welcome':
        speak('¿Deseas probar la aplicación ahora mismo?', () => {
          startListening();
        });
        break;

      case 'askName':
        speak('Excelente. Para crear tu perfil cognitivo, ¿cuál es tu nombre completo?', () => {
          startListening();
        });
        break;

      case 'confirmName':
        speak(`Entendido. Tu nombre es ${userName}. ¿Es correcto?`, () => {
          startListening();
        });
        break;

      case 'askAge':
        speak('¿Cuál es tu edad actual?', () => {
          startListening();
        });
        break;

      case 'finalCheck':
        speak(`Tu nombre es ${userName} y tu edad es ${userAge}. ¿Está todo listo para empezar a descubrir tu genialidad?`, () => {
          startListening();
        });
        break;

      case 'completed':
        speak('¡Perfecto! Bienvenido a CogniMirror. Vamos a tu perfil.', () => {
          setTimeout(() => {
            handleLogin(userName, userAge!);
          }, 1000);
        });
        break;
    }
  };

  // LÓGICA DE MANEJO DE INPUT DE VOZ CON SWITCH/CASE
  const handleVoiceInput = (transcript: string) => {
    switch (dialogPhase) {
      case 'welcome':
        // Estado 1: Pregunta inicial
        if (intentFilters.isAffirmative(transcript)) {
          transitionToState('askName');
        } else if (intentFilters.isNegative(transcript)) {
          speak('De acuerdo. Puedes volver cuando quieras.', () => {
            setTimeout(() => onNavigate('home'), 2000);
          });
        } else {
          speak('No entendí tu respuesta. Por favor, di sí o no.', () => {
            startListening();
          });
        }
        break;

      case 'askName':
        // Estado 2: Captura de nombre
        const extractedName = intentFilters.extractName(transcript);
        if (extractedName && extractedName.length > 2) {
          setUserName(extractedName);
          setTimeout(() => {
            transitionToState('confirmName');
          }, 100);
        } else {
          speak('No pude capturar tu nombre correctamente. Por favor, repítelo.', () => {
            startListening();
          });
        }
        break;

      case 'confirmName':
        // Estado 3: Confirmación de nombre (con vuelta al estado)
        if (intentFilters.isAffirmative(transcript)) {
          transitionToState('askAge');
        } else if (intentFilters.isNegative(transcript)) {
          // VUELTA AL ESTADO: Resetear nombre y volver a askName
          setUserName('');
          addToHistory('🔄 Volviendo a preguntar el nombre...');
          speak('¿Cuál es tu nombre correcto?', () => {
            setTimeout(() => {
              transitionToState('askName');
            }, 100);
          });
        } else {
          speak('No entendí. ¿Tu nombre es correcto? Di sí o no.', () => {
            startListening();
          });
        }
        break;

      case 'askAge':
        // Estado 4: Captura de edad
        const extractedAge = intentFilters.extractAge(transcript);
        if (extractedAge !== null) {
          setUserAge(extractedAge);
          setTimeout(() => {
            transitionToState('finalCheck');
          }, 100);
        } else {
          speak('No pude capturar tu edad. Por favor, di un número entre 4 y 18.', () => {
            startListening();
          });
        }
        break;

      case 'finalCheck':
        // Estado 5: Verificación final
        if (intentFilters.isAffirmative(transcript)) {
          transitionToState('completed');
        } else if (intentFilters.isNegative(transcript)) {
          // Resetear todo y volver al inicio
          setUserName('');
          setUserAge(null);
          addToHistory('🔄 Reiniciando proceso...');
          speak('De acuerdo. Volvamos a empezar.', () => {
            setTimeout(() => {
              transitionToState('askName');
            }, 100);
          });
        } else {
          speak('No entendí. ¿Está todo correcto? Di sí o no.', () => {
            startListening();
          });
        }
        break;

      case 'completed':
        // Estado final - no hace nada
        break;
    }
  };

  const handleLogin = (name: string, age: number) => {
    quickTry(name, age);
    onNavigate('patient-profile');
  };

  const getStateLabel = (state: DialogState): string => {
    const labels: Record<DialogState, string> = {
      'welcome': 'Bienvenida',
      'askName': 'Capturando Nombre',
      'confirmName': 'Confirmando Nombre',
      'askAge': 'Capturando Edad',
      'finalCheck': 'Verificación Final',
      'completed': 'Completado'
    };
    return labels[state];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* TELA FLOTANTE: MODO VOCAL ACTIVO */}
      <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-full shadow-2xl transition-all duration-300 ${
        isListening 
          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse scale-110' 
          : 'bg-gray-600'
      }`}>
        <div className="flex items-center gap-3">
          <Mic className={`w-5 h-5 text-white ${isListening ? 'animate-bounce' : ''}`} />
          <span className="font-bold text-white text-sm">
            {isListening ? '🎤 ESCUCHANDO...' : 'MODO VOCAL ACTIVO'}
          </span>
          {isListening && (
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-white rounded-full animate-pulse"></div>
              <div className="w-1 h-4 bg-white rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-4 bg-white rounded-full animate-pulse delay-150"></div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-20 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">CogniMirror Voice Onboarding</h1>
            <p className="text-xl text-purple-200">Navegación por Diálogo Vocal</p>
          </div>

          {/* Estado Actual */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Estado Actual</h2>
              <span className="px-4 py-2 bg-purple-500 text-white rounded-full text-sm font-medium">
                {getStateLabel(dialogPhase)}
              </span>
            </div>

            {/* Indicador de Micrófono o Botón de Inicio */}
            {!hasStarted ? (
              <div className="flex flex-col items-center justify-center mb-6 space-y-4">
                <button
                  onClick={startVoiceOnboarding}
                  className="group relative"
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/50 cursor-pointer">
                    <Mic className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 px-4 py-1 rounded-full shadow-lg">
                    <span className="text-white font-bold text-sm">▶ INICIAR</span>
                  </div>
                </button>
                <p className="text-white text-lg font-medium">Haz clic para comenzar el V-Onboarding</p>
                <p className="text-purple-200 text-sm">El coach te guiará con su voz</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center mb-6">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening 
                      ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse shadow-2xl shadow-red-500/50' 
                      : isSpeaking
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse shadow-2xl shadow-blue-500/50'
                      : 'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}>
                    {isListening ? (
                      <Mic className="w-16 h-16 text-white" />
                    ) : (
                      <MicOff className="w-16 h-16 text-white" />
                    )}
                  </div>
                </div>

                <div className="text-center">
                  {isListening && (
                    <p className="text-white text-lg font-medium">🎤 Escuchando tu respuesta...</p>
                  )}
                  {isSpeaking && (
                    <p className="text-white text-lg font-medium">🤖 El coach está hablando...</p>
                  )}
                  {!isListening && !isSpeaking && (
                    <p className="text-purple-200 text-lg">Esperando...</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Datos Capturados */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-6 h-6 text-purple-300" />
                <h3 className="text-lg font-semibold text-white">Nombre</h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {userName || '---'}
              </p>
              {userName && (
                <CheckCircle className="w-5 h-5 text-green-400 mt-2" />
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-6 h-6 text-purple-300" />
                <h3 className="text-lg font-semibold text-white">Edad</h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {userAge ? `${userAge} años` : '---'}
              </p>
              {userAge && (
                <CheckCircle className="w-5 h-5 text-green-400 mt-2" />
              )}
            </div>
          </div>

          {/* Historial de Conversación */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-h-64 overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Historial de Conversación</h3>
            <div className="space-y-2">
              {stateHistory.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    message.startsWith('🤖') 
                      ? 'bg-blue-500/20 text-blue-100' 
                      : message.startsWith('👤')
                      ? 'bg-purple-500/20 text-purple-100'
                      : 'bg-gray-500/20 text-gray-100'
                  }`}
                >
                  {message}
                </div>
              ))}
            </div>
          </div>

          {/* Botón de Salida Manual */}
          <div className="text-center mt-8">
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors backdrop-blur-sm border border-white/30"
            >
              Salir del Modo Vocal
            </button>
          </div>
        </div>
      </div>

      {/* Efectos visuales de fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};
