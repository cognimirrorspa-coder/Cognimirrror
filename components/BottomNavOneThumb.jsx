'use client';

import React from 'react';
import { 
  LayoutDashboard, ClipboardCheck, GraduationCap, 
  Brain, FileSpreadsheet, Box, Sparkles 
} from 'lucide-react';

export default function BottomNavOneThumb({
  activeTab,
  onTabChange,
  pendingCheckinsCount = 0
}) {
  const NAV_ITEMS = [
    {
      id: 'resumen',
      label: 'Inicio',
      icon: LayoutDashboard,
    },
    {
      id: 'checkin',
      label: 'Check-in',
      icon: ClipboardCheck,
      badge: pendingCheckinsCount > 0 ? pendingCheckinsCount : null,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'alumnos',
      label: 'Alumnos',
      icon: GraduationCap,
    },
    {
      id: 'niveles',
      label: 'Cubo & Test',
      icon: Brain,
    },
    {
      id: 'informes',
      label: 'Reportes',
      icon: FileSpreadsheet,
    }
  ];

  return (
    <nav 
      aria-label="Navegación rápida de pulgar"
      className="fixed bottom-3 inset-x-3 sm:inset-x-8 z-40 md:hidden no-print"
    >
      <div className="bg-[#0b101d]/92 backdrop-blur-xl border border-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] px-2 py-1.5 flex items-center justify-around relative">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-blue-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              {/* Contenedor del icono con Badge */}
              <div className="relative flex items-center justify-center">
                <div className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-blue-600/20 shadow-sm' : ''
                }`}>
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                </div>

                {/* Badge de Alumnos pendientes o notificaciones */}
                {item.badge && (
                  <span className={`absolute -top-1 -right-2 text-[9px] font-black px-1.5 py-0.2 rounded-full text-white font-mono shadow-sm ${item.badgeColor || 'bg-blue-500'}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Etiqueta compacta */}
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'text-white font-black' : 'text-slate-400'}`}>
                {item.label}
              </span>

              {/* Indicador luminoso activo inferior */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#38bdf8] mt-0.5 animate-in zoom-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
