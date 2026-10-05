'use client';

import React from 'react';
import PixelSwap from './reactbits/PixelSwap';
import { Sun, Moon } from 'lucide-react';

export default function ThemePixelToggle({
  isDark,
  toggleTheme,
  theme = 'dark',
  variant = 'header'
}) {
  const handleToggle = () => {
    if (toggleTheme) {
      toggleTheme();
    }
  };

  if (variant === 'sidebar') {
    return (
      <PixelSwap
        className="w-full h-10 rounded-xl overflow-hidden cursor-pointer select-none"
        aspectRatio="auto"
        active={!isDark}
        onActiveChange={handleToggle}
        trigger="click"
        pixelSize={14}
        gap={0}
        pixelRadius={0}
        pixelSpin={10}
        pixelScale={0.3}
        fade={true}
        duration={350}
        pixelDuration={150}
        pattern="center"
        randomness={0.15}
        firstContent={
          <div className="w-full h-full p-2.5 rounded-xl flex items-center justify-between text-xs font-bold bg-[#181b26] hover:bg-[#222736] text-slate-300 border border-[#222736] select-none transition-colors">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Modo Claro</span>
            </div>
            <span className="text-[10px] uppercase opacity-75 font-mono">{theme}</span>
          </div>
        }
        secondContent={
          <div className="w-full h-full p-2.5 rounded-xl flex items-center justify-between text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 select-none transition-colors">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Modo Oscuro</span>
            </div>
            <span className="text-[10px] uppercase opacity-75 font-mono">{theme}</span>
          </div>
        }
      />
    );
  }

  // Variant: 'header' (Desktop navbar header - Exact match to original buttons)
  return (
    <PixelSwap
      className="w-[122px] h-[32px] rounded-xl overflow-hidden cursor-pointer shrink-0 select-none"
      aspectRatio="auto"
      active={!isDark}
      onActiveChange={handleToggle}
      trigger="click"
      pixelSize={10}
      gap={0}
      pixelRadius={0}
      pixelSpin={15}
      pixelScale={0.25}
      fade={true}
      duration={380}
      pixelDuration={160}
      pattern="center"
      randomness={0.15}
      firstContent={
        <div className="w-full h-full px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 select-none transition-all cursor-pointer bg-[#1c2130] border-[#2b3145] text-slate-300 hover:bg-[#252b3e]">
          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="whitespace-nowrap">Modo Claro</span>
        </div>
      }
      secondContent={
        <div className="w-full h-full px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 select-none transition-all cursor-pointer bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200">
          <Moon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="whitespace-nowrap">Modo Oscuro</span>
        </div>
      }
    />
  );
}
