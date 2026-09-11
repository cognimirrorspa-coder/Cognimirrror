'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Save, 
  UserPlus, 
  FileText, 
  BatteryLow, 
  Smile, 
  HelpCircle, 
  ArrowLeft, 
  Download, 
  Sparkles,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

export default function ExitSurveyCard({ 
  participantData, 
  surveyData, 
  onChange, 
  onSaveSession, 
  onResetForNextParticipant, 
  onBack,
  isSaving = false,
  saveSuccess = false 
}) {
  const [copied, setCopied] = useState(false);

  const scaleLabels = {
    fatiga: {
      1: 'Muy descansado / Sin fatiga',
      2: 'Fatiga leve',
      3: 'Fatiga moderada',
      4: 'Cansancio evidente',
      5: 'Agotamiento cognitivo severo'
    },
    disfrute: {
      1: 'Aburrido / Rechazo a la tarea',
      2: 'Poco entretenido',
      3: 'Neutro',
      4: 'Interesante y motivador',
      5: 'Excelente / Muy gratificante'
    },
    claridad: {
      1: 'Muy confuso / No entendió',
      2: 'Poco claro',
      3: 'Aceptable',
      4: 'Claro',
      5: 'Completamente claro'
    }
  };

  const handleCopyJSON = () => {
    const payload = {
      participant: participantData,
      exitSurvey: surveyData,
      timestamp: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── BANNER DE ÉXITO SI YA SE GUARDÓ ── */}
      {saveSuccess && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                ¡Sesión Clínica Guardada Exitosamente!
              </h4>
              <p className="text-xs text-emerald-300/80">
                Los datos de {participantData?.codigoParticipante || 'sujeto'} fueron registrados en la base de datos y respaldados localmente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResetForNextParticipant}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Evaluar Siguiente Participante</span>
          </button>
        </div>
      )}

      {/* ── FORMULARIO DE ENCUESTA DE SALIDA ── */}
      <div className="bg-[#0c101a]/95 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
              4. Encuesta de Salida y Cierre Clínico
            </h3>
            <p className="text-xs text-slate-400">
              Percepción subjetiva de carga mental, usabilidad y notas finales de la conducta del sujeto.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Fatiga Percibida */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BatteryLow className="w-4 h-4 text-rose-400" />
                Fatiga Cognitiva Post-Test
              </span>
              <span className="text-xs font-mono font-bold text-rose-300">
                {surveyData.fatigaPercibida ? `${surveyData.fatigaPercibida}/5` : '-'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 h-8 leading-snug">
              {surveyData.fatigaPercibida ? scaleLabels.fatiga[surveyData.fatigaPercibida] : '¿Cómo se siente de cansancio?'}
            </p>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange('fatigaPercibida', num)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    surveyData.fatigaPercibida === num
                      ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)] border border-rose-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Disfrute / Engagement */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-emerald-400" />
                Disfrute / Engagement
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {surveyData.disfrute ? `${surveyData.disfrute}/5` : '-'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 h-8 leading-snug">
              {surveyData.disfrute ? scaleLabels.disfrute[surveyData.disfrute] : '¿Qué tan entretenido le pareció el cubo?'}
            </p>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange('disfrute', num)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    surveyData.disfrute === num
                      ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-emerald-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Claridad de Instrucciones */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                Claridad de Instrucciones
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {surveyData.claridadInstrucciones ? `${surveyData.claridadInstrucciones}/5` : '-'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 h-8 leading-snug">
              {surveyData.claridadInstrucciones ? scaleLabels.claridad[surveyData.claridadInstrucciones] : '¿Se entendió lo que debía hacer?'}
            </p>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange('claridadInstrucciones', num)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    surveyData.claridadInstrucciones === num
                      ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Observaciones Finales del Evaluador */}
        <div className="pt-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Observaciones Cualitativas Finales del Evaluador</span>
          </label>
          <textarea
            rows={3}
            placeholder="Anota comportamientos destacados durante la sesión: verbalizaciones espontáneas, momentos de frustración o bloqueo, ajustes de postura, fatiga en muñecas o dedos, sonrisas ante aciertos..."
            value={surveyData.observacionesFinales || ''}
            onChange={(e) => onChange('observacionesFinales', e.target.value)}
            className="w-full bg-[#121726] border border-white/15 focus:border-purple-500 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* ── RESUMEN DE LA FICHA ANTES DE GUARDAR ── */}
      <div className="bg-[#0c101a]/70 border border-white/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Participante</span>
            <span className="text-white font-mono font-bold text-sm">{participantData?.codigoParticipante || '--'}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Edad / Sexo</span>
            <span className="text-slate-300 font-medium">{participantData?.edad || '--'} años · {participantData?.sexo || '--'}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Lateralidad</span>
            <span className="text-slate-300 font-medium">{participantData?.manoDominante || '--'}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Experiencia Rubik</span>
            <span className="text-purple-300 font-bold">{participantData?.experienciaRubik || '--'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyJSON}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          title="Copiar datos completos en formato JSON"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'JSON Copiado' : 'Copiar Resumen'}</span>
        </button>
      </div>

      {/* ── ACCIONES FINALES ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Baterías</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveSession}
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Guardando Sesión...' : 'Guardar Sesión Clínica Completa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
