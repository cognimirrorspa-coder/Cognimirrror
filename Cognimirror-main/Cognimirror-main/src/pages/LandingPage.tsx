// LandingPage.tsx - Página de Inicio Deep Tech B2B de CogniMirror
import { useState, useEffect } from 'react';
import { 
  Brain, Users, Award, ArrowRight, Activity, Sparkles, 
  Trophy, ShieldAlert, Hourglass, Eye, CheckCircle, 
  Mail, Phone, ExternalLink, Play, Layers, X, Send, Calendar, Clock, ChevronRight,
  AlertCircle, EyeOff, FileText, Server, Smartphone, Landmark, HeartHandshake,
  ClipboardX, Gamepad2, Globe, FileWarning
} from 'lucide-react';
import Cube3DViewer from '../components/Cube3DViewer';

import { Brain3D } from '../components/animations/Brain3D';
import { useSmoothScroll } from '../hooks/useSmoothScroll';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

// SimulatedDashboard importado desde componente separado
import { SimulatedDashboard } from '../components/animations/SimulatedDashboard';

export const LandingPage = ({ onNavigate }: LandingPageProps) => {
  useSmoothScroll();
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', institution: '', email: '', phone: '', message: '' });

  const openContactModal = (title: string) => {
    setModalTitle(title);
    setShowModal(true);
    setFormSubmitted(false);
    setFormData({ name: '', institution: '', email: '', phone: '', message: '' });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Lead B2B Capturado:", formData);
    setFormSubmitted(true);
    setTimeout(() => {
      setShowModal(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen text-[#e1e2ec] font-sans antialiased selection:bg-blue-500/30 selection:text-blue-100 overflow-x-hidden relative">
      {/* ================= SECCIÓN 1: HERO ================= */}
      <section
         className="relative overflow-hidden border-b border-white/5 pt-24 pb-20 px-4">
        {/* Brillo Eléctrico */}
        <div className="electric-glow top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2" />
        
        {/* Brain3D injected into the Hero background */}
        <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full opacity-80 pointer-events-auto z-0 hidden md:block">
          {/* Capa de enmascaramiento para ocultar la red neuronal del fondo detrás del cerebro */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0B0F19_35%,_transparent_70%)] z-0" />
          <div className="relative z-10 w-full h-full">
            <Brain3D />
          </div>
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10 pointer-events-none">
          <div className="grid lg:grid-cols-12 gap-12 items-center min-h-[500px] lg:min-h-[650px] lg:pt-8">
            
            {/* Contenido Izquierdo */}
            <div className="lg:col-span-7 space-y-8 text-left lg:pt-4 pointer-events-auto">
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-sm">
                Telemetría Phygital que blinda tu Programa PIE.
              </h1>
              
              <p className="text-lg md:text-xl text-slate-400 max-w-xl font-light leading-relaxed">
                Deja atrás el 'espejismo académico' y las evaluaciones subjetivas. CogniMirror transforma herramientas físicas en métricas clínicas exactas, ahorrando cientos de horas a tu equipo psicosocial.
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

      {/* ================= SECCIÓN 1.5: EXPERIENCIA PHYGITAL (VIDEO + TELEMETRÍA) ================= */}
      <section
         id="experiencia-phygital" className="py-24 relative border-b border-white/5 bg-[#0B0F19]/50">
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
              Observa cómo la interacción del estudiante con el cubo inteligente se traduce instantáneamente en datos precisos de latencia, asimetría e inhibición, directamente en tu dashboard clínico.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-stretch justify-center max-w-6xl mx-auto">
            {/* Lado A: Video del niño jugando */}
            <div className="w-full md:w-[45%] flex flex-col relative">
              <div className="w-full h-full bg-[#0a0d14]/80 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl relative pt-12 pb-6 px-6 flex flex-col">
                
                {/* Title */}
                <div className="absolute top-0 inset-x-0 flex justify-center -mt-3">
                  <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold bg-[#0B0F19] px-4 py-1 rounded">
                    LA INTERACCIÓN FÍSICA
                  </span>
                </div>

                {/* Video container */}
                <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto overflow-hidden rounded-xl shadow-lg shadow-black/50 mb-8 border border-white/5 flex-grow">
                  <iframe 
                    src="https://www.youtube.com/embed/Fj5hjHPPdeY?autoplay=1&mute=1&loop=1&playlist=Fj5hjHPPdeY" 
                    title="Niño jugando con cubo inteligente"
                    className="absolute inset-0 w-full h-full object-cover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>

                {/* Caption */}
                <p className="text-sm text-slate-300 font-light text-center leading-relaxed mt-auto">
                  El estudiante manipula el cubo inteligente, rastreando sus movimientos y el contexto del entorno.
                </p>
              </div>
            </div>

            {/* Elementos Conectores */}
            <div className="hidden md:flex flex-col items-center justify-center gap-10 text-slate-600/40">
              <div className="flex -space-x-3">
                <ChevronRight className="w-8 h-8" />
                <ChevronRight className="w-8 h-8" />
                <ChevronRight className="w-8 h-8" />
              </div>
              <ArrowRight className="w-5 h-5" />
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Lado B: Simulador del Dashboard Clínico */}
            <div className="w-full md:w-[45%] flex flex-col relative">
              <div className="w-full h-full bg-[#0a0d14]/80 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl relative pt-12 pb-6 px-6 flex flex-col">
                
                {/* Title */}
                <div className="absolute top-0 inset-x-0 flex justify-center -mt-3">
                  <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold bg-[#0B0F19] px-4 py-1 rounded">
                    EL DASHBOARD CLÍNICO (TELEMETRÍA EN VIVO)
                  </span>
                </div>

                {/* Dashboard container */}
                <div className="relative w-full overflow-hidden rounded-xl shadow-lg shadow-black/50 mb-8 flex-grow flex items-center">
                  <SimulatedDashboard />
                </div>

                {/* Caption */}
                <p className="text-sm text-slate-300 font-light text-center leading-relaxed mt-auto">
                  Conversión instantánea de datos en métricas clave: Latencia, Giros y Asimetría en tiempo real.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECCIÓN 2: AGITANDO EL DOLOR ================= */}
      <section
         className="py-24 relative border-b border-white/5">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white max-w-3xl mx-auto tracking-tight">
              El modelo actual está agotando a tus profesionales.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 - Destacados: 40% y Decreto 170 */}
            <div className="glass-panel p-6 rounded-lg flex flex-col gap-4 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffb4ab]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="w-12 h-12 rounded bg-[#10131a] border border-white/10 flex items-center justify-center mb-2">
                <ClipboardX className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-5xl md:text-7xl font-mono text-[#3B82F6] font-bold select-none leading-none mb-2">40%</div>
              <h3 className="text-lg font-bold text-white">El Colapso Administrativo</h3>
              <div className="h-px w-full bg-white/10 my-2"></div>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Los psicólogos gastan hasta un <strong className="text-white font-semibold">40%</strong> de sus horas en papeleo manual para justificar el <strong className="text-white font-semibold">Decreto 170</strong>. Ese es tiempo clínico perdido.
              </p>
            </div>

            {/* Card 2 - Destacado: D.170 */}
            <div className="glass-panel p-6 rounded-lg flex flex-col gap-4 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="w-12 h-12 rounded bg-[#10131a] border border-white/10 flex items-center justify-center mb-2">
                <Smartphone className="w-6 h-6 text-orange-300" />
              </div>
              <div className="text-5xl md:text-7xl font-mono text-indigo-400 font-bold select-none leading-none mb-2">D.170</div>
              <h3 className="text-lg font-bold text-white">El Villano del 'Scroll Infinito'</h3>
              <div className="h-px w-full bg-white/10 my-2"></div>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Pérdida de atención y deterioro del desarrollo neuromotor en alumnos por sobreexposición a pantallas pasivas.
              </p>
            </div>

            {/* Card 3 - Destacado: Ojo Humano */}
            <div className="glass-panel p-6 rounded-lg flex flex-col gap-4 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all duration-300">
              <div className="w-12 h-12 rounded bg-[#10131a] border border-white/10 flex items-center justify-center mb-2">
                <EyeOff className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-5xl md:text-7xl font-mono text-slate-500 font-bold select-none leading-none mb-2">1/100</div>
              <h3 className="text-lg font-bold text-white">Evaluaciones a 'Ojo Humano'</h3>
              <div className="h-px w-full bg-white/10 my-2"></div>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Datos subjetivos del cronómetro que complican la validación de avances cognitivos y bimanuales objetivos.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= ESTUDIO CLINICO BANNER ================= */}
      <section
         className="py-20 px-4 relative border-b border-white/5">
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
            Estamos validando la primera tecnología phygital de telemetría neurocognitiva en la región de Los Lagos. Necesitamos 20 minutos de tu tiempo. Mide tus reflejos, tu control de impulsos y tu memoria visoespacial de forma gratuita. Al finalizar, obtendrás un reporte exclusivo de tu rendimiento.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('agendar')}
              className="relative group overflow-hidden px-7 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 mx-auto active:scale-[0.98]"
            >
              <Calendar className="w-4 h-4 fill-current group-hover:rotate-12 transition-transform" />
              <span>Reservar mi Bloque de Prueba (20 min)</span>
            </button>
          </div>
        </div>
      </section>
 
      {/* ================= SECCIÓN 3: LA SOLUCIÓN ================= */}
      <section
         id="what-we-do" className="py-24 px-4 relative">
        <div className="mb-16 border-l-2 border-[#3B82F6] pl-6 max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white max-w-4xl tracking-tight">
            Gimnasia Cerebral Phygital: entrenando mentes, no zombies digitales.
          </h2>
        </div>

        <div className="container mx-auto max-w-7xl flex flex-col gap-20">
          
          {/* Feature 1: Informes MINEDUC */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-8">
            <div className="md:col-span-6 glass-panel rounded-lg p-8 h-[400px] w-full flex flex-col justify-between thin-stroke-grid border border-white/10">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono font-medium tracking-wider text-[#3B82F6]">DATA.EXPORT.MINEDUC</span>
                <FileWarning className="w-5 h-5 text-slate-400" />
              </div>
              
              <div className="bg-[#10131a]/80 p-4 border border-white/5 rounded-lg w-full flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/10 rounded flex items-center justify-center text-[#3B82F6] border border-blue-500/20">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-[8px] text-slate-500 block font-mono">REPORTE CLINICO</span>
                  <span className="text-xs font-mono font-bold text-slate-300">decreto_170_evaluacion.pdf</span>
                </div>
                <button className="px-3 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg text-[10px] font-semibold transition-all hover:shadow-[0_0_10px_rgba(59,130,246,0.4)] active:scale-95">Exportar</button>
              </div>

              <div className="flex gap-1 items-end h-28">
                <div className="w-8 bg-[#3B82F6]/10 h-[20%] rounded-t"></div>
                <div className="w-8 bg-[#3B82F6]/30 h-[40%] rounded-t"></div>
                <div className="w-8 bg-[#3B82F6]/50 h-[60%] rounded-t"></div>
                <div className="w-8 bg-[#3B82F6] h-[100%] rounded-t shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              </div>
            </div>
            
            <div className="md:col-span-6 text-left space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold text-white">Informes MINEDUC a un Clic</h3>
              <p className="text-base text-slate-400 font-light leading-relaxed">
                Generación automática de reportes estandarizados, listos para auditoría y cumplimiento normativo del Decreto 170. Le devolvemos la mitad de su jornada laboral al equipo clínico al automatizar informes complejos en segundos.
              </p>
            </div>
          </div>

          {/* Feature 2: Hardware Agnóstico */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-8">
            <div className="md:col-span-6 md:col-start-7 glass-panel rounded-lg p-8 h-[400px] w-full flex flex-col justify-between relative overflow-hidden order-1 md:order-2 border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/10 to-transparent pointer-events-none" />
              
              <div className="flex justify-between items-start font-mono text-xs text-slate-400">
                <span className="tracking-wider">SYSTEM.COMPATIBILITY</span>
                <Gamepad2 className="w-5 h-5 text-[#3B82F6]" />
              </div>

              {/* 3D Rotating Cube embed */}
              <div className="w-full flex items-center justify-center z-10 my-auto">
                <Cube3DViewer size={200} isLocked={true} />
              </div>

              <div className="bg-[#10131a]/60 p-3 rounded-lg border border-white/5 font-mono text-[9px] flex justify-between">
                <span className="text-slate-400">GAN Smart V3 & V2</span>
                <span className="text-emerald-400 font-bold">✓ COMPATIBLE</span>
              </div>
            </div>
            
            <div className="md:col-span-6 md:col-start-1 md:row-start-1 order-2 md:order-1 text-left space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold text-white">Hardware Agnóstico & Integración Cloud-Native</h3>
              <p className="text-base text-slate-400 font-light leading-relaxed">
                No te atamos a un dispositivo exclusivo de alto costo. Nuestra plataforma es compatible con múltiples versiones de cubos inteligentes Bluetooth disponibles en el mercado. Tú eliges la infraestructura física, nosotros proveemos el software clínico sincronizado de forma segura en la nube.
              </p>
            </div>
          </div>

          {/* Feature 3: Cobertura sin Fronteras (Destacando Palena y Chiloé) */}
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
                Una solución SaaS Cloud-Native diseñada para funcionar sin latencia. Desde los centros urbanos hasta las zonas más extremas de la región, como las comunas de 
                <strong className="text-white font-semibold"> Palena </strong> o el archipiélago de 
                <strong className="text-white font-semibold"> Chiloé</strong>, cualquier colegio rural puede acceder a telemetría neuropsicológica con solo una conexión a internet básica.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="inline-block bg-blue-950/80 border border-blue-900 text-blue-400 text-[10px] px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">Palena</span>
                <span className="inline-block bg-blue-950/80 border border-blue-900 text-blue-400 text-[10px] px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">Chiloé</span>
                <span className="inline-block bg-slate-900 border border-slate-800 text-slate-400 text-[10px] px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">Cloud Synchronized</span>
              </div>
            </div>
          </div>

          {/* Feature 4: Inmersión Bimanual */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-8">
            <div className="md:col-span-6 md:col-start-7 glass-panel rounded-lg p-8 h-[400px] w-full flex flex-col justify-between relative overflow-hidden order-1 md:order-2 border border-white/10">
              <div className="absolute inset-0 bg-[#3B82F6]/5 pointer-events-none" />
              
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
                  <span className="text-[9px] text-blue-400 font-bold">Corteza Parietal & Motora</span>
                </div>
                <span className="text-[8px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-bold font-mono uppercase">Estímulo Físico</span>
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
                Obligamos al cerebro a salir del letargo. Al exigir el uso de ambas manos y la rotación espacial física del cubo, activamos la corteza motora y parietal del estudiante, capturando su rendimiento en un entorno de alta demanda cognitiva, gamificado y libre de estrés.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECCIÓN 4: VALIDACIÓN Y AUTORIDAD ================= */}
      <section
         id="about" className="py-24 border-t border-b border-white/5 text-center">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-12">
            Tecnología validada por el ecosistema de innovación
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* CITT Duoc UC */}
            <div className="glass-panel rounded-xl p-8 flex flex-col justify-between hover:border-[#3B82F6]/50 transition-all shadow-lg">
              <div className="space-y-4 text-left">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#3B82F6]/10 border border-[#3B82F6]/20 p-2 flex items-center justify-center text-[#3B82F6] hover:scale-110 hover:bg-[#3B82F6]/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">CITT Duoc UC</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">
                  Aliado estratégico que respaldó nuestra primera validación tecnológica en entornos escolares.
                </p>
              </div>
              <div className="mt-6 border-t border-white/5 pt-3">
                <a href="https://www.instagram.com/citt_puertomontt/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium">
                  Saber más <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Cooimpacta 2025 */}
            <div className="glass-panel rounded-xl p-8 flex flex-col justify-between hover:border-[#3B82F6]/50 transition-all shadow-lg">
              <div className="space-y-4 text-left">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-emerald-500/10 border border-emerald-500/20 p-2 flex items-center justify-center text-emerald-400 hover:scale-110 hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Cooimpacta 2025</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">
                  Seleccionados a nivel nacional por la Fundación Coopeuch y Duoc UC, validando nuestro modelo de triple impacto en el aula.
                </p>
              </div>
              <div className="mt-6 border-t border-white/5 pt-3">
                <a href="https://www.duoc.cl/cooimpacta/" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium">
                  Saber más <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* All In Chile 2025 */}
            <div className="glass-panel rounded-xl p-8 flex flex-col justify-between hover:border-[#3B82F6]/50 transition-all shadow-lg">
              <div className="space-y-4 text-left">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-amber-500/10 border border-amber-500/20 p-2 flex items-center justify-center text-amber-400 hover:scale-110 hover:bg-amber-500/20 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">All In Chile 2025</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">
                  Destacados como uno de los 100 mejores proyectos de innovación profunda del país por Ruta IE y Santander X.
                </p>
              </div>
              <div className="mt-6 border-t border-white/5 pt-3">
                <a href="https://www.duoc.cl/allinchile/" target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium">
                  Saber más <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* CORFO */}
            <div className="glass-panel rounded-xl p-8 flex flex-col justify-between hover:border-[#3B82F6]/50 transition-all shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
              <div className="space-y-4 text-left relative z-10">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 border border-white/10 p-2 flex items-center justify-center transition-all group-hover:bg-white/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                  <img src="/logo-corfo.png" alt="Apoyado por CORFO" className="w-full h-full object-contain drop-shadow-md" />
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">Apoyado por CORFO</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">
                  Cofinanciados por el Estado de Chile para el desarrollo y empaquetamiento de nuestra tecnología de telemetría neurocognitiva.
                </p>
              </div>
              <div className="mt-6 border-t border-white/5 pt-3 relative z-10">
                <a href="https://www.corfo.cl/" target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-medium">
                  Saber más <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECCIÓN 5: CIERRE Y LLAMADO A LA ACCIÓN ================= */}
      <section
         className="py-24 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#3B82F6]/10 to-transparent pointer-events-none" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10 space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Lidera la innovación en educación especial.
          </h2>
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-light">
            Asegura la trazabilidad de tu Programa PIE con la única plataforma de telemetría neuromotora y gimnasia bimanual activa del país.
          </p>
          
          <div className="pt-4">
            <button
              onClick={() => openContactModal('Postular para el Piloto 2026')}
              className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl transition-all duration-300 text-sm font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_35px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 mx-auto border border-blue-400/20"
            >
              <span>Solicitar Demostración Institucional</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 text-left">
            
            {/* Columna CM */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="CogniMirror" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                <span className="font-bold text-white text-sm">CogniMirror</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Plataforma B2B especializada en captura de datos neuromotores y estimulación bimanual activa.
              </p>
            </div>

            {/* Columna Ubicación */}
            <div className="space-y-2">
              <h4 className="text-white text-xs font-mono font-bold uppercase tracking-wider">Ubicación</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                CogniMirror SpA<br />
                Puerto Montt, Chile.
              </p>
            </div>

            {/* Contacto */}
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

            {/* Enlaces */}
            <div className="space-y-2">
              <h4 className="text-white text-xs font-mono font-bold uppercase tracking-wider">Plataforma</h4>
              <button
                onClick={() => onNavigate('try-now')}
                className="text-xs text-slate-400 hover:text-white transition-colors block text-left font-light"
              >
                Ingresar / Probar Demo
              </button>
            </div>

          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-mono">
            <span>
              © 2026 CogniMirror SpA. Todos los derechos reservados.
            </span>
            <div className="flex gap-4">
              <span className="hover:text-slate-400 cursor-pointer">Términos</span>
              <span className="hover:text-slate-400 cursor-pointer">Privacidad</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ================= MODAL DE CONTACTO INTERACTIVO ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel border border-white/10 rounded-xl p-6 w-full max-w-md relative shadow-2xl text-left">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
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

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Nombre completo</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Carolina González"
                    className="w-full bg-[#10131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-[#1a1e29] transition-all" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Colegio / Institución</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.institution}
                    onChange={(e) => setFormData({...formData, institution: e.target.value})}
                    placeholder="Ej: Colegio San José"
                    className="w-full bg-[#10131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-[#1a1e29] transition-all" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Correo Electrónico</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="cgonzalez@colegio.cl"
                    className="w-full bg-[#10131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-[#1a1e29] transition-all" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Teléfono de contacto</label>
                  <input 
                    type="tel" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+56 9 1234 5678"
                    className="w-full bg-[#10131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-[#1a1e29] transition-all" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Mensaje (Opcional)</label>
                  <textarea 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
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
};
