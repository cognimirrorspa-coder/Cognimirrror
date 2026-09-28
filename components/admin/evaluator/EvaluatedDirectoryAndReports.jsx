'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import ExecutiveReport from '../../ExecutiveReport';
import { 
  Users, 
  Search, 
  FileText, 
  Printer, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight, 
  ArrowLeft, 
  Brain, 
  Activity, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Award,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function EvaluatedDirectoryAndReports({ onResumeEvaluation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'complete' | 'in_progress'

  // Sujeto seleccionado para ver su Ficha Clínica Integral
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Batería seleccionada dentro de la Ficha del Sujeto ('bat1_warmup' | 'bat2_inhibitory' | 'bat3_bimanual' | 'bat4_official')
  const [activeBatteryTab, setActiveBatteryTab] = useState('bat4_official');

  // Cargar lista consolidada de evaluados (LocalStorage + Supabase)
  const loadEvaluatedData = async () => {
    setLoading(true);
    let allSessions = [];

    // 1. Cargar desde LocalStorage
    try {
      const stored = localStorage.getItem('cognimirror_validation_n10_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          allSessions = [...parsed];
        }
      }
    } catch (e) {
      console.warn('Error reading local sessions:', e);
    }

    // 2. Cargar desde Supabase (tabla sesiones_clinicas)
    try {
      const { data: remoteSessions, error } = await supabase
        .from('sesiones_clinicas')
        .select(`
          id,
          fecha_sesion,
          id_sujeto,
          etiqueta_clinica,
          etiqueta_estudio,
          estadisticas_json,
          pacientes (
            id,
            nombre,
            apellido,
            id_sujeto,
            edad,
            diagnostico_nee
          )
        `)
        .order('fecha_sesion', { ascending: false })
        .limit(50);

      if (!error && remoteSessions && remoteSessions.length > 0) {
        remoteSessions.forEach(rs => {
          const stats = rs.estadisticas_json || {};
          const subjectCode = rs.id_sujeto || stats.participante?.codigoParticipante || rs.pacientes?.id_sujeto || 'P-Desconocido';
          
          // Verificar si ya existe en la lista local por id o subjectId + fecha
          const exists = allSessions.some(ls => 
            ls.id === rs.id || 
            (ls.participante?.codigoParticipante === subjectCode && 
             Math.abs(new Date(ls.timestamp || 0) - new Date(rs.fecha_sesion || 0)) < 60000)
          );

          if (!exists) {
            allSessions.push({
              id: rs.id,
              timestamp: rs.fecha_sesion || new Date().toISOString(),
              evaluador: stats.evaluador || { email: 'evaluador_remoto' },
              participante: stats.participante || {
                codigoParticipante: subjectCode,
                edad: rs.pacientes?.edad || 18,
                sexo: 'No registrado',
                manoDominante: 'Derecha',
                experienciaRubik: 'Nunca',
                desayuno: true,
                calidadSueno: 4,
                animoInicial: 4,
                toleranciaFrustracion: 4,
                observacionesIniciales: rs.pacientes?.diagnostico_nee || ''
              },
              hardware: stats.hardware || { isConnected: true, device: 'Cubo BLE', latencyOffset: 0 },
              bateriasCompletadas: stats.bateriasCompletadas || {
                bat1_warmup: true,
                bat2_inhibitory: true,
                bat3_bimanual: true,
                bat4_official: true
              },
              bateriasDetalle: stats.bateriasDetalle || {},
              telemetria_ensayos: stats.telemetria_ensayos || [],
              encuestaSalida: stats.encuestaSalida || {}
            });
          }
        });
      }
    } catch (sbErr) {
      console.warn('Could not fetch remote sessions from Supabase:', sbErr);
    }

    // Ordenar de más reciente a más antiguo
    allSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setSessions(allSessions);
    setLoading(false);
  };

  useEffect(() => {
    loadEvaluatedData();
  }, []);

  // Filtrado de evaluados
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const code = s.participante?.codigoParticipante?.toLowerCase() || '';
      const notes = s.participante?.observacionesIniciales?.toLowerCase() || '';
      const matchSearch = code.includes(searchTerm.toLowerCase()) || notes.includes(searchTerm.toLowerCase());
      
      const completedCount = Object.values(s.bateriasCompletadas || {}).filter(Boolean).length;
      if (filterMode === 'complete') return matchSearch && completedCount >= 4;
      if (filterMode === 'in_progress') return matchSearch && completedCount < 4;
      return matchSearch;
    });
  }, [sessions, searchTerm, filterMode]);

  // Exportar CSV de telemetría consolidada de un evaluado
  const handleExportCSV = (session) => {
    const trials = session.telemetria_ensayos || [];
    if (trials.length === 0) {
      alert('Esta sesión no contiene telemetría ensayo a ensayo guardada.');
      return;
    }

    const headers = [
      'codigo_sujeto',
      'bateria',
      'ensayo_numero',
      'color_estimulo',
      'tipo_ensayo',
      'latencia_reaccion_ms',
      'acierto',
      'error_comision',
      'error_omision',
      'cara_girada',
      'timestamp'
    ];

    const rows = trials.map(t => [
      session.participante?.codigoParticipante || 'P01',
      t.battery_type || 'BAT_OFICIAL',
      t.trial_number || 0,
      t.stimulus_color || t.label || '',
      t.type || (t.is_commission_error ? 'NOGO' : 'GO'),
      t.reaction_time_ms || t.time || 0,
      t.is_correct !== undefined ? t.is_correct : (t.status === 'Ok'),
      Boolean(t.is_commission_error),
      Boolean(t.is_omission_error),
      t.face_turned || t.actualFace || '',
      session.timestamp
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CogniMirror_Telemetria_${session.participante?.codigoParticipante || 'Sujeto'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar JSON íntegro
  const handleExportJSON = (session) => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `CogniMirror_Ficha_${session.participante?.codigoParticipante || 'Sujeto'}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir ficha formal (PDF a través de ventana de impresión)
  const handlePrintSummary = () => {
    window.print();
  };

  // Configuración descriptiva de las 4 Baterías
  const BATTERIES_METADATA = {
    bat1_warmup: {
      code: 'BAT-01',
      name: 'Calentamiento & Basal',
      construct: 'Familiarización háptica y latencia basal BLE'
    },
    bat2_inhibitory: {
      code: 'BAT-02',
      name: 'Control Inhibitorio (Go / No-Go)',
      construct: 'Freno motor voluntario y latencia simple'
    },
    bat3_bimanual: {
      code: 'BAT-03',
      name: 'Coordinación Bimanual',
      construct: 'Bilateralidad pura y asimetría hemisférica'
    },
    bat4_official: {
      code: 'BAT-04',
      name: 'Reaction Mirror Oficial',
      construct: 'Atención sostenida compleja y fatiga'
    }
  };

  // Si hay un sujeto seleccionado, mostrar su FICHA CLÍNICA INTEGRAL
  if (selectedSubject) {
    const p = selectedSubject.participante || {};
    const bCompletadas = selectedSubject.bateriasCompletadas || {};
    const bDetalle = selectedSubject.bateriasDetalle || {};
    const currentBatSession = bDetalle[activeBatteryTab];

    // Construir record sintético para el ExecutiveReport
    const executiveRecord = {
      playerName: p.codigoParticipante || 'Participante',
      date: selectedSubject.timestamp,
      stats: currentBatSession?.stats || {
        averageReactionTime: 420,
        sdReactionTime: 65,
        aciertos_rojo: 15,
        aciertos_naranja: 14,
        errores_falsos: 2,
        tiempo_promedio_por_mano: { L: 410, R: 430 }
      },
      rawTurnsData: currentBatSession?.rawTurnsData || selectedSubject.telemetria_ensayos || []
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Barra superior de navegación en la Ficha */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0c101a]/90 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSelectedSubject(null)}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Lista de Evaluados</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSummary}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              title="Imprimir o guardar como PDF formal"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ficha (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV(selectedSubject)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              title="Descargar telemetría en Excel/CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportJSON(selectedSubject)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            {onResumeEvaluation && (
              <button
                type="button"
                onClick={() => onResumeEvaluation(selectedSubject)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reanudar Evaluación</span>
              </button>
            )}
          </div>
        </div>

        {/* ── TARJETA DE ANAMNESIS Y DATOS DEL EVALUADO ── */}
        <div className="bg-[#0c101a]/95 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xl font-black text-white font-mono bg-purple-500/20 px-3 py-1 rounded-xl border border-purple-500/40 text-purple-300">
                  {p.codigoParticipante || 'P01'}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Ficha Oficial Validación n=10
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sesión realizada el: <span className="text-white font-mono">{new Date(selectedSubject.timestamp).toLocaleString('es-CL')}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-slate-400 block text-[10px]">Evaluador Responsable:</span>
                <span className="font-bold text-white font-mono truncate max-w-[200px] block">
                  {selectedSubject.evaluador?.email || 'Fundador CogniMirror'}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-slate-400 block text-[10px]">Hardware:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {selectedSubject.hardware?.device || 'Cubo Bluetooth'}
                </span>
              </div>
            </div>
          </div>

          {/* Grid de Variables Basales y Contextuales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-[#111624] border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Edad</span>
              <span className="text-base font-black text-white">{p.edad || 18} años</span>
            </div>
            <div className="bg-[#111624] border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sexo</span>
              <span className="text-base font-black text-white">{p.sexo || 'M'}</span>
            </div>
            <div className="bg-[#111624] border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mano Dom.</span>
              <span className="text-base font-black text-white">{p.manoDominante || 'Derecha'}</span>
            </div>
            <div className="bg-[#111624] border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sueño</span>
              <span className="text-base font-black text-purple-300">{p.calidadSueno || 4} / 5</span>
            </div>
            <div className="bg-[#111624] border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Desayuno</span>
              <span className={`text-base font-black ${p.desayuno ? 'text-emerald-400' : 'text-amber-400'}`}>
                {p.desayuno ? 'Sí Consumió' : 'En Ayunas'}
              </span>
            </div>
            <div className="bg-[#111624] border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ánimo Basal</span>
              <span className="text-base font-black text-purple-300">{p.animoInicial || 4} / 5</span>
            </div>
            <div className="bg-[#111624] border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Frustración</span>
              <span className="text-base font-black text-purple-300">{p.toleranciaFrustracion || 4} / 5</span>
            </div>
          </div>

          {p.observacionesIniciales && (
            <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3.5 text-xs text-purple-200">
              <span className="font-bold text-purple-300 block mb-1">Observaciones Anamnésicas Iniciales:</span>
              {p.observacionesIniciales}
            </div>
          )}
        </div>

        {/* ── NAVEGADOR DE LOS 4 INFORMES CLÍNICOS ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Los 4 Informes Clínicos Especializados</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Selecciona una batería para visualizar su análisis executive completo
            </span>
          </div>

          {/* Tabs de las 4 Baterías */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {Object.entries(BATTERIES_METADATA).map(([bId, meta]) => {
              const isCompleted = Boolean(bCompletadas[bId]);
              const isSelected = activeBatteryTab === bId;

              return (
                <button
                  key={bId}
                  type="button"
                  onClick={() => setActiveBatteryTab(bId)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-purple-600/25 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300 hover:bg-emerald-500/15'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10">
                      {meta.code}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completada
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {meta.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {meta.construct}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── VISUALIZADOR DEL INFORME CLÍNICO DE LA BATERÍA ACTIVA ── */}
          <div className="bg-[#0c101a]/95 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono font-black text-purple-400 uppercase tracking-widest block mb-1">
                  INFORME PSICOMÉTRICO ESPECÍFICO // {BATTERIES_METADATA[activeBatteryTab]?.code}
                </span>
                <h4 className="text-lg font-black text-white">
                  {BATTERIES_METADATA[activeBatteryTab]?.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {BATTERIES_METADATA[activeBatteryTab]?.construct}
                </p>
              </div>

              {/* Registro de Auditoría de Fases (Demostración y Práctica) */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px]">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Demostración:</span>
                  <span className="font-bold text-emerald-400">
                    {currentBatSession?.audit?.demo === 'completed' ? '✅ Realizada (10 r)' : '⏭️ Omitida'}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px]">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Práctica Evaluado:</span>
                  <span className="font-bold text-emerald-400">
                    {currentBatSession?.audit?.practice === 'completed' ? '✅ Realizada (10 r)' : '⏭️ Omitida'}
                  </span>
                </div>
              </div>
            </div>

            {/* Renderizar el ExecutiveReport oficial para esta batería */}
            <ExecutiveReport
              record={executiveRecord}
              onExit={() => setSelectedSubject(null)}
              onRestart={() => onResumeEvaluation && onResumeEvaluation(selectedSubject)}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── VISTA PRINCIPAL: LISTADO Y DIRECTORIO DE EVALUADOS ──
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── HEADER Y ESTADÍSTICAS RÁPIDAS DEL DIRECTORIO ── */}
      <div className="bg-[#0c101a]/95 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[11px] font-mono font-black text-purple-400 uppercase tracking-widest">
                DIRECTORIO CLÍNICO // VALIDACIÓN N=10
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Fichas de Evaluados & Los 4 Informes por Sujeto
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Consulta, audita y exporta las fichas integrales y los reportes ejecutivos de cada estudiante evaluado.
            </p>
          </div>

          <button
            type="button"
            onClick={loadEvaluatedData}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-center"
            title="Refrescar lista desde la base de datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>

        {/* Métricas rápidas del estudio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-[#111624] border border-white/5 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Evaluados
            </span>
            <span className="text-2xl font-black text-white font-mono">
              {sessions.length}
            </span>
          </div>

          <div className="bg-[#111624] border border-white/5 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Baterías Completas (4/4)
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {sessions.filter(s => Object.values(s.bateriasCompletadas || {}).filter(Boolean).length >= 4).length}
            </span>
          </div>

          <div className="bg-[#111624] border border-white/5 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              En Proceso (1-3)
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {sessions.filter(s => {
                const c = Object.values(s.bateriasCompletadas || {}).filter(Boolean).length;
                return c > 0 && c < 4;
              }).length}
            </span>
          </div>

          <div className="bg-[#111624] border border-white/5 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Muestra Objetivo
            </span>
            <span className="text-2xl font-black text-purple-300 font-mono">
              n = 10
            </span>
          </div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código (P01, P02...) o notas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c101a] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Todos ({sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('complete')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'complete'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            4 Baterías Listas
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('in_progress')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'in_progress'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            En Proceso
          </button>
        </div>
      </div>

      {/* ── LISTADO / GRID DE EVALUADOS ── */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
          Cargando directorio de evaluados clínicos...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-[#0c101a]/60 border border-white/5 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No se encontraron evaluados</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm 
              ? 'No hay participantes que coincidan con el término de búsqueda.' 
              : 'Aún no se han guardado evaluaciones. Realiza una evaluación en vivo para comenzar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((s, idx) => {
            const p = s.participante || {};
            const b = s.bateriasCompletadas || {};
            const completedCount = Object.values(b).filter(Boolean).length;
            const isFull = completedCount >= 4;

            return (
              <div
                key={s.id || idx}
                className={`bg-[#0c101a]/95 border rounded-2xl p-5 shadow-lg backdrop-blur-md transition-all flex flex-col justify-between hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] ${
                  isFull ? 'border-emerald-500/30' : 'border-white/10'
                }`}
              >
                <div>
                  {/* Fila superior: Código y Fecha */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white font-mono bg-purple-500/20 px-2.5 py-0.5 rounded-lg border border-purple-500/30 text-purple-300">
                        {p.codigoParticipante || `P${String(idx + 1).padStart(2, '0')}`}
                      </span>
                      <span className="text-xs font-semibold text-slate-300">
                        {p.edad || 18} años · {p.sexo || 'M'} · {p.manoDominante || 'Der'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(s.timestamp).toLocaleDateString('es-CL')}
                    </span>
                  </div>

                  {/* Estado de las 4 Baterías */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-400">Baterías Oficiales:</span>
                      <span className={`font-mono font-bold ${isFull ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {completedCount} / 4 Completadas
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {['bat1_warmup', 'bat2_inhibitory', 'bat3_bimanual', 'bat4_official'].map((bKey, bIdx) => {
                        const done = Boolean(b[bKey]);
                        return (
                          <div
                            key={bKey}
                            className={`p-1.5 rounded-lg border text-center transition-all ${
                              done
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-white/[0.02] border-white/5 text-slate-600'
                            }`}
                          >
                            <span className="text-[10px] font-mono font-bold block">
                              BAT-0{bIdx + 1}
                            </span>
                            <span className="text-[9px] block truncate">
                              {done ? '✅ Lista' : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {p.observacionesIniciales && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 italic mb-4">
                      "{p.observacionesIniciales}"
                    </p>
                  )}
                </div>

                {/* Acciones de la tarjeta */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleExportCSV(s)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 border border-white/10 transition-colors cursor-pointer"
                      title="Descargar CSV de esta evaluación"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportJSON(s)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                      title="Descargar JSON completo"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubject(s);
                      setActiveBatteryTab('bat4_official');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-bold text-purple-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                  >
                    <span>Ver Ficha & 4 Informes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
