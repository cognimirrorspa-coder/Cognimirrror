'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

// Gráfico de Línea Curva (Smooth Bezier Spline) con Nodos Blancos y Scroll Continuo Ultra Fluido
const FluidPolylineChart = () => {
  const containerRef = useRef(null);

  // Mantener un búfer de 14 puntos para scroll continuo sin cortes
  const pointsRef = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      val: 200 + Math.sin(i * 0.8) * 80 + Math.random() * 40,
    }))
  );

  const [renderOffset, setRenderOffset] = useState(0);
  const [renderPoints, setRenderPoints] = useState([]);
  const [currentLatency, setCurrentLatency] = useState(290);

  const STEP_WIDTH = 12.5; // Ancho fijo entre columnas (8 columnas visibles en pantalla)

  useGSAP(
    () => {
      let offset = 0;
      const SPEED = 0.18; // Velocidad de avance continuo fluido (60fps/120fps)

      const updateLoop = () => {
        offset += SPEED;

        // Cuando la línea avanza el ancho de una columna
        if (offset >= STEP_WIDTH) {
          offset -= STEP_WIDTH;

          // Generar nuevo dato de latencia y desplazar el búfer de forma transparente
          const nextVal = Math.floor(180 + Math.random() * 210);
          setCurrentLatency(nextVal);

          pointsRef.current.shift();
          pointsRef.current.push({ val: nextVal });
        }

        setRenderOffset(offset);
        setRenderPoints(
          pointsRef.current.map((p, idx) => ({
            x: idx * STEP_WIDTH,
            y: 44 - Math.max(4, Math.min(38, (p.val / 500) * 38)),
          }))
        );
      };

      gsap.ticker.add(updateLoop);

      return () => {
        gsap.ticker.remove(updateLoop);
      };
    },
    { scope: containerRef }
  );

  // Construir curva Bézier Catmull-Rom suave y fluida
  let pathD = '';
  let areaD = '';

  if (renderPoints.length > 1) {
    pathD = `M ${renderPoints[0].x} ${renderPoints[0].y}`;
    for (let i = 0; i < renderPoints.length - 1; i++) {
      const curr = renderPoints[i];
      const next = renderPoints[i + 1];
      const mx = (curr.x + next.x) / 2;
      pathD += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
    }
    areaD = `${pathD} L ${renderPoints[renderPoints.length - 1].x} 50 L ${renderPoints[0].x} 50 Z`;
  }

  return (
    <div ref={containerRef} className="w-full h-full relative flex flex-col justify-end">
      {/* Indicador de Latencia actual */}
      <div className="absolute top-1 right-2 text-[10px] font-bold text-sky-400 font-mono z-10">
        {currentLatency} ms
      </div>

      <div className="w-full h-20 relative overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradiente de trazo cian resplandeciente */}
            <linearGradient id="cyanLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>

            {/* Gradiente de relleno sutil bajo la curva */}
            <linearGradient id="polyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>

            {/* Sombra de resplandor para los nodos blancos */}
            <filter id="whiteGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* Líneas verticales fijas de la cuadrícula (Grid Columns) */}
          {[0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100].map((gridX) => (
            <line
              key={`grid-${gridX}`}
              x1={gridX}
              y1={0}
              x2={gridX}
              y2={50}
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="0.5"
            />
          ))}

          {/* Grupo de gráfico con desplazamiento horizontal continuo ultra fluido */}
          <g transform={`translate(${-renderOffset}, 0)`}>
            {/* Relleno translúcido bajo la curva */}
            {areaD && <path d={areaD} fill="url(#polyAreaGrad)" />}

            {/* Trazo Principal Curvo Bézier (Smooth Curved Line) */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#cyanLineGrad)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};

export const SimulatedDashboard = () => {
  const [asymmetry, setAsymmetry] = useState(48);
  const [lastMove, setLastMove] = useState("R'");
  const [movesCount, setMovesCount] = useState(14);

  useEffect(() => {
    const interval = setInterval(() => {
      const newAsym = Math.floor(45 + Math.random() * 10);
      setAsymmetry(newAsym);

      const possibleMoves = ["U", "U'", "D", "D'", "R", "R'", "L", "L'", "F", "F'", "B", "B'"];
      setLastMove(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
      setMovesCount((c) => c + 1);
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0c0f1a] rounded-xl p-4 md:p-5 font-mono text-xs text-slate-300 shadow-inner flex flex-col justify-between h-[360px] w-full transition-all border border-white/5">
      {/* Información Superior */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Telemetría en Vivo</span>
        </div>
        <span className="text-slate-500 text-[9px]">ID: PIE-042</span>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-3 gap-2 text-center mb-2">
        <div className="bg-[#10131a] p-2 rounded border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wide">Giro</div>
          <div className="text-sm font-bold text-[#3B82F6]">{lastMove}</div>
        </div>
        <div className="bg-[#10131a] p-2 rounded border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wide">Latencia</div>
          <div className="text-sm font-bold text-slate-200">En Vivo</div>
        </div>
        <div className="bg-[#10131a] p-2 rounded border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wide">Giros</div>
          <div className="text-sm font-bold text-slate-200">{movesCount}</div>
        </div>
      </div>

      {/* Gráfico de Línea Curva Bézier con Nodos Blancos y Scroll Continuo Ultra Fluido */}
      <div className="flex-1 flex flex-col justify-end bg-[#0b0e15] rounded border border-white/5 p-2 mb-2 relative overflow-hidden h-28">
        <div className="absolute top-1 left-2 text-[8px] text-slate-500 font-bold uppercase font-sans z-10">Latencia (Inhibición)</div>
        <FluidPolylineChart />
      </div>

      {/* Indicador de Asimetría */}
      <div className="bg-[#10131a] p-2 rounded border border-white/5">
        <div className="flex justify-between items-center mb-1 text-[8px] text-slate-400 uppercase tracking-wider font-bold">
          <span>Asimetría Bimanual</span>
          <span className="text-[#3B82F6]">Balanceado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 font-bold font-sans">L</span>
          <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${asymmetry}%` }}
              className="bg-indigo-500 h-full transition-all duration-1000 ease-in-out"
            />
            <div
              style={{ width: `${100 - asymmetry}%` }}
              className="bg-[#3B82F6] h-full transition-all duration-1000 ease-in-out"
            />
          </div>
          <span className="text-[9px] text-slate-500 font-bold font-sans">R</span>
        </div>
      </div>
    </div>
  );
};
