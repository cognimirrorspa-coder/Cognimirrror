'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ClipboardCheck, CheckCircle2, AlertTriangle, AlertCircle, 
  Sparkles, Calendar, HeartPulse, User, Clock, ChevronRight, 
  ChevronLeft, ArrowRight, Filter, Smile, Meh, Frown, Coffee, 
  Pill, Moon, Search, Check, TrendingUp, Zap, HelpCircle, Save, 
  RotateCcw, School, Users, CheckCheck, Award, Flame, Play,
  UserX, UserCheck, AlertOctagon, Undo2
} from 'lucide-react';

import { usePatientsDB } from '../hooks/usePatientsDB';

// ── Web Audio Feedback Gamificado (Zero-Latency, No External Libs) ──
function playCheckinPop(freq = 540) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch(e) {}
}

function playCelebrationFanfare() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = ctx.currentTime + idx * 0.07;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  } catch(e) {}
}

// Opciones del Check-in Diario
const EMOTIONAL_STATES = [
  { id: 'alegre', label: 'Entusiasta', icon: '🌟', color: 'from-amber-500/20 to-yellow-500/10 text-amber-300 border-amber-500/40 hover:border-amber-400' },
  { id: 'calmo', label: 'Calmo / Regulado', icon: '😌', color: 'from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/40 hover:border-emerald-400' },
  { id: 'ansioso', label: 'Ansioso / Inquieto', icon: '😟', color: 'from-purple-500/20 to-indigo-500/10 text-purple-300 border-purple-500/40 hover:border-purple-400' },
  { id: 'cansado', label: 'Fatigado / Somnoliento', icon: '🥱', color: 'from-blue-500/20 to-cyan-500/10 text-blue-300 border-blue-500/40 hover:border-blue-400' },
  { id: 'irritable', label: 'Frustrado / Sensible', icon: '😤', color: 'from-rose-500/20 to-red-500/10 text-rose-300 border-rose-500/40 hover:border-rose-400' },
];

const ATTENTION_STATES = [
  { id: 'enfocado', label: 'Enfocado', desc: 'Atento a instrucciones y actividades', icon: '🎯' },
  { id: 'disperso', label: 'Disperso', desc: 'Le cuesta fijar o sostener la atención', icon: '🌀' },
  { id: 'hiperactivo', label: 'Inquietud Motriz', desc: 'Movimiento constante o impulsividad', icon: '⚡' },
  { id: 'resistente', label: 'Resistencia', desc: 'Evitación inicial o bloqueo conductual', icon: '🛑' },
];

const REGULATION_LEVELS = [
  { 
    id: 'verde', 
    label: 'Nivel Verde', 
    sublabel: 'Óptimo para aprender', 
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    indicator: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' 
  },
  { 
    id: 'amarillo', 
    label: 'Nivel Amarillo', 
    sublabel: 'Alerta temprana (requiere monitoreo)', 
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    indicator: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]' 
  },
  { 
    id: 'rojo', 
    label: 'Nivel Rojo', 
    sublabel: 'Riesgo alto de desregulación', 
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    indicator: 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]' 
  },
];

// Helper seguro para obtener el curso del estudiante
const getStudentCourse = (p) => {
  if (!p) return '1° Básico A';
  return p.cursoNombre || p.curso || (p.cursoNivel && p.cursoLetra ? `${p.cursoNivel} ${p.cursoLetra}` : p.cursoNivel) || '1° Básico A';
};

export default function CheckinDiarioPIE({ onNavigateToStudent = null, specialistName = 'Psicólogo PIE' }) {
  const { patients, cursos, loadingPatients } = usePatientsDB();

  // Reloj en vivo en la esquina
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fecha de hoy en formato legible (ej. "Dom, 27 Sept 2026")
  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const todayIsoKey = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Estados principales
  const [checkins, setCheckins] = useState({});
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedCursoFilter, setSelectedCursoFilter] = useState('Todos');
  const [searchStudent, setSearchStudent] = useState('');
  
  // Selector de vista: 'tarjetas' (default cambiante) | 'cursos' (tarjetas de curso) | 'lista' (listado)
  const [navMode, setNavMode] = useState('tarjetas');
  
  // Paso actual en tarjetas:
  // 0: Pregunta Asistencia ("¿Vino a clases hoy?")
  // 1: Emoción al llegar
  // 2: Atención
  // 3: Rutina y descanso
  // 4: Semáforo
  // 5: Éxito / Siguiente Alumno
  // 'ausente': Tarjeta de alumno ausente con opción de editar por llegada tarde
  const [cardStep, setCardStep] = useState(0);
  const [justAnsweredAnim, setJustAnsweredAnim] = useState(false);

  // Cargar checkins desde localStorage y sincronizar en tiempo real
  useEffect(() => {
    const loadCheckins = () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cognimirror_daily_checkins');
          if (stored) {
            setCheckins(JSON.parse(stored));
          }
        } catch (e) {
          console.error('Error cargando check-ins:', e);
        }
      }
    };

    loadCheckins();

    // Sincronización en tiempo real entre pestañas y eventos locales
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadCheckins);
      window.addEventListener('cognimirror_checkins_updated', loadCheckins);
      return () => {
        window.removeEventListener('storage', loadCheckins);
        window.removeEventListener('cognimirror_checkins_updated', loadCheckins);
      };
    }
  }, []);

  // Formulario del alumno seleccionado
  const [formState, setFormState] = useState({
    asistencia: 'presente', // 'presente' | 'ausente' | 'presente_tarde'
    emocion: 'calmo',
    atencion: 'enfocado',
    desayuno: true,
    medicacion: 'no_aplica',
    sueno: 'bueno',
    regulacion: 'verde',
    tags: [],
    observaciones: '',
    completedAt: null
  });

  // Al seleccionar paciente, cargar datos previos si ya completó hoy
  useEffect(() => {
    if (!selectedPatientId) return;
    const existing = checkins[todayIsoKey]?.[selectedPatientId];
    if (existing) {
      if (existing.asistencia === 'ausente') {
        setFormState({
          asistencia: 'ausente',
          emocion: 'calmo',
          atencion: 'enfocado',
          desayuno: true,
          medicacion: 'no_aplica',
          sueno: 'bueno',
          regulacion: 'verde',
          tags: [],
          observaciones: '',
          completedAt: existing.timestamp ? new Date(existing.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : null
        });
        setCardStep('ausente'); // Mostrar tarjeta de Ausente con botón de Llegada Tarde
      } else {
        setFormState({
          asistencia: existing.asistencia || 'presente',
          emocion: existing.emocion || 'calmo',
          atencion: existing.atencion || 'enfocado',
          desayuno: existing.desayuno ?? true,
          medicacion: existing.medicacion || 'no_aplica',
          sueno: existing.sueno || 'bueno',
          regulacion: existing.regulacion || 'verde',
          tags: existing.tags || [],
          observaciones: existing.observaciones || '',
          completedAt: existing.timestamp ? new Date(existing.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : null
        });
        setCardStep(5); // Mostrar tarjeta de completado con opción de editar
      }
    } else {
      setFormState({
        asistencia: 'presente',
        emocion: 'calmo',
        atencion: 'enfocado',
        desayuno: true,
        medicacion: 'no_aplica',
        sueno: 'bueno',
        regulacion: 'verde',
        tags: [],
        observaciones: '',
        completedAt: null
      });
      setCardStep(0); // Empezar en paso 0: ¿Vino a clases hoy?
    }
  }, [selectedPatientId, checkins, todayIsoKey]);

  // Si no hay paciente seleccionado al cargar, seleccionar el primer pendiente
  useEffect(() => {
    if (!selectedPatientId && patients && patients.length > 0) {
      const todays = checkins[todayIsoKey] || {};
      const firstPending = patients.find(p => !todays[p.id]);
      setSelectedPatientId(firstPending ? firstPending.id : patients[0].id);
    }
  }, [patients, selectedPatientId, checkins, todayIsoKey]);

  // Filtrado de alumnos
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    return patients.filter(p => {
      const pCurso = getStudentCourse(p);
      const matchCurso = selectedCursoFilter === 'Todos' || pCurso === selectedCursoFilter;
      const matchSearch = searchStudent.trim() === '' || 
        p.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
        (p.diagnosticoNee && p.diagnosticoNee.toLowerCase().includes(searchStudent.toLowerCase())) ||
        pCurso.toLowerCase().includes(searchStudent.toLowerCase());
      return matchCurso && matchSearch;
    });
  }, [patients, selectedCursoFilter, searchStudent]);

  // Conteo global de check-ins de hoy en la institución
  const todaysCheckins = checkins[todayIsoKey] || {};
  const totalStudents = patients?.length || 0;
  
  const presentCount = Object.values(todaysCheckins).filter(c => c.asistencia !== 'ausente').length;
  const absentCount = Object.values(todaysCheckins).filter(c => c.asistencia === 'ausente').length;
  const processedTodayCount = Object.keys(todaysCheckins).length;
  const completionPercentage = totalStudents > 0 ? Math.round((processedTodayCount / totalStudents) * 100) : 0;

  // Paciente activo
  const activePatient = useMemo(() => {
    return patients?.find(p => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Curso del paciente activo y alumnos de ese curso
  const activeCourseName = useMemo(() => {
    return activePatient ? getStudentCourse(activePatient) : '1° Básico A';
  }, [activePatient]);

  const studentsInActiveCourse = useMemo(() => {
    if (!patients) return [];
    return patients.filter(p => getStudentCourse(p) === activeCourseName);
  }, [patients, activeCourseName]);

  const activeCourseCompletedCount = useMemo(() => {
    return studentsInActiveCourse.filter(p => !!todaysCheckins[p.id]).length;
  }, [studentsInActiveCourse, todaysCheckins]);

  const activeCoursePendingCount = studentsInActiveCourse.length - activeCourseCompletedCount;
  const isActiveCourseFullyDone = studentsInActiveCourse.length > 0 && activeCoursePendingCount <= 0;

  // Lista de cursos con estadísticas para el modo "Cursos"
  const cursosStats = useMemo(() => {
    if (!patients) return [];
    const map = {};
    patients.forEach(p => {
      const c = getStudentCourse(p);
      if (!map[c]) map[c] = { nombre: c, total: 0, completed: 0, absents: 0, students: [] };
      map[c].total += 1;
      map[c].students.push(p);
      const chk = todaysCheckins[p.id];
      if (chk) {
        if (chk.asistencia === 'ausente') {
          map[c].absents += 1;
        } else {
          map[c].completed += 1;
        }
      }
    });

    const naturalOrder = [
      '1° Básico A', '1° Básico B', '2° Básico A', '2° Básico B', 
      '3° Básico A', '3° Básico B', '4° Básico A', '4° Básico B', 
      '5° Básico A', '5° Básico B', '6° Básico A', '1° Medio A'
    ];

    return Object.values(map).sort((a, b) => {
      const idxA = naturalOrder.indexOf(a.nombre);
      const idxB = naturalOrder.indexOf(b.nombre);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [patients, todaysCheckins]);

  // Conteo de cursos al 100% OK
  const completedCoursesCount = useMemo(() => {
    return cursosStats.filter(c => (c.completed + c.absents) >= c.total && c.total > 0).length;
  }, [cursosStats]);

  const isAllSchoolDone = totalStudents > 0 && processedTodayCount >= totalStudents;

  // 1. Siguiente alumno dentro del MISMO curso
  const nextStudentInCourse = useMemo(() => {
    if (!studentsInActiveCourse || studentsInActiveCourse.length === 0) return null;
    const curIdx = studentsInActiveCourse.findIndex(p => p.id === selectedPatientId);
    
    // Primero buscar hacia adelante dentro del curso
    const after = studentsInActiveCourse.slice(curIdx + 1).find(p => !todaysCheckins[p.id]);
    if (after) return after;

    // Buscar hacia atrás dentro del curso
    const before = studentsInActiveCourse.slice(0, curIdx).find(p => !todaysCheckins[p.id]);
    if (before) return before;

    return null;
  }, [studentsInActiveCourse, selectedPatientId, todaysCheckins]);

  // 2. Siguiente curso que tenga alumnos pendientes
  const nextPendingCourse = useMemo(() => {
    if (!cursosStats || cursosStats.length === 0) return null;
    const curCourseIdx = cursosStats.findIndex(c => c.nombre === activeCourseName);

    // Buscar en cursos posteriores
    const after = cursosStats.slice(curCourseIdx + 1).find(c => (c.completed + c.absents) < c.total);
    if (after) return after;

    // Buscar en cursos anteriores
    const before = cursosStats.slice(0, curCourseIdx).find(c => (c.completed + c.absents) < c.total);
    return before || null;
  }, [cursosStats, activeCourseName]);

  // Primer alumno pendiente del siguiente curso
  const firstStudentInNextCourse = useMemo(() => {
    if (!nextPendingCourse) return null;
    return nextPendingCourse.students.find(p => !todaysCheckins[p.id]) || nextPendingCourse.students[0] || null;
  }, [nextPendingCourse, todaysCheckins]);

  // Siguiente alumno global de respaldo
  const nextStudent = useMemo(() => {
    if (nextStudentInCourse) return nextStudentInCourse;
    if (firstStudentInNextCourse) return firstStudentInNextCourse;
    return null;
  }, [nextStudentInCourse, firstStudentInNextCourse]);

  // Guardar Check-in definitivo
  const persistCheckin = useCallback((finalState) => {
    if (!selectedPatientId) return;

    const timeStampNow = new Date().toISOString();
    const newRecord = {
      ...finalState,
      timestamp: timeStampNow,
      dateStr: todayIsoKey,
      patientId: selectedPatientId,
      patientName: activePatient?.name || 'Alumno PIE',
      curso: getStudentCourse(activePatient),
      evaluador: specialistName || 'Psicólogo PIE'
    };

    const updated = {
      ...checkins,
      [todayIsoKey]: {
        ...(checkins[todayIsoKey] || {}),
        [selectedPatientId]: newRecord
      }
    };

    setCheckins(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cognimirror_daily_checkins', JSON.stringify(updated));
        window.dispatchEvent(new Event('cognimirror_checkins_updated'));
      } catch (e) {
        console.error('Error guardando en localStorage:', e);
      }
    }

    setFormState(prev => ({
      ...prev,
      completedAt: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    }));

    playCelebrationFanfare();
    setCardStep(5); // Pantalla de éxito y siguiente alumno/curso
  }, [selectedPatientId, todayIsoKey, activePatient, checkins, specialistName]);

  // Función para seleccionar estudiante y comenzar
  const handleSelectStudentAndStart = (studentId) => {
    if (!studentId) return;
    playCheckinPop(600);
    setSelectedPatientId(studentId);
    const existing = checkins[todayIsoKey]?.[studentId];
    if (existing) {
      setCardStep(existing.asistencia === 'ausente' ? 'ausente' : 5);
    } else {
      setCardStep(0); // Paso 0: ¿Vino a clases hoy?
    }
  };

  // Marcar al alumno como ausente y pasar automáticamente al siguiente alumno del curso o siguiente curso
  const handleMarkAbsentAndSkip = () => {
    if (!selectedPatientId) return;
    playCheckinPop(400);

    const timeStampNow = new Date().toISOString();
    const absentRecord = {
      asistencia: 'ausente',
      timestamp: timeStampNow,
      dateStr: todayIsoKey,
      patientId: selectedPatientId,
      patientName: activePatient?.name || 'Alumno PIE',
      curso: getStudentCourse(activePatient),
      evaluador: specialistName || 'Psicólogo PIE',
      regulacion: 'ausente'
    };

    const updated = {
      ...checkins,
      [todayIsoKey]: {
        ...(checkins[todayIsoKey] || {}),
        [selectedPatientId]: absentRecord
      }
    };

    setCheckins(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cognimirror_daily_checkins', JSON.stringify(updated));
        window.dispatchEvent(new Event('cognimirror_checkins_updated'));
      } catch (e) {}
    }

    // Salta automáticamente al siguiente alumno del curso o del siguiente curso
    if (nextStudentInCourse) {
      handleSelectStudentAndStart(nextStudentInCourse.id);
    } else if (firstStudentInNextCourse) {
      setSelectedCursoFilter(nextPendingCourse.nombre);
      handleSelectStudentAndStart(firstStudentInNextCourse.id);
    } else {
      setCardStep('ausente');
    }
  };

  // Reabrir check-in cuando un alumno llega tarde
  const handleLateArrivalEdit = () => {
    playCheckinPop(600);
    setFormState(prev => ({
      ...prev,
      asistencia: 'presente_tarde'
    }));
    setCardStep(1); // Entra al cuestionario
  };

  // Manejar selección automática en tarjetas cambiantes
  const handleSelectEmotion = (emId) => {
    playCheckinPop(520);
    setFormState(prev => ({ ...prev, emocion: emId }));
    setJustAnsweredAnim(true);
    setTimeout(() => {
      setJustAnsweredAnim(false);
      setCardStep(2); // Auto-avanza a Atención
    }, 220);
  };

  const handleSelectAttention = (attId) => {
    playCheckinPop(620);
    setFormState(prev => ({ ...prev, atencion: attId }));
    setJustAnsweredAnim(true);
    setTimeout(() => {
      setJustAnsweredAnim(false);
      setCardStep(3); // Auto-avanza a Rutina
    }, 220);
  };

  const handleFinishRoutineAndGoRegulation = () => {
    playCheckinPop(700);
    setCardStep(4); // Pasa a Semáforo de Regulación
  };

  const handleSelectRegulation = (regId) => {
    const updatedState = { ...formState, regulacion: regId, asistencia: 'presente' };
    setFormState(updatedState);
    persistCheckin(updatedState);
  };

  const handleGoToNextStudent = () => {
    if (nextStudentInCourse) {
      handleSelectStudentAndStart(nextStudentInCourse.id);
    } else if (firstStudentInNextCourse) {
      if (nextPendingCourse) setSelectedCursoFilter(nextPendingCourse.nombre);
      handleSelectStudentAndStart(firstStudentInNextCourse.id);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200 font-sans max-w-5xl mx-auto w-full">
      
      {/* ── CABECERA COMPACTA CON HORA EN VIVO EN LA ESQUINA ── */}
      <div className="rounded-2xl bg-[#0c101d] border border-white/10 p-3 sm:p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <HeartPulse className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Check-in Diario PIE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                DAU
              </span>
            </div>
            <span className="text-[11px] text-slate-400 capitalize">
              {todayDateStr} • {presentCount} presentes {absentCount > 0 && `• ${absentCount} ausentes`} ({processedTodayCount}/{totalStudents})
            </span>
          </div>
        </div>

        {/* HORA EN VIVO EN LA ESQUINA */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-mono font-bold text-white tracking-wider">
            {currentTimeStr || '08:30:00'}
          </span>
        </div>
      </div>

      {/* ── SELECTOR PRINCIPAL: POR CURSOS | LISTA COMPLETA | TARJETA RÁPIDA ── */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 p-1 bg-[#0c101d] border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setNavMode('tarjetas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              navMode === 'tarjetas'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Tarjetas Rápidas</span>
          </button>

          <button
            type="button"
            onClick={() => setNavMode('cursos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              navMode === 'cursos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <School className="w-3.5 h-3.5 text-purple-400" />
            <span>Ver por Cursos ({cursosStats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setNavMode('lista')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              navMode === 'lista'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lista de Alumnos ({filteredPatients.length})</span>
          </button>
        </div>

        {/* Filtro Rápido de Curso */}
        {navMode !== 'cursos' && (
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline mr-1">
              Curso:
            </span>
            <select
              value={selectedCursoFilter}
              onChange={(e) => setSelectedCursoFilter(e.target.value)}
              className="bg-[#0c101d] border border-white/10 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="Todos">Todos los Cursos</option>
              {cursosStats.map(c => (
                <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* VISTA 1: MODO CURSOS (TODOS LOS CURSOS CON TOTALES Y PORCENTAJE REAL)    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {navMode === 'cursos' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          {/* BANNER RESUMEN GLOBAL DE CURSOS */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                <School className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  Cursos al Día
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {completedCoursesCount} de {cursosStats.length} al 100% OK
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Progreso por curso • Toca un curso para iniciar o revisar el check-in
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-black text-emerald-400 font-mono">
                {cursosStats.length > 0 ? Math.round((completedCoursesCount / cursosStats.length) * 100) : 0}%
              </span>
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Completado</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cursosStats.map(curso => {
              const isFull = (curso.completed + curso.absents) === curso.total && curso.total > 0;
              const pct = curso.total > 0 ? Math.round(((curso.completed + curso.absents) / curso.total) * 100) : 0;
              const pending = curso.total - (curso.completed + curso.absents);

              // Obtener evaluador y último registro de este curso
              const evaluators = Array.from(new Set(curso.students.map(s => todaysCheckins[s.id]?.evaluador).filter(Boolean)));
              const latestEvaluator = evaluators[evaluators.length - 1] || (isFull ? specialistName : null);
              const latestTimestamp = curso.students
                .map(s => todaysCheckins[s.id]?.timestamp)
                .filter(Boolean)
                .sort()
                .reverse()[0];
              const timeStr = latestTimestamp ? new Date(latestTimestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : null;

              return (
                <div 
                  key={curso.nombre}
                  onClick={() => {
                    setSelectedCursoFilter(curso.nombre);
                    // Seleccionar el primer alumno pendiente de este curso
                    const firstPending = curso.students.find(s => !todaysCheckins[s.id]);
                    if (firstPending) {
                      handleSelectStudentAndStart(firstPending.id);
                    } else if (curso.students.length > 0) {
                      handleSelectStudentAndStart(curso.students[0].id);
                    }
                    setNavMode('tarjetas');
                  }}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.01] ${
                    isFull 
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/60 shadow-lg shadow-emerald-950/20' 
                      : 'bg-[#0c101d] border-white/10 hover:border-blue-500/40 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isFull ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-600/20 text-blue-300'
                      }`}>
                        <School className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white leading-tight truncate">{curso.nombre}</h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {curso.total} alumnos PIE {curso.absents > 0 && `• ${curso.absents} ausentes`}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      isFull 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>
                      {curso.completed + curso.absents} / {curso.total}
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
                    <div 
                      className={`h-full transition-all duration-500 ${isFull ? 'bg-emerald-400' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className={`text-[11px] font-bold ${isFull ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-400'}`}>
                      {isFull ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                          <span>Curso al 100% OK</span>
                        </>
                      ) : (
                        `${pending} pendientes`
                      )}
                    </span>
                    <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {isFull ? 'Ver Respuestas' : 'Iniciar Check-in'} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Profesional que evaluó el curso */}
                  {latestEvaluator && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/5 mt-2">
                      <span className="flex items-center gap-1 truncate">
                        <UserCheck className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">Evaluado por: <strong className="text-slate-200">{latestEvaluator}</strong></span>
                      </span>
                      {timeStr && <span className="text-slate-500 font-mono text-[9px] shrink-0">{timeStr}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* VISTA 2: LISTA DE ALUMNOS (SELECCIÓN MANUAL DIRECTA CON ESTADO)         */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {navMode === 'lista' && (
        <div className="bg-[#0c101d] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Buscar alumno por nombre, apellido o diagnóstico..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredPatients.map(student => {
              const checkinToday = todaysCheckins[student.id];
              const isAbsent = checkinToday?.asistencia === 'ausente';
              const isCompleted = !!checkinToday && !isAbsent;
              const isSelected = selectedPatientId === student.id;
              const stCurso = getStudentCourse(student);

              return (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedPatientId(student.id);
                    setNavMode('tarjetas');
                    if (isAbsent) {
                      setCardStep('ausente');
                    } else if (isCompleted) {
                      setCardStep(5);
                    } else {
                      setCardStep(0);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isAbsent
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : isCompleted 
                          ? checkinToday.regulacion === 'verde'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : checkinToday.regulacion === 'amarillo'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          : 'bg-white/5 text-slate-400'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{student.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{stCurso} • {student.diagnosticoNee || 'NEE'}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isAbsent ? (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <UserX className="w-2.5 h-2.5" /> Ausente
                      </span>
                    ) : isCompleted ? (
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        checkinToday.regulacion === 'verde'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : checkinToday.regulacion === 'amarillo'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {checkinToday.regulacion.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                        Pendiente
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* VISTA 3: TARJETAS CAMBIANTES (ASISTENCIA, PREGUNTAS ONE-TOUCH, ÉXITO)    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {navMode === 'tarjetas' && activePatient && (
        <div className="bg-[#0d121f] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
          
          {/* HEADER DEL ALUMNO ACTIVO CON RELOJ Y CAMBIO RÁPIDO */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/30 shrink-0">
                {activePatient.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white truncate">
                    {activePatient.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                    {activeCourseName}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                    {activeCourseCompletedCount} de {studentsInActiveCourse.length} del curso
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {activePatient.diagnosticoNee || 'Estudiante Programa PIE'} • <span className="text-emerald-300 font-bold">{Math.round((activeCourseCompletedCount / (studentsInActiveCourse.length || 1)) * 100)}% curso al día</span>
                </p>
              </div>
            </div>

            {/* Selector de alumno rápido desplegable */}
            <div className="shrink-0 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setNavMode('lista')}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Cambiar alumno"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Cambiar</span>
              </button>
            </div>
          </div>

          {/* INDICADOR DE PASOS SUPERIOR */}
          {cardStep !== 'ausente' && (
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map(stepNum => (
                  <button
                    key={stepNum}
                    type="button"
                    onClick={() => setCardStep(stepNum)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      cardStep === stepNum
                        ? 'w-7 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
                        : cardStep > stepNum
                          ? 'w-3.5 bg-emerald-400'
                          : 'w-3.5 bg-white/10'
                    }`}
                    title={`Paso ${stepNum}`}
                  />
                ))}
              </div>

              <span className="text-[11px] font-mono font-bold text-slate-400">
                {cardStep === 0 ? 'Asistencia' : cardStep <= 4 ? `Paso ${cardStep} de 4` : '✓ Registrado'}
              </span>
            </div>
          )}

          {/* ── CUERPO DE LA TARJETA CAMBIANTE ── */}
          <div className={`py-2 transition-all duration-200 ${justAnsweredAnim ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
            
            {/* ── PASO 0: ASISTENCIA ESCOLAR ("¿Vino a clases hoy?") ── */}
            {cardStep === 0 && (
              <div className="flex flex-col items-center text-center py-4 sm:py-6 gap-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-lg">
                  <UserCheck className="w-7 h-7 animate-pulse" />
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                    Control de Asistencia PIE
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-white mt-1">
                    ¿Vino a clases hoy <span className="text-blue-400">{activePatient.name}</span>?
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {getStudentCourse(activePatient)} • Si no asistió, saltará al siguiente alumno automáticamente
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playCheckinPop(600);
                      setCardStep(1); // Pasa a evaluar
                    }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Check className="w-5 h-5" />
                    <span>Sí, vino a clases</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMarkAbsentAndSkip}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <UserX className="w-5 h-5 text-rose-400" />
                    <span>No vino (Ausente)</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── CASO: ALUMNO MARCADO COMO AUSENTE (CON OPCIÓN DE EDITAR POR LLEGADA TARDE) ── */}
            {cardStep === 'ausente' && (
              <div className="flex flex-col items-center text-center py-5 sm:py-7 gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                  <UserX className="w-7 h-7" />
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                    Marcado como Ausente
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-white mt-2">
                    {activePatient.name} no se encontraba en sala
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    ¿El alumno llegó más tarde al colegio? Puedes iniciar su check-in ahora mismo para actualizar su asistencia.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto pt-2">
                  <button
                    type="button"
                    onClick={handleLateArrivalEdit}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Llegó tarde: Realizar Check-in ahora</span>
                  </button>

                  {nextStudent && nextStudent.id !== activePatient.id && (
                    <button
                      type="button"
                      onClick={handleGoToNextStudent}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/10 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Ir a {nextStudent.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── PASO 1: ESTADO EMOCIONAL AL LLEGAR ── */}
            {cardStep === 1 && (
              <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center sm:text-left mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    Pregunta 1 de 4 • Disposición Emocional
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    ¿Cómo llega emocionalmente <span className="text-blue-400">{activePatient.name}</span> hoy?
                  </h4>
                  <p className="text-xs text-slate-400">Toca una opción para avanzar automáticamente</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {EMOTIONAL_STATES.map((em) => {
                    const isSelected = formState.emocion === em.id;
                    return (
                      <button
                        key={em.id}
                        type="button"
                        onClick={() => handleSelectEmotion(em.id)}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex sm:flex-col items-center justify-between sm:justify-center gap-2 group active:scale-95 ${
                          isSelected
                            ? `bg-gradient-to-b ${em.color} ring-2 ring-blue-400 shadow-xl scale-[1.02] font-black`
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06] text-slate-300'
                        }`}
                      >
                        <span className="text-3xl group-hover:scale-110 transition-transform">{em.icon}</span>
                        <span className="text-xs font-bold">{em.label}</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 sm:hidden" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PASO 2: FOCO Y ATENCIÓN INICIAL ── */}
            {cardStep === 2 && (
              <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center sm:text-left mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                    Pregunta 2 de 4 • Atención y Foco Cognitivo
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    ¿Cuál es su nivel de atención inicial?
                  </h4>
                  <p className="text-xs text-slate-400">Toca la opción observada para avanzar</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ATTENTION_STATES.map((att) => {
                    const isSelected = formState.atencion === att.id;
                    return (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => handleSelectAttention(att.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-95 ${
                          isSelected
                            ? 'bg-blue-600/25 border-blue-400 ring-2 ring-blue-400/50 shadow-xl text-white font-bold'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl group-hover:scale-110 transition-transform">{att.icon}</span>
                          <div>
                            <span className="text-xs sm:text-sm font-bold block text-white">{att.label}</span>
                            <span className="text-[11px] text-slate-400 block leading-tight">{att.desc}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PASO 3: FACTORES FÍSICOS Y RUTINA ── */}
            {cardStep === 3 && (
              <div className="flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center sm:text-left mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                    Pregunta 3 de 4 • Factores de Rutina y Bienestar
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Rutina matutina y descanso
                  </h4>
                  <p className="text-xs text-slate-400">Verifica los factores físicos de hoy</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Desayuno */}
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 text-amber-400" /> ¿Tomó Desayuno?
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => { playCheckinPop(500); setFormState(prev => ({ ...prev, desayuno: true })); }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          formState.desayuno === true
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        Sí ☕
                      </button>
                      <button
                        type="button"
                        onClick={() => { playCheckinPop(460); setFormState(prev => ({ ...prev, desayuno: false })); }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          formState.desayuno === false
                            ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-sm'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        No ❌
                      </button>
                    </div>
                  </div>

                  {/* Medicación */}
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-purple-400" /> Medicación
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {['tomada', 'pendiente', 'no_aplica'].map((med) => (
                        <button
                          key={med}
                          type="button"
                          onClick={() => { playCheckinPop(540); setFormState(prev => ({ ...prev, medicacion: med })); }}
                          className={`py-2 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                            formState.medicacion === med
                              ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-sm'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {med === 'tomada' ? 'Tomada' : med === 'pendiente' ? 'Pend.' : 'N/A'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sueño Anoche */}
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Moon className="w-4 h-4 text-indigo-400" /> Sueño Anoche
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {['bueno', 'regular', 'malo'].map((sn) => (
                        <button
                          key={sn}
                          type="button"
                          onClick={() => { playCheckinPop(560); setFormState(prev => ({ ...prev, sueno: sn })); }}
                          className={`py-2 rounded-xl text-[10px] font-bold capitalize transition-all border cursor-pointer ${
                            formState.sueno === sn
                              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-sm'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleFinishRoutineAndGoRegulation}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <span>Continuar al Semáforo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 4: SEMÁFORO DE REGULACIÓN (FINALIZA Y GUARDA AL TOCAR) ── */}
            {cardStep === 4 && (
              <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center sm:text-left mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    Paso Final • Semáforo de Regulación PIE
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    ¿Cuál es el estado de regulación para la jornada?
                  </h4>
                  <p className="text-xs text-slate-400">Al tocar el semáforo se guardará el registro inmediatamente</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {REGULATION_LEVELS.map((reg) => {
                    const isSelected = formState.regulacion === reg.id;
                    return (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => handleSelectRegulation(reg.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 group active:scale-95 ${
                          isSelected
                            ? `${reg.badge} ring-2 ring-white/20 shadow-xl scale-[1.02]`
                            : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06] text-slate-300'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full shrink-0 ${reg.indicator}`} />
                        <div>
                          <span className="text-xs sm:text-sm font-black block text-white group-hover:text-emerald-300 transition-colors">
                            {reg.label}
                          </span>
                          <span className="text-[11px] opacity-80 block leading-tight">{reg.sublabel}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Observación Rápida Opcional */}
                <div className="pt-2">
                  <input
                    type="text"
                    value={formState.observaciones}
                    onChange={(e) => setFormState(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Nota rápida opcional (ej. llegó motivado, dolor de cabeza)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* ── PASO 5: RESUMEN DE LO ANOTADO ── */}
            {cardStep === 5 && (
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 py-2">

                {/* Header del alumno completado */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-black shrink-0">
                    <CheckCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white">{activePatient.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCheck className="w-2.5 h-2.5" />
                        Registrado hoy • {formState.completedAt || currentTimeStr}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{activeCourseName} · {activePatient.diagnosticoNee || 'PIE'}</p>
                  </div>
                </div>

                {/* Resumen visual de respuestas */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-white/8 flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Respuestas anotadas</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.06]">
                    {/* Semáforo */}
                    <div className="p-3 flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${
                        formState.regulacion === 'verde' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' :
                        formState.regulacion === 'amarillo' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' :
                        'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]'
                      }`} />
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-mono">Semáforo</p>
                        <p className={`text-xs font-black uppercase ${
                          formState.regulacion === 'verde' ? 'text-emerald-400' :
                          formState.regulacion === 'amarillo' ? 'text-amber-400' :
                          'text-red-400'
                        }`}>{formState.regulacion}</p>
                      </div>
                    </div>
                    {/* Emoción */}
                    <div className="p-3 flex items-center gap-2.5">
                      <span className="text-lg leading-none">
                        {EMOTIONAL_STATES.find(e => e.id === formState.emocion)?.icon || '😌'}
                      </span>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-mono">Emoción</p>
                        <p className="text-xs font-bold text-white capitalize">
                          {EMOTIONAL_STATES.find(e => e.id === formState.emocion)?.label || formState.emocion}
                        </p>
                      </div>
                    </div>
                    {/* Atención */}
                    <div className="p-3 flex items-center gap-2.5">
                      <span className="text-lg leading-none">
                        {ATTENTION_STATES.find(a => a.id === formState.atencion)?.icon || '🎯'}
                      </span>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-mono">Atención</p>
                        <p className="text-xs font-bold text-white capitalize">
                          {ATTENTION_STATES.find(a => a.id === formState.atencion)?.label || formState.atencion}
                        </p>
                      </div>
                    </div>
                    {/* Sueño */}
                    <div className="p-3 flex items-center gap-2.5">
                      <Moon className={`w-4 h-4 shrink-0 ${
                        formState.sueno === 'bueno' ? 'text-blue-400' :
                        formState.sueno === 'regular' ? 'text-amber-400' : 'text-red-400'
                      }`} />
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-mono">Sueño</p>
                        <p className="text-xs font-bold text-white capitalize">{formState.sueno}</p>
                      </div>
                    </div>
                    {/* Desayuno */}
                    <div className="p-3 flex items-center gap-2.5">
                      <Coffee className={`w-4 h-4 shrink-0 ${formState.desayuno ? 'text-amber-400' : 'text-slate-500'}`} />
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-mono">Desayuno</p>
                        <p className={`text-xs font-bold ${formState.desayuno ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {formState.desayuno ? 'Desayunó ✓' : 'Sin desayuno'}
                        </p>
                      </div>
                    </div>
                    {/* Medicación */}
                    <div className="p-3 flex items-center gap-2.5">
                      <Pill className={`w-4 h-4 shrink-0 ${
                        formState.medicacion === 'tomada' ? 'text-emerald-400' :
                        formState.medicacion === 'no_tomada' ? 'text-red-400' : 'text-slate-500'
                      }`} />
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-mono">Medicación</p>
                        <p className={`text-xs font-bold capitalize ${
                          formState.medicacion === 'tomada' ? 'text-emerald-400' :
                          formState.medicacion === 'no_tomada' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {formState.medicacion === 'no_aplica' ? 'No aplica' :
                           formState.medicacion === 'tomada' ? 'Tomada ✓' : 'No tomada ✗'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {formState.tags && formState.tags.length > 0 && (
                    <div className="px-3.5 py-2.5 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                      {formState.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Observación */}
                  {formState.observaciones && (
                    <div className="px-3.5 py-2.5 border-t border-white/[0.06]">
                      <p className="text-[9px] text-slate-500 uppercase font-mono mb-1">Nota del profesional</p>
                      <p className="text-xs text-slate-300 italic leading-relaxed">"{formState.observaciones}"</p>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  {/* CASO 1: Aún quedan alumnos pendientes en este mismo curso */}
                  {nextStudentInCourse ? (
                    <button
                      type="button"
                      onClick={() => handleSelectStudentAndStart(nextStudentInCourse.id)}
                      className="w-full sm:flex-1 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm flex items-center justify-between gap-4 shadow-xl shadow-blue-600/35 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">
                          Siguiente en {activeCourseName} ({activeCourseCompletedCount}/{studentsInActiveCourse.length})
                        </span>
                        <span className="text-sm font-black">{nextStudentInCourse.name}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 shrink-0" />
                    </button>
                  ) : nextPendingCourse && firstStudentInNextCourse ? (
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                      <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/35 rounded-2xl text-xs font-bold text-emerald-300 flex items-center gap-2 shrink-0">
                        <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>¡{activeCourseName} al 100%!</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedCursoFilter(nextPendingCourse.nombre); handleSelectStudentAndStart(firstStudentInNextCourse.id); }}
                        className="w-full sm:flex-1 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm flex items-center justify-between gap-4 shadow-xl shadow-emerald-600/35 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider flex items-center gap-1">
                            <School className="w-3.5 h-3.5" /> Siguiente Curso
                          </span>
                          <span className="text-sm font-black">{nextPendingCourse.nombre} · {firstStudentInNextCourse.name}</span>
                        </div>
                        <ArrowRight className="w-5 h-5 shrink-0" />
                      </button>
                    </div>
                  ) : isAllSchoolDone ? (
                    <div className="w-full p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-sm font-bold text-emerald-300 flex items-center gap-2.5 shadow-xl shadow-emerald-500/20">
                      <Sparkles className="w-5 h-5 text-amber-300 animate-spin shrink-0" />
                      <div>
                        <p className="font-black text-white">¡Todos los estudiantes PIE completados!</p>
                        <p className="text-xs text-slate-300 font-normal">{totalStudents} alumnos evaluados · {completedCoursesCount} de {cursosStats.length} cursos al 100%</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ¡Estudiantes de este grupo completados!
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setCardStep(1)}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/10 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Editar respuestas
                  </button>
                </div>

              </div>
            )}


          </div>

          {/* BARRA INFERIOR DE NAVEGACIÓN EN TARJETAS (ANTERIOR / PASO) */}
          {cardStep !== 'ausente' && cardStep !== 0 && cardStep < 5 && (
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setCardStep(prev => Math.max(0, prev - 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-slate-300 hover:text-white bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => setCardStep(prev => Math.min(4, prev + 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 transition-all cursor-pointer"
              >
                <span>Saltar / Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
