'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain, Users, Award, ArrowRight, Activity, Sparkles,
  Trophy, Eye, CheckCircle,
  Mail, Phone, ExternalLink, Play, X, Send, Calendar, ChevronRight,
  EyeOff, Gamepad2, Globe, FileWarning, Landmark, HeartHandshake,
  ClipboardX, Smartphone
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Red neuronal 3D de fondo
const NeuralBackground3D = dynamic(
  () => import('../components/animations/NeuralBackground3D').then(m => ({ default: m.NeuralBackground3D })),
  { ssr: false }
);
import { SimulatedDashboard } from '../components/animations/SimulatedDashboard';

// Brain3D se carga dinámicamente (solo cliente, sin SSR)
const Brain3D = dynamic(
  () => import('../components/animations/Brain3D').then(m => ({ default: m.Brain3D })),
  { ssr: false }
);

// Cube3DViewer se carga dinámicamente
const Cube3DViewer = dynamic(
  () => import('../components/Cube3DViewer'),
  { ssr: false }
);

// MorphingCardIcon dinámico
const MorphingCardIcon = dynamic(
  () => import('../components/animations/MorphingCardIcon').then(m => ({ default: m.MorphingCardIcon })),
  { ssr: false }
);

export default function LandingPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', institution: '', email: '', phone: '', message: '' });

  // Estado unificado para sincronizar Cerebro 3D y Fondo de Redes Neuronales
  const [activeModules, setActiveModules] = useState({ reaction: true, memory: true });

  const toggleModule = (moduleKey) => {
    setActiveModules((prev) => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
  };

  const openContactModal = (title) => {
    setModalTitle(title);
    setShowModal(true);
    setFormSubmitted(false);
    setFormData({ name: '', institution: '', email: '', phone: '', message: '' });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log("Lead B2B Capturado:", formData);
    setFormSubmitted(true);
    setTimeout(() => { setShowModal(false); }, 2500);
  };

  const goToLogin = () => router.push('/login');

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1a263a_0%,_#111827_60%,_#0b0f19_100%)] text-[#e1e2ec] font-sans antialiased selection:bg-blue-500/30 selection:text-blue-100 overflow-x-hidden relative">

      {/* ===== FONDO: RED NEURONAL 3D ===== */}
      <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <NeuralBackground3D activeModules={activeModules} />
      </div>

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111827]/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CogniMirror" className="w-8 h-8 object-contain" />
            <span className="font-bold text-white text-sm">CogniMirror</span>
          </div>
          <button
            onClick={goToLogin}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            Iniciar Sesión
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ===== SECCIÓN 1: HERO ===== */}
      <section className="relative overflow-hidden border-b border-white/5 pt-28 pb-20 px-4">
        <div className="electric-glow top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2" />

        {/* Brain3D en el lado derecho con Leyenda Cromática de Módulos */}
        <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full opacity-95 pointer-events-auto z-10 hidden md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0B0F19_20%,_transparent_75%)] z-0 pointer-events-none" />
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <Brain3D activeModules={activeModules} onToggleModule={toggleModule} />
          </div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10 pointer-events-none">
          <div className="grid lg:grid-cols-12 gap-12 items-center min-h-[500px] lg:min-h-[650px] lg:pt-8">
            <div className="lg:col-span-7 space-y-8 text-left lg:pt-4 pointer-events-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-sm">
                Telemetría Phygital que blinda tu Programa PIE.
              </h1>
              <p className="text-lg md:text-xl text-slate-400 max-w-xl font-light leading-relaxed">
                Deja atrás el &apos;espejismo académico&apos; y las evaluaciones subjetivas. CogniMirror transforma herramientas físicas en métricas clínicas exactas, ahorrando cientos de horas a tu equipo psicosocial.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <button
                  onClick={() => openContactModal('Solicitar Demostración Institucional')}
                  className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-7 py-3.5 rounded-xl transition-all duration-300 text-sm font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] active:scale-[0.98] flex items-center justify-center gap-2 border border-blue-400/20"
                >
                  <span>Postular al Piloto</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('experiencia-phygital')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative group overflow-hidden bg-slate-900/40 hover:bg-slate-800/60 text-white px-7 py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold border border-white/10 hover:border-white/20 active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 text-[#3B82F6] fill-[#3B82F6]/10 group-hover:scale-110 transition-transform" />
                  <span>Ver Video</span>
                </button>
              </div>

              {/* CORFO Logo Block */}
              <div className="pt-8">
                <img src="/logo-corfo.png" alt="Apoyado por CORFO y Gobierno de Chile" className="h-16 md:h-20 object-contain drop-shadow-md hover:scale-105 transition-transform origin-left" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN 1.5: EXPERIENCIA PHYGITAL ===== */}
      <section id="experiencia-phygital" className="py-24 relative border-b border-white/5 bg-[#0B0F19]/50">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#3B82F6]/30 rounded-full bg-[#3B82F6]/10 mb-2">
              <Sparkles className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-xs font-mono text-[#3B82F6] tracking-wider uppercase">Experiencia Phygital</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-4xl mx-auto tracking-tight">
              Del Juego Físico a la Métrica Clínica en Tiempo Real
            </h2>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-light">
              Observa cómo la interacción del estudiante con el cubo inteligente se traduce instantáneamente en datos precisos.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-stretch justify-center max-w-6xl mx-auto">
            {/* Video */}
            <div className="w-full md:w-[45%] flex flex-col relative">
              <div className="w-full h-full bg-[#0a0d14]/80 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl relative pt-12 pb-6 px-6 flex flex-col">
                <div className="absolute top-0 inset-x-0 flex justify-center -mt-3">
                  <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold bg-[#0B0F19] px-4 py-1 rounded">
                    LA INTERACCIÓN FÍSICA
                  </span>
                </div>
                <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto overflow-hidden rounded-xl shadow-lg shadow-black/50 mb-8 border border-white/5 flex-grow">
                  <iframe
                    src="https://www.youtube.com/embed/Fj5hjHPPdeY?autoplay=1&mute=1&loop=1&playlist=Fj5hjHPPdeY"
                    title="Niño jugando con cubo inteligente"
                    className="absolute inset-0 w-full h-full object-cover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-slate-300 font-light text-center leading-relaxed mt-auto">
                  El estudiante manipula el cubo inteligente, rastreando sus movimientos en tiempo real.
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="hidden md:flex flex-col items-center justify-center gap-10 text-slate-600/40">
              <div className="flex -space-x-3">
                <ChevronRight className="w-8 h-8" />
                <ChevronRight className="w-8 h-8" />
                <ChevronRight className="w-8 h-8" />
              </div>
              <ArrowRight className="w-5 h-5" />
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Dashboard */}
            <div className="w-full md:w-[45%] flex flex-col relative">
              <div className="w-full h-full bg-[#0a0d14]/80 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl relative pt-12 pb-6 px-6 flex flex-col">
                <div className="absolute top-0 inset-x-0 flex justify-center -mt-3">
                  <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold bg-[#0B0F19] px-4 py-1 rounded">
                    EL DASHBOARD CLÍNICO (TELEMETRÍA EN VIVO)
                  </span>
                </div>
                <div className="relative w-full overflow-hidden rounded-xl shadow-lg shadow-black/50 mb-8 flex-grow flex items-center">
                  <SimulatedDashboard />
                </div>
                <p className="text-sm text-slate-300 font-light text-center leading-relaxed mt-auto">
                  Conversión instantánea de datos en métricas clave: Latencia, Giros y Asimetría en tiempo real.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN 2: EL DOLOR ===== */}
      <section className="py-24 relative border-b border-white/5">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white max-w-3xl mx-auto tracking-tight">
              El modelo actual está agotando a tus profesionales.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-lg flex flex-col gap-4 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all duration-300">
              <div className="w-12 h-12 rounded bg-[#10131a] border border-white/10 flex items-center justify-center mb-2">
                <MorphingCardIcon iconType="clipboardX" color="#f87171" size={24} delay={0} />
              </div>
              <div className="text-5xl md:text-7xl font-mono text-[#3B82F6] font-bold select-none leading-none mb-2">40%</div>
              <h3 className="text-lg font-bold text-white">El Colapso Administrativo</h3>
              <div className="h-px w-full bg-white/10 my-2" />
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Los psicólogos gastan hasta un <strong className="text-white font-semibold">40%</strong> de sus horas en papeleo manual para justificar los <strong className="text-white font-semibold">Informes PIE</strong>.
              </p>
            </div>
            <div className="glass-panel p-6 rounded-lg flex flex-col gap-4 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all duration-300">
              <div className="w-12 h-12 rounded bg-[#10131a] border border-white/10 flex items-center justify-center mb-2">
                <MorphingCardIcon iconType="smartphone" color="#fdba74" size={24} delay={150} />
              </div>
              <div className="text-5xl md:text-7xl font-mono text-indigo-400 font-bold select-none leading-none mb-2">D.170</div>
              <h3 className="text-lg font-bold text-white">El Villano del &apos;Scroll Infinito&apos;</h3>
              <div className="h-px w-full bg-white/10 my-2" />
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Pérdida de atención y deterioro del desarrollo neuromotor en alumnos por sobreexposición a pantallas pasivas.
              </p>
            </div>
            <div className="glass-panel p-6 rounded-lg flex flex-col gap-4 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all duration-300">
              <div className="w-12 h-12 rounded bg-[#10131a] border border-white/10 flex items-center justify-center mb-2">
                <MorphingCardIcon iconType="eyeOff" color="#94a3b8" size={24} delay={300} />
              </div>
              <div className="text-5xl md:text-7xl font-mono text-slate-500 font-bold select-none leading-none mb-2">1/100</div>
              <h3 className="text-lg font-bold text-white">Evaluaciones a &apos;Ojo Humano&apos;</h3>
              <div className="h-px w-full bg-white/10 my-2" />
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Datos subjetivos del cronómetro que complican la validación de avances cognitivos y bimanuales objetivos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ESTUDIO CLÍNICO BANNER ===== */}
      <section className="py-20 px-4 relative border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/5 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-4xl relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span>Participación Abierta 2026</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            ¿Quieres desafiar a tu mente? Participa en el Estudio CogniMirror 2026.
          </h2>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
            Estamos validando la primera tecnología phygital de telemetría neurocognitiva en la región de Los Lagos. Necesitamos 20 minutos de tu tiempo.
          </p>
          <div className="pt-2">
            <button
              onClick={goToLogin}
              className="relative group overflow-hidden px-7 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 mx-auto active:scale-[0.98]"
            >
              <Calendar className="w-4 h-4 fill-current group-hover:rotate-12 transition-transform" />
              <span>Reservar mi Bloque de Prueba (20 min)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN 3: LA SOLUCIÓN ===== */}
      <section id="what-we-do" className="py-24 px-4 relative">
        <div className="mb-16 border-l-2 border-[#3B82F6] pl-6 max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white max-w-4xl tracking-tight">
            Gimnasia Cerebral Phygital: entrenando mentes, no zombies digitales.
          </h2>
        </div>
        <div className="container mx-auto max-w-7xl flex flex-col gap-20">

          {/* Feature 1: Panel de Cumplimiento MINEDUC (Reconstruido a fidelidad total de Imagen 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Izquierda: Panel Mockup de Informes de Cumplimiento (MINEDUC Decreto 170) */}
            <div className="lg:col-span-7 w-full">
              <div className="bg-[#0b101d]/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-5 md:p-6 shadow-[0_0_40px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                
                {/* Header del Panel */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                  <h4 className="text-sm md:text-base font-bold text-white tracking-wide flex items-center gap-2">
                    <span>Panel de Informes de Cumplimiento (MINEDUC Decreto 170)</span>
                  </h4>
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Grid Interior: Documento PDF + Controles y Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                  
                  {/* Columna Izquierda: Documento PDF Estilo Hoja Oficial MINEDUC */}
                  <div className="md:col-span-6 bg-white rounded-xl p-4 text-slate-900 shadow-2xl flex flex-col justify-between min-h-[310px] border border-slate-300 relative overflow-hidden">
                    {/* Encabezado con Escudo / Gobierno de Chile */}
                    <div className="flex items-start justify-between border-b border-slate-200 pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white font-bold">🇨🇱</div>
                        <div className="text-[7px] font-mono leading-tight text-slate-800">
                          <span className="font-bold block">GOBIERNO DE CHILE</span>
                          <span>Ministerio de Educación</span>
                        </div>
                      </div>
                      <span className="text-[7px] font-mono text-slate-400 uppercase font-bold">FOLIO: #2026-D170</span>
                    </div>

                    {/* Título del Informe */}
                    <div className="text-left space-y-0.5 mb-2">
                      <div className="text-[9px] font-black tracking-tight text-slate-900 uppercase">
                        INFORME DE EVALUACIÓN CLÍNICA
                      </div>
                      <div className="text-[7px] font-mono text-blue-700 font-bold uppercase">
                        CUMPLIMIENTO NORMATIVO DECRETO 170
                      </div>
                    </div>

                    {/* Simulación de Texto Oficial */}
                    <div className="text-left space-y-1 text-[6px] leading-relaxed text-slate-600 font-mono mb-2">
                      <p><strong className="text-slate-800">CUMPLIMIENTO NORMATIVO:</strong> Paciente presenta parámetros dentro de los rangos de atención sostenida y coordinación bimanual.</p>
                      <p>1. Se comprueba un incremento del 34% en velocidad de procesamiento neuromotor respecto al diagnóstico base.</p>
                      <p>2. Los datos de telemetría bimanual del Cubo Inteligente muestran una simetría del 92% entre hemisferios.</p>
                    </div>

                    {/* Gráfico Mini de Barras en el Documento */}
                    <div className="bg-slate-100 rounded p-2 mb-2 border border-slate-200">
                      <div className="flex items-end justify-between h-14 gap-1 px-2">
                        <div className="w-full bg-blue-600 h-[85%] rounded-t" />
                        <div className="w-full bg-blue-500 h-[60%] rounded-t" />
                        <div className="w-full bg-blue-400 h-[45%] rounded-t" />
                        <div className="w-full bg-blue-300 h-[30%] rounded-t" />
                        <div className="w-full bg-blue-200 h-[18%] rounded-t" />
                      </div>
                    </div>

                    {/* Sello de Firma / Timbre Institucional */}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-[6px] font-mono text-slate-600">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full border border-blue-600/40 flex items-center justify-center text-[6px] text-blue-700 font-bold">
                          ✓
                        </div>
                        <span>FIRMA DIGITAL VALIDADA</span>
                      </div>
                      <span className="font-bold text-slate-800">VALIDACIÓN AUTOMÁTICA</span>
                    </div>
                  </div>

                  {/* Columna Derecha: Tarjetas de Métricas + Control de Selección + Descarga */}
                  <div className="md:col-span-6 flex flex-col justify-between gap-3">
                    
                    {/* Fila Superior: Sub-tarjetas side-by-side */}
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      
                      {/* Sub-tarjeta A: Gráfico Ahorro de Tiempo */}
                      <div className="bg-[#101524] p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-tight text-left">
                          Ahorro de Tiempo en Reportes (Horas/Mes)
                        </div>
                        <div className="flex items-end gap-1 h-20 pt-2">
                          <div className="flex-1 bg-blue-600 h-[90%] rounded-t relative group">
                            <span className="opacity-0 group-hover:opacity-100 text-[6px] text-white absolute -top-3 left-0 right-0 text-center font-mono">100+</span>
                          </div>
                          <div className="flex-1 bg-blue-500 h-[65%] rounded-t" />
                          <div className="flex-1 bg-blue-400 h-[45%] rounded-t" />
                          <div className="flex-1 bg-blue-300 h-[30%] rounded-t" />
                          <div className="flex-1 bg-indigo-400 h-[20%] rounded-t" />
                        </div>
                        <div className="flex justify-between text-[6px] font-mono text-slate-500 pt-1">
                          <span>10</span>
                          <span>20</span>
                          <span>30</span>
                          <span>50</span>
                          <span>100+</span>
                        </div>
                      </div>

                      {/* Sub-tarjeta B: Flow de Selección, Generación y Descargar Decreto 170 (Fidelidad 1:1 Imagen 2) */}
                      <div className="bg-[#101524] p-3 rounded-xl border border-white/10 flex flex-col justify-between text-left relative overflow-hidden">
                        
                        {/* Paso 1: Seleccionar Estudiante */}
                        <div>
                          <div className="text-[9px] font-bold text-white mb-1">
                            Seleccionar Estudiante
                          </div>
                          <div className="bg-[#161c2e] border border-white/10 rounded-lg px-2 py-1 text-[9px] text-slate-300 font-mono flex justify-between items-center relative overflow-hidden">
                            {/* Nombre del estudiante difuminado para simular privacidad */}
                            <span className="truncate filter blur-[5px] select-none font-semibold text-slate-200 tracking-wide">
                              Benjamín Morales (PIE-042)
                            </span>
                            <span className="text-slate-400 text-[8px] ml-1 shrink-0">v</span>
                          </div>
                        </div>

                        {/* Flecha Conectora 1 */}
                        <div className="flex justify-center my-0.5">
                          <span className="text-slate-400 text-[10px] font-mono leading-none">↓</span>
                        </div>

                        {/* Paso 2: Generar Reporte */}
                        <div>
                          <div className="text-[9px] font-bold text-white mb-1">Generar Reporte</div>
                          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-[#3B82F6] h-full w-[70%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                          </div>
                        </div>

                        {/* Flecha Conectora 2 */}
                        <div className="flex justify-center my-0.5">
                          <span className="text-slate-400 text-[10px] font-mono leading-none">↓</span>
                        </div>

                        {/* Paso 3: Descargar Decreto 170 + Check Prominente en el lado derecho */}
                        <div>
                          <div className="text-[9px] font-bold text-white mb-1">Descargar Decreto 170</div>
                          <div className="flex justify-end pt-0.5">
                            <div className="w-9 h-9 rounded-full bg-[#10b981] text-slate-950 flex items-center justify-center font-black text-sm shadow-[0_0_18px_rgba(16,185,129,0.6)] border border-emerald-300">
                              ✓
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Fila Inferior: Botón de Acción de Descarga Directa */}
                    <div className="bg-[#101524] p-3 rounded-xl border border-blue-500/20 flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] text-slate-400 uppercase font-mono block">Descargar</span>
                        <span className="text-xs font-mono font-bold text-white truncate block">decreto_170_evaluacion.pdf</span>
                        <span className="text-[8px] text-slate-400 block font-mono">Listo para Click</span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>

            {/* Derecha: Título, Descripción y Botón "Ver Muestra de Informe" */}
            <div className="lg:col-span-5 text-left space-y-6 relative">
              {/* Overlay de código cibernético en el fondo derecho */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-xl pointer-events-none -z-10" />
              
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight drop-shadow-md">
                Cumplimiento MINEDUC Sin Esfuerzo, con un Solo Click
              </h3>

              <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed">
                Nuestro sistema avanzado genera automáticamente informes estandarizados y auditables para el Decreto 170. Ahorre horas de trabajo manual, garantice el cumplimiento normativo instantáneo y simplifique sus auditorías, con un click.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => openContactModal('Ver Muestra de Informe MINEDUC')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#1a2333]/90 hover:bg-[#253248] border border-slate-700/80 hover:border-slate-500 text-slate-200 rounded-xl text-xs font-semibold shadow-lg transition-all duration-200 active:scale-95"
                >
                  <span>Ver Muestra de Informe</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

            </div>

          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-8">
            <div className="md:col-span-6 md:col-start-7 glass-panel rounded-lg p-8 h-[400px] w-full flex flex-col justify-between relative overflow-hidden order-1 md:order-2 border border-white/10">
              <div className="flex justify-between items-start font-mono text-xs text-slate-400">
                <span className="tracking-wider">SYSTEM.COMPATIBILITY</span>
                <Gamepad2 className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div className="w-full flex items-center justify-center z-10 my-auto">
                <Cube3DViewer size={200} isLocked={true} />
              </div>
              <div className="bg-[#10131a]/60 p-3 rounded-lg border border-white/5 font-mono text-[9px] flex justify-between">
                <span className="text-slate-400">GAN Smart V3 &amp; V2</span>
                <span className="text-emerald-400 font-bold">✓ COMPATIBLE</span>
              </div>
            </div>
            <div className="md:col-span-6 md:col-start-1 md:row-start-1 order-2 md:order-1 text-left space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold text-white">Hardware Agnóstico &amp; Integración Cloud-Native</h3>
              <p className="text-base text-slate-400 font-light leading-relaxed">
                No te atamos a un dispositivo exclusivo. Nuestra plataforma es compatible con múltiples versiones de cubos inteligentes Bluetooth disponibles en el mercado.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-8">
            <div className="md:col-span-6 glass-panel rounded-lg p-8 h-[400px] w-full flex flex-col justify-between thin-stroke-grid border border-white/10">
              <div className="flex justify-between items-start font-mono text-xs text-slate-400">
                <span className="tracking-wider">SERVERS.STATUS</span>
                <Globe className="w-5 h-5 text-slate-400" />
              </div>
              <div className="bg-[#10131a]/80 p-4 border border-white/5 rounded-lg w-full flex items-center justify-between text-xs font-mono">
                <div className="text-left">
                  <span className="text-[8px] text-slate-500 block font-bold">ESTADO CLOUD</span>
                  <span className="text-slate-300 font-bold">Servidores Nube Estables</span>
                </div>
                <span className="text-[9px] px-2.5 py-1 bg-blue-950 text-blue-400 border border-blue-800/50 rounded-full font-bold">100% ONLINE</span>
              </div>
              <div className="text-left font-mono space-y-1 text-slate-500 text-[10px]">
                <p>&gt; ping vercel-servers.cognimirror.cl</p>
                <p className="text-emerald-400">&gt; reply from 76.76.21.21: bytes=32 time=8ms TTL=58</p>
                <p>&gt; system status: OPTIMAL</p>
              </div>
            </div>
            <div className="md:col-span-6 text-left space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold text-white">Cobertura sin Fronteras</h3>
              <p className="text-base text-slate-400 font-light leading-relaxed">
                Una solución SaaS Cloud-Native diseñada para funcionar sin latencia desde centros urbanos hasta zonas extremas como <strong className="text-white font-semibold"> Palena </strong> o el archipiélago de <strong className="text-white font-semibold"> Chiloé</strong>.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="inline-block bg-blue-950/80 border border-blue-900 text-blue-400 text-[10px] px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">Palena</span>
                <span className="inline-block bg-blue-950/80 border border-blue-900 text-blue-400 text-[10px] px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">Chiloé</span>
                <span className="inline-block bg-slate-900 border border-slate-800 text-slate-400 text-[10px] px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">Cloud Synchronized</span>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-8">
            <div className="md:col-span-6 md:col-start-7 glass-panel rounded-lg p-8 h-[400px] w-full flex flex-col justify-between relative overflow-hidden order-1 md:order-2 border border-white/10">
              <div className="flex justify-between items-start font-mono text-xs text-slate-400">
                <span className="tracking-wider">BRAIN.ACTIVATION.INDEX</span>
                <Brain className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div className="bg-[#10131a]/80 p-4 border border-white/5 rounded-lg w-full flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/10 rounded flex items-center justify-center text-[#3B82F6] border border-blue-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left font-mono text-[11px]">
                  <span className="text-slate-300 font-bold block">Activación Cortical</span>
                  <span className="text-[9px] text-blue-400 font-bold">Corteza Parietal &amp; Motora</span>
                </div>
              </div>
              <div className="h-24 w-full flex justify-around items-end bg-[#0b0e15] rounded p-2 border border-white/5">
                {[45, 67, 89, 72, 95, 60].map((val, idx) => (
                  <div key={idx} style={{ height: `${val}%` }} className="w-4 bg-indigo-500/50 rounded-t shadow-[0_0_10px_rgba(99,102,241,0.2)]" />
                ))}
              </div>
            </div>
            <div className="md:col-span-6 md:col-start-1 md:row-start-1 order-2 md:order-1 text-left space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold text-white">Inmersión Bimanual y Rotación 3D</h3>
              <p className="text-base text-slate-400 font-light leading-relaxed">
                Obligamos al cerebro a salir del letargo. Al exigir el uso de ambas manos activamos la corteza motora y parietal del estudiante en un entorno de alta demanda cognitiva, gamificado y libre de estrés.
              </p>
            </div>
          </div>

        </div>
      </section>


      {/* ===== SECCIÓN 4: RESPALDO INSTITUCIONAL ===== */}
      <section className="py-20 px-4 relative flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-8">
          {/* Línea Divisora Superior */}
          <div className="w-full h-px bg-white/15" />

          {/* Encabezado Institucional */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-4xl font-bold tracking-[0.18em] text-slate-100 uppercase">
              RESPALDO INSTITUCIONAL
            </h2>
            <p className="text-xs md:text-sm font-mono tracking-[0.3em] text-slate-400 uppercase">
              CON EL APOYO DE
            </p>
          </div>

          {/* Tarjeta Oscura Institucional con Logo Grande y Centrado */}
          <div className="w-full bg-[#0c1424]/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl flex items-center justify-center min-h-[180px] md:min-h-[240px]">
            <a
              href="https://www.corfo.cl/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-full h-full"
            >
              <img
                src="/logo-corfo.png"
                alt="CORFO y Gobierno de Chile"
                className="h-20 md:h-28 max-h-[140px] md:max-h-[180px] w-auto object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:scale-[1.03] transition-transform duration-300 mx-auto"
              />
            </a>
          </div>

          {/* Texto Inferior */}
          <p className="text-center text-xl md:text-3xl font-semibold text-slate-100 tracking-wide pt-2">
            Cofinanciados por el Estado de Chile
          </p>

          {/* Línea Divisora Inferior */}
          <div className="w-full h-px bg-white/15" />
        </div>
      </section>

      {/* ===== SECCIÓN 4.5: VALIDACIÓN ===== */}
      <section id="about" className="py-24 border-t border-b border-white/5 text-center px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-12">
            Tecnología validada por el ecosistema de innovación
          </h2>
          {/* 3 tarjetas centradas */}
          <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
            {/* CITT Duoc UC */}
            <div className="glass-panel rounded-xl p-8 flex flex-col justify-between hover:border-[#3B82F6]/50 transition-all shadow-lg w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-22px)] max-w-xs">
              <div className="space-y-4 text-left">
                <div className="w-14 h-14 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 p-2 flex items-center justify-center text-[#3B82F6]">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">CITT Duoc UC</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">Aliado estratégico que respaldó nuestra primera validación tecnológica en entornos escolares.</p>
              </div>
              <div className="mt-6 border-t border-white/5 pt-3">
                <a href="https://www.instagram.com/citt_puertomontt/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium">
                  Saber más <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            {/* Cooimpacta */}
            <div className="glass-panel rounded-xl p-8 flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-lg w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-22px)] max-w-xs border border-emerald-500/20">
              <div className="space-y-4 text-left">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 p-2 flex items-center justify-center text-emerald-400">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Cooimpacta 2025</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">Finalistas nacionales en Santiago: entre los <strong className="text-emerald-400 font-semibold">20 seleccionados de 179 postulaciones</strong> de la Fundación Coopeuch y Duoc UC, validando nuestro modelo de triple impacto en el aula.</p>
              </div>
              <div className="mt-6 border-t border-white/5 pt-3">
                <a href="https://www.duoc.cl/cooimpacta/" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium">
                  Saber más <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            {/* All In Chile */}
            <div className="glass-panel rounded-xl p-8 flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-lg w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-22px)] max-w-xs">
              <div className="space-y-4 text-left">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 p-2 flex items-center justify-center text-amber-400">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">All In Chile 2025</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">Destacados como uno de los 100 mejores proyectos de innovación profunda del país por Ruta IE y Santander X.</p>
              </div>
              <div className="mt-6 border-t border-white/5 pt-3">
                <a href="https://www.duoc.cl/allinchile/" target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium">
                  Saber más <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ===== SECCIÓN 5: CTA FINAL ===== */}
      <section className="py-24 flex flex-col items-center text-center relative overflow-hidden px-4">
        <div className="absolute inset-0 bg-gradient-to-t from-[#3B82F6]/10 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center relative z-10 space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Lidera la innovación en educación especial.
          </h2>
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-light">
            Asegura la trazabilidad de tu Programa PIE con la única plataforma de telemetría neuromotora y gimnasia bimanual activa del país.
          </p>
          <div className="pt-4 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => openContactModal('Postular para el Piloto 2026')}
              className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl transition-all duration-300 text-sm font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_35px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 border border-blue-400/20"
            >
              <span>Solicitar Demostración Institucional</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={goToLogin}
              className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl text-sm font-semibold transition-all border border-white/10 flex items-center gap-2"
            >
              Iniciar Sesión
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="CogniMirror" className="w-8 h-8 object-contain" />
                <span className="font-bold text-white text-sm">CogniMirror</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Plataforma B2B especializada en captura de datos neuromotores y estimulación bimanual activa.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white text-xs font-mono font-bold uppercase tracking-wider">Ubicación</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                CogniMirror SpA<br />Puerto Montt, Chile.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white text-xs font-mono font-bold uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-light">
                <li className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <a href="mailto:cognimirrorspa@gmail.com" className="hover:text-white transition-colors">cognimirrorspa@gmail.com</a>
                </li>
                <li className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <a href="tel:+56979430387" className="hover:text-white transition-colors">+56 9 7943 0387</a>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-white text-xs font-mono font-bold uppercase tracking-wider">Plataforma</h4>
              <button onClick={goToLogin} className="text-xs text-slate-400 hover:text-white transition-colors block text-left font-light">
                Ingresar / Probar Demo
              </button>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-mono">
            <span>© 2026 CogniMirror SpA. Todos los derechos reservados.</span>
            <div className="flex gap-4">
              <span className="hover:text-slate-400 cursor-pointer">Términos</span>
              <span className="hover:text-slate-400 cursor-pointer">Privacidad</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== MODAL DE CONTACTO ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel border border-white/10 rounded-xl p-6 w-full max-w-md relative shadow-2xl text-left">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            {formSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">¡Postulación Recibida!</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light">
                  Hemos registrado tu solicitud para <strong>{modalTitle}</strong>.<br />
                  Nos contactaremos contigo al correo o teléfono indicado a la brevedad.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-400" />
                  {modalTitle}
                </h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Completa el formulario para agendar tu demo institucional o postular al piloto 2026 de CogniMirror.
                </p>
                {[
                  { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Ej: Carolina González' },
                  { label: 'Colegio / Institución', key: 'institution', type: 'text', placeholder: 'Ej: Colegio San José' },
                  { label: 'Correo Electrónico', key: 'email', type: 'email', placeholder: 'cgonzalez@colegio.cl' },
                  { label: 'Teléfono de contacto', key: 'phone', type: 'tel', placeholder: '+56 9 1234 5678' },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">{field.label}</label>
                    <input
                      type={field.type}
                      required
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-[#10131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-[#1a1e29] transition-all"
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Mensaje (Opcional)</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Cuéntanos sobre los desafíos de tu PIE..."
                    rows={3}
                    className="w-full bg-[#10131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-[#1a1e29] transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 border border-blue-400/10"
                >
                  <span>Enviar Información</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
