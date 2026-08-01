//RubikCube.tsx
import { useState, useEffect } from 'react';
import {
  RotateCw,
  RotateCcw,
  Shuffle,
  Play,
  Pause,
  Award,
  ArrowLeft,
  Lightbulb,
  Trophy,
} from 'lucide-react';
import { metrics } from '../../services/metrics';

interface RubikCubeProps {
  onBack: () => void;
}

type CubeColor = 'red' | 'blue' | 'green' | 'orange' | 'white' | 'yellow';

interface CubeFace {
  [key: number]: CubeColor;
}

const initialColors: { [key: string]: CubeColor } = {
  front: 'red',
  back: 'orange',
  left: 'green',
  right: 'blue',
  top: 'white',
  bottom: 'yellow',
};

export const RubikCube = ({ onBack }: RubikCubeProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [hints, setHints] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [cubeState, setCubeState] = useState<{ [key: string]: CubeFace }>({
    front: { 0: 'red', 1: 'red', 2: 'red', 3: 'red', 4: 'red', 5: 'red', 6: 'red', 7: 'red', 8: 'red' },
    back: { 0: 'orange', 1: 'orange', 2: 'orange', 3: 'orange', 4: 'orange', 5: 'orange', 6: 'orange', 7: 'orange', 8: 'orange' },
    left: { 0: 'green', 1: 'green', 2: 'green', 3: 'green', 4: 'green', 5: 'green', 6: 'green', 7: 'green', 8: 'green' },
    right: { 0: 'blue', 1: 'blue', 2: 'blue', 3: 'blue', 4: 'blue', 5: 'blue', 6: 'blue', 7: 'blue', 8: 'blue' },
    top: { 0: 'white', 1: 'white', 2: 'white', 3: 'white', 4: 'white', 5: 'white', 6: 'white', 7: 'white', 8: 'white' },
    bottom: { 0: 'yellow', 1: 'yellow', 2: 'yellow', 3: 'yellow', 4: 'yellow', 5: 'yellow', 6: 'yellow', 7: 'yellow', 8: 'yellow' },
  });

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    white: 'bg-white',
    yellow: 'bg-yellow-400',
  };

  const shuffleCube = () => {
    const colors: CubeColor[] = ['red', 'blue', 'green', 'orange', 'white', 'yellow'];
    const newState: { [key: string]: CubeFace } = {};

    Object.keys(cubeState).forEach((face) => {
      newState[face] = {};
      for (let i = 0; i < 9; i++) {
        newState[face][i] = colors[Math.floor(Math.random() * colors.length)];
      }
    });

    setCubeState(newState);
    setMoves(0);
    setTime(0);
    setHints(0);
    setIsPlaying(true);
    
    // Iniciar métricas de tiempo
    metrics.startGame('strategy_mirror_rubik');
  };

  const rotateFace = (face: string, clockwise: boolean) => {
    if (!isPlaying) return;

    setMoves((prev) => prev + 1);

    const newState = { ...cubeState };
    const currentFace = { ...newState[face] };

    if (clockwise) {
      newState[face] = {
        0: currentFace[6],
        1: currentFace[3],
        2: currentFace[0],
        3: currentFace[7],
        4: currentFace[4],
        5: currentFace[1],
        6: currentFace[8],
        7: currentFace[5],
        8: currentFace[2],
      };
    } else {
      newState[face] = {
        0: currentFace[2],
        1: currentFace[5],
        2: currentFace[8],
        3: currentFace[1],
        4: currentFace[4],
        5: currentFace[7],
        6: currentFace[0],
        7: currentFace[3],
        8: currentFace[6],
      };
    }

    setCubeState(newState);
  };

  const checkSolved = () => {
    return Object.entries(cubeState).every(([face, squares]) => {
      const firstColor = squares[0];
      return Object.values(squares).every((color) => color === firstColor);
    });
  };

  const handleSolve = () => {
    const newState: { [key: string]: CubeFace } = {};
    Object.entries(initialColors).forEach(([face, color]) => {
      newState[face] = {};
      for (let i = 0; i < 9; i++) {
        newState[face][i] = color;
      }
    });

    setCubeState(newState);
    setIsPlaying(false);
    setShowCelebration(true);
    
    // Finalizar métricas de tiempo
    metrics.endGame(true, { level: 1, score: efficiency });

    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  const getHint = () => {
    setHints((prev) => prev + 1);
    alert('Pista: Intenta resolver una cara primero. Enfócate en la cara blanca y busca las piezas que coincidan.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const efficiency = moves > 0 ? Math.max(0, Math.min(100, 100 - moves)) : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 pb-12">
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-12 text-center shadow-2xl transform animate-bounce">
            <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">¡Felicitaciones!</h2>
            <p className="text-xl text-gray-700 mb-2">¡Has resuelto el cubo!</p>
            <div className="mt-6 space-y-2 text-lg">
              <p className="text-gray-600">
                Movimientos: <span className="font-bold text-blue-600">{moves}</span>
              </p>
              <p className="text-gray-600">
                Tiempo: <span className="font-bold text-green-600">{formatTime(time)}</span>
              </p>
              <p className="text-gray-600">
                Eficiencia: <span className="font-bold text-yellow-600">{efficiency}%</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Cubo Rubik</h1>

          <div className="w-24"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Movimientos</span>
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{moves}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Tiempo</span>
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{formatTime(time)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Eficiencia</span>
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{efficiency}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <div className="grid grid-cols-3 gap-2 mb-8">
                <div></div>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className={`aspect-square ${
                        colorClasses[cubeState.top[i]]
                      } rounded-lg shadow-md border-2 border-gray-800 ${
                        i % 3 === 0 ? '' : 'inline-block ml-2'
                      } ${Math.floor(i / 3) > 0 && i % 3 === 0 ? 'mt-2' : ''}`}
                      style={{ width: '30%' }}
                    ></div>
                  ))}
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className={`aspect-square ${
                        colorClasses[cubeState.left[i]]
                      } rounded-lg shadow-md border-2 border-gray-800 ${
                        i % 3 === 0 ? '' : 'inline-block ml-2'
                      } ${Math.floor(i / 3) > 0 && i % 3 === 0 ? 'mt-2' : ''}`}
                      style={{ width: '30%' }}
                    ></div>
                  ))}
                </div>

                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className={`aspect-square ${
                        colorClasses[cubeState.front[i]]
                      } rounded-lg shadow-md border-2 border-gray-800 ${
                        i % 3 === 0 ? '' : 'inline-block ml-2'
                      } ${Math.floor(i / 3) > 0 && i % 3 === 0 ? 'mt-2' : ''}`}
                      style={{ width: '30%' }}
                    ></div>
                  ))}
                </div>

                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className={`aspect-square ${
                        colorClasses[cubeState.right[i]]
                      } rounded-lg shadow-md border-2 border-gray-800 ${
                        i % 3 === 0 ? '' : 'inline-block ml-2'
                      } ${Math.floor(i / 3) > 0 && i % 3 === 0 ? 'mt-2' : ''}`}
                      style={{ width: '30%' }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-8">
                <div></div>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className={`aspect-square ${
                        colorClasses[cubeState.bottom[i]]
                      } rounded-lg shadow-md border-2 border-gray-800 ${
                        i % 3 === 0 ? '' : 'inline-block ml-2'
                      } ${Math.floor(i / 3) > 0 && i % 3 === 0 ? 'mt-2' : ''}`}
                      style={{ width: '30%' }}
                    ></div>
                  ))}
                </div>
                <div></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Controles</h3>

              <div className="space-y-3">
                <button
                  onClick={shuffleCube}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Shuffle className="w-5 h-5" />
                  <span>Mezclar</span>
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-full flex items-center justify-center space-x-2 px-6 py-3 font-semibold rounded-lg transition-all shadow-lg ${
                    isPlaying
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Reanudar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={getHint}
                  disabled={!isPlaying}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Lightbulb className="w-5 h-5" />
                  <span>Pista ({hints})</span>
                </button>

                <button
                  onClick={handleSolve}
                  disabled={!isPlaying}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Trophy className="w-5 h-5" />
                  <span>Resolver</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rotar Caras</h3>

              <div className="space-y-3">
                {['front', 'back', 'left', 'right', 'top', 'bottom'].map((face) => (
                  <div key={face} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 w-16 capitalize">
                      {face === 'front'
                        ? 'Frente'
                        : face === 'back'
                        ? 'Atrás'
                        : face === 'left'
                        ? 'Izq'
                        : face === 'right'
                        ? 'Der'
                        : face === 'top'
                        ? 'Arriba'
                        : 'Abajo'}
                    </span>
                    <button
                      onClick={() => rotateFace(face, false)}
                      disabled={!isPlaying}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rotateFace(face, true)}
                      disabled={!isPlaying}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Consejos</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Comienza mezclando el cubo</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Resuelve una cara a la vez</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>Usa las pistas si te atascas</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
