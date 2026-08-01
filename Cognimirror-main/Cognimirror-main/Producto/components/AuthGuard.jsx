'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        console.log('[AuthGuard] Redirigiendo a /login - Usuario no autenticado');
        router.replace('/login');
      } else if (user && pathname === '/login') {
        console.log('[AuthGuard] Redirigiendo a /dashboard - Usuario ya autenticado');
        router.replace('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  // Pantalla de carga estética durante la verificación de sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080f] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
        <div className="text-white/40 text-xs font-black tracking-widest uppercase animate-pulse">
          Verificando Sesión de Especialista...
        </div>
      </div>
    );
  }

  // Si no está autenticado y no está en /login, bloquea la visualización
  if (!user && pathname !== '/login') {
    return null;
  }

  // Si está autenticado e intenta ir a /login, bloquea la visualización (se redirigirá al dashboard)
  if (user && pathname === '/login') {
    return null;
  }

  return children;
}
