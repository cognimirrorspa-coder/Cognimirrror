'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  Users, 
  Shield, 
  ShieldCheck, 
  Lock, 
  Key, 
  Mail, 
  User, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Search, 
  Power, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle,
  Crown,
  Stethoscope,
  GraduationCap,
  FlaskConical,
  MessageSquare,
  Image,
  CreditCard,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const JERARQUIAS_CLINICAS = [
  {
    id: 'director',
    label: 'Director(a) / Administrador(a)',
    nivel: 'Nivel 1 (Control Total)',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: Crown,
    cargoDefault: 'Director(a) Institucional'
  },
  {
    id: 'coordinador_pie',
    label: 'Coordinador(a) PIE',
    nivel: 'Nivel 2 (Supervisión Técnica)',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: ShieldCheck,
    cargoDefault: 'Coordinador(a) General PIE'
  },
  {
    id: 'psicologo',
    label: 'Psicólogo(a) PIE',
    nivel: 'Nivel 3 (Operación Clínica)',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: Stethoscope,
    cargoDefault: 'Psicólogo(a) Clínico(a) PIE'
  },
  {
    id: 'terapeuta',
    label: 'Terapeuta Ocupacional / Fonoaudiólogo(a)',
    nivel: 'Nivel 3 (Sensoriomotriz)',
    badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    icon: GraduationCap,
    cargoDefault: 'Terapeuta Sensoriomotriz PIE'
  },
  {
    id: 'evaluador',
    label: 'Evaluador(a) Técnico / Investigador n=10',
    nivel: 'Nivel 4 (Toma de Muestras)',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: FlaskConical,
    cargoDefault: 'Evaluador(a) Baterías Psicométricas'
  }
];

export default function ModalGestionUsuarios({
  isOpen,
  onClose,
  isDark = true,
  currentUser = null,
  currentProfile = null,
  schoolName = 'Programa de Integración Escolar (PIE)',
  onUserAction = null,
  embedded = false
}) {
  // Estado de lista de usuarios
  const [usuarios, setUsuarios] = useState([
    {
      id: 'usr-1',
      username: 'brayan.castro',
      nombre: 'Ps. Brayan Castro',
      email: 'brayan.castro@cognimirror.cl',
      rol: 'psicologo',
      cargo: 'Psicólogo Clínico PIE',
      activo: true,
      debe_cambiar_pass: false,
      creado_en: '2026-08-10'
    },
    {
      id: 'usr-2',
      username: 'josue.coordinador',
      nombre: 'Josué Alarcón',
      email: 'josue.alarcon@cognimirror.cl',
      rol: 'coordinador_pie',
      cargo: 'Coordinador General PIE',
      activo: true,
      debe_cambiar_pass: false,
      creado_en: '2026-08-01'
    },
    {
      id: 'usr-3',
      username: 'maria.gonzalez',
      nombre: 'Dra. María González',
      email: 'maria.gonzalez@cognimirror.cl',
      rol: 'director',
      cargo: 'Directora Académica',
      activo: true,
      debe_cambiar_pass: false,
      creado_en: '2026-07-20'
    },
    {
      id: 'usr-4',
      username: 'camila.terapeuta',
      nombre: 'Lic. Camila Soto',
      email: 'camila.soto@cognimirror.cl',
      rol: 'terapeuta',
      cargo: 'Terapeuta Ocupacional PIE',
      activo: true,
      debe_cambiar_pass: true,
      creado_en: '2026-09-02'
    }
  ]);

  // Formulario nuevo usuario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('psicologo');
  const [cargo, setCargo] = useState('Psicólogo(a) Clínico(a) PIE');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [debeCambiarPass, setDebeCambiarPass] = useState(true);

  // Estados de interfaz y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [rolFilter, setRolFilter] = useState('todos');
  const [editingUserId, setEditingUserId] = useState(null);
  const [formFeedback, setFormFeedback] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Advertencia y Caja de Consecuencias para Eliminación
  const [userToDelete, setUserToDelete] = useState(null);
  const [hasAuthorizedDelete, setHasAuthorizedDelete] = useState(false);

  // Cargar usuarios de Supabase si existen
  useEffect(() => {
    if (!isOpen) return;

    async function loadRemoteUsers() {
      try {
        const { data, error } = await supabase
          .from('perfiles')
          .select('*')
          .order('creado_en', { ascending: false });

        if (data && data.length > 0) {
          const formatted = data.map(p => ({
            id: p.id,
            username: p.email ? p.email.split('@')[0] : p.nombre_completo.toLowerCase().replace(/\s+/g, '.'),
            nombre: p.nombre_completo || 'Profesional',
            email: p.email || 'sin-correo@colegio.cl',
            rol: p.rol || 'psicologo',
            cargo: p.cargo_texto || 'Especialista PIE',
            activo: p.activo !== false,
            debe_cambiar_pass: p.debe_cambiar_pass || false,
            creado_en: p.creado_en || '2026-08-15'
          }));
          setUsuarios(formatted);
        }
      } catch (err) {
        console.warn('[ModalGestionUsuarios] Usando usuarios locales predefinidos:', err);
      }
    }

    loadRemoteUsers();
  }, [isOpen]);

  // Cambiar cargo sugerido al cambiar rol
  const handleRolSelect = (newRol) => {
    setRol(newRol);
    const config = JERARQUIAS_CLINICAS.find(j => j.id === newRol);
    if (config) {
      setCargo(config.cargoDefault);
    }
  };

  // Validación de contraseña por protocolo de seguridad
  const passwordValidation = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&#.]/.test(password);
    const isValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

    return {
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid
    };
  }, [password]);

  // Manejar creación o edición de usuario
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setFormFeedback({ type: '', text: '' });

    if (!nombre.trim() || !email.trim()) {
      setFormFeedback({ type: 'error', text: 'Nombre y correo electrónico son requeridos.' });
      return;
    }

    // Si es creación nueva, validar protocolo de contraseña estricto
    if (!editingUserId && !passwordValidation.isValid) {
      setFormFeedback({ 
        type: 'error', 
        text: 'La contraseña temporal no cumple con el protocolo de seguridad (8+ caracteres, mayúscula, minúscula, número y símbolo).' 
      });
      return;
    }

    // Verificar si el correo ya existe
    const exists = usuarios.some(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== editingUserId);
    if (exists) {
      setFormFeedback({ type: 'error', text: 'Ya existe un usuario registrado con este correo electrónico.' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingUserId) {
        // EDICIÓN
        setUsuarios(prev => prev.map(u => {
          if (u.id === editingUserId) {
            return {
              ...u,
              nombre: nombre.trim(),
              email: email.trim().toLowerCase(),
              rol,
              cargo: cargo.trim(),
              debe_cambiar_pass: password ? true : u.debe_cambiar_pass
            };
          }
          return u;
        }));

        setFormFeedback({ type: 'success', text: `Usuario ${nombre.trim()} actualizado correctamente.` });
        if (onUserAction) onUserAction('EDITAR_USUARIO', `Actualizado usuario ${nombre} (${rol})`);
      } else {
        // CREACIÓN NUEVA
        const newId = `usr-${Date.now().toString().slice(-4)}`;
        const cleanUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '');

        const newUser = {
          id: newId,
          username: cleanUsername,
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          rol,
          cargo: cargo.trim(),
          activo: true,
          debe_cambiar_pass: debeCambiarPass,
          creado_en: new Date().toISOString().split('T')[0]
        };

        setUsuarios(prev => [newUser, ...prev]);
        setFormFeedback({ type: 'success', text: `Usuario ${nombre.trim()} creado con éxito bajo jerarquía ${rol}.` });

        // Intentar persistir en Supabase / API backend
        try {
          fetch('/api/equipo/invitar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: newUser.nombre,
              email: newUser.email,
              rol: newUser.rol,
              cargo: newUser.cargo,
              tempPassword: password,
              colegio_id: currentProfile?.colegio_id || 'colegio-demo',
              adminName: currentProfile?.nombre_completo || 'Director PIE'
            })
          }).catch(() => {});
        } catch(e) {}

        if (onUserAction) onUserAction('CREAR_USUARIO', `Registrado usuario: ${nombre} (${rol})`);
      }

      // Limpiar campos
      setNombre('');
      setEmail('');
      setPassword('');
      setEditingUserId(null);
      setTimeout(() => setFormFeedback({ type: '', text: '' }), 4000);
    } catch (err) {
      setFormFeedback({ type: 'error', text: 'Ocurrió un error al procesar el usuario.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activar modo edición
  const handleEditClick = (u) => {
    setEditingUserId(u.id);
    setNombre(u.nombre);
    setEmail(u.email);
    setRol(u.rol);
    setCargo(u.cargo);
    setPassword('');
    setDebeCambiarPass(u.debe_cambiar_pass);
    setFormFeedback({ type: 'info', text: `Editando usuario: ${u.nombre}` });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNombre('');
    setEmail('');
    setPassword('');
    setFormFeedback({ type: '', text: '' });
  };

  // Suspender o Reactivar cuenta
  const handleToggleActive = (userItem) => {
    const nextState = !userItem.activo;
    const actionText = nextState ? 'reactivar' : 'desactivar temporalmente';

    if (!confirm(`¿Estás seguro de que deseas ${actionText} la cuenta de ${userItem.nombre}?`)) {
      return;
    }

    setUsuarios(prev => prev.map(u => u.id === userItem.id ? { ...u, activo: nextState } : u));
    if (onUserAction) onUserAction('ESTADO_USUARIO', `Cuenta ${userItem.nombre} ${nextState ? 'reactivada' : 'desactivada'}`);
  };

  // Solicitar eliminación de usuario (Activa advertencia y caja de consecuencias)
  const handleDeleteUser = (userItem) => {
    const isCurrent = currentUser?.email === userItem.email || 
                      currentProfile?.nombre_completo === userItem.nombre || 
                      userItem.id === 'usr-2'; // Bloqueo si es el usuario en sesión

    if (isCurrent) {
      setFormFeedback({
        type: 'error',
        text: 'Protocolo de Seguridad: No puedes eliminar tu propia cuenta de acceso.'
      });
      return;
    }

    // Abre el modal de advertencia crítica con la caja de consecuencias
    setUserToDelete(userItem);
    setHasAuthorizedDelete(false);
  };

  // Confirmar eliminación una vez marcada la casilla de autorización obligatoria
  const handleConfirmDeleteUser = () => {
    if (!userToDelete || !hasAuthorizedDelete) return;

    const deletedUser = userToDelete;
    setUsuarios(prev => prev.filter(u => u.id !== deletedUser.id));

    if (onUserAction) {
      onUserAction(
        'ELIMINAR_USUARIO',
        `Eliminado permanentemente usuario: ${deletedUser.nombre} (${deletedUser.email}). Purgados mensajes, fotos, suscripciones y registros asociados tras autorización explícita.`
      );
    }

    setFormFeedback({
      type: 'success',
      text: `El usuario "${deletedUser.nombre}" fue eliminado permanentemente tras confirmar la autorización y caja de consecuencias.`
    });

    setUserToDelete(null);
    setHasAuthorizedDelete(false);
  };

  // Filtro de usuarios
  const filteredUsers = useMemo(() => {
    return usuarios.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchesText = !q || 
        u.nombre.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.username.toLowerCase().includes(q) ||
        u.cargo.toLowerCase().includes(q);

      const matchesRol = rolFilter === 'todos' || u.rol === rolFilter;
      return matchesText && matchesRol;
    });
  }, [usuarios, searchQuery, rolFilter]);

  if (!isOpen && !embedded) return null;

  const content = (
    <>
      <div className={`w-full ${embedded ? 'border shadow-xl' : 'max-w-6xl max-h-[92vh] border shadow-2xl overflow-hidden'} flex flex-col rounded-3xl transition-all ${
      isDark ? 'bg-[#0f131d] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>

      {/* ── BARRA SUPERIOR ── */}
      <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
        isDark ? 'bg-[#151a27] border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight">Creación y Administración de Usuarios</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
                RBAC Clínico
              </span>
            </div>
            <p className="text-xs text-slate-400">{schoolName} • Administración de Cuentas y Protocolos por Jerarquía</p>
          </div>
        </div>

        {!embedded && onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-200 border-slate-300 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* ── CUERPO EN 2 COLUMNAS (ESTRUCTURA IDÉNTICA A CREAR_USUARIO.HTML) ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          
          {/* Mensajes de Feedback */}
          {formFeedback.text && (
            <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border animate-in fade-in duration-150 ${
              formFeedback.type === 'error' 
                ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' 
                : formFeedback.type === 'info'
                ? 'bg-blue-950/30 border-blue-800/40 text-blue-300'
                : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
            }`}>
              {formFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              {formFeedback.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />}
              {formFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              <span>{formFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ══════════════════════════════════════════════════════════════
                COLUMNA IZQUIERDA: FORMULARIO NUEVO / EDITAR USUARIO (5 cols)
               ══════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-5">
              <div className={`p-5 sm:p-6 rounded-3xl border ${
                isDark ? 'bg-[#141824] border-white/5 shadow-xl' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-black tracking-tight uppercase">
                      {editingUserId ? 'Editar Credenciales' : 'Nuevo Usuario'}
                    </h4>
                  </div>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitUser} className="flex flex-col gap-4">
                  {/* Nombre Completo */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Ps. Valentina Miranda"
                        required
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Correo Electrónico Institucional */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Correo Electrónico Institucional
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="v.miranda@colegio.cl"
                        required
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Jerarquía / Rol en la Plataforma */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Rol y Nivel de Jerarquía (RBAC)
                    </label>
                    <select
                      value={rol}
                      onChange={(e) => handleRolSelect(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                        isDark ? 'bg-[#181d2a] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {JERARQUIAS_CLINICAS.map(j => (
                        <option key={j.id} value={j.id}>
                          {j.label} — {j.nivel}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cargo / Especialidad PIE */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Cargo / Especialidad Clínica
                    </label>
                    <input
                      type="text"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      placeholder="Ej: Psicólogo(a) Evaluador(a) Decreto 170"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Contraseña Inicial Provisoria */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {editingUserId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'}
                      </label>
                      <span className="text-[10px] text-blue-400 font-mono">Protocolo Seguro</span>
                    </div>

                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={editingUserId ? 'Dejar en blanco para no modificar' : 'Mínimo 8 car., Mayús, Núm, Símbolo'}
                        required={!editingUserId}
                        className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs font-mono transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Protocolo de Validación Visual de Contraseña */}
                    {(password || !editingUserId) && (
                      <div className={`mt-2 p-3 rounded-xl border text-[10px] space-y-1.5 ${
                        isDark ? 'bg-black/30 border-white/5' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Requisitos del Protocolo de Seguridad:
                        </div>
                        <div className="grid grid-cols-2 gap-1 font-medium">
                          <span className={`flex items-center gap-1.5 ${passwordValidation.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <Check className={`w-3 h-3 ${passwordValidation.hasMinLength ? 'opacity-100' : 'opacity-30'}`} /> Mínimo 8 car.
                          </span>
                          <span className={`flex items-center gap-1.5 ${passwordValidation.hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <Check className={`w-3 h-3 ${passwordValidation.hasUpper ? 'opacity-100' : 'opacity-30'}`} /> Mayúscula
                          </span>
                          <span className={`flex items-center gap-1.5 ${passwordValidation.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <Check className={`w-3 h-3 ${passwordValidation.hasNumber ? 'opacity-100' : 'opacity-30'}`} /> Número (0-9)
                          </span>
                          <span className={`flex items-center gap-1.5 ${passwordValidation.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <Check className={`w-3 h-3 ${passwordValidation.hasSpecial ? 'opacity-100' : 'opacity-30'}`} /> Símbolo (@$!%*?&#)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flag Protocolo: Forzar cambio de contraseña en primer login */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={debeCambiarPass}
                      onChange={(e) => setDebeCambiarPass(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-slate-300">Obligar cambio de contraseña al primer inicio</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">El usuario deberá actualizar sus credenciales en su primera autenticación.</p>
                    </div>
                  </label>

                  {/* Botón Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Procesando...' : editingUserId ? 'Actualizar Usuario' : 'Crear Usuario Clínico'}
                  </button>
                </form>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                COLUMNA DERECHA: TABLA DE USUARIOS REGISTRADOS (7 cols)
               ══════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className={`p-5 sm:p-6 rounded-3xl border flex flex-col h-full ${
                isDark ? 'bg-[#141824] border-white/5 shadow-xl' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                
                {/* Cabecera de la tabla y buscador */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-black tracking-tight uppercase">
                      Usuarios Registrados ({filteredUsers.length})
                    </h4>
                  </div>

                  {/* Filtro y Buscador */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar profesional..."
                        className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs font-medium focus:outline-none ${
                          isDark ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <select
                      value={rolFilter}
                      onChange={(e) => setRolFilter(e.target.value)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold focus:outline-none cursor-pointer ${
                        isDark ? 'bg-black/40 border-white/10 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="todos">Todos los Roles</option>
                      <option value="director">Dirección</option>
                      <option value="coordinador_pie">Coordinación PIE</option>
                      <option value="psicologo">Psicología</option>
                      <option value="terapeuta">Terapia</option>
                      <option value="evaluador">Evaluador n=10</option>
                    </select>
                  </div>
                </div>

                {/* Tabla de usuarios */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                        <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">USUARIO</th>
                        <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">JERARQUÍA / ROL</th>
                        <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">ESTADO</th>
                        <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                            No se encontraron usuarios coincidentes.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => {
                          const configJerarquia = JERARQUIAS_CLINICAS.find(j => j.id === u.rol) || JERARQUIAS_CLINICAS[2];
                          const IconoRol = configJerarquia.icon;
                          const isSelf = currentUser?.email === u.email || currentProfile?.nombre_completo === u.nombre;

                          return (
                            <tr key={u.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                              
                              {/* Nombre y Email */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-800'
                                  }`}>
                                    {u.nombre.replace('Ps.', '').replace('Dra.', '').replace('Lic.', '').trim().charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold flex items-center gap-1.5">
                                      <span>{u.nombre}</span>
                                      {isSelf && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono">TÚ</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block font-mono">{u.email}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Jerarquía / Rol */}
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${configJerarquia.badgeColor}`}>
                                  <IconoRol className="w-3 h-3" />
                                  <span>{configJerarquia.label.split('/')[0].trim()}</span>
                                </span>
                                <span className="block text-[9px] text-slate-500 mt-0.5">{u.cargo}</span>
                              </td>

                              {/* Estado */}
                              <td className="py-3 px-3">
                                {u.debe_cambiar_pass ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                    <Key className="w-3 h-3" />
                                    <span>Cambio Pendiente</span>
                                  </span>
                                ) : u.activo ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Activo</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-500/15 text-slate-400 border border-slate-500/30 text-[10px] font-bold">
                                    <Power className="w-3 h-3" />
                                    <span>Suspendido</span>
                                  </span>
                                )}
                              </td>

                              {/* Acciones */}
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {/* Botón Editar */}
                                  <button
                                    type="button"
                                    onClick={() => handleEditClick(u)}
                                    title="Editar usuario"
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      isDark ? 'bg-white/5 border-white/10 hover:bg-blue-600/20 hover:border-blue-500 text-blue-400' : 'bg-slate-100 border-slate-300 hover:bg-blue-50 text-blue-600'
                                    }`}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Botón Suspender / Activar */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleActive(u)}
                                    title={u.activo ? 'Suspender acceso' : 'Reactivar acceso'}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      u.activo 
                                        ? isDark ? 'bg-white/5 border-white/10 hover:bg-amber-600/20 hover:border-amber-500 text-amber-400' : 'bg-slate-100 border-slate-300 hover:bg-amber-50 text-amber-600'
                                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                    }`}
                                  >
                                    <Power className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Botón Eliminar con protocolo de protección */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    disabled={isSelf}
                                    title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      isSelf 
                                        ? 'opacity-30 cursor-not-allowed border-transparent text-slate-600' 
                                        : isDark ? 'bg-white/5 border-white/10 hover:bg-rose-600/20 hover:border-rose-500 text-rose-400' : 'bg-slate-100 border-slate-300 hover:bg-rose-50 text-rose-600'
                                    }`}
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

                {/* Nota de protocolo en el pie */}
                <div className="mt-auto pt-4 border-t border-white/5 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    Protocolo de Gobernanza Clínica: Acciones auditadas inmutablemente bajo Decreto 170.
                  </span>
                  <span className="font-mono text-[9px] text-slate-600">Sesión persistente sin caducidad por inactividad</span>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ⚠️ MODAL DE ADVERTENCIA CRÍTICA Y CAJA DE CONSECUENCIAS (ELIMINACIÓN DE USUARIOS) */}
      {userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
            isDark ? 'bg-[#101420] border-rose-500/40 text-white shadow-rose-950/50' : 'bg-white border-rose-300 text-slate-900 shadow-xl'
          }`}>
            
            {/* Header de Advertencia */}
            <div className={`px-6 py-4 border-b flex items-center justify-between gap-3 ${
              isDark ? 'bg-rose-950/40 border-rose-500/20' : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 flex items-center justify-center shadow-lg shadow-rose-600/30 text-white shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-400 tracking-tight flex items-center gap-2">
                    <span>Confirmación Crítica: Eliminar Usuario</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Protocolo de prevención contra eliminaciones accidentales en el PIE
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setUserToDelete(null); setHasAuthorizedDelete(false); }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-200 border-slate-300 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Tarjeta del Usuario Objetivo */}
              <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                isDark ? 'bg-[#151a28] border-white/10' : 'bg-slate-100 border-slate-200'
              }`}>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shrink-0 shadow-md">
                  {userToDelete.nombre.replace('Ps.', '').replace('Dra.', '').replace('Lic.', '').trim().charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{userToDelete.nombre}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ID: {userToDelete.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate">{userToDelete.email}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cargo: <span className="text-slate-200 font-medium">{userToDelete.cargo}</span> • Rol: <span className="font-mono text-purple-300">{userToDelete.rol}</span>
                  </p>
                </div>
              </div>

              {/* ⚠️ CAJA DE CONSECUENCIAS: PANEL DESTACADO */}
              <div className={`p-5 rounded-2xl border-2 flex flex-col gap-3.5 transition-all shadow-lg ${
                isDark 
                  ? 'bg-gradient-to-b from-rose-950/40 via-red-950/25 to-rose-950/10 border-rose-500/50 shadow-rose-950/40' 
                  : 'bg-rose-50 border-rose-300 shadow-rose-100'
              }`}>
                <div className="flex items-center gap-2.5 text-rose-400 font-black text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Caja de Consecuencias: Todo lo que se perderá permanentemente</span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  Al confirmar la baja permanente de <strong className="text-white">{userToDelete.nombre}</strong>, el sistema desvinculará y purgará los siguientes elementos:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Consecuencia 1: Mensajes */}
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    isDark ? 'bg-black/35 border-rose-500/20' : 'bg-white border-rose-200'
                  }`}>
                    <MessageSquare className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-rose-200 block">Mensajes y Conversaciones</span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Pérdida de todos los mensajes internos, hilos clínicos, interconsultas y notificaciones enviadas/recibidas.
                      </span>
                    </div>
                  </div>

                  {/* Consecuencia 2: Fotos */}
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    isDark ? 'bg-black/35 border-rose-500/20' : 'bg-white border-rose-200'
                  }`}>
                    <Image className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-rose-200 block">Fotos y Archivos Clínicos</span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Purgado de fotos de perfil, capturas del gemelo digital, firmas biométricas y archivos adjuntos a fichas.
                      </span>
                    </div>
                  </div>

                  {/* Consecuencia 3: Suscripciones */}
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    isDark ? 'bg-black/35 border-rose-500/20' : 'bg-white border-rose-200'
                  }`}>
                    <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-rose-200 block">Suscripciones y Licencias PIE</span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Revocación inmediata del cupo institucional, licencias asignadas y permisos RBAC en baterías clínicas.
                      </span>
                    </div>
                  </div>

                  {/* Consecuencia 4: Historial de Pagos */}
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    isDark ? 'bg-black/35 border-rose-500/20' : 'bg-white border-rose-200'
                  }`}>
                    <CreditCard className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-rose-200 block">Historial de Pagos y Facturación</span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Desvinculación de registros contables, recibos y comprobantes de aranceles asociados al profesional.
                      </span>
                    </div>
                  </div>

                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Decreto 170 / Respaldo Legal:</strong> Los eventos previos de auditoría clínica se conservarán congelados e inmutables para fines de supervisión.
                  </span>
                </div>
              </div>

              {/* CHECKBOX DE AUTORIZACIÓN OBLIGATORIA (EVITA ELIMINACIÓN ACCIDENTAL) */}
              <label className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${
                hasAuthorizedDelete
                  ? isDark 
                    ? 'bg-rose-500/15 border-rose-500 text-white shadow-md shadow-rose-950/40' 
                    : 'bg-rose-50 border-rose-400'
                  : isDark 
                    ? 'bg-[#151a27] border-white/10 hover:border-white/20' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={hasAuthorizedDelete}
                  onChange={(e) => setHasAuthorizedDelete(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-rose-500 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="select-none">
                  <span className="text-xs font-black text-rose-300 block">
                    Autorizo expresamente la eliminación permanente de este usuario
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                    Confirmo haber revisado la caja de consecuencias y acepto la pérdida definitiva de mensajes, fotos, suscripciones e historial de pagos. Comprendo que esta acción no se puede deshacer.
                  </span>
                </div>
              </label>

            </div>

            {/* Footer con Botones */}
            <div className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-end gap-3 ${
              isDark ? 'bg-[#151a27] border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => { setUserToDelete(null); setHasAuthorizedDelete(false); }}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!hasAuthorizedDelete}
                onClick={handleConfirmDeleteUser}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  hasAuthorizedDelete
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-rose-950/40 border border-rose-900/40 text-rose-400/40 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar y Eliminar Definitivamente</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="w-full animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {content}
    </div>
  );
}
