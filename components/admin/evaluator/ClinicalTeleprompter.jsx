'use client';

import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Info,
  CheckCircle2
} from 'lucide-react';

export default function ClinicalTeleprompter({ participantCode }) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completedChecks, setCompletedChecks] = useState({
    posture: false,
    grip: false,
    environment: false,
    comprehension: false
  });

  const clinicalScript = `A continuación realizarás una serie de tareas en CogniMirror. El objetivo es realizar cada actividad siguiendo las instrucciones. No necesitas preocuparte por hacerlo perfecto. Si tienes dudas, pregúntame antes de comenzar. Durante la prueba intenta responder de la manera más rápida y precisa posible.`;

  const toggleCheck = (key) => {
    setCompletedChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(clinicalScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clinicalScript);
    utterance.lang = 'es-CL';
    utterance.rate = 0.92; // Ritmo pausado y claro para evaluación clínica
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="bg-[#0b101e]/90 border border-purple-500/20 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Luz ambiental de fondo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header del Teleprompter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide uppercase">
              Teleprompter Clínico Estandarizado
            </h4>
            <p className="text-[11px] text-purple-300/80">
              Guion oficial para el evaluador. Leer en voz alta con tono pausado y neutral.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón TTS Lectura Automatizada */}
          <button
            type="button"
            onClick={handleSpeak}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isSpeaking 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Leer guion con sintetizador de voz"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
            <span>{isSpeaking ? 'Detener Audio' : 'Escuchar Guion'}</span>
          </button>

          {/* Botón Copiar Texto */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copiar texto al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* ── CUADRO DESTACADO DEL GUION ── */}
      <div className="bg-[#12172a] border border-purple-500/30 rounded-xl p-5 sm:p-6 shadow-inner relative">
        <span className="absolute top-2.5 right-3 text-[10px] font-mono uppercase text-purple-400/60 font-bold">
          Lectura Verbal Obligatoria
        </span>
        <blockquote className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed italic pr-4">
          &ldquo;{clinicalScript}&rdquo;
        </blockquote>
      </div>

      {/* ── LISTA DE VERIFICACIÓN CONDUCTUAL PREVIA ── */}
      <div className="mt-5 pt-4 border-t border-white/10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          Verificación de Condiciones Estandarizadas de Evaluación:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {[
            { id: 'posture', label: 'Postura sedente ergonómica (codos sobre la mesa).' },
            { id: 'grip', label: 'Agarre bimanual neutro del cubo inteligente.' },
            { id: 'environment', label: 'Iluminación adecuada y ausencia de reflejos en pantalla.' },
            { id: 'comprehension', label: 'El participante verbalizó haber entendido las instrucciones.' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleCheck(item.id)}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                completedChecks[item.id]
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                completedChecks[item.id]
                  ? 'bg-emerald-500 border-emerald-400 text-black'
                  : 'border-white/20 bg-black/40'
              }`}>
                {completedChecks[item.id] && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-[11px]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
