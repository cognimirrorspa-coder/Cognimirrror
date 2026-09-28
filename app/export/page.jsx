'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';

export default function ExportRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?tab=informes');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#121622] text-[#e2e8f0] flex flex-col items-center justify-center p-6">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-pulse">
        <Brain className="w-6 h-6 text-white" />
      </div>
      <p className="text-sm font-bold text-slate-300">Cargando Centro de Reportes y FUDEI...</p>
      <span className="text-xs text-slate-500 mt-1 font-mono">Redirigiendo al panel unificado de CogniMirror</span>
    </div>
  );
}
