'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Brain, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor, completa todos los campos.');
      setIsLoading(false);
      return;
    }

    const { data, error } = await signIn(email, password);

    if (error) {
      if (error.message && error.message.toLowerCase().includes('email not confirmed')) {
        setErrorMsg('Debes confirmar tu correo electrónico antes de iniciar sesión. (O desactiva "Confirm Email" en Supabase Auth Settings).');
      } else {
        setErrorMsg(error.message || 'Credenciales inválidas. Revisa tu correo y contraseña.');
      }
      setIsLoading(false);
    } else {
      setSuccessMsg('¡Sesión iniciada con éxito! Redirigiendo...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1000);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password || !fullName || !confirmPassword) {
      setErrorMsg('Por favor, completa todos los campos.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      setIsLoading(false);
      return;
    }

    const { data, error } = await signUp(email, password, fullName);

    if (error) {
      setErrorMsg(error.message || 'Ocurrió un error durante el registro.');
      setIsLoading(false);
    } else {
      if (data?.isMock) {
        setSuccessMsg('¡Registro local exitoso! Iniciando sesión automáticamente...');
        // Limpiamos los campos
        setEmail('');
        setPassword('');
        setFullName('');
        setConfirmPassword('');
        
        // Autologueo
        const loginRes = await signIn(email, password);
        if (!loginRes.error) {
          setTimeout(() => {
            router.replace('/dashboard');
          }, 1000);
        } else {
          setErrorMsg(loginRes.error.message || 'Error al iniciar sesión automática.');
          setIsLoading(false);
        }
      } else {
        // Supabase por defecto puede requerir confirmación por correo
        const requiresConfirmation = data?.user?.identities?.length === 0 || !data?.session;
        
        if (requiresConfirmation) {
          setSuccessMsg('¡Registro exitoso! Por favor, verifica tu correo electrónico para activar tu cuenta.');
          // Limpiamos los campos
          setEmail('');
          setPassword('');
          setFullName('');
          setConfirmPassword('');
          setActiveTab('login');
        } else {
          setSuccessMsg('¡Registro exitoso! Iniciando sesión...');
          setTimeout(() => {
            router.replace('/dashboard');
          }, 1000);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Orbes de fondo difuminados de alta gama */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

      <div className="w-full max-w-md z-10">
        {/* Cabecera / Logo */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5 backdrop-blur-md">
            <Brain size={32} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            CogniMirror <span className="text-indigo-400">Cube</span>
          </h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Plataforma Neuropsicológica
          </p>
        </div>

        {/* Card Contenedor principal con Glassmorphism */}
        <div className="bg-[#10131e]/50 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Barra superior de pestañas */}
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mb-6">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Mensajes de Alerta */}
          {errorMsg && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl text-rose-400 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl text-emerald-400 text-xs font-semibold flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formulario de Login */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    placeholder="psicologo@clinica.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    Ingresar <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Formulario de Registro */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Ps. Claudio Fuentes"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    placeholder="especialista@clinica.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="password"
                    placeholder="Repita su contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    Registrar Cuenta <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
