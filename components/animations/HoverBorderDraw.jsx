'use client';

import React from 'react';

/**
 * HoverBorderDraw
 * 
 * Efecto animado "Hover Border Draw" con SVG stroke-dasharray approach.
 * Al pasar el cursor por encima (.group:hover o .box:hover), el borde vectorial
 * se dibuja progresivamente alrededor de la tarjeta en 0.6s con su color característico.
 *
 * @param {string} color - Color hexadecimal o CSS del trazo (ej: #10b981, #ec4899, #06b6d4)
 * @param {number} rx - Radio de curvatura horizontal de las esquinas (default 12 para rounded-xl)
 * @param {number} ry - Radio de curvatura vertical de las esquinas (default 12)
 * @param {number} strokeWidth - Grosor del trazo en píxeles (default 2)
 * @param {number} pathLength - Calibración del perímetro SVG (default 600)
 * @param {boolean} glow - Si debe proyectar resplandor drop-shadow neón en hover (default true)
 * @param {string} className - Clases adicionales
 */
export default function HoverBorderDraw({
  color = '#06b6d4',
  rx = 12,
  ry = 12,
  strokeWidth = 2,
  pathLength = 600,
  glow = true,
  className = ''
}) {
  return (
    <svg
      className={`hover-border-draw pointer-events-none absolute inset-0 w-full h-full overflow-visible z-20 ${className}`}
      style={{ borderRadius: `${rx}px` }}
      aria-hidden="true"
    >
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        pathLength={pathLength}
        style={{
          '--border-color': color,
          filter: glow ? undefined : 'none'
        }}
      />
    </svg>
  );
}
