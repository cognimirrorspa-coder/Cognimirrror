'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import MemoryGameView from '../../components/MemoryGameView';

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const etiquetaEstudio = searchParams.get('etiquetaEstudio');
  const modo = searchParams.get('modo');
  
  const isDemo = modo === 'defensa';
  const warmup = isDemo || searchParams.get('warmup') === 'true';

  const handleExit = () => {
    if (isDemo) {
      router.push('/defensa?slide=13'); // Diapositiva 14
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative">
      {/* Botón flotante para retorno inmersivo a la presentación */}
      {isDemo && (
        <button 
          onClick={handleExit}
          className="fixed top-5 left-5 z-[9999] px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-500/20 border border-purple-500/30 flex items-center gap-1.5"
        >
          <span>◀</span> Volver a la Defensa
        </button>
      )}

      <MemoryGameView 
        onExit={handleExit} 
        subjectId={subjectId}
        etiquetaEstudio={etiquetaEstudio}
        isWarmupUrl={warmup}
        isDemoMode={isDemo}
      />
    </div>
  );
}

export default function SimonGamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center">
        <div className="text-white/45 text-sm font-semibold tracking-widest animate-pulse">
          Iniciando Módulo de Juego...
        </div>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
