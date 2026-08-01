'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBluetoothCube } from '../../contexts/BluetoothContext';
import Cube3DViewer from '../../components/Cube3DViewer';
import { getSlideComponent, SLIDES_COUNT } from '../../components/defensa/SlidesData';
import { Bluetooth, BluetoothConnected, Keyboard, ArrowRight, ArrowLeft } from 'lucide-react';

function DefensaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, connectBLE, subscribeToMoves, batteryLevel } = useBluetoothCube();
  
  // Leer slide inicial desde URL (?slide=X) o por defecto 0
  const initialSlide = parseInt(searchParams.get('slide'), 10);
  const [activeSlide, setActiveSlide] = useState(!isNaN(initialSlide) ? initialSlide : 0);

  // Navegar de forma segura
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => {
      const next = prev + 1;
      if (next < SLIDES_COUNT) {
        // Actualizar URL de forma silenciosa para permitir deep linking de regreso
        router.replace(`/defensa?slide=${next}`);
        return next;
      }
      return prev;
    });
  }, [router]);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => {
      const next = prev - 1;
      if (next >= 0) {
        router.replace(`/defensa?slide=${next}`);
        return next;
      }
      return prev;
    });
  }, [router]);

  // 1. Navegación por Hardware (Giros de Cubo BLE)
  useEffect(() => {
    console.log('[Defensa] Suscribiéndose a giros del cubo Rubik...');
    const unsub = subscribeToMoves((notation) => {
      // Limpiar prima de la notación
      const cleanNotation = notation.replace("'", "");
      
      if (cleanNotation === 'R') {
        console.log('[Defensa] Giro R detectado: Avanzando slide');
        nextSlide();
      } else if (cleanNotation === 'L') {
        console.log('[Defensa] Giro L detectado: Retrocediendo slide');
        prevSlide();
      }
    });

    return () => {
      console.log('[Defensa] Desuscribiéndose de giros del cubo');
      unsub();
    };
  }, [subscribeToMoves, nextSlide, prevSlide]);

  // 2. Navegación por Teclado (Respaldo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div className="min-h-screen bg-[#030207] text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between">
      
      {/* Fondo espacial premium */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[140px]" />
      </div>

      {/* Header de la Presentación */}
      <header className="relative z-10 p-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase rounded tracking-widest font-mono shadow-[0_0_10px_rgba(168,85,247,0.1)]">
            Defensa de Título
          </span>
          <span className="text-white/40 text-xs font-semibold">|</span>
          <span className="text-xs text-slate-400 font-bold font-mono tracking-wider">
            Proyecto CogniMirror
          </span>
        </div>

        {/* Panel de Conexión BLE del Cube */}
        <div className="flex items-center gap-3">
          <button 
            onClick={connectBLE}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
              isConnected 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {isConnected ? (
              <>
                <BluetoothConnected size={14} className="animate-pulse" />
                Cubo Conectado {batteryLevel !== null && `(${batteryLevel}%)`}
              </>
            ) : (
              <>
                <Bluetooth size={14} />
                Conectar Cubo
              </>
            )}
          </button>
          
          <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 text-xs font-bold flex items-center gap-1.5 font-mono" title="Puedes usar teclado de respaldo">
            <Keyboard size={14} />
            L/R o Teclas
          </div>
        </div>
      </header>

      {/* Contenedor del Slide Activo */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 md:p-12 min-h-[70vh]">
        <div className="w-full transition-all duration-300 transform">
          {getSlideComponent(activeSlide)}
        </div>
      </main>

      {/* Footer de la Presentación & Controles */}
      <footer className="relative z-10 p-6 flex flex-col sm:flex-row items-center justify-between border-t border-white/5 bg-black/40 backdrop-blur-md gap-4">
        {/* Barra de Progreso */}
        <div className="flex-1 max-w-md w-full">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-black uppercase tracking-widest font-mono mb-2">
            <span>Progreso Defensa</span>
            <span>Diapositiva {activeSlide + 1} / {SLIDES_COUNT}</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-[0_0_10px_#8b5cf6]"
              style={{ width: `${((activeSlide + 1) / SLIDES_COUNT) * 100}%` }}
            />
          </div>
        </div>

        {/* Botones de Navegación Manual */}
        <div className="flex items-center gap-3">
          <button 
            onClick={prevSlide}
            disabled={activeSlide === 0}
            className="p-3 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Slide Anterior (Giro L o Tecla Izquierda)"
          >
            <ArrowLeft size={16} />
          </button>
          <button 
            onClick={nextSlide}
            disabled={activeSlide === SLIDES_COUNT - 1}
            className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl text-white disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 transition-all cursor-pointer"
            title="Siguiente Slide (Giro R o Tecla Derecha)"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </footer>

      {/* Gemelo Digital WebGL Fijo en la Esquina */}
      <div 
        className="fixed bottom-24 right-8 z-[100] bg-black/35 border border-white/5 p-4 rounded-3xl backdrop-blur-md shadow-2xl pointer-events-none transform scale-75 origin-bottom-right"
        style={{ width: '220px', height: '220px' }}
      >
        <div className="absolute top-2 left-4 text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">
          Visualizador Háptico 3D
        </div>
        <div className="w-full h-full pt-2">
          <Cube3DViewer />
        </div>
      </div>

    </div>
  );
}

export default function DefensaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030207] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin" />
        <div className="text-purple-400 text-xs font-black tracking-widest uppercase animate-pulse">
          Cargando Diapositivas de Examen...
        </div>
      </div>
    }>
      <DefensaContent />
    </Suspense>
  );
}
