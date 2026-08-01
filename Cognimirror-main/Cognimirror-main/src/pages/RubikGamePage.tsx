// RubikGamePage.tsx - Selector Gamificado y Juegos con Cubo Rubik Inteligente
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Save, Box, History, RefreshCw, Activity, Sparkles, Trophy, Brain, Zap, BookOpen, Play } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../data/firebase';
import { auth, initializeAnonymousAuth } from '../services/firebaseAuth';
import { onAuthStateChanged, User } from 'firebase/auth';

// @ts-ignore
import { useBluetoothCube } from '../context/BluetoothContext';
// @ts-ignore
import { useCubeState } from '../context/CubeStateContext';
// @ts-ignore
import Cube3DViewer from '../components/Cube3DViewer';
// @ts-ignore
import MoveFeedOverlay from '../components/MoveFeedOverlay';
// @ts-ignore
import SimonGame from '../components/SimonGame';
// @ts-ignore
import ReactionGame from '../components/ReactionGame';
// @ts-ignore
import TutorialPhase from '../components/TutorialPhase';

interface RubikGamePageProps {
  onNavigate: (page: string) => void;
}

type Mode = 'menu' | 'free' | 'memory' | 'simon' | 'learn';

export const RubikGamePage = ({ onNavigate }: RubikGamePageProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('Conectando...');
  const [activeMode, setActiveMode] = useState<Mode>('menu');

  // Estados del Modo Jugar Libre
  const [moveLog, setMoveLog] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveButtonText, setSaveButtonText] = useState('Guardar Sesión');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Estadísticas del Historial y Progreso
  const [memorySessionsCount, setMemorySessionsCount] = useState(0);
  const [simonSessionsCount, setSimonSessionsCount] = useState(0);
  const [tutorialProgress, setTutorialProgress] = useState('Pendiente');
  const [freeSessionsCount, setFreeSessionsCount] = useState(0);

  // Consumir Bluetooth y estado del Cubo
  const { isConnected, device, connectBLE, disconnectBLE, batteryLevel, calibrateGyro } = useBluetoothCube();
  const { moveHistory, setMoveHistory, resetCubeState } = useCubeState();

  // Historial con timestamps para Firebase (Modo Libre)
  const moveHistoryWithTimeRef = useRef<{ move: string; time: number }[]>([]);
  const prevConnectedRef = useRef(isConnected);

  // Auto-activar calibración al conectar el cubo
  useEffect(() => {
    if (isConnected && !prevConnectedRef.current) {
      resetCubeState();
      setActiveMode('learn');
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, resetCubeState]);

  // Inicialización Auth
  useEffect(() => {
    initializeAnonymousAuth().catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthStatus('Conectado');
      } else {
        setCurrentUser(null);
        setAuthStatus('Desconectado');
      }
    });
    return () => unsubscribe();
  }, []);

  // Cargar estadísticas al volver al menú o cambiar de modo
  useEffect(() => {
    if (activeMode === 'menu') {
      setMemorySessionsCount(Number(localStorage.getItem('memory_mirror_sessions_count') || '0'));
      setSimonSessionsCount(Number(localStorage.getItem('simon_dice_sessions_count') || '0'));
      setTutorialProgress(localStorage.getItem('tutorial_progress') || 'Pendiente');
      setFreeSessionsCount(Number(localStorage.getItem('free_sessions_count') || '0'));
    }
  }, [activeMode]);

  // Sincronizar historial con timestamps (Modo Libre)
  useEffect(() => {
    if (activeMode !== 'free') return;
    
    const currentLength = moveHistoryWithTimeRef.current.length;
    if (moveHistory.length > currentLength) {
      const newMoves = moveHistory.slice(currentLength);
      newMoves.forEach((move: string) => {
        moveHistoryWithTimeRef.current.push({ move, time: Date.now() });
      });
      setMoveLog(moveHistory);

      // Auto-scroll del historial
      setTimeout(() => {
        const el = document.getElementById('move-log-container');
        if (el) el.scrollTop = el.scrollHeight;
      }, 10);
    } else if (moveHistory.length === 0) {
      moveHistoryWithTimeRef.current = [];
      setMoveLog([]);
    }
  }, [moveHistory, activeMode]);

  const handleManualMove = (notation: string) => {
    setMoveHistory((prev: string[]) => [...prev, notation]);
  };

  const scrambleCube = () => {
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
    const modifiers = ['', '\'', '2'];
    const totalMoves = 20;
    const sequence: string[] = [];
    for (let i = 0; i < totalMoves; i++) {
      const f = faces[Math.floor(Math.random() * faces.length)];
      const m = modifiers[Math.floor(Math.random() * modifiers.length)];
      sequence.push(f + m);
    }
    
    // Reproducir secuencia en el visualizador
    (async () => {
      for (const move of sequence) {
        setMoveHistory((prev: string[]) => [...prev, move]);
        await new Promise(r => setTimeout(r, 100));
      }
    })();
  };

  // Guardar sesión de juego libre en Firebase
  const saveToFirebase = async () => {
    if (!currentUser) {
      alert("Esperando conexión de usuario...");
      return;
    }
    if (moveHistoryWithTimeRef.current.length === 0) {
      alert("Realiza movimientos antes de guardar.");
      return;
    }

    setIsSaving(true);
    setSaveButtonText("Guardando...");

    try {
      await addDoc(collection(db, 'artifacts', 'rubik-app', 'users', currentUser.uid, 'rubik_sessions'), {
        moves: moveHistoryWithTimeRef.current,
        moveCount: moveHistoryWithTimeRef.current.length,
        timestamp: serverTimestamp(),
        device: device || 'Teclado/Simulado',
        userAgent: navigator.userAgent
      });

      // Incrementar contador local de sesiones libres
      const nextFree = freeSessionsCount + 1;
      localStorage.setItem('free_sessions_count', String(nextFree));
      setFreeSessionsCount(nextFree);

      setSaveButtonText("¡Guardado!");
      setTimeout(() => {
        setIsSaving(false);
        setSaveButtonText("Guardar Sesión");
      }, 2000);
    } catch (error: any) {
      console.error("Error al guardar sesión:", error);
      alert("Error al guardar");
      setIsSaving(false);
      setSaveButtonText("Reintentar");
    }
  };

  // Función para guardar sesiones de ReactionGame en Firebase
  const handleAddReactionSession = async (patientId: string, sessionData: any) => {
    console.log("Guardando sesión de reacción:", sessionData);
    try {
      await addDoc(collection(db, 'artifacts', 'rubik-app', 'users', currentUser?.uid || patientId, 'reaction_sessions'), {
        ...sessionData,
        timestamp: serverTimestamp(),
        device: device || 'Desconocido'
      });
    } catch (err) {
      console.error("Error al guardar en Firebase:", err);
    }
    return sessionData;
  };

  // Función para guardar sesiones de SimonGame en Firebase
  const handleSaveMemorySession = async (sessionData: any) => {
    console.log("Guardando sesión de Simon/Corsi:", sessionData);
    try {
      await addDoc(collection(db, 'artifacts', 'rubik-app', 'users', currentUser?.uid || 'anonymous', 'memory_sessions'), {
        ...sessionData,
        timestamp: serverTimestamp(),
        device: device || 'Desconocido'
      });
    } catch (err) {
      console.error("Error al guardar Simon en Firebase:", err);
    }
  };

  // Renderizar Menú de Selección Gamificado
  if (activeMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white font-sans flex flex-col justify-between">
        
        {/* Header Superior */}
        <header className="px-8 py-6 border-b border-white/5 bg-slate-950/40 backdrop-blur-md flex justify-between items-center z-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('mirror-hub')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-semibold">Espejos</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Box className="w-5 h-5 text-purple-400" />
                Strategy Hub
              </h1>
              <p className="text-xs text-white/55">Gamificación del Espejo de Estrategia</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bluetooth Controls */}
            <button
              onClick={isConnected ? disconnectBLE : connectBLE}
              className={`px-4 py-2 backdrop-blur-md rounded-xl border flex items-center gap-2 transition-all font-semibold text-sm ${
                isConnected 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30' 
                  : 'bg-purple-600 hover:bg-purple-500 border-purple-500/30 text-white shadow-lg shadow-purple-500/25'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-white/60'}`} />
              <span>
                {isConnected ? `${device} (${batteryLevel ?? '?'}%)` : 'Conectar Cubo BLE'}
              </span>
            </button>

            {/* Auth status */}
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-medium text-white/60">
              <div className={`w-1.5 h-1.5 rounded-full ${currentUser ? 'bg-green-400' : 'bg-red-400'}`} />
              <span>{authStatus}</span>
            </div>
          </div>
        </header>

        {/* Contenido del Menú de Modos de Juego */}
        <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <Trophy className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
              <span>Cubo Inteligente Activado</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Elige tu Desafío Cognitivo</h2>
            <p className="text-slate-400 text-sm">
              Conecta tu cubo mediante Bluetooth y pon a prueba tus capacidades mentales. Cada modo evalúa e impulsa destrezas cognitivas únicas.
            </p>
          </div>

          {/* Grid de Modos de Juego */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            
            {/* Card: Calibración */}
            <div 
              onClick={() => {
                if (!isConnected) {
                  connectBLE();
                  return;
                }
                resetCubeState();
                setActiveMode('learn');
              }}
              className="bg-slate-900/40 border border-white/5 hover:border-cyan-500/40 hover:bg-slate-900/60 rounded-3xl p-6 shadow-2xl transition-all cursor-pointer group flex flex-col justify-between h-56 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent blur-xl pointer-events-none" />
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Calibración</h3>
                <p className="text-slate-400 text-xs line-clamp-2">
                  Calibra los sensores inerciales del cubo y aprende la notación de las caras (giros horarios e inversos) paso a paso.
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4">
                <span className="text-slate-500 text-xs">Progreso actual: <strong className="text-cyan-400">{tutorialProgress}</strong></span>
                <span className="text-cyan-400 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {isConnected ? 'Calibrar' : 'Conectar y Calibrar'} <Play className="w-3 h-3 fill-current" />
                </span>
              </div>
            </div>

            {/* Card: Jugar Libre */}
            <div 
              onClick={() => { resetCubeState(); setActiveMode('free'); }}
              className="bg-slate-900/40 border border-white/5 hover:border-purple-500/40 hover:bg-slate-900/60 rounded-3xl p-6 shadow-2xl transition-all cursor-pointer group flex flex-col justify-between h-56 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent blur-xl pointer-events-none" />
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Box className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Jugar Libre (Entrenamiento)</h3>
                <p className="text-slate-400 text-xs line-clamp-2">
                  Práctica libre. Mide la velocidad de tus rotaciones (TPS), registra tu historial completo y sincronízalo con la nube.
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4">
                <span className="text-slate-500 text-xs">Sesiones guardadas: <strong className="text-purple-400">{freeSessionsCount}</strong></span>
                <span className="text-purple-400 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Entrenar <Play className="w-3 h-3 fill-current" />
                </span>
              </div>
            </div>

            {/* Card: Simon Dice */}
            <div 
              onClick={() => {
                if (!isConnected) {
                  connectBLE();
                  return;
                }
                resetCubeState();
                setActiveMode('memory');
              }}
              className="bg-slate-900/40 border border-white/5 hover:border-pink-500/40 hover:bg-slate-900/60 rounded-3xl p-6 shadow-2xl transition-all cursor-pointer group flex flex-col justify-between h-56 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/10 to-transparent blur-xl pointer-events-none" />
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Simon Dice</h3>
                <p className="text-slate-400 text-xs line-clamp-2">
                  Observa la secuencia de luces en el cubo virtual y replícala en las caras de tu cubo físico. Mide retención y memoria visoespacial.
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4">
                <span className="text-slate-500 text-xs">Sesiones completadas: <strong className="text-pink-400">{memorySessionsCount}</strong></span>
                <span className="text-pink-400 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {isConnected ? 'Comenzar' : 'Conectar y Jugar'} <Play className="w-3 h-3 fill-current" />
                </span>
              </div>
            </div>

            {/* Card: Go/No Go Mirror */}
            <div 
              onClick={() => {
                if (!isConnected) {
                  connectBLE();
                  return;
                }
                resetCubeState();
                setActiveMode('simon');
              }}
              className="bg-slate-900/40 border border-white/5 hover:border-emerald-500/40 hover:bg-slate-900/60 rounded-3xl p-6 shadow-2xl transition-all cursor-pointer group flex flex-col justify-between h-56 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent blur-xl pointer-events-none" />
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Go/No Go Mirror</h3>
                <p className="text-slate-400 text-xs line-clamp-2">
                  Gira la cara indicada del color correspondiente al instante. Evita reaccionar a los distractores visuales (Inhibición).
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4">
                <span className="text-slate-500 text-xs">Sesiones completadas: <strong className="text-emerald-400">{simonSessionsCount}</strong></span>
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {isConnected ? 'Comenzar' : 'Conectar y Jugar'} <Play className="w-3 h-3 fill-current" />
                </span>
              </div>
            </div>

          </div>
        </main>

        {/* Footer Inferior */}
        <footer className="py-6 border-t border-white/5 text-center text-xs text-white/30 z-20">
          CogniMirror Hub Cube Integration © 2026. Todos los derechos reservados.
        </footer>
      </div>
    );
  }

  // --- MODO: JUEGO LIBRE ---
  if (activeMode === 'free') {
    return (
      <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-hidden font-sans text-white">

        {/* Header */}
        <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center pointer-events-none">
          <div className="flex items-center space-x-4 pointer-events-auto">
            <button
              onClick={() => setActiveMode('menu')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all border border-white/10 group animate-fade-in"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-semibold">Volver al Menú</span>
            </button>

            <div className="flex flex-col">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Box className="w-6 h-6 text-purple-400" />
                Práctica Libre
              </h1>
              <p className="text-sm text-purple-200/80">Cubo Inteligente BLE</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Botón de Diagnósticos */}
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`px-3 py-2 backdrop-blur-md rounded-xl border flex items-center gap-1.5 transition-all text-xs font-semibold ${
                showDiagnostics ? 'bg-purple-500/20 border-purple-400/40 text-purple-300' : 'bg-white/5 border-white/10 text-white/75 hover:bg-white/10'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Diagnóstico</span>
            </button>

            {/* Botón Bluetooth */}
            <button
              onClick={isConnected ? disconnectBLE : connectBLE}
              className={`px-4 py-2 backdrop-blur-md rounded-xl border flex items-center gap-2 transition-all font-semibold text-sm ${
                isConnected 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30' 
                  : 'bg-purple-600 hover:bg-purple-500 border-purple-500/30 text-white shadow-lg shadow-purple-500/20'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-white/60'}`} />
              <span>
                {isConnected ? `${device} (${batteryLevel ?? '?'}%)` : 'Conectar Cubo'}
              </span>
            </button>
          </div>
        </div>

        {/* 3D Canvas wrapper */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto transform translate-y-4">
            <Cube3DViewer status="gyro_active" size={420} />
          </div>
        </div>

        {/* UI Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-row justify-between items-end">

          {/* Left Panel: Info & Actions */}
          <div className="pointer-events-auto bg-slate-900/75 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl w-80 shadow-2xl">
            <div className="flex items-center gap-2 mb-3 text-white/90">
              <History className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-base">Historial de Giros</h3>
            </div>

            <div id="move-log-container" className="h-32 overflow-y-auto bg-black/40 rounded-xl p-3 mb-4 font-mono text-sm border border-white/5 custom-scrollbar">
              {moveLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/30 italic text-xs gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400/50" />
                  <span>Gira el cubo para comenzar...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {moveLog.map((move, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-bold border border-purple-500/30">
                      {move}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={scrambleCube}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Mezclar
              </button>
              <button
                onClick={saveToFirebase}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saveButtonText}
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-3">
              <div className="flex justify-between items-center text-xs text-white/50">
                <span>Calibración de sensor:</span>
                <button onClick={calibrateGyro} className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Calibrar
                </button>
              </div>
              <div className="flex justify-between items-center text-xs text-white/50">
                <span>Reiniciar vista 3D:</span>
                <button onClick={() => { resetCubeState(); setMoveLog([]); }} className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Resetear Cubo
                </button>
              </div>
            </div>
          </div>

          {/* Diagnostic Panel overlay */}
          {showDiagnostics && (
            <div className="absolute top-24 right-6 w-80 pointer-events-auto animate-fade-in">
              <MoveFeedOverlay />
            </div>
          )}

          {/* Right Panel: Controls */}
          <div className="pointer-events-auto bg-slate-900/75 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl w-80">
            <h3 className="text-xs font-bold text-white/70 mb-3 text-center uppercase tracking-wider">Controles Manuales</h3>
            <div className="grid grid-cols-3 gap-2">
              {['U', 'D', 'F', 'B', 'R', 'L'].map((face) => (
                <div key={face} className="flex gap-1">
                  <button onClick={() => handleManualMove(face)} className="flex-1 py-1.5 bg-white/5 hover:bg-white/20 border border-white/10 rounded-lg font-bold text-white text-xs transition-all hover:scale-105 active:scale-95">{face}</button>
                  <button onClick={() => handleManualMove(face + "'")} className="flex-1 py-1.5 bg-white/5 hover:bg-white/20 border border-white/10 rounded-lg font-bold text-white text-xs transition-all hover:scale-105 active:scale-95">{face}'</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MODO: MEMORY MIRROR (CORSI TEST) ---
  if (activeMode === 'memory') {
    return (
      <SimonGame
        playerName={currentUser?.name || 'Invitado'}
        sessionMeta={{}}
        sessionStartTime={Date.now()}
        onExit={(record: any) => {
          // Guardar en Firebase
          handleSaveMemorySession(record);
          
          // Incrementar contador de sesiones
          const nextCount = memorySessionsCount + 1;
          localStorage.setItem('memory_mirror_sessions_count', String(nextCount));
          setMemorySessionsCount(nextCount);
          
          // Regresar al menú
          setActiveMode('menu');
        }}
      />
    );
  }

  // --- MODO: SIMON DICE (REACTION GAME / GO/NO-GO) ---
  if (activeMode === 'simon') {
    return (
      <ReactionGame
        activePatientId={currentUser?.uid || 'demo-user'}
        addSession={handleAddReactionSession}
        getPatient={() => ({ name: currentUser?.name || 'Paciente' })}
        sessionMeta={{}}
        sessionStartTime={Date.now()}
        onExit={() => {
          // Incrementar contador de sesiones
          const nextCount = simonSessionsCount + 1;
          localStorage.setItem('simon_dice_sessions_count', String(nextCount));
          setSimonSessionsCount(nextCount);

          // Regresar al menú
          setActiveMode('menu');
        }}
      />
    );
  }

  // --- MODO: APRENDER (TUTORIAL CALIBRACIÓN) ---
  if (activeMode === 'learn') {
    return (
      <TutorialPhase
        onCompleteTutorial={() => {
          // Marcar tutorial como Completado
          localStorage.setItem('tutorial_progress', 'Completado');
          setTutorialProgress('Completado');

          // Regresar al menú
          setActiveMode('menu');
        }}
      />
    );
  }

  return null;
};
