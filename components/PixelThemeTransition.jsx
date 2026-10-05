'use client';

import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

/**
 * PixelThemeTransition
 * Transición digital de cuadros grandes fiel a ReactBits Pixel Swap.
 *
 * Correcciones de precisión geométrica:
 * 1. Anclaje 1:1 absoluto: Utiliza getBoundingClientRect() exacto del contenedor
 *    (descontando scrollbars del sistema) para que la información NUNCA se corra ni se desplace.
 * 2. Integridad del DOM: NO se eliminan íconos (aria-hidden) para que los anchos
 *    de la barra lateral y cabecera se mantengan idénticos al milímetro.
 * 3. Sincronización de scroll profunda: Restaura los offsets de scroll en cada clon.
 * 4. Toda la información permanece visible durante todo el proceso:
 *    - Piezas oscuras: Muestra la información real en Modo Oscuro (fondo oscuro, texto blanco).
 *    - Piezas claras: Muestra la información real en Modo Claro (fondo claro, texto oscuro).
 *    - Ambos con marcos digitales nítidos.
 */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const noise = (seed) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

// Curva Bezier cúbica (0.22, 1, 0.36, 1) de ReactBits
const makeEasing = (x1, y1, x2, y2) => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  return (progress) => {
    let t = progress;
    for (let i = 0; i < 5; i += 1) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (!slope) break;
      t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
    }
    t = clamp(t, 0, 1);
    return ((ay * t + by) * t + cy) * t;
  };
};

// Curva Bezier cúbica (0.22, 1, 0.36, 1) característica de ReactBits Pixel Swap
const easeReactBits = makeEasing(0.22, 1, 0.36, 1);

const KEYFRAME_STEPS = 16;

// Construye la pareja de keyframes sin saltos ni fluctuaciones
const buildKeyframePair = ({ startScale, endScale }) => {
  const windowKeyframes = [];
  const contentKeyframes = [];

  for (let step = 0; step <= KEYFRAME_STEPS; step += 1) {
    const progress = step / KEYFRAME_STEPS;
    const eased = easeReactBits(progress);
    const scale = startScale + (endScale - startScale) * eased;

    windowKeyframes.push({
      offset: progress,
      opacity: Math.min(1, eased * 2.2),
      transform: `scale(${scale.toFixed(4)})`
    });

    contentKeyframes.push({
      offset: progress,
      transform: `scale(${(1 / scale).toFixed(4)})`
    });
  }

  return { windowKeyframes, contentKeyframes };
};

// Clona preservando toda la estructura, iconos y medidas intactas
const createExactClone = (sourceElement) => {
  const clone = sourceElement.cloneNode(true);
  clone.querySelectorAll?.('#pixel-theme-transition-root').forEach((el) => el.remove());
  clone.style.pointerEvents = 'none';
  clone.style.userSelect = 'none';
  clone.style.margin = '0';
  return clone;
};

// Sincroniza la posición exacta de scroll 1-a-1 entre dos árboles DOM completos
const syncScrollsBetweenTrees = (sourceRoot, targetRoot) => {
  if (!sourceRoot || !targetRoot) return;
  const sourceElements = sourceRoot.querySelectorAll('.overflow-y-auto, .overflow-x-auto, [data-scrollable], main, nav');
  const targetElements = targetRoot.querySelectorAll('.overflow-y-auto, .overflow-x-auto, [data-scrollable], main, nav');
  
  for (let i = 0; i < sourceElements.length; i++) {
    const src = sourceElements[i];
    const tgt = targetElements[i];
    if (src && tgt) {
      tgt.scrollTop = src.scrollTop;
      tgt.scrollLeft = src.scrollLeft;
    }
  }
};

const PixelThemeTransition = forwardRef((props, ref) => {
  const containerRef = useRef(null);
  const activeAnimationsRef = useRef([]);
  const activeTimersRef = useRef([]);

  const cleanUp = () => {
    activeAnimationsRef.current.forEach((anim) => {
      try { anim.cancel(); } catch (_) {}
    });
    activeAnimationsRef.current = [];

    activeTimersRef.current.forEach((t) => clearTimeout(t));
    activeTimersRef.current = [];

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.style.display = 'none';
      containerRef.current.style.opacity = '1';
    }
  };

  useEffect(() => {
    return () => cleanUp();
  }, []);

  useImperativeHandle(ref, () => ({
    start: ({ prevTheme, nextTheme, targetElement, originX, originY, onSwitchTheme }) => {
      try {
        const rootElement = targetElement || document.getElementById('cognimirror-dashboard-root') || document.body;
        const container = containerRef.current;

        if (!rootElement || !container) {
          onSwitchTheme?.();
          return;
        }

        cleanUp();

        // 1. Dimensiones al píxel exacto
        const rect = rootElement.getBoundingClientRect();
        const exactWidth = Math.round(rect.width);
        const exactHeight = Math.round(rect.height);
        const exactLeft = Math.round(rect.left);
        const exactTop = Math.round(rect.top);

        const isGoingLight = nextTheme === 'light';

        // 2. Snapshot fiel del tema saliente
        const outgoingClone = createExactClone(rootElement);
        outgoingClone.style.width = `${exactWidth}px`;
        outgoingClone.style.height = `${exactHeight}px`;

        const underlay = document.createElement('div');
        underlay.style.position = 'fixed';
        underlay.style.left = `${exactLeft}px`;
        underlay.style.top = `${exactTop}px`;
        underlay.style.width = `${exactWidth}px`;
        underlay.style.height = `${exactHeight}px`;
        underlay.style.overflow = 'hidden';
        underlay.style.pointerEvents = 'none';
        underlay.style.zIndex = '99980';
        underlay.appendChild(outgoingClone);

        // 3. Cuadrícula proporcionada y armónica según tamaño de pantalla
        const cols = exactWidth < 640 ? 4 : exactWidth < 1024 ? 6 : exactWidth < 1440 ? 8 : 10;
        const pixelSize = Math.ceil(exactWidth / cols);
        const rows = Math.ceil(exactHeight / pixelSize);

        // Contenedor de piezas del tema entrante (completamente limpio, sin líneas ni cuadrículas intermedias)
        const tilesContainer = document.createElement('div');
        tilesContainer.style.position = 'fixed';
        tilesContainer.style.left = `${exactLeft}px`;
        tilesContainer.style.top = `${exactTop}px`;
        tilesContainer.style.width = `${exactWidth}px`;
        tilesContainer.style.height = `${exactHeight}px`;
        tilesContainer.style.overflow = 'hidden';
        tilesContainer.style.pointerEvents = 'none';
        tilesContainer.style.zIndex = '99985';

        container.appendChild(underlay);
        container.appendChild(tilesContainer);
        container.style.opacity = '1';
        container.style.display = 'block';

        // Sincronizar scroll del snapshot saliente una vez conectado en el DOM
        syncScrollsBetweenTrees(rootElement, outgoingClone);

        // 6. Ejecutar cambio de tema en React
        onSwitchTheme?.();

        // Velocidad pausada, fluida y cinematográfica a la mitad de velocidad (el doble de tiempo)
        const totalDuration = 2500; // Duración total amplia a mitad de velocidad
        const pixelDuration = 850; // Apertura pausada y detallada de cada cuadro
        const spreadWindow = totalDuration - pixelDuration; // 1650 ms de cadencia rítmica
        const startScale = 0.35;
        const endScale = 1.03; // Cobertura total limpia

        const { windowKeyframes, contentKeyframes } = buildKeyframePair({ startScale, endScale });

        // Punto de origen del clic para la onda de propagación orgánica
        const clickX = originX ?? (exactLeft + exactWidth - 100);
        const clickY = originY ?? (exactTop + 35);
        const maxDist = Math.max(
          Math.hypot(clickX - exactLeft, clickY - exactTop),
          Math.hypot(clickX - (exactLeft + exactWidth), clickY - (exactTop + exactHeight)),
          Math.hypot(clickX - exactLeft, clickY - (exactTop + exactHeight)),
          Math.hypot(clickX - (exactLeft + exactWidth), clickY - exactTop),
          1
        );

        // 7. Esperar a que React renderice el tema entrante
        let checkCount = 0;
        const waitForIncomingTheme = () => {
          checkCount++;
          const isNowLight = rootElement.classList.contains('bg-slate-50') || !rootElement.classList.contains('bg-[#121622]');
          const ready = isNowLight === isGoingLight || checkCount >= 5;

          if (!ready) {
            requestAnimationFrame(waitForIncomingTheme);
            return;
          }

          const incomingClone = createExactClone(rootElement);
          incomingClone.style.width = `${exactWidth}px`;
          incomingClone.style.height = `${exactHeight}px`;

          const fragment = document.createDocumentFragment();

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const index = r * cols + c;

              const px = c * pixelSize;
              const py = r * pixelSize;
              const cx = px + pixelSize / 2;
              const cy = py + pixelSize / 2;

              // Onda de propagación rítmica y continua: 70% distancia física + 30% dispersión armónica
              // Esto elimina las fluctuaciones o saltos caóticos y produce un flujo visual cinematográfico
              const screenCx = exactLeft + cx;
              const screenCy = exactTop + cy;
              const distFactor = Math.hypot(screenCx - clickX, screenCy - clickY) / maxDist;
              const subtleJitter = noise(index * 7.91 + 13.37) * 0.28;
              const combinedProgress = Math.min(1, Math.max(0, distFactor * 0.72 + subtleJitter));
              const delay = Math.round(combinedProgress * spreadWindow);

              // Ventana de recorte del cuadro
              const tile = document.createElement('div');
              tile.style.position = 'absolute';
              tile.style.left = `${px}px`;
              tile.style.top = `${py}px`;
              tile.style.width = `${pixelSize}px`;
              tile.style.height = `${pixelSize}px`;
              tile.style.overflow = 'hidden';
              tile.style.boxSizing = 'border-box';
              tile.style.border = 'none';
              tile.style.boxShadow = 'none';
              tile.style.transformOrigin = `${pixelSize / 2}px ${pixelSize / 2}px`;
              tile.style.transform = `scale(${startScale})`;
              tile.style.opacity = '0';
              tile.style.pointerEvents = 'none';
              tile.style.willChange = 'transform, opacity';

              // Contenedor interno anclado al píxel exacto
              const contentWrapper = document.createElement('div');
              contentWrapper.style.position = 'absolute';
              contentWrapper.style.left = `${-px}px`;
              contentWrapper.style.top = `${-py}px`;
              contentWrapper.style.width = `${exactWidth}px`;
              contentWrapper.style.height = `${exactHeight}px`;
              contentWrapper.style.transformOrigin = `${cx}px ${cy}px`;
              contentWrapper.style.pointerEvents = 'none';
              contentWrapper.style.willChange = 'transform';

              const tileClone = incomingClone.cloneNode(true);
              contentWrapper.appendChild(tileClone);
              tile.appendChild(contentWrapper);
              fragment.appendChild(tile);

              const timing = {
                duration: pixelDuration,
                delay,
                easing: 'linear',
                fill: 'forwards'
              };

              const animTile = tile.animate(windowKeyframes, timing);
              const animContent = contentWrapper.animate(contentKeyframes, timing);

              activeAnimationsRef.current.push(animTile, animContent);
            }
          }

          tilesContainer.appendChild(fragment);

          // Sincronizar scrolls exactos 1-a-1 en todos los clones de cuadros una vez conectados al DOM
          for (let i = 0; i < tilesContainer.children.length; i++) {
            const currentTile = tilesContainer.children[i];
            const currentWrapper = currentTile?.firstElementChild;
            const currentClone = currentWrapper?.firstElementChild;
            if (currentClone) {
              syncScrollsBetweenTrees(rootElement, currentClone);
            }
          }

          // 8. Desvanecimiento suave al culminar la transición
          const fadeTimer = setTimeout(() => {
            if (container) {
              const fadeAnim = container.animate(
                [{ opacity: 1 }, { opacity: 0 }],
                { duration: 280, easing: 'ease-out', fill: 'forwards' }
              );
              activeAnimationsRef.current.push(fadeAnim);
            }
          }, totalDuration);

          activeTimersRef.current.push(fadeTimer);

          // 9. Limpieza final
          const finishTimer = setTimeout(() => {
            cleanUp();
          }, totalDuration + 300);

          activeTimersRef.current.push(finishTimer);
        };

        requestAnimationFrame(waitForIncomingTheme);

      } catch (err) {
        console.error('Error en PixelThemeTransition:', err);
        onSwitchTheme?.();
        cleanUp();
      }
    }
  }));


  return (
    <div
      ref={containerRef}
      id="pixel-theme-transition-root"
      style={{
        display: 'none',
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99980,
        overflow: 'hidden'
      }}
      aria-hidden="true"
    />
  );
});

PixelThemeTransition.displayName = 'PixelThemeTransition';

export default PixelThemeTransition;
