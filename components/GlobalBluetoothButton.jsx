'use client';

import React, { useState, useEffect } from 'react';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { Bluetooth, Battery, BatteryCharging, RotateCcw, X, Check, Activity, Keyboard } from 'lucide-react';

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

  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Botón Flotante Global (Presente en toda la plataforma) */}
      <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 no-print flex flex-col items-end gap-2">
        
        {/* Popover / Menú de Estado */}
        {isOpenMenu && (
          <div className="mb-2 bg-[#0c101a]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl w-72 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Cubo Vinculado
                    </span>
                  </>
                ) : (
                  <>
                    <div className={`w-2 h-2 rounded-full ${isKeyboardMode ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-slate-500'}`} />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      {isKeyboardMode ? 'Modo Teclado Activo' : 'Cubo Desconectado'}
                    </span>
                  </>
                )}
              </div>
              <button 
                onClick={() => setIsOpenMenu(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {isConnected ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500 font-medium">Dispositivo:</span>
                  <span className="font-bold text-white truncate max-w-[120px]">{device || 'Smart Cube'}</span>
                </div>
                {batteryLevel !== null && (
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-medium">Batería:</span>
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" />
                      {batteryLevel}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500 font-medium">Latencia BLE:</span>
                  <span className="font-mono text-slate-300">{latencyOffset ? `${Math.round(latencyOffset)} ms` : '< 15 ms'}</span>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                  <button
                    onClick={calibrateGyro}
                    className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                    <span>Calibrar Giroscopio</span>
                  </button>
                  <button
                    onClick={disconnectBLE}
                    className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400 leading-relaxed">
                  {isKeyboardMode 
                    ? 'Evaluando mediante teclado y botones táctiles en pantalla.' 
                    : 'Conecta tu cubo inteligente GAN vía Web Bluetooth o activa el Modo Teclado si no tienes el cubo a mano.'}
                </p>

                {/* Opción Toggle Modo Teclado (Solo visible en desktop) */}
                <div className="hidden md:block pt-2 border-t border-white/10">
                  <button
                    onClick={toggleKeyboardMode}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isKeyboardMode 
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Keyboard className="w-4 h-4 text-amber-400" />
                      <span>Modo Teclado (Sin Cubo)</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      isKeyboardMode ? 'bg-amber-500/30 text-amber-200' : 'bg-white/10 text-white/40'
                    }`}>
                      {isKeyboardMode ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setIsOpenMenu(false);
                      connectBLE();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    <Bluetooth className="w-4 h-4" />
                    <span>Conectar Cubo Físico</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón Principal */}
        {isConnected ? (
          <button
            onClick={() => setIsOpenMenu(!isOpenMenu)}
            className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-[#0d121f]/90 hover:bg-[#131b2e] border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-[0_4px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.4)] backdrop-blur-md transition-all active:scale-95 cursor-pointer group"
            title="Cubo Conectado - Click para ver opciones"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Bluetooth className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[100px] hidden sm:inline">{device || 'Cubo'}</span>
            {batteryLevel !== null && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold">
                {batteryLevel}%
              </span>
            )}
          </button>
        ) : isKeyboardMode ? (
          <div className="flex items-center gap-1.5">
            {/* Solo en Desktop / PC muestra el badge Modo Teclado */}
            <button
              onClick={() => setIsOpenMenu(!isOpenMenu)}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#18120a]/95 hover:bg-[#231a0e] border border-amber-500/50 text-amber-300 text-xs font-bold shadow-[0_4px_25px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.4)] backdrop-blur-md transition-all active:scale-95 cursor-pointer group animate-pulse"
              title="Modo Teclado (Sin Cubo) Activo - Click para opciones"
            >
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span className="tracking-wide">Modo Teclado (Sin Cubo)</span>
            </button>
            {/* En Móvil / Celular muestra el botón estándar de Conectar Cubo compacto */}
            <button
              onClick={connectBLE}
              className="md:hidden flex items-center justify-center p-3 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-blue-600/95 to-indigo-600/95 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.5)] backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-blue-400/30 group"
              title="Conectar Cubo Inteligente vía Bluetooth"
            >
              <Bluetooth className="w-4 h-4 text-blue-200" />
              <span className="tracking-wide hidden sm:inline">Conectar Cubo</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpenMenu(!isOpenMenu)}
              className="hidden md:flex p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Opciones de Conexión / Modo Teclado"
            >
              <Keyboard className="w-4 h-4 text-amber-400/80" />
            </button>
            <button
              onClick={connectBLE}
              className="flex items-center justify-center p-3 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-blue-600/95 to-indigo-600/95 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.5)] backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-blue-400/30 group"
              title="Conectar Cubo Inteligente vía Bluetooth"
            >
              <Bluetooth className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
              <span className="tracking-wide hidden sm:inline">Conectar Cubo</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
