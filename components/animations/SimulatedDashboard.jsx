'use client';

import { useState, useEffect } from 'react';

export const SimulatedDashboard = () => {
  const [points, setPoints] = useState([250, 290, 240, 310, 280, 350, 270, 300, 320, 290]);
  const [asymmetry, setAsymmetry] = useState(48);
  const [lastMove, setLastMove] = useState("R'");
  const [movesCount, setMovesCount] = useState(14);
  const [latency, setLatency] = useState(290);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLatency = Math.floor(180 + Math.random() * 210);
      setLatency(newLatency);
      setPoints(prev => [...prev.slice(1), newLatency]);

      const newAsym = Math.floor(45 + Math.random() * 10);
      setAsymmetry(newAsym);

      const possibleMoves = ["U", "U'", "D", "D'", "R", "R'", "L", "L'", "F", "F'", "B", "B'"];
      setLastMove(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
      setMovesCount(c => c + 1);
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0c0f1a] rounded-xl p-4 md:p-5 font-mono text-xs text-slate-300 shadow-inner flex flex-col justify-between h-[360px] w-full transition-all border border-white/5">
      {/* Top Info */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Telemetría en Vivo</span>
        </div>
        <span className="text-slate-500 text-[9px]">ID: PIE-042</span>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-3 gap-2 text-center mb-2">
        <div className="bg-[#10131a] p-2 rounded border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wide">Giro</div>
          <div className="text-sm font-bold text-[#3B82F6]">{lastMove}</div>
        </div>
        <div className="bg-[#10131a] p-2 rounded border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wide">Latencia</div>
          <div className="text-sm font-bold text-slate-200">{latency} ms</div>
        </div>
        <div className="bg-[#10131a] p-2 rounded border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wide">Giros</div>
          <div className="text-sm font-bold text-slate-200">{movesCount}</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="flex-1 flex flex-col justify-end bg-[#0b0e15] rounded border border-white/5 p-2 mb-2 relative overflow-hidden h-28">
        <div className="absolute top-1 left-2 text-[8px] text-slate-500 font-bold uppercase font-sans">Latencia (Inhibición)</div>
        <svg className="w-full h-20" viewBox="0 0 100 50" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            points={points.map((val, idx) => `${idx * 10},${50 - (val / 500) * 50}`).join(" ")}
          />
          <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="rgba(255,255,255,0.03)" strokeDasharray="2" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.03)" strokeDasharray="2" />
          <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="rgba(255,255,255,0.03)" strokeDasharray="2" />
        </svg>
      </div>

      {/* Asymmetry indicator */}
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
