'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientsDB } from '../hooks/usePatientsDB';
import StudentEvolutionDashboard from './StudentEvolutionDashboard';
import ReactionDashboard from './ReactionDashboard';
import MemoryDashboard from './MemoryDashboard';
import RemoteEvalGenerator from './RemoteEvalGenerator';
import {
  ArrowLeft, Activity, Brain, Calendar, Clock, ChevronRight,
  TrendingUp, Save, ClipboardList, Plus, Trash2, Wifi, Sparkles,
  CheckCircle2, AlertCircle, Play, UserCheck, ShieldCheck, Tag,
  Crosshair, Zap, Download, ShieldAlert, FileText, Lock
} from 'lucide-react';

export default function FichaEstudiantePIE({
  student,
  onBack,
  isDark = true
}) {
  const router = useRouter();
  const { updatePatient, purgePatientArco } = usePatientsDB();

  const [activeTab, setActiveTab] = useState('evolucion'); // 'evolucion' | 'historial' | 'expediente'
  const [activeTestType, setActiveTestType] = useState('general'); // 'general' | 'reaction' | 'memory' | 'single_face' | 'bilateral_pure' | 'checklist'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLabel, setFilterLabel] = useState('All');
  const [selectedSessionRecord, setSelectedSessionRecord] = useState(null);
  const [isRemoteEvalOpen, setIsRemoteEvalOpen] = useState(false);

  // Formulario Ficha Escolar
  const [fechaNacimiento, setFechaNacimiento] = useState(student?.fechaNacimiento || '');
  const [diagnosticoNee, setDiagnosticoNee] = useState(student?.diagnosticoNee || '');
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [historialClinico, setHistorialClinico] = useState(student?.historialClinico || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tutor y Consentimiento Parental (Ley 21.719 / Ley 21.430)
  const [tutorNombre, setTutorNombre] = useState(student?.tutorNombre || '');
  const [tutorRun, setTutorRun] = useState(student?.tutorRun || '');
  const [tutorEmail, setTutorEmail] = useState(student?.tutorEmail || '');
  const [tutorTelefono, setTutorTelefono] = useState(student?.tutorTelefono || '');
  const [consentimientoParental, setConsentimientoParental] = useState(Boolean(student?.consentimientoParental));
  const [consentimientoFecha, setConsentimientoFecha] = useState(student?.consentimientoFecha || '');

  // Modal y Gestión de Derechos ARCO (Ley 21.719)
  const [showArcoModal, setShowArcoModal] = useState(false);
  const [arcoConfirmCode, setArcoConfirmCode] = useState('');
  const [isDeletingArco, setIsDeletingArco] = useState(false);

  useEffect(() => {
    if (student) {
      setFechaNacimiento(student.fechaNacimiento || '');
      setDiagnosticoNee(student.diagnosticoNee || '');
      setHistorialClinico(student.historialClinico || []);
      setTutorNombre(student.tutorNombre || '');
      setTutorRun(student.tutorRun || '');
      setTutorEmail(student.tutorEmail || '');
      setTutorTelefono(student.tutorTelefono || '');
      setConsentimientoParental(Boolean(student.consentimientoParental));
      setConsentimientoFecha(student.consentimientoFecha || '');
    }
  }, [student]);

  // Cálculo de Edad y Verificación de Minoría de Edad (Ley 21.430)
  const calculatedAge = useMemo(() => {
    if (!fechaNacimiento) return null;
    const diff = Date.now() - new Date(fechaNacimiento).getTime();
    if (isNaN(diff) || diff < 0) return null;
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }, [fechaNacimiento]);

  const isMinor = calculatedAge !== null ? calculatedAge < 18 : true;

  // Cargar Checklists conductuales del estudiante
  const studentCheckins = useMemo(() => {
    try {
      const stored = localStorage.getItem('cognimirror_daily_checkins');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(c => 
            c.studentId === student?.id || 
            c.studentId === student?.idSujeto ||
            c.id_paciente === student?.id ||
            c.id_sujeto === student?.idSujeto
          ).map(c => ({
            sessionId: c.id || `checkin-${c.date}`,
            isChecklist: true,
            testType: 'checklist',
            attemptNumber: 1,
            clinicalLabel: `Check-in Diario PIE (Regulación: ${c.regulacion ? c.regulacion.toUpperCase() : 'Normal'})`,
            date: c.date,
            stats: {
              averageReactionTime: null,
              emocion: c.emocion,
              atencion: c.atencion,
              regulacion: c.regulacion,
              desayuno: c.desayuno,
              score_checklist: c.regulacion === 'verde' ? 95 : c.regulacion === 'amarillo' ? 75 : c.regulacion === 'azul' ? 55 : 35
            }
          }));
        }
      }
    } catch (_) {}
    return [];
  }, [student]);

  if (!student) return null;

  // Clasificador de sesión
  const getSessionCategory = (s) => {
    if (s.isChecklist || s.testType === 'checklist') return 'checklist';
    const label = (s.clinicalLabel || '').toLowerCase();
    const mode = (s.gameMode || '').toLowerCase();
    const testType = (s.testType || '').toLowerCase();

    if (testType === 'memory' || /memory|simon|corsi/i.test(label)) {
      return 'memory';
    }
    if (mode === 'single_face' || /single_face|go\/no-go|inhibitorio/i.test(label)) {
      return 'single_face';
    }
    if (mode === 'bilateral_pure' || /bilateral/i.test(label)) {
      return 'bilateral_pure';
    }
    return 'reaction';
  };

  const rawSessions = student.sessions || [];
  const sessions = rawSessions;
  const allUnifiedEntries = [...rawSessions, ...studentCheckins];

  const tabSessions = activeTestType === 'general'
    ? allUnifiedEntries
    : allUnifiedEntries.filter(s => getSessionCategory(s) === activeTestType);

  const filteredHistory = tabSessions.filter(s => {
    const matchLabel = filterLabel === 'All' || s.clinicalLabel?.includes(filterLabel);
    const matchSearch = (s.sessionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.clinicalLabel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        new Date(s.date).toLocaleDateString().includes(searchTerm);
    return matchLabel && matchSearch;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const studentForEvolution = {
    ...student,
    sessions: rawSessions
  };

  // Guardar Cambios en Ficha
  const handleSaveFicha = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const updates = {
      fechaNacimiento,
      diagnosticoNee,
      historialClinico,
      tutorNombre,
      tutorRun,
      tutorEmail,
      tutorTelefono,
      consentimientoParental,
      consentimientoFecha: consentimientoParental ? (consentimientoFecha || new Date().toISOString()) : null
    };
    const ok = await updatePatient(student.id, updates);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Descarga de Expediente Completo (Portabilidad - Derechos ARCO Ley 21.719)
  const handleExportArcoData = () => {
    try {
      const exportObject = {
        titulo: 'Expediente Portabilidad de Datos (Derechos ARCO Ley 21.719)',
        fechaGeneracion: new Date().toISOString(),
        estudiante: {
          id: student.id,
          idSujeto: student.idSujeto,
          nombreCompleto: student.name,
          fechaNacimiento,
          edadEstimada: calculatedAge,
          esMenorDeEdad: isMinor,
          diagnosticoNee
        },
        tutorLegalYConsentimiento: {
          tutorNombre,
          tutorRun,
          tutorEmail,
          tutorTelefono,
          consentimientoVerificado: consentimientoParental,
          fechaConsentimiento: consentimientoFecha
        },
        historialClinicoObservaciones: historialClinico,
        sesionesEvaluacion: sessions || [],
        checkinsDiariosConductuales: studentCheckins || [],
        declaracionLegal: 'Documento expedido en cumplimiento del Artículo de Derechos ARCO (Acceso y Portabilidad) de la Ley N° 21.719 de Chile sobre Protección de Datos Personales.'
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `CogniMirror_Expediente_${student.idSujeto || 'estudiante'}_ARCO.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert('Error exportando datos: ' + e.message);
    }
  };

  // Eliminación Total e Irreversible (Derecho de Supresión / Al Olvido Ley 21.719)
  const handleExecuteArcoPurge = async () => {
    if (arcoConfirmCode !== 'BORRAR-TOTAL') {
      alert('Debe escribir exactamente BORRAR-TOTAL para confirmar la eliminación.');
      return;
    }
    setIsDeletingArco(true);
    try {
      await purgePatientArco(student.id, `Eliminación solicitada por apoderado/tutor legal (${tutorNombre || 'Tutor'}) bajo Ley 21.719`);
      setShowArcoModal(false);
      onBack();
    } catch (e) {
      alert('Error en la supresión de datos: ' + e.message);
      setIsDeletingArco(false);
    }
  };

  const handleAddObservacion = () => {
    if (!nuevaObservacion.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      fecha: new Date().toISOString(),
      nota: nuevaObservacion.trim()
    };
    setHistorialClinico(prev => [newNote, ...prev]);
    setNuevaObservacion('');
  };

  const handleDeleteObservacion = (noteId) => {
    setHistorialClinico(prev => prev.filter(n => n.id !== noteId));
  };

  const isNeep = student.tipoNee === 'NEEP' || /permanente|tea|autis|intelectual/i.test(student.diagnosticoNee || '');

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Barra de Navegación Superior In-Situ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer font-bold text-xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Directorio de Alumnos</span>
        </button>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRemoteEvalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
          >
            <Wifi className="w-4 h-4 animate-pulse" />
            <span>Generar Evaluación Remota</span>
          </button>
          <button
            onClick={() => router.push(`/reaction-game?subjectId=${student.idSujeto || student.id}&patientId=${student.id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Play className="w-4 h-4" />
            <span>Evaluar Ahora</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Perfil del Estudiante */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#121622] via-[#0f1420] to-[#121622] border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/20 shrink-0">
            {student.name ? student.name.charAt(0) : 'E'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white">{student.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isNeep
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                {isNeep ? 'NEEP · Permanente' : 'NEET · Transitorio'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white font-bold">
                {student.cursoNombre || 'Sin curso asignado'}
              </span>
              <span>ID Sujeto: <strong className="text-indigo-400">{student.idSujeto || 'S-00'}</strong></span>
              <span>·</span>
              <span>Total Tests: <strong className="text-white">{sessions.length}</strong></span>
              {student.createdAt && (
                <>
                  <span>·</span>
                  <span>Registrado: {new Date(student.createdAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Diagnóstico en Pill */}
        <div className="flex flex-col md:items-end justify-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Diagnóstico PIE</span>
          <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold text-indigo-300 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>{student.diagnosticoNee || 'Sin diagnóstico asignado'}</span>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas de la Ficha */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11141e] p-2 rounded-2xl border border-white/10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('evolucion')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'evolucion'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Evolución Longitudinal</span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historial de Sesiones ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expediente')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'expediente'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Expediente Escolar PIE</span>
          </button>
        </div>

        {/* Filtro de Batería (General, Reaction, Memory, Go/No-Go, Bilateral, Checklist) */}
        {(activeTab === 'evolucion' || activeTab === 'historial') && (
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5 flex-wrap">
            <button
              onClick={() => setActiveTestType('general')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTestType === 'general'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>General (Todos + Checklist)</span>
            </button>

            <button
              onClick={() => setActiveTestType('reaction')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTestType === 'reaction'
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Reaction
            </button>

            <button
              onClick={() => setActiveTestType('memory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTestType === 'memory'
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Brain className="w-3.5 h-3.5" /> Memory
            </button>

            <button
              onClick={() => setActiveTestType('single_face')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTestType === 'single_face'
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" /> Go/No-Go
            </button>

            <button
              onClick={() => setActiveTestType('bilateral_pure')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTestType === 'bilateral_pure'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Bilateral
            </button>

            <button
              onClick={() => setActiveTestType('checklist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTestType === 'checklist'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> Checklist PIE
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CONTENIDO: TAB 1 - EVOLUCIÓN LONGITUDINAL
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'evolucion' && (
        <div className="flex flex-col gap-6">
          <StudentEvolutionDashboard
            patient={studentForEvolution}
            hideHeader={true}
            activeFilter={activeTestType}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONTENIDO: TAB 2 - HISTORIAL DE EVALUACIONES
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'historial' && (
        <div className="flex flex-col gap-4">
          
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar por sesión o fecha..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#11141e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={filterLabel}
              onChange={e => setFilterLabel(e.target.value)}
              className="bg-[#11141e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Todas las etiquetas PIE</option>
              <option value="Línea Base">Línea Base</option>
              <option value="Seguimiento">Seguimiento</option>
              <option value="Familiarización">Familiarización</option>
            </select>
          </div>

          {/* Tabla de Historial */}
          <div className="rounded-2xl border border-white/10 bg-[#11141e] overflow-hidden shadow-xl">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No hay evaluaciones registradas con los filtros seleccionados para este estudiante.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3.5">Ensayo</th>
                      <th className="px-5 py-3.5">Etiqueta PIE</th>
                      <th className="px-5 py-3.5">Fecha y Hora</th>
                      <th className="px-5 py-3.5">Rendimiento Promedio</th>
                      <th className="px-5 py-3.5 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredHistory.map(session => {
                      const cat = getSessionCategory(session);
                      const isCheck = session.isChecklist || cat === 'checklist';

                      return (
                        <tr
                          key={session.sessionId}
                          onClick={() => {
                            if (!isCheck) setSelectedSessionRecord(session);
                          }}
                          className={`hover:bg-white/[0.04] transition-colors group ${
                            isCheck ? 'cursor-default' : 'cursor-pointer'
                          }`}
                        >
                          <td className="px-5 py-4 font-bold text-white">
                            {isCheck ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                                  Checklist PIE
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] border ${
                                  cat === 'reaction'
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                    : cat === 'memory'
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                      : cat === 'single_face'
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}>
                                  {cat === 'reaction' ? 'Reaction' : cat === 'memory' ? 'Memory' : cat === 'single_face' ? 'Go/No-Go' : 'Bilateral'}
                                </span>
                                <span>Intento N° {session.attemptNumber || 1}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                              isCheck
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : session.clinicalLabel?.includes('Base')
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  : session.clinicalLabel?.includes('Seguimiento')
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              {session.clinicalLabel || (isCheck ? 'Check-in Diario PIE' : 'Evaluación')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                            {new Date(session.date).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-white">
                            {isCheck ? (
                              <span className="text-amber-300 text-xs">
                                Score: {session.stats?.score_checklist || 85}% · {session.stats?.atencion || 'Atención Normal'}
                              </span>
                            ) : (
                              <span>
                                {session.stats?.averageReactionTime ||
                                  Math.round(((session.stats?.tiempo_promedio_por_mano?.L || 0) + (session.stats?.tiempo_promedio_por_mano?.R || 0)) / 2) ||
                                  '-'} ms
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {!isCheck ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                Radiografía <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Diario
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONTENIDO: TAB 3 - EXPEDIENTE ESCOLAR PIE Y BITÁCORA
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'expediente' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Panel Izquierdo: Datos Clínicos y Consentimiento */}
          <div className="bg-[#11141e] border border-white/10 rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              Datos del Expediente
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={e => setFechaNacimiento(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Diagnóstico NEE Asignado
                </label>
                <select
                  value={diagnosticoNee}
                  onChange={e => setDiagnosticoNee(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione Diagnóstico...</option>
                  <optgroup label="NEET (Transitorias)">
                    <option value="TDAH">TDAH (Déficit Atencional con Hiperactividad)</option>
                    <option value="TDA">TDA (Déficit Atencional sin Hiperactividad)</option>
                    <option value="TEL Mixto">TEL Mixto</option>
                    <option value="TEL Expresivo">TEL Expresivo</option>
                    <option value="DEA Dislexia">DEA Dislexia</option>
                    <option value="DEA Discalculia">DEA Discalculia</option>
                    <option value="FIL">Funcionamiento Intelectual Limítrofe (FIL)</option>
                  </optgroup>
                  <optgroup label="NEEP (Permanentes)">
                    <option value="TEA (Ley 21.545)">TEA (Trastorno del Espectro Autista - Ley 21.545)</option>
                    <option value="Discapacidad Intelectual Leve">Discapacidad Intelectual Leve (DIL)</option>
                    <option value="Discapacidad Intelectual Moderada">Discapacidad Intelectual Moderada</option>
                    <option value="Discapacidad Motora">Discapacidad Motora</option>
                    <option value="Discapacidad Visual/Auditiva">Discapacidad Sensorial</option>
                    <option value="Multidéficit">Multidéficit</option>
                  </optgroup>
                </select>
              </div>

              {/* Verificación de Minoría de Edad (Ley 21.430) */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-white block">
                      {calculatedAge !== null ? `${calculatedAge} años` : 'Edad sin definir'}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">
                      {isMinor ? 'Menor de Edad (Sujeto a Consentimiento Legal)' : 'Mayor de Edad'}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  consentimientoParental 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {consentimientoParental ? 'Consentimiento Activo' : 'Pendiente Consentimiento'}
                </span>
              </div>

              {/* Sub-Panel: Consentimiento Parental Verificable (Ley 21.719 / Ley 21.430) */}
              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Consentimiento del Tutor Legal</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Nombre Tutor / Apoderado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Carmen Gloria Morales"
                      value={tutorNombre}
                      onChange={e => setTutorNombre(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      RUN Tutor Legal
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 14.234.567-8"
                      value={tutorRun}
                      onChange={e => setTutorRun(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Email de Contacto del Tutor
                    </label>
                    <input
                      type="email"
                      placeholder="tutor@ejemplo.cl"
                      value={tutorEmail}
                      onChange={e => setTutorEmail(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Teléfono del Tutor
                    </label>
                    <input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={tutorTelefono}
                      onChange={e => setTutorTelefono(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:bg-black/30 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={consentimientoParental}
                    onChange={e => {
                      setConsentimientoParental(e.target.checked);
                      if (e.target.checked && !consentimientoFecha) {
                        setConsentimientoFecha(new Date().toISOString());
                      }
                    }}
                    className="mt-0.5 rounded border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-300 leading-snug">
                    <span className="font-bold text-white block">Declaro contar con Consentimiento Informado Verificable</span>
                    Autorización firmada del padre/madre/tutor legal para el registro y análisis neurocognitivo seguro de este menor conforme a la Ley 21.719 y Ley 21.430.
                    {consentimientoFecha && (
                      <span className="text-[9px] text-indigo-400 block font-mono mt-1">
                        Registrado: {new Date(consentimientoFecha).toLocaleString()}
                      </span>
                    )}
                  </div>
                </label>
              </div>

              {/* Sub-Panel: Gestión de Derechos ARCO (Ley 21.719) */}
              <div className="pt-3 border-t border-white/5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Marco de Derechos ARCO (Ley 21.719)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  El tutor legal puede solicitar en cualquier momento el acceso, portabilidad o eliminación total irreversible de los datos de aprendizaje del menor.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExportArcoData}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Descargar copia íntegra de telemetría y observaciones"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Portabilidad (JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowArcoModal(true)}
                    className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Eliminar permanentemente todo el historial del menor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminación Total</span>
                  </button>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>¡Expediente y consentimientos guardados exitosamente!</span>
                </div>
              )}

              <button
                onClick={handleSaveFicha}
                disabled={isSaving}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando expediente...' : 'Guardar Cambios en Ficha'}
              </button>
            </div>
          </div>

          {/* Panel Derecho: Bitácora de Observaciones */}
          <div className="bg-[#11141e] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              Bitácora de Observaciones Clínicas
            </h3>

            {/* Crear Nota */}
            <div className="flex flex-col gap-2">
              <textarea
                value={nuevaObservacion}
                onChange={e => setNuevaObservacion(e.target.value)}
                placeholder="Escribe una observación clínica, distractores detectados, conductas en sesión..."
                rows={3}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handleAddObservacion}
                className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Nota a la Bitácora</span>
              </button>
            </div>

            {/* Lista de Observaciones */}
            <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
              {historialClinico.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6 italic">
                  Aún no hay notas en la bitácora de este estudiante.
                </p>
              ) : (
                historialClinico.map(note => (
                  <div key={note.id} className="p-3.5 rounded-2xl bg-black/25 border border-white/5 relative group flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{new Date(note.fecha).toLocaleDateString()} · {new Date(note.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        onClick={() => handleDeleteObservacion(note.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Eliminar observación"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{note.nota}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Modal: Radiografía Detallada del Turno (Reaction / Memory) */}
      {selectedSessionRecord && (
        <div className="fixed inset-0 z-[9999] bg-[#07080f]/95 backdrop-blur-md overflow-y-auto p-4 flex flex-col">
          <div className="max-w-6xl mx-auto w-full flex-1 py-4">
            {activeTestType === 'reaction' ? (
              <ReactionDashboard
                playerName={student.name}
                date={selectedSessionRecord.date}
                rawTurnsData={selectedSessionRecord.rawTurnsData}
                latencyOffset={selectedSessionRecord.stats?.latencyOffset || 0}
                onExit={() => setSelectedSessionRecord(null)}
                recordId={selectedSessionRecord.sessionId}
                attemptNumber={selectedSessionRecord.attemptNumber}
                clinicalLabel={selectedSessionRecord.clinicalLabel}
                patient={student}
                metrics={selectedSessionRecord.metrics || selectedSessionRecord.stats}
                stats={selectedSessionRecord.stats}
              />
            ) : (
              <MemoryDashboard
                record={{
                  ...selectedSessionRecord,
                  playerName: student.name,
                  patient: student
                }}
                onExit={() => setSelectedSessionRecord(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* Modal: Generador de Evaluación Remota */}
      {isRemoteEvalOpen && (
        <RemoteEvalGenerator onClose={() => setIsRemoteEvalOpen(false)} />
      )}

      {/* Modal: Eliminación Total por Derechos ARCO (Ley 21.719) */}
      {showArcoModal && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0d1017] border border-red-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Eliminación Total de Datos (Derechos ARCO)
                </h3>
                <span className="text-[10px] text-red-400 font-mono">
                  Cumplimiento Ley N° 21.719 · Ejercicio de Derecho de Cancelación
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Está a punto de ejecutar la <strong>supresión total e irreversible</strong> del expediente de <strong className="text-white">{student.name}</strong>. Esta acción eliminará permanentemente todas sus sesiones de evaluación (Reaction y Memory Mirror), check-ins diarios, bitácora cualitativa y ficha escolar.
            </p>

            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 leading-relaxed font-mono">
              ⚠️ Esta operación no se puede deshacer. Se registrará un comprobante inmutable en la bitácora de auditoría institucional.
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Escriba <span className="text-red-400 font-mono font-black">BORRAR-TOTAL</span> para confirmar:
              </label>
              <input
                type="text"
                placeholder="BORRAR-TOTAL"
                value={arcoConfirmCode}
                onChange={e => setArcoConfirmCode(e.target.value)}
                className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500 font-mono tracking-widest uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowArcoModal(false);
                  setArcoConfirmCode('');
                }}
                disabled={isDeletingArco}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteArcoPurge}
                disabled={arcoConfirmCode !== 'BORRAR-TOTAL' || isDeletingArco}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingArco ? 'Purgando datos...' : 'Confirmar Supresión Irreversible'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
