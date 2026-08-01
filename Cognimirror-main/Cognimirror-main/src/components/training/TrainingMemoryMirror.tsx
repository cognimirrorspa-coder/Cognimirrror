// TrainingMemoryMirror.tsx - Versión adaptada para el Campo de Entrenamiento
import { useState, useEffect, useRef } from 'react';
import { Play, Award, Brain, Sparkles, Volume2, VolumeX, BarChart3, History } from 'lucide-react';
import { MirrorRecorder } from '../../data/MirrorRecorder';
import { saveCognitiveSession, db } from '../../data/firebase'; // Import db
import { collection, doc, setDoc, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'; // Firestore imports
import { askCoach, toggleVoice } from '../../services/CoachAI';
import { metrics } from '../../services/metrics';
import { MetricsViewer } from '../common/MetricsViewer';
import { AnalysisHistoryViewer } from '../analysis/AnalysisHistoryViewer';
import { TapData, RoundData, GameMetrics, AnalysisGameSession } from '../../types';

interface TrainingMemoryMirrorProps {
    userId: string;
    userName: string;
    onGameComplete?: (session: AnalysisGameSession) => void;
}

export const TrainingMemoryMirror = ({ userId, userName, onGameComplete }: TrainingMemoryMirrorProps) => {
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

    // === NUEVA ESTRUCTURA FIRESTORE ===
    const currentSessionIdRef = useRef<string | null>(null);
    const sessionDocRef = useRef<any>(null); // Referencia al documento de la sesión

    const blocks = Array.from({ length: 9 }, (_, i) => i);

    // Prevenir scroll en la página durante el juego, configurar audio y limpiar al desmontar
    useEffect(() => {
        // Asegurar que el audio esté habilitado al iniciar
        toggleVoice(true);
        setAudioEnabled(true);

        // Función de limpieza al desmontar el componente
        return () => {
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
                }, audioEnabled);

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

    // --- NUEVAS FUNCIONES FIRESTORE ---

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
            // Calcular métricas actuales (simplificado para este ejemplo, idealmente usaría allRounds)
            const totalAttempts = allRounds.length;
            const failedAttempts = allRounds.filter(r => !r.isCorrect).length;
            const errorRate = totalAttempts > 0 ? failedAttempts / totalAttempts : 0;

            // Calcular tiempo promedio de respuesta
            let totalTimeMs = 0;
            let totalTaps = 0;
            allRounds.forEach(r => {
                r.taps.forEach(t => {
                    // Estimación simple si no tenemos el tiempo exacto por tap aquí
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
                persistencia_intentos: totalAttempts, // Total de rondas jugadas
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

        sessionStartTimeRef.current = new Date().toISOString();
        setAllRounds([]);
        setCurrentRoundTaps([]);
        setAttemptCountPerLevel(new Map());

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

        // Registrar evento en Firestore
        recordGameEvent('inicio_nivel', {
            nivel: length,
            intentos_en_este_nivel: attemptCountPerLevel.get(length) || 0
        });

        showSequence(newSeq);
    };

    const showSequence = async (seq: number[]) => {
        for (let i = 0; i < seq.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 400));
            setActiveBlock(seq[i]);
            await new Promise(resolve => setTimeout(resolve, 900));
            setActiveBlock(null);
        }

        setRoundStartTime(new Date().toISOString());
        roundStartPerfRef.current = performance.now();
        setCurrentRoundTaps([]);

        setGameState('waiting');
    };

    const finalizeRound = (isCorrect: boolean, taps: TapData[]) => {
        const endTime = new Date().toISOString();
        const roundEndPerf = performance.now();
        const timeTaken = (roundEndPerf - roundStartPerfRef.current) / 1000;

        const currentAttempt = (attemptCountPerLevel.get(currentLevel) || 0) + 1;
        setAttemptCountPerLevel(prev => {
            const newMap = new Map(prev);
            newMap.set(currentLevel, currentAttempt);
            return newMap;
        });

        const roundData: RoundData = {
            level: currentLevel,
            attempt: currentAttempt,
            isCorrect,
            timeTaken,
            taps,
            startTime: roundStartTime,
            endTime
        };

        setAllRounds(prev => [...prev, roundData]);
    };

    const calculateGameMetrics = (rounds: RoundData[], sessionStartTime: string): GameMetrics => {
        const sessionEndTime = new Date().toISOString();
        const totalSessionTime = (new Date(sessionEndTime).getTime() - new Date(sessionStartTime).getTime()) / 1000;

        const successfulRounds = rounds.filter(r => r.isCorrect);
        const failedRounds = rounds.filter(r => !r.isCorrect);
        const totalAttempts = rounds.length;
        const successfulAttempts = successfulRounds.length;

        const maxSpan = successfulRounds.length > 0
            ? Math.max(...successfulRounds.map(r => r.level))
            : 0;

        const errorRate = totalAttempts > 0
            ? (failedRounds.length / totalAttempts) * 100
            : 0;

        const persistence = rounds.filter(r => r.attempt > 1).length;

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

        const allTaps: TapData[] = rounds.flatMap(r => r.taps);
        let selfCorrectionChanges: number[] = [];

        allTaps.forEach((tap, index) => {
            if (!tap.isCorrect && index > 2 && index < allTaps.length - 3) {
                const preErrorIntervals = [];
                for (let i = index - 2; i <= index; i++) {
                    if (i > 0) {
                        preErrorIntervals.push(allTaps[i].timestamp - allTaps[i - 1].timestamp);
                    }
                }

                const postErrorIntervals = [];
                for (let i = index + 1; i <= index + 3; i++) {
                    if (i < allTaps.length && i > 0) {
                        postErrorIntervals.push(allTaps[i].timestamp - allTaps[i - 1].timestamp);
                    }
                }

                if (preErrorIntervals.length > 0 && postErrorIntervals.length > 0) {
                    const preAvg = preErrorIntervals.reduce((sum, val) => sum + val, 0) / preErrorIntervals.length;
                    const postAvg = postErrorIntervals.reduce((sum, val) => sum + val, 0) / postErrorIntervals.length;

                    const percentChange = ((postAvg - preAvg) / preAvg) * 100;
                    selfCorrectionChanges.push(percentChange);
                }
            }
        });

        const selfCorrectionIndex = selfCorrectionChanges.length > 0
            ? selfCorrectionChanges.reduce((sum, val) => sum + val, 0) / selfCorrectionChanges.length
            : 0;

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

        const tapTimestamp = performance.now();
        const currentPosition = userSequence.length;
        const isCorrect = sequence[currentPosition] === blockId;

        const tapData: TapData = {
            timestamp: tapTimestamp,
            blockId,
            expected: sequence[currentPosition],
            isCorrect,
            position: currentPosition
        };

        setCurrentRoundTaps(prev => [...prev, tapData]);

        const newUserSeq = [...userSequence, blockId];
        setUserSequence(newUserSeq);

        setActiveBlock(blockId);
        setFeedbackState(isCorrect ? 'correct' : 'wrong');

        setTimeout(() => {
            setActiveBlock(null);
            setFeedbackState(null);
        }, 600);

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

        // Registrar evento en Firestore
        recordGameEvent('respuesta', {
            nivel: currentLevel,
            correcto: isCorrect,
            tiempo_respuesta_ms: performance.now() - roundStartPerfRef.current, // Aproximado
            intentos_en_este_nivel: attemptCountPerLevel.get(currentLevel) || 0
        });

        if (!isCorrect) {
            setTimeout(() => {
                finalizeRound(false, [...currentRoundTaps, tapData]);
                handleMistake();
            }, 500);
            return;
        }

        if (newUserSeq.length === sequence.length) {
            setTimeout(() => {
                finalizeRound(true, [...currentRoundTaps, tapData]);
                handleLevelComplete();
            }, 500);
        }
    };

    const handleMistake = () => {
        const newLives = lives - 1;

        setLostLife(true);
        setTimeout(() => setLostLife(false), 1000);

        recorder.recordEvent({
            type: 'mistake',
            value: { level: currentLevel, livesRemaining: newLives }
        });

        // Registrar evento en Firestore
        recordGameEvent('error', {
            nivel: currentLevel,
            correcto: false,
            intentos_en_este_nivel: attemptCountPerLevel.get(currentLevel) || 0
        });

        // Actualizar estadísticas parciales
        updateSessionStats(false);

        setLives(newLives);

        if (newLives <= 0) {
            setTimerActive(false);
            setGameState('gameover');
            endGame();
        } else {
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

        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 1500);

        if (newLevel > 20) {
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

        // Registrar evento en Firestore
        recordGameEvent('nivel_completado', {
            nivel: currentLevel, // El nivel que acaba de completar
            correcto: true,
            intentos_en_este_nivel: attemptCountPerLevel.get(currentLevel) || 0
        });

        // Actualizar estadísticas parciales
        updateSessionStats(false);

        let congratsMessage = '';
        if (newLevel === 10) {
            congratsMessage = `¡Increíble ${userName}! 🎉 ¡Has alcanzado el nivel 10! Tu memoria de trabajo es excepcional.`;
        } else if (newLevel === 15) {
            congratsMessage = `¡Extraordinario ${userName}! 🌟 ¡Nivel 15 alcanzado! Tu capacidad cognitiva es sobresaliente.`;
        } else if (newLevel === 20) {
            congratsMessage = `¡MAESTRO ${userName}! 👑 ¡Has llegado al nivel máximo!`;
        } else if (newLevel % 5 === 0) {
            congratsMessage = `¡Excelente ${userName}! 🎯 Nivel ${newLevel} completado.`;
        } else {
            congratsMessage = `¡Muy bien ${userName}! ✨ Nivel ${newLevel} alcanzado.`;
        }

        setCoachTip(congratsMessage);
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
        setTimerActive(false);

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

        // Actualizar estadísticas finales en Firestore
        await updateSessionStats(true);

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

        if (onGameComplete) {
            onGameComplete(analysisSession);
        }

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
            context: `Alcanzó nivel ${maxLevel} con ${lives} vidas restantes. Persistencia: ${gameMetrics.persistence} reintentos`,
            isFinalMessage: true,
            finalLevel: maxLevel
        }, audioEnabled);
        setCoachTip(tip);
    };

    const toggleAudio = () => {
        const newState = !audioEnabled;
        setAudioEnabled(newState);
        toggleVoice(newState);

        if (!newState) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const requestNewAdvice = async () => {
        setCoachTip('Pensándolo... 🧠');
        try {
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
                currentSequence: sequence,
                needsHint: true
            }, audioEnabled);

            setCoachTip(tip);
        } catch (error) {
            console.error('Error pidiendo consejo:', error);
            setCoachTip('¡Sigue así! Estás haciendo un gran trabajo.');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Brain className="w-6 h-6" />
                    <h2 className="text-lg font-bold">Memory Mirror - Entrenamiento</h2>
                </div>
                <div className="text-sm opacity-90">
                    Usuario: {userName}
                </div>
            </div>

            <div className="p-6 bg-gray-50">
                {/* Layout Principal Adaptado */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Stats Sidebar */}
                    <div className="w-full lg:w-48 space-y-4">
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 font-semibold text-sm">Nivel</span>
                                <Award className="w-4 h-4 text-cyan-600" />
                            </div>
                            <p className="text-3xl font-bold text-cyan-600">{currentLevel}</p>
                        </div>

                        <div className={`bg-white rounded-xl shadow p-4 transition-all duration-500 ${lostLife ? 'animate-shake bg-red-50 border border-red-300' : ''
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 font-semibold text-sm">Vidas</span>
                            </div>
                            <div className="flex space-x-1 mb-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full transition-all duration-300 ${i < lives
                                            ? 'bg-red-500 animate-pulse'
                                            : 'bg-gray-300 opacity-50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Temporizador */}
                        {gameState !== 'idle' && (
                            <div className="bg-white rounded-xl shadow p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-700 font-semibold text-sm">Tiempo</span>
                                </div>
                                <p className={`text-2xl font-bold ${timeLeft <= 30 ? 'text-red-600' : 'text-cyan-600'
                                    }`}>
                                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Game Board - Centro */}
                    <div className={`flex-1 bg-white rounded-xl shadow-lg p-6 min-h-[400px] flex items-center justify-center transition-all duration-500 ${lostLife ? 'animate-shake bg-red-50 border-2 border-red-300' : ''
                        } ${levelUp ? 'bg-green-50 border-2 border-green-400' : ''
                        }`}>
                        {gameState === 'idle' && (
                            <div className="text-center space-y-4">
                                <div className="text-5xl mb-2">🧠⚡</div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    ¡Hola, {userName}!
                                </h2>
                                <p className="text-gray-600 max-w-xs mx-auto text-sm">
                                    Repite la secuencia de bloques iluminados.
                                </p>
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg flex items-center space-x-2 mx-auto"
                                >
                                    <Play className="w-5 h-5" />
                                    <span>Comenzar</span>
                                </button>
                            </div>
                        )}

                        {(gameState === 'showing' || gameState === 'waiting') && (
                            <div className="space-y-4 relative w-full max-w-sm">
                                {/* Notificaciones */}
                                {levelUp && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                        <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-xl animate-bounce">
                                            <p className="text-xl font-bold">¡Nivel Completado!</p>
                                        </div>
                                    </div>
                                )}

                                {lostLife && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                        <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-xl animate-shake">
                                            <p className="text-xl font-bold">¡Vida Perdida!</p>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center mb-2">
                                    <p className="text-base font-semibold text-gray-700">
                                        {gameState === 'showing' ? '👀 Observa...' : '🎯 ¡Tu turno!'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mx-auto">
                                    {blocks.map((blockId) => {
                                        const isActive = activeBlock === blockId;
                                        const isCorrect = isActive && feedbackState === 'correct';
                                        const isWrong = isActive && feedbackState === 'wrong';

                                        return (
                                            <button
                                                key={blockId}
                                                onClick={() => handleBlockClick(blockId)}
                                                disabled={gameState !== 'waiting'}
                                                className={`aspect-square rounded-xl transition-all duration-300 transform flex items-center justify-center ${isCorrect
                                                    ? 'bg-green-400 scale-105 shadow-lg'
                                                    : isWrong
                                                        ? 'bg-red-400 scale-105 shadow-lg'
                                                        : isActive
                                                            ? 'bg-cyan-500 scale-105 shadow-lg'
                                                            : 'bg-gray-200 hover:bg-gray-300'
                                                    } ${gameState === 'waiting' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                            >
                                                <span className={`text-xl font-bold ${isActive ? 'text-white' : 'text-gray-700'
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
                            <div className="text-center space-y-4">
                                <div className="text-5xl mb-2">🏆</div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    ¡Fin del juego!
                                </h2>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-gray-700 text-sm">Nivel alcanzado:</p>
                                    <p className="text-4xl font-bold text-cyan-600">{maxLevel}</p>
                                </div>

                                <div className="flex flex-wrap gap-3 justify-center">
                                    <button
                                        onClick={startGame}
                                        className="px-5 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                                    >
                                        Jugar de Nuevo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Coach Sidebar - Derecha */}
                    <div className="w-full lg:w-64 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <h3 className="text-white font-bold text-base">Coach IA</h3>
                            </div>
                            <button
                                onClick={toggleAudio}
                                className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition-all"
                            >
                                {audioEnabled ? (
                                    <Volume2 className="w-4 h-4 text-white" />
                                ) : (
                                    <VolumeX className="w-4 h-4 text-white" />
                                )}
                            </button>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3 min-h-[80px]">
                            <p className="text-white text-xs leading-relaxed">{coachTip}</p>
                        </div>

                        <div className="space-y-2">
                            {gameState !== 'idle' && (
                                <button
                                    onClick={requestNewAdvice}
                                    disabled={coachTip === 'Analizando tu desempeño...'}
                                    className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-600 rounded text-gray-900 font-bold text-sm transition-all flex items-center justify-center space-x-2"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Consejo</span>
                                </button>
                            )}

                            <button
                                onClick={() => setShowMetrics(true)}
                                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2"
                            >
                                <BarChart3 className="w-3 h-3" />
                                <span>Métricas</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales */}
            {showMetrics && (
                <MetricsViewer
                    onClose={() => setShowMetrics(false)}
                    userId={userId}
                    userName={userName}
                />
            )}

            {showAnalysisHistory && (
                <AnalysisHistoryViewer
                    onClose={() => setShowAnalysisHistory(false)}
                    userId={userId}
                />
            )}
        </div>
    );
};
