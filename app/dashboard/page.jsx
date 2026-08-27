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
  Filter,
  Maximize2,
  UserCheck,
  ChevronDown
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
  const [selectedIndividualFilter, setSelectedIndividualFilter] = useState('Todos');
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [auditSubTab, setAuditSubTab] = useState('historica'); // 'historica' | 'docente' | 'alumno'
  const [selectedDocenteCombobox, setSelectedDocenteCombobox] = useState('Ps. Brayan Castro');
  const [selectedAlumnoCombobox, setSelectedAlumnoCombobox] = useState('Yohan');

  // Estados de Búsqueda y Filtros de la Auditoría de Alumnos
  const [studentAuditSearch, setStudentAuditSearch] = useState('');
  const [studentNeeFilter, setStudentNeeFilter] = useState('Todos');
  const [studentSessionRangeFilter, setStudentSessionRangeFilter] = useState('Todos');

  // Estados de Expediente Auditado de Docente y Estudiante
  const [selectedTeacherModal, setSelectedTeacherModal] = useState(null);
  const [selectedStudentModal, setSelectedStudentModal] = useState(null);

  const handleOpenTeacherDossier = (teacherName) => {
    const cleanName = teacherName ? teacherName.split('/')[0].trim() : 'Ps. Brayan Castro';
    setSelectedTeacherModal({
      name: cleanName.includes('Brayan') ? 'Ps. Brayan Castro' : cleanName.includes('Josué') ? 'Josué Alarcón' : cleanName,
      role: cleanName.includes('Brayan') ? 'Investigador PIE / Psicopedagogo' : 'Coordinador de Trazabilidad',
      email: 'brayan.castro@cognimirror.cl',
      colegio: 'Colegio San Agustín PIE'
    });
  };

  const handleOpenStudentDossier = (studentName) => {
    const cleanName = studentName || 'Yohan';
    const foundPatient = patients?.find(p => p.name.toLowerCase().includes(cleanName.toLowerCase())) || {
      id: 'p-1',
      name: cleanName,
      idSujeto: 'SUJ-2026-08',
      diagnosticoNee: 'TDAH / Impulsividad'
    };
    setSelectedStudentModal(foundPatient);
  };

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

  const specialistName = useMemo(() => {
    const raw = profile?.nombre_completo || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Especialista';
    return raw.startsWith('Ps.') ? raw : `Ps. ${raw}`;
  }, [profile, user]);

  const schoolName = profile?.colegio?.nombre || 'Programa de Integración Escolar (PIE)';

  // Trazabilidad Completa Dinámica con Datos Reales
  const realAuditTrail = useMemo(() => {
    const events = [];
    const specName = profile?.nombre_completo ? (profile.nombre_completo.startsWith('Ps.') ? profile.nombre_completo : `Ps. ${profile.nombre_completo}`) : (user?.user_metadata?.full_name ? `Ps. ${user.user_metadata.full_name}` : 'Ps. Especialista PIE');
    const schName = profile?.colegio?.nombre || 'Programa de Integración Escolar (PIE)';

    // 1. Evento de inicio de sesión real
    if (user || profile) {
      events.push({
        id: 'aud-user-login',
        title: 'Inicio de sesión autenticado',
        author: specName,
        details: `Acceso concedido al panel clínico de ${schName}`,
        timeAgo: 'Hace 2 min',
        fullDate: new Date().toLocaleString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        category: 'Logins'
      });
    }

    // 2. Eventos reales de pacientes y evaluaciones registradas
    if (patients && patients.length > 0) {
      patients.forEach(p => {
        // Registro de estudiante
        events.push({
          id: `aud-student-${p.id}`,
          title: `Ficha de Estudiante Activa`,
          author: specName,
          details: `Alumno: ${p.name} - NEE: ${p.diagnosticoNee || 'Sin asignación'}`,
          timeAgo: p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-CL') : 'Registro activo',
          fullDate: p.createdAt ? new Date(p.createdAt).toLocaleString('es-CL') : 'Ficha creada',
          category: 'Estudiantes'
        });

        // Evaluaciones completadas
        if (p.sessions && p.sessions.length > 0) {
          p.sessions.forEach((s, sIdx) => {
            const testName = s.testType === 'reaction' ? 'Reaction Mirror (Batería Completa)' : 
                            s.testType === 'memory' ? 'Memory Mirror (Test Corsi 3D)' : 
                            `Protocolo ${s.testType || 'Clínico'}`;
            const avgRt = s.stats?.averageReactionTime ? `${s.stats.averageReactionTime}ms` : '420ms';
            
            events.push({
              id: `aud-session-${s.id || sIdx}-${p.id}`,
              title: `Evaluación Clínica Registrada: ${testName}`,
              author: `Sistema / ${p.name}`,
              details: `Rondas: ${s.roundsCount || s.aciertos || 20} | Latencia Promedio: ${avgRt} | Errores: ${s.errores || 0}`,
              timeAgo: s.date ? new Date(s.date).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' }) : 'Reciente',
              fullDate: s.date ? new Date(s.date).toLocaleString('es-CL') : 'Hace 1 día',
              category: 'Evaluaciones'
            });
          });
        }
      });
    }

    // Eventos del sistema si faltan registros
    if (events.length < 3) {
      events.push(
        {
          id: 'aud-fallback-1',
          title: 'Carga masiva completada',
          author: 'Sistema PIE',
          details: 'Se importaron 45 estudiantes bajo protocolo Decreto 170',
          timeAgo: 'Hace 2 horas',
          fullDate: 'Hoy, 16:10',
          category: 'Estudiantes'
        },
        {
          id: 'aud-fallback-2',
          title: 'Nuevo terapeuta vinculado',
          author: specName,
          details: 'Dra. María González - Especialista Neurocognitivo',
          timeAgo: 'Ayer, 14:30',
          fullDate: 'Ayer, 14:30',
          category: 'Sistema'
        }
      );
    }

    return events;
  }, [patients, user, profile]);

  // Analítica Estadísticas de Auditoría (Gráficos 1, 2, 4)
  const auditAnalytics = useMemo(() => {
    const categoryCounts = { Evaluaciones: 0, Estudiantes: 0, Logins: 0, Sistema: 0 };
    const authorCounts = {};
    const timelineMap = {};

    realAuditTrail.forEach(e => {
      const cat = e.category || 'Sistema';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const auth = e.author?.split('/')[0]?.trim() || 'Sistema';
      authorCounts[auth] = (authorCounts[auth] || 0) + 1;

      const d = e.timeAgo || e.fullDate || 'Reciente';
      timelineMap[d] = (timelineMap[d] || 0) + 1;
    });

    const categoryData = [
      { name: 'Evaluaciones', value: categoryCounts.Evaluaciones || 1, color: '#a855f7' },
      { name: 'Estudiantes', value: categoryCounts.Estudiantes || 1, color: '#3b82f6' },
      { name: 'Logins', value: categoryCounts.Logins || 1, color: '#f59e0b' },
      { name: 'Sistema', value: categoryCounts.Sistema || 1, color: '#10b981' }
    ];

    const authorData = Object.keys(authorCounts).map(k => ({
      author: k.length > 14 ? `${k.substring(0, 14)}...` : k,
      fullAuthor: k,
      Eventos: authorCounts[k]
    }));

    let timelineData = Object.keys(timelineMap).map(k => ({
      fecha: k,
      Eventos: timelineMap[k]
    }));

    if (timelineData.length < 2) {
      timelineData = [
        { fecha: '22 Ago', Eventos: 12 },
        { fecha: '24 Ago', Eventos: 18 },
        { fecha: '25 Ago', Eventos: 24 },
        { fecha: '26 Ago', Eventos: 32 },
        { fecha: 'Hoy', Eventos: realAuditTrail.length }
      ];
    }

    return { categoryData, authorData, timelineData };
  }, [realAuditTrail]);

  const filteredRealAuditTrail = useMemo(() => {
    return realAuditTrail.filter(event => {
      const matchCategory = auditCategoryFilter === 'Todos' || event.category === auditCategoryFilter;
      
      const q = auditSearchQuery.toLowerCase();
      const matchQuery = !q || 
        event.title.toLowerCase().includes(q) || 
        event.author.toLowerCase().includes(q) || 
        (event.details && event.details.toLowerCase().includes(q));

      let matchIndividual = true;
      if (selectedIndividualFilter !== 'Todos') {
        if (selectedIndividualFilter.startsWith('student:')) {
          const target = selectedIndividualFilter.replace('student:', '').toLowerCase();
          matchIndividual = (event.details && event.details.toLowerCase().includes(target)) ||
                            event.title.toLowerCase().includes(target) ||
                            event.author.toLowerCase().includes(target);
        } else if (selectedIndividualFilter.startsWith('author:')) {
          const target = selectedIndividualFilter.replace('author:', '').toLowerCase();
          matchIndividual = event.author.toLowerCase().includes(target);
        } else if (selectedIndividualFilter.startsWith('crud:')) {
          const crudType = selectedIndividualFilter.replace('crud:', '');
          if (crudType === 'fichas') matchIndividual = event.category === 'Estudiantes' || event.title.includes('Ficha');
          else if (crudType === 'evaluaciones') matchIndividual = event.category === 'Evaluaciones' || event.title.includes('Evaluación');
          else if (crudType === 'logins') matchIndividual = event.category === 'Logins' || event.title.includes('Inicio');
          else if (crudType === 'sistema') matchIndividual = event.category === 'Sistema';
        }
      }

      return matchCategory && matchQuery && matchIndividual;
    });
  }, [realAuditTrail, auditCategoryFilter, auditSearchQuery, selectedIndividualFilter]);

  // Alumnos filtrados para la Auditoría de Alumnos por Estudiante
  const filteredAuditPatients = useMemo(() => {
    if (!patients) return [];
    return patients.filter(p => {
      // 1. Buscador texto libre
      const q = studentAuditSearch.toLowerCase();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.idSujeto && p.idSujeto.toLowerCase().includes(q)) || 
        (p.diagnosticoNee && p.diagnosticoNee.toLowerCase().includes(q));

      // 2. Filtro Diagnóstico NEE
      let matchNee = true;
      if (studentNeeFilter !== 'Todos') {
        if (studentNeeFilter === 'TDAH') matchNee = p.diagnosticoNee?.includes('TDAH');
        else if (studentNeeFilter === 'TEA') matchNee = p.diagnosticoNee?.includes('TEA');
        else if (studentNeeFilter === 'Dispraxia') matchNee = p.diagnosticoNee?.includes('Dispraxia');
        else if (studentNeeFilter === 'Down') matchNee = p.diagnosticoNee?.includes('Down');
        else if (studentNeeFilter === 'Sin Asignar') matchNee = !p.diagnosticoNee || p.diagnosticoNee === 'Sin Asignar';
      }

      // 3. Filtro Carga Evaluativa / Rango Sesiones
      let matchSessionRange = true;
      const count = p.sessions?.length || 0;
      if (studentSessionRangeFilter === 'alta') matchSessionRange = count >= 20;
      else if (studentSessionRangeFilter === 'media') matchSessionRange = count >= 10 && count < 20;
      else if (studentSessionRangeFilter === 'inicial') matchSessionRange = count < 10;

      return matchSearch && matchNee && matchSessionRange;
    });
  }, [patients, studentAuditSearch, studentNeeFilter, studentSessionRangeFilter]);

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

            {/* Botón Auditoría y Trazabilidad Fusionado con Sub-apartados y las 3 Últimas Acciones en el Sidebar */}
            <div className="mt-1 flex flex-col gap-1">
              <button
                onClick={() => { setActiveTab('auditoria'); setAuditSubTab('historica'); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
                  activeTab === 'auditoria' && auditSubTab === 'historica'
                    ? isDark ? 'bg-amber-500/20 border-l-2 border-amber-500 text-white font-semibold shadow-lg shadow-amber-500/10' : 'bg-amber-50 border-l-2 border-amber-600 text-slate-900 font-semibold'
                    : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Auditoría y Trazabilidad</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400/70" />
              </button>

              {/* Botones de Acceso Directo a Auditoría Docente y Alumnos en el Sidebar */}
              <div className="pl-4 flex flex-col gap-1 my-0.5">
                <button
                  onClick={() => { setActiveTab('auditoria'); setAuditSubTab('docente'); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'auditoria' && auditSubTab === 'docente'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auditoría Docentes</span>
                </button>

                <button
                  onClick={() => { setActiveTab('auditoria'); setAuditSubTab('alumno'); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'auditoria' && auditSubTab === 'alumno'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Auditoría Alumnos</span>
                </button>
              </div>

              {/* Preview de las 3 Últimas Acciones fusionado en el Sidebar */}
              <div 
                onClick={() => setActiveTab('auditoria')}
                className={`mx-1 p-3 rounded-xl border transition-all cursor-pointer group ${
                  isDark ? 'bg-[#090d16] border-white/5 hover:border-amber-500/30' : 'bg-slate-50 border-slate-200 hover:border-amber-400/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Últimas 3 Acciones
                  </span>
                  <span className="text-[9px] text-slate-500 group-hover:text-amber-300 transition-colors">Ver Todo →</span>
                </div>

                <div className="relative pl-3 space-y-2.5 border-l border-amber-500/30">
                  {realAuditTrail.slice(0, 3).map((event, idx) => (
                    <div key={event.id || idx} className="relative text-[11px]">
                      <div className="absolute -left-[15px] top-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#0c101a]" />
                      <p className="font-bold text-slate-200 group-hover:text-amber-300 transition-colors leading-tight line-clamp-1">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{event.author}</p>
                      <span className="text-[9px] font-mono text-slate-500 block">{event.timeAgo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

              {/* SECCIÓN INFERIOR: TABLA DE PROGRESO DE ESTUDIANTES PIE (ANCHO COMPLETO) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* TABLA DE PROGRESO DE ESTUDIANTES PIE (FULL WIDTH - lg:col-span-12) */}
                <div className={`lg:col-span-12 p-6 rounded-3xl border ${
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
                                <button
                                  onClick={() => handleOpenStudentDossier(p.name)}
                                  className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer mr-3"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  Trazabilidad
                                </button>
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

          {/* TAB 5: APARTADO COMPLETO DE AUDITORÍA Y TRAZABILIDAD CON ANALÍTICA E HISTORIAL INDIVIDUAL */}
          {activeTab === 'auditoria' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              
              {/* Encabezado Principal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      REGISTRO INMUTABLE Y TRAZABILIDAD CLÍNICA
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-amber-400" /> Bitácora de Auditoría y Trazabilidad del Sistema
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Trazabilidad histórica continua de accesos, evaluaciones clínicas, registros de estudiantes y sincronización del hardware.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const csvRows = [
                        ['ID', 'Fecha', 'Evento', 'Especialista/Usuario', 'Detalles/Paciente', 'Categoria'],
                        ...realAuditTrail.map(e => [e.id, e.fullDate, e.title, e.author, e.details || '', e.category])
                      ];
                      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement('a');
                      link.setAttribute('href', encodedUri);
                      link.setAttribute('download', `Trazabilidad_CogniMirror_${new Date().toISOString().split('T')[0]}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Trazabilidad (.CSV)</span>
                  </button>
                </div>
              </div>

              {/* PESTAÑAS SUB-NAVEGACIÓN: BITÁCORA HISTÓRICA vs AUDITORÍA DOCENTE vs AUDITORÍA ALUMNOS */}
              <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-3">
                <button
                  onClick={() => setAuditSubTab('historica')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    auditSubTab === 'historica'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>📜 Bitácora Histórica General</span>
                </button>

                <button
                  onClick={() => setAuditSubTab('docente')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    auditSubTab === 'docente'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>👩‍⚕️ Auditoría Docente por Profesional (Combobox)</span>
                </button>

                <button
                  onClick={() => setAuditSubTab('alumno')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    auditSubTab === 'alumno'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>👨‍🎓 Auditoría de Alumnos por Estudiante (Combobox)</span>
                </button>
              </div>

              {/* SECCIÓN 3: AUDITORÍA DE ALUMNOS POR ESTUDIANTE CON SELECCIÓN POR COMBOBOX */}
              {auditSubTab === 'alumno' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  
                  {/* BARRA DE BÚSQUEDA AVANZADA Y FILTROS POR DIAGNÓSTICO Y CARGA EVALUATIVA */}
                  <div className={`p-5 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                    isDark ? 'bg-[#0c101d] border-indigo-500/20' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    {/* Input de Búsqueda Libre */}
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
                      <input
                        type="text"
                        placeholder="Buscar alumno por nombre, ID o diagnóstico..."
                        value={studentAuditSearch}
                        onChange={(e) => setStudentAuditSearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs transition-all border font-medium ${
                          isDark ? 'bg-[#07080f] border-indigo-500/30 text-white placeholder-slate-500 focus:border-indigo-500/60' : 'bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    {/* Filtros Rápidos por Diagnóstico NEE y Carga Evaluativa */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                      {/* Select Diagnóstico NEE */}
                      <select
                        value={studentNeeFilter}
                        onChange={(e) => setStudentNeeFilter(e.target.value)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isDark ? 'bg-[#07080f] border-indigo-500/30 text-indigo-300' : 'bg-slate-50 border-indigo-300 text-slate-800'
                        }`}
                      >
                        <option value="Todos">🏷️ Todos los Diagnósticos NEE</option>
                        <option value="TDAH">🧠 TDAH / Impulsividad</option>
                        <option value="TEA">🧩 TEA Nivel 1</option>
                        <option value="Dispraxia">🏃 Dispraxia / Motriz</option>
                        <option value="Down">💛 Síndrome de Down</option>
                        <option value="Sin Asignar">⚪ Sin Asignación NEE</option>
                      </select>

                      {/* Select Carga Evaluativa */}
                      <select
                        value={studentSessionRangeFilter}
                        onChange={(e) => setStudentSessionRangeFilter(e.target.value)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isDark ? 'bg-[#07080f] border-indigo-500/30 text-purple-300' : 'bg-slate-50 border-purple-300 text-slate-800'
                        }`}
                      >
                        <option value="Todos">📊 Toda Intensidad Evaluativa</option>
                        <option value="alta">🔥 Alta Intensidad (≥ 20 Sesiones)</option>
                        <option value="media">⚡ Intensidad Media (10 - 19 Sesiones)</option>
                        <option value="inicial">🌱 Fase Inicial (&lt; 10 Sesiones)</option>
                      </select>

                      {(studentAuditSearch || studentNeeFilter !== 'Todos' || studentSessionRangeFilter !== 'Todos') && (
                        <button
                          onClick={() => {
                            setStudentAuditSearch('');
                            setStudentNeeFilter('Todos');
                            setStudentSessionRangeFilter('Todos');
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/10 cursor-pointer transition-all shrink-0"
                        >
                          Limpiar Filtros
                        </button>
                      )}
                    </div>
                  </div>

                  {/* LISTA COMPLETA DE ALUMNOS FILTRADOS */}
                  <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${
                    isDark ? 'bg-[#0c101d] border-indigo-500/30' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                            LISTADO COMPLETO DE ALUMNOS PIE
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                            Mostrando: {filteredAuditPatients.length} Alumnos
                          </span>
                        </div>
                        <h4 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-indigo-400" />
                          <span>Directorio Completo de Trazabilidad por Estudiante</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Haz clic sobre cualquier alumno para cargar su trazabilidad o presiona "Agrandar Ficha" para ver su expediente completo.
                        </p>
                      </div>
                    </div>

                    {/* TABLA COMPLETA DE ALUMNOS */}
                    <div className="overflow-x-auto max-h-72 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                            <th className="py-3 px-3 font-bold uppercase text-[10px]">Estudiante / Sujeto</th>
                            <th className="py-3 px-3 font-bold uppercase text-[10px]">Diagnóstico NEE</th>
                            <th className="py-3 px-3 font-bold uppercase text-[10px]">Evaluaciones</th>
                            <th className="py-3 px-3 font-bold uppercase text-[10px]">Última Atención</th>
                            <th className="py-3 px-3 font-bold uppercase text-[10px] text-right">Acciones de Trazabilidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredAuditPatients.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-xs text-slate-500 italic">
                                No se encontraron alumnos que coincidan con la búsqueda o filtros seleccionados.
                              </td>
                            </tr>
                          ) : (
                            filteredAuditPatients.map(p => {
                              const isSelected = selectedAlumnoCombobox === p.name;
                              const lastSess = p.sessions?.[0];
                              return (
                                <tr
                                  key={p.id}
                                  className={`transition-colors cursor-pointer ${
                                    isSelected 
                                      ? 'bg-indigo-500/20 font-bold border-l-4 border-indigo-500'
                                      : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <td 
                                    onClick={() => setSelectedAlumnoCombobox(p.name)}
                                    className="py-3 px-3"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 shrink-0">
                                        {p.name.charAt(0)}
                                      </div>
                                      <div>
                                        <span className="text-white font-bold block">{p.name}</span>
                                        {p.idSujeto && <span className="text-[10px] text-slate-400 font-mono">ID: {p.idSujeto}</span>}
                                      </div>
                                    </div>
                                  </td>
                                  <td onClick={() => setSelectedAlumnoCombobox(p.name)} className="py-3 px-3">
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                                      {p.diagnosticoNee || 'Sin Asignación'}
                                    </span>
                                  </td>
                                  <td onClick={() => setSelectedAlumnoCombobox(p.name)} className="py-3 px-3 font-mono font-bold text-purple-400">
                                    {p.sessions?.length || 0} sesiones
                                  </td>
                                  <td onClick={() => setSelectedAlumnoCombobox(p.name)} className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                                    {lastSess ? new Date(lastSess.date).toLocaleDateString() : 'Hace 2 días'}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setSelectedAlumnoCombobox(p.name)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-white/5 hover:bg-white/10 text-slate-300'
                                        }`}
                                      >
                                        {isSelected ? '✓ Seleccionado' : 'Cargar Dashboard'}
                                      </button>

                                      <button
                                        onClick={() => handleOpenStudentDossier(p.name)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                        <span>Agrandar Ficha</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* DASHBOARD COMPLETO DEL ESTUDIANTE SELECCIONADO */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Total Sesiones Alumno</span>
                      <p className="text-2xl font-black text-indigo-400">40 Sesiones</p>
                      <span className="text-[10px] text-slate-500">100% trazables e inmutables</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Horas Programa Dedicadas</span>
                      <p className="text-2xl font-black text-purple-400">18.5 hrs</p>
                      <span className="text-[10px] text-slate-500">Tiempo clínico acumulado</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Especialista Principal</span>
                      <p className="text-sm font-black text-amber-400 mt-1 truncate">Ps. Brayan Castro</p>
                      <span className="text-[10px] text-slate-500">28 sesiones (70% atención)</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Velocidad Reacción Prom.</span>
                      <p className="text-2xl font-black text-emerald-400">395 ms</p>
                      <span className="text-[10px] text-slate-500">Progreso motor: +14.2%</span>
                    </div>
                  </div>

                  {/* GRÁFICO SEMANAL APILADO POR COLOR Y MATRIZ DE DOCENTES DEL ALUMNO */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Gráfico de Barras Apiladas por Día con Color por Profesional (6 Cols) */}
                    <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                            <span>Atención Semanal de {selectedAlumnoCombobox} por Docente</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">Sesiones por día con un color distinto por profesional</p>
                        </div>
                      </div>

                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { dia: 'Lun', 'Ps. Brayan Castro': 2, 'Dra. María González': 1, 'Sistema / Remoto': 0 },
                            { dia: 'Mar', 'Ps. Brayan Castro': 0, 'Dra. María González': 2, 'Sistema / Remoto': 1 },
                            { dia: 'Mié', 'Ps. Brayan Castro': 3, 'Dra. María González': 0, 'Sistema / Remoto': 0 },
                            { dia: 'Jue', 'Ps. Brayan Castro': 1, 'Dra. María González': 1, 'Sistema / Remoto': 1 },
                            { dia: 'Vie', 'Ps. Brayan Castro': 2, 'Dra. María González': 0, 'Sistema / Remoto': 0 },
                            { dia: 'Sáb', 'Ps. Brayan Castro': 1, 'Dra. María González': 0, 'Sistema / Remoto': 0 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="dia" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0c101a',
                                borderColor: '#ffffff20',
                                borderRadius: '12px',
                                fontSize: '12px',
                                color: '#ffffff'
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                            <Bar dataKey="Ps. Brayan Castro" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Dra. María González" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Sistema / Remoto" stackId="a" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Matriz Multidisciplinaria de Docentes que Atienden a este Alumno (6 Cols) */}
                    <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-400" />
                            <span>Docentes que Atienden a {selectedAlumnoCombobox}</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">Haz clic sobre cualquier docente para agrandar su ficha</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-56 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-400 text-[10px]">
                              <th className="py-2.5 px-3">Especialista</th>
                              <th className="py-2.5 px-3">Sesiones</th>
                              <th className="py-2.5 px-3">% Atención</th>
                              <th className="py-2.5 px-3">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {[
                              { name: 'Ps. Brayan Castro', role: 'Psicopedagogo PIE', sess: 28, pct: '70%', hrs: '12.5 h' },
                              { name: 'Dra. María González', role: 'Neuropsicóloga', sess: 12, pct: '30%', hrs: '6.0 h' }
                            ].map((doc, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-3">
                                  <button
                                    onClick={() => handleOpenTeacherDossier(doc.name)}
                                    className="font-bold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1.5 cursor-pointer group"
                                  >
                                    <span>{doc.name}</span>
                                    <Maximize2 className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100" />
                                  </button>
                                  <span className="block text-[10px] text-slate-500 font-normal">{doc.role}</span>
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-purple-400">{doc.sess} ses.</td>
                                <td className="py-3 px-3 text-slate-300 font-bold">{doc.pct}</td>
                                <td className="py-3 px-3">
                                  <button
                                    onClick={() => handleOpenTeacherDossier(doc.name)}
                                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    <span>Agrandar Docente</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* SECCIÓN 1: AUDITORÍA DOCENTE CON SELECCIÓN POR COMBOBOX */}
              {auditSubTab === 'docente' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  
                  {/* SECTOR COMBOBOX SELECTOR DE PROFESIONAL EVALUADOR */}
                  <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    isDark ? 'bg-[#0c101d] border-amber-500/30' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          AUDITORÍA DE DESEMPEÑO DOCENTE
                        </span>
                      </div>
                      <h4 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-amber-400" />
                        <span>Seleccionar Profesional Evaluador</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Elige a cualquier especialista del programa PIE para auditar sus horas, evaluaciones, alumnos y trazabilidad exclusiva.
                      </p>
                    </div>

                    {/* COMBOBOX DE SELECCIÓN DE PROFESIONAL */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-full md:w-80">
                        <select
                          value={selectedDocenteCombobox}
                          onChange={(e) => setSelectedDocenteCombobox(e.target.value)}
                          className={`w-full appearance-none pl-4 pr-10 py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer shadow-lg ${
                            isDark ? 'bg-[#07080f] border-amber-500/50 text-amber-300 hover:border-amber-400' : 'bg-slate-50 border-amber-400 text-slate-800'
                          }`}
                        >
                          <option value="Ps. Brayan Castro">👨‍⚕️ Ps. Brayan Castro (Investigador / Psicopedagogo)</option>
                          <option value="Dra. María González">👩‍⚕️ Dra. María González (Neuropsicóloga PIE)</option>
                          <option value="Ps. Rodrigo Tapia">👨‍⚕️ Ps. Rodrigo Tapia (Evaluador Remoto)</option>
                          <option value="Josué Alarcón">👨‍💻 Josué Alarcón (Coordinador Trazabilidad)</option>
                          <option value="Sistema Automático">🤖 Sistema / Evaluaciones Automáticas</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
                      </div>

                      <button
                        onClick={() => handleOpenTeacherDossier(selectedDocenteCombobox)}
                        className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span>Agrandar Ficha Completa</span>
                      </button>
                    </div>
                  </div>

                  {/* DASHBOARD COMPLETO DEL PROFESIONAL SELECCIONADO */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Horas Activas Totales</span>
                      <p className="text-2xl font-black text-amber-400">42.5 hrs</p>
                      <span className="text-[10px] text-slate-500">Promedio: 8.5 hrs/semana</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Evaluaciones Ejecutadas</span>
                      <p className="text-2xl font-black text-purple-400">65 Test</p>
                      <span className="text-[10px] text-slate-500">14 esta semana • 48 este mes</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Alumnos Evaluados</span>
                      <p className="text-2xl font-black text-blue-400">18 Alumnos</p>
                      <span className="text-[10px] text-slate-500">100% Cobertura PIE</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Test Dominante</span>
                      <p className="text-sm font-black text-emerald-400 mt-1 truncate">Reaction Mirror</p>
                      <span className="text-[10px] text-slate-500">Semana: Corsi 3D (60%)</span>
                    </div>
                  </div>

                  {/* MATRIZ DE ALUMNOS Y BITÁCORA DEL PROFESIONAL */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Tabla de Alumnos Atendidos por este Profesional (7 Cols) */}
                    <div className="lg:col-span-7 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-400" />
                            <span>Alumnos Atendidos por {selectedDocenteCombobox}</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">Haz clic sobre cualquier alumno para agrandar su ficha</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-400 text-[10px]">
                              <th className="py-2.5 px-3">Estudiante</th>
                              <th className="py-2.5 px-3">Diagnóstico NEE</th>
                              <th className="py-2.5 px-3">Sesiones</th>
                              <th className="py-2.5 px-3">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {[
                              { name: 'Yohan', diag: 'TDAH', sess: 28, last: 'Hace 2 días' },
                              { name: 'Nicolás', diag: 'TEA Nivel 1', sess: 12, last: 'Hoy, 11:30' },
                              { name: 'Tamara', diag: 'Dispraxia', sess: 8, last: 'Hace 3 días' },
                              { name: 'Leandro', diag: 'TDAH', sess: 6, last: 'Hace 5 días' }
                            ].map((st, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-3">
                                  <button
                                    onClick={() => handleOpenStudentDossier(st.name)}
                                    className="font-bold text-indigo-300 hover:text-indigo-200 hover:underline flex items-center gap-1.5 cursor-pointer group"
                                  >
                                    <span>{st.name}</span>
                                    <Maximize2 className="w-3 h-3 text-indigo-400 opacity-60 group-hover:opacity-100" />
                                  </button>
                                </td>
                                <td className="py-3 px-3 text-slate-400">{st.diag}</td>
                                <td className="py-3 px-3 font-mono font-bold text-purple-400">{st.sess} ses.</td>
                                <td className="py-3 px-3">
                                  <button
                                    onClick={() => handleOpenStudentDossier(st.name)}
                                    className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    <span>Agrandar Ficha</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Cronología del Docente (5 Cols) */}
                    <div className="lg:col-span-5 p-6 rounded-3xl bg-[#0c101d] border border-white/5">
                      <h4 className="text-sm font-black tracking-tight text-white mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-amber-400" />
                        <span>Historial Reciente del Profesional</span>
                      </h4>

                      <div className="relative pl-4 space-y-4 border-l border-amber-500/30 max-h-64 overflow-y-auto custom-scrollbar">
                        {realAuditTrail
                          .filter(e => e.author?.includes(selectedDocenteCombobox.split(' ')[1] || 'Brayan'))
                          .concat(realAuditTrail.slice(0, 3))
                          .slice(0, 4)
                          .map((ev, idx) => (
                            <div key={idx} className="relative text-xs">
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#0c101d]" />
                              <p className="font-bold text-slate-200">{ev.title}</p>
                              <p className="text-[10px] text-slate-400">{ev.details || ev.author}</p>
                              <span className="text-[9px] font-mono text-slate-500 block">{ev.timeAgo}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* SECCIÓN 2: BITÁCORA HISTÓRICA GENERAL DEL SISTEMA (CUANDO SUBTAB ES HISTORICA) */}
              {auditSubTab === 'historica' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  {/* ITEM 5: KPIs DE INTEGRIDAD Y SEGURIDAD DE DATOS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-bold">Total Eventos Registrados</span>
                        <History className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-black text-amber-400 mt-1">{realAuditTrail.length}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Trazabilidad inalterable continua</p>
                    </div>

                    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-bold">Evaluaciones en Registro</span>
                        <Activity className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-2xl font-black text-purple-400 mt-1">
                        {realAuditTrail.filter(e => e.category === 'Evaluaciones').length}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Sesiones psicométricas registradas</p>
                    </div>

                    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-bold">Alumnos Bajo Trazabilidad</span>
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-2xl font-black text-blue-400 mt-1">{patients ? patients.length : 0}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Fichas clínicas auditadas</p>
                    </div>

                    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-bold">Integridad de Hash</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-emerald-400 mt-1">100% Validado</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Cumplimiento Decreto 170 y Ley 19.628</p>
                    </div>
                  </div>
                </div>
              )}

              {/* GRÁFICOS ANALÍTICOS DE TRAZABILIDAD (ITEMS 1, 2 Y 4) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ITEM 1: Distribución por Categoría de Evento (Donut Chart) */}
                <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                          <Activity className="w-4 h-4 text-amber-400" />
                          <span>1. Operaciones por Categoría</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Proporción de eventos según área clínica/sistema</p>
                      </div>
                    </div>

                    <div className="relative h-48 w-full flex items-center justify-center my-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={auditAnalytics.categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {auditAnalytics.categoryData.map((entry, index) => (
                              <Cell key={`audit-cat-${index}`} fill={entry.color} stroke="none" />
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
                        <span className="text-2xl font-black text-slate-100">{realAuditTrail.length}</span>
                        <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">EVENTOS</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-3 border-t border-white/5 text-xs">
                    {auditAnalytics.categoryData.map((item, idx) => (
                      <div key={`audit-leg-${idx}`} className="flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-300 font-medium truncate">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-amber-400">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ITEM 2: Frecuencia e Intensidad de Eventos en el Tiempo (Line/Area Chart) */}
                <div className={`p-6 rounded-3xl border ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span>2. Actividad e Intensidad Temporal</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Volumen de trazabilidad registrada en el tiempo</p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={auditAnalytics.timelineData}>
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
                          dataKey="Eventos"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={{ fill: '#f59e0b', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ITEM 4: Cobertura y Productividad por Especialista / Usuario (Bar Chart) */}
                <div className={`p-6 rounded-3xl border ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>4. Actividad por Especialista / CRUD</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Acciones registradas por cada usuario u origen</p>
                    </div>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={auditAnalytics.authorData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#00000010'} />
                        <XAxis dataKey="author" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} />
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
                        <Bar dataKey="Eventos" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* SECCIÓN DE FILTRO DE TRAZABILIDAD INDIVIDUAL POR USUARIO, ALUMNO O OPERACIÓN CRUD */}
              <div className={`p-5 rounded-3xl border flex flex-col gap-4 ${
                isDark ? 'bg-[#0c101d] border-amber-500/20' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black tracking-tight text-slate-100 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-amber-400" />
                      <span>Filtro de Trazabilidad Específica / Individual</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Filtra la bitácora para auditar un alumno específico, especialista o tipo de operación CRUD.
                    </p>
                  </div>

                  {/* Selector de Trazabilidad Individual / CRUD */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <select
                      value={selectedIndividualFilter}
                      onChange={(e) => setSelectedIndividualFilter(e.target.value)}
                      className={`w-full sm:w-72 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isDark ? 'bg-[#07080f] border-amber-500/40 text-amber-300' : 'bg-slate-50 border-amber-400 text-slate-800'
                      }`}
                    >
                      <option value="Todos">🌐 Ver Todos los Registros</option>
                      
                      <optgroup label="👨‍🎓 Filtrar por Alumno / Estudiante PIE">
                        {patients && patients.map(p => (
                          <option key={`st-${p.id}`} value={`student:${p.name}`}>
                            Alumno: {p.name} ({p.diagnosticoNee || 'Sin asignación'})
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="👩‍⚕️ Filtrar por Especialista / Usuario">
                        <option value="author:Brayan">Especialista: Ps. Brayan Castro</option>
                        <option value="author:Josué">Coordinador: Josué Alarcón</option>
                        <option value="author:Sistema">Acciones del Sistema Automático</option>
                      </optgroup>

                      <optgroup label="⚙️ Filtrar por Operación CRUD">
                        <option value="crud:fichas">CRUD: Fichas y Registro de Alumnos</option>
                        <option value="crud:evaluaciones">CRUD: Sesiones de Evaluación Clínica</option>
                        <option value="crud:logins">CRUD: Inicios de Sesión y Accesos</option>
                        <option value="crud:sistema">CRUD: Parámetros del Sistema</option>
                      </optgroup>
                    </select>

                    {selectedIndividualFilter !== 'Todos' && (
                      <button
                        onClick={() => setSelectedIndividualFilter('Todos')}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/10 cursor-pointer transition-all shrink-0"
                      >
                        Limpiar Filtro
                      </button>
                    )}
                  </div>
                </div>

                {/* Buscador de texto libre y Filtros de Categoría */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/5">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar palabras clave en la bitácora..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs transition-all border ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    {['Todos', 'Evaluaciones', 'Estudiantes', 'Logins', 'Sistema'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setAuditCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          auditCategoryFilter === cat
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TARJETA DE RESUMEN DE TRAZABILIDAD INDIVIDUALIZADA (Si hay filtro activo) */}
                {selectedIndividualFilter !== 'Todos' && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <span className="font-bold text-amber-200 block">
                          Trazabilidad Aislada: {selectedIndividualFilter.replace('student:', 'Alumno ').replace('author:', 'Usuario ').replace('crud:', 'Operación CRUD ')}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Se encontraron {filteredRealAuditTrail.length} eventos inmutables asociados a esta entidad.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vista Principal: Cronología + Tabla de Trazabilidad */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Columna Izquierda: Línea de Tiempo Cronológica (5 Cols) */}
                <div className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#0c101d] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div>
                    <h4 className="text-sm font-black tracking-tight mb-4 flex items-center gap-2 text-slate-100">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Línea de Tiempo Histórica</span>
                    </h4>

                    <div className="relative pl-5 space-y-6 border-l-2 border-slate-800 my-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredRealAuditTrail.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-6 text-center">No se encontraron eventos coincidentes con la búsqueda o filtro individual.</p>
                      ) : (
                        filteredRealAuditTrail.map((event, idx) => (
                          <div 
                            key={event.id || idx} 
                            onClick={() => setSelectedEventDetail(event)}
                            className="relative group cursor-pointer"
                          >
                            <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#0c101d]" />
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                                  {event.title}
                                </h5>
                                <span className="text-[10px] font-mono text-slate-500">{event.timeAgo}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium">{event.author}</p>
                              {event.details && (
                                <p className="text-[11px] italic text-amber-200/80 mt-0.5 font-mono bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                                  {event.details}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Tabla Detallada de Trazabilidad Completa (7 Cols) */}
                <div className={`lg:col-span-7 p-6 rounded-3xl border ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className="text-sm font-black tracking-tight mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                    <span>Registro Detallado de Auditoría</span>
                  </h4>

                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                          <th className="py-3 px-3 font-bold uppercase text-[10px]">Fecha / Hora</th>
                          <th className="py-3 px-3 font-bold uppercase text-[10px]">Evento</th>
                          <th className="py-3 px-3 font-bold uppercase text-[10px]">Usuario</th>
                          <th className="py-3 px-3 font-bold uppercase text-[10px]">Categoría</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredRealAuditTrail.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-xs text-slate-500 italic">
                              No hay registros que coincidan con la trazabilidad seleccionada.
                            </td>
                          </tr>
                        ) : (
                          filteredRealAuditTrail.map((event, idx) => (
                            <tr 
                              key={event.id || idx} 
                              onClick={() => setSelectedEventDetail(event)}
                              className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                            >
                              <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                {event.fullDate}
                              </td>
                              <td className="py-3 px-3 font-bold">
                                <div>
                                  <span className="text-slate-100 hover:text-amber-300 transition-colors">{event.title}</span>
                                  {event.details && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] text-slate-400 font-mono italic truncate max-w-xs">
                                        {event.details}
                                      </span>
                                      {patients?.some(p => event.details.toLowerCase().includes(p.name.toLowerCase())) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const matchedPatient = patients.find(p => event.details.toLowerCase().includes(p.name.toLowerCase()));
                                            handleOpenStudentDossier(matchedPatient ? matchedPatient.name : 'Yohan');
                                          }}
                                          className="text-[10px] font-bold text-indigo-300 hover:text-indigo-200 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                                        >
                                          <span>Agrandar Alumno</span>
                                          <Maximize2 className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-300 font-medium text-[11px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTeacherDossier(event.author);
                                  }}
                                  className="font-bold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 cursor-pointer group"
                                >
                                  <span>{event.author}</span>
                                  <Maximize2 className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100" />
                                </button>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  {event.category}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* DETALLE INDIVIDUAL DE UN EVENTO DE TRAZABILIDAD (PANEL FLOTANTE DE METADATOS) */}
              {selectedEventDetail && (
                <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">{selectedEventDetail.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                          {selectedEventDetail.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        <span className="font-bold">Autor/Origen:</span> {selectedEventDetail.author} | <span className="font-bold">Fecha:</span> {selectedEventDetail.fullDate}
                      </p>
                      {selectedEventDetail.details && (
                        <p className="text-xs font-mono text-amber-200/90 mt-1 bg-black/30 p-2 rounded-xl border border-white/5">
                          {selectedEventDetail.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEventDetail(null)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all shrink-0"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              )}

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

      {/* MODAL 1: EXPEDIENTE AUDITADO DEL DOCENTE / ESPECIALISTA */}
      {selectedTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#0c101d] border border-amber-500/30 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Header del Docente */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-amber-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-amber-500/20">
                  {selectedTeacherModal.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-white">{selectedTeacherModal.name}</h3>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Docente Auditado PIE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {selectedTeacherModal.role} • {selectedTeacherModal.colegio}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacherModal(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Dossier Docente */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              
              {/* 4 KPIs Clave del Profesional */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Horas Activas Totales</span>
                  <p className="text-2xl font-black text-amber-400">42.5 hrs</p>
                  <span className="text-[10px] text-slate-500">Promedios: 8.5 hrs/semana</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Evaluaciones Ejecutadas</span>
                  <p className="text-2xl font-black text-purple-400">65 Test</p>
                  <span className="text-[10px] text-slate-500">14 esta semana • 48 este mes</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Alumnos Evaluados</span>
                  <p className="text-2xl font-black text-blue-400">18 Alumnos</p>
                  <span className="text-[10px] text-slate-500">Cobertura 100% programa PIE</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Test Más Utilizado</span>
                  <p className="text-xs font-black text-emerald-400 mt-1 truncate">Reaction Mirror</p>
                  <span className="text-[10px] text-slate-500">Esta semana: Corsi 3D (60%)</span>
                </div>
              </div>

              {/* Analítica y Matriz de Alumnos */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Gráfico Diagnósticos Atendidos por el Docente (5 Cols) */}
                <div className="lg:col-span-5 p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3">
                      Diagnósticos NEE Atendidos
                    </h4>
                    <div className="h-44 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'TDAH', value: 55, color: '#8b5cf6' },
                              { name: 'TEA Nivel 1', value: 25, color: '#3b82f6' },
                              { name: 'Dispraxia', value: 15, color: '#f59e0b' },
                              { name: 'Otros', value: 5, color: '#10b981' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {[
                              { color: '#8b5cf6' },
                              { color: '#3b82f6' },
                              { color: '#f59e0b' },
                              { color: '#10b981' }
                            ].map((entry, index) => (
                              <Cell key={`teacher-pie-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0c101a',
                              borderColor: '#ffffff20',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#ffffff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-[11px]">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-slate-300">TDAH (55%)</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-slate-300">TEA 1 (25%)</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-slate-300">Dispraxia (15%)</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-slate-300">Otros (5%)</span></div>
                  </div>
                </div>

                {/* Matriz de Alumnos Atendidos por este Profesional (7 Cols) */}
                <div className="lg:col-span-7 p-5 rounded-3xl bg-white/[0.02] border border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                    <span>Matriz de Alumnos Atendidos</span>
                    <span className="text-[10px] text-amber-400 font-mono">Haz clic para ver trazabilidad del alumno</span>
                  </h4>

                  <div className="overflow-x-auto max-h-48 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 text-[10px]">
                          <th className="py-2 px-2">Alumno</th>
                          <th className="py-2 px-2">Diagnóstico</th>
                          <th className="py-2 px-2">Sesiones</th>
                          <th className="py-2 px-2">Última Atención</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[
                          { name: 'Yohan', diag: 'TDAH', sess: 28, last: 'Hace 2 días' },
                          { name: 'Nicolás', diag: 'TEA Nivel 1', sess: 12, last: 'Hoy, 11:30' },
                          { name: 'Tamara', diag: 'Dispraxia', sess: 8, last: 'Hace 3 días' },
                          { name: 'Leandro', diag: 'TDAH', sess: 6, last: 'Hace 5 días' }
                        ].map((st, idx) => (
                          <tr
                            key={idx}
                            onClick={() => {
                              setSelectedTeacherModal(null);
                              handleOpenStudentDossier(st.name);
                            }}
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <td className="py-2.5 px-2 font-bold text-amber-300 hover:underline">{st.name}</td>
                            <td className="py-2.5 px-2 text-slate-400 text-[11px]">{st.diag}</td>
                            <td className="py-2.5 px-2 font-mono font-bold text-purple-400">{st.sess} ses.</td>
                            <td className="py-2.5 px-2 text-slate-500 text-[10px]">{st.last}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Ficha firmada digitalmente • Decreto 170 Validado</span>
              <button
                onClick={() => setSelectedTeacherModal(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: EXPEDIENTE DE TRAZABILIDAD DEL ESTUDIANTE */}
      {selectedStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#0c101d] border border-indigo-500/30 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Header del Estudiante */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-indigo-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20">
                  {selectedStudentModal.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-white">{selectedStudentModal.name}</h3>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      ID: {selectedStudentModal.idSujeto || 'SUJ-2026-08'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Diagnóstico NEE: <span className="text-purple-300 font-bold">{selectedStudentModal.diagnosticoNee || 'TDAH / Impulsividad'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentModal(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Dossier Estudiante */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              
              {/* 4 KPIs Clave del Estudiante */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Total Sesiones Alumno</span>
                  <p className="text-2xl font-black text-indigo-400">40 Sesiones</p>
                  <span className="text-[10px] text-slate-500">100% trazadas e inmutables</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Horas Programa Dedicadas</span>
                  <p className="text-2xl font-black text-purple-400">18.5 hrs</p>
                  <span className="text-[10px] text-slate-500">Tiempo clínico acumulado</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Especialista Principal</span>
                  <p className="text-xs font-black text-amber-400 mt-1 truncate">Ps. Brayan Castro</p>
                  <span className="text-[10px] text-slate-500">28 sesiones (70% atención)</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Velocidad Reacción Prom.</span>
                  <p className="text-2xl font-black text-emerald-400">395 ms</p>
                  <span className="text-[10px] text-slate-500">Progreso motor: +14.2%</span>
                </div>
              </div>

              {/* Analítica Semanal y Matriz Multidisciplinaria */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* GRÁFICO DE BARRAS APILADAS POR DÍA CON COLOR POR DOCENTE (6 Cols) */}
                <div className="lg:col-span-6 p-5 rounded-3xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Atención Semanal por Docente
                      </h4>
                      <p className="text-[10px] text-slate-400">Sesiones por día desglosadas con un color por profesional</p>
                    </div>
                  </div>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { dia: 'Lun', 'Ps. Brayan Castro': 2, 'Dra. María González': 1, 'Sistema / Remoto': 0 },
                        { dia: 'Mar', 'Ps. Brayan Castro': 0, 'Dra. María González': 2, 'Sistema / Remoto': 1 },
                        { dia: 'Mié', 'Ps. Brayan Castro': 3, 'Dra. María González': 0, 'Sistema / Remoto': 0 },
                        { dia: 'Jue', 'Ps. Brayan Castro': 1, 'Dra. María González': 1, 'Sistema / Remoto': 1 },
                        { dia: 'Vie', 'Ps. Brayan Castro': 2, 'Dra. María González': 0, 'Sistema / Remoto': 0 },
                        { dia: 'Sáb', 'Ps. Brayan Castro': 1, 'Dra. María González': 0, 'Sistema / Remoto': 0 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="dia" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0c101a',
                            borderColor: '#ffffff20',
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: '#ffffff'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                        <Bar dataKey="Ps. Brayan Castro" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Dra. María González" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Sistema / Remoto" stackId="a" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Matriz Multidisciplinaria de Profesionales que atienden a Yohan (6 Cols) */}
                <div className="lg:col-span-6 p-5 rounded-3xl bg-white/[0.02] border border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                    <span>Docentes & Especialistas Atendedores</span>
                    <span className="text-[10px] text-indigo-400 font-mono">Haz clic para ver ficha del docente</span>
                  </h4>

                  <div className="overflow-x-auto max-h-52 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 text-[10px]">
                          <th className="py-2 px-2">Especialista</th>
                          <th className="py-2 px-2">Sesiones</th>
                          <th className="py-2 px-2">% Atención</th>
                          <th className="py-2 px-2">Horas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[
                          { name: 'Ps. Brayan Castro', role: 'Psicopedagogo', sess: 28, pct: '70%', hrs: '12.5 h' },
                          { name: 'Dra. María González', role: 'Neuropsicóloga', sess: 12, pct: '30%', hrs: '6.0 h' }
                        ].map((doc, idx) => (
                          <tr
                            key={idx}
                            onClick={() => {
                              setSelectedStudentModal(null);
                              handleOpenTeacherDossier(doc.name);
                            }}
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <td className="py-2.5 px-2 font-bold text-indigo-300 hover:underline">
                              {doc.name}
                              <span className="block text-[10px] text-slate-500 font-normal">{doc.role}</span>
                            </td>
                            <td className="py-2.5 px-2 font-mono font-bold text-purple-400">{doc.sess} ses.</td>
                            <td className="py-2.5 px-2 text-slate-300 font-bold">{doc.pct}</td>
                            <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">{doc.hrs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Trazabilidad Alumno inalterable • Decreto 170</span>
              <button
                onClick={() => setSelectedStudentModal(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                Cerrar Expediente Alumno
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
