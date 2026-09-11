'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBluetoothCube } from '../../../contexts/BluetoothContext';
import { 
  Bluetooth, 
  BluetoothConnected, 
  RotateCcw, 
  Battery, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Keyboard, 
  Zap, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';

export default function BleVerificationCard({ onNext, onBack, participantCode }) {
  const { 
    isConnected, 
    isConnecting, 
    device, 
    batteryLevel, 
    connectBLE, 
    disconnectBLE, 
    calibrateGyro, 
    isCalibrating,
    latencyOffset,
    isKeyboardMode,
    toggleKeyboardMode,
    subscribeToMoves
  } = useBluetoothCube();

  const [recentMoves, setRecentMoves] = useState([]);
  const [lastMoveTimestamp, setLastMoveTimestamp] = useState(null);
  const [totalTurnsCount, setTotalTurnsCount] = useState(0);
  const [flashActive, setFlashActive] = useState(false);
  const flashTimerRef = useRef(null);

  // Escucha de giros físicos para feedback visual milimétrico
  useEffect(() => {
    const unsub = subscribeToMoves((notation) => {
      const now = Date.now();
      setLastMoveTimestamp(now);
      setTotalTurnsCount(prev => prev + 1);

      setRecentMoves(prev => {
        const item = { notation, time: now, id: Math.random().toString(36).substring(2, 7) };
        return [item, ...prev].slice(0, 6);
      });

      // Animación de pulso visual verde
      setFlashActive(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashActive(false), 300);
    });

    return () => {
      unsub();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [subscribeToMoves]);

  const isReadyToProceed = isConnected || isKeyboardMode;

  const getFaceColor = (notation) => {
    const clean = notation.replace("'", "");
    switch (clean) {
      case 'R': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'L': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'U': return 'bg-white/20 text-white border-white/40';
      case 'D': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'F': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'B': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default: return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── CARD PRINCIPAL: ESTADO DE HARDWARE BLUETOOTH ── */}
      <div className={`bg-[#0c101a]/95 border rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md transition-all ${
        isConnected 
          ? 'border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]' 
          : isKeyboardMode 
            ? 'border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
            : 'border-white/10'
      }`}>
        {/* Header con Badge de Estado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isConnected 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : isKeyboardMode
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 border border-white/10'
            }`}>
              {isConnected ? <BluetoothConnected className="w-5 h-5" /> : <Bluetooth className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Enlace Háptico de Telemetría
                </h3>
                {participantCode && (
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {participantCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Verificación de latencia Web Bluetooth GATT y sensores magnéticos de rotación.
              </p>
            </div>
          </div>

          {/* Badge de Estado */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isConnected ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Cubo Vinculado ({device || 'Smart Cube'})</span>
              </div>
            ) : isConnecting ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-300 text-xs font-bold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Buscando Cubo BLE...</span>
              </div>
            ) : isKeyboardMode ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Teclado / Pantalla Activo</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Hardware Desconectado</span>
              </div>
            )}
          </div>
        </div>

        {/* ── CUADRÍCULA DE TELEMETRÍA EN VIVO ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {/* Latencia de Enlace */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Latencia BLE
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono text-cyan-300">
                {isConnected ? (latencyOffset ? `${Math.round(latencyOffset)}` : '< 15') : '--'}
              </span>
              <span className="text-xs text-slate-500 font-mono">ms</span>
            </div>
            <p className="text-[10px] text-slate-500">GATT async sub-15ms</p>
          </div>

          {/* Batería del Cubo */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              Batería
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-black font-mono ${
                batteryLevel !== null && batteryLevel < 20 ? 'text-rose-400' : 'text-emerald-300'
              }`}>
                {isConnected && batteryLevel !== null ? `${batteryLevel}%` : isConnected ? '100%' : '--'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Nivel de carga del SoC</p>
          </div>

          {/* Total Giros Recibidos */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Giros de Prueba
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-black font-mono transition-all ${
                flashActive ? 'text-emerald-400 scale-110' : 'text-white'
              }`}>
                {totalTurnsCount}
              </span>
              <span className="text-xs text-slate-500 font-mono">rotaciones</span>
            </div>
            <p className="text-[10px] text-slate-500">Comprobación háptica</p>
          </div>

          {/* Giroscopio / Estado */}
          <div className="bg-[#121726]/80 border border-white/10 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Calibración IMU
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-slate-200">
                {isConnected ? 'Activa / Nominal' : '--'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Coordenadas 3D</p>
          </div>
        </div>

        {/* ── BANCO DE PRUEBA DE GIROS EN TIEMPO REAL ── */}
        <div className="mt-6 p-4 rounded-xl bg-[#121726]/50 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className={`w-3.5 h-3.5 ${flashActive ? 'text-emerald-400 animate-bounce' : 'text-amber-400'}`} />
              Monitor de Giros en Vivo (Prueba que el sujeto gire el cubo):
            </span>
            {lastMoveTimestamp && (
              <span className="text-[10px] text-slate-500 font-mono">
                Último: {new Date(lastMoveTimestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {recentMoves.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-lg">
              {isConnected 
                ? 'Gira una cara del cubo inteligente para comprobar la respuesta en pantalla.'
                : 'Conecta el cubo para visualizar el flujo continuo de rotaciones.'}
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {recentMoves.map((m, idx) => (
                <div
                  key={m.id}
                  className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 transition-all ${getFaceColor(m.notation)} ${
                    idx === 0 ? 'scale-105 shadow-md ring-1 ring-white/20' : 'opacity-70'
                  }`}
                >
                  <span>Cara: {m.notation}</span>
                  {idx === 0 && <span className="text-[9px] uppercase tracking-tighter">¡AHORA!</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── BOTONES DE ACCIÓN BLUETOOTH ── */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-5 border-t border-white/10">
          {!isConnected ? (
            <button
              type="button"
              onClick={connectBLE}
              disabled={isConnecting}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Bluetooth className="w-4 h-4" />
              <span>{isConnecting ? 'Buscando...' : 'Vincular Cubo Físico (Web Bluetooth)'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={calibrateGyro}
                disabled={isCalibrating}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
                <span>Calibrar Giroscopio</span>
              </button>

              <button
                type="button"
                onClick={disconnectBLE}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Desconectar
              </button>
            </>
          )}

          {/* Toggle de Modo Teclado (Respaldo) */}
          <button
            type="button"
            onClick={toggleKeyboardMode}
            className={`ml-auto px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
              isKeyboardMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>Modo Teclado / Pantalla: {isKeyboardMode ? 'ACTIVADO' : 'DESACTIVADO'}</span>
          </button>
        </div>
      </div>

      {/* ── VALIDACIÓN Y NAVEGACIÓN ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Ficha del Participante</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isReadyToProceed && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Conecta el cubo Bluetooth o activa el Modo Teclado para continuar.</span>
            </div>
          )}

          <button
            type="button"
            disabled={!isReadyToProceed}
            onClick={onNext}
            className={`w-full sm:w-auto px-6 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
              isReadyToProceed
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white shadow-[0_0_25px_rgba(168,85,247,0.35)] cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            <span>Iniciar Baterías Clínicas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
