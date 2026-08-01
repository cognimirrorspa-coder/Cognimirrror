'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientsDB } from '../../hooks/usePatientsDB';
import { Users, Plus, Brain, Zap, ArrowLeft, Calendar, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function PatientDirectory() {
  const router = useRouter();
  const { patients, createPatient } = usePatientsDB();
  const { signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientIdSujeto, setNewPatientIdSujeto] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.idSujeto && p.idSujeto.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    const p = await createPatient(newPatientName, newPatientIdSujeto.trim() || null);
    setNewPatientName('');
    setNewPatientIdSujeto('');
    setShowAddModal(false);
    if (p && p.id) {
      router.push(`/patients/${p.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-200 font-sans relative overflow-hidden">
      
      {/* Fondo Decorativo de Alta Gama */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#3b82f6_0%,transparent_70%)] mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12 relative z-10">
        
        {/* Header Premium */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/5 pb-8">
          <div className="w-full md:w-auto flex-1">
            <div className="flex justify-between items-center w-full mb-6">
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/30 hover:text-white text-xs tracking-widest uppercase font-bold transition-colors">
                <ArrowLeft size={14} /> Regresar a Panel
              </Link>
              <button 
                onClick={signOut} 
                className="inline-flex items-center gap-2 text-red-400/60 hover:text-red-400 text-xs tracking-widest uppercase font-bold transition-colors bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 px-3 py-1.5 rounded"
              >
                🔒 Cerrar Sesión
              </button>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/30">
              Directorio.
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-md leading-relaxed">
              Sistema de gestión longitudinal. Selecciona un perfil para acceder a su evolución cognitiva y métricas de desempeño.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative group flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-white/30 group-focus-within:text-blue-400 transition-colors">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar identificador..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-none px-4 py-3 pl-11 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all placeholder:text-slate-600 font-mono"
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="group relative px-6 py-3 bg-transparent border border-white/20 text-white font-bold text-sm tracking-wide overflow-hidden flex items-center gap-2 hover:border-blue-500/50 transition-colors"
            >
              <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Plus size={16} className="relative z-10 text-blue-400" /> 
              <span className="relative z-10">REGISTRAR</span>
            </button>
          </div>
        </header>

        {/* Lista de Pacientes - Diseño "Bento" Híbrido Horizontal */}
        {filteredPatients.length === 0 ? (
          <div className="text-center py-32 border border-white/5 bg-white/[0.01]">
            <Users className="mx-auto text-white/10 mb-6" size={64} />
            <h3 className="text-2xl font-black tracking-tight text-white/40 mb-2">Sin Resultados</h3>
            <p className="text-white/20 text-sm">No se encontraron perfiles clínicos en la base de datos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map(patient => {
              const reactionCount = patient.sessions.filter(s => (s.testType || 'reaction') === 'reaction').length;
              const memoryCount = patient.sessions.filter(s => s.testType === 'memory').length;
              
              return (
                <div 
                  key={patient.id} 
                  onClick={() => router.push(`/patients/${patient.id}`)}
                  className="group relative bg-white/[0.02] border border-white/5 p-6 cursor-pointer overflow-hidden transition-all duration-500 hover:bg-white/[0.04] hover:border-blue-500/30"
                >
                  {/* Deco Hover Line */}
                  <div className="absolute top-0 left-0 w-1 h-0 bg-blue-500 group-hover:h-full transition-all duration-500 ease-out" />
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-black border border-white/10 flex items-center justify-center font-serif text-2xl text-white/60 group-hover:text-white group-hover:border-blue-500/40 transition-colors shadow-inner">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-blue-100 transition-colors">{patient.name}</h3>
                          {patient.idSujeto && (
                            <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-black rounded-md tracking-wider uppercase font-mono">
                              {patient.idSujeto}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500 font-mono mt-1">
                          <Calendar size={10} />
                          {new Date(patient.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(patient.id);
                            alert(`UUID de ${patient.name} copiado al portapapeles!`);
                          }}
                          className="mt-2 text-[10px] font-mono text-slate-500 hover:text-blue-400 hover:border-blue-500/20 transition-all flex items-center gap-1 cursor-pointer bg-white/[0.02] border border-white/10 px-2 py-1 rounded-md"
                          title="Click para copiar UUID"
                        >
                          <span>UUID: {patient.id}</span>
                          <span>📋</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-white/10 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  
                  <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-black/40 border border-white/5 p-3 flex items-center justify-between group-hover:border-blue-500/20 transition-colors">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                        <Zap size={12} className="text-blue-500" /> REACTION
                      </span>
                      <span className="font-mono text-sm font-bold text-white/80">{reactionCount}</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-3 flex items-center justify-between group-hover:border-purple-500/20 transition-colors">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                        <Brain size={12} className="text-purple-500" /> MEMORY
                      </span>
                      <span className="font-mono text-sm font-bold text-white/80">{memoryCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Crear Paciente (Minimalista) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg p-8 relative z-10 shadow-2xl">
              <div className="mb-8 border-b border-white/10 pb-6">
                <h2 className="text-xl font-black tracking-tighter text-white">Nuevo Perfil Clínico</h2>
                <p className="text-sm text-slate-500 mt-1">Ingresa el identificador o nombre del paciente.</p>
              </div>
              
              <form onSubmit={handleAddPatient}>
                <div className="mb-6">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-lg font-medium text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-white/20"
                    autoFocus
                    required
                  />
                </div>
                <div className="mb-8">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">ID Sujeto (Estudio / Excel)</label>
                  <input 
                    type="text" 
                    value={newPatientIdSujeto}
                    onChange={(e) => setNewPatientIdSujeto(e.target.value)}
                    placeholder="Ej: S-01 (Opcional)"
                    className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-white/20"
                  />
                </div>
                <div className="flex gap-4 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 text-xs font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-white text-black text-xs font-black tracking-widest uppercase hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
