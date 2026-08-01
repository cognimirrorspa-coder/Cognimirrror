// MemoryMirror.tsx - El Detective de Patrones (Test de Corsi)
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Award, Brain, Sparkles, Volume2, VolumeX, BarChart3, History } from 'lucide-react';
import { MirrorRecorder } from '../../data/MirrorRecorder';
import { saveCognitiveSession, db } from '../../data/firebase';
import { collection, doc, setDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { askCoach, toggleVoice } from '../../services/CoachAI';
import { metrics } from '../../services/metrics';
import { MetricsViewer } from '../common/MetricsViewer';
import { AnalysisHistoryViewer } from '../analysis/AnalysisHistoryViewer';
import { TapData, RoundData, GameMetrics, AnalysisGameSession } from '../../types';

interface MemoryMirrorProps {
  userId: string;
  userName: string;
  onBack: () => void;
  onGameComplete?: (session: AnalysisGameSession) => void; // Callback para enviar sesión al historial
}

export const MemoryMirror = ({ userId, userName, onBack, onGameComplete }: MemoryMirrorProps) => {
  const [recorder] = useState(() => new MirrorRecorder('memory_mirror_v1', userId));
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'waiting' | 'gameover'>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [currentLevel, setCurrentLevel] = useState(3);
  const [lives, setLives] = useState(3);
  const [maxLevel, setMaxLevel] = useState(3);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const [coachTip, setCoachTip] = useState<string>('Cargando consejo...');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [feedbackState, setFeedbackState] = useState<'correct' | 'wrong' | null>(null);
  const [lostLife, setLostLife] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);

  // === TEMPORIZADOR Y RETO ===
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos = 300 segundos
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // === SISTEMA DE ANÁLISIS COGNITIVO ===
  const [allRounds, setAllRounds] = useState<RoundData[]>([]); // Historial de todas las rondas
  const [currentRoundTaps, setCurrentRoundTaps] = useState<TapData[]>([]); // Taps de la ronda actual
  const [roundStartTime, setRoundStartTime] = useState<string>(''); // Timestamp inicio de ronda
  const [attemptCountPerLevel, setAttemptCountPerLevel] = useState<Map<number, number>>(new Map()); // Intentos por nivel
  const sessionStartTimeRef = useRef<string>(''); // Timestamp de inicio de sesión
  const roundStartPerfRef = useRef<number>(0); // performance.now() al iniciar ronda

  // === REFS PARA FIRESTORE ===
  const currentSessionIdRef = useRef<string | null>(null);
  const sessionDocRef = useRef<any>(null);

  const blocks = Array.from({ length: 9 }, (_, i) => i);

  // Prevenir scroll en la página durante el juego, configurar audio y limpiar al desmontar
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Asegurar que el audio esté habilitado al iniciar
    toggleVoice(true);
    setAudioEnabled(true);

    // Función de limpieza al desmontar el componente
    return () => {
      document.body.style.overflow = 'auto';
      // Detener cualquier voz en reproducción
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // Asegurar que no haya audio de Google TTS
      toggleVoice(false);
    };
  }, []);

  // Cargar mensaje de bienvenida del Coach al inicio
  useEffect(() => {
    const loadWelcomeMessage = async () => {
      try {
        // askCoach maneja el audio automáticamente, no necesitamos speakText manual
        const tip = await askCoach({
          userName,
          userAge: 12,
          mirrorType: 'Memory Mirror',
          metrics: {
            persistencia: 0.5,
            eficiencia: 0.5,
            resiliencia: 0.5,
            adaptacion: 0.5
          },
          context: 'Está a punto de comenzar su primera sesión en Memory Mirror - El Detective de Patrones'
        }, audioEnabled); // autoSpeak habilitado si audio está activo

        setCoachTip(tip);
      } catch (error) {
        console.error('Error cargando Coach:', error);
        setCoachTip('¡Bienvenido al Detective de Patrones! Prepara tu memoria de trabajo.');
      }
    };
    loadWelcomeMessage();
  }, [userName, audioEnabled]);

  // Temporizador de 5 minutos
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            // Terminar juego por tiempo
            if (gameState !== 'gameover') {
              setGameState('gameover');
              endGame();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerActive, timeLeft, gameState]);

  // === FUNCIONES DE FIRESTORE (COPIADAS DE TRAINING) ===

  const initializeSession = async () => {
    try {
      // Crear referencia a una nueva sesión
      const sessionsCollection = collection(db, 'usuarios', userId, 'sesiones');
      const newSessionRef = doc(sessionsCollection); // ID automático
      currentSessionIdRef.current = newSessionRef.id;
      sessionDocRef.current = newSessionRef;

      // Datos iniciales de la sesión
      await setDoc(newSessionRef, {
        fecha: serverTimestamp(),
        gameId: 'memory_mirror_v1', // Identificador del juego
        gameName: 'Memory Mirror',
        duracion_segundos: 0,
        nivel_maximo: 3,
        aciertos: 0,
        errores: 0,
        tasa_error: 0,
        tiempo_promedio_respuesta_ms: 0,
        persistencia_intentos: 0,
        persistencia_recuperacion_ms: 0,
        completada: false
      });

      console.log('✅ Sesión inicializada en Firestore:', newSessionRef.id);
    } catch (error) {
      console.error('❌ Error inicializando sesión:', error);
    }
  };

  const recordGameEvent = async (
    tipo_evento: string,
    datos: {
      nivel: number,
      correcto?: boolean,
      tiempo_respuesta_ms?: number,
      intentos_en_este_nivel?: number
    }
  ) => {
    if (!currentSessionIdRef.current || !sessionDocRef.current) return;

    try {
      const eventosCollection = collection(sessionDocRef.current, 'eventos');
      await addDoc(eventosCollection, {
        timestamp: serverTimestamp(),
        tipo_evento,
        ...datos
      });
    } catch (error) {
      console.error('❌ Error registrando evento:', error);
    }
  };

  const updateSessionStats = async (final: boolean = false) => {
    if (!currentSessionIdRef.current || !sessionDocRef.current) return;

    try {
      // Calcular métricas actuales
      const totalAttempts = allRounds.length;
      const failedAttempts = allRounds.filter(r => !r.isCorrect).length;
      const errorRate = totalAttempts > 0 ? failedAttempts / totalAttempts : 0;

      // Calcular tiempo promedio de respuesta
      let totalTimeMs = 0;
      let totalTaps = 0;
      allRounds.forEach(r => {
        r.taps.forEach(t => {
          totalTimeMs += 500; // Placeholder
          totalTaps++;
        });
      });
      const avgResponseTime = totalTaps > 0 ? totalTimeMs / totalTaps : 0;

      await updateDoc(sessionDocRef.current, {
        duracion_segundos: 300 - timeLeft,
        nivel_maximo: maxLevel,
        aciertos: allRounds.filter(r => r.isCorrect).length,
        errores: failedAttempts,
        tasa_error: errorRate,
        tiempo_promedio_respuesta_ms: avgResponseTime,
        persistencia_intentos: totalAttempts,
        completada: final
      });
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  };

  const startGame = () => {
    recorder.start();
    metrics.startGame('memory_mirror', { userId, userName });

    // Inicializar sesión en Firestore
    initializeSession();

    // Inicializar sistema de análisis cognitivo
    sessionStartTimeRef.current = new Date().toISOString();
    setAllRounds([]);
    setCurrentRoundTaps([]);
    setAttemptCountPerLevel(new Map());

    // Iniciar temporizador de 5 minutos
    setTimeLeft(300);
    setTimerActive(true);

    setGameState('showing');
    setCurrentLevel(3);
    setLives(3);
    setMaxLevel(3);
    setUserSequence([]);
    generateSequence(3);
  };

  const generateSequence = (length: number) => {
    const newSeq: number[] = [];
    let lastNumber = -1;

    // Generar secuencia sin números consecutivos repetidos
    for (let i = 0; i < length; i++) {
      let randomNum;
      do {
        randomNum = Math.floor(Math.random() * 9);
      } while (randomNum === lastNumber && length > 1);

      newSeq.push(randomNum);
      lastNumber = randomNum;
    }

    setSequence(newSeq);
    recorder.recordEvent({
      type: 'sequence_start',
      value: { sequence: newSeq, level: length }
    });

    console.log(`🎮 [Memory Mirror] Secuencia generada - Nivel ${length}:`, newSeq);
    showSequence(newSeq);
  };

  const showSequence = async (seq: number[]) => {
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setActiveBlock(seq[i]);
      await new Promise(resolve => setTimeout(resolve, 900)); // 900ms por número
      setActiveBlock(null);
    }

    // Iniciar tracking de la ronda cuando el usuario puede empezar a jugar
    setRoundStartTime(new Date().toISOString());
    roundStartPerfRef.current = performance.now();
    setCurrentRoundTaps([]);

    setGameState('waiting');
  };

  /**
   * Finaliza una ronda y crea el objeto RoundData con todos los datos
   */
  const finalizeRound = (isCorrect: boolean, taps: TapData[]) => {
    const endTime = new Date().toISOString();
    const roundEndPerf = performance.now();
    const timeTaken = (roundEndPerf - roundStartPerfRef.current) / 1000; // Convertir a segundos

    // Obtener número de intento actual para este nivel
    const currentAttempt = (attemptCountPerLevel.get(currentLevel) || 0) + 1;
    setAttemptCountPerLevel(prev => {
      const newMap = new Map(prev);
      newMap.set(currentLevel, currentAttempt);
      return newMap;
    });

    // Crear objeto RoundData
    const roundData: RoundData = {
      level: currentLevel,
      attempt: currentAttempt,
      isCorrect,
      timeTaken,
      taps,
      startTime: roundStartTime,
      endTime
    };

    // Agregar a historial de rondas
    setAllRounds(prev => [...prev, roundData]);

    console.log(`📊 [Análisis Cognitivo] Ronda finalizada - Nivel: ${currentLevel}, Intento: ${currentAttempt}, Correcto: ${isCorrect}, Tiempo: ${timeTaken.toFixed(2)}s, Taps: ${taps.length}`);
  };

  /**
   * Calcula todas las métricas de análisis cognitivo a partir de las rondas
   */
  const calculateGameMetrics = (rounds: RoundData[], sessionStartTime: string): GameMetrics => {
    const sessionEndTime = new Date().toISOString();
    const totalSessionTime = (new Date(sessionEndTime).getTime() - new Date(sessionStartTime).getTime()) / 1000;

    // === CAPA 1: MÉTRICAS DE RENDIMIENTO ===
    const successfulRounds = rounds.filter(r => r.isCorrect);
    const failedRounds = rounds.filter(r => !r.isCorrect);
    const totalAttempts = rounds.length;
    const successfulAttempts = successfulRounds.length;

    // maxSpan: nivel más alto completado con éxito
    const maxSpan = successfulRounds.length > 0
      ? Math.max(...successfulRounds.map(r => r.level))
      : 0;

    // errorRate: porcentaje de intentos fallidos
    const errorRate = totalAttempts > 0
      ? (failedRounds.length / totalAttempts) * 100
      : 0;

    // === CAPA 2: MÉTRICAS DE PROCESO ===

    // persistence: número de reintentos (intentos después del primero en cada nivel)
    const persistence = rounds.filter(r => r.attempt > 1).length;

    // cognitiveFluency: tiempo promedio entre pulsaciones correctas en ms
    let allInterTapIntervals: number[] = [];
    successfulRounds.forEach(round => {
      const correctTaps = round.taps.filter(t => t.isCorrect);
      for (let i = 1; i < correctTaps.length; i++) {
        const interval = correctTaps[i].timestamp - correctTaps[i - 1].timestamp;
        allInterTapIntervals.push(interval);
      }
    });

    const cognitiveFluency = allInterTapIntervals.length > 0
      ? allInterTapIntervals.reduce((sum, val) => sum + val, 0) / allInterTapIntervals.length
      : 0;

    // selfCorrectionIndex: cambio de velocidad después de errores
    const allTaps: TapData[] = rounds.flatMap(r => r.taps);
    let selfCorrectionChanges: number[] = [];

    // Encontrar todos los errores y analizar el cambio de ritmo
    allTaps.forEach((tap, index) => {
      if (!tap.isCorrect && index > 2 && index < allTaps.length - 3) {
        // Velocidad PRE-ERROR: promedio de intervalos de los 3 taps antes del error
        const preErrorIntervals = [];
        for (let i = index - 2; i <= index; i++) {
          if (i > 0) {
            preErrorIntervals.push(allTaps[i].timestamp - allTaps[i - 1].timestamp);
          }
        }

        // Velocidad POST-ERROR: promedio de intervalos de los 3 taps después del error
        const postErrorIntervals = [];
        for (let i = index + 1; i <= index + 3; i++) {
          if (i < allTaps.length && i > 0) {
            postErrorIntervals.push(allTaps[i].timestamp - allTaps[i - 1].timestamp);
          }
        }

        if (preErrorIntervals.length > 0 && postErrorIntervals.length > 0) {
          const preAvg = preErrorIntervals.reduce((sum, val) => sum + val, 0) / preErrorIntervals.length;
          const postAvg = postErrorIntervals.reduce((sum, val) => sum + val, 0) / postErrorIntervals.length;

          // Cambio porcentual: positivo = ralentiza (más tiempo), negativo = acelera (menos tiempo)
          const percentChange = ((postAvg - preAvg) / preAvg) * 100;
          selfCorrectionChanges.push(percentChange);
        }
      }
    });

    const selfCorrectionIndex = selfCorrectionChanges.length > 0
      ? selfCorrectionChanges.reduce((sum, val) => sum + val, 0) / selfCorrectionChanges.length
      : 0;

    // === DATOS RAW PARA ANÁLISIS POSTERIOR ===

    console.log(`
🧠 ===== MÉTRICAS CALCULADAS =====
📈 CAPA 1 - RENDIMIENTO:
   • Max Span: ${maxSpan}
   • Tiempo Total: ${totalSessionTime.toFixed(2)}s
   • Tasa de Error: ${errorRate.toFixed(1)}%
   • Intentos Totales: ${totalAttempts}
   • Intentos Exitosos: ${successfulAttempts}

⚡ CAPA 2 - PROCESO:
   • Persistencia: ${persistence} reintentos
   • Fluidez Cognitiva: ${cognitiveFluency.toFixed(0)}ms entre taps
   • Auto-Corrección: ${selfCorrectionIndex > 0 ? '+' : ''}${selfCorrectionIndex.toFixed(1)}% ${selfCorrectionIndex > 0 ? '(Ralentiza)' : selfCorrectionIndex < 0 ? '(Acelera)' : '(Neutral)'}

📊 DATOS RAW:
   • Total Taps: ${allTaps.length}
   • Rondas Registradas: ${rounds.length}
==================================
    `);

    return {
      maxSpan,
      totalSessionTime,
      errorRate,
      totalAttempts,
      successfulAttempts,
      persistence,
      cognitiveFluency,
      selfCorrectionIndex,
      allTaps,
      roundsData: rounds
    };
  };

  const handleBlockClick = (blockId: number) => {
    if (gameState !== 'waiting') return;

    // === CAPTURA DE DATOS COGNITIVOS ===
    const tapTimestamp = performance.now(); // Timestamp preciso en ms
    const currentPosition = userSequence.length;
    const isCorrect = sequence[currentPosition] === blockId;

    // Crear registro de este tap
    const tapData: TapData = {
      timestamp: tapTimestamp,
      blockId,
      expected: sequence[currentPosition],
      isCorrect,
      position: currentPosition
    };

    // Agregar tap al array de la ronda actual
    setCurrentRoundTaps(prev => [...prev, tapData]);

    const newUserSeq = [...userSequence, blockId];
    setUserSequence(newUserSeq);

    // Flash visual con color según resultado
    setActiveBlock(blockId);
    setFeedbackState(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setActiveBlock(null);
      setFeedbackState(null);
    }, 600); // Más tiempo para ver el feedback

    recorder.recordEvent({
      type: 'user_input',
      value: {
        blockId,
        position: currentPosition,
        expected: sequence[currentPosition],
        sequenceLength: sequence.length,
        currentLevel
      },
      isCorrect
    });

    console.log(`👆 [Memory Mirror] Click: ${blockId}, Esperado: ${sequence[currentPosition]}, Correcto: ${isCorrect}, Posición: ${currentPosition + 1}/${sequence.length}`);

    if (!isCorrect) {
      // Error - registrar ronda fallida y mostrar animación
      setTimeout(() => {
        finalizeRound(false, [...currentRoundTaps, tapData]);
        handleMistake();
      }, 500);
      return;
    }

    if (newUserSeq.length === sequence.length) {
      // Secuencia completa correcta - registrar ronda exitosa
      console.log(`🎉 [Memory Mirror] ¡Secuencia completada correctamente!`);
      setTimeout(() => {
        finalizeRound(true, [...currentRoundTaps, tapData]);
        handleLevelComplete();
      }, 500);
    }
  };

  const handleMistake = () => {
    const newLives = lives - 1;

    // Animación de vida perdida
    setLostLife(true);
    setTimeout(() => setLostLife(false), 1000);

    recorder.recordEvent({
      type: 'mistake',
      value: { level: currentLevel, livesRemaining: newLives }
    });

    setLives(newLives);

    if (newLives <= 0) {  // Changed from === 0 to <= 0 to catch negative lives
      // Game Over
      setTimerActive(false); // Detener temporizador
      setGameState('gameover');
      endGame();
    } else {
      // Reintentar nivel
      setTimeout(() => {
        setGameState('showing');
        setUserSequence([]);
        generateSequence(currentLevel);
      }, 1500);
    }
  };

  const handleLevelComplete = async () => {
    const newLevel = currentLevel + 1;
    const newMaxLevel = Math.max(maxLevel, newLevel);

    // Animación de nivel completado
    setLevelUp(true);
    setTimeout(() => setLevelUp(false), 1500);

    // Verificar si llegó al nivel 20 (máximo)
    if (newLevel > 20) {
      console.log('🏆 [Memory Mirror] ¡Juego completado! Llegaste al nivel máximo!');
      setTimeout(() => endGame(), 2000);
      return;
    }

    setCurrentLevel(newLevel);
    setMaxLevel(newMaxLevel);
    setUserSequence([]);

    recorder.recordEvent({
      type: 'level_up',
      value: { newLevel, sequenceLength: newLevel, maxLevel: newMaxLevel }
    });

    console.log(`✅ [Memory Mirror] Nivel completado! Nuevo nivel: ${newLevel}, Mejor nivel: ${newMaxLevel}`);

    // Felicitación del Coach al pasar cada nivel
    let congratsMessage = '';
    if (newLevel === 10) {
      congratsMessage = `¡Increíble ${userName}! 🎉 ¡Has alcanzado el nivel 10! Tu memoria de trabajo es excepcional. Estás en el top 5% de jugadores. ¡Sigue así!`;
    } else if (newLevel === 15) {
      congratsMessage = `¡Extraordinario ${userName}! 🌟 ¡Nivel 15 alcanzado! Tu capacidad cognitiva es sobresaliente. ¡Eres imparable!`;
    } else if (newLevel === 20) {
      congratsMessage = `¡MAESTRO ${userName}! 👑 ¡Has llegado al nivel máximo! Tu memoria de trabajo es de élite mundial. ¡Felicitaciones!`;
    } else if (newLevel % 5 === 0) {
      congratsMessage = `¡Excelente ${userName}! 🎯 Nivel ${newLevel} completado. Tu progreso es impresionante. ¡Continúa así!`;
    } else {
      congratsMessage = `¡Muy bien ${userName}! ✨ Nivel ${newLevel} alcanzado. Tu memoria sigue mejorando.`;
    }

    setCoachTip(congratsMessage);
    // Hablar la felicitación si el audio está habilitado
    if (audioEnabled && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(congratsMessage);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error con felicitación del Coach:', error);
      }
    }

    setTimeout(() => {
      setGameState('showing');
      generateSequence(newLevel);
    }, 1500);
  };

  const endGame = async () => {
    setGameState('gameover');
    setTimerActive(false); // Detener temporizador

    // Actualizar estadísticas finales en Firestore
    await updateSessionStats(true);

    // Finalizar métricas de tiempo
    metrics.endGame(true, { level: maxLevel, score: maxLevel });

    const session = recorder.end('completed', maxLevel, {
      livesUsed: 3 - lives,
      finalLevel: currentLevel
    });

    try {
      await saveCognitiveSession(session);
      console.log('✅ Sesión de Memory Mirror guardada');
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }

    // === GENERAR ANÁLISIS COGNITIVO COMPLETO ===
    const gameMetrics = calculateGameMetrics(allRounds, sessionStartTimeRef.current);

    const analysisSession: AnalysisGameSession = {
      gameId: 'memory_mirror_v1',
      userId,
      userName,
      startTime: sessionStartTimeRef.current,
      endTime: new Date().toISOString(),
      metrics: gameMetrics,
      rounds: allRounds
    };

    // Enviar al historial si existe el callback
    if (onGameComplete) {
      onGameComplete(analysisSession);
      console.log('📤 [Análisis Cognitivo] Sesión enviada al historial');
    }

    // ACTIVAR PROTOCOLO DE REVELACIÓN NARRATIVA (P.I.N.) para mensaje final
    const tip = await askCoach({
      userName,
      userAge: 12,
      mirrorType: 'Memory Mirror',
      metrics: {
        persistencia: gameMetrics.persistence / 10,
        eficiencia: gameMetrics.successfulAttempts / gameMetrics.totalAttempts,
        resiliencia: (3 - lives + 3) / 6,
        adaptacion: 0.7
      },
      context: `Alcanzó nivel ${maxLevel} con ${lives} vidas restantes. Persistencia: ${gameMetrics.persistence} reintentos, Fluidez: ${gameMetrics.cognitiveFluency.toFixed(0)}ms`,
      isFinalMessage: true, // ACTIVAR protocolo P.I.N.
      finalLevel: maxLevel // Nivel máximo alcanzado
    }, audioEnabled); // autoSpeak habilitado si audio está activo
    setCoachTip(tip);
  };

  const handleBack = () => {
    // Detener cualquier voz en reproducción
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Asegurar que no haya audio de Google TTS
    toggleVoice(false);
    // Forzar un pequeño retraso para asegurar que se cancele la voz
    setTimeout(() => {
      onBack();
    }, 100);
  };

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    toggleVoice(newState);

    // SIEMPRE cancelar audio al silenciar, no solo si isSpeaking
    if (!newState) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const requestNewAdvice = async () => {
    setCoachTip('Pensándolo... 🧠');
    try {
      // askCoach maneja el audio automáticamente con autoSpeak
      const tip = await askCoach({
        userName,
        userAge: 12,
        mirrorType: 'Memory Mirror',
        metrics: {
          persistencia: maxLevel / 10,
          eficiencia: maxLevel / 10,
          resiliencia: (3 - lives + 3) / 6,
          adaptacion: 0.7
        },
        context: `Nivel ${currentLevel}, Vidas: ${lives}, Mejor: ${maxLevel}`,
        currentSequence: sequence, // Pasamos la secuencia actual
        needsHint: true // Activamos modo pista matemática
      }, audioEnabled); // autoSpeak habilitado si audio está activo

      setCoachTip(tip);
    } catch (error) {
      console.error('Error pidiendo consejo:', error);
      setCoachTip('¡Sigue así! Estás haciendo un gran trabajo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 py-1 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-100 rounded-lg transition-all shadow"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Volver</span>
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Brain className="w-8 h-8 text-cyan-600" />
              <h1 className="text-3xl font-bold text-gray-900">Memory Mirror</h1>
            </div>
            <p className="text-gray-600">El Detective de Patrones</p>
          </div>

          <div className="w-24"></div>
        </div>

        {/* Layout Principal */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Stats Sidebar */}
          <div className="w-full lg:w-56 space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-semibold">Nivel</span>
                <Award className="w-5 h-5 text-cyan-600" />
              </div>
              <p className="text-4xl font-bold text-cyan-600">{currentLevel}</p>
            </div>

            <div className={`bg-white rounded-xl shadow-lg p-5 transition-all duration-500 ${lostLife ? 'animate-shake bg-red-50 border-2 border-red-300' : ''
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-semibold">Vidas</span>
              </div>
              <div className="flex space-x-2 mb-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full transition-all duration-300 ${i < lives
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-gray-300 opacity-50'
                      }`}
                  />
                ))}
              </div>
              <p className={`text-4xl font-bold transition-all duration-300 ${lostLife ? 'text-red-600 scale-110' : 'text-red-500'
                }`}>
                {lives}
              </p>
              {lostLife && (
                <p className="text-sm text-red-600 font-semibold mt-2 animate-bounce">
                  ¡Vida perdida!
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-semibold">Mejor</span>
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-4xl font-bold text-yellow-600">{maxLevel}</p>
            </div>

            {/* Reto: Llegar a Nivel 10 */}
            <div className={`bg-gradient-to-br rounded-xl shadow-lg p-5 transition-all duration-500 ${maxLevel >= 10
              ? 'from-green-100 to-emerald-100 border-2 border-green-400'
              : 'from-purple-50 to-pink-50'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-semibold">🎯 Reto</span>
                {maxLevel >= 10 && <span className="text-2xl">🏆</span>}
              </div>
              <p className="text-sm text-gray-600 mb-2">Llegar a Nivel 10</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${maxLevel >= 10 ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                    style={{ width: `${Math.min((maxLevel / 10) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700">{maxLevel}/10</span>
              </div>
              {maxLevel >= 10 && (
                <p className="text-sm text-green-600 font-semibold mt-2 animate-bounce">
                  ¡Reto Completado!
                </p>
              )}
            </div>

            {/* Temporizador de 5 minutos */}
            {gameState !== 'idle' && (
              <div className={`bg-gradient-to-br rounded-xl shadow-lg p-5 transition-all duration-500 ${timeLeft <= 30
                ? 'from-red-100 to-orange-100 border-2 border-red-400 animate-pulse'
                : 'from-blue-50 to-cyan-50'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-semibold">⏱️ Tiempo</span>
                </div>
                <p className={`text-4xl font-bold ${timeLeft <= 30 ? 'text-red-600' : 'text-cyan-600'
                  }`}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </p>
                {timeLeft <= 30 && timeLeft > 0 && (
                  <p className="text-sm text-red-600 font-semibold mt-2 animate-bounce">
                    ¡Apúrate!
                  </p>
                )}
                {timeLeft === 0 && (
                  <p className="text-sm text-red-600 font-semibold mt-2">
                    Tiempo agotado
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Game Board - Centro */}
          <div className={`flex-1 bg-white rounded-2xl shadow-2xl p-8 min-h-[500px] flex items-center justify-center transition-all duration-500 ${lostLife ? 'animate-shake bg-red-50 border-4 border-red-300' : ''
            } ${levelUp ? 'bg-green-50 border-4 border-green-400' : ''
            }`}>
            {gameState === 'idle' && (
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">🧠⚡</div>
                <h2 className="text-2xl font-bold text-gray-900">
                  ¡Hola, {userName}!
                </h2>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  Voy a mostrarte una secuencia de bloques iluminados.
                  Tu misión es repetirla en el mismo orden.
                  ¡Cada nivel es más largo!
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
                >
                  <Play className="w-6 h-6" />
                  <span>Comenzar</span>
                </button>
              </div>
            )}

            {(gameState === 'showing' || gameState === 'waiting') && (
              <div className="space-y-6 relative">
                {/* Notificación de nivel completado - Grande y centrada */}
                {levelUp && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-12 py-8 rounded-3xl shadow-2xl animate-bounce">
                      <p className="text-4xl font-bold flex items-center space-x-3">
                        <span>🎉</span>
                        <span>¡Nivel Completado!</span>
                        <span>🎉</span>
                      </p>
                      <p className="text-xl text-center mt-2 text-green-100">
                        Nivel {currentLevel - 1} → {currentLevel}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notificación de vida perdida - Grande y centrada */}
                {lostLife && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-gradient-to-r from-red-400 to-red-500 text-white px-12 py-8 rounded-3xl shadow-2xl animate-shake">
                      <p className="text-4xl font-bold flex items-center space-x-3">
                        <span>❌</span>
                        <span>¡Vida Perdida!</span>
                        <span>❌</span>
                      </p>
                      <p className="text-xl text-center mt-2 text-red-100">
                        Vidas restantes: {lives}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center mb-4">
                  <p className="text-lg font-semibold text-gray-700">
                    {gameState === 'showing' ? '👀 Observa la secuencia...' : '🎯 ¡Tu turno! Repite el patrón'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  {blocks.map((blockId) => {
                    const isActive = activeBlock === blockId;
                    const isCorrect = isActive && feedbackState === 'correct';
                    const isWrong = isActive && feedbackState === 'wrong';

                    return (
                      <button
                        key={blockId}
                        onClick={() => handleBlockClick(blockId)}
                        disabled={gameState !== 'waiting'}
                        className={`aspect-square rounded-2xl transition-all duration-300 transform flex items-center justify-center ${isCorrect
                          ? 'bg-gradient-to-br from-green-300 to-green-400 scale-110 shadow-2xl animate-pulse'
                          : isWrong
                            ? 'bg-gradient-to-br from-red-300 to-red-400 scale-110 shadow-2xl animate-shake'
                            : isActive
                              ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 scale-110 shadow-2xl'
                              : 'bg-gray-200 hover:bg-gray-300 hover:scale-105'
                          } ${gameState === 'waiting' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        <span className={`text-2xl font-bold transition-colors ${isActive ? 'text-white' : 'text-gray-700'
                          }`}>
                          {blockId + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {gameState === 'gameover' && (
              <div className="text-center space-y-6 overflow-y-auto max-h-[80vh] py-4 px-2 -mx-2">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-gray-900">
                  ¡Increíble, {userName}!
                </h2>
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6">
                  <p className="text-lg text-gray-700 mb-2">Máximo nivel alcanzado:</p>
                  <p className="text-5xl font-bold text-cyan-600">{maxLevel}</p>
                </div>
                <p className="text-gray-600 max-w-md mx-auto">
                  Tu memoria de trabajo es asombrosa. Has completado secuencias de hasta {maxLevel} elementos.
                  ¡Sigue entrenando tu cerebro!
                </p>
                {coachTip && (
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h4 className="font-bold text-purple-900">Consejo del Coach IA:</h4>
                    </div>
                    <p className="text-gray-700">{coachTip}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={async () => {
                      setCoachTip('Analizando tu desempeño...');
                      // askCoach maneja el audio automáticamente con autoSpeak
                      const tip = await askCoach({
                        userName,
                        userAge: 12,
                        mirrorType: 'Memory Mirror',
                        metrics: {
                          persistencia: maxLevel / 10,
                          eficiencia: maxLevel / 10,
                          resiliencia: (3 - lives + 3) / 6,
                          adaptacion: 0.7
                        },
                        context: `Alcanzó nivel ${maxLevel} con ${lives} vidas restantes`
                      }, audioEnabled); // autoSpeak habilitado si audio está activo
                      setCoachTip(tip);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center space-x-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Pedir Consejo al Coach IA</span>
                  </button>
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    Jugar de Nuevo
                  </button>
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Ver Otros Espejos
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coach Sidebar - Derecha */}
          <div className="w-full lg:w-80 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-6 sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" />
                <h3 className="text-white font-bold text-xl">Coach IA</h3>
              </div>
              <button
                onClick={toggleAudio}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                title={audioEnabled ? 'Silenciar' : 'Activar audio'}
              >
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5 text-white" />
                ) : (
                  <VolumeX className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 min-h-[120px]">
              <p className="text-white text-sm leading-relaxed">{coachTip}</p>
            </div>

            <div className="flex items-center space-x-2 text-white/80 text-xs mb-4">
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`}></div>
              <span>{isSpeaking ? 'Reproduciendo...' : 'Listo'}</span>
            </div>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  if (coachTip && coachTip !== 'Cargando consejo...' && coachTip !== 'Analizando tu desempeño...') {
                    // Usar askCoach para obtener una nueva respuesta y reproducirla
                    const tip = await askCoach({
                      userName,
                      userAge: 12,
                      mirrorType: 'Memory Mirror',
                      metrics: {
                        persistencia: maxLevel / 10,
                        eficiencia: maxLevel / 10,
                        resiliencia: (3 - lives + 3) / 6,
                        adaptacion: 0.7
                      },
                      context: `Nivel ${currentLevel}, Vidas: ${lives}, Mejor: ${maxLevel}`
                    }, true); // Siempre reproducir audio
                    setCoachTip(tip);
                  }
                }}
                disabled={!audioEnabled || isSpeaking || !coachTip || coachTip === 'Cargando consejo...'}
                className="w-full py-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSpeaking ? 'Reproduciendo...' : 'Escuchar Consejo'}</span>
              </button>

              {gameState !== 'idle' && (
                <button
                  onClick={requestNewAdvice}
                  disabled={coachTip === 'Analizando tu desempeño...'}
                  className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-600 disabled:cursor-not-allowed rounded-lg text-gray-900 font-bold transition-all flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Pedir Consejo</span>
                </button>
              )}

              {/* Botón de Métricas */}
              <button
                onClick={() => setShowMetrics(true)}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 rounded-lg text-white font-bold transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Ver Métricas</span>
              </button>

              {/* Botón de Historial de Análisis */}
              <button
                onClick={() => setShowAnalysisHistory(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-bold transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <History className="w-4 h-4" />
                <span>Historial Cognitivo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Métricas */}
      {showMetrics && (
        <MetricsViewer
          onClose={() => setShowMetrics(false)}
          userId={userId}
          userName={userName}
        />
      )}

      {/* Modal de Historial de Análisis */}
      {showAnalysisHistory && (
        <AnalysisHistoryViewer
          onClose={() => setShowAnalysisHistory(false)}
          userId={userId}
        />
      )}
    </div>
  );
};