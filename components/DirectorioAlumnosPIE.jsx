'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, School, Plus, Search, ChevronRight, ArrowLeft,
  Brain, ShieldCheck, CheckCircle2, GraduationCap, X, ChevronDown
} from 'lucide-react';
import FichaEstudiantePIE from './FichaEstudiantePIE';

export default function DirectorioAlumnosPIE({ 
  students = [], 
  cursos = [], 
  loading = false, 
  isDark = true,
  onCreateStudent,
  initialCurso = null,
  initialStudentId = null
}) {
  const router = useRouter();

  // Ficha de alumno seleccionada para ver in-situ
  const [selectedStudentForFicha, setSelectedStudentForFicha] = useState(null);

  useEffect(() => {
    if (initialStudentId && students && students.length > 0) {
      const queryId = String(initialStudentId).trim();
      const found = students.find(s => 
        String(s.id).trim() === queryId || 
        (s.idSujeto && String(s.idSujeto).trim().toLowerCase() === queryId.toLowerCase())
      );
      if (found) {
        setSelectedStudentForFicha(found);
      }
    }
  }, [initialStudentId, students]);

  // Viñetas: 'cursos' | 'todos'
  const [activeTab, setActiveTab] = useState('cursos');

  // Estado de navegación por Grados y Letras:
  // null = Viendo la cuadrícula de tarjetas de grados
  // string (ej: '1° Básico') = Viendo el grado seleccionado
  const [selectedGrado, setSelectedGrado] = useState(null);
  const [selectedLetra, setSelectedLetra] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipoNee, setFilterTipoNee] = useState('ALL'); // 'ALL' | 'NEET' | 'NEEP'

  // Modal para agregar alumno
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formIdSujeto, setFormIdSujeto] = useState('');
  const [formNivel, setFormNivel] = useState('1° Básico');
  const [formLetra, setFormLetra] = useState('A');
  const [formTipoNee, setFormTipoNee] = useState('NEET');
  const [formDiag, setFormDiag] = useState('TDAH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones diagnósticas compactas
  const diagOptions = {
    NEET: ['TDAH', 'TDA', 'TEL Mixto', 'TEL Expresivo', 'DEA Dislexia', 'DEA Discalculia', 'FIL'],
    NEEP: ['TEA (Ley 21.545)', 'Discapacidad Intelectual Leve', 'Discapacidad Intelectual Moderada', 'Discapacidad Motora', 'Discapacidad Visual/Auditiva', 'Multidéficit']
  };

  // 1. Agrupar dinámicamente SOLO los grados que tienen alumnos registrados
  const activeGradosMap = useMemo(() => {
    const map = {};

    students.forEach(s => {
      let nivel = s.cursoNivel;
      let letra = s.cursoLetra || 'A';

      if (!nivel && s.cursoNombre) {
        const parts = s.cursoNombre.trim().split(' ');
        const lastPart = parts[parts.length - 1];
        if (['A', 'B', 'C', 'D'].includes(lastPart)) {
          letra = lastPart;
          nivel = parts.slice(0, parts.length - 1).join(' ');
        } else {
          nivel = s.cursoNombre;
        }
      }

      // Si no tiene curso asignado
      if (!nivel || nivel === 'Sin Nivel' || nivel === 'Sin Asignar') {
        nivel = '1° Básico';
        letra = 'A';
      }

      if (!map[nivel]) {
        map[nivel] = {
          nombre: nivel,
          total: 0,
          neet: 0,
          neep: 0,
          letrasMap: {}
        };
      }

      if (!map[nivel].letrasMap[letra]) {
        map[nivel].letrasMap[letra] = {
          letra,
          nombreCompleto: `${nivel} ${letra}`,
          total: 0,
          neet: 0,
          neep: 0,
          students: []
        };
      }

      const isNeep = s.tipoNee === 'NEEP' || /permanente|neep|tea|autis|intelectual|motora/i.test(s.diagnosticoNee || '');
      
      map[nivel].total += 1;
      map[nivel].letrasMap[letra].total += 1;
      if (isNeep) {
        map[nivel].neep += 1;
        map[nivel].letrasMap[letra].neep += 1;
      } else {
        map[nivel].neet += 1;
        map[nivel].letrasMap[letra].neet += 1;
      }
      map[nivel].letrasMap[letra].students.push(s);
    });

    return map;
  }, [students]);

  // Lista de grados activos (SOLO aquellos con al menos 1 alumno)
  const activeGradosList = useMemo(() => {
    return Object.values(activeGradosMap).sort((a, b) => {
      // Orden escolar natural
      const order = ['Pre-Kínder', 'Kínder', '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico', '1° Medio', '2° Medio', '3° Medio', '4° Medio'];
      const idxA = order.indexOf(a.nombre);
      const idxB = order.indexOf(b.nombre);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [activeGradosMap]);

  // Cuando el usuario hace click en una tarjeta de Grado
  const handleSelectGradoCard = (gradoNombre) => {
    setSelectedGrado(gradoNombre);
    const gradoData = activeGradosMap[gradoNombre];
    if (gradoData) {
      const letras = Object.keys(gradoData.letrasMap).sort();
      setSelectedLetra(letras[0] || 'A');
    }
  };

  // Alumnos del Grado y Letra actualmente seleccionados
  const currentStudentsInRoom = useMemo(() => {
    if (!selectedGrado) return [];
    const gradoData = activeGradosMap[selectedGrado];
    if (!gradoData) return [];
    const room = gradoData.letrasMap[selectedLetra];
    if (!room) return [];

    let list = room.students;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.idSujeto && s.idSujeto.toLowerCase().includes(q)) ||
        (s.diagnosticoNee && s.diagnosticoNee.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedGrado, selectedLetra, activeGradosMap, searchQuery]);

  // Datos de la sala actual (cupos)
  const currentRoomData = useMemo(() => {
    if (!selectedGrado || !selectedLetra) return null;
    return activeGradosMap[selectedGrado]?.letrasMap[selectedLetra] || null;
  }, [selectedGrado, selectedLetra, activeGradosMap]);

  // Alumnos filtrados para pestaña "Todos"
  const allStudentsFiltered = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !searchQuery.trim() || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.idSujeto && s.idSujeto.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.cursoNombre && s.cursoNombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.diagnosticoNee && s.diagnosticoNee.toLowerCase().includes(searchQuery.toLowerCase()));

      const isNeep = s.tipoNee === 'NEEP' || /permanente|neep|tea|autis|intelectual|motora/i.test(s.diagnosticoNee || '');
      const matchTipo = 
        filterTipoNee === 'ALL' ? true :
        filterTipoNee === 'NEEP' ? isNeep :
        !isNeep;

      return matchSearch && matchTipo;
    });
  }, [students, searchQuery, filterTipoNee]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsSubmitting(true);
    try {
      const diagFinal = `${formDiag} (${formTipoNee === 'NEEP' ? 'Permanente - NEEP' : 'Transitorio - NEET'})`;
      const cursoNombre = `${formNivel} ${formLetra}`;

      const targetCurso = cursos.find(c => 
        (c.nombre_completo === cursoNombre) || 
        (c.nivel === formNivel && c.letra === formLetra)
      );

      if (onCreateStudent) {
        await onCreateStudent({
          name: formName.trim(),
          idSujeto: formIdSujeto.trim() || null,
          diagnosticoNee: diagFinal,
          cursoId: targetCurso?.id || null,
          cursoNombre,
          cursoNivel: formNivel,
          cursoLetra: formLetra
        });
      }

      setFormName('');
      setFormIdSujeto('');
      setShowAddModal(false);
      setSelectedGrado(formNivel);
      setSelectedLetra(formLetra);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si hay un alumno seleccionado para ver su ficha, renderizarla in-situ sin salir del Dashboard
  if (selectedStudentForFicha) {
    return (
      <FichaEstudiantePIE
        student={selectedStudentForFicha}
        onBack={() => setSelectedStudentForFicha(null)}
        isDark={isDark}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      
      {/* ── BARRA SUPERIOR COMPACTA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Directorio de Estudiantes PIE
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión escolar organizada por cursos con alumnos activos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Píldoras de Viñetas */}
          <div className={`flex p-1 rounded-xl border ${
            isDark ? 'bg-[#151926] border-[#222736]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => { setActiveTab('cursos'); setSelectedGrado(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'cursos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Cursos ({activeGradosList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'todos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Todos ({students.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Alumno</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          VIÑETA 1: EXPLORADOR POR CURSOS (EN TARJETAS / CARDS)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cursos' && (
        <div className="flex flex-col gap-4">

          {/* VISTA A: CUADRÍCULA DE TARJETAS DE GRADOS (SI NO HAY GRADO SELECCIONADO) */}
          {!selectedGrado ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                  Selecciona un curso para ver sus estudiantes:
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {activeGradosList.length} grados activos con matrícula
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-slate-500 text-xs animate-pulse">
                  Cargando cursos con alumnos...
                </div>
              ) : activeGradosList.length === 0 ? (
                <div className={`p-10 rounded-2xl border text-center ${
                  isDark ? 'bg-[#131722] border-[#1e2433]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className="text-sm font-bold text-slate-300">No hay cursos con alumnos registrados aún.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    Registrar Primer Alumno
                  </button>
                </div>
              ) : (
                /* Grid de Tarjetas de Grados */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeGradosList.map((grado) => {
                    const letrasKeys = Object.keys(grado.letrasMap).sort();
                    const hasMultiple = letrasKeys.length > 1;

                    return (
                      <div
                        key={grado.nombre}
                        onClick={() => handleSelectGradoCard(grado.nombre)}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group hover:scale-[1.02] ${
                          isDark 
                            ? 'bg-[#131722] border-[#1e2433] hover:border-blue-500/50 hover:bg-[#161b29]' 
                            : 'bg-white border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md'
                        }`}
                      >
                        <div>
                          {/* Cabecera Tarjeta: Icono + Título del Grado */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
                              {grado.total} {grado.total === 1 ? 'alumno' : 'alumnos'}
                            </span>
                          </div>

                          <h4 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {grado.nombre}
                          </h4>

                          {/* Indicador de si hay más de un curso / paralelo */}
                          <p className="text-xs text-slate-400 mt-1">
                            {hasMultiple 
                              ? `${letrasKeys.length} cursos (${letrasKeys.map(l => `${grado.nombre} ${l}`).join(', ')})`
                              : `Curso ${letrasKeys[0] || 'A'}`}
                          </p>
                        </div>

                        {/* Footer Tarjeta: Desglose NEET/NEEP + Flecha */}
                        <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                          isDark ? 'border-white/5' : 'border-slate-100'
                        }`}>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono">
                            <span className="text-emerald-400 font-bold">{grado.neet} NEET</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-purple-400 font-bold">{grado.neep} NEEP</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* VISTA B: DETALLE DEL GRADO SELECCIONADO (CON SELECTOR DE LETRAS Y LISTA) */
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              
              {/* Botón Volver + Título del Grado */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedGrado(null)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a Cursos</span>
                  </button>

                  <h4 className="text-lg font-black text-white">
                    {selectedGrado}
                  </h4>
                </div>

                {/* Buscador interno del curso */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar en este curso..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none border ${
                      isDark ? 'bg-[#151926] border-[#222736] text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Selector de Letra (A, B, C...) si hay cursos */}
              {activeGradosMap[selectedGrado] && (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDark ? 'bg-[#131722] border-[#1e2433]' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 mr-1">Seleccionar Sala / Letra:</span>
                    {Object.keys(activeGradosMap[selectedGrado].letrasMap).sort().map(letra => {
                      const room = activeGradosMap[selectedGrado].letrasMap[letra];
                      const isSelected = selectedLetra === letra;
                      return (
                        <button
                          key={letra}
                          onClick={() => setSelectedLetra(letra)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                              : isDark 
                                ? 'bg-[#181b26] text-slate-300 border-[#262c3e] hover:bg-[#202538]' 
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span>Sala {letra}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isSelected ? 'bg-white/20' : 'bg-black/20 text-slate-400'
                          }`}>
                            {room.total}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Medidor Compacto de Cupos PIE */}
                  {currentRoomData && (
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-emerald-400 font-bold">
                        NEET: {currentRoomData.neet}/5
                      </span>
                      <span className="text-purple-400 font-bold">
                        NEEP: {currentRoomData.neep}/2
                      </span>
                      <span className="text-slate-400">
                        Total: {currentRoomData.total}/7 máx
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Grid de Alumnos de la Letra Seleccionada */}
              {currentStudentsInRoom.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No hay estudiantes que coincidan con la búsqueda en {selectedGrado} {selectedLetra}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentStudentsInRoom.map((student) => {
                    const isNeep = student.tipoNee === 'NEEP' || /permanente|neep|tea|autis|intelectual|motora/i.test(student.diagnosticoNee || '');
                    const testCount = student.sessions?.length || 0;

                    return (
                      <div
                        key={student.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between transition-all group hover:border-blue-500/40 ${
                          isDark ? 'bg-[#151926] border-[#202538]' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h5 className={`font-bold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {student.name}
                                </h5>
                                <p className="text-[10px] font-mono text-slate-400">
                                  {student.idSujeto || 'Local'}
                                </p>
                              </div>
                            </div>

                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              isNeep 
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {isNeep ? 'NEEP' : 'NEET'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-2 truncate bg-black/20 p-1.5 rounded-lg">
                            {student.diagnosticoNee || 'Sin diagnóstico asignado'}
                          </p>
                        </div>

                        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
                          isDark ? 'border-white/5' : 'border-slate-100'
                        }`}>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {testCount} {testCount === 1 ? 'test' : 'tests'}
                          </span>
                          <button
                            onClick={() => setSelectedStudentForFicha(student)}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-all"
                          >
                            <span>Ver Ficha</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIÑETA 2: LISTA DE TODOS LOS ALUMNOS (VISTA GLOBAL COMPACTA)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'todos' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          
          {/* Barra de Filtros de la Lista Global */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterTipoNee('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTipoNee === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : isDark ? 'bg-[#181b26] text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Todos ({students.length})
              </button>
              <button
                onClick={() => setFilterTipoNee('NEET')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTipoNee === 'NEET'
                    ? 'bg-emerald-600 text-white'
                    : isDark ? 'bg-[#181b26] text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Solo NEET
              </button>
              <button
                onClick={() => setFilterTipoNee('NEEP')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTipoNee === 'NEEP'
                    ? 'bg-purple-600 text-white'
                    : isDark ? 'bg-[#181b26] text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Solo NEEP
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o curso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none border ${
                  isDark ? 'bg-[#151926] border-[#222736] text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Grid de Todos los Alumnos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allStudentsFiltered.map((student) => {
              const isNeep = student.tipoNee === 'NEEP' || /permanente|neep|tea|autis|intelectual|motora/i.test(student.diagnosticoNee || '');
              const testCount = student.sessions?.length || 0;

              return (
                <div
                  key={student.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark ? 'bg-[#151926] border-[#202538]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h5 className={`font-bold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {student.name}
                          </h5>
                          <p className="text-[10px] text-blue-400 font-bold">
                            {student.cursoNombre || '1° Básico A'}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        isNeep 
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {isNeep ? 'NEEP' : 'NEET'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 truncate bg-black/20 p-1.5 rounded-lg">
                      {student.diagnosticoNee || 'Sin diagnóstico asignado'}
                    </p>
                  </div>

                  <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
                    isDark ? 'border-white/5' : 'border-slate-100'
                  }`}>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {testCount} {testCount === 1 ? 'test' : 'tests'}
                    </span>
                    <button
                      onClick={() => setSelectedStudentForFicha(student)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-all"
                    >
                      <span>Ver Ficha</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL REGISTRAR ALUMNO (SIMPLE Y RÁPIDO)
         ══════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
            isDark ? 'bg-[#121622] border-[#222736] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="font-bold text-sm">Registrar Nuevo Alumno PIE</h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Camila Soto"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#181b26] border-[#262c3e] text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">RUT o Código (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: 24.123.456-7"
                  value={formIdSujeto}
                  onChange={(e) => setFormIdSujeto(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#181b26] border-[#262c3e] text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Grado *</label>
                  <select
                    value={formNivel}
                    onChange={(e) => setFormNivel(e.target.value)}
                    className={`w-full p-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#181b26] border-[#262c3e] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {['1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico', '1° Medio', '2° Medio', '3° Medio', '4° Medio', 'Kínder', 'Pre-Kínder'].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Letra *</label>
                  <select
                    value={formLetra}
                    onChange={(e) => setFormLetra(e.target.value)}
                    className={`w-full p-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#181b26] border-[#262c3e] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {['A', 'B', 'C'].map(l => (
                      <option key={l} value={l}>Sala {l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Tipo NEE *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setFormTipoNee('NEET'); setFormDiag(diagOptions.NEET[0]); }}
                    className={`p-2 rounded-xl border text-xs font-bold ${
                      formTipoNee === 'NEET'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : isDark ? 'bg-[#181b26] border-[#262c3e] text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    NEET (Transitorio)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormTipoNee('NEEP'); setFormDiag(diagOptions.NEEP[0]); }}
                    className={`p-2 rounded-xl border text-xs font-bold ${
                      formTipoNee === 'NEEP'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : isDark ? 'bg-[#181b26] border-[#262c3e] text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    NEEP (Permanente)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Diagnóstico *</label>
                <select
                  value={formDiag}
                  onChange={(e) => setFormDiag(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#181b26] border-[#262c3e] text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {diagOptions[formTipoNee].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
