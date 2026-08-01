import { useState, useEffect, useCallback, useRef } from 'react';

const VALID_FACES = ['U', 'D', 'R', 'L', 'F'];

export function useVisuospatialTest() {
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
   * Generador de Secuencia Corsi
   * Genera un array aleatorio de caras basándose en el nivel.
   * Evita repeticiones consecutivas (ej. NO ['R', 'R']).
   */
  const generateSequence = useCallback((span) => {
    const newSeq = [];
    let lastFace = null;
    for (let i = 0; i < span; i++) {
      let nextFace;
      do {
        nextFace = VALID_FACES[Math.floor(Math.random() * VALID_FACES.length)];
      } while (nextFace === lastFace);
      newSeq.push(nextFace);
      lastFace = nextFace;
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

  /**
   * Reproducción de Secuencia (Gemelo Digital)
   * Recorre la secuencia actual encendiendo/apagando caras.
   */
  useEffect(() => {
    if (gameState === 'showing_sequence' && sequence.length > 0) {
      let index = 0;
      let isMounted = true;

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
            }, 400); // Se mantiene apagada por 400ms
          }, 800); // Se mantiene encendida por 800ms
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

      // Limpiar cualquier timeout residual antes de arrancar
      if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
      playNext();

      return () => {
        isMounted = false;
        if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
      };
    }
  }, [gameState, sequence]);

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

    // ── FILTRO INERCIAL DE RE-ALINEACIÓN (1200ms COOLDOWN) ──
    // Evita que el movimiento de retorno (ej: girar U y volver con U') se cuente como un doble giro
    if (normalizedFace === lastInputFaceRef.current && (now - lastInputTimeRef.current) < 1200) {
      console.warn(`[Corsi Filter] Descartando giro de re-alineación consecutiva en la cara ${normalizedFace}`);
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
