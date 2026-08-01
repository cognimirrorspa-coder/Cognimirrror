// AgendarPage.tsx - Flujo de agendamiento para el Estudio CogniMirror 2026
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, User, Clock, CheckCircle, 
  Sparkles, Coffee, Moon, Loader2, CalendarRange 
} from 'lucide-react';
// @ts-ignore
import { supabase } from '../utils/supabaseClient';

interface AgendarPageProps {
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
}

export const AgendarPage = ({ onNavigate }: AgendarPageProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Datos de Supabase
  const [evaluadores, setEvaluadores] = useState<Evaluador[]>([]);
  const [bloques, setBloques] = useState<Bloque[]>([]);

  // Selección del usuario
  const [selectedEvaluadorId, setSelectedEvaluadorId] = useState<string | 'any'>('any');
  const [selectedBlock, setSelectedBlock] = useState<Bloque | null>(null);

  // Formulario de confirmación
  const [nombreAlumno, setNombreAlumno] = useState('');
  const [emailAlumno, setEmailAlumno] = useState('');
  const [horasSueno, setHorasSueno] = useState<number | ''>('');
  const [consumoEstimulantes, setConsumoEstimulantes] = useState<boolean | null>(null);

  // Cargar evaluadores al montar
  useEffect(() => {
    const fetchEvaluadores = async () => {
      try {
        const { data, error } = await supabase
          .from('evaluadores')
          .select('*')
          .order('nombre');
        
        if (error) throw error;
        setEvaluadores(data || []);
      } catch (err) {
        console.error("Error al cargar evaluadores:", err);
      }
    };

    fetchEvaluadores();
  }, []);

  // Cargar bloques disponibles según el evaluador seleccionado
  useEffect(() => {
    const fetchBloques = async () => {
      setLoading(true);
      setError('');
      try {
        let query = supabase
          .from('bloques_disponibles')
          .select('*, evaluador:evaluadores(*)')
          .eq('disponible', true)
          .order('fecha_hora');

        if (selectedEvaluadorId !== 'any') {
          query = query.eq('evaluador_id', selectedEvaluadorId);
        }

        const { data, error } = await query;
        if (error) throw error;
        setBloques(data || []);
      } catch (err) {
        console.error("Error al cargar bloques:", err);
        setError('No se pudieron cargar los bloques de tiempo.');
      } finally {
        setLoading(false);
      }
    };

    if (step === 2) {
      fetchBloques();
    }
  }, [step, selectedEvaluadorId]);

  // Formatear fecha para mostrar
  const formatBlockDate = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
  };

  const formatBlockTime = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Agrupar bloques por día
  const getGroupedBlocks = () => {
    const groups: { [key: string]: Bloque[] } = {};
    bloques.forEach(b => {
      const dayLabel = formatBlockDate(b.fecha_hora);
      if (!groups[dayLabel]) {
        groups[dayLabel] = [];
      }
      groups[dayLabel].push(b);
    });
    return groups;
  };

  // Enlace dinámico de Google Calendar
  const getGoogleCalendarUrl = (block: Bloque) => {
    if (!block) return '';
    const dateStart = new Date(block.fecha_hora);
    const dateEnd = new Date(dateStart.getTime() + 20 * 60 * 1000); // 20 min de duración

    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const datesParam = `${formatGoogleDate(dateStart)}/${formatGoogleDate(dateEnd)}`;
    const detailsText = encodeURIComponent(`Gracias por participar. Tu evaluador será ${block.evaluador?.nombre || 'un miembro de nuestro equipo'}.`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Estudio Clínico CogniMirror')}&dates=${datesParam}&details=${detailsText}&location=${encodeURIComponent('Sala de Estudio 1')}`;
  };

  // Confirmar reserva
  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlock || !nombreAlumno.trim() || !emailAlumno.trim() || horasSueno === '' || consumoEstimulantes === null) {
      setError('Por favor, completa todas las preguntas del filtro clínico.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Insertar reserva (UNIQUE constraint en bloque_id evita duplicidad de carreras de datos)
      const { error: insertError } = await supabase
        .from('reservas')
        .insert({
          bloque_id: selectedBlock.id,
          nombre_alumno: nombreAlumno.trim(),
          email_alumno: emailAlumno.trim(),
          horas_sueno: Number(horasSueno),
          consumo_estimulantes: consumoEstimulantes
        });

      if (insertError) {
        throw new Error("Este bloque de tiempo ya ha sido reservado. Por favor, vuelve al paso anterior y elige otro horario.");
      }

      // 2. Actualizar disponibilidad del bloque
      const { error: updateError } = await supabase
        .from('bloques_disponibles')
        .update({ disponible: false })
        .eq('id', selectedBlock.id);

      if (updateError) {
        console.error("Error al actualizar bloque disponible:", updateError);
      }

      setStep(4); // Pantalla de éxito
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al procesar tu reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-4 relative">
      {/* Luces decorativas */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto max-w-xl text-center space-y-4 z-10">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => step > 1 && step < 4 ? setStep(step - 1) : onNavigate('home')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-xs">CM</div>
            <span className="font-bold text-xs">Estudio 2026</span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <CalendarRange className="w-6 h-6 text-purple-400" />
            Agendar Bloque de Prueba
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Participa en la validación científica de CogniMirror. Evalúa tu rendimiento cognitivo gratis en 20 minutos.
          </p>
        </div>

        {/* Indicador de pasos */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                  step === i 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20' 
                    : step > i 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                  {i}
                </div>
                {i < 3 && <div className={`w-8 h-0.5 ${step > i ? 'bg-emerald-500/30' : 'bg-white/5'}`} />}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Contenido Central */}
      <main className="container mx-auto max-w-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 my-8 shadow-2xl relative z-10 backdrop-blur-md">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold text-center mb-6 animate-pulse">
            {error}
          </div>
        )}

        {/* PASO 1: SELECCIÓN DE EVALUADOR */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Paso 1: Selecciona a tu Evaluador
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cualquier Evaluador */}
              <button 
                onClick={() => {
                  setSelectedEvaluadorId('any');
                  setStep(2);
                }}
                className="bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl transition-all text-left flex flex-col justify-between group h-36"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Cualquier Evaluador</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Mayor disponibilidad horaria.</p>
                </div>
              </button>

              {/* Matías */}
              <button 
                onClick={() => {
                  setSelectedEvaluadorId(evaluadores.find(e => e.nombre.includes('Matías'))?.id || 'any');
                  setStep(2);
                }}
                className="bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl transition-all text-left flex flex-col justify-between group h-36"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center">MF</div>
                <div>
                  <h4 className="font-bold text-white text-sm">Matías Fierro</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Evaluador del Estudio Clínico.</p>
                </div>
              </button>

              {/* Josué */}
              <button 
                onClick={() => {
                  setSelectedEvaluadorId(evaluadores.find(e => e.nombre.includes('Josué'))?.id || 'any');
                  setStep(2);
                }}
                className="bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition-all text-left flex flex-col justify-between group h-36"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center">JA</div>
                <div>
                  <h4 className="font-bold text-white text-sm">Josué Alarcón</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Evaluador del Estudio Clínico.</p>
                </div>
              </button>

              {/* Brayan */}
              <button 
                onClick={() => {
                  setSelectedEvaluadorId(evaluadores.find(e => e.nombre.includes('Brayan'))?.id || 'any');
                  setStep(2);
                }}
                className="bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 p-5 rounded-2xl transition-all text-left flex flex-col justify-between group h-36"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs flex items-center justify-center">BC</div>
                <div>
                  <h4 className="font-bold text-white text-sm">Brayan Castro</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Evaluador del Estudio Clínico.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: SELECCIÓN DE FECHA Y HORA */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Paso 2: Selecciona Fecha y Hora
              </h3>
              <span className="text-[10px] bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400">
                Filtro: {selectedEvaluadorId === 'any' ? 'Todos' : evaluadores.find(e => e.id === selectedEvaluadorId)?.nombre}
              </span>
            </div>

            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-xs text-slate-500">Cargando turnos disponibles...</span>
              </div>
            ) : bloques.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center gap-3">
                <Calendar className="w-8 h-8 text-slate-600" />
                <span className="text-xs text-slate-400 font-bold">No hay bloques disponibles actualmente.</span>
                <button 
                  onClick={() => setStep(1)} 
                  className="text-xs text-blue-400 hover:underline font-semibold"
                >
                  Cambiar de Evaluador
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(getGroupedBlocks()).map(([day, dayBlocks]) => (
                  <div key={day} className="space-y-2 text-left">
                    <h4 className="text-xs font-bold text-slate-300 border-l-2 border-blue-500 pl-2 mb-3">{day}</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {dayBlocks.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setSelectedBlock(b);
                            setStep(3);
                          }}
                          className="py-2.5 px-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500 text-xs font-bold rounded-xl text-center text-white transition-all hover:scale-105"
                        >
                          {formatBlockTime(b.fecha_hora)}
                          <span className="block text-[8px] text-slate-500 font-medium truncate mt-0.5">
                            {b.evaluador?.nombre.split(" ")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASO 3: CONFIRMACIÓN Y FILTRO CLÍNICO */}
        {step === 3 && selectedBlock && (
          <form onSubmit={handleConfirmReservation} className="space-y-6 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Paso 3: Filtro Clínico & Confirmación
            </h3>

            {/* Ficha Resumen */}
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Evaluador:</span>
                <span className="font-bold text-white">{selectedBlock.evaluador?.nombre}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Día:</span>
                <span className="font-bold text-white">{formatBlockDate(selectedBlock.fecha_hora)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Hora:</span>
                <span className="font-bold text-cyan-400 text-sm">{formatBlockTime(selectedBlock.fecha_hora)} (20 min)</span>
              </div>
            </div>

            {/* Inputs Normales */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre completo</label>
                <input 
                  type="text" 
                  required 
                  value={nombreAlumno}
                  onChange={(e) => setNombreAlumno(e.target.value)}
                  placeholder="Ej: Tomás Fernández"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
                <input 
                  type="email" 
                  required 
                  value={emailAlumno}
                  onChange={(e) => setEmailAlumno(e.target.value)}
                  placeholder="tomas@correo.cl"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>

            {/* Preguntas de Rigor Científico */}
            <div className="space-y-4 border-t border-white/5 pt-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-purple-400" />
                  ¿Cuántas horas dormiste anoche?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[4, 6, 8, 10].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHorasSueno(h)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        horasSueno === h 
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {h === 4 ? '≤ 4 hrs' : h === 10 ? '≥ 10 hrs' : `${h} hrs`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-yellow-400" />
                  ¿Has consumido cafeína o energéticas en las últimas 3 horas?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsumoEstimulantes(true)}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                      consumoEstimulantes === true 
                        ? 'bg-yellow-600 border-yellow-500 text-white shadow-lg shadow-yellow-500/20' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Sí, he consumido
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsumoEstimulantes(false)}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                      consumoEstimulantes === false 
                        ? 'bg-slate-950 border-slate-800 text-white hover:border-slate-700' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    No, nada
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar Reserva de Cupo
            </button>
          </form>
        )}

        {/* PANTALLA 4: ÉXITO */}
        {step === 4 && selectedBlock && (
          <div className="py-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">¡Reserva Confirmada!</h3>
              <p className="text-xs text-slate-400">
                ¡Gracias por participar, <strong>{nombreAlumno}</strong>! Tu hora ha sido agendada con éxito y el bloque ha sido cerrado.
              </p>
            </div>

            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 max-w-sm mx-auto space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Evaluador:</span>
                <span className="font-bold text-white">{selectedBlock.evaluador?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Día:</span>
                <span className="font-bold text-white">{formatBlockDate(selectedBlock.fecha_hora)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hora:</span>
                <span className="font-bold text-cyan-400">{formatBlockTime(selectedBlock.fecha_hora)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lugar:</span>
                <span className="font-bold text-white">Sala de Estudio 1</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <a
                href={getGoogleCalendarUrl(selectedBlock)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Calendar className="w-4 h-4" />
                Añadir a Google Calendar
              </a>
              <button
                onClick={() => onNavigate('home')}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs border border-white/10 transition-colors"
              >
                Volver a la Página de Inicio
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-500 z-10">
        CogniMirror SpA © 2026. Investigación y desarrollo tecnológico en Los Lagos.
      </footer>
    </div>
  );
};
