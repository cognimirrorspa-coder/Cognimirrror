'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCubeState } from '../contexts/CubeStateContext';

const COLORS = {
  U: 0xffffff, D: 0xffd500, F: 0x0051ba,
  B: 0x009e60, L: 0xc41e3a, R: 0xff5800, CORE: 0x111111
};

// Tabla de configuración de movimientos - eje, selección de capa, ángulo base 90°
// angle es SIEMPRE ±Math.PI/2 (90°). Los giros dobles se ejecutan como dos giros de 90°.
const MOVES_CONFIG = {
  'U':  { axis: 'y', val:  1, angle: -Math.PI / 2 },
  'D':  { axis: 'y', val: -1, angle:  Math.PI / 2 },
  'R':  { axis: 'x', val:  1, angle: -Math.PI / 2 },
  'L':  { axis: 'x', val: -1, angle:  Math.PI / 2 },
  'F':  { axis: 'z', val:  1, angle: -Math.PI / 2 },
  'B':  { axis: 'z', val: -1, angle:  Math.PI / 2 },
};

// Posiciones de cámara a distancia constante (R = 9.5) para evitar cualquier efecto de zoom molesto o agrandamiento
const TARGET_CAMERA_POSITIONS = {
  U: new THREE.Vector3(2.5, 8.0, 4.4),   // Blanco / Up (Vista superior constante)
  D: new THREE.Vector3(2.5, -8.0, 4.4),  // Amarillo / Down (Vista inferior constante)
  R: new THREE.Vector3(7.8, 2.5, 5.0),   // Naranja / Right (Vista derecha constante)
  L: new THREE.Vector3(-7.8, 2.5, 5.0),  // Rojo / Left (Vista izquierda constante)
  F: new THREE.Vector3(0.0, 2.5, 9.1),   // Azul / Front (Vista frontal constante)
  B: new THREE.Vector3(0.0, 2.5, -9.1),  // Verde / Back (Vista trasera 180° constante)
  DEFAULT: new THREE.Vector3(4.2, 4.2, 7.3)
};

// M = L + R' (capa central en el eje X)
// Descomponemos M en dos caras: L (horario) y R' (antihorario)
const COMPOUND_MOVES = {
  'M':  ['L', "R'"],
  "M'": ["L'", 'R'],
  'E':  ['D', "U'"],
  "E'": ["D'", 'U'],
  'S':  ['F', "B'"],
  "S'": ["F'", 'B'],
};

/**
 * Cube3DViewer - Optimized with sequential move queue and memory management.
 */
export default function Cube3DViewer({
  targetRotation, status, className,
  isLocked = false, size = 300, ignoreSensor = false,
  demoMoves = null, demoKey = 0, onDemoComplete = null,
  highlightFace = null
}) {
  const containerRef = useRef(null);
  const threeRef = useRef(null);
  const { moveHistory } = useCubeState();
  const highlightFaceRef = useRef(highlightFace);
  
  // Sincronización Refs
  const movesAppliedRef = useRef(0);
  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);
  const lastInteractionRef = useRef(Date.now());
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // ═══ INIT THREE.JS ═══
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    const container = containerRef.current;
    const W = size, H = size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(4, 4, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(5, 10, 7);
    scene.add(dl);

    const cubeGroup = new THREE.Group();
    cubeGroup.rotation.order = 'YXZ';
    scene.add(cubeGroup);
    const allCubies = [];

    const geo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const mats = [
            new THREE.MeshPhongMaterial({ color: x === 1 ? COLORS.R : COLORS.CORE, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: x === -1 ? COLORS.L : COLORS.CORE, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: y === 1 ? COLORS.U : COLORS.CORE, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: y === -1 ? COLORS.D : COLORS.CORE, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: z === 1 ? COLORS.F : COLORS.CORE, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: z === -1 ? COLORS.B : COLORS.CORE, shininess: 50 }),
          ];
          // Guardar el hex base inmutable en userData para prevenir decoloración o desaparición de piezas
          mats.forEach(m => { 
            m.userData.baseHex = m.color.getHex(); 
          });

          const cubie = new THREE.Mesh(geo, mats);
          cubie.position.set(x, y, z);
          cubeGroup.add(cubie);
          allCubies.push(cubie);
        }
      }
    }

    // Interaction handlers
    if (!isLocked) {
      const onDown = (e) => {
        isDraggingRef.current = true;
        const pt = e.touches ? e.touches[0] : e;
        prevMouseRef.current = { x: pt.clientX, y: pt.clientY };
      };
      const onMove = (e) => {
        if (!isDraggingRef.current) return;
        const pt = e.touches ? e.touches[0] : e;
        const dx = (pt.clientX - prevMouseRef.current.x) * 0.01;
        const dy = (pt.clientY - prevMouseRef.current.y) * 0.01;
        prevMouseRef.current = { x: pt.clientX, y: pt.clientY };
        
        const sph = new THREE.Spherical().setFromVector3(camera.position);
        sph.theta -= dx;
        sph.phi = Math.max(0.2, Math.min(Math.PI - 0.2, sph.phi - dy));
        camera.position.setFromSpherical(sph);
        camera.lookAt(0, 0, 0);
        lastInteractionRef.current = Date.now();
      };
      const onUp = () => { isDraggingRef.current = false; lastInteractionRef.current = Date.now(); };

      renderer.domElement.addEventListener('mousedown', onDown);
      renderer.domElement.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      renderer.domElement.addEventListener('touchstart', onDown, { passive: true });
      renderer.domElement.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onUp);
    }

    // ═══ MOTOR DE ROTACIÓN (Corregido con snap por quaterniones) ═══
    // Recibe notación estándar: 'U', "U'", 'R2', 'L', etc.
    // Los giros dobles (X2) se ejecutan como DOS giros de 90° encadenados.
    const rotateSingleFace = async (baseFace, angle90, steps) => {
      const cfg = MOVES_CONFIG[baseFace];
      if (!cfg) return;

      const active = allCubies.filter(c => Math.abs(c.position[cfg.axis] - cfg.val) < 0.4);
      const pivot = new THREE.Object3D();
      cubeGroup.add(pivot);
      // Reparentar cubies al pivot
      active.forEach(c => pivot.attach(c));

      if (steps <= 0) {
        // Modo instantáneo (catch-up)
        pivot.rotation[cfg.axis] = angle90;
        pivot.updateMatrixWorld(true);
      } else {
        const dA = angle90 / steps;
        for (let i = 0; i < steps; i++) {
          pivot.rotation[cfg.axis] += dA;
          renderer.render(scene, camera);
          await new Promise(requestAnimationFrame);
        }
        pivot.rotation[cfg.axis] = angle90;
        pivot.updateMatrixWorld(true);
        renderer.render(scene, camera);
      }

      // SNAP con quaterniones — numéricamente estable
      active.forEach(c => {
        cubeGroup.attach(c); // hereda transform mundial
        // Snap posición a enteros
        c.position.set(
          Math.round(c.position.x),
          Math.round(c.position.y),
          Math.round(c.position.z)
        );
        // Snap cuaternión al múltiplo más cercano de 90°
        const hp = Math.PI / 2;
        const e = c.rotation;
        c.rotation.set(
          Math.round(e.x / hp) * hp,
          Math.round(e.y / hp) * hp,
          Math.round(e.z / hp) * hp
        );
        c.updateMatrixWorld(true);
      });
      cubeGroup.remove(pivot);
    };

    const rotateFace = async (notation, steps = 18) => {
      // Resolver movimientos compuestos (M, E, S)
      if (COMPOUND_MOVES[notation]) {
        for (const sub of COMPOUND_MOVES[notation]) {
          await rotateFace(sub, steps);
        }
        return;
      }

      const isDouble = notation.includes('2');
      const isPrime  = notation.includes("'") || notation.includes('-');
      const baseFace = notation.charAt(0);
      const cfg = MOVES_CONFIG[baseFace];
      if (!cfg) return;

      // Ángulo de 90° con signo correcto
      const angle90 = isPrime ? -cfg.angle : cfg.angle;

      if (isDouble) {
        // Giro doble = dos giros de 90° en la misma dirección
        await rotateSingleFace(baseFace, angle90, steps);
        await rotateSingleFace(baseFace, angle90, steps);
      } else {
        await rotateSingleFace(baseFace, angle90, steps);
      }
    };

    threeRef.current = { cubeGroup, rotateFace, allCubies };

    // ═══ ANIMATION LOOP ═══
    let afId;
    const loop = () => {
      afId = requestAnimationFrame(loop);
      
      if (status === 'eval_celebration') {
        const t = Date.now() * 0.002;
        cubeGroup.rotation.y += 0.05;
        cubeGroup.rotation.x = Math.sin(t) * 0.3;
        renderer.render(scene, camera);
        return;
      }

      if (isLocked) {
        // Balanceo suave alrededor de la orientación estándar (±15° en Y, ±5° en X).
        // El cubo nunca gira más de 15°, así cada cara siempre queda en su lado correcto.
        const t = Date.now() * 0.0008;
        cubeGroup.rotation.y = Math.sin(t) * 0.26;          // ±15°
        cubeGroup.rotation.x = Math.sin(t * 0.6 + 1) * 0.09; // ±5°
        renderer.render(scene, camera);
        return;
      }

      const now = Date.now();
      const isIdle = (now - lastInteractionRef.current > 3000) && !isDraggingRef.current;
      
      if (!isDraggingRef.current) {
        const activeFaceKey = highlightFaceRef.current;
        let targetY = 0;
        let targetX = 0;

        if (activeFaceKey === 'B') {
          targetY = Math.PI; // Giro suave de 180° en Y para ver la cara Verde de atrás
        } else if (activeFaceKey === 'L') {
          targetY = Math.PI / 3.2; // Giro suave de +56° para enfocar la cara Roja (L)
        } else if (activeFaceKey === 'R') {
          targetY = -Math.PI / 3.2; // Giro suave de -56° para enfocar la cara Naranja (R)
        } else if (activeFaceKey === 'U') {
          targetX = Math.PI / 3.5; // Inclinación suave hacia abajo para enfocar la cara Blanca (U) arriba
        } else if (activeFaceKey === 'D') {
          targetX = -Math.PI / 3.5; // Inclinación suave hacia arriba para enfocar la cara Amarilla (D) abajo
        } else if (activeFaceKey === 'F') {
          targetY = 0;
          targetX = 0;
        }

        // Suavizado fluido de la rotación del grupo del cubo en 3D (lerp 0.038)
        cubeGroup.rotation.y += (targetY - cubeGroup.rotation.y) * 0.038;
        cubeGroup.rotation.x += (targetX - cubeGroup.rotation.x) * 0.038;

        // Cámara 100% fija en perspectiva isométrica constante (SIN ZOOM NI TELETRANSPORTE)
        camera.position.set(4.5, 4.0, 7.5);
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
    };
    afId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(afId);
      // Proper disposal
      allCubies.forEach(c => {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      });
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [isLocked, size, status]);

  // ═══ QUEUE WORKER ═══
  useEffect(() => {
    if (isLocked || ignoreSensor) return;
    const three = threeRef.current;
    if (!three) return;

    const processQueue = async () => {
      if (isProcessingRef.current || queueRef.current.length === 0) return;
      isProcessingRef.current = true;

      while (queueRef.current.length > 0) {
        const move = queueRef.current.shift();
        // Catch-up logic: if many moves pending, skip animation
        const steps = queueRef.current.length > 2 ? 0 : 6;
        await three.rotateFace(move, steps);
      }

      isProcessingRef.current = false;
    };

    const total = moveHistory.length;
    const applied = movesAppliedRef.current;
    if (total > applied) {
      const missing = moveHistory.slice(applied);
      queueRef.current.push(...missing);
      movesAppliedRef.current = total;
      processQueue();
    }
  }, [moveHistory, isLocked, ignoreSensor]);

  // ═══ HIGHLIGHT FACE (SIMON SAYS - SÓLIDO E INMUTABLE SIN PERDIDA DE PIEZAS NI TRANSPARENCIA) ═══
  useEffect(() => {
    highlightFaceRef.current = highlightFace;
    if (!threeRef.current) return;
    const { allCubies } = threeRef.current;
    if (!allCubies) return;

    const FACE_HEX_MAP = {
      'U': COLORS.U,
      'D': COLORS.D,
      'R': COLORS.R,
      'L': COLORS.L,
      'F': COLORS.F,
      'B': COLORS.B
    };

    allCubies.forEach(cubie => {
      if (Array.isArray(cubie.material)) {
        cubie.material.forEach((mat) => {
          const baseHex = mat.userData.baseHex !== undefined ? mat.userData.baseHex : mat.color.getHex();
          if (baseHex === COLORS.CORE) return;

          if (highlightFace) {
             const targetHex = FACE_HEX_MAP[highlightFace];
             if (baseHex === targetHex) {
               // Sticker de la cara activa: Brillo de neón emissive intenso
               mat.color.setHex(baseHex);
               mat.emissive.setHex(baseHex);
               mat.emissiveIntensity = 1.8;
               mat.opacity = 1.0;
               mat.transparent = false;
             } else {
               // Stickers inactivos: Atenuados limpiamente al 28% sin corrupción ni desaparición
               const dimColor = new THREE.Color(baseHex).multiplyScalar(0.28);
               mat.color.copy(dimColor);
               mat.emissive.setHex(0x000000);
               mat.opacity = 1.0;
               mat.transparent = false;
             }
          } else {
             // Reset perfecto al estado sólido original
             mat.color.setHex(baseHex);
             mat.emissive.setHex(0x000000);
             mat.opacity = 1.0;
             mat.transparent = false;
          }
          mat.needsUpdate = true;
        });
      }
    });
  }, [highlightFace]);

  // ═══ DEMO SEQUENCES ═══
  const isDemoRunningRef = useRef(false);
  useEffect(() => {
    if (!demoMoves || demoMoves.length === 0 || demoKey === 0) return;
    const three = threeRef.current;
    if (!three) return;

    const runDemo = async () => {
      if (isDemoRunningRef.current) return;
      isDemoRunningRef.current = true;
      for (const m of demoMoves) {
        await three.rotateFace(m, 12);
        // Pequeña pausa entre movimientos de la demo
        await new Promise(r => setTimeout(r, 150));
      }
      isDemoRunningRef.current = false;
      if (onDemoComplete) onDemoComplete();
    };
    runDemo();
  }, [demoKey]);

  return <div ref={containerRef} className={className || ''} style={{ width: size, height: size, margin: '0 auto' }} />;
}
