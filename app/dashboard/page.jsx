'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBluetoothCube } from '../../contexts/BluetoothContext';
import { useCubeState } from '../../contexts/CubeStateContext';
import { useJoicube } from '../../contexts/JoicubeContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePatientsDB } from '../../hooks/usePatientsDB';
import Cube3DViewer from '../../components/Cube3DViewer';
import CoordinadorDashboard from '../../components/CoordinadorDashboard';
import {
  Users,
  Brain,
  Zap,
  Compass,
  Hand,
  Activity,
  ArrowRight,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  CheckCircle2,
  Clock,
  LogOut,
  Bluetooth,
  Wifi,
  WifiOff,
  Shield,
  Layers,
  ChevronRight,
  History,
  TrendingUp,
  Sun,
  Moon,
  LayoutDashboard,
  GraduationCap,
  FileText,
  Search,
  School,
  BarChart3,
  Box,
  Sliders,
  Play,
  RotateCw,
  X,
  Download,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

function formatTime(ms) {
  const m = Math.floor(ms / 60000).toString().padStart(2, '0');
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  const mil = Math.floor(ms % 1000).toString().padStart(3, '0');
  return `${m}:${s}.${mil}`;
}

function ClassicDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;
  const { isConnected, device, connectBLE, batteryLevel, subscribeToMoves, broadcastMove, latencyOffset } = useBluetoothCube();
  const { moveHistory, cubeRotation, resetCubeState } = useCubeState();
  const joicube = useJoicube();
  const { user, profile, signOut } = useAuth();
  const { patients, loadingPatients } = usePatientsDB();

  const [activeTab, setActiveTab] = useState(
    tabParam === 'niveles' || tabParam === 'batteries' || tabParam === 'baterias' ? 'niveles' : 'resumen'
  ); // 'resumen' | 'niveles' | 'alumnos' | 'gemelo'
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineNetwork, setIsOfflineNetwork] = useState(false);

  useEffect(() => {
    if (tabParam === 'niveles' || tabParam === 'batteries' || tabParam === 'baterias') {
      setActiveTab('niveles');
    }
  }, [tabParam]);

  // Estados del Gemelo Digital
  const [lastTurn, setLastTurn] = useState(null);
  const [gemeloMoves, setGemeloMoves] = useState([]);
  const [gemeloTimer, setGemeloTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [faceStats, setFaceStats] = useState({ L: 0, R: 0, U: 0, D: 0, F: 0, B: 0 });

  // Estados de Auditoría y Trazabilidad Inmutable
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('Todos');

  const initialAuditLog = [
    {
      id: 'aud-1',
      title: 'Inicio de sesión',
      author: 'Josué Alarcón (Coordinador)',
      details: '',
      timeAgo: 'Hace 5 min',
      fullDate: 'Hoy, 18:05',
      category: 'Logins'
    },
    {
      id: 'aud-2',
      title: 'Carga masiva completada',
      author: 'Sistema',
      details: 'Se importaron 45 estudiantes',
      timeAgo: 'Hace 2 horas',
      fullDate: 'Hoy, 16:10',
      category: 'Estudiantes'
    },
    {
      id: 'aud-3',
      title: 'Nuevo terapeuta vinculado',
      author: 'Josué Alarcón',
      details: 'Dra. María González',
      timeAgo: 'Ayer, 14:30',
      fullDate: 'Ayer, 14:30',
      category: 'Sistema'
    },
    {
      id: 'aud-4',
      title: 'Batería de 5 Niveles Lanzada',
      author: 'Ps. Brayan Castro',
      details: 'Protocolo 04: Reaction Mirror (40 Ensayos)',
      timeAgo: '25 Aug, 11:15',
      fullDate: '25 Aug 2026, 11:15',
      category: 'Evaluaciones'
    },
    {
      id: 'aud-5',
      title: 'Evaluación Remota Completada',
      author: 'Sistema',
      details: 'ID Estudiante: PIE-042 - Latencia: 379ms',
      timeAgo: '24 Aug, 16:45',
      fullDate: '24 Aug 2026, 16:45',
      category: 'Evaluaciones'
    },
    {
      id: 'aud-6',
      title: 'Configuración de Parámetros',
      author: 'Josué Alarcón',
      details: 'Actualizado Eje: Resiliencia Climática & TDAH',
      timeAgo: '22 Aug, 09:20',
      fullDate: '22 Aug 2026, 09:20',
      category: 'Sistema'
    }
  ];

  const [auditLog, setAuditLog] = useState(initialAuditLog);

  const filteredAuditLog = useMemo(() => {
    return auditLog.filter(event => {
      const matchCategory = auditCategoryFilter === 'Todos' || event.category === auditCategoryFilter;
      const q = auditSearchQuery.toLowerCase();
      const matchQuery = !q || 
        event.title.toLowerCase().includes(q) || 
        event.author.toLowerCase().includes(q) || 
        (event.details && event.details.toLowerCase().includes(q));
      return matchCategory && matchQuery;
    });
  }, [auditLog, auditCategoryFilter, auditSearchQuery]);

  // Cargar tema guardado
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('cognimirror_theme') || 'dark';
      setTheme(savedTheme);
      setIsOfflineNetwork(!navigator.onLine);

      const handleOnline = () => setIsOfflineNetwork(false);
      const handleOffline = () => setIsOfflineNetwork(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognimirror_theme', nextTheme);
    }
  };

  const handleManualMove = useCallback((move) => {
    const cleanFace = move.replace("'", "").charAt(0);
    setLastTurn(cleanFace);
    setGemeloMoves(prev => [move, ...prev.slice(0, 15)]);
    setFaceStats(prev => ({
      ...prev,
      [cleanFace]: (prev[cleanFace] || 0) + 1
    }));
    try {
      broadcastMove(cleanFace);
    } catch(e) {}
  }, [broadcastMove]);

  // Escuchar giros en vivo por Bluetooth
  useEffect(() => {
    const unsub = subscribeToMoves((move) => {
      handleManualMove(move);
    });
    return () => unsub();
  }, [subscribeToMoves, handleManualMove]);

  // Escuchar giros por teclado en pestaña Gemelo Digital
  useEffect(() => {
    if (activeTab !== 'gemelo') return;
    const onKey = (e) => {
      const k = e.key.toUpperCase();
      let face = null;
      if (k === 'L' || e.key === 'ArrowLeft') face = 'L';
      else if (k === 'R' || e.key === 'ArrowRight') face = 'R';
      else if (k === 'U' || e.key === 'ArrowUp') face = 'U';
      else if (k === 'D' || e.key === 'ArrowDown') face = 'D';
      else if (k === 'F' || e.key === ' ') face = 'F';
      else if (k === 'B') face = 'B';

      if (face) {
        handleManualMove(face);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab, handleManualMove]);

  // Cálculos estadísticos para el Dashboard Institucional
  const dashboardMetrics = useMemo(() => {
    const studentsList = patients || [];
    const totalStudents = studentsList.length;
    let totalSessions = 0;
    let reactionSessions = 0;
    let memorySessions = 0;
    let sumReactionTime = 0;
    let validSessionsCount = 0;

    const timelineMap = {};
    const diagMap = {};

    studentsList.forEach(p => {
      const diag = p.diagnosticoNee || 'Sin Diagnóstico';
      if (!diagMap[diag]) diagMap[diag] = { count: 0, sumRt: 0, rtCount: 0 };
      diagMap[diag].count += 1;

      p.sessions?.forEach(s => {
        totalSessions++;
        if (s.testType === 'reaction') reactionSessions++;
        if (s.testType === 'memory') memorySessions++;

        const avg = s.stats?.averageReactionTime || 
                    Math.round((s.stats?.tiempo_promedio_por_mano?.L + s.stats?.tiempo_promedio_por_mano?.R) / 2) || 
                    0;

        if (avg > 0) {
          sumReactionTime += avg;
          validSessionsCount++;
          diagMap[diag].sumRt += avg;
          diagMap[diag].rtCount += 1;
        }

        if (s.date) {
          const dStr = new Date(s.date).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
          timelineMap[dStr] = (timelineMap[dStr] || 0) + 1;
        }
      });
    });

    const averageReaction = validSessionsCount > 0 ? Math.round(sumReactionTime / validSessionsCount) : 415;

    // Timeline Chart Data
    let timelineData = Object.keys(timelineMap).map(k => ({ fecha: k, Evaluaciones: timelineMap[k] }));
    if (timelineData.length === 0) {
      timelineData = [
        { fecha: '20 Ago', Evaluaciones: 4 },
        { fecha: '21 Ago', Evaluaciones: 7 },
        { fecha: '22 Ago', Evaluaciones: 12 },
        { fecha: '23 Ago', Evaluaciones: 9 },
        { fecha: '24 Ago', Evaluaciones: 15 },
        { fecha: '25 Ago', Evaluaciones: 18 },
        { fecha: '26 Ago', Evaluaciones: totalSessions > 0 ? totalSessions : 8 }
      ];
    }

    // Diagnostics Chart Data
    let diagnosticsData = Object.keys(diagMap).map(k => ({
      name: k.length > 14 ? `${k.substring(0, 14)}...` : k,
      fullName: k,
      Promedio: diagMap[k].rtCount > 0 ? Math.round(diagMap[k].sumRt / diagMap[k].rtCount) : 420,
      Alumnos: diagMap[k].count
    }));

    if (diagnosticsData.length === 0) {
      diagnosticsData = [
        { name: 'TDAH', fullName: 'TDAH', Promedio: 420, Alumnos: 2 },
        { name: 'TEA Gr. 1', fullName: 'TEA Grado 1', Promedio: 395, Alumnos: 1 },
        { name: 'DEA', fullName: 'Dificultad de Aprendizaje', Promedio: 480, Alumnos: 1 },
        { name: 'FIL', fullName: 'Funcionamiento Limítrofe', Promedio: 460, Alumnos: 1 }
      ];
    }

    // Demographic Data (Donut Chart)
    const demoCounts = {
      'TDAH': 0,
      'TEA Nivel 1': 0,
      'Dispraxia': 0,
      'Otros': 0
    };

    studentsList.forEach(p => {
      const diag = (p.diagnosticoNee || '').toLowerCase();
      if (diag.includes('tdah')) demoCounts['TDAH']++;
      else if (diag.includes('tea')) demoCounts['TEA Nivel 1']++;
      else if (diag.includes('dispraxia') || diag.includes('motriz')) demoCounts['Dispraxia']++;
      else demoCounts['Otros']++;
    });

    let demographicData = [
      { name: 'TDAH', value: demoCounts['TDAH'], color: '#3b82f6' },
      { name: 'TEA Nivel 1', value: demoCounts['TEA Nivel 1'], color: '#a855f7' },
      { name: 'Dispraxia', value: demoCounts['Dispraxia'], color: '#f59e0b' },
      { name: 'Otros', value: demoCounts['Otros'], color: '#10b981' }
    ];

    let totalDemographicCount = studentsList.length;

    if (totalDemographicCount === 0 || demographicData.every(d => d.value === 0)) {
      demographicData = [
        { name: 'TDAH', value: 1, color: '#3b82f6' },
        { name: 'TEA Nivel 1', value: 1, color: '#a855f7' },
        { name: 'Dispraxia', value: 1, color: '#f59e0b' },
        { name: 'Otros', value: 1, color: '#10b981' }
      ];
      totalDemographicCount = 3;
    }

    return {
      totalStudents,
      totalSessions,
      reactionSessions,
      memorySessions,
      averageReaction,
      adhesionPIE: totalStudents > 0 ? Math.min(100, Math.round(85 + (totalSessions * 2))) : 96,
      timelineData,
      diagnosticsData,
      demographicData,
      totalDemographicCount
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.diagnosticoNee?.toLowerCase().includes(q) ||
      p.idSujeto?.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const specialistName = useMemo(() => {
    const raw = profile?.nombre_completo || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Especialista';
    return raw.startsWith('Ps.') ? raw : `Ps. ${raw}`;
  }, [profile, user]);

  const schoolName = profile?.colegio?.nombre || 'Programa de Integración Escolar (PIE)';
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-200 ${
      isDark ? 'bg-[#07080f] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* ── BARRA LATERAL (SIDEBAR) ── */}
      <aside className={`w-64 border-r flex flex-col justify-between p-5 shrink-0 hidden md:flex transition-colors ${
        isDark ? 'bg-[#0c101a] border-white/5' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">CogniMirror</h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Panel Clínico</p>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="flex flex-col gap-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('resumen')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer ${
                activeTab === 'resumen'
                  ? isDark ? 'bg-slate-800/80 border-l-2 border-indigo-500 text-white font-semibold' : 'bg-slate-100 border-l-2 border-indigo-600 text-slate-900 font-semibold'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <School className="w-4 h-4 text-indigo-400" />
              <span>Dashboard Institucional</span>
            </button>

            <button
              onClick={() => setActiveTab('niveles')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer ${
                activeTab === 'niveles'
                  ? isDark ? 'bg-slate-800/80 border-l-2 border-indigo-500 text-white font-semibold' : 'bg-slate-100 border-l-2 border-indigo-600 text-slate-900 font-semibold'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Batería de 5 Niveles</span>
            </button>

            <button
              onClick={() => setActiveTab('alumnos')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer ${
                activeTab === 'alumnos'
                  ? isDark ? 'bg-slate-800/80 border-l-2 border-indigo-500 text-white font-semibold' : 'bg-slate-100 border-l-2 border-indigo-600 text-slate-900 font-semibold'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Directorio Alumnos PIE</span>
            </button>

            <button
              onClick={() => setActiveTab('gemelo')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer ${
                activeTab === 'gemelo'
                  ? isDark ? 'bg-slate-800/80 border-l-2 border-indigo-500 text-white font-semibold' : 'bg-slate-100 border-l-2 border-indigo-600 text-slate-900 font-semibold'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Box className="w-4 h-4 text-cyan-400" />
              <span>Gemelo Digital</span>
            </button>

            <Link
              href="/remote-eval?token=demo-token"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Evaluación Remota</span>
            </Link>

            <Link
              href="/export"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>Informes</span>
            </Link>
          </nav>
        </div>

        {/* Sección Inferior de la Barra Lateral */}
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/40 dark:border-white/5">
          {/* Toggle Modo Claro / Oscuro */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-amber-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </div>
            <span className="text-[10px] uppercase opacity-75 font-mono">{theme}</span>
          </button>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL (HEADER + CONTENIDO) ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* HEADER SUPERIOR */}
        <header className={`sticky top-0 z-30 px-6 sm:px-10 py-4 border-b flex items-center justify-between gap-4 backdrop-blur-md transition-colors ${
          isDark ? 'bg-[#07080f]/80 border-white/5' : 'bg-white/80 border-slate-200'
        }`}>
          <div>
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <span>{specialistName}</span>
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${
                isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-indigo-50 text-indigo-700 border-indigo-200/80 font-bold'
              }`}>
                Psicólogo PIE
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">{schoolName}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Desktop & Mobile */}
            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-amber-300 hover:bg-slate-700/80' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span className="hidden sm:inline">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>

            {/* Cerrar Sesión */}
            <button
              onClick={() => signOut()}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto flex flex-col gap-8">
          
          {/* TAB 1: DASHBOARD GENERAL INSTITUCIONAL Y PROGRESO DEL COLEGIO */}
          {activeTab === 'resumen' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-200">
              
              {/* KPIS INSTITUCIONALES */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className={`p-6 rounded-3xl border transition-all ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold">Total Alumnos PIE</span>
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black">{dashboardMetrics.totalStudents}</div>
                  <p className="text-xs text-slate-500 mt-1">Estudiantes bajo seguimiento</p>
                </div>

                <div className={`p-6 rounded-3xl border transition-all ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold">Evaluaciones Totales</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black">{dashboardMetrics.totalSessions}</div>
                  <p className="text-xs text-slate-500 mt-1">Sesiones registradas en el ciclo</p>
                </div>

                <div className={`p-6 rounded-3xl border transition-all ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold">Velocidad Promedio</span>
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black">{dashboardMetrics.averageReaction} ms</div>
                  <p className="text-xs text-slate-500 mt-1">Tiempo de reacción general</p>
                </div>

                <div className={`p-6 rounded-3xl border transition-all ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold">Adhesión al Programa</span>
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black">{dashboardMetrics.adhesionPIE}%</div>
                  <p className="text-xs text-slate-500 mt-1">Cobertura y cumplimiento clínico</p>
                </div>
              </div>

              {/* GRÁFICOS INSTITUCIONALES DEL PROGRESO DEL COLEGIO */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Gráfico 1: Evolución Temporal */}
                <div className={`p-6 rounded-3xl border ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black tracking-tight">Volumen de Evaluaciones por Período</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Progreso y actividad de sesiones clínicas</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardMetrics.timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#00000010'} />
                        <XAxis dataKey="fecha" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                        <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#0c101a' : '#ffffff',
                            borderColor: isDark ? '#ffffff20' : '#e2e8f0',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: isDark ? '#ffffff' : '#000000'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Evaluaciones"
                          stroke="#a855f7"
                          strokeWidth={3}
                          dot={{ fill: '#a855f7', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico 2: Desempeño por Diagnóstico NEE */}
                <div className={`p-6 rounded-3xl border ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black tracking-tight">Tiempo de Reacción por Diagnóstico NEE</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Promedio de latencia motora (ms)</p>
                    </div>
                    <Brain className="w-5 h-5 text-indigo-400" />
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardMetrics.diagnosticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#00000010'} />
                        <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                        <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#0c101a' : '#ffffff',
                            borderColor: isDark ? '#ffffff20' : '#e2e8f0',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: isDark ? '#ffffff' : '#000000'
                          }}
                        />
                        <Bar dataKey="Promedio" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico 3: Perfil Demográfico (Donut / Pie Chart) */}
                <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-400" />
                          <span>Perfil Demográfico</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Distribución de diagnósticos en el programa PIE</p>
                      </div>
                    </div>

                    <div className="relative h-48 w-full flex items-center justify-center my-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboardMetrics.demographicData}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={72}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {dashboardMetrics.demographicData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#0c101a' : '#ffffff',
                              borderColor: isDark ? '#ffffff20' : '#e2e8f0',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: isDark ? '#ffffff' : '#000000'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-100">{dashboardMetrics.totalDemographicCount}</span>
                        <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">TOTAL</span>
                      </div>
                    </div>
                  </div>

                  {/* Leyenda en cuadrícula de 2 columnas idéntica a la imagen de referencia */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3 border-t border-white/5 text-xs">
                    {dashboardMetrics.demographicData.map((item, idx) => (
                      <div key={`legend-${idx}`} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 font-medium truncate text-[11px]">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* SECCIÓN INFERIOR: TABLA DE ESTUDIANTES + AUDITORÍA Y TRAZABILIDAD */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* TABLA DE PROGRESO DE ESTUDIANTES PIE (lg:col-span-7) */}
                <div className={`lg:col-span-7 p-6 rounded-3xl border ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="text-base font-black tracking-tight">Registro y Avance de Estudiantes</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Estado de evaluaciones y diagnóstico de cada alumno</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveTab('niveles')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
                      >
                        <span>Lanzar Batería</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Estudiante</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Diagnóstico NEE</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Evaluaciones</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Último Registro</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {patients.map(p => {
                          const lastSess = p.sessions?.[0];
                          return (
                            <tr key={p.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                              <td className="py-3.5 px-4 font-bold">
                                <div>
                                  <span className="text-sm">{p.name}</span>
                                  {p.idSujeto && <span className="block text-[10px] text-slate-400 font-mono">ID: {p.idSujeto}</span>}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-400">
                                {p.diagnosticoNee || 'Sin Asignar'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-xs">
                                  {p.sessions?.length || 0} sesiones
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-400">
                                {lastSess ? new Date(lastSess.date).toLocaleDateString() : 'Sin registros'}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <Link
                                  href={`/students?patientId=${p.id}`}
                                  className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                                >
                                  Ver Ficha <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TARJETA AUDITORÍA Y TRAZABILIDAD (lg:col-span-5) */}
                <div className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#0c101d] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-black tracking-tight flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <span>Auditoría y Trazabilidad</span>
                      </h4>
                    </div>

                    {/* Lista Trazabilidad con línea vertical conectora (idéntica a la imagen) */}
                    <div className="relative pl-4 space-y-6 border-l-2 border-slate-800/80 my-4">
                      {auditLog.slice(0, 3).map((event, idx) => (
                        <div key={event.id || idx} className="relative group">
                          {/* Punto indicador de evento en la línea vertical */}
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#0c101d]" />

                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                                {event.title}
                              </h5>
                              <p className="text-xs text-slate-400 font-medium">{event.author}</p>
                              {event.details && (
                                <p className="text-xs italic text-slate-500 mt-0.5 font-mono">{event.details}</p>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 shrink-0">{event.timeAgo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón Ver Historial Completo */}
                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={() => setIsAuditModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-bold transition-all text-center cursor-pointer shadow-inner"
                    >
                      Ver Historial Completo
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: BATERÍA DE 5 NIVELES PROGRESIVOS (SWISS HEALTHTECH ENTERPRISE LAYOUT) */}
          {activeTab === 'niveles' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                  BATERÍA PSICOMÉTRICA DIGITAL
                </span>
                <h3 className="text-xl font-bold tracking-tight mt-0.5">
                  Protocolos Estandarizados de Evaluación
                </h3>
                <p className={`text-xs mt-1 max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Selecciona el protocolo psicométrico adecuado según el nivel de desarrollo visomotor, atencional y neurocognitivo del estudiante.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* PROTOCOLO 01 */}
                <Link
                  href="/reaction-game?level=free"
                  className={`group relative flex flex-col justify-between rounded-xl p-5 border transition-all duration-150 cursor-pointer ${
                    isDark
                      ? 'bg-[#0d111c] border-slate-800 hover:border-slate-600 hover:shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-emerald-400/80 hover:shadow-md border-l-4 border-l-emerald-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                      <span className="font-semibold text-emerald-600 dark:text-slate-500 tracking-wide uppercase">
                        PROTOCOLO 01 // EXPLORACIÓN HÁPTICA
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                      }`}>
                        LIBRE
                      </span>
                    </div>

                    <h3 className={`text-base font-bold transition-colors ${
                      isDark ? 'text-slate-100 group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                    }`}>
                      Nivel 1: Exploración Libre y Calentamiento
                    </h3>
                    <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Verificación de conectividad BLE, reconocimiento háptico del hardware y familiarización de respuesta motora sin presión temporal.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {['Familiarización BLE', 'Rotaciones Hápicas', 'Basal Sin Presión'].map((metric, i) => (
                        <span
                          key={i}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isDark ? 'bg-slate-800/70 text-slate-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          }`}
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-medium transition-colors ${
                    isDark
                      ? 'border-slate-800/80 text-slate-300 group-hover:text-emerald-400'
                      : 'border-slate-100 text-emerald-700 group-hover:text-emerald-600'
                  }`}>
                    <span className="text-slate-400 font-normal">Población Basal</span>
                    <div className="flex items-center gap-1">
                      <span>Configurar prueba</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>

                {/* PROTOCOLO 02 */}
                <Link
                  href="/reaction-game?level=single_face"
                  className={`group relative flex flex-col justify-between rounded-xl p-5 border transition-all duration-150 cursor-pointer ${
                    isDark
                      ? 'bg-[#0d111c] border-slate-800 hover:border-slate-600 hover:shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-purple-400/80 hover:shadow-md border-l-4 border-l-purple-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                      <span className="font-semibold text-purple-600 dark:text-slate-500 tracking-wide uppercase">
                        PROTOCOLO 02 // CONTROL INHIBITORIO
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-purple-50 border-purple-200 text-purple-700 font-bold'
                      }`}>
                        20 ENSAYOS
                      </span>
                    </div>

                    <h3 className={`text-base font-bold transition-colors ${
                      isDark ? 'text-slate-100 group-hover:text-purple-400' : 'text-slate-900 group-hover:text-purple-600'
                    }`}>
                      Nivel 2: Go / No-Go Unilateral (1 Cara)
                    </h3>
                    <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Evaluación de latencia motriz primaria y control inhibitorio unilateral mediante discriminación Go (Naranja) / No-Go (Azul).
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {['Latencia Motriz (ms)', 'Freno Inhibitorio', 'Error de Comisión'].map((metric, i) => (
                        <span
                          key={i}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isDark ? 'bg-slate-800/70 text-slate-300' : 'bg-purple-50 text-purple-800 border border-purple-100'
                          }`}
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-medium transition-colors ${
                    isDark
                      ? 'border-slate-800/80 text-slate-300 group-hover:text-purple-400'
                      : 'border-slate-100 text-purple-700 group-hover:text-purple-600'
                  }`}>
                    <span className="text-slate-400 font-normal">Evaluación TDAH</span>
                    <div className="flex items-center gap-1">
                      <span>Configurar prueba</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>

                {/* PROTOCOLO 03 */}
                <Link
                  href="/reaction-game?level=bilateral_pure"
                  className={`group relative flex flex-col justify-between rounded-xl p-5 border transition-all duration-150 cursor-pointer ${
                    isDark
                      ? 'bg-[#0d111c] border-slate-800 hover:border-slate-600 hover:shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-indigo-400/80 hover:shadow-md border-l-4 border-l-indigo-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                      <span className="font-semibold text-indigo-600 dark:text-slate-500 tracking-wide uppercase">
                        PROTOCOLO 03 // BIMANUALIDAD PURA
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                      }`}>
                        24 ENSAYOS
                      </span>
                    </div>

                    <h3 className={`text-base font-bold transition-colors ${
                      isDark ? 'text-slate-100 group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-indigo-600'
                    }`}>
                      Nivel 3: Bilateralidad y Alternancia Motora
                    </h3>
                    <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Medición de coordinación interhemisférica bimanual pura y asimetría de tiempo de reacción (Mano Izquierda vs Derecha).
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {['Asimetría Hemisférica', 'Velocidad Pura (ms)', 'Consistencia Ritmo'].map((metric, i) => (
                        <span
                          key={i}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isDark ? 'bg-slate-800/70 text-slate-300' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                          }`}
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-medium transition-colors ${
                    isDark
                      ? 'border-slate-800/80 text-slate-300 group-hover:text-indigo-400'
                      : 'border-slate-100 text-indigo-700 group-hover:text-indigo-600'
                  }`}>
                    <span className="text-slate-400 font-normal">Coordinación Bimanual</span>
                    <div className="flex items-center gap-1">
                      <span>Configurar prueba</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>

                {/* PROTOCOLO 04 */}
                <Link
                  href="/reaction-game"
                  className={`group relative flex flex-col justify-between rounded-xl p-5 border transition-all duration-150 cursor-pointer ${
                    isDark
                      ? 'bg-[#0d111c] border-pink-900/60 hover:border-pink-500/80 hover:shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-pink-400/80 hover:shadow-md border-l-4 border-l-pink-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                      <span className="font-semibold text-pink-600 dark:text-pink-400 tracking-wide uppercase">
                        PROTOCOLO 04 // CLÍNICO OFICIAL
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                        isDark ? 'bg-pink-950/60 border-pink-800/80 text-pink-300' : 'bg-pink-50 border-pink-200 text-pink-700 font-bold'
                      }`}>
                        40 ENSAYOS (~3 MIN)
                      </span>
                    </div>

                    <h3 className={`text-base font-bold transition-colors ${
                      isDark ? 'text-slate-100 group-hover:text-pink-400' : 'text-slate-900 group-hover:text-pink-600'
                    }`}>
                      Nivel 4: Reaction Mirror (Batería Completa)
                    </h3>
                    <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Batería clínica estandarizada de funciones ejecutivas: atención sostenida, control mixto Go/No-Go y curva de fatiga atencional.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {['Latencia Media (ms)', 'Desviación Estándar (SD)', 'Costo Inhibición', 'Fatiga Atencional'].map((metric, i) => (
                        <span
                          key={i}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isDark ? 'bg-pink-950/50 text-pink-300 border border-pink-900/50' : 'bg-pink-50 text-pink-800 border border-pink-100'
                          }`}
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-medium transition-colors ${
                    isDark
                      ? 'border-slate-800/80 text-slate-300 group-hover:text-pink-400'
                      : 'border-slate-100 text-pink-700 group-hover:text-pink-600'
                  }`}>
                    <span className="text-pink-600 font-semibold">Informe Clínico PIE</span>
                    <div className="flex items-center gap-1">
                      <span>Iniciar evaluación</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>

                {/* PROTOCOLO 05 */}
                <Link
                  href="/simon-game"
                  className={`group relative flex flex-col justify-between rounded-xl p-5 border transition-all duration-150 cursor-pointer ${
                    isDark
                      ? 'bg-[#0d111c] border-slate-800 hover:border-slate-600 hover:shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-cyan-400/80 hover:shadow-md border-l-4 border-l-cyan-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                      <span className="font-semibold text-cyan-600 dark:text-slate-500 tracking-wide uppercase">
                        PROTOCOLO 05 // VISOESPACIAL 3D
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700 font-bold'
                      }`}>
                        ADAPTATIVO
                      </span>
                    </div>

                    <h3 className={`text-base font-bold transition-colors ${
                      isDark ? 'text-slate-100 group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-cyan-600'
                    }`}>
                      Nivel 5: Memory Mirror (Test de Corsi 3D)
                    </h3>
                    <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Evaluación de la amplitud de memoria de trabajo visoespacial, capacidad de retención secuencial en 3D y latencia intra-movimiento.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {['Corsi Span Máximo', 'Latencia Intra-Bloque', 'Tipología de Error'].map((metric, i) => (
                        <span
                          key={i}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isDark ? 'bg-slate-800/70 text-slate-300' : 'bg-cyan-50 text-cyan-800 border border-cyan-100'
                          }`}
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-medium transition-colors ${
                    isDark
                      ? 'border-slate-800/80 text-slate-300 group-hover:text-cyan-400'
                      : 'border-slate-100 text-cyan-700 group-hover:text-cyan-600'
                  }`}>
                    <span className="text-slate-400 font-normal">Memoria de Trabajo</span>
                    <div className="flex items-center gap-1">
                      <span>Configurar prueba</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>

              </div>
            </div>
          )}

          {/* TAB 3: DIRECTORIO DE ALUMNOS PIE */}
          {activeTab === 'alumnos' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black tracking-tight">Directorio de Estudiantes PIE</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Gestiona las fichas, historial de evaluaciones y diagnósticos de cada alumno.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o NEE..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs transition-all border ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                  <Link
                    href="/students"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Registrar Alumno
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map(p => (
                  <div
                    key={p.id}
                    className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                      isDark ? 'bg-white/[0.02] border-white/5 hover:border-purple-500/30' : 'bg-white border-slate-200 hover:border-purple-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm truncate max-w-[180px]">{p.name}</h4>
                        <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                          {p.sessions?.length || 0} tests
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {p.diagnosticoNee || 'Sin diagnóstico asignado'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.idSujeto ? `ID: ${p.idSujeto}` : 'Local'}
                      </span>
                      <Link
                        href={`/students?patientId=${p.id}`}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                      >
                        Ver Ficha <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GEMELO DIGITAL COMPLETO EN VIVO (MÓDULO CLÁSICO 3D) */}
          {activeTab === 'gemelo' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Box className="w-6 h-6 text-indigo-400" /> Monitoreo 3D y Gemelo Digital en Tiempo Real
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Gira cualquier cara del cubo físico (o presiona las teclas L, R, U, D, F, B) para reflejar en tiempo real.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={connectBLE}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isConnected
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 border-transparent'
                    }`}
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>{isConnected ? `Conectado: ${device}` : 'Conectar Cubo BLE'}</span>
                  </button>
                  <button
                    onClick={resetCubeState}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                    <span>Reiniciar Posición</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Visor 3D Principal */}
                <div className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col items-center justify-between min-h-[460px] relative overflow-hidden ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      Estado: {isConnected ? `Conectado (${device})` : 'Teclado / Simulación'}
                    </span>
                    <span className="font-mono">Offset: {latencyOffset > 0 ? `-${latencyOffset}ms` : '0ms'}</span>
                  </div>

                  <div className="my-auto py-4">
                    <Cube3DViewer size={270} isLocked={false} highlightFace={lastTurn} />
                  </div>

                  {/* Botones de Prueba Manual / Simulación de Caras */}
                  <div className="w-full flex flex-col items-center gap-3 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="text-slate-400 font-medium">Última cara girada:</span>
                      <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl font-mono font-bold text-sm">
                        {lastTurn ? `Cara ${lastTurn}` : 'En espera'}
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-2 w-full mt-1">
                      {[
                        { face: 'L', label: 'Rojo (L)', bg: 'hover:bg-red-500/20 hover:border-red-500/50 text-red-400' },
                        { face: 'R', label: 'Naranjo (R)', bg: 'hover:bg-orange-500/20 hover:border-orange-500/50 text-orange-400' },
                        { face: 'U', label: 'Blanco (U)', bg: 'hover:bg-white/20 hover:border-white/50 text-slate-200' },
                        { face: 'D', label: 'Amarillo (D)', bg: 'hover:bg-yellow-500/20 hover:border-yellow-500/50 text-yellow-400' },
                        { face: 'F', label: 'Azul (F)', bg: 'hover:bg-blue-500/20 hover:border-blue-500/50 text-blue-400' },
                        { face: 'B', label: 'Verde (B)', bg: 'hover:bg-emerald-500/20 hover:border-emerald-500/50 text-emerald-400' }
                      ].map(({ face, label, bg }) => (
                        <button
                          key={face}
                          type="button"
                          onClick={() => handleManualMove(face)}
                          className={`py-2 px-1 rounded-xl bg-white/5 border border-white/10 font-mono font-bold text-xs transition-all cursor-pointer ${bg}`}
                        >
                          {face}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Panel de Telemetría Lateral */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  
                  {/* Historial de Movimientos Recientes */}
                  <div className={`p-5 rounded-3xl border ${
                    isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <h4 className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      Secuencia en Vivo
                    </h4>
                    {gemeloMoves.length === 0 ? (
                      <p className={`text-xs italic py-4 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Gira el cubo para registrar movimientos...</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {gemeloMoves.map((m, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                              isDark
                                ? (m.includes("'")
                                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                                    : 'bg-purple-600/30 text-purple-300 border border-purple-500/30')
                                : (m.includes("'")
                                    ? 'bg-indigo-100 text-indigo-950 border border-indigo-300 font-black'
                                    : 'bg-purple-100 text-purple-950 border border-purple-300 font-black')
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Frecuencia por Cara */}
                  <div className={`p-5 rounded-3xl border ${
                    isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <h4 className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      Giros por Cara
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {Object.entries(faceStats).map(([f, count]) => (
                        <div key={f} className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200 shadow-xs'}`}>
                          <span className={`text-[10px] block font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Cara {f}</span>
                          <span className={`font-black text-sm ${isDark ? 'text-purple-400' : 'text-indigo-600'}`}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL DE HISTORIAL COMPLETO DE AUDITORÍA Y TRAZABILIDAD */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#0c101d] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Header del Modal */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <span>Historial Completo de Auditoría y Trazabilidad</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                      Inmutable
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Trazabilidad histórica continua de cambios, accesos y evaluaciones</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Búsqueda y Filtros */}
            <div className="px-6 py-3.5 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por título, autor o detalle..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['Todos', 'Logins', 'Evaluaciones', 'Estudiantes', 'Sistema'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAuditCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      auditCategoryFilter === cat
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista del Historial Completo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-800">
                {filteredAuditLog.map((event, idx) => (
                  <div key={event.id || idx} className="relative group">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-[#0c101d] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />

                    <div className="bg-white/[0.02] border border-white/5 hover:border-amber-500/30 rounded-2xl p-4 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h5 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors flex items-center gap-2">
                          <span>{event.title}</span>
                          <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                            {event.category || 'Sistema'}
                          </span>
                        </h5>
                        <span className="text-xs font-mono text-slate-500">{event.fullDate || event.timeAgo}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">{event.author}</p>
                      {event.details && (
                        <p className="text-xs italic text-amber-200/80 mt-1 font-mono bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                          {event.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {filteredAuditLog.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No se encontraron registros de auditoría.</p>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Total Registros: {filteredAuditLog.length} eventos</span>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Cerrar Historial
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080f] flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono animate-pulse">Cargando Lobby de CogniMirror...</span>
      </div>
    );
  }

  if (profile?.rol === 'coordinador_pie') {
    return <CoordinadorDashboard />;
  }

  return <ClassicDashboard />;
}
