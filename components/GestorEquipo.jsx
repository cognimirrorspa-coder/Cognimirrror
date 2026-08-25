'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, UserPlus, Mail, User, Shield, AlertTriangle, Loader2, CheckCircle2, XCircle, Power, UserCheck } from 'lucide-react';

const ROLES_PREDEFINIDOS = [
  { id: 'psicologo', label: 'Psicólogo(a)', cargoDefault: 'Psicólogo(a) PIE' },
  { id: 'terapeuta', label: 'Terapeuta Ocupacional', cargoDefault: 'Terapeuta Ocupacional' },
  { id: 'fonoaudiologo', label: 'Fonoaudiólogo(a)', cargoDefault: 'Fonoaudiólogo(a) PIE' },
  { id: 'educador_diferencial', label: 'Educador(a) Diferencial', cargoDefault: 'Educador(a) Diferencial' },
  { id: 'psicopedagogo', label: 'Psicopedagogo(a)', cargoDefault: 'Psicopedagogo(a) Institucional' },
  { id: 'kinesiologo', label: 'Kinesiólogo(a)', cargoDefault: 'Kinesiólogo(a) Neurorehabilitación' },
  { id: 'asistente_social', label: 'Trabajador(a) / Asistente Social', cargoDefault: 'Asistente Social PIE' },
  { id: 'neurologo', label: 'Médico / Neurólogo(a)', cargoDefault: 'Neurólogo(a) Infantil / Asesor' },
  { id: 'coordinador_pie', label: 'Coordinador(a) PIE', cargoDefault: 'Coordinador(a) General PIE' },
  { id: 'director', label: 'Director(a) / Administrador(a)', cargoDefault: 'Director(a) Académico(a)' },
  { id: 'otro', label: '+ Otro Rol / Personalizado', cargoDefault: 'Especialista Multidisciplinario' }
];

export default function GestorEquipo({ colegioId, colegioNombre = 'Tu Colegio' }) {
  const { profile } = useAuth();
  const [especialistas, setEspecialistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Formulario de Invitación / Creación
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('psicologo');
  const [customRol, setCustomRol] = useState('');
  const [cargo, setCargo] = useState('Psicólogo(a) PIE');
  const [tempPassword, setTempPassword] = useState('');
  const [inviting, setInviting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchEspecialistas = useCallback(async () => {
    if (!colegioId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('colegio_id', colegioId)
        .order('creado_en', { ascending: false });

      if (error) throw error;
      setEspecialistas(data || []);
    } catch (err) {
      console.warn('[GestorEquipo] Consulta en fallback:', err.message);
      setEspecialistas([]);
    } finally {
      setLoading(false);
    }
  }, [colegioId]);

  useEffect(() => {
    fetchEspecialistas();
  }, [fetchEspecialistas]);

  // Actualizar cargo por defecto al cambiar de rol
  const handleRolChange = (newRol) => {
    setRol(newRol);
    const found = ROLES_PREDEFINIDOS.find(r => r.id === newRol);
    if (found) {
      if (newRol === 'otro') {
        setCustomRol('');
        setCargo('');
      } else {
        setCargo(found.cargoDefault);
      }
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;
    setInviting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const finalRol = rol === 'otro' ? (customRol.trim().toLowerCase().replace(/\s+/g, '_') || 'especialista') : rol;
    const finalCargo = cargo.trim() || (rol === 'otro' ? customRol.trim() : 'Especialista');

    try {
      const res = await fetch('/api/equipo/invitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          rol: finalRol,
          cargo: finalCargo,
          tempPassword: tempPassword.trim() || null,
          colegio_id: colegioId,
          adminName: profile?.nombre_completo || 'Director / Coordinador'
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'No se pudo registrar al profesional.');
      }

      setSuccessMsg('¡Profesional agregado al equipo con éxito!');
      setNombre('');
      setEmail('');
      setCustomRol('');
      setTempPassword('');
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
        fetchEspecialistas();
      }, 1200);
    } catch (err) {
      console.error('[GestorEquipo] Error al invitar:', err.message);
      setErrorMsg(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleToggleActivo = async (id, estadoActual, nombreCompleto) => {
    const nuevoEstado = !estadoActual;
    const actionText = nuevoEstado ? 'reactivar' : 'desactivar temporalmente';
    if (!confirm(`¿Deseas ${actionText} la cuenta de "${nombreCompleto}"?`)) return;

    try {
      const res = await fetch('/api/equipo/toggle-activo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          activo: nuevoEstado,
          colegioId,
          adminName: profile?.nombre_completo || 'Director / Coordinador'
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al cambiar estado.');
      }

      // Actualizar estado local inmediatamente
      setEspecialistas(prev => prev.map(u => u.id === id ? { ...u, activo: nuevoEstado } : u));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id, nombreCompleto) => {
    const confirmed = confirm(
      `¿Estás seguro de desvincular definitivamente a "${nombreCompleto}" de ${colegioNombre}?\n\nLas evaluaciones y telemetrías previas se mantendrán en el historial del colegio para resguardo de auditoría.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/equipo/eliminar?id=${id}&colegio_id=${colegioId}&admin=${encodeURIComponent(profile?.nombre_completo || 'Director')}`, {
        method: 'DELETE'
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'No se pudo eliminar al profesional');
      }

      setEspecialistas(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('[GestorEquipo] Error al eliminar:', err.message);
      alert('Error al desvincular profesional: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header del Gestor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Shield size={22} className="text-purple-400" />
            Equipo Clínico y Control de Acceso (RBAC)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Administra los profesionales autorizados para evaluar y gestionar estudiantes en <strong className="text-slate-200">{colegioNombre}</strong>.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:scale-105 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus size={16} /> Agregar Profesional
        </button>
      </div>

      {/* Lista de Profesionales */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 size={28} className="animate-spin text-purple-400" />
          <span className="text-xs font-mono">Cargando equipo profesional...</span>
        </div>
      ) : especialistas.length === 0 ? (
        <div className="py-12 bg-[#0b0d14] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <User size={22} />
          </div>
          <h4 className="text-white font-bold text-sm">Aún no hay profesionales registrados en este colegio</h4>
          <p className="text-slate-400 text-xs max-w-md">
            Comienza armando el equipo multidisciplinario de {colegioNombre} agregando psicólogos, terapeutas, fonoaudiólogos o educadores.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-300 hover:text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
          >
            + Agregar Primer Profesional
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Profesional</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Cargo Institucional</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Último Acceso</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {especialistas.map((esp) => (
                <tr key={esp.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shrink-0 ${
                      esp.rol === 'director' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
                      esp.rol === 'coordinador_pie' ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' :
                      esp.rol === 'fonoaudiologo' ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' :
                      esp.rol === 'educador_diferencial' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' :
                      esp.rol === 'psicologo' ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' :
                      'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    }`}>
                      {esp.nombre_completo?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="text-white font-bold">{esp.nombre_completo}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{esp.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase font-mono border ${
                      esp.rol === 'director' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                      esp.rol === 'coordinador_pie' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' :
                      esp.rol === 'fonoaudiologo' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' :
                      esp.rol === 'educador_diferencial' ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' :
                      esp.rol === 'psicologo' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {esp.rol?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-300 font-semibold">{esp.cargo_texto || 'Profesional PIE'}</td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleActivo(esp.id, esp.activo !== false, esp.nombre_completo)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                        esp.activo !== false
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                      }`}
                      title={esp.activo !== false ? 'Cuenta activa — Clic para suspender' : 'Cuenta suspendida — Clic para reactivar'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${esp.activo !== false ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      {esp.activo !== false ? 'Activo' : 'Suspendido'}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                    {esp.ultimo_acceso ? new Date(esp.ultimo_acceso).toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'Sin registros'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleDelete(esp.id, esp.nombre_completo)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Desvincular del colegio"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL PARA AGREGAR / INVITAR PROFESIONAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#10131c] border border-white/15 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h4 className="text-lg font-black text-white flex items-center gap-2">
                  <UserPlus size={18} className="text-purple-400" />
                  Nuevo Profesional
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Asignar acceso para {colegioNombre}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ps. Valentina Rivas o Flga. Camila Soto"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#181c28] border border-white/10 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Correo Electrónico Institucional *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@colegio.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181c28] border border-white/10 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Rol en Sistema *
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => handleRolChange(e.target.value)}
                    className="w-full bg-[#181c28] border border-white/10 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    {ROLES_PREDEFINIDOS.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Cargo Descriptivo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Fonoaudióloga PIE"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full bg-[#181c28] border border-white/10 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Si seleccionó 'otro', habilitar campo para especificar el nuevo rol */}
              {rol === 'otro' && (
                <div className="animate-in fade-in duration-200">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1.5">
                    Especificar Nombre del Rol Personalizado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Psicopedagogo, Orientador, Docente PIE, etc."
                    value={customRol}
                    onChange={(e) => {
                      setCustomRol(e.target.value);
                      if (!cargo) setCargo(e.target.value);
                    }}
                    className="w-full bg-[#1e1a2f] border border-purple-500/50 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Contraseña Inicial (Opcional - Mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para enviar link de invitación"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full bg-[#181c28] border border-white/10 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {inviting ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar y Guardar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
