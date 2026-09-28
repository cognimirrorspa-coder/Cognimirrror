'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  X, Check, ChevronRight, ChevronLeft, RotateCcw, Sparkles, 
  HelpCircle, Eye, ArrowRight, Bluetooth, Layers, AlertCircle, 
  CheckCircle2, RefreshCw, Wand2, Compass, Dices, Loader2,
  Box, Grid3X3, ArrowLeft, Palette, Camera
} from 'lucide-react';
import { useBluetoothCube } from '../contexts/BluetoothContext';
import { useCubeState } from '../contexts/CubeStateContext';
import { 
  CUBE_COLORS, COLOR_KEYS, generateRandomValidCube, facesToString, getFacesFromMoves 
} from '../utils/kociembaSolver';
import Cube3DPainter from './Cube3DPainter';
import AsistenteSmartCubeSolve from './AsistenteSmartCubeSolve';
import CameraCubeScanner from './CameraCubeScanner';

const SOLVED_FACES = {
  U: Array(9).fill('U'),
  R: Array(9).fill('R'),
  F: Array(9).fill('F'),
  D: Array(9).fill('D'),
  L: Array(9).fill('L'),
  B: Array(9).fill('B')
};

export default function ModalOrdenarCubo({ isOpen, onClose, isDark = true }) {
  const { isConnected, subscribeToMoves, device } = useBluetoothCube();
  const { moveHistory, resetCubeState, cubeFaces, setCustomCubeState } = useCubeState();

  const [solverMode, setSolverMode] = useState('manual'); // 'manual' | 'auto' | 'camera'
  const [viewFormat, setViewFormat] = useState('3d'); // '3d' | '2d'
  const [faces, setFaces] = useState(cubeFaces || SOLVED_FACES);
  const [selectedPaintColor, setSelectedPaintColor] = useState('F');
  const [solutionResult, setSolutionResult] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Contador de stickers actuales por color (deben ser 9 de cada uno)
  const stickerCounts = useMemo(() => {
    const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
    Object.values(faces).forEach(arr => {
      arr.forEach(c => {
        if (counts[c] !== undefined) counts[c]++;
      });
    });
    return counts;
  }, [faces]);

  // Verificar si la distribución básica de 9 stickers por color es correcta
  const isStickerCountValid = useMemo(() => {
    return COLOR_KEYS.every(k => stickerCounts[k] === 9);
  }, [stickerCounts]);

  // Sincronizar automáticamente al abrir si hay historial de movimientos
  useEffect(() => {
    if (!isOpen) return;

    if (moveHistory && moveHistory.length > 0) {
      setSolverMode('auto');
      const syncedFaces = getFacesFromMoves(moveHistory);
      if (syncedFaces) setFaces(syncedFaces);
      solveFromHistory();
    } else {
      setSolverMode('manual');
      setSolutionResult(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Llamada asíncrona a la API de Kociemba (NUNCA bloquea el hilo del navegador)
  const callSolverAPI = async (payload) => {
    setIsSolving(true);
    setErrorMessage(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch('/api/solve-cube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!data.success) {
        setErrorMessage(data.error || 'No se pudo encontrar una solución para esta configuración.');
        return null;
      }

      setSolutionResult(data);
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setErrorMessage('El cálculo tardó demasiado. Revisa si hay colores imposibles o usa "Simular Desarme Válido".');
      } else {
        setErrorMessage('Error de comunicación con el motor Kociemba.');
      }
      return null;
    } finally {
      setIsSolving(false);
    }
  };

  // Resolver a partir del historial del Cubo Inteligente
  const solveFromHistory = () => {
    const syncedFaces = getFacesFromMoves(moveHistory || []);
    if (syncedFaces) setFaces(syncedFaces);
    callSolverAPI({ moves: moveHistory || [] });
  };

  // Resolver a partir de las caras manuales
  const solveFromManualFaces = () => {
    if (!isStickerCountValid) {
      setErrorMessage('Cada uno de los 6 colores debe tener exactamente 9 stickers antes de calcular.');
      return;
    }
    callSolverAPI({ faces });
  };

  // Generar un desarme aleatorio 100% válido y resolverlo de inmediato
  const handleSimulateValidScramble = () => {
    setErrorMessage(null);
    const validCube = generateRandomValidCube();
    setFaces(validCube.faces);
    callSolverAPI({ faceletString: validCube.faceletString });
  };

  // Restablecer a cubo armado
  const handleResetToSolved = () => {
    setFaces(SOLVED_FACES);
    setSolutionResult(null);
    setErrorMessage(null);
  };

  // Pintar faceta en la red o en 3D (los centros con índice 4 son inmutables)
  const handlePaintFacet = useCallback((faceKey, index, customColor = null) => {
    if (index === 4) return;
    const colorToApply = customColor || selectedPaintColor;
    setFaces(prev => {
      const newArr = [...prev[faceKey]];
      newArr[index] = colorToApply;
      return { ...prev, [faceKey]: newArr };
    });
  }, [selectedPaintColor]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 no-print font-sans">
      <div className="w-full max-w-3xl bg-[#0c101d] border border-[#1e2538] text-white rounded-3xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                {solutionResult ? 'Resolver Cubo' : 'Ordenar Cubo'}
              </h3>
              {solutionResult ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                  {solutionResult.totalMoves || 0} pasos
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 shrink-0">
                  Cubo 3D
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {solutionResult && (
              <button
                onClick={() => setSolutionResult(null)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/5"
                title="Volver a pintar o modificar las caras"
              >
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Pintar Caras</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SELECTOR DE MODOS & FORMATO (SOLO SI NO ESTAMOS EN EL SOLVER ACTIVO) */}
        {!solutionResult && (
          <div className="px-5 py-2.5 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 bg-[#090d18]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => { setSolverMode('manual'); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  solverMode === 'manual'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>Cubo Virtual 3D</span>
              </button>

              <button
                onClick={() => { setSolverMode('camera'); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  solverMode === 'camera'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Escanear con Cámara</span>
              </button>

              <button
                onClick={() => { setSolverMode('auto'); solveFromHistory(); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  solverMode === 'auto'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Sincronizar BLE</span>
                {moveHistory.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-400/30 text-white font-mono">
                    {moveHistory.length}
                  </span>
                )}
              </button>
            </div>

            {/* Selector de Formato: 3D Virtual vs 2D */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/5 p-0.5 rounded-xl border border-white/10 text-[11px]">
                <button
                  onClick={() => setViewFormat('3d')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewFormat === '3d' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3 h-3" />
                  <span>3D (360°)</span>
                </button>
                <button
                  onClick={() => setViewFormat('2d')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewFormat === '2d' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-3 h-3" />
                  <span>Red 2D</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/10">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isConnected ? `BLE: ${device || 'Conectado'}` : 'Sin BLE'}</span>
              </div>
            </div>
          </div>
        )}

        {/* CUERPO DEL ASISTENTE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 custom-scrollbar">

          {/* ALERTA DE ERROR / VALIDACIÓN */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Configuración no válida</span>
                <p className="text-red-300/90 leading-relaxed">{errorMessage}</p>
                <button
                  onClick={handleSimulateValidScramble}
                  className="mt-2 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                >
                  💡 Haz clic aquí para generar un desarme aleatorio 100% válido y ver cómo se resuelve
                </button>
              </div>
            </div>
          )}

          {/* MODO ESCÁNER POR CÁMARA (rubiks-color-resolver) */}
          {solverMode === 'camera' ? (
            <CameraCubeScanner
              onFacesResolved={(resolvedFaces) => {
                setFaces(resolvedFaces);
                if (setCustomCubeState) setCustomCubeState(resolvedFaces);
                setSolverMode('manual');
                callSolverAPI({ faces: resolvedFaces });
              }}
              onCancel={() => setSolverMode('manual')}
            />
          ) : solutionResult ? (
            <AsistenteSmartCubeSolve
              solutionResult={solutionResult}
              initialFaces={faces}
              onRecalculateSolution={(currentFaces) => {
                setFaces(currentFaces);
                callSolverAPI({ faces: currentFaces });
              }}
              onFinish={() => {
                resetCubeState();
                onClose();
              }}
              isConnected={isConnected}
              subscribeToMoves={subscribeToMoves}
              device={device}
            />
          ) : (
            /* ══════════════════════════════════════════════════════════════════
                PANTALLA 2: CONFIGURADOR VISUAL (CUBO 3D O RED 2D)
               ══════════════════════════════════════════════════════════════════ */
            <div className="flex flex-col gap-3">
              
              {/* Barra de Acciones y Presets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span>Pinta o Sincroniza el Cubo</span>
                    {viewFormat === '3d' && (
                      <span className="text-[10px] text-blue-400 font-normal">
                        (Arrastra en 360° para ver todas las caras)
                      </span>
                    )}
                  </h4>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleResetToSolved}
                    className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-slate-300 font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                    <span>Armado</span>
                  </button>

                  <button
                    onClick={handleSimulateValidScramble}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Carga un estado desarmado 100% real y válido para probar de inmediato"
                  >
                    <Dices className="w-3.5 h-3.5 text-purple-400" />
                    <span>Simular Desarme</span>
                  </button>

                  <button
                    onClick={solveFromManualFaces}
                    disabled={isSolving || !isStickerCountValid}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                      isSolving || !isStickerCountValid
                        ? 'bg-blue-600/40 text-white/50 cursor-not-allowed border border-blue-500/20'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    }`}
                  >
                    {isSolving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Calcular Solución</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* VISTA 3D VIRTUAL (POR DEFECTO) */}
              {viewFormat === '3d' ? (
                <div className="w-full flex flex-col items-center">
                  <Cube3DPainter
                    faces={faces}
                    selectedColor={selectedPaintColor}
                    onPaintFacelet={handlePaintFacet}
                    onSelectColor={setSelectedPaintColor}
                    className="w-full"
                  />
                </div>
              ) : (
                /* VISTA ALTERNATIVA 2D */
                <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-3xl border border-white/5 overflow-x-auto">
                  <div className="mb-2">
                    <FaceGrid faceKey="U" faceColors={faces.U} onPaint={handlePaintFacet} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaceGrid faceKey="L" faceColors={faces.L} onPaint={handlePaintFacet} />
                    <FaceGrid faceKey="F" faceColors={faces.F} onPaint={handlePaintFacet} />
                    <FaceGrid faceKey="R" faceColors={faces.R} onPaint={handlePaintFacet} />
                    <FaceGrid faceKey="B" faceColors={faces.B} onPaint={handlePaintFacet} />
                  </div>
                  <div>
                    <FaceGrid faceKey="D" faceColors={faces.D} onPaint={handlePaintFacet} />
                  </div>
                </div>
              )}

              {/* PALETA DE COLORES Y BALANCE DE STICKERS (9 POR COLOR) */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">
                    Color activo para pintar (o toca una pieza del cubo 3D para elegir su color):
                  </span>
                  <span className={`font-mono font-bold ${isStickerCountValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isStickerCountValid ? '✓ Balance Exacto (54/54)' : '⚠️ Ajusta el conteo a 9 por color'}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {COLOR_KEYS.map((ck) => {
                    const cInfo = CUBE_COLORS[ck];
                    const isSelected = selectedPaintColor === ck;
                    const count = stickerCounts[ck] || 0;
                    const isExact = count === 9;

                    return (
                      <button
                        key={ck}
                        type="button"
                        onClick={() => setSelectedPaintColor(ck)}
                        className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                          isSelected 
                            ? 'border-white ring-2 ring-blue-500 scale-105 shadow-md bg-white/10' 
                            : 'border-white/5 hover:border-white/20 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-3.5 h-3.5 rounded-full shadow-sm" 
                            style={{ backgroundColor: cInfo.hex }} 
                          />
                          <span style={{ color: cInfo.hex }}>{cInfo.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          isExact ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {count}/9
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* SPINNER DE CARGA MIENTRAS RESUELVE */}
          {isSolving && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-300 animate-in fade-in">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm font-bold">Calculando solución óptima con Kociemba...</p>
              <span className="text-xs text-slate-500 font-mono">Búsqueda en árbol de dos fases (≤ 22 movimientos)</span>
            </div>
          )}

        </div>

        {/* FOOTER (SOLO EN MODO CONFIGURACIÓN DE CARAS) */}
        {!solutionResult && (
          <div className="p-3 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>F: Azul • U: Blanco • L: Rojo • R: Naranja • D: Amarillo • B: Verde</span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function FaceGrid({ faceKey, faceColors = [], onPaint }) {
  const cInfo = CUBE_COLORS[faceKey] || { name: faceKey, hex: '#fff' };

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-mono font-bold text-slate-400 mb-1">
        {cInfo.name} ({faceKey})
      </span>
      <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl border border-white/10">
        {faceColors.map((colorKey, idx) => {
          const color = CUBE_COLORS[colorKey]?.hex || '#333';
          const isCenter = idx === 4;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onPaint(faceKey, idx)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-transform border ${
                isCenter ? 'border-white/60 cursor-default ring-1 ring-white/40' : 'border-black/30 hover:scale-105 cursor-pointer'
              }`}
              style={{ backgroundColor: color }}
              title={isCenter ? `Centro fijo: ${cInfo.name}` : `Faceta ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
