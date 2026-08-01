# 🎮 GUÍA: IMPLEMENTAR ANÁLISIS COGNITIVO EN TETRIS

## ✅ YA COMPLETADO

1. ✅ Scroll eliminado (overflow hidden + prevent default en flechas)
2. ✅ Callback `onGameComplete` conectado en App.tsx
3. ✅ Interfaces TypeScript creadas (TetrisMetrics, PieceData, TetrisActionData)

---

## 📋 CÓDIGO FALTANTE: AGREGAR EN TetrisMirror.tsx

### **1. ESTADOS DE TRACKING (después de línea 57)**

```typescript
  const [showMetrics, setShowMetrics] = useState(false);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);

  // === SISTEMA DE ANÁLISIS COGNITIVO TETRIS ===
  const [allPieces, setAllPieces] = useState<PieceData[]>([]);
  const [currentPieceActions, setCurrentPieceActions] = useState<TetrisActionData[]>([]);
  const [pieceSpawnTime, setPieceSpawnTime] = useState<string>('');
  const [firstActionTime, setFirstActionTime] = useState<number | null>(null);
  const [pieceNumber, setPieceNumber] = useState(0);
  const sessionStartTimeRef = useRef<string>('');
  const pieceSpawnPerfRef = useRef<number>(0);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastMoveTimeRef = useRef<number>(Date.now());
```

### **2. INICIALIZAR EN startGame() (modificar función existente)**

```typescript
const startGame = () => {
  // ... código existente ...
  
  // Inicializar sistema de análisis
  sessionStartTimeRef.current = new Date().toISOString();
  setAllPieces([]);
  setCurrentPieceActions([]);
  setPieceNumber(0);
  
  // ... resto del código ...
};
```

### **3. CAPTURA DE ACCIONES**

Agregar esto en cada función de movimiento:

**En rotatePiece():**
```typescript
const rotatePiece = () => {
  if (!currentPiece || gameState !== 'playing') return;

  const rotated = currentPiece.shape[0].map((_, i) =>
    currentPiece.shape.map(row => row[i]).reverse()
  );

  const rotatedPiece = { ...currentPiece, shape: rotated };

  if (!checkCollision(rotatedPiece)) {
    // NUEVO: Registrar acción
    const action: TetrisActionData = {
      timestamp: performance.now(),
      actionType: 'rotate',
      pieceType: currentPiece.type,
      position: { x: currentPiece.x, y: currentPiece.y }
    };
    setCurrentPieceActions(prev => [...prev, action]);
    
    // Registrar primer movimiento
    if (!firstActionTime) {
      setFirstActionTime(performance.now());
    }
    
    setCurrentPiece(rotatedPiece);
    recorder.recordEvent({
      type: 'rotation_detected',
      value: { piece: currentPiece.type }
    });
  }
};
```

**En movePiece():**
```typescript
const movePiece = (dx: number, dy: number) => {
  if (!currentPiece || gameState !== 'playing') return;

  if (!checkCollision(currentPiece, dx, dy)) {
    // NUEVO: Registrar acción
    const actionType: 'move_left' | 'move_right' | 'soft_drop' = 
      dx < 0 ? 'move_left' : dx > 0 ? 'move_right' : 'soft_drop';
    
    const action: TetrisActionData = {
      timestamp: performance.now(),
      actionType,
      pieceType: currentPiece.type,
      position: { x: currentPiece.x, y: currentPiece.y }
    };
    setCurrentPieceActions(prev => [...prev, action]);
    
    if (!firstActionTime) {
      setFirstActionTime(performance.now());
    }
    
    setCurrentPiece({
      ...currentPiece,
      x: currentPiece.x + dx,
      y: currentPiece.y + dy
    });
    
    if (dy > 0) {
      lastMoveTimeRef.current = Date.now();
    }

    recorder.recordEvent({
      type: 'move_executed',
      value: { dx, dy, piece: currentPiece.type }
    });
  } else if (dy > 0) {
    lockPiece();
  }
};
```

**En dropPiece():**
```typescript
const dropPiece = () => {
  if (!currentPiece || gameState !== 'playing') return;

  // NUEVO: Registrar acción
  const action: TetrisActionData = {
    timestamp: performance.now(),
    actionType: 'drop',
    pieceType: currentPiece.type,
    position: { x: currentPiece.x, y: currentPiece.y }
  };
  setCurrentPieceActions(prev => [...prev, action]);

  let dropDistance = 0;
  while (!checkCollision(currentPiece, 0, dropDistance + 1)) {
    dropDistance++;
  }

  setCurrentPiece({
    ...currentPiece,
    y: currentPiece.y + dropDistance
  });

  setTimeout(() => lockPiece(), 50);
};
```

### **4. FINALIZAR PIEZA EN lockPiece()**

```typescript
const lockPiece = () => {
  if (!currentPiece) return;

  const newBoard = board.map(row => [...row]);
  
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (currentPiece.shape[y][x]) {
        const boardY = currentPiece.y + y;
        const boardX = currentPiece.x + x;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = currentPiece.color;
        }
      }
    }
  }

  setBoard(newBoard);
  
  // NUEVO: Finalizar datos de la pieza
  const lockTime = new Date().toISOString();
  const lockPerf = performance.now();
  
  const thinkingTime = firstActionTime 
    ? firstActionTime - pieceSpawnPerfRef.current 
    : 0;
  
  const totalTime = (lockPerf - pieceSpawnPerfRef.current) / 1000;
  
  const pieceData: PieceData = {
    pieceNumber: pieceNumber + 1,
    pieceType: currentPiece.type,
    spawnTime: pieceSpawnTime,
    lockTime,
    thinkingTime,
    totalTime,
    actions: currentPieceActions,
    linesCleared: 0, // Se actualiza en clearLines
    levelAtPlacement: level
  };
  
  setAllPieces(prev => [...prev, pieceData]);
  
  clearLines(newBoard);
  spawnNewPiece();
};
```

### **5. ACTUALIZAR clearLines()**

```typescript
const clearLines = (currentBoard: (string | null)[][]) => {
  let linesCleared = 0;
  const newBoard = currentBoard.filter(row => {
    if (row.every(cell => cell !== null)) {
      linesCleared++;
      return false;
    }
    return true;
  });

  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }

  if (linesCleared > 0) {
    // NUEVO: Actualizar última pieza con líneas eliminadas
    setAllPieces(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1].linesCleared = linesCleared;
      return updated;
    });
    
    const points = [0, 100, 300, 500, 800][linesCleared];
    setScore(prev => prev + points * level);
    setLines(prev => {
      const newLines = prev + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        setSpeed(Math.max(100, INITIAL_SPEED - (newLevel - 1) * 100));
        recorder.recordEvent({
          type: 'level_up',
          value: { level: newLevel }
        });
      }
      return newLines;
    });

    setBoard(newBoard);
  }
};
```

### **6. ACTUALIZAR spawnNewPiece()**

```typescript
const spawnNewPiece = () => {
  const pieceType = nextPiece || getRandomPiece();
  const newPiece = createPiece(pieceType);

  if (checkCollision(newPiece)) {
    // Game Over
    setGameState('gameover');
    endGame();
    return;
  }

  // NUEVO: Inicializar tracking de nueva pieza
  setPieceSpawnTime(new Date().toISOString());
  pieceSpawnPerfRef.current = performance.now();
  setCurrentPieceActions([]);
  setFirstActionTime(null);
  setPieceNumber(prev => prev + 1);

  setCurrentPiece(newPiece);
  setNextPiece(getRandomPiece());
};
```

### **7. FUNCIÓN calculateTetrisMetrics()**

```typescript
const calculateTetrisMetrics = (pieces: PieceData[], sessionStart: string): TetrisMetrics => {
  const sessionEnd = new Date().toISOString();
  const totalSessionTime = (new Date(sessionEnd).getTime() - new Date(sessionStart).getTime()) / 1000;
  
  const allActions = pieces.flatMap(p => p.actions);
  
  // CAPA 1: Rendimiento
  const finalScore = score;
  const totalLines = lines;
  const maxLevel = level;
  const totalPieces = pieces.length;
  const piecesPerMinute = totalSessionTime > 0 ? (totalPieces / (totalSessionTime / 60)) : 0;
  
  // CAPA 2: Proceso
  const avgThinkingTime = pieces.length > 0
    ? pieces.reduce((sum, p) => sum + p.thinkingTime, 0) / pieces.length
    : 0;
  
  const avgActionsPerPiece = pieces.length > 0
    ? allActions.length / pieces.length
    : 0;
  
  // Fluidez: tiempo promedio entre acciones
  let actionIntervals: number[] = [];
  allActions.forEach((action, i) => {
    if (i > 0) {
      actionIntervals.push(action.timestamp - allActions[i - 1].timestamp);
    }
  });
  const cognitiveFluency = actionIntervals.length > 0
    ? actionIntervals.reduce((sum, val) => sum + val, 0) / actionIntervals.length
    : 0;
  
  // Adaptación: comparar performance entre primeras y últimas 10 piezas
  const firstPieces = pieces.slice(0, 10);
  const lastPieces = pieces.slice(-10);
  const firstAvgTime = firstPieces.reduce((sum, p) => sum + p.totalTime, 0) / Math.max(firstPieces.length, 1);
  const lastAvgTime = lastPieces.reduce((sum, p) => sum + p.totalTime, 0) / Math.max(lastPieces.length, 1);
  const adaptationIndex = firstAvgTime > 0 
    ? ((firstAvgTime - lastAvgTime) / firstAvgTime) * 100
    : 0;
  
  // Auto-corrección: (placeholder, similar a Memory Mirror)
  const selfCorrectionIndex = 0;
  
  return {
    finalScore,
    totalLines,
    maxLevel,
    totalSessionTime,
    totalPieces,
    piecesPerMinute,
    averageThinkingTime: avgThinkingTime,
    averageActionsPerPiece: avgActionsPerPiece,
    cognitiveFluency,
    adaptationIndex,
    selfCorrectionIndex,
    allActions,
    piecesData: pieces
  };
};
```

### **8. MODIFICAR endGame()**

```typescript
const endGame = async () => {
  if (gameLoopRef.current) {
    clearTimeout(gameLoopRef.current);
  }
  setGameState('gameover');
  
  const session = recorder.end('completed', score, {
    level,
    lines,
    score
  });

  try {
    await saveCognitiveSession(session);
  } catch (error) {
    console.error('Error guardando sesión:', error);
  }

  // NUEVO: Generar análisis cognitivo
  const tetrisMetrics = calculateTetrisMetrics(allPieces, sessionStartTimeRef.current);
  
  const analysisSession: AnalysisGameSession = {
    gameId: 'tetris_mirror_v1',
    userId,
    userName,
    startTime: sessionStartTimeRef.current,
    endTime: new Date().toISOString(),
    metrics: tetrisMetrics,
    rounds: allPieces
  };
  
  if (onGameComplete) {
    onGameComplete(analysisSession);
    console.log('📤 [Tetris] Sesión de análisis enviada');
  }

  setShowCoachPanel(true);
  // ... resto del código de Coach ...
};
```

---

## 🎯 RESUMEN

Con este código, Tetris tendrá el mismo nivel de análisis que Memory Mirror:

### **Datos Capturados:**
- ✅ Timestamp de cada acción (rotate, move, drop)
- ✅ Tiempo de pensamiento (spawn → primer movimiento)
- ✅ Total de acciones por pieza
- ✅ Líneas eliminadas por pieza
- ✅ Nivel al colocar cada pieza

### **Métricas Calculadas:**
- **Rendimiento:** Score, Líneas, Nivel, Piezas/minuto
- **Proceso:** Tiempo de pensamiento, Acciones/pieza, Fluidez, Adaptación

### **Guardado:**
- ✅ Firebase (automático)
- ✅ LocalStorage (backup)
- ✅ Visible en Historial Cognitivo

---

## 📝 PRÓXIMOS PASOS

1. ✅ Copiar código de arriba en TetrisMirror.tsx
2. Actualizar MirrorHub para recomendar Tetris
3. Crear Dashboard del Observador
