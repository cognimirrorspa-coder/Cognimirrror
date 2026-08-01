'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ShieldAlert, Delete } from 'lucide-react';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const safePath = pathname || '';

  // Estado del Kiosco
  const [isKioscoLocked, setIsKioscoLocked] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);

  // Rutas públicas o semi-abiertas que NO requieren bloqueo de sesión
  const PUBLIC_ROUTES = ['/', '/login', '/patients'];
  const isPublicRoute = PUBLIC_ROUTES.includes(safePath);

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        // Ruta protegida sin sesión → va al login
        console.log('[AuthGuard] Redirigiendo a /login - Usuario no autenticado');
        router.replace('/login');
      } else if (user && safePath === '/login') {
        // Ya autenticado e intenta entrar al login → va al dashboard
        console.log('[AuthGuard] Redirigiendo a /dashboard - Usuario ya autenticado');
        router.replace('/dashboard');
      }
      // Si user && safePath === '/' → permite ver el landing aunque esté autenticado
    }
  }, [user, loading, safePath, isPublicRoute, router]);

  // Verificar si hay bloqueo activo de modo Kiosco
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const active = localStorage.getItem('cognimirror_kiosco_active') === 'true';
      const isGamePath = safePath.startsWith('/reaction-game') || 
                         safePath.startsWith('/simon-game') || 
                         safePath.startsWith('/remote-eval') || 
                         safePath.startsWith('/evaluador');
      
      // Bloquear solo si está activo el kiosco en el almacenamiento local y no estamos en una ruta de juego permitida
      if (active && !isGamePath) {
        setIsKioscoLocked(true);
      } else {
        setIsKioscoLocked(false);
      }
    }
  }, [safePath, loading]);

  const handleKeyPress = (num) => {
    setPinError(false);
    if (pinCode.length < 4) {
      const nextCode = pinCode + num;
      setPinCode(nextCode);
      if (nextCode === '1234') {
        setTimeout(() => {
          localStorage.removeItem('cognimirror_kiosco_active');
          setIsKioscoLocked(false);
          setPinCode('');
          router.replace('/dashboard');
        }, 150);
      } else if (nextCode.length === 4) {
        setTimeout(() => {
          setPinError(true);
          setPinCode('');
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setPinCode(pinCode.slice(0, -1));
    setPinError(false);
  };

  // 1. Si es ruta pública o semi-abierta (/patients, /, /login), renderizar de inmediato sin bloquear en pantalla de carga
  if (isPublicRoute) {
    if (!loading && user && safePath === '/login') {
      router.replace('/dashboard');
      return null;
    }
    return children;
  }

  // 2. Pantalla de carga estética para rutas estrictamente privadas mientras verifica sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080f] flex flex-col items-center justify-center gap-4 text-white font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <div className="text-indigo-300/60 text-xs font-black tracking-widest uppercase animate-pulse">
          Verificando Sesión...
        </div>
      </div>
    );
  }

  // Si no está autenticado y es una ruta protegida, bloquea visualización
  if (!user && !isPublicRoute) {
    return null;
  }

  // Si está autenticado e intenta ir a /login, bloquea (se redirigirá al dashboard)
  if (user && safePath === '/login') {
    return null;
  }

  // Renderizar bloqueo completo de Modo Kiosco
  if (isKioscoLocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#030303] flex flex-col items-center justify-center text-center p-6 font-sans">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[500px] opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#8b5cf6_0%,transparent_70%)] mix-blend-screen" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 shadow-inner">
          <Lock size={32} className="animate-pulse text-purple-500" />
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          Modo Kiosco Bloqueado
        </h1>
        <p className="text-sm text-slate-400 max-w-sm mb-10 leading-relaxed">
          Esta terminal está ejecutando una sesión de evaluación clínica. Para retornar al panel de administración, se requiere autorización del especialista.
        </p>

        {/* Círculos de Indicador de PIN */}
        <div className="flex justify-center gap-4 mb-12">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pinError
                  ? 'border-red-500 bg-red-500 animate-bounce'
                  : idx < pinCode.length
                  ? 'border-purple-500 bg-purple-500 scale-110 shadow-[0_0_8px_#8b5cf6]'
                  : 'border-white/20 bg-transparent'
              }`}
            />
          ))}
        </div>

        {pinError && (
          <div className="text-red-500 text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-1.5 animate-pulse">
            <ShieldAlert size={14} /> PIN de supervisor incorrecto
          </div>
        )}

        {/* Teclado Numérico Estilo Premium iOS */}
        <div className="grid grid-cols-3 gap-4 max-w-[280px] w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 text-2xl font-bold text-white/90 hover:bg-white/[0.08] hover:border-purple-500/30 active:scale-95 transition-all flex items-center justify-center select-none"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-16" /> {/* Espacio vacío */}
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 text-2xl font-bold text-white/90 hover:bg-white/[0.08] hover:border-purple-500/30 active:scale-95 transition-all flex items-center justify-center select-none"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full text-white/40 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center select-none"
            title="Borrar"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    );
  }

  return children;
}
