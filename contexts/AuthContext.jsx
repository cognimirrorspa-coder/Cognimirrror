'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

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
  registerInstitution: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper para cargar perfil y colegio desde base de datos Supabase
  const loadUserProfile = async (userObj) => {
    if (!userObj) {
      setProfile(null);
      return null;
    }

    // Mock para usuarios bypass locales
    if (userObj.id === '00000000-0000-0000-0000-000000000000' || userObj.email === 'coordinador@colegio.com' || userObj.email === 'director@davinci.cl') {
      const isDirector = userObj.email === 'director@davinci.cl';
      const isCoordinator = userObj.email === 'coordinador@colegio.com';
      const mockProfile = {
        id: userObj.id,
        email: userObj.email,
        nombre_completo: isDirector ? 'Andrés Soto (Director)' : (isCoordinator ? 'Coordinador PIE General' : 'Ps. Evaluador de Prueba'),
        colegio_id: 'c1000000-0000-0000-0000-000000000001',
        rol: isDirector ? 'director' : (isCoordinator ? 'coordinador_pie' : 'psicologo'),
        cargo_texto: isDirector ? 'Director Académico' : (isCoordinator ? 'Coordinadora PIE' : 'Psicólogo Clínico PIE'),
        colegio: {
          id: 'c1000000-0000-0000-0000-000000000001',
          nombre: isDirector ? 'Colegio Leonardo Da Vinci' : 'Colegio Piloto Demostración',
          rbd: isDirector ? '12345-6' : '99999-9',
          comuna: 'Santiago'
        }
      };
      setProfile(mockProfile);
      return mockProfile;
    }

    try {
      // 1. Consultar perfil con join a tabla colegios
      const { data, error } = await supabase
        .from('perfiles')
        .select('*, colegios(*)')
        .eq('id', userObj.id)
        .maybeSingle();

      if (!error && data) {
        const fullProfile = {
          ...data,
          colegio: data.colegios || null
        };
        setProfile(fullProfile);

        // Actualizar último acceso en segundo plano
        supabase
          .from('perfiles')
          .update({ ultimo_acceso: new Date().toISOString() })
          .eq('id', userObj.id)
          .then(() => {});

        return fullProfile;
      } else {
        // Fallback: perfil básico si no se encontró en tabla
        const fallbackProfile = {
          id: userObj.id,
          email: userObj.email,
          nombre_completo: userObj.user_metadata?.full_name || userObj.email.split('@')[0],
          rol: userObj.user_metadata?.rol || 'especialista',
          colegio_id: userObj.user_metadata?.colegio_id || null
        };
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
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
      if (email === BYPASS_EMAIL || email === 'psicologo@clinica.com' || email === 'coordinador@colegio.com' || email === 'director@davinci.cl') {
        const passwordCorrect = (email === BYPASS_EMAIL && password === BYPASS_PASSWORD) || 
                                (email === 'psicologo@clinica.com' && password === 'clinica2026') ||
                                (email === 'coordinador@colegio.com' && password === 'clinica2026') ||
                                (email === 'director@davinci.cl' && password === 'clinica2026');
        
        if (!passwordCorrect) {
          return { data: null, error: { message: 'Contraseña incorrecta para la cuenta de demostración.' } };
        }
        
        const demoUserObj = {
          id: email === 'director@davinci.cl' ? 'd1000000-0000-0000-0000-000000000001' : 
              email === 'coordinador@colegio.com' ? 'c001c001-c001-c001-c001-c001c001c001' : '00000000-0000-0000-0000-000000000000',
          email: email,
          user_metadata: {
            full_name: email === 'director@davinci.cl' ? 'Andrés Soto (Director)' : (email === 'coordinador@colegio.com' ? 'Coordinador PIE' : 'Ps. Evaluador de Prueba')
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
        const userProf = await loadUserProfile(data.user);

        // Registrar evento de Login en Auditoría
        if (userProf && userProf.colegio_id) {
          supabase.from('logs_auditoria').insert([{
            colegio_id: userProf.colegio_id,
            usuario_id: data.user.id,
            usuario_nombre: userProf.nombre_completo || data.user.email,
            evento: 'LOGIN',
            detalles: {
              modulo: 'Inicio de Sesión Web',
              email: data.user.email
            }
          }]).catch(() => {});
        }

        return { data, error: null };
      }

      if (authError) throw authError;
      return { data: null, error: { message: 'Credenciales inválidas.' } };
    } catch (error) {
      console.error('[AuthContext] Error al iniciar sesión:', error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const registerInstitution = async ({ schoolName, rbd, comuna, region, adminName, email, password, role, cargo }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-institution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName, rbd, comuna, region, adminName, email, password, role, cargo })
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Error al registrar la institución.');
      }

      console.log('[AuthContext] Institución registrada con éxito. Iniciando sesión...');
      return await signIn(email, password);
    } catch (error) {
      console.error('[AuthContext] Error registrando institución:', error.message);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Error al registrar usuario.');
      }

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
      if (profile?.colegio_id && user?.id) {
        supabase.from('logs_auditoria').insert([{
          colegio_id: profile.colegio_id,
          usuario_id: user.id,
          usuario_nombre: profile.nombre_completo || user.email,
          evento: 'LOGOUT',
          detalles: { accion: 'Cierre de sesión ordenado' }
        }]).catch(() => {});
      }

      localStorage.removeItem('cognimirror_bypass_session');
      setUser(null);
      setProfile(null);
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    } catch (error) {
      console.error('[AuthContext] Error al cerrar sesión:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, registerInstitution, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
