'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Trash2, UserPlus, Mail, User, Shield, AlertTriangle, Loader2 } from 'lucide-react';

export default function GestorEquipo({ colegioId }) {
  const [especialistas, setEspecialistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchEspecialistas = useCallback(async () => {
    if (!colegioId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('colegio_id', colegioId)
        .eq('rol', 'especialista')
        .order('nombre_completo', { ascending: true });

      if (error) throw error;
      setEspecialistas(data || []);
    } catch (err) {
      console.error('[GestorEquipo] Error cargando especialistas:', err.message);
    } finally {
      setLoading(false);
    }
  }, [colegioId]);

  useEffect(() => {
    fetchEspecialistas();
  }, [fetchEspecialistas]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;
    setInviting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/equipo/invitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          colegio_id: colegioId
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'No se pudo enviar la invitación');
      }

      alert('¡Especialista invitado con éxito! Se le ha enviado un correo de bienvenida.');
      setNombre('');
      setEmail('');
      setShowAddModal(false);
      fetchEspecialistas();
    } catch (err) {
      console.error('[GestorEquipo] Error al invitar:', err.message);
      setErrorMsg(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async (id, nombreCompleto) => {
    const confirmed = confirm(
      `¿Estás seguro de desvincular al especialista "${nombreCompleto}"?\n\nSus evaluaciones previas se mantendrán en el historial del colegio para resguardo de estadísticas.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/equipo/eliminar?id=${id}`, {
        method: 'DELETE'
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'No se pudo eliminar al especialista');
      }

      alert('Especialista desvinculado correctamente.');
      fetchEspecialistas();
    } catch (err) {
      console.error('[GestorEquipo] Error al eliminar:', err.message);
      alert('Error al desvincular especialista: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white">Miembros del Equipo Especialista</h2>
          <p className="text-xs text-slate-500 mt-1">
            Administra los accesos de los terapeutas y psicólogos autorizados de tu establecimiento.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-lg shadow-blue-600/10"
        >
          <UserPlus size={14} />
          Invitar Especialista
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span className="text-xs font-mono">Cargando nómina de especialistas...</span>
        </div>
      ) : especialistas.length === 0 ? (
        <div className="py-16 text-center border border-white/5 bg-white/[0.01] rounded-2xl">
          <Shield className="mx-auto text-white/10 mb-4" size={48} />
          <h4 className="text-white/60 font-bold">Sin Especialistas</h4>
          <p className="text-xs text-slate-600 mt-1">No hay especialistas registrados en este colegio todavía.</p>
        </div>
      ) : (
        <div className="bg-[#13161e] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-widest font-black text-slate-500">
                <th className="px-6 py-4">Nombre Especialista</th>
                <th className="px-6 py-4">Email / Cuenta</th>
                <th className="px-6 py-4">Rol en Colegio</th>
                <th className="px-6 py-4 text-center">Desvincular</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {especialistas.map((esp) => (
                <tr key={esp.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-xs">
                      {esp.nombre_completo?.charAt(0).toUpperCase() || 'E'}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{esp.nombre_completo}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {esp.id.substring(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                    {esp.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] rounded font-bold uppercase tracking-wider">
                      Especialista PIE
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(esp.id, esp.nombre_completo)}
                      className="p-2 text-slate-500 hover:text-red-400 bg-white/0 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all cursor-pointer inline-flex"
                      title="Dar de baja especialista"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Invitar Especialista */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md p-6 relative z-10 rounded-2xl shadow-2xl">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <UserPlus size={20} className="text-blue-500" />
              Invitar Especialista PIE
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              El especialista recibirá un correo electrónico con instrucciones para configurar su contraseña y acceder al colegio.
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-2 items-start mb-4">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                  <User size={10} /> Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Psic. Esteban Ruiz"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                  <Mail size={10} /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="esteban.ruiz@colegio.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-6 py-2.5 bg-white hover:bg-blue-600 hover:text-white text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="animate-spin" size={12} />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Invitación'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
