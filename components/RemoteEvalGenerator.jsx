'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../utils/supabaseClient';
import { usePatientsDB } from '../hooks/usePatientsDB';
import {
  Link2, X, Wifi, WifiOff, Zap, Brain, Copy, CheckCircle2, AlertTriangle,
  Loader2, ExternalLink, RefreshCw, Play, RotateCcw, StopCircle,
  Users, Search, Activity, Bluetooth, ChevronRight, Box, Award, Clock
} from 'lucide-react';
import Link from 'next/link';

// Cargar Cube3DViewer dinámicamente para SSR
const Cube3DViewer = dynamic(() => import('./Cube3DViewer'), { ssr: false });

export default function RemoteEvalGenerator({ onClose }) {
  const { patients, loadingPatients } = usePatientsDB();

  // Step: 'select_student' | 'select_test' | 'link_ready' | 'monitoring'
  const [step, setStep] = useState('select_student');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTest, setSelectedTest] = useState('reaction');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [evalRecordId, setEvalRecordId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Realtime monitoring & Digital Twin
  const [studentOnline, setStudentOnline] = useState(false);
  const [studentDevice, setStudentDevice] = useState('');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [liveTestType, setLiveTestType] = useState('reaction');
  const [recentMoves, setRecentMoves] = useState([]);
  const [lastTurn, setLastTurn] = useState(null);
  const [gyroRotation, setGyroRotation] = useState({ pitch: 0, roll: 0, yaw: 0 });
  const [telemetry, setTelemetry] = useState({
    score: 0,
    mistakes: 0,
    reactionTime: 0,
    currentStep: 0,
    totalSteps: 0,
    level: 1,
    accuracy: 100
  });

  const channelRef = useRef(null);

  const filteredPatients = patients.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.idSujeto && p.idSujeto.toLowerCase().includes(q)) ||
      (p.cursoNombre && p.cursoNombre.toLowerCase().includes(q))
    );
  });

  // Subscribe to real-time channel when token is ready and monitoring is active
  useEffect(() => {
    if (!generatedToken || step !== 'monitoring') return;

    const channel = supabase.channel(`eval_${generatedToken}`, {
      config: { presence: { key: 'clinician' } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const hasStudent = Object.values(state).some(
          presences => presences.some(p => p.online === true && p.role !== 'clinician')
        );
        setStudentOnline(hasStudent);
        const studentPresence = Object.values(state)
          .flat()
          .find(p => p.online === true && p.role !== 'clinician');
        if (studentPresence?.device) {
          setStudentDevice(studentPresence.device);
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const student = newPresences.find(p => p.online === true && p.role !== 'clinician');
        if (student) {
          setStudentOnline(true);
          setStudentDevice(student.device || 'Teclado');
        }
      })
      .on('presence', { event: 'leave' }, () => {
        setStudentOnline(false);
        setStudentDevice('');
      })
      // Escuchar giros en tiempo real del alumno (Gemelo Digital)
      .on('broadcast', { event: 'move' }, (event) => {
        const moveNotation = event.payload?.notation;
        if (moveNotation) {
          setLastTurn(moveNotation);
          setRecentMoves(prev => [
            { move: moveNotation, time: new Date().toLocaleTimeString().slice(3, 8) },
            ...prev.slice(0, 15)
          ]);
        }
      })
      // Escuchar giroscopio 3D del alumno
      .on('broadcast', { event: 'gyro' }, (event) => {
        if (event.payload) {
          setGyroRotation(event.payload);
        }
      })
      // Escuchar telemetría en vivo (aciertos, RT, nivel)
      .on('broadcast', { event: 'telemetry' }, (event) => {
        if (event.payload) {
          setTelemetry(prev => ({ ...prev, ...event.payload }));
        }
      })
      // Escuchar finalización de sesión
      .on('broadcast', { event: 'finished_session' }, (event) => {
        setSessionCompleted(true);
        if (event.payload?.sessionId) {
          setCompletedSessionId(event.payload.sessionId);
        }
        if (event.payload?.summary) {
          setSessionSummary(event.payload.summary);
        }
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online: true, role: 'clinician' });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [generatedToken, step]);

  const generateLink = async () => {
    if (!selectedPatient) return;
    setGeneratingLink(true);
    setError('');

    try {
      const token = `pie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error: dbError } = await supabase
        .from('evaluaciones_remotas')
        .insert([{
          token,
          id_paciente: selectedPatient.id,
          tipo_test: selectedTest,
          activo: true,
          expira_en: expiresAt
        }])
        .select()
        .single();

      if (dbError) {
        // Fallback demo local si la tabla aún no existe en Supabase
        const demoToken = `demo-${Date.now()}`;
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const link = `${origin}/remote-eval?token=${demoToken}`;
        setGeneratedLink(link);
        setGeneratedToken(demoToken);
        setLiveTestType(selectedTest);
        setStep('link_ready');
        setGeneratingLink(false);
        return;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const link = `${origin}/remote-eval?token=${token}`;
      setGeneratedLink(link);
      setGeneratedToken(token);
      setEvalRecordId(data.id);
      setLiveTestType(selectedTest);
      setStep('link_ready');
    } catch (err) {
      setError('Error al generar el enlace: ' + err.message);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = generatedLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const startMonitoring = () => {
    setStep('monitoring');
  };

  const sendCommand = (type, extra = {}) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'command',
      payload: { type, ...extra }
    });
  };

  const changeTestType = (newType) => {
    setLiveTestType(newType);
    sendCommand('CHANGE_TEST', { testType: newType });
  };

  const handleFinishSession = () => {
    sendCommand('FINISH');
    setSessionCompleted(true);
  };

  const revokeLink = async () => {
    if (evalRecordId) {
      try {
        await supabase.from('evaluaciones_remotas').update({ activo: false }).eq('id', evalRecordId);
      } catch (e) {}
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full ${step === 'monitoring' ? 'max-w-4xl' : 'max-w-lg'} bg-[#0d1017] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300`}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#121622] to-cyan-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                Evaluación Remota PIE
                {step === 'monitoring' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En Vivo
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                {selectedPatient ? `${selectedPatient.name} (${selectedPatient.cursoNombre || 'PIE'})` : 'Enlace Seguro de 24h'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto">

          {/* PASO 1: Seleccionar Estudiante */}
          {step === 'select_student' && (
            <div className="p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Selecciona el alumno a evaluar</h3>
                <p className="text-xs text-slate-400">Se generará un enlace seguro de evaluación para este estudiante.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, ID o curso..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {loadingPatients ? (
                  <div className="py-8 text-center text-slate-500 text-xs animate-pulse">Cargando alumnos...</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">Sin resultados</div>
                ) : (
                  filteredPatients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setStep('select_test'); }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition-all text-left cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.cursoNombre} · {p.idSujeto || 'Sin ID'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PASO 2: Elegir Batería */}
          {step === 'select_test' && selectedPatient && (
            <div className="p-6 flex flex-col gap-5">
              <button onClick={() => setStep('select_student')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer">
                ← Cambiar alumno
              </button>

              <div className="flex items-center gap-3 p-3.5 bg-white/[0.04] rounded-2xl border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{selectedPatient.name}</p>
                  <p className="text-xs text-slate-400">{selectedPatient.cursoNombre}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tipo de evaluación inicial:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedTest('reaction')}
                    className={`p-4 rounded-2xl border flex flex-col gap-2 items-center text-center transition-all cursor-pointer ${
                      selectedTest === 'reaction'
                        ? 'bg-cyan-950/50 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Zap className={`w-7 h-7 ${selectedTest === 'reaction' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <div>
                      <p className="font-black text-xs text-white">Reaction Mirror</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Control inhibitorio y velocidad</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTest('memory')}
                    className={`p-4 rounded-2xl border flex flex-col gap-2 items-center text-center transition-all cursor-pointer ${
                      selectedTest === 'memory'
                        ? 'bg-purple-950/50 border-purple-500/60 shadow-lg shadow-purple-500/10'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Brain className={`w-7 h-7 ${selectedTest === 'memory' ? 'text-purple-400' : 'text-slate-400'}`} />
                    <div>
                      <p className="font-black text-xs text-white">Memory Mirror</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Memoria visoespacial (Corsi)</p>
                    </div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-500/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={generateLink}
                disabled={generatingLink}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                {generatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {generatingLink ? 'Generando enlace seguro...' : 'Generar Enlace de Evaluación'}
              </button>
            </div>
          )}

          {/* PASO 3: Link Listo */}
          {step === 'link_ready' && (
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Link2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">¡Enlace Generado!</h3>
                  <p className="text-xs text-slate-400 mt-1">Comparte este enlace con <strong className="text-white">{selectedPatient?.name}</strong></p>
                  <p className="text-[10px] text-amber-400 font-mono mt-1">⏱ Expira en 24 horas · Transmisión en Vivo</p>
                </div>
              </div>

              {/* Link box */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Enlace de evaluación:</p>
                <p className="text-xs font-mono text-emerald-300 break-all leading-relaxed">{generatedLink}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyLink}
                  className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '¡Copiado!' : 'Copiar Enlace'}
                </button>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Vista Alumno
                </a>
              </div>

              <button
                onClick={startMonitoring}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <Activity className="w-4 h-4" />
                Monitorear en Tiempo Real (Gemelo Digital)
              </button>

              <button onClick={revokeLink} className="text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer text-center py-1">
                Cancelar y revocar enlace
              </button>
            </div>
          )}

          {/* PASO 4: Monitoreo en Vivo con Gemelo Digital 3D */}
          {step === 'monitoring' && (
            <div className="p-5 flex flex-col gap-5">
              
              {/* Top Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Conexión Alumno */}
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  studentOnline ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-white/[0.02] border-white/10'
                }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${studentOnline ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                    {studentOnline ? <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" /> : <WifiOff className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${studentOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {studentOnline ? 'Alumno Conectado' : 'Esperando Alumno...'}
                    </p>
                    <p className="text-[10px] text-slate-400">{studentDevice || 'Sin dispositivo'}</p>
                  </div>
                </div>

                {/* Batería Activa */}
                <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    {liveTestType === 'reaction' ? <Zap className="w-4 h-4 text-cyan-400" /> : <Brain className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white capitalize">{liveTestType === 'reaction' ? 'Reaction Mirror' : 'Memory Mirror'}</p>
                    <p className="text-[10px] text-slate-400">Nivel actual: {telemetry.level || 1}</p>
                  </div>
                </div>

                {/* Rendimiento en Vivo */}
                <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {telemetry.score} Aciertos <span className="text-red-400 text-[10px]">({telemetry.mistakes} errores)</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      RT: {telemetry.reactionTime ? `${telemetry.reactionTime} ms` : '--'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid Central: Gemelo Digital 3D + Feed y Controles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Visualizador Gemelo Digital 3D */}
                <div className="bg-[#07090e] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[280px]">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    <Box className="w-3 h-3" />
                    Gemelo Digital en Vivo
                  </div>

                  {lastTurn && (
                    <div className="absolute top-3 right-3 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full animate-bounce">
                      Giro: {lastTurn}
                    </div>
                  )}

                  {/* Componente 3D */}
                  <div className="py-2">
                    <Cube3DViewer
                      size={210}
                      highlightFace={lastTurn}
                      targetRotation={gyroRotation}
                      isLocked={false}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">
                    {studentOnline
                      ? 'Reflejando rotación y movimientos del cubo del alumno'
                      : 'El cubo responderá cuando el alumno interactúe'}
                  </p>
                </div>

                {/* Panel Derecho: Historial de Giros + Telemetría */}
                <div className="flex flex-col gap-3">
                  
                  {/* Historial de Movimientos en Vivo */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Feed de Giros en Vivo</span>
                      <span className="font-mono text-slate-500">{recentMoves.length} registrados</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 min-h-[50px] max-h-24 overflow-y-auto p-1 bg-black/30 rounded-xl">
                      {recentMoves.length === 0 ? (
                        <p className="text-[10px] text-slate-600 m-auto">Esperando primer giro...</p>
                      ) : (
                        recentMoves.map((m, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                              idx === 0
                                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/50 scale-105'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          >
                            {m.move}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Panel de Control Remoto de la Batería */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mando del Evaluador:</p>
                    
                    {/* Cambiar Test */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => changeTestType('reaction')}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          liveTestType === 'reaction'
                            ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" /> Reaction
                      </button>
                      <button
                        onClick={() => changeTestType('memory')}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          liveTestType === 'memory'
                            ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Brain className="w-3.5 h-3.5" /> Memory
                      </button>
                    </div>

                    {/* Acciones de Juego */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => sendCommand('START')}
                        disabled={!studentOnline}
                        className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Play className="w-3.5 h-3.5" /> Iniciar
                      </button>
                      <button
                        onClick={() => sendCommand('RESTART')}
                        disabled={!studentOnline}
                        className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
                      </button>
                      <button
                        onClick={() => sendCommand('CANCEL')}
                        disabled={!studentOnline}
                        className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <StopCircle className="w-3.5 h-3.5" /> Pausar
                      </button>
                    </div>

                    {/* Cerrar Sesión */}
                    <button
                      onClick={handleFinishSession}
                      className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar y Guardar Sesión
                    </button>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Sesión Concluida / Informe Generado */}
              {sessionCompleted && (
                <div className="p-4 rounded-2xl border bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">¡Evaluación Remota Completada con Éxito!</p>
                      <p className="text-xs text-indigo-200">
                        Se guardaron las métricas y telemetría de <strong className="text-white">{selectedPatient?.name}</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href={`/students/${selectedPatient?.id}`}
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-lg shadow-indigo-600/30"
                    >
                      Ver Ficha Escolar
                    </Link>
                  </div>
                </div>
              )}

              {/* Botón inferior para salir */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={copyLink}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? '¡Enlace copiado!' : 'Copiar enlace nuevamente'}
                </button>
                <button
                  onClick={revokeLink}
                  className="text-xs text-red-400/80 hover:text-red-300 font-bold transition-colors cursor-pointer"
                >
                  Cerrar monitor y finalizar
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
