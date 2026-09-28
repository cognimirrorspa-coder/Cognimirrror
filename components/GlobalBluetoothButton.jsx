'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { useCubeState } from '../contexts/CubeStateContext';
import { 
  Bluetooth, Battery, RotateCcw, X, Keyboard, 
  Wand2, ChevronUp, ChevronDown, ChevronRight, Check, Zap, Sparkles
} from 'lucide-react';
import ModalOrdenarCubo from './ModalOrdenarCubo';

export default function GlobalBluetoothButton() {
  const { 
    isConnected, 
    device, 
    batteryLevel, 
    connectBLE, 
    disconnectBLE, 
    calibrateGyro, 
    latencyOffset,
    isKeyboardMode,
    toggleKeyboardMode
  } = useBluetoothCube();

  const { moveHistory } = useCubeState();

  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isSolverModalOpen, setIsSolverModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpenMenu(false);
      }
    }
    if (isOpenMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpenMenu]);

  if (!mounted) return null;

  return (
    <>
      {/* ── BOTÓN FLOTANTE UNIFICADO (SPEED DIAL / ACTION HUB) ── */}
      <div 
        ref={menuRef}
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 no-print flex flex-col items-end gap-2.5 font-sans"
      >
        
        {/* MENÚ DESPLEGABLE EN EL MISMO LUGAR CON LAS 3 OPCIONES CLAVE */}
        {isOpenMenu && (
          <div className="mb-1 w-72 sm:w-80 bg-[#0d111d]/95 border border-[#1e2538] backdrop-blur-2xl rounded-3xl p-4 shadow-2xl text-left animate-in fade-in slide-in-from-bottom-3 duration-200">
            
            {/* Header del Menú Flotante */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  isConnected 
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' 
                    : isKeyboardMode 
                      ? 'bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                      : 'bg-slate-500'
                }`} />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Centro de Control del Cubo
                </span>
              </div>
              
              <button 
                onClick={() => setIsOpenMenu(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LAS 3 OPCIONES COMPACTAS */}
            <div className="flex flex-col gap-2">
              
              {/* OPCIÓN 1: CONECTAR O GESTIONAR CUBO BLUETOOTH */}
              <div className={`p-3 rounded-2xl border transition-all ${
                isConnected 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-white/[0.03] border-white/5 hover:border-blue-500/30'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Bluetooth className={`w-4 h-4 ${isConnected ? 'text-emerald-400' : 'text-blue-400'}`} />
                    <span className="text-xs font-bold text-white">
                      {isConnected ? 'Cubo Conectado' : 'Cubo Inteligente BLE'}
                    </span>
                  </div>
                  {isConnected && batteryLevel !== null && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Battery className="w-3 h-3" />
                      {batteryLevel}%
                    </span>
                  )}
                </div>

                {isConnected ? (
                  <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Dispositivo: <strong className="text-slate-200">{device || 'GAN Cube'}</strong></span>
                      <span>{latencyOffset ? `${Math.round(latencyOffset)} ms` : '< 15 ms'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={calibrateGyro}
                        className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer"
                      >
                        Calibrar Giro
                      </button>
                      <button
                        onClick={disconnectBLE}
                        className="py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpenMenu(false);
                      connectBLE();
                    }}
                    className="w-full mt-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>Conectar Cubo Físico</span>
                  </button>
                )}
              </div>

              {/* OPCIÓN 2: MODO TECLADO (SIMULACIÓN SIN CUBO) */}
              <button
                onClick={toggleKeyboardMode}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isKeyboardMode 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                    : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isKeyboardMode ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'
                  }`}>
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Modo Teclado</span>
                    <span className="text-[10px] text-slate-400 block">Evaluar sin cubo físico</span>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                  isKeyboardMode ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-400'
                }`}>
                  {isKeyboardMode ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* OPCIÓN 3: ORDENAR Y ARMAR CUBO (ASISTENTE KOCIEMBA) */}
              <button
                onClick={() => {
                  setIsOpenMenu(false);
                  setIsSolverModalOpen(true);
                }}
                className="p-3 rounded-2xl border bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-blue-900/40 hover:from-indigo-900/60 hover:to-blue-900/60 border-indigo-500/30 text-left flex items-center justify-between transition-all group cursor-pointer shadow-lg shadow-indigo-950/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Wand2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Ordenar Cubo</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 font-bold">
                        Kociemba
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-200/70 block">
                      Guía visual para rearmarlo paso a paso
                    </span>
                  </div>
                </div>

                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-indigo-300 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>

            </div>

          </div>
        )}

        {/* BOTÓN FLOTANTE PRINCIPAL (COMPACTO CON SOLO ICONO EN MÓVIL) */}
        <button
          onClick={() => setIsOpenMenu(!isOpenMenu)}
          className={`w-10 h-10 md:w-auto md:h-auto flex items-center justify-center p-0 md:px-3.5 md:py-2 rounded-full border shadow-lg backdrop-blur-xl transition-all active:scale-95 cursor-pointer group ${
            isConnected
              ? 'bg-[#0d121f]/95 hover:bg-[#131b2e] border-emerald-500/50 text-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
              : isKeyboardMode
                ? 'bg-[#18120a]/95 hover:bg-[#231a0e] border-amber-500/50 text-amber-300 shadow-[0_4px_16px_rgba(245,158,11,0.3)]'
                : 'bg-[#0f1322]/95 hover:bg-[#161c30] border-blue-500/40 text-blue-200 shadow-[0_4px_16px_rgba(37,99,235,0.3)]'
          }`}
          title="Centro de Control del Cubo (Bluetooth & Opciones)"
        >
          {isConnected ? (
            <div className="flex items-center justify-center md:gap-1.5">
              <span className="relative flex h-2 w-2 mr-1 md:mr-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Bluetooth className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold truncate max-w-[80px] hidden md:inline ml-1">
                {device || 'Cubo'}
              </span>
              {batteryLevel !== null && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono font-bold hidden md:inline ml-1">
                  {batteryLevel}%
                </span>
              )}
            </div>
          ) : isKeyboardMode ? (
            <div className="flex items-center justify-center md:gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-1 md:mr-0" />
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold tracking-wide hidden md:inline ml-1">Teclado</span>
            </div>
          ) : (
            <div className="flex items-center justify-center md:gap-1.5">
              <Bluetooth className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-bold tracking-wide hidden md:inline ml-1">Cubo</span>
            </div>
          )}

          <div className="text-slate-400 group-hover:text-white transition-colors hidden md:flex items-center ml-1">
            {isOpenMenu ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </div>
        </button>

      </div>

      {/* MODAL ORDENAR CUBO ASISTIDO POR KOCIEMBA */}
      <ModalOrdenarCubo
        isOpen={isSolverModalOpen}
        onClose={() => setIsSolverModalOpen(false)}
        isDark={true}
      />
    </>
  );
}
