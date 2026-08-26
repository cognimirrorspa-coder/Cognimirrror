'use client';

import React, { useState, useMemo } from 'react';
import { User, Calendar, GraduationCap, Brain, ShieldCheck, Clock, Check } from 'lucide-react';

/**
 * Calcula la edad clínica exacta en años, meses y días a partir de la fecha de nacimiento.
 * Ej: "11 años, 4 meses, 12 días"
 */
export function calculateClinicalAge(dobString) {
  if (!dobString) return '';
  const dob = new Date(dobString + 'T00:00:00');
  if (isNaN(dob.getTime())) return '';

  const today = new Date();
  if (dob > today) return 'Fecha futura no válida';

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    // Días del mes anterior
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) return 'Fecha inválida';

  const yearLabel = years === 1 ? 'año' : 'años';
  const monthLabel = months === 1 ? 'mes' : 'meses';
  const dayLabel = days === 1 ? 'día' : 'días';

  return `${years} ${yearLabel}, ${months} ${monthLabel}, ${days} ${dayLabel}`;
}

const PIE_CONDITIONS = [
  { value: 'Ninguna', label: 'Ninguna / Sin Diagnóstico PIE' },
  { value: 'TDAH', label: 'TDAH (Déficit Atencional con/sin Hiperactividad)' },
  { value: 'TEA', label: 'TEA (Trastorno del Espectro Autista)' },
  { value: 'FIL', label: 'FIL (Funcionamiento Intelectual Limítrofe)' },
  { value: 'DEA', label: 'DEA (Dificultades Específicas del Aprendizaje)' },
  { value: 'TEL', label: 'TEL (Trastorno Específico del Lenguaje)' },
  { value: 'Otra', label: 'Otra Condición NEE' }
];

const GRADE_OPTIONS = [
  '1° Básico', '2° Básico', '3° Básico', '4° Básico',
  '5° Básico', '6° Básico', '7° Básico', '8° Básico',
  '1° Medio', '2° Medio', '3° Medio', '4° Medio',
  'Educación Parvularia / Pre-kínder'
];

export default function PatientRegistrationForm({ onSubmit, onCancel, isSubmitting = false }) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [condition, setCondition] = useState('Ninguna');
  const [grade, setGrade] = useState('5° Básico');
  const [section, setSection] = useState('A');
  const [customSubjectId, setCustomSubjectId] = useState('');

  // Cálculo de edad clínica en vivo
  const clinicalAge = useMemo(() => calculateClinicalAge(dob), [dob]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const fullGrade = `${grade} ${section.trim() ? section.trim().toUpperCase() : ''}`.trim();
    const generatedId = customSubjectId.trim() || `SUJ-${Date.now().toString().slice(-6)}`;

    const patientData = {
      name: name.trim(),
      fechaNacimiento: dob || null,
      edadClinica: clinicalAge || null,
      diagnosticoNee: condition,
      curso: fullGrade,
      idSujeto: generatedId
    };

    if (onSubmit) {
      onSubmit(patientData);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* Encabezado Enterprise */}
      <div className="border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>REGISTRO CLÍNICO DE ESTUDIANTE</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Ficha de Ingreso Programa PIE
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Ingresa los datos estandarizados del alumno para habilitar las evaluaciones de funciones ejecutivas y telemetría visomotora.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Campo 1: Nombre Completo */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Nombre Completo del Estudiante <span className="text-indigo-600">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. Mateo Silva Gómez"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Campo 2: Fecha de Nacimiento + Edad Clínica en Vivo */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
          <div className="sm:col-span-7">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Fecha de Nacimiento <span className="text-indigo-600">*</span>
            </label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Renderizado en Vivo de Edad Clínica */}
          <div className="sm:col-span-5 pt-0.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Edad Cronológica Exacta
            </label>
            <div className={`p-2.5 rounded-lg border text-xs font-mono transition-all min-h-[42px] flex items-center justify-center text-center ${
              clinicalAge
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400 italic font-sans'
            }`}>
              {clinicalAge || 'Selecciona fecha'}
            </div>
          </div>
        </div>

        {/* Campo 3: Condición / Neurodivergencia PIE */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-slate-400" />
            Condición / Diagnóstico NEE (PIE)
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
          >
            {PIE_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campo 4: Curso y Sección */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              Nivel Académico / Curso
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Sección / Letra
            </label>
            <input
              type="text"
              maxLength={4}
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="ej. A"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-mono uppercase text-center"
            />
          </div>
        </div>

        {/* Opcional: ID Código Sujeto */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Código Único / ID Sujeto (Opcional)</span>
            <span className="text-[10px] text-slate-400 font-mono">Auto-generado si se omite</span>
          </label>
          <input
            type="text"
            value={customSubjectId}
            onChange={(e) => setCustomSubjectId(e.target.value)}
            placeholder="ej. SUJ-2026-05"
            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-mono"
          />
        </div>

        {/* Acciones del Formulario */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando...' : 'Registrar Estudiante'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
