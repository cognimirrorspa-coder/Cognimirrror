'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PatientRegistrationForm from './PatientRegistrationForm';
import {
  UserPlus, CheckCircle2,
  Search, ArrowRight, User, ChevronDown, X
} from 'lucide-react';

const getCourse = (s) => {
  if (!s) return '1° Básico A';
  return s.cursoNombre || s.curso || (s.cursoNivel && s.cursoLetra ? `${s.cursoNivel} ${s.cursoLetra}` : s.cursoNivel) || '1° Básico A';
};

export default function StudentSelector({
  patients: students = [],
  activePatientId,
  onSelect,
  onCreate
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('Todos');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedStudent = useMemo(() => {
    return (students || []).find(s => s.id === activePatientId) || null;
  }, [students, activePatientId]);

  const availableCourses = useMemo(() => {
    const set = new Set();
    (students || []).forEach(s => {
      const c = getCourse(s);
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s => {
      const stCourse = getCourse(s);
      const matchCourse = selectedCourseFilter === 'Todos' || stCourse === selectedCourseFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = q === '' ||
        s.name.toLowerCase().includes(q) ||
        (s.diagnosticoNee && s.diagnosticoNee.toLowerCase().includes(q)) ||
        stCourse.toLowerCase().includes(q) ||
        (s.idSujeto && s.idSujeto.toLowerCase().includes(q));
      return matchCourse && matchSearch;
    });
  }, [students, selectedCourseFilter, searchQuery]);

  const nextStudentInCourse = useMemo(() => {
    if (!selectedStudent || !students) return null;
    const curCourse = getCourse(selectedStudent);
    const courseStudents = students.filter(s => getCourse(s) === curCourse);
    const curIdx = courseStudents.findIndex(s => s.id === selectedStudent.id);
    if (curIdx >= 0 && curIdx < courseStudents.length - 1) return courseStudents[curIdx + 1];
    const otherStudents = students.filter(s => getCourse(s) !== curCourse);
    return otherStudents[0] || null;
  }, [selectedStudent, students]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  const handleSelect = (student) => {
    onSelect(student.id);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCourseFilter('Todos');
  };

  const handleFormSubmit = async (patientData) => {
    if (onCreate) await onCreate(patientData);
    setIsCreating(false);
    setIsOpen(false);
  };

  if (isCreating) {
    return (
      <motion.div
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
    );
  }

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-2 relative z-20 font-sans">

      {/* TRIGGER */}
      <button
        type="button"
        onClick={() => { setIsOpen(v => !v); setSearchQuery(''); }}
        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
          selectedStudent
            ? 'bg-blue-950/40 border-blue-500/50 hover:border-blue-400/70 shadow-lg shadow-blue-950/30'
            : 'bg-white/[0.04] border-white/15 hover:border-white/25 hover:bg-white/[0.06]'
        }`}
      >
        {selectedStudent ? (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-600/30 shrink-0">
            {selectedStudent.name.charAt(0)}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-400" />
          </div>
        )}

        <div className="flex-1 min-w-0 text-left">
          {selectedStudent ? (
            <>
              <div className="flex items-center gap-1.5 mb-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                  Estudiante Seleccionado
                </span>
              </div>
              <p className="text-sm font-black text-white truncate leading-tight">{selectedStudent.name}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                <span className="text-blue-300 font-semibold">{getCourse(selectedStudent)}</span>
                {selectedStudent.diagnosticoNee ? ` · ${selectedStudent.diagnosticoNee}` : ''}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-300">Seleccionar Estudiante</p>
              <p className="text-[10px] text-slate-500">
                {students.length > 0 ? `${students.length} alumnos disponibles` : 'Cargando alumnos...'}
              </p>
            </>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
          isOpen ? 'rotate-180 text-blue-400' : 'text-slate-500'
        }`} />
      </button>

      {/* DROPDOWN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0b0f1e] border border-white/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, curso o diagnóstico..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/70 transition-all"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {availableCourses.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-2 scrollbar-none text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedCourseFilter('Todos')}
                    className={`px-2.5 py-0.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                      selectedCourseFilter === 'Todos' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Todos ({students.length})
                  </button>
                  {availableCourses.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCourseFilter(c)}
                      className={`px-2.5 py-0.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                        selectedCourseFilter === c ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col max-h-52 overflow-y-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(s => {
                  const isCur = s.id === activePatientId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelect(s)}
                      className={`px-3 py-2.5 text-left transition-all cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 hover:bg-white/5 ${isCur ? 'bg-blue-600/15' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        isCur ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300'
                      }`}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{s.name}</p>
                          {isCur && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          <span className="text-blue-300 font-semibold">{getCourse(s)}</span>
                          {s.diagnosticoNee ? ` · ${s.diagnosticoNee}` : ''}
                          {s.idSujeto ? ` (${s.idSujeto})` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-slate-500 border border-white/10 shrink-0">
                        {s.sessions?.length || 0} ses.
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  {searchQuery ? 'Sin resultados para esa búsqueda' : 'No hay estudiantes registrados'}
                </div>
              )}
            </div>

            <div className="p-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setIsCreating(true); setIsOpen(false); }}
                className="w-full py-2 px-3 rounded-xl font-bold text-xs text-blue-400 hover:text-white hover:bg-blue-600/20 transition-all border border-blue-500/20 border-dashed cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrar Nuevo Estudiante (Ficha PIE)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Siguiente alumno rapido */}
      <AnimatePresence>
        {selectedStudent && nextStudentInCourse && !isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between gap-2 px-3.5 py-2 bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden"
          >
            <span className="text-[10px] text-slate-500">Siguiente a evaluar:</span>
            <button
              type="button"
              onClick={() => onSelect(nextStudentInCourse.id)}
              className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <span className="truncate max-w-[160px]">{nextStudentInCourse.name}</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
