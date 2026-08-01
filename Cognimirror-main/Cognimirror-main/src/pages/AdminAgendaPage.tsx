// AdminAgendaPage.tsx - Sala de control interna para gestionar disponibilidad e informe de tesis
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, User, Clock, Trash, 
  CheckCircle, Users, BarChart3, Plus, RefreshCw, 
  AlertCircle, ShieldCheck, Moon, Coffee, CalendarDays, Loader2
} from 'lucide-react';
// @ts-ignore
import { supabase } from '../utils/supabaseClient';

interface AdminAgendaPageProps {
  onNavigate: (page: string) => void;
}

interface Evaluador {
  id: string;
  nombre: string;
}

interface Bloque {
  id: string;
  evaluador_id: string;
  fecha_hora: string;
  disponible: boolean;
  evaluador?: Evaluador;
  reserva?: {
    id: string;
    nombre_alumno: string;
    email_alumno: string;
    horas_sueno: number;
    consumo_estimulantes: boolean;
  };
}

export const AdminAgendaPage = ({ onNavigate }: AdminAgendaPageProps) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Datos
  const [evaluadores, setEvaluadores] = useState<Evaluador[]>([]);
  const [bloques, setBloques] = useState<Bloque[]>([]);

  // Formulario Creación de Bloques
  const [selectedEvaluadorId, setSelectedEvaluadorId] = useState('');
  const [fechaBloque, setFechaBloque] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('12:00');

  // Filtros de visualización
  const [filtroEvaluador, setFiltroEvaluador] = useState<string>('all');
  const [filtroEstado, setFiltroEstado] = useState<string>('all'); // all | free | reserved

  // Cargar datos al montar
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Cargar evaluadores
      const { data: evs, error: evsError } = await supabase
        .from('evaluadores')
        .select('*')
        .order('nombre');
      
      if (evsError) throw evsError;
      setEvaluadores(evs || []);
      if (evs && evs.length > 0) {
        setSelectedEvaluadorId(evs[0].id);
      }

      // 2. Cargar bloques con sus correspondientes reservas
      const { data: bls, error: blsError } = await supabase
        .from('bloques_disponibles')
        .select('*, evaluador:evaluadores(*)')
        .order('fecha_hora');

      if (blsError) throw blsError;

      // Cargar reservas
      const { data: res, error: resError } = await supabase
        .from('reservas')
        .select('*');

      if (resError) throw resError;

      // Unir datos localmente
      const bloquesCompletos: Bloque[] = (bls || []).map((b: any) => {
        const reserva = (res || []).find((r: any) => r.bloque_id === b.id);
        return {
          ...b,
          reserva
        };
      });

      setBloques(bloquesCompletos);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la información de la agenda.');
    } finally {
      setLoading(false);
    }
  };

  // Creación masiva (Bulk Insert) de bloques de 20 minutos
  const handleCreateBlocks = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedEvaluadorId || !fechaBloque || !horaInicio || !horaFin) {
      setError('Por favor, completa todos los campos para crear los bloques.');
      return;
    }

    const startDateTime = new Date(`${fechaBloque}T${horaInicio}`);
    const endDateTime = new Date(`${fechaBloque}T${horaFin}`);

    if (startDateTime >= endDateTime) {
      setError('La hora de inicio debe ser anterior a la hora de término.');
      return;
    }

    setActionLoading(true);

    try {
      const generatedBlocks = [];
      let current = new Date(startDateTime);

      while (current < endDateTime) {
        generatedBlocks.push({
          evaluador_id: selectedEvaluadorId,
          fecha_hora: current.toISOString(),
          disponible: true
        });
        current = new Date(current.getTime() + 20 * 60 * 1000); // Avanzar 20 min
      }

      if (generatedBlocks.length === 0) {
        throw new Error("No se generaron bloques. Revisa el rango horario.");
      }

      // Inserción en bloque
      const { error: insertError } = await supabase
        .from('bloques_disponibles')
        .insert(generatedBlocks);

      if (insertError) throw insertError;

      setSuccessMsg(`¡Se crearon exitosamente ${generatedBlocks.length} bloques de tiempo!`);
      fetchInitialData(); // Recargar datos
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al generar los bloques.');
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar un bloque
  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este bloque de disponibilidad? Se eliminará la reserva asociada si existe.')) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('bloques_disponibles')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
      setSuccessMsg('Bloque eliminado correctamente.');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el bloque.');
    } finally {
      setActionLoading(false);
    }
  };

  // Asignar colores Hex según el evaluador
  const getEvaluadorColor = (nombre: string) => {
    if (nombre.includes('Matías')) return { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-600', dot: 'bg-blue-500' };
    if (nombre.includes('Josué')) return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-600', dot: 'bg-emerald-500' };
    if (nombre.includes('Brayan')) return { border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'bg-orange-600', dot: 'bg-orange-500' };
    return { border: 'border-slate-800', bg: 'bg-slate-900', text: 'text-slate-400', badge: 'bg-slate-700', dot: 'bg-slate-600' };
  };

  // Formatear fechas
  const formatBlockDate = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `${dias[fecha.getDay()]} ${fecha.getDate()}/${fecha.getMonth() + 1}`;
  };

  const formatBlockTime = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Filtrar bloques
  const getFilteredBlocks = () => {
    return bloques.filter(b => {
      const matchEv = filtroEvaluador === 'all' || b.evaluador_id === filtroEvaluador;
      const matchState = 
        filtroEstado === 'all' || 
        (filtroEstado === 'free' && b.disponible) || 
        (filtroEstado === 'reserved' && !b.disponible);
      return matchEv && matchState;
    });
  };

  // ================= CÓMPUTO DE MÉTRICAS (TESIS) =================
  const totalReservas = bloques.filter(b => !b.disponible).length;
  const totalBloques = bloques.length;
  const tasaOcupacion = totalBloques > 0 ? Math.round((totalReservas / totalBloques) * 100) : 0;

  const getLoadDistribution = () => {
    const counts: { [key: string]: number } = {};
    evaluadores.forEach(e => { counts[e.nombre] = 0; });
    
    bloques.forEach(b => {
      if (!b.disponible && b.evaluador) {
        counts[b.evaluador.nombre] = (counts[b.evaluador.nombre] || 0) + 1;
      }
    });
    return counts;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-4 relative">
      {/* Luces decorativas */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto max-w-6xl text-center space-y-4 z-10">
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
            <div className="flex flex-col text-left">
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Sala de Control: Estudio 2026
              </h1>
              <p className="text-xs text-slate-500">Panel de Administración de Agendamientos</p>
            </div>
          </div>
          
          <button 
            onClick={fetchInitialData}
            disabled={loading}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto max-w-6xl flex-1 grid lg:grid-cols-12 gap-8 my-8 relative z-10">
        
        {/* Lado Izquierdo: Métricas y Creación de Bloques (col-4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          {/* C. Panel de Métricas */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Métricas del Estudio (Tesis)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Total Reservas */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Alumnos</span>
                <span className="text-2xl font-black text-white">{totalReservas}</span>
                <span className="text-[9px] text-slate-400 block mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-500" /> Sujetos Agendados
                </span>
              </div>

              {/* Tasa Ocupación */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Tasa Ocupación</span>
                <span className="text-2xl font-black text-cyan-400">{tasaOcupacion}%</span>
                <span className="text-[9px] text-slate-400 block mt-1">
                  {totalReservas} de {totalBloques} bloques
                </span>
              </div>
            </div>

            {/* Carga por Evaluador */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase font-bold border-b border-white/5 pb-1">Distribución de Carga</span>
              <div className="space-y-1.5 pt-1">
                {Object.entries(getLoadDistribution()).map(([nombre, count]) => {
                  const evColor = getEvaluadorColor(nombre);
                  return (
                    <div key={nombre} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${evColor.dot}`} />
                        {nombre.split(" ")[0]}:
                      </span>
                      <span className="font-bold text-white">{count} tests</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* A. Creación de Bloques */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Generar Bloques de Disponibilidad
            </h3>

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-bold text-center">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateBlocks} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Evaluador</label>
                <select
                  value={selectedEvaluadorId}
                  onChange={(e) => setSelectedEvaluadorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {evaluadores.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Fecha</label>
                <input
                  type="date"
                  required
                  value={fechaBloque}
                  onChange={(e) => setFechaBloque(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hora Término</label>
                  <input
                    type="time"
                    required
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Generar Bloques (20 min)
              </button>
            </form>
          </div>

        </div>

        {/* Lado Derecho: Agenda / Bloques y Reservas (col-8) */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[600px]">
          
          {/* Filtros de la Agenda */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-400" />
              B. Calendario Interno & Registros
            </h3>

            <div className="flex flex-wrap gap-2">
              {/* Filtro Evaluador */}
              <select
                value={filtroEvaluador}
                onChange={(e) => setFiltroEvaluador(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-300 focus:outline-none"
              >
                <option value="all">Todos los Evaluadores</option>
                {evaluadores.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre.split(" ")[0]}</option>
                ))}
              </select>

              {/* Filtro Estado */}
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-300 focus:outline-none"
              >
                <option value="all">Todos los Estados</option>
                <option value="free">Solo Disponibles</option>
                <option value="reserved">Solo Reservados</option>
              </select>
            </div>
          </div>

          {/* Listado de bloques */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader spinnerColor="#6366f1" />
            </div>
          ) : getFilteredBlocks().length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs gap-2">
              <AlertCircle className="w-6 h-6 text-slate-600" />
              <span>No se encontraron bloques con los filtros seleccionados.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar text-left">
              {getFilteredBlocks().map((b) => {
                const evColor = getEvaluadorColor(b.evaluador?.nombre || '');
                return (
                  <div 
                    key={b.id}
                    className={`border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-slate-900/60 ${evColor.border} ${b.disponible ? 'bg-slate-950/20' : 'bg-slate-950/60'}`}
                  >
                    
                    {/* Detalles del bloque temporal */}
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${evColor.badge}`}>
                        {b.evaluador?.nombre.split(" ")[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{formatBlockDate(b.fecha_hora)}</span>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatBlockTime(b.fecha_hora)} - {formatBlockTime(new Date(new Date(b.fecha_hora).getTime() + 20 * 60 * 1000).toISOString())}
                        </span>
                      </div>
                    </div>

                    {/* Estatus e Info del Alumno */}
                    <div className="flex-1 w-full md:w-auto">
                      {b.disponible ? (
                        <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                          Disponible
                        </span>
                      ) : b.reserva ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs w-full">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{b.reserva.nombre_alumno}</span>
                            <span className="text-[10px] text-slate-500">{b.reserva.email_alumno}</span>
                          </div>
                          <div className="flex gap-4 text-[10px] text-slate-400 border-t border-white/5 pt-1.5">
                            <span className="flex items-center gap-1"><Moon className="w-3.5 h-3.5 text-purple-400" /> {b.reserva.horas_sueno} hrs sueño</span>
                            <span className="flex items-center gap-1">
                              <Coffee className="w-3.5 h-3.5 text-yellow-400" /> 
                              Cafeína: {b.reserva.consumo_estimulantes ? 'Sí' : 'No'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-rose-400 font-bold text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                          Reservado (Sin datos)
                        </span>
                      )}
                    </div>

                    {/* Botón de eliminación */}
                    <button
                      onClick={() => handleDeleteBlock(b.id)}
                      disabled={actionLoading}
                      className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg text-red-400 transition-colors disabled:opacity-50 self-end md:self-auto"
                      title="Eliminar bloque de disponibilidad"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                    
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-500 z-10">
        CogniMirror SpA © 2026. Consola Interna de Investigación.
      </footer>
    </div>
  );
};

// Componente simple Loader
const Loader = ({ spinnerColor = '#3b82f6' }) => (
  <div className="flex flex-col items-center justify-center gap-2">
    <Loader2 className="w-8 h-8 animate-spin" style={{ color: spinnerColor }} />
    <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Procesando consulta...</span>
  </div>
);
