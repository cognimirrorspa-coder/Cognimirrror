'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCubeState } from '../contexts/CubeStateContext';

const COLORS = {
  U: 0xffffff, // Blanco Puro Brillante
  D: 0xffd000, // Amarillo Eléctrico
  F: 0x0066ff, // Azul Real Lindo
  B: 0x00e676, // Verde Esmeralda Lindo
  L: 0xff1744, // Rojo Carmesí Vivo
  R: 0xff6d00, // Naranja Brillante
  CORE: 0x111625
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
 * Cube3DViewer - Optimized 3D Rubik model with lighting, vivid colors and free mouse orbit.
 */
export default function Cube3DViewer({
  targetRotation, status, className,
  isLocked = false, size = 300, ignoreSensor = false,
  demoMoves = null, demoKey = 0, onDemoComplete = null,
  highlightFace = null, orbitCamera = false
}) {
  const containerRef = useRef(null);
  const threeRef = useRef(null);
  const { moveHistory } = useCubeState();
  const highlightFaceRef = useRef(highlightFace);
  const orbitCameraRef = useRef(orbitCamera);
  
  // Sincronización Refs
  const movesAppliedRef = useRef(0);
  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);
  const lastInteractionRef = useRef(Date.now());
  const isDraggingRef = useRef(false);
  const userInteractedRef = useRef(false); // Rastrea si el usuario movió manualmente la cámara
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // ═══ INIT THREE.JS ═══
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    const container = containerRef.current;
    const W = size, H = size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    // Cámara centrada en cara azul (Front) por defecto
    camera.position.set(3.5, 3.2, 8.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    container.appendChild(renderer.domElement);

    // Iluminación Profesional Multidireccional
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dl1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dl1.position.set(6, 12, 8);
    scene.add(dl1);

    const dl2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dl2.position.set(-6, -8, -6);
    scene.add(dl2);

    const cubeGroup = new THREE.Group();
    cubeGroup.rotation.order = 'YXZ';
    scene.add(cubeGroup);
    const allCubies = [];

    const geo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const mats = [
            new THREE.MeshPhongMaterial({ color: x === 1 ? COLORS.R : COLORS.CORE, shininess: 80, specular: 0x444444 }),
            new THREE.MeshPhongMaterial({ color: x === -1 ? COLORS.L : COLORS.CORE, shininess: 80, specular: 0x444444 }),
            new THREE.MeshPhongMaterial({ color: y === 1 ? COLORS.U : COLORS.CORE, shininess: 80, specular: 0x444444 }),
            new THREE.MeshPhongMaterial({ color: y === -1 ? COLORS.D : COLORS.CORE, shininess: 80, specular: 0x444444 }),
            new THREE.MeshPhongMaterial({ color: z === 1 ? COLORS.F : COLORS.CORE, shininess: 80, specular: 0x444444 }),
            new THREE.MeshPhongMaterial({ color: z === -1 ? COLORS.B : COLORS.CORE, shininess: 80, specular: 0x444444 }),
          ];
          // Guardar el hex base inmutable en userData para prevenir decoloración o desaparición de piezas
          mats.forEach(m => { 
            m.userData.baseHex = m.color.getHex(); 
          });

          const cubie = new THREE.Mesh(geo, mats);
          cubie.position.set(x, y, z);
          cubie.userData.initialPos = new THREE.Vector3(x, y, z);
          cubeGroup.add(cubie);
          allCubies.push(cubie);
        }
      }
    }

    // Interaction handlers
    if (!isLocked) {
      const onDown = (e) => {
        isDraggingRef.current = true;
        userInteractedRef.current = true;
        const pt = e.touches ? e.touches[0] : e;
        prevMouseRef.current = { x: pt.clientX, y: pt.clientY };
      };
      const onMove = (e) => {
        if (!isDraggingRef.current) return;
        const pt = e.touches ? e.touches[0] : e;
        const dx = (pt.clientX - prevMouseRef.current.x) * 0.006;
        const dy = (pt.clientY - prevMouseRef.current.y) * 0.005;
        prevMouseRef.current = { x: pt.clientX, y: pt.clientY };
        
        const sph = new THREE.Spherical().setFromVector3(camera.position);
        sph.theta -= dx;
        sph.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi - dy));
        camera.position.setFromSpherical(sph);
        camera.lookAt(0, 0, 0);
        lastInteractionRef.current = Date.now();
      };
      const onUp = () => { isDraggingRef.current = false; lastInteractionRef.current = Date.now(); };

      renderer.domElement.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      renderer.domElement.addEventListener('touchstart', onDown, { passive: true });
      renderer.domElement.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onUp);
    }
    // ═══ MOTOR DE ROTACIÓN ═══
    let isRotatingLocal = false;
    const rotateSingleFace = async (baseFace, angle90, steps) => {
      while (isRotatingLocal) {
        await new Promise(r => setTimeout(r, 8));
      }
      isRotatingLocal = true;
      try {
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
            await new Promise(requestAnimationFrame);
          }
          pivot.rotation[cfg.axis] = angle90;
          pivot.updateMatrixWorld(true);
        }

        // SNAP ORTOGONAL BASADO EN MATRIZ — Previene gimbal lock, deformación y piezas negras
        active.forEach(c => {
          cubeGroup.attach(c); // hereda transform mundial
          
          // 1. Snap posición a enteros exactos (-1, 0, 1)
          c.position.set(
            Math.round(c.position.x),
            Math.round(c.position.y),
            Math.round(c.position.z)
          );

          // 2. Snap ejes de rotación a la dirección ortogonal global más cercana
          c.updateMatrixWorld(true);
          const m = c.matrix;
          const xAxis = new THREE.Vector3();
          const yAxis = new THREE.Vector3();
          const zAxis = new THREE.Vector3();
          m.extractBasis(xAxis, yAxis, zAxis);

          const snapVector = (v) => {
            let maxComp = 'x';
            if (Math.abs(v.y) > Math.abs(v[maxComp])) maxComp = 'y';
            if (Math.abs(v.z) > Math.abs(v[maxComp])) maxComp = 'z';
            const val = Math.sign(v[maxComp]) || 1;
            v.set(0, 0, 0);
            v[maxComp] = val;
          };

          snapVector(xAxis);
          snapVector(yAxis);
          snapVector(zAxis);

          const snappedMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
          c.quaternion.setFromRotationMatrix(snappedMatrix);
          c.rotation.setFromQuaternion(c.quaternion);
          c.updateMatrixWorld(true);
        });
        cubeGroup.remove(pivot);
      } finally {
        isRotatingLocal = false;
      }
    };

    const rotateFace = async (notation, steps = 8) => {
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

    const resetSolvedState = () => {
      queueRef.current = [];
      movesAppliedRef.current = 0;
      isProcessingRef.current = false;

      allCubies.forEach(cubie => {
        if (cubie.userData.initialPos) {
          cubie.position.copy(cubie.userData.initialPos);
        }
        cubie.quaternion.set(0, 0, 0, 1);
        cubie.rotation.set(0, 0, 0);
        cubie.updateMatrix();
        cubie.updateMatrixWorld(true);
      });

      cubeGroup.position.set(0, 0, 0);
      cubeGroup.rotation.set(0, 0, 0);
      cubeGroup.updateMatrixWorld(true);

      camera.position.set(0, 2.0, 9.1);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    threeRef.current = { cubeGroup, rotateFace, allCubies, resetSolvedState };

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
        // Balanceo muy sutil: solo ±6° en Y, sin movimiento en X.
        // La cara azul queda siempre de frente al usuario.
        const t = Date.now() * 0.0005;
        cubeGroup.rotation.y = Math.sin(t) * 0.10;  // ±~6°
        cubeGroup.rotation.x = 0;                    // Sin inclinación
        renderer.render(scene, camera);
        return;
      }

      const now = Date.now();
      const isIdle = (now - lastInteractionRef.current > 3000) && !isDraggingRef.current;
      
      if (!isDraggingRef.current) {
        const activeFaceKey = highlightFaceRef.current;

        if (orbitCameraRef.current && activeFaceKey && !userInteractedRef.current) {
          let targetCamX = 0, targetCamY = 2.0, targetCamZ = 9.1;

          if      (activeFaceKey === 'R') { targetCamX =  1.6; targetCamY = 2.0; targetCamZ = 8.8; }
          else if (activeFaceKey === 'L') { targetCamX = -1.6; targetCamY = 2.0; targetCamZ = 8.8; }
          else if (activeFaceKey === 'U') { targetCamX =  0.0; targetCamY = 3.4; targetCamZ = 8.6; }
          else if (activeFaceKey === 'D') { targetCamX =  0.0; targetCamY = 0.6; targetCamZ = 8.8; }
          else if (activeFaceKey === 'F') { targetCamX =  0.0; targetCamY = 2.0; targetCamZ = 9.1; }

          camera.position.x += (targetCamX - camera.position.x) * 0.04;
          camera.position.y += (targetCamY - camera.position.y) * 0.04;
          camera.position.z += (targetCamZ - camera.position.z) * 0.04;
          camera.lookAt(0, 0, 0);

          cubeGroup.rotation.y += (0 - cubeGroup.rotation.y) * 0.04;
          cubeGroup.rotation.x += (0 - cubeGroup.rotation.x) * 0.04;
        } else if (!userInteractedRef.current) {
          // Solo restaurar vista si el usuario no ha arrastrado con el mouse
          camera.position.x += (3.5 - camera.position.x) * 0.04;
          camera.position.y += (3.2 - camera.position.y) * 0.04;
          camera.position.z += (8.2 - camera.position.z) * 0.04;
          camera.lookAt(0, 0, 0);
        }
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

  // ═══ QUEUE WORKER & RESET WATCHER ═══
  useEffect(() => {
    if (isLocked || ignoreSensor) return;
    const three = threeRef.current;
    if (!three) return;

    if (moveHistory.length === 0) {
      if (movesAppliedRef.current > 0 || queueRef.current.length > 0) {
        three.resetSolvedState();
      }
      return;
    }

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
  useEffect(() => { highlightFaceRef.current = highlightFace; }, [highlightFace]);
  useEffect(() => { orbitCameraRef.current = orbitCamera; }, [orbitCamera]);
  useEffect(() => {
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
               // Sticker de la cara activa: Brillo emissive destacado
               mat.color.setHex(baseHex);
               mat.emissive.setHex(baseHex);
               mat.emissiveIntensity = 0.8;
             } else {
               if (status === 'simon_playback') {
                 const dimColor = new THREE.Color(baseHex).multiplyScalar(0.4);
                 mat.color.copy(dimColor);
                 mat.emissive.setHex(0x000000);
               } else {
                 mat.color.setHex(baseHex);
                 mat.emissive.setHex(0x000000);
               }
             }
          } else {
             mat.color.setHex(baseHex);
             mat.emissive.setHex(0x000000);
          }
          mat.opacity = 1.0;
          mat.transparent = false;
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
      
      // Breve pausa para brillo inicial
      await new Promise(r => setTimeout(r, 60));

      for (const m of demoMoves) {
        // Giro de demostración rápido y fluido (8 pasos)
        await three.rotateFace(m, 8);
        
        // Mantener cara visible brevemente
        await new Promise(r => setTimeout(r, 200));

        // Devolver a posición original limpiamente
        const reverseMove = m.endsWith("'") ? m.slice(0, -1) : m + "'";
        await three.rotateFace(reverseMove, 8);

        await new Promise(r => setTimeout(r, 60));
      }

      isDemoRunningRef.current = false;
      if (onDemoComplete) onDemoComplete();
    };
    runDemo();
  }, [demoKey]);

  return <div ref={containerRef} className={className || ''} style={{ width: size, height: size, margin: '0 auto' }} />;
}
