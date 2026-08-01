// TrainingDigitSpanMirror.tsx - Versión adaptada para el Campo de Entrenamiento
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Award, Hash } from 'lucide-react';
import { MirrorRecorder } from '../../data/MirrorRecorder';
import { saveCognitiveSession, db } from '../../data/firebase';
import { collection, doc, setDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { metrics } from '../../services/metrics';
import { toggleVoice } from '../../services/CoachAI';
import { TapData, RoundData, GameMetrics, AnalysisGameSession } from '../../types';

interface TrainingDigitSpanMirrorProps {
    userId: string;
    userName: string;
    onGameComplete?: (session: AnalysisGameSession) => void;
}

export const TrainingDigitSpanMirror = ({ userId, userName, onGameComplete }: TrainingDigitSpanMirrorProps) => {
    const [recorder] = useState(() => new MirrorRecorder('digit_span_v1', userId));
    const [gameState, setGameState] = useState<'idle' | 'showing' | 'input' | 'gameover'>('idle');
    const [sequence, setSequence] = useState<number[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const [currentLevel, setCurrentLevel] = useState(3);
    const [lives, setLives] = useState(3);
    const [maxLevel, setMaxLevel] = useState(3);
    const [currentDigitShowing, setCurrentDigitShowing] = useState<number | null>(null);
    const [lostLife, setLostLife] = useState(false);
    const [levelUp, setLevelUp] = useState(false);

    // === SISTEMA DE ANÁLISIS COGNITIVO ===
    const [allRounds, setAllRounds] = useState<RoundData[]>([]);
    const [currentRoundTaps, setCurrentRoundTaps] = useState<TapData[]>([]);
    const [roundStartTime, setRoundStartTime] = useState<string>('');
    const [attemptCountPerLevel, setAttemptCountPerLevel] = useState<Map<number, number>>(new Map());
    const sessionStartTimeRef = useRef<string>('');
    const roundStartPerfRef = useRef<number>(0);
    const firstInputTimeRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // === NUEVA ESTRUCTURA FIRESTORE ===
    const currentSessionIdRef = useRef<string | null>(null);
    const sessionDocRef = useRef<any>(null);

    // Prevenir scroll y limpiar voz al desmontar
    useEffect(() => {
        // Función de limpieza al desmontar el componente
        return () => {
            // Detener cualquier voz en reproducción
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            // Asegurar que no haya audio de Google TTS
            toggleVoice(false);
            // Limpiar cualquier temporizador pendiente
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    // Manejar input con teclado numérico físico
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (gameState !== 'input') return;

            const key = e.key;
            if (key >= '0' && key <= '9') {
                e.preventDefault();
                handleDigitInput(key);
            } else if (key === 'Enter') {
                handleSubmit();
            } else if (key === 'Backspace') {
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState, userInput]);

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
                gameId: 'digit_span_v1', // Identificador del juego
                gameName: 'Digit Span Mirror',
                duracion_segundos: 0,
                nivel_maximo: 3,
                aciertos: 0,
                errores: 0,
                tasa_error: 0,
                persistencia_intentos: 0,
                completada: false
            });

            console.log('✅ Sesión Digit Span inicializada en Firestore:', newSessionRef.id);
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
            const totalAttempts = allRounds.length;
            const failedAttempts = allRounds.filter(r => !r.isCorrect).length;
            const errorRate = totalAttempts > 0 ? failedAttempts / totalAttempts : 0;

            const durationSeconds = (Date.now() - new Date(sessionStartTimeRef.current).getTime()) / 1000;

            await updateDoc(sessionDocRef.current, {
                duracion_segundos: durationSeconds,
                nivel_maximo: maxLevel,
                aciertos: allRounds.filter(r => r.isCorrect).length,
                errores: failedAttempts,
                tasa_error: errorRate,
                persistencia_intentos: totalAttempts,
                completada: final
            });
        } catch (error) {
            console.error('❌ Error actualizando estadísticas:', error);
        }
    };

    const startGame = () => {
        recorder.start();
        metrics.startGame('digit_span', { userId, userName });

        initializeSession();

        sessionStartTimeRef.current = new Date().toISOString();
        setAllRounds([]);
        setCurrentRoundTaps([]);
        setAttemptCountPerLevel(new Map());

        setGameState('showing');
        setCurrentLevel(3);
        setLives(3);
        setMaxLevel(3);
        setUserInput('');
        generateSequence(3);
    };

    const generateSequence = (length: number) => {
        const newSeq: number[] = [];
        for (let i = 0; i < length; i++) {
            newSeq.push(Math.floor(Math.random() * 10)); // 0-9
        }
        setSequence(newSeq);

        recorder.recordEvent({
            type: 'sequence_start',
            value: { length, sequence: newSeq }
        });

        recordGameEvent('inicio_nivel', {
            nivel: length,
            intentos_en_este_nivel: attemptCountPerLevel.get(length) || 0
        });

        speakSequence(newSeq);
    };

    const speakSequence = async (seq: number[]) => {
        setRoundStartTime(new Date().toISOString());
        roundStartPerfRef.current = performance.now();
        firstInputTimeRef.current = 0;
        setCurrentRoundTaps([]);

        if ('speechSynthesis' in window) {
            // Obtener voz española femenina
            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(voice =>
                voice.lang.startsWith('es') && voice.name.includes('Female')
            ) || voices.find(voice => voice.lang.startsWith('es'));

            for (let i = 0; i < seq.length; i++) {
                await new Promise(resolve => setTimeout(resolve, i === 0 ? 1000 : 1500));

                // Mostrar número visualmente
                setCurrentDigitShowing(seq[i]);

                const utterance = new SpeechSynthesisUtterance(seq[i].toString());
                utterance.lang = 'es-ES';
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                if (spanishVoice) {
                    utterance.voice = spanishVoice;
                }
                window.speechSynthesis.speak(utterance);

                await new Promise(resolve => setTimeout(resolve, 1200));
                setCurrentDigitShowing(null);
            }

            setTimeout(() => {
                setGameState('input');
            }, 1000);
        } else {
            // Fallback: mostrar números visualmente
            for (let i = 0; i < seq.length; i++) {
                await new Promise(resolve => setTimeout(resolve, i === 0 ? 1000 : 1500));
                setCurrentDigitShowing(seq[i]);
                await new Promise(resolve => setTimeout(resolve, 1200));
                setCurrentDigitShowing(null);
            }
            setGameState('input');
        }
    };

    const handleDigitInput = (digit: string) => {
        if (gameState !== 'input') return;

        const newInput = userInput + digit;
        setUserInput(newInput);

        if (firstInputTimeRef.current === 0) {
            firstInputTimeRef.current = performance.now();
        }

        const tapTimestamp = performance.now();
        const position = newInput.length - 1;
        const expected = sequence[position];
        const isCorrect = parseInt(digit) === expected;

        const tapData: TapData = {
            timestamp: tapTimestamp,
            blockId: parseInt(digit),
            expected,
            isCorrect,
            position
        };

        setCurrentRoundTaps(prev => [...prev, tapData]);
    };

    const handleDelete = () => {
        if (gameState !== 'input' || userInput.length === 0) return;
        setUserInput(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (gameState !== 'input' || userInput.length === 0) return;
        checkAnswer(userInput, [...currentRoundTaps]);
    };

    const checkAnswer = (answer: string, taps: TapData[]) => {
        const isCorrect = answer === sequence.join('');

        finalizeRound(isCorrect, taps);

        if (isCorrect) {
            const newLevel = currentLevel + 1;
            const newMaxLevel = Math.max(maxLevel, newLevel);

            setCurrentLevel(newLevel);
            setMaxLevel(newMaxLevel);

            // Activar animación de level up
            setLevelUp(true);
            setTimeout(() => setLevelUp(false), 1000);

            recorder.recordEvent({
                type: 'level_up',
                value: { level: currentLevel, newLevel }
            });

            recordGameEvent('nivel_completado', {
                nivel: currentLevel,
                correcto: true,
                intentos_en_este_nivel: attemptCountPerLevel.get(currentLevel) || 0
            });

            updateSessionStats(false);

            setTimeout(() => {
                setUserInput('');
                setGameState('showing');
                generateSequence(newLevel);
            }, 1500);
        } else {
            const newLives = lives - 1;
            setLives(newLives);

            // Activar animación de perder vida
            setLostLife(true);
            setTimeout(() => setLostLife(false), 800);

            recorder.recordEvent({
                type: 'mistake',
                value: { level: currentLevel, livesRemaining: newLives }
            });

            recordGameEvent('error', {
                nivel: currentLevel,
                correcto: false,
                intentos_en_este_nivel: attemptCountPerLevel.get(currentLevel) || 0
            });

            updateSessionStats(false);

            if (newLives === 0) {
                endGame();
            } else {
                setTimeout(() => {
                    setUserInput('');
                    setGameState('showing');
                    generateSequence(currentLevel);
                }, 1500);
            }
        }
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

    const calculateGameMetrics = (rounds: RoundData[], sessionStart: string): GameMetrics => {
        const sessionEnd = new Date().toISOString();
        const totalSessionTime = (new Date(sessionEnd).getTime() - new Date(sessionStart).getTime()) / 1000;

        const successfulRounds = rounds.filter(r => r.isCorrect);
        const totalAttempts = rounds.length;
        const successfulAttempts = successfulRounds.length;

        const maxSpan = successfulRounds.length > 0
            ? Math.max(...successfulRounds.map(r => r.level))
            : 0;

        const errorRate = totalAttempts > 0
            ? ((rounds.length - successfulRounds.length) / totalAttempts) * 100
            : 0;

        const persistence = rounds.filter(r => r.attempt > 1).length;

        let allInterTapIntervals: number[] = [];
        successfulRounds.forEach(round => {
            const correctTaps = round.taps.filter(t => t.isCorrect);
            for (let i = 1; i < correctTaps.length; i++) {
                allInterTapIntervals.push(correctTaps[i].timestamp - correctTaps[i - 1].timestamp);
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
                    if (i > 0) preErrorIntervals.push(allTaps[i].timestamp - allTaps[i - 1].timestamp);
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

    const endGame = async () => {
        setGameState('gameover');

        metrics.endGame(true, { level: maxLevel, score: maxLevel });

        const session = recorder.end('completed', maxLevel, {
            livesUsed: 3 - lives,
            finalLevel: currentLevel
        });

        try {
            await saveCognitiveSession(session);
        } catch (error) {
            console.error('Error guardando sesión:', error);
        }

        updateSessionStats(true);

        const gameMetrics = calculateGameMetrics(allRounds, sessionStartTimeRef.current);

        const analysisSession: AnalysisGameSession = {
            gameId: 'digit_span_v1',
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
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Hash className="w-6 h-6" />
                    <h2 className="text-lg font-bold">Digit Span - Entrenamiento</h2>
                </div>
                <div className="text-sm opacity-90">
                    Usuario: {userName}
                </div>
            </div>

            <div className="p-6 bg-gray-50">
                {/* Layout Principal */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Stats Sidebar */}
                    <div className="w-full lg:w-48 space-y-4">
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 font-semibold text-sm">Nivel</span>
                                <Hash className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-3xl font-bold text-green-600">{currentLevel}</p>
                        </div>

                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 font-semibold text-sm">Vidas</span>
                            </div>
                            <div className="flex space-x-1 mb-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full ${i < lives ? 'bg-red-500 animate-pulse' : 'bg-gray-300 opacity-50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 font-semibold text-sm">Mejor</span>
                                <Award className="w-4 h-4 text-yellow-600" />
                            </div>
                            <p className="text-3xl font-bold text-yellow-600">{maxLevel}</p>
                        </div>
                    </div>

                    {/* Game Board */}
                    <div className={`flex-1 bg-white rounded-xl shadow-lg p-6 min-h-[400px] flex items-center justify-center transition-all duration-500 ${lostLife ? 'animate-shake bg-red-50 border-2 border-red-300' : ''
                        } ${levelUp ? 'bg-green-50 border-2 border-green-400' : ''
                        }`}>
                        {gameState === 'idle' && (
                            <div className="text-center space-y-4">
                                <div className="text-5xl mb-2">🔢🎧</div>
                                <h2 className="text-xl font-bold text-gray-900">¡Hola, {userName}!</h2>
                                <p className="text-gray-600 max-w-xs mx-auto text-sm">
                                    Escucha la secuencia y repítela.
                                </p>
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-teal-700 transition-all shadow-lg flex items-center space-x-2 mx-auto"
                                >
                                    <Play className="w-5 h-5" />
                                    <span>Comenzar</span>
                                </button>
                            </div>
                        )}

                        {gameState === 'showing' && (
                            <div className="text-center space-y-6">
                                {currentDigitShowing !== null ? (
                                    <div className="text-8xl font-bold text-green-600 animate-pulse">
                                        {currentDigitShowing}
                                    </div>
                                ) : (
                                    <div className="text-5xl mb-4 animate-pulse">🎧</div>
                                )}
                                <h2 className="text-xl font-bold text-gray-900">Escucha...</h2>
                            </div>
                        )}

                        {gameState === 'input' && (
                            <div className="text-center space-y-4 w-full max-w-sm">
                                <h2 className="text-lg font-bold text-gray-900">¡Tu turno!</h2>

                                {/* Display Input */}
                                <div className="bg-gray-100 rounded-lg p-3">
                                    <p className="text-3xl font-bold text-gray-900 tracking-widest min-h-[40px] flex items-center justify-center">
                                        {userInput || '_ '.repeat(sequence.length)}
                                    </p>
                                </div>

                                {/* Number Pad */}
                                <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((digit, index) => {
                                        if (digit === '⌫') {
                                            return (
                                                <button
                                                    key="delete"
                                                    onClick={handleDelete}
                                                    disabled={userInput.length === 0}
                                                    className="aspect-square bg-red-100 hover:bg-red-200 rounded-lg text-lg font-bold text-red-800 transition-all disabled:opacity-50"
                                                >
                                                    ⌫
                                                </button>
                                            );
                                        } else if (digit === '✓') {
                                            return (
                                                <button
                                                    key="submit"
                                                    onClick={handleSubmit}
                                                    disabled={userInput.length === 0}
                                                    className="aspect-square bg-green-100 hover:bg-green-200 rounded-lg text-lg font-bold text-green-800 transition-all disabled:opacity-50"
                                                >
                                                    ✓
                                                </button>
                                            );
                                        }
                                        return (
                                            <button
                                                key={digit}
                                                onClick={() => handleDigitInput(digit.toString())}
                                                disabled={userInput.length >= sequence.length}
                                                className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-bold text-gray-800 transition-all disabled:opacity-50"
                                            >
                                                {digit}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {gameState === 'gameover' && (
                            <div className="text-center space-y-4">
                                <div className="text-5xl mb-2">🏆</div>
                                <h2 className="text-2xl font-bold text-gray-900">¡Fin del juego!</h2>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-gray-700 text-sm">Nivel alcanzado:</p>
                                    <p className="text-4xl font-bold text-green-600">{maxLevel}</p>
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <button
                                        onClick={startGame}
                                        className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Jugar de Nuevo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
