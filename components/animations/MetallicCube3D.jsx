'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * MetallicCube3D
 * 
 * Cubo de Rubik 3D metálico cromado / plateado hiperrealista:
 * - Acabado 100% plateado metálico pulido (metalness: 0.96, roughness: 0.12).
 * - RoomEnvironment + PMREMGenerator para reflejos de entorno de estudio fotográfico.
 * - Resplandores especulares cian (#00f2fe) y magenta (#ec4899) tipo cyber-clínico.
 * - Rotación 3D orbital continua (tumbling fluido en X, Y, Z).
 * - Giros aleatorios continuos e independientes de capas exteriores (U, D, L, R, F, B).
 */
export default function MetallicCube3D({ size = 82, className = '' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof window === 'undefined') return;

    // 1. Escena y Cámara con perspectiva óptima
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(2.9, 2.3, 3.7);
    camera.lookAt(0, 0, 0);

    // 2. Renderizador WebGL con Tone Mapping de alta gama
    let renderer;
    let pmremGenerator;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      container.appendChild(renderer.domElement);

      try {
        // Entorno de reflejos HDRI procedural para brillo metálico real
        pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const roomEnv = new RoomEnvironment();
        scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
      } catch (envErr) {
        console.warn('RoomEnvironment fallback a iluminación directa:', envErr);
      }
    } catch (e) {
      console.warn('WebGL no soportado para MetallicCube3D:', e);
      return;
    }

    // 3. Iluminación tipo estudio fotográfico (Gleam metálico)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Luces de acento de color para reflejos especulares cyber-clínicos
    const cyanLight = new THREE.PointLight(0x00f2fe, 4.0, 10);
    cyanLight.position.set(-4, 3, 3);
    scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xec4899, 3.5, 10);
    magentaLight.position.set(3, -3, 3.5);
    scene.add(magentaLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    rimLight.position.set(-2, -4, -4);
    scene.add(rimLight);

    // 4. Materiales Metálicos Plateados Pulidos
    // Placas de las caras: Plata cromada ultra reflectiva
    const plateMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2f6fa, // Plateado brillante
      metalness: 0.96,
      roughness: 0.12,
      envMapIntensity: 1.5
    });

    // Marco interno / núcleo: Titanio oscuro pulido para ranuras de ingeniería
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x181e28, // Titanio oscuro grafito
      metalness: 0.88,
      roughness: 0.35,
      envMapIntensity: 0.8
    });

    // 5. Creación del Cubo 3x3x3
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const cubies = [];
    const cubieSize = 0.58;
    const spacing = 0.63;
    const plateSize = 0.52;
    const plateDepth = 0.02;

    const boxGeo = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
    const plateGeo = new THREE.BoxGeometry(plateSize, plateSize, plateDepth);

    // Crear cada uno de los 26 cubitos con placas metálicas en todas las caras
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue; // Omitir núcleo ciego

          const cubie = new THREE.Group();
          cubie.position.set(x * spacing, y * spacing, z * spacing);

          // Cuerpo base de titanio
          const frameMesh = new THREE.Mesh(boxGeo, frameMaterial);
          cubie.add(frameMesh);

          // Placas metálicas plateadas en las 6 caras
          const offset = cubieSize / 2 + plateDepth / 2 - 0.002;

          // +Z Front
          const pZ = new THREE.Mesh(plateGeo, plateMaterial);
          pZ.position.set(0, 0, offset);
          cubie.add(pZ);

          // -Z Back
          const mZ = new THREE.Mesh(plateGeo, plateMaterial);
          mZ.position.set(0, 0, -offset);
          cubie.add(mZ);

          // +X Right
          const pX = new THREE.Mesh(plateGeo, plateMaterial);
          pX.rotation.y = Math.PI / 2;
          pX.position.set(offset, 0, 0);
          cubie.add(pX);

          // -X Left
          const mX = new THREE.Mesh(plateGeo, plateMaterial);
          mX.rotation.y = -Math.PI / 2;
          mX.position.set(-offset, 0, 0);
          cubie.add(mX);

          // +Y Top
          const pY = new THREE.Mesh(plateGeo, plateMaterial);
          pY.rotation.x = -Math.PI / 2;
          pY.position.set(0, offset, 0);
          cubie.add(pY);

          // -Y Bottom
          const mY = new THREE.Mesh(plateGeo, plateMaterial);
          mY.rotation.x = Math.PI / 2;
          mY.position.set(0, -offset, 0);
          cubie.add(mY);

          mainGroup.add(cubie);
          cubies.push(cubie);
        }
      }
    }

    // 6. Pivot para giros de capas exteriores
    const pivot = new THREE.Group();
    mainGroup.add(pivot);

    let isTurning = false;
    let turnProgress = 0;
    const turnDuration = 22; // Duración ágil del giro (en frames ~350ms)
    let currentAxis = 'y';
    let currentSlice = 1;
    let turnAngleTarget = Math.PI / 2;
    let activeSliceCubies = [];
    let nextTurnCooldown = 25; // Cooldown inicial breve

    const axes = ['x', 'y', 'z'];
    const slices = [-1, 1]; // Capas exteriores

    function startRandomFaceTurn() {
      if (isTurning) return;

      currentAxis = axes[Math.floor(Math.random() * axes.length)];
      currentSlice = slices[Math.floor(Math.random() * slices.length)];
      turnAngleTarget = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 2);

      // Encontrar los 9 cubitos de la capa seleccionada en el espacio local de mainGroup
      activeSliceCubies = [];
      const threshold = 0.25;

      cubies.forEach((cubie) => {
        const val = cubie.position[currentAxis] / spacing;
        if (Math.abs(val - currentSlice) < threshold) {
          activeSliceCubies.push(cubie);
        }
      });

      if (activeSliceCubies.length !== 9) return;

      // Anclar los cubitos al pivot preservando transformaciones
      pivot.rotation.set(0, 0, 0);
      pivot.position.set(0, 0, 0);
      pivot.updateMatrixWorld(true);

      activeSliceCubies.forEach((cubie) => {
        pivot.attach(cubie);
      });

      isTurning = true;
      turnProgress = 0;
    }

    // 7. Loop de Renderizado con Rotación Orbital Continua & Giros Aleatorios
    let animId = null;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Tumbling 3D continuo fluido en los tres ejes
      mainGroup.rotation.x += 0.0075;
      mainGroup.rotation.y += 0.0125;
      mainGroup.rotation.z += 0.0055;

      // Animación de giro de capa
      if (isTurning) {
        turnProgress++;
        const p = Math.min(1, turnProgress / turnDuration);
        // Curva suave easeInOutCubic para naturalidad mecánica
        const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        pivot.rotation[currentAxis] = eased * turnAngleTarget;

        if (turnProgress >= turnDuration) {
          // Finalizar giro: Reubicar cubitos en mainGroup con coordenadas normalizadas
          pivot.rotation[currentAxis] = turnAngleTarget;
          pivot.updateMatrixWorld(true);

          activeSliceCubies.forEach((cubie) => {
            mainGroup.attach(cubie);
            // Redondear a coordenadas exactas del grid para eliminar derivas numéricas
            cubie.position.x = Math.round(cubie.position.x / spacing) * spacing;
            cubie.position.y = Math.round(cubie.position.y / spacing) * spacing;
            cubie.position.z = Math.round(cubie.position.z / spacing) * spacing;
          });

          pivot.rotation.set(0, 0, 0);
          pivot.updateMatrixWorld(true);
          isTurning = false;
          nextTurnCooldown = Math.floor(35 + Math.random() * 40); // Pausa de ~0.6 a 1.2s entre giros
        }
      } else {
        nextTurnCooldown--;
        if (nextTurnCooldown <= 0) {
          startRandomFaceTurn();
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Limpieza rigurosa al desmontar
    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (renderer) {
        if (renderer.domElement?.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
      if (pmremGenerator) {
        pmremGenerator.dispose();
      }
      boxGeo.dispose();
      plateGeo.dispose();
      plateMaterial.dispose();
      frameMaterial.dispose();
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      className={`relative flex items-center justify-center overflow-visible select-none pointer-events-none drop-shadow-[0_0_20px_rgba(0,242,254,0.4)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
