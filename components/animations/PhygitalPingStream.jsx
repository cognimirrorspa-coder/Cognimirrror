'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

/**
 * PhygitalPingStream
 * Impulsado 100% por el motor GSAP (@gsap/react) para máxima fluidez a 60/120/144fps.
 * Modula las líneas de fibra óptica en tiempo real con física senoidal continua,
 * representando las variaciones de Ping (latencia) entre el cubo físico y la telemetría.
 */
export default function PhygitalPingStream() {
  const containerRef = useRef(null);
  const [ping, setPing] = useState(24);
  const uniqueId = useId().replace(/:/g, '');

  // Referencias para el motor de física senoidal GSAP
  const waveState = useRef({
    phase: 0,
    amplitude: 10,
    targetAmplitude: 10
  });

  // Estado reactivo de las alturas de control de onda
  const [waveOffsets, setWaveOffsets] = useState({
    w1: 0,
    w2: 0,
    w3: 0,
    w4: 0,
    w5: 0
  });

  // Simulación realista del vaivén de Ping (sube y baja dinámico)
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(prev => {
        const delta = (Math.random() - 0.48) * 8;
        const next = Math.max(16, Math.min(48, Math.round(prev + delta)));

        // Transición suave de amplitud calculada con GSAP
        const targetAmp = ((next - 16) / 32) * 14 + 6;
        waveState.current.targetAmplitude = targetAmp;
        gsap.to(waveState.current, {
          amplitude: targetAmp,
          duration: 0.9,
          ease: 'power2.out'
        });

        return next;
      });
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  // ── MOTOR GSAP: LOOP CONTINUO DE ONDULACIÓN SENOIDAL Y PULSOS A ALTA VELOCIDAD ──
  useGSAP(
    () => {
      // 1. Ticker continuo para el vaivén orgánico de las curvas
      const updateWaves = () => {
        waveState.current.phase += 0.042;
        const p = waveState.current.phase;
        const a = waveState.current.amplitude;

        setWaveOffsets({
          w1: Math.sin(p) * a,
          w2: Math.cos(p * 1.2) * (a * 0.8),
          w3: Math.sin(p * 0.9 + 1) * (a * 0.6),
          w4: Math.cos(p * 1.1 + 2) * (a * 0.9),
          w5: Math.sin(p * 0.8 + 3) * (a * 0.7)
        });
      };

      gsap.ticker.add(updateWaves);

      // 2. Animación fluida de pulsos de fotones a lo largo de los trazados
      gsap.fromTo(
        '.photon-pulse-fast',
        { strokeDashoffset: 260 },
        { strokeDashoffset: 0, duration: 1.1, ease: 'none', repeat: -1 }
      );

      gsap.fromTo(
        '.photon-pulse-1',
        { strokeDashoffset: 300 },
        { strokeDashoffset: 0, duration: 1.7, ease: 'none', repeat: -1 }
      );

      gsap.fromTo(
        '.photon-pulse-2',
        { strokeDashoffset: 340 },
        { strokeDashoffset: 0, duration: 2.2, ease: 'none', repeat: -1 }
      );

      // 3. Respiración sutil de los nodos terminales
      gsap.to('.terminal-node', {
        scale: 1.25,
        transformOrigin: 'center center',
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        stagger: 0.15,
        ease: 'sine.inOut'
      });

      return () => {
        gsap.ticker.remove(updateWaves);
      };
    },
    { scope: containerRef }
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full md:w-32 lg:w-44 xl:w-52 flex flex-col items-center justify-center my-4 md:my-0 select-none"
    >
      {/* ── VERSIÓN DESKTOP: HAZ HORIZONTAL DE FIBRA ÓPTICA GSAP (MD+) ── */}
      <div className="hidden md:flex flex-col items-center justify-center w-full h-[380px] relative">
        
        {/* Glow de fondo ambiental sincronizado con GSAP */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-blue-500/10 blur-xl pointer-events-none transition-opacity duration-700"
          style={{ opacity: ping > 32 ? 0.85 : 0.45 }}
        />

        {/* Canvas SVG con las líneas de datos y paquetes en vuelo */}
        <svg 
          className="w-full h-full overflow-visible pointer-events-none"
          viewBox="0 0 160 300" 
          preserveAspectRatio="none"
        >
          <defs>
            {/* Filtros de resplandor Neón */}
            <filter id={`cyanGlow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id={`magentaGlow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradientes de líneas */}
            <linearGradient id={`gradCyan-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id={`gradMagenta-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="1" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id={`gradPurple-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* ── LÍNEAS CURVAS MODULADAS EN TIEMPO REAL POR GSAP ── */}
          
          {/* Línea 1: Superior Cian (Va hacia Giro D'/U') */}
          <path
            d={`M -45,138 C 30,${138 - waveOffsets.w1} 80,65 220,55`}
            fill="none"
            stroke={`url(#gradCyan-${uniqueId})`}
            strokeWidth="2"
            strokeLinecap="round"
            filter={`url(#cyanGlow-${uniqueId})`}
            className="opacity-90"
          />
          {/* Pulso de fotones GSAP línea 1 */}
          <path
            d={`M -45,138 C 30,${138 - waveOffsets.w1} 80,65 220,55`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeDasharray="18 130"
            className="photon-pulse-1 opacity-85"
          />
          <circle cx="220" cy="55" r="3.5" fill="#22d3ee" filter={`url(#cyanGlow-${uniqueId})`} className="terminal-node" />

          {/* Línea 2: Media-Alta Cian/Púrpura (Va hacia Latencia en Vivo) */}
          <path
            d={`M -45,144 C 40,${144 + waveOffsets.w2} 95,95 215,95`}
            fill="none"
            stroke={`url(#gradPurple-${uniqueId})`}
            strokeWidth="1.8"
            strokeLinecap="round"
            filter={`url(#cyanGlow-${uniqueId})`}
            className="opacity-80"
          />
          <path
            d={`M -45,144 C 40,${144 + waveOffsets.w2} 95,95 215,95`}
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="2.2"
            strokeDasharray="14 100"
            className="photon-pulse-2 opacity-90"
          />
          <circle cx="215" cy="95" r="3" fill="#38bdf8" filter={`url(#cyanGlow-${uniqueId})`} className="terminal-node" />

          {/* Línea 3: Central Magenta (Travesía principal horizontal con pulso profundo) */}
          <path
            d={`M -45,150 C 45,${150 - waveOffsets.w3} 110,${150 + waveOffsets.w3 * 0.7} 235,148`}
            fill="none"
            stroke={`url(#gradMagenta-${uniqueId})`}
            strokeWidth="2.4"
            strokeLinecap="round"
            filter={`url(#magentaGlow-${uniqueId})`}
            className="opacity-95"
          />
          <path
            d={`M -45,150 C 45,${150 - waveOffsets.w3} 110,${150 + waveOffsets.w3 * 0.7} 235,148`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeDasharray="26 110"
            className="photon-pulse-fast opacity-90"
          />
          <circle cx="235" cy="148" r="4.5" fill="#f43f5e" filter={`url(#magentaGlow-${uniqueId})`} className="terminal-node" />

          {/* Línea 4: Media-Baja Cian (Hacia el gráfico oscilante de latencia) */}
          <path
            d={`M -45,156 C 35,${156 + waveOffsets.w4} 85,190 215,195`}
            fill="none"
            stroke={`url(#gradCyan-${uniqueId})`}
            strokeWidth="1.8"
            strokeLinecap="round"
            filter={`url(#cyanGlow-${uniqueId})`}
            className="opacity-85"
          />
          <path
            d={`M -45,156 C 35,${156 + waveOffsets.w4} 85,190 215,195`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeDasharray="20 120"
            className="photon-pulse-1 opacity-85"
          />
          <circle cx="215" cy="195" r="3.5" fill="#22d3ee" filter={`url(#cyanGlow-${uniqueId})`} className="terminal-node" />

          {/* Línea 5: Inferior Magenta/Rosa (Hacia la barra de Asimetría) */}
          <path
            d={`M -45,162 C 40,${162 - waveOffsets.w5} 90,240 220,250`}
            fill="none"
            stroke={`url(#gradMagenta-${uniqueId})`}
            strokeWidth="2"
            strokeLinecap="round"
            filter={`url(#magentaGlow-${uniqueId})`}
            className="opacity-80"
          />
          <path
            d={`M -45,162 C 40,${162 - waveOffsets.w5} 90,240 220,250`}
            fill="none"
            stroke="#ffe4e6"
            strokeWidth="2.6"
            strokeDasharray="16 140"
            className="photon-pulse-2 opacity-85"
          />
          <circle cx="220" cy="250" r="3.5" fill="#ec4899" filter={`url(#magentaGlow-${uniqueId})`} className="terminal-node" />

          {/* Líneas secundarias ópticas para densidad de datos */}
          <path
            d={`M -45,141 C 25,${141 - waveOffsets.w1 * 0.5} 70,78 180,82`}
            fill="none"
            stroke="rgba(34, 211, 238, 0.45)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <path
            d={`M -45,159 C 30,${159 + waveOffsets.w5 * 0.6} 75,215 180,225`}
            fill="none"
            stroke="rgba(236, 72, 153, 0.45)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        </svg>
      </div>

      {/* ── VERSIÓN MÓVIL (< MD) ── */}
      <div className="md:hidden flex flex-col items-center justify-center py-4 w-full relative">
        <div className="flex items-center gap-2 w-full max-w-[200px]">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-cyan-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-fuchsia-500/50 to-fuchsia-500" />
        </div>
      </div>
    </div>
  );
}
