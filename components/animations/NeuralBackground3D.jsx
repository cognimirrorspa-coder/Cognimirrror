'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

// Colores del Cerebro 3D: Cyan (Reacción #38bdf8) y Púrpura (Memory #a855f7)
const BRAIN_COLORS = [
  { hex: '#38bdf8', r: 56, g: 189, b: 248 },  // Cyan (Reacción Mirror)
  { hex: '#a855f7', r: 168, g: 85, b: 247 },  // Purple (Memory Mirror)
];

export const NeuralBackground3D = () => {
  const canvasRef = useRef(null);

  useGSAP(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const NODE_COUNT = 75;             // Cantidad óptima de nodos
    const MOUSE_RADIUS = 160;          // Radio sutil de interacción
    const NODE_CONNECT_DIST = 145;      // Distancia máxima de conexión
    const ATTRACT_STRENGTH = 0.005;     // Atracción suave

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);
    const mouse = { x: -9999, y: -9999, active: false };

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
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

    // Inicializar Nodos asignando equitativamente los 2 colores del cerebro 3D
    const nodes = Array.from({ length: NODE_COUNT }, (_, idx) => {
      const color = BRAIN_COLORS[idx % BRAIN_COLORS.length];
      return {
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 600),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: 2.0 + Math.random() * 2.2,
        baseAlpha: 0.35 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.015,
        color,
      };
    });

    const pulses = [];
    const maxPulses = 10;

    // Loop de renderizado sincronizado con GSAP Ticker
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Actualización de Posición de Nodos
      nodes.forEach((n) => {
        n.phase += n.pulseSpeed;
        n.x += n.vx;
        n.y += n.vy;

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
      });

      // 2. Dibujar Conexiones (Lineas levemente visibles de fondo)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const distMouseA = mouse.active ? Math.hypot(a.x - mouse.x, a.y - mouse.y) : 9999;
        const inMouseZoneA = distMouseA < MOUSE_RADIUS;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < NODE_CONNECT_DIST) {
            const distMouseB = mouse.active ? Math.hypot(b.x - mouse.x, b.y - mouse.y) : 9999;
            const inMouseZoneB = distMouseB < MOUSE_RADIUS;

            const mouseFactor = (inMouseZoneA || inMouseZoneB)
              ? Math.max(0, 1 - Math.min(distMouseA, distMouseB) / MOUSE_RADIUS)
              : 0;

            // Opacidad base constante para que la red sea siempre levemente visible
            const distRatio = 1 - dist / NODE_CONNECT_DIST;
            const baseAlpha = 0.09 + distRatio * 0.22;
            const finalAlpha = Math.min(0.65, baseAlpha + mouseFactor * 0.4);
            const lineWidth = 0.8 + mouseFactor * 0.9;

            // Gradiente lineal entre el color del nodo A y del nodo B
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, `rgba(${a.color.r}, ${a.color.g}, ${a.color.b}, ${finalAlpha})`);
            grad.addColorStop(1, `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${finalAlpha})`);

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            // Generar impulsos de luz de color cyan/purple sin puntos blancos
          }
        }

        // Conexión directa al puntero
        if (inMouseZoneA) {
          const mouseAlpha = (1 - distMouseA / MOUSE_RADIUS) * 0.5;
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

      // Dibujar Nodos únicamente con los 2 colores del Cerebro 3D (Cyan y Purple, sin puntos blancos)
      nodes.forEach((n) => {
        const distMouse = mouse.active ? Math.hypot(n.x - mouse.x, n.y - mouse.y) : 9999;
        const mouseFactor = mouse.active ? Math.max(0, 1 - distMouse / MOUSE_RADIUS) : 0;

        const pulse = (Math.sin(n.phase) + 1) / 2;
        const alpha = Math.min(0.9, n.baseAlpha + mouseFactor * 0.35 + pulse * 0.15);
        const radius = n.radius + mouseFactor * 1.2;

        // Halo resplandeciente exterior
        const haloGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 3.5);
        haloGrad.addColorStop(0, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${alpha * 0.6})`);
        haloGrad.addColorStop(1, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, 0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Núcleo central del nodo (Color puro Cyan o Purple)
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${alpha})`;
        ctx.fill();
      });
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

