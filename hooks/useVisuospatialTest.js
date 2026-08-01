import { useState, useEffect, useCallback, useRef } from 'react';

const VALID_FACES = ['U', 'D', 'R', 'L', 'F', 'B'];

export function useVisuospatialTest(isConnected = true, requireBluetooth = true) {
  const [gameState, setGameState] = useState('idle'); // idle, showing_sequence, waiting_for_user, finished
  const [level, setLevel] = useState(2); // Comienza en nivel 2 (span de longitud 2)
  const [trial, setTrial] = useState('A'); // 'A' o 'B' para el doble intento clínico
  const [sequence, setSequence] = useState([]);
  const [activeFace, setActiveFace] = useState(null); // Cara encendida en el Gemelo Digital
  const [userIndex, setUserIndex] = useState(0); // Posición actual que el usuario debe replicar
  const [showingIndex, setShowingIndex] = useState(-1); // Índice de secuencia mostrando
  const [errorsInLevel, setErrorsInLevel] = useState(0); // Cantidad de fallas en el nivel actual
  const [telemetry, setTelemetry] = useState([]);
  const [currentLatencies, setCurrentLatencies] = useState([]); // Array de latencias del intento actual

  // Refs para métricas de tiempo y descarte de re-alineación (filtro anti-rebote de retorno)
  const lastEventTimeRef = useRef(null);
  const playbackTimeoutRef = useRef(null);
  
  // Filtro de re-alineación de capas (cooldown de 1200ms para caras consecutivas idénticas)
  const lastInputFaceRef = useRef(null);
  const lastInputTimeRef = useRef(0);

  /**
   * Generador de Secuencia Corsi Mejorado
   * Ninguna cara puede repetirse en los últimos 2 movimientos (evita U, L, U).
   */
  const generateSequence = useCallback((span) => {
    const newSeq = [];
    for (let i = 0; i < span; i++) {
      let nextFace;
      do {
        nextFace = VALID_FACES[Math.floor(Math.random() * VALID_FACES.length)];
      } while (
        (newSeq.length > 0 && nextFace === newSeq[newSeq.length - 1]) ||
        (newSeq.length > 1 && nextFace === newSeq[newSeq.length - 2])
      );
      newSeq.push(nextFace);
    }
    return newSeq;
  }, []);

  const startGame = useCallback(() => {
    setLevel(2);
    setTrial('A');
    setErrorsInLevel(0);
    setTelemetry([]);
    setSequence(generateSequence(2));
    setGameState('showing_sequence');
    setCurrentLatencies([]);
    lastInputFaceRef.current = null;
    lastInputTimeRef.current = 0;
  }, [generateSequence]);

  // --- PAUSA POR DESCONEXIÓN BLE ---
  useEffect(() => {
    if (requireBluetooth && !isConnected && gameState !== 'idle' && gameState !== 'finished') {
      if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
      setActiveFace(null);
      setShowingIndex(-1);
      setGameState('showing_sequence');
      setUserIndex(0);
    }
  }, [isConnected, gameState, requireBluetooth]);

  /**
   * Reproducción de Secuencia (Gemelo Digital)
   * Recorre la secuencia actual encendiendo/apagando caras tras un retrazo inicial de observación de 1.8s.
   */
  useEffect(() => {
    if (requireBluetooth && !isConnected) return; // Si no hay conexión, pausar reproducción

    if (gameState === 'showing_sequence' && sequence.length > 0) {
      let index = 0;
      let isMounted = true;
      setActiveFace(null);
      setShowingIndex(-1);

      // Alerta de 1.8s ("OBSERVA LA SECUENCIA EN EL CUBO ARMADO") antes de iniciar los movimientos
      const initialDelayTimeout = setTimeout(() => {
        if (!isMounted) return;

        const playNext = () => {
          if (!isMounted) return;
          
          if (index < sequence.length) {
            // Encender cara
            setActiveFace(sequence[index]);
            setShowingIndex(index);
            playbackTimeoutRef.current = setTimeout(() => {
              if (!isMounted) return;
              // Apagar cara
              setActiveFace(null);
              playbackTimeoutRef.current = setTimeout(() => {
                index++;
                playNext();
              }, 450); // Se mantiene apagada por 450ms
            }, 900); // Se mantiene encendida por 900ms para lectura clara
          } else {
            // Terminó la reproducción de la secuencia
            setActiveFace(null);
            setShowingIndex(-1);
            setGameState('waiting_for_user');
            setUserIndex(0);
            
            // Limpiar caché de input para nueva respuesta del usuario
            lastInputFaceRef.current = null;
            lastInputTimeRef.current = 0;
            
            // Timestamp crítico: Comienza el reloj para la latencia del primer input del usuario
            lastEventTimeRef.current = performance.now();
          }
        };

        playNext();
      }, 1800);

      return () => {
        isMounted = false;
        clearTimeout(initialDelayTimeout);
        if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
      };
    }
  }, [gameState, sequence, isConnected, requireBluetooth]);

  /**
   * Manejador de Input del Usuario
   * Se dispara externamente vía giros de caras del cubo inteligente.
   */
  const handleCubeInput = useCallback((face) => {
    // Si la señal BLE incluye modificadores como prima (ej. "R'"), los limpiamos.
    const normalizedFace = face.replace("'", "");

    // Solo registrar si estamos esperando input y es una cara válida.
    if (gameState !== 'waiting_for_user' || !VALID_FACES.includes(normalizedFace)) {
      return;
    }

    const now = performance.now();

    // ── FILTRO DE RE-ALINEACIÓN DE MISMA CARA (1200ms COOLDOWN) ──
    // Si el usuario mueve R y luego R' para volver a su lugar (o R+R por error),
    // dentro de 1.2 segundos el segundo giro de la MISMA cara se descarta completamente.
    // Esto evita fallos injustos cuando el usuario corrige el giro de vuelta.
    if (normalizedFace === lastInputFaceRef.current && (now - lastInputTimeRef.current) < 1200) {
      console.warn(`[Corsi Filter] Descartando re-alineación de la cara ${normalizedFace} (dentro de 1.2s)`);
      return;
    }

    lastInputFaceRef.current = normalizedFace;
    lastInputTimeRef.current = now;

    const latency = now - lastEventTimeRef.current;
    
    // Actualizamos la marca de tiempo para medir la latencia del SIGUIENTE movimiento
    lastEventTimeRef.current = now; 

    const expectedFace = sequence[userIndex];
    const isCorrect = normalizedFace === expectedFace;

    let errorType = null;
    let avgLatency = 0;
    const currentLatencyMs = Math.round(latency);

    if (isCorrect) {
      setCurrentLatencies(prev => [...prev, currentLatencyMs]);
    } else {
      // Clasificación clínica del error (Análisis de Vulnerabilidad de Secuencia)
      const halfLength = sequence.length / 2;
      if (userIndex < halfLength) {
        errorType = 'primacy';
      } else {
        errorType = 'recency';
      }
    }

    // Guardar telemetría del turno individual
    setTelemetry(prev => [...prev, {
      level,
      trial,
      expectedFace,
      userFace: normalizedFace,
      isCorrect,
      latencyMs: currentLatencyMs,
      moveLatencies: isCorrect ? [...currentLatencies, currentLatencyMs] : currentLatencies,
      errorType,
      timestamp: Date.now()
    }]);

    if (isCorrect) {
      // Si completó la secuencia actual con éxito
      if (userIndex + 1 === sequence.length) {
        // ¡NIVEL COMPLETADO!
        setGameState('level_up_delay');
        setTimeout(() => {
          const nextLevel = level + 1;
          setLevel(nextLevel);
          setTrial('A'); // Volvemos al Intento A para el nuevo nivel
          setErrorsInLevel(0); // Reiniciamos errores para el nuevo nivel
          setCurrentLatencies([]); // Limpiamos latencias para el nuevo nivel
          setSequence(generateSequence(nextLevel));
          setGameState('showing_sequence');
        }, 2500);
      } else {
        // Avanza al siguiente paso de la secuencia
        setUserIndex(userIndex + 1);
      }
    } else {
      // ── FALLA EN LA SECUENCIA ──
      const newErrorsCount = errorsInLevel + 1;
      setErrorsInLevel(newErrorsCount);
      
      setGameState('error_delay');
      
      setTimeout(() => {
        setCurrentLatencies([]); // Limpiar latencias para el nuevo intento
        if (trial === 'A') {
          // Falló en Intento A: Pasa a Intento B del mismo nivel
          setTrial('B');
          setSequence(generateSequence(level));
          setGameState('showing_sequence');
        } else {
          // Falló en Intento B: Habiendo fallado ambos intentos (A y B), el test termina
          setGameState('finished');
        }
      }, 2500);
    }
  }, [gameState, sequence, userIndex, level, trial, errorsInLevel, generateSequence]);

  return {
    gameState,
    level,
    trial,
    sequence,
    activeFace, // Cara encendida para Gemelo Digital
    userIndex,
    showingIndex,
    errorsInLevel,
    telemetry,
    startGame,
    handleCubeInput
  };
}
