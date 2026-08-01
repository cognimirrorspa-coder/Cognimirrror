'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

// =========================================================================
// MODO BYPASS DE CONTINGENCIA LOCAL (FÁCIL DE DESACTIVAR O ELIMINAR)
// =========================================================================
// Cambia ENABLE_OFFLINE_BYPASS a `false` cuando recuperes el acceso 2FA de GitHub
// para volver a utilizar la autenticación real de Supabase Auth.
const ENABLE_OFFLINE_BYPASS = false;

const BYPASS_EMAIL = 'evaluador@cognimirror.com';
const BYPASS_PASSWORD = 'clinica2026';
const BYPASS_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: BYPASS_EMAIL,
  user_metadata: {
    full_name: 'Ps. Evaluador de Prueba'
  }
};
const BYPASS_SESSION = {
  user: BYPASS_USER,
  access_token: 'bypass-mock-token-1234567890',
  refresh_token: 'bypass-mock-token-1234567890'
};
// =========================================================================

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión activa al inicializar
    const getInitialSession = async () => {
      try {
        const stored = localStorage.getItem('cognimirror_bypass_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (e) {
        console.error('[AuthContext] Error obteniendo sesión inicial:', e.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Suscribirse a cambios en el estado de autenticación (login, logout, token refrescado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const stored = localStorage.getItem('cognimirror_bypass_session');
      if (stored) {
        setUser(JSON.parse(stored).user);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      // 1. Verificar las cuentas demo estáticas locales por defecto (evaluador/psicologo)
      if (email === BYPASS_EMAIL || email === 'psicologo@clinica.com') {
        const passwordCorrect = (email === BYPASS_EMAIL && password === BYPASS_PASSWORD) || 
                                (email === 'psicologo@clinica.com' && password === 'clinica2026');
        
        if (!passwordCorrect) {
          return { data: null, error: { message: 'Contraseña incorrecta para la cuenta de demostración.' } };
        }
        
        const demoUser = {
          id: '00000000-0000-0000-0000-000000000000',
          email: email,
          user_metadata: {
            full_name: email === BYPASS_EMAIL ? 'Ps. Evaluador de Prueba' : 'Ps. Especialista Clínico'
          }
        };
        const demoSession = {
          user: demoUser,
          access_token: 'bypass-mock-token-1234567890',
          refresh_token: 'bypass-mock-token-1234567890'
        };
        
        localStorage.setItem('cognimirror_bypass_session', JSON.stringify(demoSession));
        setUser(demoUser);
        return { data: { user: demoUser, session: demoSession }, error: null };
      }

      // 2. Intentar login real contra Supabase Auth en la nube (el usuario creado en auth.users)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (data && data.user && data.session) {
        localStorage.setItem('cognimirror_bypass_session', JSON.stringify(data.session));
        setUser(data.user);
        return { data, error: null };
      }

      // 3. Fallback: Consultar si el especialista existe en la tabla de bypass persistente legacy
      const { data: bypassUser, error: bypassError } = await supabase
        .from('especialistas_bypass')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (bypassUser) {
        if (bypassUser.password !== password) {
          return { data: null, error: { message: 'Contraseña incorrecta para el usuario registrado.' } };
        }
        
        const matchedUser = {
          id: bypassUser.id,
          email: bypassUser.email,
          user_metadata: {
            full_name: bypassUser.nombre_completo
          }
        };
        const sessionObj = {
          user: matchedUser,
          access_token: 'bypass-db-token-' + bypassUser.id,
          refresh_token: 'bypass-db-token-' + bypassUser.id
        };
        
        localStorage.setItem('cognimirror_bypass_session', JSON.stringify(sessionObj));
        setUser(matchedUser);
        return { data: { user: matchedUser, session: sessionObj }, error: null };
      }

      if (authError) throw authError;

      return { data: null, error: { message: 'Usuario no encontrado en el sistema.' } };
    } catch (error) {
      console.error('[AuthContext] Error al iniciar sesión:', error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, fullName) => {
    setLoading(true);
    try {
      // 1. Registrar el usuario mediante nuestra API segura en el servidor
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, fullName })
      });

      const resData = await res.json();

      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Error al intentar registrar usuario en la base de datos de autenticación.');
      }

      // 2. Si la creación en auth.users fue exitosa, iniciamos sesión automáticamente
      console.log('[AuthContext] Cuenta creada en Supabase Auth, iniciando sesión...');
      return await signIn(email, password);

    } catch (error) {
      console.error('[AuthContext] Error en el flujo de registro:', error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('cognimirror_bypass_session');
      setUser(null);
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignorar
      }
    } catch (error) {
      console.error('[AuthContext] Error al cerrar sesión:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
