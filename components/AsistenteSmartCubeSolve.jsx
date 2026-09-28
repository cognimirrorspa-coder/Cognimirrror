'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, ChevronLeft, Check, Compass, AlertTriangle, 
  RefreshCw, CheckCircle2, Volume2, VolumeX, Sparkles
} from 'lucide-react';
import { 
  evaluateUserMove, invertMove, 
  applyMoveToFaces, playSuccessChime, playErrorAlert 
} from '../utils/kociembaSolver';
import Cube3DPainter from './Cube3DPainter';

export default function AsistenteSmartCubeSolve({
  solutionResult,
  initialFaces,
  onRecalculateSolution,
  onFinish,
  isConnected,
  subscribeToMoves,
  device
}) {
  const steps = useMemo(() => solutionResult?.steps || [], [solutionResult]);
  const totalSteps = steps.length;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [subStepCount, setSubStepCount] = useState(0); // 0 o 1 para giros de 180°
  const [cubeFaces, setCubeFaces] = useState(initialFaces);
  const [errorState, setErrorState] = useState(null);
  const [successFlash, setSuccessFlash] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (initialFaces) {
      setCubeFaces(initialFaces);
    }
  }, [initialFaces]);

  const currentStep = steps[currentStepIndex] || null;
  const isFinished = totalSteps > 0 && currentStepIndex >= totalSteps;

  // Motor Reactivo Bluetooth
  useEffect(() => {
    if (!subscribeToMoves || isFinished || !currentStep) return;

    const unsub = subscribeToMoves((rawMove) => {
      if (!rawMove) return;
      const performedMove = rawMove.trim().toUpperCase();

      // Si el usuario tenía un error pendiente y hace el movimiento de corrección
      if (errorState && (performedMove === errorState.undoNotation || performedMove === errorState.correctionNotation)) {
        if (soundEnabled) playSuccessChime();
        setErrorState(null);
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 800);
        setCubeFaces(prev => applyMoveToFaces(prev, performedMove));
        return;
      }

      // Evaluar contra el paso actual esperado
      const evaluation = evaluateUserMove(currentStep.notation, performedMove);

      if (evaluation.isCorrect) {
        if (soundEnabled) playSuccessChime();
        setErrorState(null);
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 800);
        setCubeFaces(prev => applyMoveToFaces(prev, performedMove));

        if (evaluation.isHalfTurn) {
          if (subStepCount === 0) {
            setSubStepCount(1);
          } else {
            setSubStepCount(0);
            setCurrentStepIndex(prev => prev + 1);
          }
        } else {
          setSubStepCount(0);
          setCurrentStepIndex(prev => prev + 1);
        }
      } else {
        if (soundEnabled) playErrorAlert();
        setCubeFaces(prev => applyMoveToFaces(prev, performedMove));
        setErrorState({
          wrongMove: performedMove,
          message: evaluation.message,
          correctionHuman: evaluation.correctionHuman,
          undoNotation: evaluation.undoNotation,
          correctionNotation: evaluation.correctionNotation
        });
      }
    });

    return () => unsub();
  }, [subscribeToMoves, isFinished, currentStep, subStepCount, errorState, soundEnabled]);

  const handleRecalculate = () => {
    setErrorState(null);
    setSubStepCount(0);
    if (onRecalculateSolution) {
      onRecalculateSolution(cubeFaces);
    }
  };

  const handleNextManual = () => {
    setErrorState(null);
    setSubStepCount(0);
    if (currentStepIndex + 1 < totalSteps) {
      if (currentStep) {
        setCubeFaces(prev => applyMoveToFaces(prev, currentStep.notation));
      }
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setCurrentStepIndex(totalSteps);
    }
  };

  const handlePrevManual = () => {
    setErrorState(null);
    setSubStepCount(0);
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      if (prevStep) {
        setCubeFaces(prev => applyMoveToFaces(prev, invertMove(prevStep.notation)));
      }
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const progressPercent = totalSteps > 0 ? Math.round((currentStepIndex / totalSteps) * 100) : (isFinished ? 100 : 0);

  // Pantalla de Éxito al completar todos los pasos
  if (isFinished || solutionResult?.isSolved) {
    return (
      <div className="py-8 px-4 flex flex-col items-center justify-center text-center gap-4 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-2 ring-emerald-500/40">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white">¡Cubo Resuelto!</h3>
          <p className="text-xs text-slate-300 max-w-sm mt-1">
            Todas las caras están alineadas y ordenadas. El cubo inteligente está listo para la siguiente evaluación.
          </p>
        </div>
        <button
          onClick={onFinish}
          className="mt-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
        >
          Finalizar y Cerrar
        </button>
      </div>
    );
  }

  // Próximos pasos para la cinta
  const upcomingSteps = steps.slice(currentStepIndex + 1);
  const prevStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;

  return (
    <div className="flex flex-col gap-3">
      
      {/* ── BARRA SUPERIOR: GUÍA VISUAL COMPACTA (1 SOLA LÍNEA) ── */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
        <div className="flex items-center gap-2 text-slate-300 text-[11px] font-mono">
          <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="flex items-center gap-1 text-white font-bold">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block shadow-sm" /> Frente
          </span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1 text-white font-bold">
            <span className="w-2.5 h-2.5 rounded-sm bg-white inline-block shadow-sm" /> Arriba
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="hidden sm:inline">{isConnected ? 'BLE Conectado' : 'Modo Manual'}</span>
          </span>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          CINTA DE PASOS MODERNA Y RESPONSIVA (PASO ACTUAL + SIGUIENTES PASOS)
         ═════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
        
        {/* PASO ACTUAL (DESTACADO, ULTRA CLARO Y NUNCA SE CORTA) */}
        {currentStep && (
          <div className={`shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200 ${
            errorState
              ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/40 text-white'
              : successFlash
                ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/40 text-white'
                : 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/30 text-white'
          }`}>
            
            {/* Letra del movimiento con color de cara */}
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-slate-950 text-sm shadow-md shrink-0 border border-white/40"
              style={{ backgroundColor: currentStep.colorHex }}
            >
              {currentStep.notation}
            </div>

            <div className="flex flex-col justify-center min-w-0 pr-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-300 font-mono">
                {currentStepIndex + 1}/{totalSteps}
              </span>
              <span className="text-xs font-bold text-white whitespace-nowrap">
                {currentStep.colorName} · {currentStep.turnType === 'counter-clockwise' ? '90° ↺' : currentStep.turnType === 'double' ? '180° ⤹' : '90° ↻'}
              </span>
            </div>
          </div>
        )}

        {/* FLECHA SEPARADORA */}
        <div className="text-slate-600 shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>

        {/* SIGUIENTES PASOS (CINTA HORIZONTAL SCROLLEABLE SUAVE TOUCH) */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
          {upcomingSteps.length === 0 ? (
            <span className="text-[11px] text-emerald-400 font-mono italic">¡Último paso!</span>
          ) : (
            upcomingSteps.map((step, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentStepIndex(currentStepIndex + 1 + idx);
                  setCubeFaces(prev => applyMoveToFaces(prev, step.notation));
                }}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer select-none"
                title={`Paso ${currentStepIndex + 2 + idx}: Cara ${step.colorName} (${step.notation})`}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: step.colorHex }}
                />
                <span className="text-xs font-mono font-bold text-slate-200">{step.notation}</span>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ALERTA DE ERROR SI EL USUARIO GIRÓ LA CARA EQUIVOCADA */}
      {errorState && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <p className="text-rose-100 text-[11px] font-bold truncate">
              {errorState.correctionHuman || errorState.message}
            </p>
          </div>

          <button
            onClick={handleRecalculate}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg shadow shrink-0 cursor-pointer transition-all"
          >
            Recalcular
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          CUBO VIRTUAL 3D (COMPACTO Y ADAPTABLE)
         ═════════════════════════════════════════════════════════════════════ */}
      <div className="w-full flex flex-col items-center">
        <Cube3DPainter
          faces={cubeFaces}
          interactive={true}
          className="w-full"
          heightClass="h-[210px] sm:h-[280px]"
          showViewPresets={false}
        />
      </div>

      {/* ── BARRA DE PROGRESO INFERIOR & BOTONES DE NAVEGACIÓN ── */}
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{currentStepIndex} de {totalSteps} movimientos</span>
          <span className="font-bold text-blue-400">{progressPercent}%</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Botones de Control */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={handlePrevManual}
            disabled={currentStepIndex === 0}
            className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <button
            onClick={handleRecalculate}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
            title="Recalcular solución desde el estado actual"
          >
            <RefreshCw className="w-3 h-3 text-blue-400" />
            <span>Recalcular</span>
          </button>

          <button
            onClick={handleNextManual}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1 cursor-pointer"
          >
            <span>{currentStepIndex + 1 >= totalSteps ? 'Finalizar' : 'Siguiente'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
