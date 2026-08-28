'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

// Colores del Cerebro 3D: Cyan (Reacción #38bdf8) y Púrpura (Memory #a855f7)
const BRAIN_COLORS = [
  { type: 'reaction', hex: '#38bdf8', r: 56, g: 189, b: 248 },  // Cyan (Reacción Mirror)
  { type: 'memory',   hex: '#a855f7', r: 168, g: 85, b: 247 },  // Purple (Memory Mirror)
];

export const NeuralBackground3D = ({ activeModules = { reaction: true, memory: true } }) => {
  const canvasRef = useRef(null);
  const activeModulesRef = useRef(activeModules);

  // Mantener ref siempre actualizada con los cambios de props
  useEffect(() => {
    activeModulesRef.current = activeModules;
  }, [activeModules?.reaction, activeModules?.memory]);

  useGSAP(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const MOUSE_RADIUS = 160;          // Radio sutil de interacción
    const ATTRACT_STRENGTH = 0.005;     // Atracción suave

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);
    const mouse = { x: -9999, y: -9999, active: false };

    // Cálculo dinámico de densidad proporcional al tamaño de pantalla para un fondo ultra limpio en móviles
    const getResponsiveParams = (w) => {
      if (w < 480) {
        // Teléfono Angosto (< 480px): Solo 14 nodos sutiles, distancia corta (70px) y máx 2 conexiones por punto
        return { count: 14, dist: 70, maxConn: 2, speed: 0.22 };
      } else if (w < 640) {
        // Teléfono Mediano (480px - 639px): 18 nodos limpios, distancia 80px, máx 2 conexiones
        return { count: 18, dist: 80, maxConn: 2, speed: 0.25 };
      } else if (w < 1024) {
        // Tablet (640px - 1023px): 35 nodos, distancia 110px, máx 3 conexiones
        return { count: 35, dist: 110, maxConn: 3, speed: 0.30 };
      } else {
        // Escritorio (>= 1024px): Exactamente 75 nodos y 145px de distancia (100% Idéntico al Original de Escritorio)
        return { count: 75, dist: 145, maxConn: 6, speed: 0.35 };
      }
    };

    let params = getResponsiveParams(window.innerWidth || width);

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      params = getResponsiveParams(window.innerWidth || width);
    };

    window.addEventListener('resize', resize);

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const onMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    // Inicializar Pool de 75 Nodos asignando equitativamente los 2 colores del cerebro 3D
    const nodes = Array.from({ length: 75 }, (_, idx) => {
      const color = BRAIN_COLORS[idx % BRAIN_COLORS.length];
      return {
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 600),
        vx: (Math.random() - 0.5) * params.speed,
        vy: (Math.random() - 0.5) * params.speed,
        radius: 1.8 + Math.random() * 2.0,
        baseAlpha: 0.35 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.015,
        color,
        type: color.type,
        visibleAlpha: 1.0,
      };
    });

    // Loop de renderizado sincronizado con GSAP Ticker
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Limitar cantidad activa de nodos a params.count
      const activeCount = Math.min(nodes.length, params.count);

      // 1. Actualización de Posición de Nodos e Interpolación Suave de Visibilidad (Lerp)
      for (let i = 0; i < activeCount; i++) {
        const n = nodes[i];
        n.phase += n.pulseSpeed;
        n.x += n.vx;
        n.y += n.vy;

        // Smooth Lerp de visibilidad según el botón activado/desactivado (ON / OFF)
        const isTypeActive = Boolean(activeModulesRef.current?.[n.type]);
        const targetAlpha = isTypeActive ? 1.0 : 0.0;
        n.visibleAlpha += (targetAlpha - n.visibleAlpha) * 0.15;

        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (1 - dist / MOUSE_RADIUS) * ATTRACT_STRENGTH;
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        }

        const speed = Math.hypot(n.vx, n.vy);
        if (speed > 0.9) {
          n.vx = (n.vx / speed) * 0.9;
          n.vy = (n.vy / speed) * 0.9;
        }

        if (n.x < 0) { n.x = 0; n.vx *= -1; }
        if (n.x > width) { n.x = width; n.vx *= -1; }
        if (n.y < 0) { n.y = 0; n.vy *= -1; }
        if (n.y > height) { n.y = height; n.vy *= -1; }
      }

      // 2. Dibujar Conexiones entre Nodos Activos (con límite de conexiones por nodo)
      const connCounts = new Uint8Array(activeCount);

      for (let i = 0; i < activeCount; i++) {
        const a = nodes[i];
        if (a.visibleAlpha < 0.05 || connCounts[i] >= params.maxConn) continue;
        const distMouseA = mouse.active ? Math.hypot(a.x - mouse.x, a.y - mouse.y) : 9999;
        const inMouseZoneA = distMouseA < MOUSE_RADIUS;

        for (let j = i + 1; j < activeCount; j++) {
          const b = nodes[j];
          if (b.visibleAlpha < 0.05 || connCounts[j] >= params.maxConn) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < params.dist) {
            connCounts[i]++;
            connCounts[j]++;

            const distMouseB = mouse.active ? Math.hypot(b.x - mouse.x, b.y - mouse.y) : 9999;
            const inMouseZoneB = distMouseB < MOUSE_RADIUS;

            const mouseFactor = (inMouseZoneA || inMouseZoneB)
              ? Math.max(0, 1 - Math.min(distMouseA, distMouseB) / MOUSE_RADIUS)
              : 0;

            const distRatio = 1 - dist / params.dist;
            const lineActiveFactor = Math.min(a.visibleAlpha, b.visibleAlpha);
            const baseAlpha = (0.09 + distRatio * 0.22) * lineActiveFactor;
            const finalAlpha = Math.min(0.65, (baseAlpha + mouseFactor * 0.4) * lineActiveFactor);

            if (finalAlpha < 0.01) continue;
            const lineWidth = 0.8 + mouseFactor * 0.9;

            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, `rgba(${a.color.r}, ${a.color.g}, ${a.color.b}, ${finalAlpha})`);
            grad.addColorStop(1, `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${finalAlpha})`);

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        }

        // Conexión directa al puntero si el nodo está activo
        if (inMouseZoneA && a.visibleAlpha > 0.1) {
          const mouseAlpha = (1 - distMouseA / MOUSE_RADIUS) * 0.5 * a.visibleAlpha;
          const gradMouse = ctx.createLinearGradient(a.x, a.y, mouse.x, mouse.y);
          gradMouse.addColorStop(0, `rgba(${a.color.r}, ${a.color.g}, ${a.color.b}, ${mouseAlpha})`);
          gradMouse.addColorStop(1, `rgba(56, 189, 248, ${mouseAlpha})`);

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = gradMouse;
          ctx.lineWidth = 0.9 + mouseAlpha * 0.8;
          ctx.stroke();
        }
      }

      // Aura de interacción en el ratón
      if (mouse.active) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 30);
        mouseGlow.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
        mouseGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.1)');
        mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = mouseGlow;
        ctx.fill();
      }

      // Dibujar Nodos activos únicamente (Cyan y Purple, con desvanecimiento fluido)
      for (let i = 0; i < activeCount; i++) {
        const n = nodes[i];
        if (n.visibleAlpha < 0.05) continue;

        const distMouse = mouse.active ? Math.hypot(n.x - mouse.x, n.y - mouse.y) : 9999;
        const mouseFactor = mouse.active ? Math.max(0, 1 - distMouse / MOUSE_RADIUS) : 0;

        const pulse = (Math.sin(n.phase) + 1) / 2;
        const alpha = Math.min(0.9, (n.baseAlpha + mouseFactor * 0.35 + pulse * 0.15) * n.visibleAlpha);
        if (alpha < 0.01) continue;
        const radius = n.radius + mouseFactor * 1.2;

        // Halo resplandeciente exterior
        const haloGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 3.5);
        haloGrad.addColorStop(0, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${alpha * 0.6})`);
        haloGrad.addColorStop(1, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, 0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Núcleo central del nodo
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${alpha})`;
        ctx.fill();
      }
    };

    // Agregar callback al ticker de GSAP
    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block', pointerEvents: 'none' }}
    />
  );
};

