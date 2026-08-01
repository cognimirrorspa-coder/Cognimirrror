// TetrisMirror.tsx - Rey del Tetris
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Brain, Sparkles, Volume2, VolumeX, BarChart3, RotateCw, ArrowDown, History } from 'lucide-react';
import { MirrorRecorder } from '../../data/MirrorRecorder';
import { saveCognitiveSession } from '../../data/firebase';
import { askCoach, toggleVoice } from '../../services/CoachAI';
import { metrics } from '../../services/metrics';
import { MetricsViewer } from '../common/MetricsViewer';
import { AnalysisHistoryViewer } from '../analysis/AnalysisHistoryViewer';
import { TetrisActionData, PieceData, TetrisMetrics, AnalysisGameSession } from '../../types';

interface TetrisMirrorProps {
  userId: string;
  userName: string;
  onBack: () => void;
  onGameComplete?: (session: AnalysisGameSession) => void;
}

// Tipos de piezas de Tetris
const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: '#00F0F0' },
  O: { shape: [[1, 1], [1, 1]], color: '#F0F000' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#A000F0' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00F000' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#F00000' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000F0' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#F0A000' }
};

type TetrominoType = keyof typeof TETROMINOS;

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 1000;

export const TetrisMirror = ({ userId, userName, onBack }: TetrisMirrorProps) => {
  const [recorder] = useState(() => new MirrorRecorder('tetris_mirror_v1', userId));
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<{
    type: TetrominoType;
    shape: number[][];
    x: number;
    y: number;
    color: string;
  } | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [coachTip, setCoachTip] = useState<string>('Cargando consejo...');
  const [showCoachPanel, setShowCoachPanel] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastMoveTimeRef = useRef<number>(Date.now());

  // Prevenir scroll con teclas de flecha y configurar audio
  useEffect(() => {
    const preventArrowScroll = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    // Evitar scroll en la página
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', preventArrowScroll);
    
    // Asegurar que el audio esté habilitado al iniciar
    toggleVoice(true);
    setAudioEnabled(true);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', preventArrowScroll);
      // Detener cualquier voz en reproducción al desmontar
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // Asegurar que no haya audio de Google TTS
      toggleVoice(false);
    };
  }, []);

  // Cargar mensaje de bienvenida del Coach
  useEffect(() => {
    const loadWelcomeMessage = async () => {
      try {
        const tip = await askCoach({
          userName,
          userAge: 12,
          mirrorType: 'Tetris Mirror',
          metrics: {
            persistencia: 0.5,
            eficiencia: 0.5,
            resiliencia: 0.5,
            adaptacion: 0.5
          },
          context: 'Está a punto de comenzar su primera sesión en Tetris Mirror - Rey del Tetris'
        }, audioEnabled);
        
        setCoachTip(tip);
      } catch (error) {
        console.error('Error cargando Coach:', error);
        setCoachTip('¡Bienvenido al Rey del Tetris! Demuestra tu velocidad de procesamiento y coordinación visoespacial.');
      }
    };
    loadWelcomeMessage();
  }, [userName, audioEnabled]);

  // Generar pieza aleatoria
  const getRandomPiece = (): TetrominoType => {
    const pieces = Object.keys(TETROMINOS) as TetrominoType[];
    return pieces[Math.floor(Math.random() * pieces.length)];
  };

  // Crear nueva pieza
  const createPiece = (type: TetrominoType) => {
    const tetromino = TETROMINOS[type];
    return {
      type,
      shape: tetromino.shape,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
      y: 0,
      color: tetromino.color
    };
  };

  // Verificar colisión
  const checkCollision = (piece: typeof currentPiece, offsetX = 0, offsetY = 0): boolean => {
    if (!piece) return false;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;

          if (
            newX < 0 ||
            newX >= BOARD_WIDTH ||
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Rotar pieza
  const rotatePiece = () => {
    if (!currentPiece || gameState !== 'playing') return;

    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );

    const rotatedPiece = { ...currentPiece, shape: rotated };

    if (!checkCollision(rotatedPiece)) {
      setCurrentPiece(rotatedPiece);
      recorder.recordEvent({
        type: 'rotation_detected',
        value: { piece: currentPiece.type }
      });
    }
  };

  // Mover pieza
  const movePiece = (dx: number, dy: number) => {
    if (!currentPiece || gameState !== 'playing') return;

    if (!checkCollision(currentPiece, dx, dy)) {
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
      // La pieza tocó el fondo
      lockPiece();
    }
  };

  // Caída rápida
  const dropPiece = () => {
    if (!currentPiece || gameState !== 'playing') return;

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

  // Fijar pieza en el tablero
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
    clearLines(newBoard);
    spawnNewPiece();
  };

  // Limpiar líneas completas
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

  // Generar nueva pieza
  const spawnNewPiece = () => {
    const pieceType = nextPiece || getRandomPiece();
    const newPiece = createPiece(pieceType);
    
    if (checkCollision(newPiece)) {
      // Game Over
      endGame();
      return;
    }

    setCurrentPiece(newPiece);
    setNextPiece(getRandomPiece());
  };

  // Iniciar juego
  const startGame = () => {
    recorder.start();
    metrics.startGame('tetris_mirror', { userId, userName });
    
    const initialBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
    setBoard(initialBoard);
    setScore(0);
    setLines(0);
    setLevel(1);
    setSpeed(INITIAL_SPEED);
    
    const firstPiece = getRandomPiece();
    setNextPiece(getRandomPiece());
    setCurrentPiece(createPiece(firstPiece));
    
    setGameState('playing');
    lastMoveTimeRef.current = Date.now();
  };

  // Finalizar juego
  const endGame = async () => {
    setGameState('gameover');
    
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    const session = recorder.end('completed', score);
    
    try {
      await saveCognitiveSession(session);
      metrics.endGame();

      const tip = await askCoach({
        userName,
        userAge: 12,
        mirrorType: 'Tetris Mirror',
        metrics: {
          persistencia: Math.min(1, lines / 50),
          eficiencia: Math.min(1, score / 5000),
          resiliencia: Math.min(1, level / 10),
          adaptacion: Math.min(1, lines / 40)
        },
        context: `Completó una sesión de Tetris. Puntuación: ${score}, Líneas: ${lines}, Nivel: ${level}`
      }, audioEnabled);
      
      setCoachTip(tip);
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        movePiece(0, 1);
      }, speed);

      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameState, speed, currentPiece, board]);

  // Controles de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
        case ' ':
          rotatePiece();
          break;
        case 'Enter':
          dropPiece();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, currentPiece, board]);

  // Renderizar tablero con pieza actual
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }
    
    return displayBoard;
  };
  
  // Manejador para el botón de volver
  const handleBack = () => {
    // Detener cualquier voz en reproducción
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Asegurar que no haya audio de Google TTS
    toggleVoice(false);
    // Limpiar el intervalo del juego si existe
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    // Llamar a la función onBack original
    onBack();
  };

  const displayBoard = renderBoard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900 py-1 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all text-white text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
            
            <div className="flex items-center space-x-2 text-white">
              <span className="text-2xl">👑</span>
              <div>
                <h1 className="text-xl font-bold leading-tight">Rey del Tetris</h1>
                <p className="text-xs text-amber-200">Velocidad y coordinación</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newState = !audioEnabled;
                setAudioEnabled(newState);
                toggleVoice(newState);
              }}
              className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all text-white"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all text-white"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Coach Panel */}
        {showCoachPanel && gameState !== 'gameover' && (
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                  <h3 className="text-xl font-bold text-white">Coach IA</h3>
                </div>
                <button
                  onClick={() => setShowCoachPanel(false)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-white/90 leading-relaxed">{coachTip}</p>
            </div>

            {/* Stats */}
            <div className="mt-3 bg-white/10 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Estadísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-white">
                  <span>Puntuación:</span>
                  <span className="font-bold text-yellow-300">{score}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Líneas:</span>
                  <span className="font-bold text-green-300">{lines}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Nivel:</span>
                  <span className="font-bold text-blue-300">{level}</span>
                </div>
              </div>
            </div>

            {/* Next Piece */}
            {nextPiece && gameState === 'playing' && (
              <div className="mt-3 bg-white/10 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Siguiente</h3>
                <div className="flex justify-center">
                  <div className="grid gap-1" style={{
                    gridTemplateColumns: `repeat(${TETROMINOS[nextPiece].shape[0].length}, 1fr)`
                  }}>
                    {TETROMINOS[nextPiece].shape.map((row, y) =>
                      row.map((cell, x) => (
                        <div
                          key={`${y}-${x}`}
                          className="w-6 h-6 rounded"
                          style={{
                            backgroundColor: cell ? TETROMINOS[nextPiece].color : 'transparent'
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Board */}
        <div className={`${(showCoachPanel && gameState !== 'gameover') || gameState === 'gameover' ? 'lg:col-span-2' : 'lg:col-span-3'} flex justify-center`}>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-white/20">
            {gameState === 'idle' && (
              <div className="text-center">
                <div className="mb-8">
                  <div className="text-6xl mb-4">👑</div>
                  <h2 className="text-3xl font-bold text-white mb-4">¿Listo para el desafío?</h2>
                  <p className="text-white/80 mb-2">Controles:</p>
                  <div className="text-white/70 text-sm space-y-1">
                    <p>← → : Mover</p>
                    <p>↓ : Bajar más rápido</p>
                    <p>↑ / Espacio: Rotar</p>
                    <p>Enter: Caída rápida</p>
                  </div>
                </div>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
                >
                  <Play className="w-6 h-6" />
                  <span>Comenzar</span>
                </button>
              </div>
            )}

            {(gameState === 'playing' || gameState === 'gameover') && (
              <div>
                {/* Tetris Board */}
                <div 
                  className="grid gap-[1px] bg-black/50 p-1 rounded-lg mb-4"
                  style={{
                    gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                    width: 'fit-content',
                    margin: '0 auto'
                  }}
                >
                  {displayBoard.map((row, y) =>
                    row.map((cell, x) => (
                      <div
                        key={`${y}-${x}`}
                        className="w-7 h-7 rounded-sm transition-colors"
                        style={{
                          backgroundColor: cell || 'rgba(255, 255, 255, 0.1)',
                          border: cell ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
                        }}
                      />
                    ))
                  )}
                </div>

                {/* Mobile Controls */}
                <div className="lg:hidden grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  <button
                    onClick={rotatePiece}
                    className="col-span-3 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold flex items-center justify-center space-x-2"
                  >
                    <RotateCw className="w-5 h-5" />
                    <span>Rotar</span>
                  </button>
                  <button
                    onClick={() => movePiece(-1, 0)}
                    className="py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => movePiece(0, 1)}
                    className="py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => movePiece(1, 0)}
                    className="py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold"
                  >
                    →
                  </button>
                  <button
                    onClick={dropPiece}
                    className="col-span-3 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold"
                  >
                    Caída Rápida
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Game Over Panel - Lado Derecho */}
        {gameState === 'gameover' && (
          <div className="lg:col-span-1">
            <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4">
              <h3 className="text-xl font-bold text-white mb-3">¡Juego Terminado!</h3>
              <div className="space-y-2 text-white/90 text-sm mb-4">
                <p>Puntuación: <span className="font-bold text-yellow-300">{score}</span></p>
                <p>Líneas: <span className="font-bold text-green-300">{lines}</span></p>
                <p>Nivel: <span className="font-bold text-blue-300">{level}</span></p>
              </div>
              <button
                onClick={startGame}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                Jugar de Nuevo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Viewer */}
      {showMetrics && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Métricas Cognitivas</h2>
                <button
                  onClick={() => setShowMetrics(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <MetricsViewer onClose={() => setShowMetrics(false)} userId={userId} userName={userName} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
