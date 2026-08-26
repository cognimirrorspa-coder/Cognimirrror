import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PatientRegistrationForm from './PatientRegistrationForm';
import { UserPlus, ChevronDown, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';

export default function StudentSelector({ patients: students = [], activePatientId, onSelect, onCreate }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const selectedStudent = (students || []).find(s => s.id === activePatientId);

  const handleFormSubmit = async (patientData) => {
    if (onCreate) {
      await onCreate(patientData);
    }
    setIsCreating(false);
    setIsChanging(false);
  };

  const showSelector = !selectedStudent || isChanging;

  return (
    <div className="w-full flex flex-col gap-3 relative z-20">
      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div 
            key="create-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <PatientRegistrationForm
              onSubmit={handleFormSubmit}
              onCancel={() => setIsCreating(false)}
            />
          </motion.div>
        ) : !showSelector && selectedStudent ? (
          <motion.div
            key="selected-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full bg-indigo-950/40 border border-indigo-500/40 p-4 rounded-2xl flex items-center justify-between gap-3 text-left shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Estudiante Seleccionado
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {selectedStudent.name}
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                  {selectedStudent.diagnosticoNee || 'PIE General'} {selectedStudent.idSujeto ? `· ${selectedStudent.idSujeto}` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsChanging(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-white/10 shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Cambiar</span>
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="select"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-3"
          >
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onSelect(e.target.value);
                    setIsChanging(false);
                  }
                }}
                value={activePatientId || ""}
                className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white appearance-none cursor-pointer text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="" disabled className="text-gray-500 bg-gray-900">
                  {students.length > 0 ? 'Seleccionar Estudiante Existente...' : 'Cargando Estudiantes...'}
                </option>
                {students.map(s => (
                  <option key={s.id} value={s.id} className="bg-gray-900 text-white">
                    {s.name} {s.diagnosticoNee ? `(${s.diagnosticoNee})` : ''} · {s.sessions?.length || 0} sesiones
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-indigo-400 hover:text-white hover:bg-indigo-600/20 transition-all border border-indigo-500/30 border-dashed cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Nuevo Estudiante (Ficha PIE)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
