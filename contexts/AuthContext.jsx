'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const BYPASS_EMAIL = 'evaluador@cognimirror.cl';
const BYPASS_PASSWORD = 'clinica2026';
const BYPASS_USER = {
  id: 'e0000000-0000-0000-0000-000000000001',
  email: BYPASS_EMAIL,
  user_metadata: {
    full_name: 'Ps. Evaluador de Investigación (CogniMirror Lab)'
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

    // Mock para usuarios bypass y colegio de pruebas CogniMirror Research Lab
    const isLabAdmin = userObj.email === 'cognimirrorspa@gmail.com' || userObj.email === 'director@davinci.cl';
    const isBrayan = userObj.email === 'br.castros@duocuc.cl';
    const isLabEvaluator = isBrayan || userObj.email === 'evaluador@cognimirror.cl' || userObj.email === 'evaluador@cognimirror.com' || userObj.email === 'psicologo@clinica.com';
    const isCoordinator = userObj.email === 'coordinador@colegio.com';

    if (isLabAdmin || isLabEvaluator || isCoordinator || userObj.id?.startsWith('0000') || userObj.id?.startsWith('b000') || userObj.id?.startsWith('d000') || userObj.id?.startsWith('e000')) {
      const mockProfile = {
        id: userObj.id || (isLabAdmin ? 'd0000000-0000-0000-0000-000000000001' : (isBrayan ? 'b0000000-0000-0000-0000-000000000001' : 'e0000000-0000-0000-0000-000000000001')),
        email: userObj.email,
        nombre_completo: isLabAdmin 
          ? 'Equipo CogniMirror (Administración & I+D)' 
          : (isBrayan ? 'Brayan Castro (Investigador PIE)' : (isLabEvaluator ? 'Evaluador de Investigación (200 Tests)' : 'Coordinador PIE General')),
        colegio_id: 'c0000000-0000-0000-0000-000000000001',
        rol: isLabAdmin ? 'director' : (isCoordinator ? 'coordinador_pie' : 'psicologo'),
        cargo_texto: isLabAdmin ? 'Director de Investigación y Desarrollo' : 'Psicólogo Clínico / Investigador PIE',
        colegio: {
          id: 'c0000000-0000-0000-0000-000000000001',
          nombre: 'CogniMirror Research Lab (Entorno de Pruebas)',
          rbd: '99999-9',
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
      console.warn('[AuthContext] Error al cargar perfil:', err.message);
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
        console.warn('[AuthContext] Sesión local cargada');
      } finally {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('cognimirror_bypass_session') : null;
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
      const normalizedEmail = email?.trim().toLowerCase();

      // 1. Cuentas del equipo y sandbox de pruebas CogniMirror
      const isBrayan = normalizedEmail === 'br.castros@duocuc.cl';
      const isDemoAccount = isBrayan ||
                            normalizedEmail === 'cognimirrorspa@gmail.com' || 
                            normalizedEmail === 'evaluador@cognimirror.cl' || 
                            normalizedEmail === 'evaluador@cognimirror.com' ||
                            normalizedEmail === 'psicologo@clinica.com' || 
                            normalizedEmail === 'coordinador@colegio.com' || 
                            normalizedEmail === 'director@davinci.cl';

      if (isDemoAccount) {
        const isLabAdmin = normalizedEmail === 'cognimirrorspa@gmail.com' || normalizedEmail === 'director@davinci.cl';
        const demoUserObj = {
          id: isLabAdmin ? 'd0000000-0000-0000-0000-000000000001' : 
              (isBrayan ? 'b0000000-0000-0000-0000-000000000001' : 'e0000000-0000-0000-0000-000000000001'),
          email: normalizedEmail,
          user_metadata: {
            full_name: isLabAdmin 
              ? 'Equipo CogniMirror (Administración & I+D)' 
              : (isBrayan ? 'Brayan Castro (Investigador PIE)' : 'Evaluador de Investigación (200 Tests)')
          }
        };
        const demoSessionObj = {
          user: demoUserObj,
          access_token: 'bypass-mock-token-1234567890',
          refresh_token: 'bypass-mock-token-1234567890'
        };
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('cognimirror_bypass_session', JSON.stringify(demoSessionObj));
        }
        setUser(demoUserObj);
        await loadUserProfile(demoUserObj);
        return { data: { user: demoUserObj, session: demoSessionObj }, error: null };
      }

      // 2. Autenticación real contra Supabase Auth
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (data && data.user && data.session) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('cognimirror_bypass_session', JSON.stringify(data.session));
          }
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
      } catch (sbErr) {
        console.warn('[AuthContext] Supabase Auth no disponible o credenciales fallidas:', sbErr.message);
        throw sbErr;
      }

      return { data: null, error: { message: 'Credenciales inválidas.' } };
    } catch (error) {
      console.warn('[AuthContext] Error al iniciar sesión:', error.message);
      return { data: null, error: { message: error.message || 'Error de conexión con el servidor.' } };
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

      if (typeof window !== 'undefined') {
        localStorage.removeItem('cognimirror_bypass_session');
        // Limpiar todas las posibles claves de supabase auth en localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('cognimirror') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();
      }
      setUser(null);
      setProfile(null);
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    } catch (error) {
      console.error('[AuthContext] Error al cerrar sesión:', error.message);
    } finally {
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, registerInstitution, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
