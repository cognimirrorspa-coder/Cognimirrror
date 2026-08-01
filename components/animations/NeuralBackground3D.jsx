'use client';

import { useEffect, useRef } from 'react';

export const NeuralBackground3D = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- Parámetros Calibrados: Elegante, Suave y Equilibrado ---
    const NODE_COUNT = 65;            // Cantidad moderada de nodos
    const MOUSE_RADIUS = 150;         // Radio sutil de interacción
    const NODE_CONNECT_DIST = 130;     // Distancia máxima de conexión
    const ATTRACT_STRENGTH = 0.006;    // Atracción muy suave (evita aglomeración)

    let width, height;
    const mouse = { x: -9999, y: -9999, active: false };

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    resize();
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

    // Nodos
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * (width || 800),
      y: Math.random() * (height || 600),
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: 1.8 + Math.random() * 2.0,
      baseAlpha: 0.25 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    }));

    // Impulsos eléctricos sutiles
    const pulses = [];
    const maxPulses = 8;

    let frameId;

    const draw = () => {
      frameId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      // 1. Mover Nodos
      nodes.forEach(n => {
        n.phase += 0.01;
        n.x += n.vx;
        n.y += n.vy;

        // Atracción muy suave al puntero (movimiento orgánico)
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

        // Límite de velocidad
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 1.0) {
          n.vx = (n.vx / speed) * 1.0;
          n.vy = (n.vy / speed) * 1.0;
        }

        // Rebote elástico en bordes
        if (n.x < 0) { n.x = 0; n.vx *= -1; }
        if (n.x > width) { n.x = width; n.vx *= -1; }
        if (n.y < 0) { n.y = 0; n.vy *= -1; }
        if (n.y > height) { n.y = height; n.vy *= -1; }
      });

      // 2. Conexiones entre Nodos
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

            const baseAlpha = (1 - dist / NODE_CONNECT_DIST) * 0.18;
            const finalAlpha = Math.min(0.55, baseAlpha + mouseFactor * 0.35);
            const lineWidth = 0.7 + mouseFactor * 0.9; // Máximo 1.6px de grosor

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            if (mouseFactor > 0.1) {
              ctx.strokeStyle = `rgba(56, 189, 248, ${finalAlpha})`;
            } else {
              ctx.strokeStyle = `rgba(125, 175, 255, ${finalAlpha})`;
            }

            ctx.lineWidth = lineWidth;
            ctx.stroke();

            // Impulsos eléctricos ligeros
            if (mouseFactor > 0.4 && Math.random() < 0.008 && pulses.length < maxPulses) {
              pulses.push({
                x: a.x, y: a.y,
                tx: b.x, ty: b.y,
                progress: 0,
                speed: 0.02 + Math.random() * 0.03
              });
            }
          }
        }

        // 3. Conexión suave directa al mouse
        if (inMouseZoneA) {
          const mouseAlpha = (1 - distMouseA / MOUSE_RADIUS) * 0.45;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${mouseAlpha})`;
          ctx.lineWidth = 0.8 + mouseAlpha * 0.8;
          ctx.stroke();
        }
      }

      // 4. Impulsos
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const currX = pulse.x + (pulse.tx - pulse.x) * pulse.progress;
        const currY = pulse.y + (pulse.ty - pulse.y) * pulse.progress;

        ctx.beginPath();
        ctx.arc(currX, currY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 5. Aura Suave del Puntero
      if (mouse.active) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 25);
        mouseGlow.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
        mouseGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = mouseGlow;
        ctx.fill();
      }

      // 6. Nodos
      nodes.forEach(n => {
        const distMouse = mouse.active ? Math.hypot(n.x - mouse.x, n.y - mouse.y) : 9999;
        const mouseFactor = mouse.active ? Math.max(0, 1 - distMouse / MOUSE_RADIUS) : 0;

        const pulse = (Math.sin(n.phase) + 1) / 2;
        const alpha = Math.min(0.85, n.baseAlpha * 0.7 + mouseFactor * 0.35 + pulse * 0.1);
        const radius = n.radius + mouseFactor * 1.0;

        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 3);
        if (mouseFactor > 0.2) {
          grd.addColorStop(0, `rgba(56, 189, 248, ${alpha * 0.7})`);
          grd.addColorStop(1, `rgba(56, 189, 248, 0)`);
        } else {
          grd.addColorStop(0, `rgba(147, 197, 253, ${alpha * 0.4})`);
          grd.addColorStop(1, `rgba(147, 197, 253, 0)`);
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = mouseFactor > 0.2 ? 'rgba(240, 249, 255, 0.9)' : `rgba(200, 225, 255, ${alpha})`;
        ctx.fill();
      });
    };

    draw();

    return () => {
      cancelAnimationFrame(frameId);
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
