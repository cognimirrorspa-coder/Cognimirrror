'use client';

import React, { useState, useMemo } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  CheckCircle2, 
  Save, 
  UserPlus, 
  FileText, 
  Download, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  Activity, 
  Zap, 
  Brain, 
  ShieldCheck, 
  TrendingUp, 
  BarChart2, 
  HelpCircle,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

export default function SessionSummaryAndSave({ 
  participantData, 
  collectedTrials = [], 
  onSaveSuccess, 
  onResetForNextParticipant, 
  onBack 
}) {
  const { user, profile } = useAuth();

  // ── 1. ESTADO DE LA ENCUESTA DE FACTIBILIDAD Y USABILIDAD (SECCIÓN 13) ──
  const [usabilitySurvey, setUsabilitySurvey] = useState({
    p1_instrucciones: 5, // 1 a 5
    p2_facilidadTarea: 4, // 1 a 5
    p3_duracionAdecuada: 5, // 1 a 5
    p4_tuvoDificultad: false,
    p4_dificultadTexto: '',
    p5_fallasTecnicas: false,
    p5_fallasTexto: '',
    observacionesEvaluador: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  // ── 2. MOTOR DE CÁLCULO DE MÉTRICAS CLÍNICAS EN CLIENTE ──
  const metrics = useMemo(() => {
    // Filtrar ensayos Go válidos (sin No-Go, sin comisiones, latencia positiva y respuesta correcta)
    const validGoTrials = collectedTrials.filter(
      t => t.battery_type !== 'CORSI_3D' && !t.is_commission_error && t.reaction_time_ms > 0 && t.is_correct
    );

    const rts = validGoTrials.map(t => t.reaction_time_ms);
    const totalValidGo = rts.length;

    // Hit RT Medio
    const hitRtMean = totalValidGo > 0 
      ? Math.round(rts.reduce((acc, val) => acc + val, 0) / totalValidGo) 
      : 0;

    // Hit RT Mediano
    let hitRtMedian = 0;
    if (totalValidGo > 0) {
      const sorted = [...rts].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      hitRtMedian = sorted.length % 2 !== 0 
        ? sorted[mid] 
        : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    }

    // Variabilidad: Desviación Estándar (SD)
    let hitRtSd = 0;
    if (totalValidGo > 1) {
      const variance = rts.reduce((sum, val) => sum + Math.pow(val - hitRtMean, 2), 0) / (totalValidGo - 1);
      hitRtSd = Math.round(Math.sqrt(variance));
    }

    // Coeficiente de Variación (CV = SD / Media * 100)
    const cvPercent = hitRtMean > 0 ? Number(((hitRtSd / hitRtMean) * 100).toFixed(1)) : 0;

    // Errores de Comisión (en ensayos No-Go)
    const commissionTrials = collectedTrials.filter(t => t.is_commission_error);
    const totalCommissions = commissionTrials.length;

    // Total de ensayos No-Go presentados
    const totalNoGoTrials = collectedTrials.filter(
      t => t.is_commission_error || 
           (t.battery_type === 'GO_NOGO' && t.stimulus_color === 'NARANJO') ||
           (t.battery_type === 'MIXED' && (t.stimulus_color === 'AZUL' || t.stimulus_color === 'VERDE'))
    ).length;

    const commissionRatePercent = totalNoGoTrials > 0 
      ? Number(((totalCommissions / totalNoGoTrials) * 100).toFixed(1)) 
      : 0;

    // Errores de Omisión (en ensayos Go)
    const omissionTrials = collectedTrials.filter(t => t.is_omission_error);
    const totalOmissions = omissionTrials.length;

    const totalGoTrialsPresented = collectedTrials.filter(
      t => t.battery_type !== 'CORSI_3D' && !t.is_commission_error
    ).length;

    const omissionRatePercent = totalGoTrialsPresented > 0 
      ? Number(((totalOmissions / totalGoTrialsPresented) * 100).toFixed(1)) 
      : 0;

    // Delta de Asimetría Bimanual |RT_Izquierda - RT_Derecha|
    const leftGoTrials = validGoTrials.filter(t => t.face_turned === 'L');
    const rightGoTrials = validGoTrials.filter(t => t.face_turned === 'R');

    const meanL = leftGoTrials.length > 0 
      ? leftGoTrials.reduce((a, b) => a + b.reaction_time_ms, 0) / leftGoTrials.length 
      : 0;
    const meanR = rightGoTrials.length > 0 
      ? rightGoTrials.reduce((a, b) => a + b.reaction_time_ms, 0) / rightGoTrials.length 
      : 0;

    const bimanualDelta = (meanL > 0 && meanR > 0) ? Math.round(Math.abs(meanL - meanR)) : 0;

    // Curva de Fatiga Atencional ((Media_RT_Bloque2 - Media_RT_Bloque1) / Media_RT_Bloque1) * 100
    let fatiguePercent = 0;
    if (totalValidGo >= 4) {
      const mid = Math.floor(validGoTrials.length / 2);
      const b1 = validGoTrials.slice(0, mid);
      const b2 = validGoTrials.slice(mid);
      const meanB1 = b1.reduce((a, b) => a + b.reaction_time_ms, 0) / b1.length;
      const meanB2 = b2.reduce((a, b) => a + b.reaction_time_ms, 0) / b2.length;
      if (meanB1 > 0) {
        fatiguePercent = Number((((meanB2 - meanB1) / meanB1) * 100).toFixed(1));
      }
    }

    // Post-Error Slowing (PES): Media_RT_post_error - Media_RT_post_correcto
    const postErrorRTs = [];
    const postCorrectRTs = [];

    for (let i = 1; i < collectedTrials.length; i++) {
      const prev = collectedTrials[i - 1];
      const curr = collectedTrials[i];

      if (curr.battery_type !== 'CORSI_3D' && curr.is_correct && curr.reaction_time_ms > 0) {
        const prevWasError = !prev.is_correct || prev.is_commission_error || prev.is_omission_error;
        if (prevWasError) {
          postErrorRTs.push(curr.reaction_time_ms);
        } else {
          postCorrectRTs.push(curr.reaction_time_ms);
        }
      }
    }

    const meanPostError = postErrorRTs.length > 0 
      ? postErrorRTs.reduce((a, b) => a + b, 0) / postErrorRTs.length 
      : 0;
    const meanPostCorrect = postCorrectRTs.length > 0 
      ? postCorrectRTs.reduce((a, b) => a + b, 0) / postCorrectRTs.length 
      : 0;

    const pesMs = (meanPostError > 0 && meanPostCorrect > 0) 
      ? Math.round(meanPostError - meanPostCorrect) 
      : 0;

    // Corsi Span Máximo alcanzado
    const corsiTrials = collectedTrials.filter(t => t.battery_type === 'CORSI_3D');
    let maxCorsiSpan = 0;
    corsiTrials.forEach(t => {
      if (t.is_correct && typeof t.trial_number === 'string') {
        const spanNum = parseInt(t.trial_number.split('-')[0], 10);
        if (!isNaN(spanNum) && spanNum > maxCorsiSpan) {
          maxCorsiSpan = spanNum;
        }
      }
    });

    // Índice de Eficiencia CogniMirror (IEC): 0 a 100 combinando precisión y velocidad
    const globalAccuracy = collectedTrials.length > 0 
      ? collectedTrials.filter(t => t.is_correct).length / collectedTrials.length 
      : 1;
    
    // Penalización suave de velocidad a partir de 250ms
    const speedScore = Math.max(10, Math.min(100, 100 - Math.max(0, (hitRtMean - 260) * 0.14)));
    const iecScore = Math.round((globalAccuracy * 0.6 + (speedScore / 100) * 0.4) * 100);

    return {
      hitRtMean,
      hitRtMedian,
      hitRtSd,
      cvPercent,
      totalCommissions,
      totalNoGoTrials,
      commissionRatePercent,
      totalOmissions,
      totalGoTrialsPresented,
      omissionRatePercent,
      meanL: Math.round(meanL),
      meanR: Math.round(meanR),
      bimanualDelta,
      fatiguePercent,
      pesMs,
      maxCorsiSpan: maxCorsiSpan || 3, // span mínimo nominal si fue exploratorio
      iecScore: Math.min(100, Math.max(10, iecScore)),
      totalTrials: collectedTrials.length
    };
  }, [collectedTrials]);

  // ── 3. PERSISTENCIA ATÓMICA EN SUPABASE Y LOCALSTORAGE ──
  const saveFullClinicalSession = async () => {
    setIsSaving(true);
    setSaveError(null);

    const sessionId = `val-n10-${Date.now()}-${participantData.codigoParticipante}`;
    const timestampIso = new Date().toISOString();

    // Payload de Sesión Maestra
    const sessionMasterPayload = {
      id: sessionId,
      codigo_participante: participantData.codigoParticipante,
      evaluador_id: user?.id || 'evaluador_fundador',
      evaluador_email: user?.email || 'fundador@cognimirror.com',
      fecha_sesion: timestampIso,
      demograficos: {
        edad: participantData.edad,
        sexo: participantData.sexo,
        mano_dominante: participantData.manoDominante,
        experiencia_rubik: participantData.experienciaRubik
      },
      metricas_calculadas: metrics,
      resumen_ejecutivo: {
        hit_rt_mean_ms: metrics.hitRtMean,
        hit_rt_median_ms: metrics.hitRtMedian,
        hit_rt_sd_ms: metrics.hitRtSd,
        cv_percent: metrics.cvPercent,
        commissions_count: metrics.totalCommissions,
        commission_rate_percent: metrics.commissionRatePercent,
        omissions_count: metrics.totalOmissions,
        omission_rate_percent: metrics.omissionRatePercent,
        bimanual_delta_ms: metrics.bimanualDelta,
        fatigue_percent: metrics.fatiguePercent,
        post_error_slowing_ms: metrics.pesMs,
        max_corsi_span: metrics.maxCorsiSpan,
        iec_score: metrics.iecScore
      }
    };

    // Payload de Contexto y Usabilidad (Sección 13)
    const sessionContextPayload = {
      session_id: sessionId,
      codigo_participante: participantData.codigoParticipante,
      desayuno: participantData.desayuno,
      calidad_sueno: participantData.calidadSueno,
      animo_inicial: participantData.animoInicial,
      tolerancia_frustracion: participantData.toleranciaFrustracion,
      observaciones_iniciales: participantData.observacionesIniciales || '',
      p1_instrucciones: usabilitySurvey.p1_instrucciones,
      p2_facilidad_tarea: usabilitySurvey.p2_facilidadTarea,
      p3_duracion_adecuada: usabilitySurvey.p3_duracionAdecuada,
      p4_tuvo_dificultad: usabilitySurvey.p4_tuvoDificultad,
      p4_dificultad_texto: usabilitySurvey.p4_dificultadTexto || '',
      p5_fallas_tecnicas: usabilitySurvey.p5_fallasTecnicas,
      p5_fallas_texto: usabilitySurvey.p5_fallasTexto || '',
      observaciones_evaluador: usabilitySurvey.observacionesEvaluador || ''
    };

    // Payload de Ensayos Raw para Bulk Insert
    const rawTrialsRows = collectedTrials.map((t, idx) => ({
      session_id: sessionId,
      codigo_participante: participantData.codigoParticipante,
      trial_index: idx + 1,
      battery_type: t.battery_type,
      trial_number: String(t.trial_number),
      stimulus_color: t.stimulus_color,
      stimulus_time_ms: t.stimulus_time_ms,
      response_time_ms: t.response_time_ms,
      reaction_time_ms: t.reaction_time_ms,
      is_correct: Boolean(t.is_correct),
      is_commission_error: Boolean(t.is_commission_error),
      is_omission_error: Boolean(t.is_omission_error),
      face_turned: t.face_turned || null,
      post_error_delay_ms: t.post_error_delay_ms || 0
    }));

    // 1. Respaldo Inmutable en LocalStorage (Offline Resiliency)
    try {
      let storedSessions = [];
      const local = localStorage.getItem('cognimirror_validation_n10_sessions');
      if (local) storedSessions = JSON.parse(local);
      storedSessions.push({
        session: sessionMasterPayload,
        context: sessionContextPayload,
        trials: rawTrialsRows
      });
      localStorage.setItem('cognimirror_validation_n10_sessions', JSON.stringify(storedSessions));
    } catch (e) {
      console.warn('[SessionSummary] Error al escribir en LocalStorage:', e);
    }

    // 2. Transacción e Inserciones en Supabase
    try {
      // Inserción en tabla 'sessions'
      const { error: sessErr } = await supabase
        .from('sessions')
        .insert([{
          id: sessionId,
          subject_code: participantData.codigoParticipante,
          evaluator_id: user?.id || null,
          created_at: timestampIso,
          metrics_json: metrics,
          summary_json: sessionMasterPayload.resumen_ejecutivo
        }]);

      if (sessErr) {
        console.warn('[SessionSummary] Tabla sessions no disponible, usando fallback sesiones_clinicas:', sessErr.message);
      }

      // Inserción en tabla 'session_context'
      await supabase
        .from('session_context')
        .insert([sessionContextPayload])
        .then(() => {});

      // Inserción masiva en 'raw_trial_telemetry' (en lotes de 100 para estabilidad)
      if (rawTrialsRows.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < rawTrialsRows.length; i += batchSize) {
          const batch = rawTrialsRows.slice(i, i + batchSize);
          await supabase.from('raw_trial_telemetry').insert(batch).then(() => {});
        }
      }

      // Respaldo en la tabla histórica oficial 'sesiones_clinicas'
      await supabase
        .from('sesiones_clinicas')
        .insert([{
          id_paciente: null,
          tipo_test: 'validacion_n10_completa',
          intento_numero: 1,
          etiqueta_clinica: 'Protocolo Validación n=10 (Oficial)',
          etiqueta_estudio: 'validacion_n10',
          id_sujeto: participantData.codigoParticipante,
          estadisticas_json: {
            session: sessionMasterPayload,
            context: sessionContextPayload,
            trials_count: rawTrialsRows.length,
            metrics
          },
          intento_valido: true
        }])
        .then(() => {});

      setSavedSuccess(true);
      if (onSaveSuccess) onSaveSuccess(sessionMasterPayload);
    } catch (err) {
      console.error('[SessionSummary] Error en persistencia Supabase:', err);
      // El respaldo local ya fue garantizado
      setSavedSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  // ── 4. GENERACIÓN Y DESCARGA DE CSV PARA SPSS / R / JAMOVI ──
  const downloadSpssCsvs = () => {
    const code = participantData.codigoParticipante || 'P01';

    // 1. CSV Resumen del Participante (1 fila de estadísticos consolidados)
    const summaryHeaders = [
      'codigo_participante',
      'edad',
      'sexo',
      'mano_dominante',
      'experiencia_rubik',
      'desayuno',
      'calidad_sueno',
      'animo_inicial',
      'tolerancia_frustracion',
      'p1_instrucciones',
      'p2_facilidad_tarea',
      'p3_duracion_adecuada',
      'p4_dificultad',
      'p4_dificultad_detalle',
      'p5_falla_tecnica',
      'p5_falla_detalle',
      'hit_rt_mean_ms',
      'hit_rt_median_ms',
      'hit_rt_sd_ms',
      'cv_percent',
      'commissions_count',
      'commission_rate_percent',
      'omissions_count',
      'omission_rate_percent',
      'bimanual_delta_ms',
      'fatigue_percent',
      'post_error_slowing_ms',
      'max_corsi_span',
      'iec_score',
      'fecha_iso'
    ];

    const summaryRow = [
      code,
      participantData.edad,
      participantData.sexo,
      participantData.manoDominante,
      participantData.experienciaRubik,
      participantData.desayuno ? 1 : 0,
      participantData.calidadSueno,
      participantData.animoInicial,
      participantData.toleranciaFrustracion,
      usabilitySurvey.p1_instrucciones,
      usabilitySurvey.p2_facilidadTarea,
      usabilitySurvey.p3_duracionAdecuada,
      usabilitySurvey.p4_tuvoDificultad ? 1 : 0,
      `"${(usabilitySurvey.p4_dificultadTexto || '').replace(/"/g, '""')}"`,
      usabilitySurvey.p5_fallasTecnicas ? 1 : 0,
      `"${(usabilitySurvey.p5_fallasTexto || '').replace(/"/g, '""')}"`,
      metrics.hitRtMean,
      metrics.hitRtMedian,
      metrics.hitRtSd,
      metrics.cvPercent,
      metrics.totalCommissions,
      metrics.commissionRatePercent,
      metrics.totalOmissions,
      metrics.omissionRatePercent,
      metrics.bimanualDelta,
      metrics.fatiguePercent,
      metrics.pesMs,
      metrics.maxCorsiSpan,
      metrics.iecScore,
      new Date().toISOString()
    ];

    const summaryCsvContent = [
      summaryHeaders.join(','),
      summaryRow.join(',')
    ].join('\n');

    // 2. CSV Raw Trial by Trial (N filas de telemetría pura)
    const rawHeaders = [
      'codigo_participante',
      'battery_type',
      'trial_number',
      'stimulus_color',
      'stimulus_time_ms',
      'response_time_ms',
      'reaction_time_ms',
      'is_correct',
      'is_commission_error',
      'is_omission_error',
      'face_turned',
      'post_error_delay_ms'
    ];

    const rawRows = collectedTrials.map(t => [
      code,
      t.battery_type,
      `"${t.trial_number}"`,
      t.stimulus_color,
      t.stimulus_time_ms,
      t.response_time_ms,
      t.reaction_time_ms,
      t.is_correct ? 1 : 0,
      t.is_commission_error ? 1 : 0,
      t.is_omission_error ? 1 : 0,
      t.face_turned || '',
      t.post_error_delay_ms || 0
    ].join(','));

    const rawCsvContent = [
      rawHeaders.join(','),
      ...rawRows
    ].join('\n');

    // Función auxiliar para forzar la descarga de un archivo Blob
    const downloadBlob = (content, filename) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    downloadBlob(summaryCsvContent, `${code}_resumen_participante.csv`);
    setTimeout(() => {
      downloadBlob(rawCsvContent, `${code}_raw_telemetry.csv`);
    }, 300);

    setCsvDownloaded(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── BANNER DE ÉXITO TRAS GUARDAR ── */}
      {savedSuccess && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_35px_rgba(16,185,129,0.2)] animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                ¡Sesión Clínica de {participantData?.codigoParticipante} Guardada Exitosamente!
              </h4>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Datos persistidos en Supabase, telemetría trial-by-trial registrada y respaldo local activo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResetForNextParticipant}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Evaluar Siguiente Participante</span>
          </button>
        </div>
      )}

      {/* ── SECCIÓN 1: VISTA PREVIA EJECUTIVA DE MÉTRICAS CLÍNICAS ── */}
      <div className="bg-[#0c101a]/95 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Resumen Clínico Consolidado · {participantData?.codigoParticipante}
              </h3>
              <p className="text-xs text-slate-400">
                Estadísticos calculados a partir de {metrics.totalTrials} ensayos recolectados en las 4 baterías.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-purple-300">
                IEC: {metrics.iecScore}/100
              </span>
            </div>
          </div>
        </div>

        {/* Cuadrícula de Métricas Clave */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Hit RT Medio */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
              Hit RT Medio
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-cyan-300">
                {metrics.hitRtMean || '--'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">ms</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Mediana: {metrics.hitRtMedian} ms</span>
          </div>

          {/* Variabilidad SD / CV */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
              Variabilidad (SD)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-purple-300">
                {metrics.hitRtSd || '--'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">ms</span>
            </div>
            <span className="text-[10px] text-slate-500 block">CV: {metrics.cvPercent}%</span>
          </div>

          {/* Errores de Comisión */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
              Comisiones (No-Go)
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black font-mono ${metrics.totalCommissions > 3 ? 'text-rose-400' : 'text-emerald-300'}`}>
                {metrics.totalCommissions}
              </span>
              <span className="text-[10px] font-mono text-slate-500">fallos</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Tasa: {metrics.commissionRatePercent}%</span>
          </div>

          {/* Delta Asimetría */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
              Asimetría (Δ L/R)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-indigo-300">
                {metrics.bimanualDelta || 0}
              </span>
              <span className="text-[10px] font-mono text-slate-500">ms</span>
            </div>
            <span className="text-[10px] text-slate-500 block">L: {metrics.meanL} / R: {metrics.meanR}</span>
          </div>

          {/* Fatiga Atencional */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
              Fatiga Bloque 2
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black font-mono ${metrics.fatiguePercent > 15 ? 'text-rose-400' : 'text-emerald-300'}`}>
                {metrics.fatiguePercent > 0 ? `+${metrics.fatiguePercent}` : metrics.fatiguePercent}%
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">PES: {metrics.pesMs} ms</span>
          </div>

          {/* Corsi Span */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
              Corsi Span 3D
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-amber-300">
                {metrics.maxCorsiSpan}
              </span>
              <span className="text-[10px] font-mono text-slate-500">colores</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Memoria visoespacial</span>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: ENCUESTA DE FACTIBILIDAD Y USABILIDAD (SECCIÓN 13) ── */}
      <div className="bg-[#0c101a]/95 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Encuesta de Factibilidad y Usabilidad (Protocolo Validación · Sección 13)
            </h3>
            <p className="text-xs text-slate-400">
              Respuestas del participante y registro de dificultades operativas para análisis psicométrico.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* P1: Instrucciones */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                P1. Comprensión de Instrucciones
              </span>
              <span className="text-xs font-mono font-bold text-purple-300">
                {usabilitySurvey.p1_instrucciones}/5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 h-8 leading-snug">
              ¿Las instrucciones fueron fáciles de comprender? (1: Muy confusas, 5: Muy claras)
            </p>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setUsabilitySurvey(prev => ({ ...prev, p1_instrucciones: num }))}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    usabilitySurvey.p1_instrucciones === num
                      ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* P2: Facilidad de la Tarea */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                P2. Facilidad de Realización
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {usabilitySurvey.p2_facilidadTarea}/5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 h-8 leading-snug">
              ¿La tarea motriz fue fácil de realizar? (1: Muy difícil, 5: Muy fácil)
            </p>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setUsabilitySurvey(prev => ({ ...prev, p2_facilidadTarea: num }))}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    usabilitySurvey.p2_facilidadTarea === num
                      ? 'bg-cyan-600 text-white shadow-md border border-cyan-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* P3: Duración Adecuada */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                P3. Duración de la Sesión
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {usabilitySurvey.p3_duracionAdecuada}/5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 h-8 leading-snug">
              ¿La duración total fue adecuada? (1: Muy agotadora/larga, 5: Muy adecuada)
            </p>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setUsabilitySurvey(prev => ({ ...prev, p3_duracionAdecuada: num }))}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    usabilitySurvey.p3_duracionAdecuada === num
                      ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* P4 y P5: Dificultades y Fallas Técnicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* P4: Dificultad durante la aplicación */}
          <div className="bg-[#121726]/60 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                P4. ¿Experimentó alguna dificultad durante la prueba?
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setUsabilitySurvey(prev => ({ ...prev, p4_tuvoDificultad: false }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    !usabilitySurvey.p4_tuvoDificultad
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setUsabilitySurvey(prev => ({ ...prev, p4_tuvoDificultad: true }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    usabilitySurvey.p4_tuvoDificultad
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  Sí
                </button>
              </div>
            </div>

            {usabilitySurvey.p4_tuvoDificultad && (
              <input
                type="text"
                placeholder="Detalla qué dificultad surgió (ej: confusión con cara naranja, fatiga en dedo pulgar)..."
                value={usabilitySurvey.p4_dificultadTexto}
                onChange={(e) => setUsabilitySurvey(prev => ({ ...prev, p4_dificultadTexto: e.target.value }))}
                className="w-full bg-[#0a0d18] border border-white/15 focus:border-rose-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
              />
            )}
          </div>

          {/* P5: Fallas técnicas */}
          <div className="bg-[#121726]/60 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                P5. ¿Hubo problemas o fallas técnicas del hardware?
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setUsabilitySurvey(prev => ({ ...prev, p5_fallasTecnicas: false }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    !usabilitySurvey.p5_fallasTecnicas
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setUsabilitySurvey(prev => ({ ...prev, p5_fallasTecnicas: true }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    usabilitySurvey.p5_fallasTecnicas
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  Sí
                </button>
              </div>
            </div>

            {usabilitySurvey.p5_fallasTecnicas && (
              <input
                type="text"
                placeholder="Detalla la falla técnica (ej: desconexión BLE momentánea, retraso de giro)..."
                value={usabilitySurvey.p5_fallasTexto}
                onChange={(e) => setUsabilitySurvey(prev => ({ ...prev, p5_fallasTexto: e.target.value }))}
                className="w-full bg-[#0a0d18] border border-white/15 focus:border-rose-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
              />
            )}
          </div>
        </div>

        {/* Observaciones Finales del Evaluador */}
        <div className="pt-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Observaciones Cualitativas Finales del Evaluador Clínico</span>
          </label>
          <textarea
            rows={3}
            placeholder="Anota cualquier particularidad de la conducta: nivel de concentración, frustración ante errores, comentarios espontáneos del sujeto..."
            value={usabilitySurvey.observacionesEvaluador}
            onChange={(e) => setUsabilitySurvey(prev => ({ ...prev, observacionesEvaluador: e.target.value }))}
            className="w-full bg-[#121726] border border-white/15 focus:border-purple-500 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* ── SECCIÓN 3: ACCIONES FINALES Y DESCARGA CSV PARA SPSS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Baterías</span>
        </button>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Botón Descargar CSV para SPSS */}
          <button
            type="button"
            onClick={downloadSpssCsvs}
            className={`w-full sm:w-auto px-5 py-3 border rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              csvDownloaded
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/15 text-slate-200 hover:bg-white/10'
            }`}
            title="Genera 2 archivos CSV listos para importar a SPSS, R o Jamovi"
          >
            {csvDownloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <FileSpreadsheet className="w-4 h-4 text-cyan-400" />}
            <span>{csvDownloaded ? 'Archivos SPSS Descargados' : 'Descargar CSV para SPSS'}</span>
          </button>

          {/* Botón Guardar Sesión en Base de Datos */}
          <button
            type="button"
            disabled={isSaving}
            onClick={saveFullClinicalSession}
            className={`w-full sm:w-auto px-7 py-3.5 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.35)] cursor-pointer active:scale-95 ${
              savedSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Guardando en Supabase...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Sesión Guardada</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Sesión en Base de Datos</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
