'use client';

import React, { useState } from 'react';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { Bluetooth, Battery, BatteryCharging, RotateCcw, X, Check, Activity } from 'lucide-react';

export default function GlobalBluetoothButton() {
  const { 
    isConnected, 
    device, 
    batteryLevel, 
    connectBLE, 
    disconnectBLE, 
    calibrateGyro, 
    latencyOffset 
  } = useBluetoothCube();

  const [isOpenMenu, setIsOpenMenu] = useState(false);

  return (
    <>
      {/* Botón Flotante Global (Presente en toda la plataforma) */}
      <div className="fixed bottom-5 right-5 z-50 no-print flex flex-col items-end gap-2">
        
        {/* Popover / Menú de Estado cuando está conectado */}
        {isOpenMenu && isConnected && (
          <div className="mb-2 bg-[#0c101a]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl w-64 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Cubo Vinculado
                </span>
              </div>
              <button 
                onClick={() => setIsOpenMenu(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500 font-medium">Dispositivo:</span>
                <span className="font-bold text-white truncate max-w-[120px]">{device || 'Smart Cube'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500 font-medium">Batería:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {batteryLevel !== null ? `${batteryLevel}%` : 'Normal'}
                </span>
              </div>
              {latencyOffset > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500 font-medium">Offset Latencia:</span>
                  <span className="font-bold text-indigo-400 font-mono">−{latencyOffset}ms</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                onClick={() => {
                  if (calibrateGyro) calibrateGyro();
                  setIsOpenMenu(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                <span>Calibrar Giroscopio</span>
              </button>

              <button
                onClick={() => {
                  if (disconnectBLE) disconnectBLE();
                  setIsOpenMenu(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer"
              >
                <span>Desconectar Cubo</span>
              </button>
            </div>
          </div>
        )}

        {/* Botón Principal */}
        {isConnected ? (
          <button
            onClick={() => setIsOpenMenu(!isOpenMenu)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0d121f]/90 hover:bg-[#131b2e] border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-[0_4px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.4)] backdrop-blur-md transition-all active:scale-95 cursor-pointer group"
            title="Cubo Conectado - Click para ver opciones"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Bluetooth className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[100px]">{device || 'Cubo'}</span>
            {batteryLevel !== null && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {batteryLevel}%
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={connectBLE}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.5)] backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-blue-400/30 group"
            title="Conectar Cubo Inteligente vía Bluetooth"
          >
            <Bluetooth className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
            <span className="tracking-wide">Conectar Cubo</span>
          </button>
        )}
      </div>
    </>
  );
}
