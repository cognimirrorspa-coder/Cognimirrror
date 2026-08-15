'use client';

import { useState, useMemo } from 'react';
import { usePatientsDB } from '../hooks/usePatientsDB';
import { useAuth } from '../contexts/AuthContext';
import GestorEquipo from './GestorEquipo';
import { Users, Brain, Zap, Clock, Shield, Activity, BarChart2, Plus, ArrowRight, Settings } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRouter } from 'next/navigation';

export default function CoordinadorDashboard() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { patients: students, loadingPatients } = usePatientsDB();
  const [activeTab, setActiveTab] = useState('general');

  // Calcular KPIs Generales del Colegio
  const kpis = useMemo(() => {
    let totalSessions = 0;
    let sumReactionTime = 0;
    let validSessionCount = 0;

    students.forEach(s => {
      totalSessions += s.sessions?.length || 0;
      s.sessions?.forEach(sess => {
        const avg = sess.stats?.averageReactionTime || 
                    Math.round((sess.stats?.tiempo_promedio_por_mano?.L + sess.stats?.tiempo_promedio_por_mano?.R) / 2) || 
                    0;
        if (avg > 0) {
          sumReactionTime += avg;
          validSessionCount += 1;
        }
      });
    });

    const averageReaction = validSessionCount > 0 ? Math.round(sumReactionTime / validSessionCount) : 0;

    return {
      totalStudents: students.length,
      totalSessions,
      averageReaction
    };
  }, [students]);

  // Agrupar Tiempos de Reacción por Diagnóstico NEE
  const diagnosticsData = useMemo(() => {
    const groups = {};
    students.forEach(s => {
      const diag = s.diagnosticoNee || 'Sin Diagnóstico';
      if (!groups[diag]) {
        groups[diag] = { sum: 0, count: 0 };
      }
      s.sessions?.forEach(sess => {
        const avg = sess.stats?.averageReactionTime || 
                    Math.round((sess.stats?.tiempo_promedio_por_mano?.L + sess.stats?.tiempo_promedio_por_mano?.R) / 2) || 
                    0;
        if (avg > 0) {
          groups[diag].sum += avg;
          groups[diag].count += 1;
        }
      });
    });

    return Object.keys(groups)
      .map(key => ({
        name: key,
        Promedio: groups[key].count > 0 ? Math.round(groups[key].sum / groups[key].count) : 0
      }))
      .filter(g => g.Promedio > 0);
  }, [students]);

  // Agrupar Volumen de Sesiones por Día
  const timelineData = useMemo(() => {
    const dates = {};
    students.forEach(s => {
      s.sessions?.forEach(sess => {
        if (!sess.date) return;
        const dStr = new Date(sess.date).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
        dates[dStr] = (dates[dStr] || 0) + 1;
      });
    });

    return Object.keys(dates)
      .map(key => ({
        fecha: key,
        Evaluaciones: dates[key]
      }))
      .slice(-10); // Mostrar últimas 10 entradas de fechas
  }, [students]);

  return (
    <div className="min-h-screen bg-[#030303] text-slate-200 font-sans pb-20">
      
      {/* Banner Superior Decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[400px] opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#3b82f6_0%,transparent_70%)] mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12 relative z-10 text-left">
        
        {/* Header Consola */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] rounded font-bold uppercase tracking-wider">
                Consola Coordinador PIE
              </span>
              <span className="text-white/20 text-[10px] font-mono">•</span>
              <span className="text-slate-500 text-[10px] font-mono">Tenant ID: {profile?.colegio_id?.substring(0, 8)}...</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Gestión PIE.
            </h1>
            <p className="text-slate-400 mt-1 text-sm max-w-md">
              Colegio Piloto Demostración — Analíticas de rendimiento atencional e integraciones PIE escolares.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/students')}
              className="px-5 py-3 bg-white text-black font-black text-xs tracking-widest uppercase hover:bg-blue-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              Directorio Alumnos <ArrowRight size={14} />
            </button>
            <button
              onClick={signOut}
              className="px-4 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 font-bold text-xs tracking-widest uppercase transition-all cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Panel Tabs */}
        <div className="flex border-b border-white/5 mb-8 gap-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-4 text-sm font-bold tracking-wide transition-all cursor-pointer border-b-2 px-1 ${
              activeTab === 'general' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            Resumen General
          </button>
          <button
            onClick={() => setActiveTab('equipo')}
            className={`pb-4 text-sm font-bold tracking-wide transition-all cursor-pointer border-b-2 px-1 ${
              activeTab === 'equipo' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            Gestión de Equipo
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' ? (
          <div className="space-y-10">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Estudiantes */}
              <div className="bg-[#13161e] border border-white/10 p-6 rounded-2xl relative overflow-hidden flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Alumnos Registrados</span>
                  <span className="text-3xl font-black text-white font-mono">
                    {loadingPatients ? '...' : kpis.totalStudents}
                  </span>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>

              {/* Card 2: Evaluaciones */}
              <div className="bg-[#13161e] border border-white/10 p-6 rounded-2xl relative overflow-hidden flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Evaluaciones Completadas</span>
                  <span className="text-3xl font-black text-white font-mono">
                    {loadingPatients ? '...' : kpis.totalSessions}
                  </span>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center">
                  <Activity size={20} />
                </div>
              </div>

              {/* Card 3: Latencia */}
              <div className="bg-[#13161e] border border-white/10 p-6 rounded-2xl relative overflow-hidden flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Promedio de Reacción (Colegio)</span>
                  <span className="text-3xl font-black text-white font-mono">
                    {loadingPatients ? '...' : `${kpis.averageReaction} ms`}
                  </span>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center">
                  <Clock size={20} />
                </div>
              </div>

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* Gráfico 1: Tiempos por NEE */}
              <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                    <Brain size={18} className="text-blue-400" />
                    Latencia por Diagnóstico NEE
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Comparación del promedio de latencias cognitivas (ms) agrupado por diagnóstico escolar.
                  </p>
                </div>

                <div className="h-72 w-full pt-4">
                  {diagnosticsData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                      No hay suficientes evaluaciones con diagnóstico clínico registrados en el sistema.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={diagnosticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="name" stroke="#666" fontSize={11} />
                        <YAxis stroke="#666" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#13161e', border: '1px solid #333', color: '#fff' }} />
                        <Bar dataKey="Promedio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Gráfico 2: Línea de Tiempo de Evaluaciones */}
              <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                    <Zap size={18} className="text-amber-400" />
                    Historial de Evaluaciones Diarias
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Muestra el volumen de pruebas psicométricas completadas por día en el establecimiento.
                  </p>
                </div>

                <div className="h-72 w-full pt-4">
                  {timelineData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                      Sin datos históricos de sesiones registrados todavía.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="fecha" stroke="#666" fontSize={11} />
                        <YAxis stroke="#666" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#13161e', border: '1px solid #333', color: '#fff' }} />
                        <Line type="monotone" dataKey="Evaluaciones" stroke="#f59e0b" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-8 shadow-2xl">
            <GestorEquipo colegioId={profile?.colegio_id} />
          </div>
        )}

      </div>
    </div>
  );
}
