'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, X, School, Users, Box, Wifi, ShieldCheck, Download, 
  FileSpreadsheet, UserPlus, FileText, ArrowRight, Brain, 
  Activity, Layers, Sparkles, CheckCircle2, ChevronRight, Zap, Wand2,
  ClipboardCheck, HeartPulse
} from 'lucide-react';

export default function GlobalSearchBar({ 
  patients = [], 
  cursos = [], 
  onSelectTab, 
  isDark = true,
  onSelectStudent,
  onSelectCurso,
  onOpenSolver
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Módulos del sistema indexables para búsqueda
  const systemModules = useMemo(() => [
    {
      id: 'mod-checkin',
      type: 'modulo',
      title: 'Check-in Diario PIE (DAU)',
      category: 'Monitoreo Matutino',
      description: 'Checklist matutino de regulación emocional, medicación y estado de ánimo',
      icon: ClipboardCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      action: () => { onSelectTab?.('checkin'); setIsOpen(false); }
    },
    {
      id: 'mod-resumen',
      type: 'modulo',
      title: 'Dashboard Institucional',
      category: 'Módulo Principal',
      description: 'Métricas generales, KPIs del colegio y cumplimiento normativo',
      icon: School,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      action: () => { onSelectTab?.('resumen'); setIsOpen(false); }
    },
    {
      id: 'mod-alumnos',
      type: 'modulo',
      title: 'Directorio de Alumnos PIE',
      category: 'Gestión Escolar',
      description: 'Navegación por cursos, letras y control de cupos NEET / NEEP',
      icon: Users,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      action: () => { onSelectTab?.('alumnos'); setIsOpen(false); }
    },
    {
      id: 'mod-niveles',
      type: 'modulo',
      title: 'Batería de 5 Niveles',
      category: 'Evaluación',
      description: 'Protocolos de funciones ejecutivas y pruebas con Cubo Rubik',
      icon: Layers,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      action: () => { onSelectTab?.('niveles'); setIsOpen(false); }
    },
    {
      id: 'mod-gemelo',
      type: 'modulo',
      title: 'Gemelo Digital 3D',
      category: 'Telemetría',
      description: 'Monitoreo 3D en tiempo real de giros del cubo físico vía Bluetooth',
      icon: Box,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      action: () => { onSelectTab?.('gemelo'); setIsOpen(false); }
    },
    {
      id: 'mod-evaluador',
      type: 'modulo',
      title: 'Módulo Evaluador Founders',
      category: 'Investigación Clínica',
      description: 'Protocolo de validación n=10, captura de telemetría y event sourcing',
      icon: ShieldCheck,
      color: 'text-purple-300 bg-purple-500/15 border-purple-500/40',
      action: () => { router.push('/admin/evaluador'); setIsOpen(false); }
    },
    {
      id: 'mod-export',
      type: 'modulo',
      title: 'Reportes y Centro de Exportación',
      category: 'Informes Mineduc',
      description: 'Generación de informes clínicos, planillas Excel y resúmenes PIE',
      icon: FileSpreadsheet,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      action: () => { 
        if (onSelectTab) {
          onSelectTab('informes');
        } else {
          router.push('/dashboard?tab=informes');
        }
        setIsOpen(false); 
      }
    },
    {
      id: 'mod-solver',
      type: 'modulo',
      title: 'Ordenar y Armar Cubo (Kociemba)',
      category: 'Asistente de Hardware',
      description: 'Guía visual paso a paso para resolver el cubo desarmado',
      icon: Wand2,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      action: () => { 
        if (onOpenSolver) {
          onOpenSolver();
        } else if (onSelectTab) {
          onSelectTab('gemelo');
        } else {
          router.push('/dashboard?tab=gemelo');
        }
        setIsOpen(false); 
      }
    },
    {
      id: 'mod-remote',
      type: 'modulo',
      title: 'Evaluación Remota Tele-PIE',
      category: 'Atención a Distancia',
      description: 'Sesión telemática para estudiantes en aula hospitalaria o remoto',
      icon: Wifi,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      action: () => { router.push('/remote-eval?token=demo-token'); setIsOpen(false); }
    },
    {
      id: 'mod-usuarios',
      type: 'modulo',
      title: 'Gestión de Usuarios y Roles',
      category: 'Administración',
      description: 'Administración de directores, psicólogos y educadores PIE',
      icon: UserPlus,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      action: () => { onSelectTab?.('usuarios'); setIsOpen(false); }
    },
    {
      id: 'mod-auditoria',
      type: 'modulo',
      title: 'Auditoría y Trazabilidad',
      category: 'Seguridad y Cumplimiento',
      description: 'Logs inmutables de acciones docentes y cambios en fichas de alumnos',
      icon: FileText,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      action: () => { onSelectTab?.('auditoria'); setIsOpen(false); }
    },
    {
      id: 'mod-reaccion',
      type: 'modulo',
      title: 'Juego de Reacción (Go / No-Go)',
      category: 'Batería Lúdica',
      description: 'Evaluación de control inhibitorio y velocidad psicomotora',
      icon: Zap,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      action: () => { router.push('/reaction-game'); setIsOpen(false); }
    },
    {
      id: 'mod-memoria',
      type: 'modulo',
      title: 'Juego de Memoria (Corsi 3D)',
      category: 'Batería Lúdica',
      description: 'Evaluación de memoria de trabajo visoespacial secuencial',
      icon: Brain,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      action: () => { router.push('/simon-game'); setIsOpen(false); }
    }
  ], [onSelectTab, router]);

  // Lista unificada de cursos
  const courseList = useMemo(() => {
    // Si la BD tiene cursos, los usamos; si no, agrupamos por los que tengan los alumnos
    const list = [...cursos];
    if (list.length === 0) {
      const distinct = new Set(patients.map(p => p.cursoNombre).filter(Boolean));
      distinct.forEach(name => {
        const parts = name.split(' ');
        const letra = parts[parts.length - 1];
        const nivel = parts.slice(0, parts.length - 1).join(' ') || name;
        list.push({
          id: `c-${name}`,
          nombre_completo: name,
          nivel,
          letra,
          anio_academico: 2026
        });
      });
    }
    return list;
  }, [cursos, patients]);

  // Atajo de teclado global (Ctrl + K o Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Filtrado reactivo en 3 categorías
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Módulos
    const matchedModules = systemModules.filter(m => 
      !q || 
      m.title.toLowerCase().includes(q) || 
      m.description.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );

    // 2. Cursos
    const matchedCourses = courseList.filter(c => {
      if (!q) return true;
      const full = (c.nombre_completo || `${c.nivel || ''} ${c.letra || ''}`).toLowerCase();
      const nivel = (c.nivel || '').toLowerCase();
      const letra = (c.letra || '').toLowerCase();
      return full.includes(q) || nivel.includes(q) || (q.length === 1 && letra === q);
    }).map(c => {
      const cName = c.nombre_completo || `${c.nivel} ${c.letra}`;
      const count = patients.filter(p => p.cursoId === c.id || p.cursoNombre === cName).length;
      const countNeet = patients.filter(p => (p.cursoId === c.id || p.cursoNombre === cName) && p.tipoNee === 'NEET').length;
      const countNeep = patients.filter(p => (p.cursoId === c.id || p.cursoNombre === cName) && p.tipoNee === 'NEEP').length;
      return {
        ...c,
        displayName: cName,
        totalAlumnos: count,
        neet: countNeet,
        neep: countNeep
      };
    });

    // 3. Estudiantes
    const matchedStudents = patients.filter(p => {
      if (!q) return false; // si query vacía, no mostrar 50 alumnos de golpe
      const name = (p.name || '').toLowerCase();
      const idSuj = (p.idSujeto || '').toLowerCase();
      const diag = (p.diagnosticoNee || '').toLowerCase();
      const curso = (p.cursoNombre || '').toLowerCase();
      return name.includes(q) || idSuj.includes(q) || diag.includes(q) || curso.includes(q);
    });

    return {
      modules: matchedModules,
      courses: matchedCourses,
      students: matchedStudents
    };
  }, [query, systemModules, courseList, patients]);

  // Lista plana de resultados para navegación con teclado
  const flatItems = useMemo(() => {
    const items = [];
    filteredResults.modules.forEach(m => items.push({ type: 'module', item: m }));
    filteredResults.courses.forEach(c => items.push({ type: 'course', item: c }));
    filteredResults.students.forEach(s => items.push({ type: 'student', item: s }));
    return items;
  }, [filteredResults]);

  const handleSelectCourse = (c) => {
    setIsOpen(false);
    onSelectTab?.('alumnos');
    onSelectCurso?.(c);
  };

  const handleSelectStudentItem = (s) => {
    setIsOpen(false);
    if (onSelectStudent) {
      onSelectStudent(s);
    } else {
      router.push(`/dashboard?tab=alumnos&student=${s.id}`);
    }
  };

  const handleKeyDownNav = (e) => {
    if (flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatItems[selectedIndex];
      if (!current) return;
      if (current.type === 'module') current.item.action();
      if (current.type === 'course') handleSelectCourse(current.item);
      if (current.type === 'student') handleSelectStudentItem(current.item);
    }
  };

  return (
    <>
      {/* Botón Barra de Búsqueda Integrada en el Header */}
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full max-w-xs sm:max-w-sm md:max-w-md flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border text-xs transition-all cursor-pointer group ${
          isDark 
            ? 'bg-[#181b26]/90 border-[#222736] hover:border-blue-500/50 hover:bg-[#1d2230] text-slate-300' 
            : 'bg-slate-100/90 border-slate-200 hover:border-blue-300 hover:bg-slate-200/70 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Search className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
          <span className="truncate text-slate-400 group-hover:text-slate-200 font-medium">
            Buscar alumno, curso o módulo...
          </span>
        </div>
        <kbd className={`hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
          isDark 
            ? 'bg-[#222736] border-white/10 text-slate-400' 
            : 'bg-white border-slate-300 text-slate-500 shadow-xs'
        }`}>
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {/* Modal Overlay Flotante Tipo Command Palette */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          
          {/* Backdrop click to close */}
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          {/* Caja Flotante de Resultados */}
          <div 
            className={`relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden max-h-[82vh] transition-all z-10 ${
              isDark 
                ? 'bg-[#10131d] border-[#222736] text-white shadow-blue-950/40' 
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className={`p-4 border-b flex items-center gap-3 ${
              isDark ? 'border-[#1e2433] bg-[#141824]' : 'border-slate-200 bg-slate-50/70'
            }`}>
              <Search className="w-5 h-5 text-blue-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDownNav}
                placeholder="Escribe el nombre del alumno, curso (ej. 3° Básico A) o módulo (ej. reportes)..."
                className={`w-full bg-transparent border-none text-sm sm:text-base outline-none font-medium placeholder:text-slate-500 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-mono cursor-pointer border border-transparent hover:border-slate-700"
                >
                  ESC
                </button>
              )}
            </div>

            {/* Lista de Resultados con Scroll */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5 divide-y divide-white/5">
              
              {/* CATEGORÍA 1: ESTUDIANTES PIE ENCONTRADOS */}
              {filteredResults.students.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Estudiantes PIE ({filteredResults.students.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Nombre / Diagnóstico</span>
                  </div>
                  <div className="space-y-1">
                    {filteredResults.students.slice(0, 6).map((student) => {
                      const isNeep = student.tipoNee === 'NEEP';
                      return (
                        <div
                          key={student.id}
                          onClick={() => handleSelectStudentItem(student)}
                          className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                            isDark 
                              ? 'hover:bg-blue-600/10 hover:border-blue-500/30 border-transparent' 
                              : 'hover:bg-blue-50 hover:border-blue-200 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                              {student.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-bold truncate">{student.name}</h4>
                                {student.idSujeto && (
                                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.2 rounded border border-white/5">
                                    {student.idSujeto}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {student.cursoNombre} • {student.diagnosticoNee}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isNeep 
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {isNeep ? 'NEEP (Permanente)' : 'NEET (Transitorio)'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CATEGORÍA 2: CURSOS */}
              {filteredResults.courses.length > 0 && (
                <div className={filteredResults.students.length > 0 ? 'pt-4' : ''}>
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5" /> Cursos Mineduc ({filteredResults.courses.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Cupos reglamentarios Decreto 170</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredResults.courses.slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCourse(c)}
                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                          isDark 
                            ? 'bg-[#151926] hover:bg-indigo-600/15 hover:border-indigo-500/40 border-[#1e2433]' 
                            : 'bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border-slate-200'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                            <span>{c.displayName}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                              Sala {c.letra}
                            </span>
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                            <span>{c.totalAlumnos} alumnos PIE</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">{c.neet}/5 NEET</span>
                            <span>•</span>
                            <span className="text-purple-400 font-medium">{c.neep}/2 NEEP</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CATEGORÍA 3: MÓDULOS Y FUNCIONALIDADES */}
              {filteredResults.modules.length > 0 && (
                <div className={(filteredResults.students.length > 0 || filteredResults.courses.length > 0) ? 'pt-4' : ''}>
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Módulos y Funcionalidades ({filteredResults.modules.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Navegación Rápida</span>
                  </div>
                  <div className="space-y-1.5">
                    {filteredResults.modules.slice(0, 5).map((m) => {
                      const IconComp = m.icon;
                      return (
                        <div
                          key={m.id}
                          onClick={m.action}
                          className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                            isDark 
                              ? 'hover:bg-purple-600/10 hover:border-purple-500/30 border-transparent' 
                              : 'hover:bg-purple-50 hover:border-purple-200 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${m.color}`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-bold">{m.title}</h4>
                                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500">
                                  {m.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {m.description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sin resultados */}
              {filteredResults.modules.length === 0 && 
               filteredResults.courses.length === 0 && 
               filteredResults.students.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No se encontraron coincidencias para &quot;{query}&quot;</p>
                  <p className="text-xs text-slate-400 mt-1">Prueba buscando por curso (ej: &quot;1° Básico&quot;), nombre de estudiante o módulo como &quot;reportes&quot;.</p>
                </div>
              )}

            </div>

            {/* Footer con Tips y Atajos */}
            <div className={`p-3 border-t flex items-center justify-between text-[11px] text-slate-500 font-mono ${
              isDark ? 'border-[#1e2433] bg-[#0c0e17]' : 'border-slate-200 bg-slate-100/60'
            }`}>
              <div className="flex items-center gap-3">
                <span>↑↓ para navegar</span>
                <span>•</span>
                <span>Enter para abrir</span>
                <span>•</span>
                <span>ESC para cerrar</span>
              </div>
              <span className="text-blue-500 font-bold">CogniMirror Search</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
