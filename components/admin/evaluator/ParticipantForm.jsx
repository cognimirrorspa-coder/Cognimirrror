'use client';

import React from 'react';
import { 
  User, 
  Coffee, 
  Moon, 
  Smile, 
  ShieldAlert, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Award
} from 'lucide-react';

export default function ParticipantForm({ formData, onChange, onNext, isLocked = false }) {
  const [errors, setErrors] = React.useState({});

  const validateAndProceed = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.codigoParticipante || formData.codigoParticipante.trim().length < 2) {
      newErrors.codigoParticipante = 'El código de participante es obligatorio (ej: P01, VAL-01).';
    }

    if (!formData.edad || formData.edad < 5 || formData.edad > 100) {
      newErrors.edad = 'Ingresa una edad válida (entre 5 y 100 años).';
    }

    if (!formData.sexo) {
      newErrors.sexo = 'Selecciona el sexo biológico o género.';
    }

    if (!formData.manoDominante) {
      newErrors.manoDominante = 'Selecciona la lateralidad manual dominante.';
    }

    if (!formData.experienciaRubik) {
      newErrors.experienciaRubik = 'Indica si ha armado un cubo Rubik anteriormente.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const scaleLabels = {
    sueno: {
      1: 'Muy malo / Insomnio',
      2: 'Malo / Interrumpido',
      3: 'Regular',
      4: 'Bueno',
      5: 'Reparador / Excelente'
    },
    animo: {
      1: 'Apático / Desmotivado',
      2: 'Bajo ánimo',
      3: 'Neutro',
      4: 'Receptivo / Dispuesto',
      5: 'Muy motivado / Entusiasta'
    },
    frustracion: {
      1: 'Muy baja / Se rinde rápido',
      2: 'Baja',
      3: 'Media',
      4: 'Buena',
      5: 'Alta / Gran perseverancia'
    }
  };

  return (
    <form onSubmit={validateAndProceed} className="space-y-8 animate-in fade-in duration-300">
      {/* ── SECCIÓN 1: IDENTIFICACIÓN Y DEMOGRAFÍA ── */}
      <div className="bg-[#0c101a]/90 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
              1. Identificación y Datos Demográficos
            </h3>
            <p className="text-xs text-slate-400">
              Registro del sujeto bajo protocolo de validación clínica (n=10) y resguardo de anonimato.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Código de Participante */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Código Sujeto</span>
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={isLocked}
                placeholder="Ej: P01 o VAL-01"
                value={formData.codigoParticipante || ''}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  onChange('codigoParticipante', val);
                  if (errors.codigoParticipante) setErrors(prev => ({ ...prev, codigoParticipante: null }));
                }}
                className={`w-full bg-[#121726] border ${
                  errors.codigoParticipante ? 'border-rose-500/80 focus:border-rose-400' : 'border-white/15 focus:border-purple-500'
                } rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold uppercase tracking-wider placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
              />
            </div>
            {errors.codigoParticipante && (
              <p className="text-[11px] font-medium text-rose-400">{errors.codigoParticipante}</p>
            )}
          </div>

          {/* Edad */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Edad</span>
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="100"
                disabled={isLocked}
                placeholder="18"
                value={formData.edad || ''}
                onChange={(e) => {
                  onChange('edad', e.target.value ? parseInt(e.target.value, 10) : '');
                  if (errors.edad) setErrors(prev => ({ ...prev, edad: null }));
                }}
                className={`w-full bg-[#121726] border ${
                  errors.edad ? 'border-rose-500/80' : 'border-white/15 focus:border-purple-500'
                } rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
              />
            </div>
            {errors.edad && (
              <p className="text-[11px] font-medium text-rose-400">{errors.edad}</p>
            )}
          </div>

          {/* Sexo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Sexo Biológico / Género</span>
              <span className="text-rose-400">*</span>
            </label>
            <select
              disabled={isLocked}
              value={formData.sexo || ''}
              onChange={(e) => {
                onChange('sexo', e.target.value);
                if (errors.sexo) setErrors(prev => ({ ...prev, sexo: null }));
              }}
              className={`w-full bg-[#121726] border ${
                errors.sexo ? 'border-rose-500/80' : 'border-white/15 focus:border-purple-500'
              } rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer`}
            >
              <option value="" disabled>Selecciona opción...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro / No binario</option>
              <option value="Prefiero no decir">Prefiero no especificar</option>
            </select>
            {errors.sexo && (
              <p className="text-[11px] font-medium text-rose-400">{errors.sexo}</p>
            )}
          </div>

          {/* Mano dominante */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Lateralidad Dominante</span>
              <span className="text-rose-400">*</span>
            </label>
            <select
              disabled={isLocked}
              value={formData.manoDominante || ''}
              onChange={(e) => {
                onChange('manoDominante', e.target.value);
                if (errors.manoDominante) setErrors(prev => ({ ...prev, manoDominante: null }));
              }}
              className={`w-full bg-[#121726] border ${
                errors.manoDominante ? 'border-rose-500/80' : 'border-white/15 focus:border-purple-500'
              } rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer`}
            >
              <option value="" disabled>Selecciona mano...</option>
              <option value="Derecha">Diestro (Mano Derecha)</option>
              <option value="Izquierda">Zurdo (Mano Izquierda)</option>
              <option value="Ambidiestro">Ambidiestro</option>
            </select>
            {errors.manoDominante && (
              <p className="text-[11px] font-medium text-rose-400">{errors.manoDominante}</p>
            )}
          </div>
        </div>

        {/* ¿Ha armado un cubo Rubik antes? */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>¿Ha armado un cubo Rubik con anterioridad? (Experiencia previa)</span>
            <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'Nunca', label: 'Nunca', desc: 'Nunca ha resuelto un cubo ni conoce los giros.' },
              { id: 'Principiante', label: 'Principiante', desc: 'Sabe armar 1 o 2 caras de forma intuitiva.' },
              { id: 'Intermedio', label: 'Intermedio', desc: 'Arma el cubo completo con método básico.' },
              { id: 'Avanzado', label: 'Avanzado / Speedcuber', desc: 'Arma en < 60s con algoritmos avanzados.' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                disabled={isLocked}
                onClick={() => {
                  onChange('experienciaRubik', item.id);
                  if (errors.experienciaRubik) setErrors(prev => ({ ...prev, experienciaRubik: null }));
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.experienciaRubik === item.id
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-[#121726]/60 border-white/10 text-slate-300 hover:border-white/20 hover:bg-[#121726]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{item.label}</span>
                  {formData.experienciaRubik === item.id && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
              </button>
            ))}
          </div>
          {errors.experienciaRubik && (
            <p className="text-[11px] font-medium text-rose-400 mt-2">{errors.experienciaRubik}</p>
          )}
        </div>
      </div>

      {/* ── SECCIÓN 2: CHECK-IN CONTEXTUAL ESCOLAR ── */}
      <div className="bg-[#0c101a]/90 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
              2. Check-in Contextual y Estado Psico-Fisiológico
            </h3>
            <p className="text-xs text-slate-400">
              Variables externas estandarizadas para controlar sesgos de fatiga, nutrición y disposición.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Desayunó hoy */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                ¿Desayunó antes de la prueba?
              </span>
              <p className="text-[11px] text-slate-400">
                La hipoglucemia matutina incrementa significativamente la variabilidad del tiempo de reacción.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => onChange('desayuno', true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formData.desayuno === true
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                }`}
              >
                Sí (Nutrido)
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => onChange('desayuno', false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formData.desayuno === false
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                }`}
              >
                No (Ayuno)
              </button>
            </div>
          </div>

          {/* Calidad de Sueño Anoche (1 a 5) */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                Calidad de Sueño Anoche
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {formData.calidadSueno ? `${formData.calidadSueno}/5 · ${scaleLabels.sueno[formData.calidadSueno]}` : 'Sin evaluar'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onChange('calidadSueno', num)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    formData.calidadSueno === num
                      ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Disposición y Ánimo Inicial (1 a 5) */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Smile className="w-4 h-4 text-emerald-400" />
                Disposición / Ánimo Inicial
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {formData.animoInicial ? `${formData.animoInicial}/5 · ${scaleLabels.animo[formData.animoInicial]}` : 'Sin evaluar'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onChange('animoInicial', num)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    formData.animoInicial === num
                      ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-emerald-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Tolerancia a la Frustración Basal (1 a 5) */}
          <div className="bg-[#121726]/70 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Tolerancia a la Frustración Basal
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {formData.toleranciaFrustracion ? `${formData.toleranciaFrustracion}/5 · ${scaleLabels.frustracion[formData.toleranciaFrustracion]}` : 'Sin evaluar'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onChange('toleranciaFrustracion', num)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    formData.toleranciaFrustracion === num
                      ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)] border border-amber-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Observaciones Cualitativas Iniciales */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Observaciones Cualitativas Iniciales del Evaluador (Opcional)</span>
          </label>
          <textarea
            rows={3}
            disabled={isLocked}
            placeholder="Anota cualquier particularidad observable: usa lentes ópticos, inquietud motriz leve, temblores en dedos, medicación reportada (ej: metilfenidato), nivel de familiaridad con el examinador..."
            value={formData.observacionesIniciales || ''}
            onChange={(e) => onChange('observacionesIniciales', e.target.value)}
            className="w-full bg-[#121726] border border-white/15 focus:border-purple-500 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* ── BOTÓN DE AVANCE ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Los datos quedarán vinculados a la telemetría del protocolo n=10.</span>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continuar a Verificación Técnica</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
