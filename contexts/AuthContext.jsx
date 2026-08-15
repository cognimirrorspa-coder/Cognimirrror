'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

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

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper para cargar perfil desde base de datos Supabase
  const loadUserProfile = async (userObj) => {
    if (!userObj) {
      setProfile(null);
      return null;
    }

    // Mock para usuarios bypass locales
    if (userObj.id === '00000000-0000-0000-0000-000000000000' || userObj.email === 'coordinador@colegio.com') {
      const isCoordinator = userObj.email === 'coordinador@colegio.com';
      const mockProfile = {
        id: userObj.id,
        email: userObj.email,
        nombre_completo: isCoordinator ? 'Coordinador PIE Demostración' : 'Ps. Evaluador de Prueba',
        colegio_id: 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08',
        rol: isCoordinator ? 'coordinador_pie' : 'especialista'
      };
      setProfile(mockProfile);
      return mockProfile;
    }

    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userObj.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        return data;
      } else {
        // Fallback: buscar en especialistas_bypass
        const { data: bypassUser } = await supabase
          .from('especialistas_bypass')
          .select('*')
          .eq('id', userObj.id)
          .maybeSingle();

        if (bypassUser) {
          const fallbackProfile = {
            id: bypassUser.id,
            email: bypassUser.email,
            nombre_completo: bypassUser.nombre_completo,
            colegio_id: 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08',
            rol: 'especialista'
          };
          setProfile(fallbackProfile);
          return fallbackProfile;
        }
      }
      setProfile(null);
      return null;
    } catch (err) {
      console.error('[AuthContext] Error al cargar perfil:', err.message);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const getInitialSession = async () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('cognimirror_bypass_session') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          await loadUserProfile(parsed.user);
          setLoading(false);
          clearTimeout(safetyTimer);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.error('[AuthContext] Error obteniendo sesión inicial:', e.message);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const stored = localStorage.getItem('cognimirror_bypass_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        await loadUserProfile(parsed.user);
        setLoading(false);
        return;
      }
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      // 1. Cuentas bypass de demostración
      if (email === BYPASS_EMAIL || email === 'psicologo@clinica.com' || email === 'coordinador@colegio.com') {
        const passwordCorrect = (email === BYPASS_EMAIL && password === BYPASS_PASSWORD) || 
                                (email === 'psicologo@clinica.com' && password === 'clinica2026') ||
                                (email === 'coordinador@colegio.com' && password === 'clinica2026');
        
        if (!passwordCorrect) {
          return { data: null, error: { message: 'Contraseña incorrecta para la cuenta de demostración.' } };
        }
        
        const demoUserObj = {
          id: email === 'coordinador@colegio.com' ? 'c001c001-c001-c001-c001-c001c001c001' : '00000000-0000-0000-0000-000000000000',
          email: email,
          user_metadata: {
            full_name: email === BYPASS_EMAIL ? 'Ps. Evaluador de Prueba' : (email === 'coordinador@colegio.com' ? 'Coordinador PIE Demostración' : 'Ps. Especialista Clínico')
          }
        };
        const demoSessionObj = {
          user: demoUserObj,
          access_token: 'bypass-mock-token-1234567890',
          refresh_token: 'bypass-mock-token-1234567890'
        };
        
        localStorage.setItem('cognimirror_bypass_session', JSON.stringify(demoSessionObj));
        setUser(demoUserObj);
        await loadUserProfile(demoUserObj);
        return { data: { user: demoUserObj, session: demoSessionObj }, error: null };
      }

      // 2. Autenticación real contra Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (data && data.user && data.session) {
        localStorage.setItem('cognimirror_bypass_session', JSON.stringify(data.session));
        setUser(data.user);
        await loadUserProfile(data.user);
        return { data, error: null };
      }

      // 3. Fallback: especialistas_bypass legacy
      const { data: bypassUser } = await supabase
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
        await loadUserProfile(matchedUser);
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, fullName })
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Error al registrar usuario.');
      }

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
      setProfile(null);
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
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
