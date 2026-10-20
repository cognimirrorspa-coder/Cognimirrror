'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Kanban,
  Table as TableIcon,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Search,
  Filter,
  User,
  Users,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Edit3,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Layers,
  Flag,
  Share2,
  HelpCircle,
  GripVertical,
  ListChecks,
  RefreshCw,
  Cloud,
  CloudOff
} from 'lucide-react';

import GradientText from './reactbits/GradientText';

// Helper de tema dinámico y colores del medidor según niveles de progreso (Lógica de Semáforo)
const getProgressTheme = (progress = 0) => {
  const p = Number(progress) || 0;

  // 🟢 Terminado / Completado (100%): Verde esmeralda brillante a verde menta (#059669 a #10B981)
  if (p >= 100) {
    return {
      statusName: 'Terminado / Completado (100%)',
      stageLabel: 'Terminado',
      colors: ['#059669', '#10B981', '#34D399', '#059669'],
      fillGradient: 'from-[#059669] to-[#10B981]',
      barStyle: { background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)' },
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.55)]',
      border: 'border-[#10B981]/50',
      badge: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40',
      textColor: 'text-[#10B981]'
    };
  }

  // 🌿 Por Terminar / Avanzado (71% a 99%): Gradiente de amarillo a verde menta claro (#10B981 a #34D399)
  if (p >= 71) {
    return {
      statusName: 'Por Terminar / Avanzado',
      stageLabel: 'Por Terminar',
      colors: ['#FBBF24', '#10B981', '#34D399', '#FBBF24'],
      fillGradient: 'from-[#FBBF24] via-[#10B981] to-[#34D399]',
      barStyle: { background: 'linear-gradient(90deg, #FBBF24 0%, #10B981 50%, #34D399 100%)' },
      glow: 'shadow-[0_0_15px_rgba(52,211,153,0.45)]',
      border: 'border-[#34D399]/50',
      badge: 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/40',
      textColor: 'text-[#34D399]'
    };
  }

  // 🟡 En Progreso / Medio (26% a 70%): Gradiente de naranja a amarillo cálido/ámbar (#F59E0B a #FBBF24)
  if (p >= 26) {
    return {
      statusName: 'En Progreso / Medio',
      stageLabel: 'En Progreso',
      colors: ['#F97316', '#F59E0B', '#FBBF24', '#F97316'],
      fillGradient: 'from-[#F59E0B] to-[#FBBF24]',
      barStyle: { background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)' },
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.45)]',
      border: 'border-[#F59E0B]/50',
      badge: 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/40',
      textColor: 'text-[#FBBF24]'
    };
  }

  // 🔴 Por Iniciar / Estado Crítico (0% a 25%): Gradiente de azul oscuro a naranja/rojizo vibrante (#F97316 a #EF4444)
  return {
    statusName: 'Por Iniciar / Estado Crítico',
    stageLabel: 'Por Iniciar',
    colors: ['#1E293B', '#F97316', '#EF4444', '#F97316'],
    fillGradient: 'from-[#1E293B] via-[#F97316] to-[#EF4444]',
    barStyle: { background: 'linear-gradient(90deg, #1E293B 0%, #F97316 45%, #EF4444 100%)' },
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.45)]',
    border: 'border-[#EF4444]/50',
    badge: 'bg-[#EF4444]/15 text-[#F97316] border-[#EF4444]/40',
    textColor: 'text-[#F97316]'
  };
};

// Helper de estilos y gradientes para las tarjetas del Kanban según su porcentaje de progreso (Lógica de Semáforo)
const getCardProgressStyle = (progress = 0) => {
  const p = Number(progress) || 0;

  // 🟢 1. Terminado / Completado (100%): Verde esmeralda brillante a verde menta (#059669 a #10B981)
  if (p >= 100) {
    return {
      barStyle: { background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)' },
      textColor: 'text-[#10B981]',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.55)]'
    };
  }

  // 🌿 2. Por Terminar / Avanzado (71% a 99%): Amarillo a verde menta claro (#10B981 a #34D399)
  if (p >= 71) {
    return {
      barStyle: { background: 'linear-gradient(90deg, #FBBF24 0%, #10B981 50%, #34D399 100%)' },
      textColor: 'text-[#34D399]',
      glow: 'shadow-[0_0_10px_rgba(52,211,153,0.45)]'
    };
  }

  // 🟡 3. En Progreso / Medio (26% a 70%): Naranja a amarillo cálido/ámbar (#F59E0B a #FBBF24)
  if (p >= 26) {
    return {
      barStyle: { background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)' },
      textColor: 'text-[#FBBF24]',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.45)]'
    };
  }

  // 🔴 4. Por Iniciar / Estado Crítico (0% a 25%): Azul oscuro a naranja/rojizo vibrante (#F97316 a #EF4444)
  return {
    barStyle: { background: 'linear-gradient(90deg, #1E293B 0%, #F97316 45%, #EF4444 100%)' },
    textColor: 'text-[#F97316]',
    glow: 'shadow-[0_0_10px_rgba(239,68,68,0.45)]'
  };
};

// Paleta de estilos para categorías dinámicas personalizadas
const CATEGORY_PALETTES = [
  'border-amber-500/70 bg-amber-500/15 text-amber-300',
  'border-cyan-500/70 bg-cyan-500/15 text-cyan-300',
  'border-purple-500/70 bg-purple-500/15 text-purple-300',
  'border-emerald-500/70 bg-emerald-500/15 text-emerald-300',
  'border-rose-500/70 bg-rose-500/15 text-rose-300',
  'border-blue-500/70 bg-blue-500/15 text-blue-300',
  'border-fuchsia-500/70 bg-fuchsia-500/15 text-fuchsia-300',
  'border-lime-500/70 bg-lime-500/15 text-lime-300'
];

// 4 Integrantes del equipo CogniMirror
const DEFAULT_TEAM_MEMBERS = [
  {
    id: 'm-1',
    name: 'Josué Alarcón',
    role: 'Coordinador General / Dev Lead',
    avatar: 'JA',
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-cyan-400',
    badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
  },
  {
    id: 'm-2',
    name: 'Brayan Castro',
    role: 'Investigador PIE / Clínico',
    avatar: 'BC',
    color: 'from-purple-500 to-indigo-500',
    borderColor: 'border-purple-400',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
  },
  {
    id: 'm-3',
    name: 'Matías Fierro',
    role: 'Especialista de Equipo / Desarrollo',
    avatar: 'MF',
    color: 'from-emerald-500 to-teal-500',
    borderColor: 'border-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'm-4',
    name: 'Nicole Gallardo',
    role: 'Especialista de Equipo / PIE',
    avatar: 'NG',
    color: 'from-amber-500 to-pink-500',
    borderColor: 'border-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  }
];

// Días de la semana para el horario
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Bloques horarios
const BLOQUES_HORARIOS = [
  '08:30 - 10:00',
  '10:00 - 11:30',
  '11:30 - 13:00',
  '13:00 - 14:30',
  '14:30 - 16:00',
  '16:00 - 17:30',
  '17:30 - 19:00',
  '19:00 - 20:30'
];

// Tareas iniciales completas inspiradas en el estilo Versa UI y CogniMirror
// Tareas iniciales completas configuradas exactamente con el estado y salud semafórica de la maqueta
const INITIAL_TASKS = [
  {
    id: 'task-1',
    title: 'Pruebas en horario kanban',
    project: 'DESARROLLO DE SOFTW...',
    status: 'finished',
    priority: 'Low',
    progress: 100,
    dueDate: '21 oct 2026',
    completedAt: '21 oct 2026',
    assignees: ['m-1', 'm-2'],
    commentsCount: 3,
    attachmentsCount: 1,
    description: 'pruebas de uso'
  },
  {
    id: 'task-2',
    title: 'Pruebas de Conexión BLE Giiker / Joicube',
    project: 'HARDWARE CTI',
    status: 'finished',
    priority: 'High',
    progress: 100,
    dueDate: '08 Oct, 2026',
    completedAt: '08 Oct, 2026',
    assignees: ['m-1', 'm-3'],
    commentsCount: 9,
    attachmentsCount: 4,
    description: 'Emparejamiento Web Bluetooth API con cifrado AES en tiempo real.'
  },
  {
    id: 'task-3',
    title: 'Auditoria Forense Inmutable SHA-256',
    project: 'SEGURIDAD',
    status: 'finished',
    priority: 'Medium',
    progress: 100,
    dueDate: '05 Oct, 2026',
    completedAt: '05 Oct, 2026',
    assignees: ['m-1', 'm-2', 'm-4'],
    commentsCount: 7,
    attachmentsCount: 2,
    description: 'Trazabilidad criptográfica de cada edición clínica del expediente.'
  },
  {
    id: 'task-4',
    title: 'Diseño de Batería Nivel 5: Reaction Mirror',
    project: 'BATERÍA 5 NIVELES',
    status: 'in_progress',
    priority: 'High',
    progress: 16,
    dueDate: '12 Oct, 2026',
    completedAt: null,
    assignees: ['m-1', 'm-2', 'm-3'],
    commentsCount: 12,
    attachmentsCount: 7,
    description: 'Calibración de LEDs inteligentes con respuesta motriz de 250ms.'
  },
  {
    id: 'task-5',
    title: 'Check-in Diario Integrado con Directorio',
    project: 'PLATAFORMA PIE',
    status: 'in_progress',
    priority: 'Medium',
    progress: 70,
    dueDate: '10 Oct, 2026',
    completedAt: null,
    assignees: ['m-2', 'm-4'],
    commentsCount: 5,
    attachmentsCount: 1,
    description: 'Sistema de asistencia clínica y registro emocional pre-sesión.'
  },
  {
    id: 'task-6',
    title: 'Análisis Estadístico Latencias de Giro',
    project: 'TELEMETRÍA 3D',
    status: 'overdue',
    priority: 'High',
    progress: 85,
    dueDate: '15 Oct, 2026',
    completedAt: null,
    assignees: ['m-1', 'm-3'],
    commentsCount: 8,
    attachmentsCount: 5,
    description: 'Correlación entre rotación espacial y niveles de impulsividad detectados.'
  },
  {
    id: 'task-7',
    title: 'Capacitación a Docentes de Aula Común',
    project: 'CAPACITACIÓN',
    status: 'backlog',
    priority: 'Low',
    progress: 20,
    dueDate: '25 Oct, 2026',
    completedAt: null,
    assignees: ['m-4'],
    commentsCount: 2,
    attachmentsCount: 1,
    description: 'Taller de interpretación de informes de funciones ejecutivas.'
  }
];

// Matriz inicial de tiempos libres (memberId -> { `${dia}-${bloque}`: boolean })
const INITIAL_AVAILABILITY = {
  'm-1': {
    'Lunes-10:00 - 11:30': true,
    'Lunes-16:00 - 17:30': true,
    'Martes-14:30 - 16:00': true,
    'Miércoles-10:00 - 11:30': true,
    'Miércoles-16:00 - 17:30': true,
    'Jueves-11:30 - 13:00': true,
    'Viernes-14:30 - 16:00': true,
    'Viernes-16:00 - 17:30': true
  },
  'm-2': {
    'Lunes-10:00 - 11:30': true,
    'Martes-10:00 - 11:30': true,
    'Martes-16:00 - 17:30': true,
    'Miércoles-10:00 - 11:30': true,
    'Jueves-14:30 - 16:00': true,
    'Viernes-10:00 - 11:30': true,
    'Viernes-16:00 - 17:30': true
  },
  'm-3': {
    'Lunes-14:30 - 16:00': true,
    'Martes-11:30 - 13:00': true,
    'Miércoles-10:00 - 11:30': true,
    'Jueves-10:00 - 11:30': true,
    'Viernes-11:30 - 13:00': true,
    'Viernes-16:00 - 17:30': true
  },
  'm-4': {
    'Lunes-10:00 - 11:30': true,
    'Martes-14:30 - 16:00': true,
    'Miércoles-14:30 - 16:00': true,
    'Jueves-10:00 - 11:30': true,
    'Viernes-10:00 - 11:30': true,
    'Viernes-16:00 - 17:30': true
  }
};

export default function HorarioKanbanOrganizacional({ isDark = true }) {
  // Pestaña activa superior: 'kanban' | 'calendar' | 'table'
  const [currentView, setCurrentView] = useState('kanban');

  // Estado de sincronización en la nube con Supabase ('synced' | 'syncing' | 'local')
  const [syncStatus, setSyncStatus] = useState('syncing');

  // Estado de las tareas
  const [tasks, setTasks] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cognimirror_kanban_tasks_v4');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return INITIAL_TASKS;
  });

  // Estado de tiempos libres de los 4 integrantes
  const [availability, setAvailability] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cognimirror_team_availability_v3');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return INITIAL_AVAILABILITY;
  });

  // Filtro por integrante activo ('all' o id)
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('all');

  // Búsqueda de texto
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para agregar o editar tarea
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Categorías dinámicas personalizadas (inician vacías por solicitud del usuario)
  const [categories, setCategories] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cognimirror_kanban_categories_v3');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return [];
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null); // Para confirmación de eliminación en 2 pasos

  // Formulario de nueva tarea
  const [taskForm, setTaskForm] = useState({
    title: '',
    project: '',
    status: 'in_progress',
    priority: 'High',
    effort: '1 Bloque libre (1.5 hrs)',
    scheduledDays: [],
    scheduledSlot: '10:00 - 11:30',
    dueDate: '18 Oct, 2026',
    dependency: '',
    assignees: ['m-1', 'm-2'],
    description: '',
    checklist: [
      { id: 1, text: 'Prueba 1', completed: false },
      { id: 2, text: 'Prueba 2', completed: false }
    ],
    progress: 50
  });

  // Tema dinámico de progreso para GradientText y colores del medidor según semáforo de progreso
  const progressTheme = useMemo(() => getProgressTheme(taskForm.progress), [taskForm.progress]);

  // Guardar en localStorage como cache offline
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognimirror_kanban_tasks_v4', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognimirror_team_availability_v3', JSON.stringify(availability));
    }
  }, [availability]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognimirror_kanban_categories_v3', JSON.stringify(categories));
    }
  }, [categories]);

  // Cargar datos remotos desde Supabase
  const loadRemoteKanban = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/horario-organizacional', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.isLiveSupabase && Array.isArray(data.tasks)) {
          if (data.tasks.length > 0) {
            setTasks(data.tasks);
          }
          if (data.availability && typeof data.availability === 'object') {
            setAvailability(data.availability);
          }
          if (Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
          setSyncStatus('synced');
          return;
        } else if (data.notConfigured) {
          setSyncStatus('local');
          return;
        }
      }
      setSyncStatus('local');
    } catch (e) {
      console.warn('[HorarioKanban] Trabajando en modo local:', e.message);
      setSyncStatus('local');
    }
  }, []);

  useEffect(() => {
    loadRemoteKanban();
  }, [loadRemoteKanban]);

  // Helpers de sincronización en tiempo real con Supabase
  const syncTaskToCloud = async (task) => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/horario-organizacional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_task', task })
      });
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data.notConfigured ? 'local' : 'synced');
      }
    } catch (e) {
      setSyncStatus('local');
    }
  };

  const deleteTaskFromCloud = async (taskId) => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/horario-organizacional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_task', taskId })
      });
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data.notConfigured ? 'local' : 'synced');
      }
    } catch (e) {
      setSyncStatus('local');
    }
  };

  const syncAvailabilityToCloud = async (newAvailability) => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/horario-organizacional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_availability', availability: newAvailability })
      });
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data.notConfigured ? 'local' : 'synced');
      }
    } catch (e) {
      setSyncStatus('local');
    }
  };

  const syncCategoriesToCloud = async (newCategories) => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/horario-organizacional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_categories', categories: newCategories })
      });
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data.notConfigured ? 'local' : 'synced');
      }
    } catch (e) {
      setSyncStatus('local');
    }
  };

  // Filtrado de tareas
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMember = selectedMemberFilter === 'all' || task.assignees.includes(selectedMemberFilter);

      return matchesSearch && matchesMember;
    });
  }, [tasks, searchQuery, selectedMemberFilter]);

  // Agrupación de tareas por columna Kanban (con los títulos exactos solicitados)
  const columns = useMemo(() => {
    return [
      {
        id: 'finished',
        label: 'TERMINADO',
        icon: CheckCircle2,
        colorText: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40',
        tasks: filteredTasks.filter(t => t.status === 'finished')
      },
      {
        id: 'in_progress',
        label: 'EN PROCESO',
        icon: Clock,
        colorText: 'text-amber-400',
        badgeBg: 'bg-amber-950/80 text-amber-400 border-amber-800/40',
        tasks: filteredTasks.filter(t => t.status === 'in_progress')
      },
      {
        id: 'overdue',
        label: 'ATRASADO / EN REVISIÓN',
        icon: AlertCircle,
        colorText: 'text-rose-400',
        badgeBg: 'bg-rose-950/80 text-rose-400 border-rose-800/40',
        tasks: filteredTasks.filter(t => t.status === 'overdue')
      },
      {
        id: 'backlog',
        label: 'PENDIENTES / POR HACER',
        icon: Layers,
        colorText: 'text-cyan-400',
        badgeBg: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/40',
        tasks: filteredTasks.filter(t => t.status === 'backlog')
      }
    ];
  }, [filteredTasks]);

  // Lista de tareas terminadas para la tabla
  const finishedTasks = useMemo(() => {
    return filteredTasks.filter(t => t.status === 'finished');
  }, [filteredTasks]);

  // Manejo de cambio de estado rápido de una tarea (Drag o botón de acción)
  const handleMoveTask = (taskId, nextStatus) => {
    let updatedTask = null;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        updatedTask = {
          ...t,
          status: nextStatus,
          progress: nextStatus === 'finished' ? 100 : t.progress === 100 ? 70 : t.progress,
          completedAt: nextStatus === 'finished' ? 'Hoy, ' + new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : null
        };
        return updatedTask;
      }
      return t;
    }));
    if (updatedTask) {
      syncTaskToCloud(updatedTask);
    }
  };

  // Eliminar tarea
  const handleDeleteTask = (taskId) => {
    if (confirm('¿Eliminar esta tarea del tablero?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      deleteTaskFromCloud(taskId);
    }
  };

  // Gestión de categorías dinámicas
  const handleAddCategory = (e) => {
    e?.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.label.toLowerCase() === trimmed.toLowerCase())) {
      alert('Ya existe una categoría con ese nombre.');
      return;
    }
    const newCat = {
      id: `cat-${Date.now()}`,
      label: trimmed,
      color: CATEGORY_PALETTES[categories.length % CATEGORY_PALETTES.length]
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    setNewCategoryName('');
    setIsAddingCategory(false);
    syncCategoriesToCloud(updated);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const updated = categories.filter(c => c.id !== categoryToDelete.id);
    setCategories(updated);
    if (taskForm.project === categoryToDelete.label) {
      setTaskForm(prev => ({ ...prev, project: '' }));
    }
    setCategoryToDelete(null);
    syncCategoriesToCloud(updated);
  };

  // Abrir modal de creación/edición
  const handleOpenCreateModal = (defaultStatus = 'in_progress') => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      project: '', // Sin marcar ninguna categoría por defecto
      status: defaultStatus,
      priority: 'High',
      effort: '1 Bloque libre (1.5 hrs)',
      scheduledDays: [],
      scheduledSlot: '10:00 - 11:30',
      dueDate: new Date(Date.now() + 5 * 86400000).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      dependency: '',
      assignees: ['m-1', 'm-2'],
      description: '',
      checklist: [
        { id: 1, text: 'Prueba 1', completed: false },
        { id: 2, text: 'Prueba 2', completed: false }
      ],
      progress: 0
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      project: task.project || '', // Sin forzar categoría por defecto
      status: task.status,
      priority: task.priority || 'Medium',
      effort: task.effort || '1 Bloque libre (1.5 hrs)',
      scheduledDays: task.scheduledDays || [],
      scheduledSlot: task.scheduledSlot || '10:00 - 11:30',
      dueDate: task.dueDate || '',
      dependency: task.dependency || '',
      assignees: task.assignees || ['m-1'],
      description: task.description || '',
      checklist: task.checklist && task.checklist.length > 0 ? task.checklist : [
        { id: 1, text: 'Prueba 1', completed: false },
        { id: 2, text: 'Prueba 2', completed: false }
      ],
      progress: task.progress || 0
    });
    setIsTaskModalOpen(true);
  };

  // Guardar tarea
  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    let targetTask = null;
    if (editingTask) {
      targetTask = {
        ...editingTask,
        ...taskForm,
        completedAt: taskForm.status === 'finished' ? (editingTask.completedAt || 'Hoy') : null
      };
      setTasks(prev => prev.map(t => t.id === editingTask.id ? targetTask : t));
    } else {
      targetTask = {
        id: `task-${Date.now()}`,
        ...taskForm,
        completedAt: taskForm.status === 'finished' ? 'Hoy' : null,
        commentsCount: 0,
        attachmentsCount: 0
      };
      setTasks(prev => [targetTask, ...prev]);
    }
    if (targetTask) {
      syncTaskToCloud(targetTask);
    }
    setIsTaskModalOpen(false);
  };

  // Alternar tiempo libre de un integrante en el horario
  const toggleAvailability = (memberId, dia, bloque) => {
    const key = `${dia}-${bloque}`;
    setAvailability(prev => {
      const memberSlots = { ...(prev[memberId] || {}) };
      if (memberSlots[key]) {
        delete memberSlots[key];
      } else {
        memberSlots[key] = true;
      }
      const updated = {
        ...prev,
        [memberId]: memberSlots
      };
      syncAvailabilityToCloud(updated);
      return updated;
    });
  };

  // Saber cuántos integrantes están libres en una celda
  const getFreeMembersInSlot = (dia, bloque) => {
    const key = `${dia}-${bloque}`;
    return DEFAULT_TEAM_MEMBERS.filter(m => availability[m.id]?.[key]);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* ── HEADER SUPERIOR CON ESTILO VERSA GLASSMORPHISM ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-white/10 bg-gradient-to-r from-[#141226]/90 via-[#191530]/85 to-[#0f1426]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        {/* Glows ambientales de fondo */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Título y Selector de Vistas Glassmorphism */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-[#121422] rounded-[14px] flex items-center justify-center">
                  <Kanban className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Horario Organizacional
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest font-bold">
                    Equipo (4)
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Gestión Kanban, sincronización de tiempos libres y trazabilidad de tareas completadas.
                </p>
              </div>
            </div>

            {/* Selector de pestañas Glassmorphism (Table | Kanban | Calendar) */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 w-fit self-start">
              <button
                onClick={() => setCurrentView('table')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'table'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-white/80">
                  {finishedTasks.length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView('kanban')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'kanban'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-white/80">
                  {tasks.length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView('calendar')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'calendar'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar & Horarios</span>
              </button>
            </div>
          </div>

          {/* Acciones de la derecha: Buscador + Filtro Integrante + Botón Add Task */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tarea o proyecto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 w-48 sm:w-56 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro por Integrante (4 personas) */}
            <select
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-black/40 border border-white/10 text-slate-200 focus:outline-none focus:border-purple-500/60 cursor-pointer"
            >
              <option value="all">Equipo: Todos (4)</option>
              {DEFAULT_TEAM_MEMBERS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {/* Botón + Add Task */}
            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Task</span>
            </button>
          </div>

        </div>

        {/* ── BARRA DE INTEGRANTES DEL EQUIPO (4 AVATARES Y ROLES) ── */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            Integrantes Activos:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {DEFAULT_TEAM_MEMBERS.map(member => {
              const isSelected = selectedMemberFilter === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberFilter(isSelected ? 'all' : member.id)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? `${member.badgeBg} border-current shadow-sm`
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  title={member.role}
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-[9px] font-black text-white shadow-sm`}>
                    {member.avatar}
                  </div>
                  <span className="text-[11px] font-bold">{member.name}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── VISTA 1: TABLERO KANBAN EDITABLE (ESTILO VERSA UI) ── */}
      {currentView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {columns.map(column => {
            const Icon = column.icon;

            return (
              <div
                key={column.id}
                className="flex flex-col gap-3.5 p-4 rounded-3xl bg-[#101423]/75 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)] min-h-[480px]"
              >
                {/* Cabecera de la columna */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${column.colorText}`} />
                    <span className="text-xs font-black tracking-wider uppercase text-white">
                      {column.label}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${column.badgeBg}`}>
                      {column.tasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenCreateModal(column.id)}
                    className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title={`Agregar tarea a ${column.label}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lista de tarjetas en la columna */}
                <div className="flex flex-col gap-3">
                  {column.tasks.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Sin tareas aquí</span>
                      <button
                        onClick={() => handleOpenCreateModal(column.id)}
                        className="text-[10px] font-bold text-purple-400 hover:underline cursor-pointer"
                      >
                        + Crear nueva
                      </button>
                    </div>
                  ) : (
                    column.tasks.map(task => {
                      // Determinar estilo de prioridad
                      const priorityStyle =
                        task.priority === 'High'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          : task.priority === 'Medium'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';

                      return (
                        <div
                          key={task.id}
                          className="p-4 rounded-2xl bg-[#161a2e]/90 hover:bg-[#1c223c] border border-white/10 hover:border-purple-500/40 backdrop-blur-md transition-all duration-200 group shadow-md hover:shadow-purple-500/10 flex flex-col gap-3"
                        >
                          {/* Tag de Proyecto y Menú */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 truncate max-w-[170px]">
                              {task.project}
                            </span>

                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(task)}
                                className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                                title="Editar tarea"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400"
                                title="Eliminar tarea"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Título de la tarea */}
                          <h3 className="text-sm font-bold text-white leading-snug group-hover:text-purple-300 transition-colors">
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Prioridad y Fecha Límite */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${priorityStyle}`}>
                              {task.priority}
                            </span>

                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-slate-500" />
                              {task.dueDate}
                            </span>
                          </div>

                          {/* Barra de progreso con gradiente dinámico según semáforo de salud (0-25%, 26-70%, 71-99%, 100%) */}
                          {(() => {
                            const progStyle = getCardProgressStyle(task.progress);
                            return (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                  <span>Progreso</span>
                                  <span className={`font-bold font-mono transition-colors duration-300 ${progStyle.textColor}`}>
                                    {task.progress}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${progStyle.glow}`}
                                    style={{
                                      width: `${task.progress}%`,
                                      ...progStyle.barStyle
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })()}

                          {/* Footer de la tarjeta: Avatares asignados y Mover columna */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-0.5">
                            {/* Avatares solapados */}
                            <div className="flex items-center -space-x-1.5">
                              {task.assignees.map(id => {
                                const member = DEFAULT_TEAM_MEMBERS.find(m => m.id === id);
                                if (!member) return null;
                                return (
                                  <div
                                    key={id}
                                    title={`${member.name} (${member.role})`}
                                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${member.color} ring-2 ring-[#161a2e] flex items-center justify-center text-[9px] font-black text-white shadow`}
                                  >
                                    {member.avatar}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Botones de mover rápido */}
                            <div className="flex items-center gap-1">
                              {column.id !== 'finished' && (
                                <button
                                  onClick={() => handleMoveTask(task.id, 'finished')}
                                  className="px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 transition-all"
                                  title="Marcar como Finalizada"
                                >
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Fin</span>
                                </button>
                              )}

                              {column.id === 'finished' && (
                                <button
                                  onClick={() => handleMoveTask(task.id, 'in_progress')}
                                  className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 transition-all"
                                  title="Regresar a En Progreso"
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>Reabrir</span>
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VISTA 2: HORARIO DE TIEMPOS LIBRES DEL EQUIPO (4 INTEGRANTES) ── */}
      {currentView === 'calendar' && (
        <div className="flex flex-col gap-5 p-6 sm:p-7 rounded-3xl bg-[#101423]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                Matriz de Disponibilidad y Tiempos Libres
              </h2>
              <p className="text-xs text-slate-400">
                Haz clic sobre cualquier bloque horario para marcar o desmarcar el tiempo libre de cada integrante.
              </p>
            </div>

            {/* Selector de integrante para edición de horario */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Editar Disponibilidad de:</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
                {DEFAULT_TEAM_MEMBERS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMemberFilter(m.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedMemberFilter === m.id
                        ? `${m.badgeBg} border-current shadow-sm`
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-[8px] font-black text-white`}>
                      {m.avatar}
                    </div>
                    <span>{m.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grilla Semanal */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-3 text-left font-mono text-[11px] text-slate-400 uppercase tracking-wider border-b border-white/10 w-32 bg-white/5 rounded-tl-xl">
                    Bloque
                  </th>
                  {DIAS_SEMANA.map((dia, idx) => (
                    <th
                      key={dia}
                      className={`p-3 text-center font-bold text-white border-b border-white/10 bg-white/5 ${
                        idx === DIAS_SEMANA.length - 1 ? 'rounded-tr-xl' : ''
                      }`}
                    >
                      {dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOQUES_HORARIOS.map((bloque, bIdx) => (
                  <tr key={bloque} className={bIdx % 2 === 0 ? 'bg-black/20' : 'bg-transparent'}>
                    {/* Celda de la hora */}
                    <td className="p-3 font-mono font-bold text-slate-400 border-b border-white/5 border-r border-white/5 whitespace-nowrap">
                      {bloque}
                    </td>

                    {/* Celdas por día */}
                    {DIAS_SEMANA.map(dia => {
                      const freeMembers = getFreeMembersInSlot(dia, bloque);
                      const isTargetMemberFree = selectedMemberFilter !== 'all' 
                        ? availability[selectedMemberFilter]?.[`${dia}-${bloque}`]
                        : false;

                      return (
                        <td
                          key={dia}
                          className="p-2 border-b border-white/5 border-r border-white/5 align-top min-w-[130px]"
                        >
                          <div
                            onClick={() => {
                              const targetId = selectedMemberFilter === 'all' ? 'm-1' : selectedMemberFilter;
                              toggleAvailability(targetId, dia, bloque);
                            }}
                            className={`min-h-[54px] p-2 rounded-xl transition-all cursor-pointer border flex flex-col justify-between ${
                              freeMembers.length > 0
                                ? 'bg-purple-950/20 hover:bg-purple-950/40 border-purple-500/30'
                                : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <span className="text-slate-500">{freeMembers.length} libres</span>
                              {freeMembers.length >= 3 && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                  Sync!
                                </span>
                              )}
                            </div>

                            {/* Badges de integrantes libres */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {freeMembers.map(m => (
                                <span
                                  key={m.id}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${m.badgeBg}`}
                                  title={`${m.name} disponible en este bloque`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                  {m.name.split(' ')[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Tip de Coordinación:</strong> Los bloques con etiqueta <strong>Sync!</strong> indican que 3 o más integrantes tienen tiempo libre coincidente para reuniones clínicas o planificación.
              </span>
            </div>
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              + Asignar Tarea en Espacio Libre
            </button>
          </div>

        </div>
      )}

      {/* ── VISTA 3: TABLA CON LA LISTA DE TAREAS TERMINADAS ── */}
      {currentView === 'table' && (
        <div className="flex flex-col gap-5 p-6 sm:p-7 rounded-3xl bg-[#101423]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Lista de Tareas Terminadas
              </h2>
              <p className="text-xs text-slate-400">
                Registro histórico y trazabilidad de objetivos cumplidos por los 4 integrantes del equipo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-300 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-bold">
                {finishedTasks.length} Tareas Completadas
              </span>
            </div>
          </div>

          {/* Tabla de tareas terminadas */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-3.5">Tarea / Objetivo</th>
                  <th className="p-3.5">Proyecto / Área</th>
                  <th className="p-3.5">Integrantes</th>
                  <th className="p-3.5">Prioridad</th>
                  <th className="p-3.5">Fecha Término</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {finishedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No hay tareas finalizadas con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  finishedTasks.map(task => {
                    const priorityStyle =
                      task.priority === 'High'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                        : task.priority === 'Medium'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';

                    return (
                      <tr key={task.id} className="hover:bg-white/[0.03] transition-colors">
                        {/* Título y descripción */}
                        <td className="p-3.5 font-bold text-white max-w-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate">{task.title}</span>
                          </div>
                          {task.description && (
                            <p className="text-[11px] font-normal text-slate-400 truncate mt-0.5 pl-6">
                              {task.description}
                            </p>
                          )}
                        </td>

                        {/* Proyecto */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/5 border border-white/10 text-slate-300">
                            {task.project}
                          </span>
                        </td>

                        {/* Integrantes asignados */}
                        <td className="p-3.5">
                          <div className="flex items-center -space-x-1.5">
                            {task.assignees.map(id => {
                              const member = DEFAULT_TEAM_MEMBERS.find(m => m.id === id);
                              if (!member) return null;
                              return (
                                <div
                                  key={id}
                                  title={`${member.name} (${member.role})`}
                                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${member.color} ring-2 ring-[#101423] flex items-center justify-center text-[9px] font-black text-white shadow`}
                                >
                                  {member.avatar}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Prioridad */}
                        <td className="p-3.5">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${priorityStyle}`}>
                            {task.priority}
                          </span>
                        </td>

                        {/* Fecha de término */}
                        <td className="p-3.5 font-mono text-slate-400">
                          {task.completedAt || task.dueDate}
                        </td>

                        {/* Estado */}
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Completada (100%)
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleMoveTask(task.id, 'in_progress')}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                              title="Reabrir tarea"
                            >
                              Reabrir
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                              title="Eliminar de la lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── MODAL: CREAR / EDITAR TAREA (ESTILO EXACTO VERSA UI / MOCKUP) ── */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-[28px] bg-[#121124] border border-[#2b2649] p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col gap-6 text-xs my-auto max-h-[94vh] overflow-y-auto">
            
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-[#252240] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                  <span className="text-[#a855f7] text-2xl font-normal leading-none">+</span>
                  <span>{editingTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}</span>
                </h3>
                <p className="text-xs text-[#8f8aa8] mt-1">
                  Completa los datos para añadir la tarea al Kanban
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8f8aa8] hover:text-white cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="flex flex-col gap-5">
              
              {/* Cuadrícula Superior de 2 Columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* ── COLUMNA IZQUIERDA (1, 2, 3) ── */}
                <div className="flex flex-col gap-4">
                  
                  {/* ① TÍTULO DE LA TAREA */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[#b5b0cd] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <span className="text-[#a855f7] font-extrabold text-sm">①</span>
                      <span>TÍTULO DE LA TAREA</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Préstamo de Libro o Diseño de Batería..."
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="px-4 py-3 rounded-2xl bg-[#0b0a17] border border-[#272346] text-white placeholder-[#5a5676] focus:outline-none focus:border-[#a855f7] transition-all font-medium text-xs shadow-inner"
                    />
                  </div>

                  {/* ② CATEGORÍA / ETIQUETA */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#b5b0cd] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <span className="text-[#a855f7] font-extrabold text-sm">②</span>
                        <span>CATEGORÍA / ETIQUETA</span>
                      </label>

                      {!isAddingCategory && (
                        <button
                          type="button"
                          onClick={() => setIsAddingCategory(true)}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#c084fc] bg-[#271d47] hover:bg-[#342461] px-2.5 py-1 rounded-lg border border-[#6b21a8]/40 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="p-3 rounded-2xl bg-[#0b0a17] border border-[#272346] flex flex-wrap items-center gap-2 relative min-h-[52px]">
                      {/* Formulario en línea para agregar nueva categoría */}
                      {isAddingCategory ? (
                        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#16142a] border border-[#a855f7]/50 w-full animate-in fade-in duration-150">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Escribe el nombre de la categoría..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCategory();
                              } else if (e.key === 'Escape') {
                                setIsAddingCategory(false);
                                setNewCategoryName('');
                              }
                            }}
                            className="flex-1 bg-transparent border-none text-xs text-white placeholder-[#5a5676] focus:outline-none px-2"
                          />
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim()}
                            className="px-3 py-1 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-[11px] disabled:opacity-40 cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Guardar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCategory(false);
                              setNewCategoryName('');
                            }}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : categories.length === 0 ? (
                        /* Estado vacío inicial solicitado por el usuario */
                        <div className="flex items-center justify-between w-full text-[#7e799c] text-xs py-1 px-1">
                          <span className="italic text-[11px] text-[#6b668d]">Sin categorías guardadas. Presiona "+" para crear una.</span>
                          <button
                            type="button"
                            onClick={() => setIsAddingCategory(true)}
                            className="w-7 h-7 rounded-xl bg-[#271d47] hover:bg-[#342461] border border-[#6b21a8]/40 text-[#c084fc] flex items-center justify-center cursor-pointer transition-all shrink-0 ml-2 shadow-sm"
                            title="Añadir primera categoría"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        /* Lista de categorías guardadas con selector y borrado seguro de 2 pasos */
                        <>
                          {categories.map(cat => {
                            const isSelected = taskForm.project === cat.label;
                            return (
                              <div key={cat.id} className="relative group inline-flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setTaskForm({ ...taskForm, project: isSelected ? '' : cat.label })}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
                                    isSelected
                                      ? `${cat.color} ring-1 ring-white/20 shadow-sm`
                                      : 'bg-white/5 border-white/10 text-[#7e799c] hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 shrink-0" />}
                                  <span>{cat.label}</span>
                                </button>

                                {/* Botón de borrado seguro (activa paso de confirmación para evitar errores accidentales) */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategoryToDelete(cat);
                                  }}
                                  className="ml-1 w-5 h-5 rounded-md hover:bg-rose-500/20 text-[#6b668d] hover:text-rose-400 opacity-40 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                                  title={`Eliminar categoría "${cat.label}" (requiere confirmación)`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}

                          {/* Botón '+' adicional al final para agregar más */}
                          <button
                            type="button"
                            onClick={() => setIsAddingCategory(true)}
                            className="w-7 h-7 rounded-xl bg-white/5 hover:bg-[#271d47] border border-white/10 hover:border-[#6b21a8]/50 text-[#c084fc] flex items-center justify-center cursor-pointer transition-all ml-auto"
                            title="Añadir otra categoría"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ③ DESCRIPCIÓN (¿QUÉ SE VA A HACER?) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#b5b0cd] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <span className="text-[#a855f7] font-extrabold text-sm">③</span>
                        <span>DESCRIPCIÓN (¿QUÉ SE VA A HACER?)</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const template = 'Como [rol] quiero [acción] para [resultado]...';
                          setTaskForm(prev => ({
                            ...prev,
                            description: prev.description ? `${prev.description}\n${template}` : template
                          }));
                        }}
                        className="text-[10px] font-bold text-[#c084fc] bg-[#271d47] hover:bg-[#32255c] px-2.5 py-1 rounded-lg border border-[#6b21a8]/40 transition-all cursor-pointer"
                      >
                        Ayuda: Ver plantilla
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      placeholder="Como [rol] quiero [acción] para [resultado]..."
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="px-4 py-3 rounded-2xl bg-[#0b0a17] border border-[#272346] text-white placeholder-[#5a5676] focus:outline-none focus:border-[#a855f7] transition-all resize-none text-xs leading-relaxed shadow-inner"
                    />
                  </div>

                  {/* ── MEDIDOR DE PROGRESO REDISEÑADO (SLIDE COMMIT + REACTBITS GRADIENT TEXT) ── */}
                  <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#0b0a17] border border-[#272346] shadow-inner relative overflow-hidden group">
                    {/* Resplandor ambiental de fondo dinámico según el estado */}
                    <div
                      className={`absolute -right-8 -bottom-8 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-25 transition-all duration-500 bg-gradient-to-br ${progressTheme.fillGradient}`}
                    />

                    {/* Encabezado del medidor */}
                    <div className="flex items-center justify-between relative z-10">
                      <label className="font-bold text-[#b5b0cd] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#a855f7]" />
                        <span>Medidor de Progreso</span>
                      </label>

                      {/* Estado y porcentaje con Gradient Text animado */}
                      <div className="flex items-center gap-2">
                        <GradientText
                          colors={progressTheme.colors}
                          animationSpeed={2.8}
                          continuous={true}
                          className="font-bold text-[10px] uppercase tracking-wider font-mono"
                        >
                          {progressTheme.statusName}
                        </GradientText>
                        <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-lg border shadow-sm ${progressTheme.badge}`}>
                          {taskForm.progress || 0}%
                        </span>
                      </div>
                    </div>

                    {/* Pista y Deslizador interactivo estilo Slide Commit de ReactBits */}
                    <div className="relative z-10 flex flex-col gap-2">
                      <div className="relative w-full h-11 rounded-2xl bg-[#141226] border border-[#272346] p-1 flex items-center overflow-hidden select-none shadow-inner">
                        {/* Relleno con gradiente dinámico */}
                        <div
                          className="absolute left-0 top-0 bottom-0 opacity-40 transition-all duration-150 rounded-2xl"
                          style={{
                            width: `${taskForm.progress || 0}%`,
                            ...progressTheme.barStyle
                          }}
                        />

                        {/* Texto guía central animado con GradientText */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-10">
                          <GradientText
                            colors={progressTheme.colors}
                            animationSpeed={3.2}
                            continuous={true}
                            className="text-[10px] font-bold uppercase tracking-widest text-center truncate"
                          >
                            {taskForm.progress >= 100 ? '✓ Tarea Completada (100%)' : `Desliza para ajustar · ${taskForm.progress || 0}%`}
                          </GradientText>
                        </div>

                        {/* Manija estilo Slide Commit */}
                        <div
                          className={`absolute z-20 h-9 w-9 rounded-xl text-white flex items-center justify-center font-bold shadow-lg ${progressTheme.glow} transition-all duration-75 pointer-events-none`}
                          style={{
                            left: `calc(${Math.min(100, Math.max(0, taskForm.progress || 0))}% * 0.88 + 4px)`,
                            ...progressTheme.barStyle
                          }}
                        >
                          {taskForm.progress >= 100 ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                        </div>

                        {/* Input range invisible sobre la pista para control fluido táctil y ratón */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={taskForm.progress || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setTaskForm({
                              ...taskForm,
                              progress: val,
                              status: val === 100 ? 'finished' : (taskForm.status === 'finished' ? 'in_progress' : taskForm.status)
                            });
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                          title="Arrastra para cambiar el progreso"
                        />
                      </div>

                      {/* Botones de porcentaje de acceso rápido con colores de estado */}
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className="text-[9px] font-mono text-[#6b668d]">Fijar nivel:</span>
                        <div className="flex items-center gap-1">
                          {[0, 25, 50, 75, 100].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setTaskForm({
                                ...taskForm,
                                progress: val,
                                status: val === 100 ? 'finished' : (taskForm.status === 'finished' ? 'in_progress' : taskForm.status)
                              })}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                                taskForm.progress === val
                                  ? `${progressTheme.badge} ring-1 ring-white/20 shadow-sm font-black`
                                  : 'bg-white/5 border-white/5 text-[#7e799c] hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {val}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ── COLUMNA DERECHA (4, 5, 6, 7) ── */}
                <div className="flex flex-col gap-4">
                  
                  {/* ④ INTEGRANTES (ASIGNAR A) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[#b5b0cd] flex items-center justify-between text-[11px] uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#a855f7]" />
                        <span>INTEGRANTES (ASIGNAR A)</span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#6b668d]" />
                    </label>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-[#0b0a17] border border-[#272346]">
                      {DEFAULT_TEAM_MEMBERS.map(member => {
                        const isAssigned = taskForm.assignees.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              const newAssignees = isAssigned
                                ? taskForm.assignees.filter(id => id !== member.id)
                                : [...taskForm.assignees, member.id];
                              setTaskForm({ ...taskForm, assignees: newAssignees.length ? newAssignees : [member.id] });
                            }}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                              isAssigned
                                ? `${member.badgeBg} border-current font-bold ring-1 ring-white/10 shadow-sm`
                                : 'bg-white/5 border-white/5 text-[#7e799c] hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-sm`}>
                              {member.avatar}
                            </div>
                            <span className="truncate text-[11px] font-semibold">{member.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ⑤ PRIORIDAD */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[#b5b0cd] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <span className="text-[#a855f7] font-extrabold text-sm">⑤</span>
                      <span>PRIORIDAD</span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {/* High */}
                      <button
                        type="button"
                        onClick={() => setTaskForm({ ...taskForm, priority: 'High' })}
                        className={`py-2.5 rounded-2xl font-bold text-xs border transition-all cursor-pointer text-center ${
                          taskForm.priority === 'High'
                            ? 'bg-[#43141f] border-[#f43f5e] text-[#fda4af] shadow-md shadow-rose-900/30'
                            : 'bg-[#0b0a17] border-[#272346] text-[#7e799c] hover:text-white'
                        }`}
                      >
                        High
                      </button>

                      {/* Medium */}
                      <button
                        type="button"
                        onClick={() => setTaskForm({ ...taskForm, priority: 'Medium' })}
                        className={`py-2.5 rounded-2xl font-bold text-xs border transition-all cursor-pointer text-center ${
                          taskForm.priority === 'Medium'
                            ? 'bg-[#3b2b10] border-[#eab308] text-[#fde047] shadow-md shadow-amber-900/30'
                            : 'bg-[#0b0a17] border-[#272346] text-[#7e799c] hover:text-white'
                        }`}
                      >
                        Medium
                      </button>

                      {/* Low */}
                      <button
                        type="button"
                        onClick={() => setTaskForm({ ...taskForm, priority: 'Low' })}
                        className={`py-2.5 rounded-2xl font-bold text-xs border transition-all cursor-pointer text-center ${
                          taskForm.priority === 'Low'
                            ? 'bg-[#102947] border-[#38bdf8] text-[#7dd3fc] shadow-md shadow-sky-900/30'
                            : 'bg-[#0b0a17] border-[#272346] text-[#7e799c] hover:text-white'
                        }`}
                      >
                        Low
                      </button>
                    </div>
                  </div>

                  {/* ⑥ ESTIMACIÓN Y HORARIO ASIGNADO (SEGÚN TIEMPOS LIBRES) */}
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-[#b5b0cd] flex items-center justify-between text-[11px] uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[#a855f7] font-extrabold text-sm">⑥</span>
                        <span>ESTIMACIÓN Y HORARIO ASIGNADO</span>
                      </span>
                      <span className="text-[10px] text-[#8f8aa8] font-normal normal-case">
                        Bloques de 1.5 hrs
                      </span>
                    </label>

                    {/* Fila 1: Selector de Bloques Libres + Bloque Horario */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <select
                          value={taskForm.effort}
                          onChange={(e) => setTaskForm({ ...taskForm, effort: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-2xl bg-[#0b0a17] border border-[#272346] text-white focus:outline-none focus:border-[#a855f7] text-xs cursor-pointer appearance-none pr-8"
                        >
                          <option value="1 Bloque libre (1.5 hrs)">1 Bloque libre (1.5 hrs) · Tarea corta</option>
                          <option value="2 Bloques libres (3.0 hrs)">2 Bloques libres (3.0 hrs) · En 2 bloques</option>
                          <option value="3 Bloques libres (4.5 hrs)">3 Bloques libres (4.5 hrs) · Tarea extensa</option>
                          <option value="4+ Bloques (+6.0 hrs)">4+ Bloques (+6.0 hrs) · Multisesión</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#6b668d] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select
                          value={taskForm.scheduledSlot || '10:00 - 11:30'}
                          onChange={(e) => setTaskForm({ ...taskForm, scheduledSlot: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-2xl bg-[#0b0a17] border border-[#272346] text-white focus:outline-none focus:border-[#a855f7] text-xs cursor-pointer appearance-none pr-8"
                        >
                          <option value="Cualquier bloque libre">Cualquier bloque libre</option>
                          {BLOQUES_HORARIOS.map(bloque => (
                            <option key={bloque} value={bloque}>{bloque}</option>
                          ))}
                        </select>
                        <Clock className="w-3.5 h-3.5 text-[#6b668d] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Fila 2: Días de la semana para dedicarle esas horas + Fecha Límite */}
                    <div className="p-2.5 rounded-2xl bg-[#0b0a17] border border-[#272346] flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] text-[#b5b0cd]">
                        <span className="font-semibold uppercase tracking-wider">Días dedicados de la semana:</span>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            placeholder="Plazo final (ej. 21 oct)"
                            value={taskForm.dueDate}
                            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                            className="bg-transparent border-none text-[10px] text-white placeholder-[#5a5676] focus:outline-none text-right pr-4 w-32"
                          />
                          <Calendar className="w-3 h-3 text-[#6b668d] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Botones de días (Lun a Sáb) */}
                      <div className="grid grid-cols-6 gap-1.5">
                        {[
                          { key: 'Lunes', short: 'Lun' },
                          { key: 'Martes', short: 'Mar' },
                          { key: 'Miércoles', short: 'Mié' },
                          { key: 'Jueves', short: 'Jue' },
                          { key: 'Viernes', short: 'Vie' },
                          { key: 'Sábado', short: 'Sáb' }
                        ].map(day => {
                          const isSelected = (taskForm.scheduledDays || []).includes(day.key);
                          return (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => {
                                const current = taskForm.scheduledDays || [];
                                const updated = isSelected
                                  ? current.filter(d => d !== day.key)
                                  : [...current, day.key];
                                setTaskForm({ ...taskForm, scheduledDays: updated });
                              }}
                              className={`py-1.5 rounded-xl font-bold text-[10px] border transition-all cursor-pointer text-center ${
                                isSelected
                                  ? 'bg-[#271d47] border-[#a855f7] text-[#c084fc] shadow-sm shadow-purple-900/40'
                                  : 'bg-white/5 border-white/5 text-[#7e799c] hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {day.short}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback visual interactivo */}
                      {(taskForm.scheduledDays || []).length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#c084fc] bg-[#271d47]/50 border border-[#6b21a8]/30 px-2 py-1 rounded-xl">
                          <Check className="w-3 h-3 shrink-0 text-[#a855f7]" />
                          <span className="truncate">
                            Dedicación: <strong>{(taskForm.scheduledDays || []).join(', ')}</strong> ({taskForm.scheduledSlot || 'Horario libre'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ⑦ DEPENDENCIAS */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[#b5b0cd] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <span className="text-[#a855f7] font-extrabold text-sm">⑦</span>
                      <span>DEPENDENCIAS</span>
                    </label>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#6b668d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="¿Depende de otra tarea?"
                        value={taskForm.dependency}
                        onChange={(e) => setTaskForm({ ...taskForm, dependency: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-[#0b0a17] border border-[#272346] text-white placeholder-[#5a5676] focus:outline-none focus:border-[#a855f7] text-xs"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* ── SECCIÓN INFERIOR: PRUEBAS DE ACEPTACIÓN (CHECKLIST) ── */}
              <div className="pt-4 border-t border-[#252240] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                      <ListChecks className="w-4 h-4 text-[#a855f7]" />
                      <span>PRUEBAS DE ACEPTACIÓN (CHECKLIST)</span>
                    </h4>
                    <p className="text-xs text-[#8f8aa8] mt-0.5">
                      ¿Cómo sabemos que está terminada? (Criterios de Aceptación)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = (taskForm.checklist?.length || 0) + 1;
                      setTaskForm(prev => ({
                        ...prev,
                        checklist: [...(prev.checklist || []), { id: Date.now(), text: `Prueba ${nextNum}`, completed: false }]
                      }));
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#c084fc] bg-[#271d47] hover:bg-[#32255c] px-3.5 py-1.5 rounded-xl border border-[#6b21a8]/40 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir paso</span>
                  </button>
                </div>

                {/* Lista de pasos del checklist */}
                <div className="flex flex-col gap-2 mt-2">
                  {(taskForm.checklist || []).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0b0a17] border border-[#272346] hover:border-white/20 transition-all group"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-[#5a5676] group-hover:text-slate-300 cursor-grab shrink-0" />
                      
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => {
                          const updated = taskForm.checklist.map(c => c.id === item.id ? { ...c, completed: e.target.checked } : c);
                          const completedCount = updated.filter(c => c.completed).length;
                          const autoProgress = updated.length > 0 ? Math.round((completedCount / updated.length) * 100) : taskForm.progress;
                          setTaskForm({
                            ...taskForm,
                            checklist: updated,
                            progress: autoProgress,
                            status: autoProgress === 100 ? 'finished' : (taskForm.status === 'finished' ? 'in_progress' : taskForm.status)
                          });
                        }}
                        className="w-4 h-4 accent-[#a855f7] rounded cursor-pointer shrink-0"
                      />

                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updated = taskForm.checklist.map(c => c.id === item.id ? { ...c, text: e.target.value } : c);
                          setTaskForm({ ...taskForm, checklist: updated });
                        }}
                        className={`flex-1 bg-transparent border-none text-xs text-white focus:outline-none ${
                          item.completed ? 'line-through text-[#6b668d]' : ''
                        }`}
                        placeholder="Describe el criterio de aceptación..."
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const updated = taskForm.checklist.filter(c => c.id !== item.id);
                          setTaskForm({ ...taskForm, checklist: updated });
                        }}
                        className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-[#6b668d] hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Eliminar paso"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones del Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#252240] mt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#2e3146] hover:bg-[#3d415b] text-slate-200 hover:text-white font-bold cursor-pointer transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold shadow-lg shadow-purple-600/30 cursor-pointer transition-all active:scale-95 text-xs"
                >
                  {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN DE BORRADO DE CATEGORÍA (PASO DE SEGURIDAD) ── */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-2xl bg-[#141226] border border-rose-500/40 p-6 shadow-2xl flex flex-col gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">¿Eliminar categoría?</h4>
                <p className="text-[#8f8aa8] text-xs mt-1">
                  Estás a punto de borrar la categoría <strong className="text-white font-bold">"{categoryToDelete.label}"</strong>.
                </p>
                <p className="text-amber-400/90 text-[11px] mt-2 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                  <span>⚠️</span>
                  <span>Confirmación de seguridad requerida para evitar borrarla por accidente.</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 mt-1">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#2e3146] hover:bg-[#3d415b] text-slate-200 hover:text-white font-bold cursor-pointer transition-all text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-all shadow-lg shadow-rose-900/40 text-xs"
              >
                Sí, eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
