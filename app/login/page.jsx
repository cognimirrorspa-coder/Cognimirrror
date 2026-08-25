'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Brain, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, School, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { signIn, signUp, registerInstitution } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register_school' | 'register_user'

  // Form states comunes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form states de Institución / Colegio
  const [schoolName, setSchoolName] = useState('');
  const [rbd, setRbd] = useState('');
  const [comuna, setComuna] = useState('Santiago');
  const [adminRole, setAdminRole] = useState('director');
  const [cargo, setCargo] = useState('Director(a) Académico(a)');

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
        setErrorMsg('Debes confirmar tu correo electrónico antes de iniciar sesión.');
      } else {
        setErrorMsg(error.message || 'Credenciales inválidas. Revisa tu correo y contraseña.');
      }
      setIsLoading(false);
    } else {
      setSuccessMsg('¡Sesión iniciada con éxito! Redirigiendo...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 800);
    }
  };

  const handleRegisterSchool = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!schoolName || !rbd || !fullName || !email || !password || !confirmPassword) {
      setErrorMsg('Por favor, completa todos los campos de la institución y del administrador.');
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

    const { data, error } = await registerInstitution({
      schoolName: schoolName.trim(),
      rbd: rbd.trim(),
      comuna: comuna.trim(),
      region: 'Metropolitana',
      adminName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: adminRole,
      cargo: cargo.trim()
    });

    if (error) {
      setErrorMsg(error.message || 'Ocurrió un error al registrar el colegio.');
      setIsLoading(false);
    } else {
      setSuccessMsg(`¡${schoolName} registrado exitosamente! Iniciando panel de control directivo...`);
      setTimeout(() => {
        router.replace('/director');
      }, 1000);
    }
  };

  const handleRegisterUser = async (e) => {
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
      setSuccessMsg('¡Cuenta de especialista creada con éxito! Iniciando sesión...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Orbes de fondo difuminados */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

      <div className="w-full max-w-lg z-10 my-8">
        {/* Cabecera / Logo */}
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/5 backdrop-blur-md">
            <Brain size={32} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            CogniMirror <span className="text-purple-400">Cube</span>
          </h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Plataforma Neuropsicológica Escolar Multi-Tenant
          </p>
        </div>

        {/* Card Contenedor principal con Glassmorphism */}
        <div className="bg-[#10131e]/70 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Barra superior de pestañas */}
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mb-6 gap-1">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === 'login'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ingresar
            </button>
            <button
              onClick={() => {
                setActiveTab('register_school');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'register_school'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <School size={13} /> Nuevo Colegio
            </button>
            <button
              onClick={() => {
                setActiveTab('register_user');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === 'register_user'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Especialista
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

          {/* 1. FORMULARIO DE LOGIN */}
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
                    placeholder="director@colegio.cl o psicologo@clinica.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium disabled:opacity-50"
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
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    Ingresar a la Plataforma <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-500">
                  ¿Eres Director o Coordinador PIE?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register_school')}
                    className="text-purple-400 hover:underline font-bold"
                  >
                    Registra tu establecimiento
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* 2. FORMULARIO DE REGISTRO DE NUEVA INSTITUCIÓN / COLEGIO */}
          {activeTab === 'register_school' && (
            <form onSubmit={handleRegisterSchool} className="space-y-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-300 text-xs font-semibold flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0" />
                <span>Crea el espacio institucional de tu colegio para gestionar profesionales y evaluaciones PIE.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Nombre del Colegio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Colegio San Agustín"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                    RBD (Rol Base de Datos) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 14520-8"
                    value={rbd}
                    onChange={(e) => setRbd(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Nombre Completo del Director(a) / Coordinador(a) *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Andrés Soto Morales"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Rol Institucional *
                  </label>
                  <select
                    value={adminRole}
                    onChange={(e) => {
                      setAdminRole(e.target.value);
                      setCargo(e.target.value === 'director' ? 'Director(a) Académico(a)' : 'Coordinador(a) PIE');
                    }}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium cursor-pointer"
                  >
                    <option value="director">Director / Sostenedor</option>
                    <option value="coordinador_pie">Coordinador(a) PIE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Comuna
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Las Condes"
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Correo Electrónico Institucional *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="direccion@colegio.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repita contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    Registrar Colegio y Acceder <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORMULARIO DE REGISTRO RÁPIDO DE ESPECIALISTA */}
          {activeTab === 'register_user' && (
            <form onSubmit={handleRegisterUser} className="space-y-4">
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
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium disabled:opacity-50"
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
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Confirmar
                  </label>
                  <input
                    type="password"
                    placeholder="Repita contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    Registrar Especialista <ArrowRight size={16} />
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
