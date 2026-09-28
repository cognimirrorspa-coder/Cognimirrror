'use client';

import { useRouter } from 'next/navigation';
import { usePatientsDB } from '../../hooks/usePatientsDB';
import { useAuth } from '../../contexts/AuthContext';
import DirectorioAlumnosPIE from '../../components/DirectorioAlumnosPIE';
import { ArrowLeft, LogOut, Brain } from 'lucide-react';
import Link from 'next/link';

export default function StudentDirectoryPage() {
  const router = useRouter();
  const { patients, cursos, loadingPatients, createPatient } = usePatientsDB();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 px-4 sm:px-8 py-3.5 border-b border-[#1b202e] bg-[#121622]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Regresar al Panel</span>
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white leading-none">CogniMirror</h2>
              <span className="text-[9px] uppercase tracking-wider text-blue-400 font-bold">Gestión Escolar PIE</span>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <DirectorioAlumnosPIE
          students={patients}
          cursos={cursos}
          loading={loadingPatients}
          isDark={true}
          onCreateStudent={createPatient}
        />
      </main>
    </div>
  );
}
