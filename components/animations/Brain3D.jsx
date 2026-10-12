'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

export const Brain3D = ({ activeModules: externalActiveModules, onToggleModule }) => {
  const containerRef = useRef(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Estados de filtro multiselect + hover
  const [internalActiveModules, setInternalActiveModules] = useState({ reaction: true, memory: true });
  const activeModules = externalActiveModules !== undefined ? externalActiveModules : internalActiveModules;
  const [hoveredModule, setHoveredModule] = useState(null);

  // Ref para acceder al estado actual dentro del loop central de GSAP (60/120fps)
  const filterStateRef = useRef({ activeModules, hoveredModule });

  useEffect(() => {
    filterStateRef.current = { activeModules, hoveredModule };
  }, [activeModules, hoveredModule]);

  const toggleModule = (moduleKey) => {
    if (onToggleModule) {
      onToggleModule(moduleKey);
    } else {
      setInternalActiveModules((prev) => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
    }
  };

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (isMobile) return;

      // 1. Configuración de Escena y Renderizador WebGL Optimizado
      const scene = new THREE.Scene();
      const width = container.clientWidth;
      const height = container.clientHeight;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimizado para 60/120fps sostenidos

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);

      // 2. Iluminación Ambiental y Focal
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0x38bdf8, 2.5);
      pointLight1.position.set(3, 3, 4);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xa855f7, 2.5);
      pointLight2.position.set(-3, -2, 4);
      scene.add(pointLight2);

      let brainMesh = null;

      // 3. Controles de Orbitación Suaves
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.2;

      // 4. Textura de Glow optimizada (Canvas reutilizable)
      const createGlowTexture = (r, g, b) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; // Tamaño optimizado de buffer de textura
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
          gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.9)`);
          gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 64, 64);
        }
        return new THREE.CanvasTexture(canvas);
      };

      const cyanGlowTexture = createGlowTexture(56, 189, 248);   // #38bdf8 (Reacción)
      const purpleGlowTexture = createGlowTexture(168, 85, 247); // #a855f7 (Memory)
      const coreGlowTexture = createGlowTexture(255, 255, 255);  // #ffffff (Núcleo central)

      // Referencias acumuladoras
      const dynamicRefs = {
        reactionPointsMats: [],
        memoryPointsMats: [],
        basePointsMats: [],
        reactionLineMats: [],
        memoryLineMats: [],
        reactionSpritesGroup: new THREE.Group(),
        memorySpritesGroup: new THREE.Group(),
        spritesData: [],
        coreSprite: null,
        coreInitialScale: 1,
        opacities: { reaction: 1.0, memory: 1.0 },
        particleSystems: [],
        gatherConfig: {
          isGathering: true,
          startTime: null,
          duration: 1.8, // 1.8s de expansión fluida desde el núcleo
          stagger: 0.5,  // 0.5s de desfase radial
          lineFade: 0.0,
        },
      };

      // 5. Carga de Modelo 3D OBJ del Cerebro
      const loader = new OBJLoader();
      loader.load(
        '/models/brain.obj',
        (obj) => {
          const pointsGroup = new THREE.Group();

          // 1. Calcular la caja envolvente GLOBAL del modelo consolidado
          const globalBox = new THREE.Box3().setFromObject(obj);
          const center = globalBox.getCenter(new THREE.Vector3());
          const size = globalBox.getSize(new THREE.Vector3());
          const finalMaxDim = Math.max(size.x, size.y, size.z);
          const targetSize = 3.2; // Tamaño objetivo original de la escena por defecto
          const scale = targetSize / finalMaxDim; // Escala matemática original exacta por defecto

          // Núcleo central compacto: las partículas inician concentradas aquí
          const coreRadius = finalMaxDim * 0.035;

          // Helper para inicializar la expansión radial desde el núcleo hacia el exterior
          const setupParticleGathering = (geometry, vertsArray) => {
            const count = vertsArray.length / 3;
            const targetPositions = new Float32Array(vertsArray);
            const startPositions = new Float32Array(vertsArray.length);
            const delays = new Float32Array(count);

            for (let i = 0; i < count; i++) {
              const i3 = i * 3;
              const tx = targetPositions[i3];
              const ty = targetPositions[i3 + 1];
              const tz = targetPositions[i3 + 2];

              // Posición inicial dentro del núcleo esférico central
              const u = Math.random();
              const v = Math.random();
              const theta = u * 2.0 * Math.PI;
              const phi = Math.acos(2.0 * v - 1.0);
              const r = Math.cbrt(Math.random()) * coreRadius;
              const sinPhi = Math.sin(phi);

              startPositions[i3] = center.x + r * sinPhi * Math.cos(theta);
              startPositions[i3 + 1] = center.y + r * sinPhi * Math.sin(theta);
              startPositions[i3 + 2] = center.z + r * Math.cos(phi);

              // Desfase progresivo desde el núcleo interior hacia la periferia externa
              const dx = tx - center.x;
              const dy = ty - center.y;
              const dz = tz - center.z;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              const normDist = Math.min(dist / (finalMaxDim * 0.5), 1.0);
              delays[i] = normDist * 0.35 + Math.random() * 0.15;
            }

            // Asignar posición inicial concentrada en el núcleo
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(startPositions, 3));

            dynamicRefs.particleSystems.push({
              geometry,
              targetPositions,
              startPositions,
              delays,
              count,
            });
          };

          // Sprite luminoso del Núcleo Central
          const coreSpriteMat = new THREE.SpriteMaterial({
            map: coreGlowTexture,
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 1.0,
          });
          const coreSprite = new THREE.Sprite(coreSpriteMat);
          coreSprite.position.copy(center);
          coreSprite.scale.setScalar(finalMaxDim * 0.12);
          pointsGroup.add(coreSprite);
          dynamicRefs.coreSprite = coreSprite;
          dynamicRefs.coreInitialScale = finalMaxDim * 0.12;

          obj.traverse((child) => {
            if (child.isMesh) {
              child.geometry.computeBoundingBox();
              const box = child.geometry.boundingBox;
              if (!box) return;

              const min = box.min;
              const max = box.max;
              const maxDim = Math.max(max.x - min.x, max.y - min.y, max.z - min.z);

              const positions = child.geometry.attributes.position.array;
              const count = positions.length / 3;

              const allVerts = Array.from(positions);
              const reactionVerts = [];
              const memoryVerts = [];

              const reactionPosList = [];
              const memoryPosList = [];

              for (let i = 0; i < count; i++) {
                const idx = i * 3;
                const x = positions[idx];
                const y = positions[idx + 1];
                const z = positions[idx + 2];

                // Normalización anatómica por defecto
                const nz = (z - min.z) / (max.z - min.z);
                const ny = (y - min.y) / (max.y - min.y);

                if (nz > 0.48) {
                  reactionVerts.push(x, y, z);
                  if (Math.random() < 0.12) reactionPosList.push(new THREE.Vector3(x, y, z));
                } else if (ny > 0.25) {
                  memoryVerts.push(x, y, z);
                  if (Math.random() < 0.12) memoryPosList.push(new THREE.Vector3(x, y, z));
                }
              }

              // Estructura base completa (#64748b) con convergencia armónica
              const baseGeo = new THREE.BufferGeometry();
              setupParticleGathering(baseGeo, allVerts);
              const baseMat = new THREE.PointsMaterial({
                color: 0x64748b,
                size: 0.013,
                transparent: true,
                opacity: 0.35,
                sizeAttenuation: true,
                blending: THREE.AdditiveBlending,
              });
              dynamicRefs.basePointsMats.push(baseMat);
              pointsGroup.add(new THREE.Points(baseGeo, baseMat));

              // Capas cromáticas superpuestas con convergencia armónica
              const createPointsObj = (vertsArray, colorHex, initialOpacity, size = 0.017) => {
                const geo = new THREE.BufferGeometry();
                setupParticleGathering(geo, vertsArray);
                const mat = new THREE.PointsMaterial({
                  color: colorHex,
                  size,
                  transparent: true,
                  opacity: initialOpacity,
                  sizeAttenuation: true,
                  blending: THREE.AdditiveBlending,
                });
                return { pointsObj: new THREE.Points(geo, mat), mat };
              };

              if (reactionVerts.length > 0) {
                const rData = createPointsObj(reactionVerts, 0x38bdf8, 0.75);
                dynamicRefs.reactionPointsMats.push(rData.mat);
                pointsGroup.add(rData.pointsObj);
              }

              if (memoryVerts.length > 0) {
                const mData = createPointsObj(memoryVerts, 0xa855f7, 0.75);
                dynamicRefs.memoryPointsMats.push(mData.mat);
                pointsGroup.add(mData.pointsObj);
              }

              // Materiales únicos de Sprites
              const rSpriteMat = new THREE.SpriteMaterial({
                map: cyanGlowTexture,
                color: 0x38bdf8,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.85,
              });

              const mSpriteMat = new THREE.SpriteMaterial({
                map: purpleGlowTexture,
                color: 0xa855f7,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.85,
              });

              // Sprites Reacción emergiendo desde el núcleo
              const selReaction = reactionPosList.sort(() => 0.5 - Math.random()).slice(0, 75);
              selReaction.forEach((pos) => {
                const sprite = new THREE.Sprite(rSpriteMat);
                const targetPos = pos.clone();

                // Inicio en el núcleo
                const u = Math.random();
                const v = Math.random();
                const theta = u * 2.0 * Math.PI;
                const phi = Math.acos(2.0 * v - 1.0);
                const r = Math.cbrt(Math.random()) * coreRadius;
                const sinPhi = Math.sin(phi);
                const startPos = new THREE.Vector3(
                  center.x + r * sinPhi * Math.cos(theta),
                  center.y + r * sinPhi * Math.sin(theta),
                  center.z + r * Math.cos(phi)
                );

                sprite.position.copy(startPos);
                const targetScale = maxDim * 0.022 * (0.6 + Math.random() * 0.6);
                sprite.scale.setScalar(0);
                dynamicRefs.reactionSpritesGroup.add(sprite);

                const dx = targetPos.x - center.x;
                const dy = targetPos.y - center.y;
                const dz = targetPos.z - center.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const normDist = Math.min(dist / (finalMaxDim * 0.5), 1.0);

                dynamicRefs.spritesData.push({
                  sprite,
                  type: 'reaction',
                  targetPos,
                  startPos,
                  targetScale,
                  delay: normDist * 0.35 + Math.random() * 0.15,
                  baseOpacity: 0.6 + Math.random() * 0.4,
                  phase: Math.random() * Math.PI * 2,
                  speed: 0.015 + Math.random() * 0.02,
                });
              });

              // Sprites Memory emergiendo desde el núcleo
              const selMemory = memoryPosList.sort(() => 0.5 - Math.random()).slice(0, 75);
              selMemory.forEach((pos) => {
                const sprite = new THREE.Sprite(mSpriteMat);
                const targetPos = pos.clone();

                // Inicio en el núcleo
                const u = Math.random();
                const v = Math.random();
                const theta = u * 2.0 * Math.PI;
                const phi = Math.acos(2.0 * v - 1.0);
                const r = Math.cbrt(Math.random()) * coreRadius;
                const sinPhi = Math.sin(phi);
                const startPos = new THREE.Vector3(
                  center.x + r * sinPhi * Math.cos(theta),
                  center.y + r * sinPhi * Math.sin(theta),
                  center.z + r * Math.cos(phi)
                );

                sprite.position.copy(startPos);
                const targetScale = maxDim * 0.022 * (0.6 + Math.random() * 0.6);
                sprite.scale.setScalar(0);
                dynamicRefs.memorySpritesGroup.add(sprite);

                const dx = targetPos.x - center.x;
                const dy = targetPos.y - center.y;
                const dz = targetPos.z - center.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const normDist = Math.min(dist / (finalMaxDim * 0.5), 1.0);

                dynamicRefs.spritesData.push({
                  sprite,
                  type: 'memory',
                  targetPos,
                  startPos,
                  targetScale,
                  delay: normDist * 0.35 + Math.random() * 0.15,
                  baseOpacity: 0.6 + Math.random() * 0.4,
                  phase: Math.random() * Math.PI * 2,
                  speed: 0.015 + Math.random() * 0.02,
                });
              });

              // Red sináptica por zona (inicia invisible y se revela cuando el cerebro se completa)
              const createRegionLines = (posArray, colorHex) => {
                const linePositions = [];
                posArray.forEach((pos, i) => {
                  const distances = posArray
                    .map((target, index) => ({ target, index, dist: pos.distanceTo(target) }))
                    .filter((item) => item.index !== i)
                    .sort((a, b) => a.dist - b.dist)
                    .slice(0, 3);

                  distances.forEach((d) => {
                    if (d.dist < maxDim * 0.22) {
                      linePositions.push(pos.x, pos.y, pos.z);
                      linePositions.push(d.target.x, d.target.y, d.target.z);
                    }
                  });
                });

                if (linePositions.length > 0) {
                  const lineGeo = new THREE.BufferGeometry();
                  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
                  const lineMat = new THREE.LineBasicMaterial({
                    color: colorHex,
                    transparent: true,
                    opacity: 0.0, // Inicia invisible hasta que la expansión se consolida
                    blending: THREE.AdditiveBlending,
                  });
                  pointsGroup.add(new THREE.LineSegments(lineGeo, lineMat));
                  return lineMat;
                }
                return null;
              };

              const rLine = createRegionLines(selReaction, 0x38bdf8);
              if (rLine) dynamicRefs.reactionLineMats.push(rLine);

              const mLine = createRegionLines(selMemory, 0xa855f7);
              if (mLine) dynamicRefs.memoryLineMats.push(mLine);
            }
          });

          pointsGroup.add(dynamicRefs.reactionSpritesGroup);
          pointsGroup.add(dynamicRefs.memorySpritesGroup);
          brainMesh = pointsGroup;

          // Centrado geométrico y escala matemáticamente exactos por defecto
          brainMesh.scale.setScalar(scale);
          brainMesh.position.x = -center.x * scale;
          brainMesh.position.y = -center.y * scale;
          brainMesh.position.z = -center.z * scale;

          scene.add(brainMesh);
          setModelLoaded(true);
        },
        undefined,
        (error) => {
          console.error('Error loading brain model:', error);
          setModelLoaded(true);
        }
      );

      // 6. Optimización de Renderizado en Loop de Ticker Central de GSAP
      let isVisible = false;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
          });
        },
        { threshold: 0.05 }
      );

      observer.observe(container);

      // Callback optimizado sincronizado con GSAP Ticker
      const renderLoop = () => {
        if (!isVisible) return;

        // ── MOTOR DE EXPANSIÓN DESDE EL NÚCLEO (ParticleText ReactBits) ──
        if (dynamicRefs.gatherConfig.isGathering) {
          if (dynamicRefs.gatherConfig.startTime === null) {
            dynamicRefs.gatherConfig.startTime = performance.now();
          }
          const now = performance.now();
          const elapsed = (now - dynamicRefs.gatherConfig.startTime) / 1000;
          const { duration, stagger } = dynamicRefs.gatherConfig;

          let allDone = true;

          // Animación matemática de expansión desde el núcleo en Float32Array
          for (let s = 0; s < dynamicRefs.particleSystems.length; s++) {
            const sys = dynamicRefs.particleSystems[s];
            const positions = sys.geometry.attributes.position.array;
            const targets = sys.targetPositions;
            const starts = sys.startPositions;
            const delays = sys.delays;
            const count = sys.count;

            for (let i = 0; i < count; i++) {
              const i3 = i * 3;
              const local = (elapsed - delays[i]) / duration;
              const p = Math.min(Math.max(local, 0), 1);
              // easeOutCubic exacto de ParticleText
              const eased = 1 - Math.pow(1 - p, 3);

              positions[i3] = starts[i3] + (targets[i3] - starts[i3]) * eased;
              positions[i3 + 1] = starts[i3 + 1] + (targets[i3 + 1] - starts[i3 + 1]) * eased;
              positions[i3 + 2] = starts[i3 + 2] + (targets[i3 + 2] - starts[i3 + 2]) * eased;

              if (p < 1) allDone = false;
            }
            sys.geometry.attributes.position.needsUpdate = true;
          }

          // Interpolación suave de Sprites saliendo del núcleo
          for (let i = 0; i < dynamicRefs.spritesData.length; i++) {
            const item = dynamicRefs.spritesData[i];
            if (item.targetPos && item.startPos) {
              const local = (elapsed - item.delay) / duration;
              const p = Math.min(Math.max(local, 0), 1);
              const eased = 1 - Math.pow(1 - p, 3);
              item.sprite.position.lerpVectors(item.startPos, item.targetPos, eased);
              item.sprite.scale.setScalar(item.targetScale * eased);
            }
          }

          // Desvanecimiento suave del núcleo central a medida que el cerebro se completa
          const globalProgress = Math.min(elapsed / (duration + stagger), 1);
          if (dynamicRefs.coreSprite) {
            const coreFade = Math.max(0, 1 - globalProgress * 1.3);
            dynamicRefs.coreSprite.material.opacity = coreFade;
            dynamicRefs.coreSprite.scale.setScalar(dynamicRefs.coreInitialScale * Math.max(0, 1 - globalProgress * 0.8));
            if (globalProgress >= 0.95) {
              dynamicRefs.coreSprite.visible = false;
            }
          }

          // Revelado progresivo de líneas sinápticas (solo tras consolidar la estructura externa)
          dynamicRefs.gatherConfig.lineFade = Math.max(0, (globalProgress - 0.6) / 0.4);

          if (allDone && globalProgress >= 1) {
            dynamicRefs.gatherConfig.isGathering = false;
            dynamicRefs.gatherConfig.lineFade = 1.0;

            // Bloquear en coordenadas exactas por defecto para 0% de uso de CPU
            for (let s = 0; s < dynamicRefs.particleSystems.length; s++) {
              const sys = dynamicRefs.particleSystems[s];
              sys.geometry.attributes.position.array.set(sys.targetPositions);
              sys.geometry.attributes.position.needsUpdate = true;
            }
            for (let i = 0; i < dynamicRefs.spritesData.length; i++) {
              const item = dynamicRefs.spritesData[i];
              if (item.targetPos) {
                item.sprite.position.copy(item.targetPos);
                item.sprite.scale.setScalar(item.targetScale);
              }
            }
          }
        }

        const { activeModules: currentActive, hoveredModule: currentHovered } = filterStateRef.current;

        let targetReaction = currentActive.reaction ? 1.0 : 0.0;
        let targetMemory = currentActive.memory ? 1.0 : 0.0;

        if (currentActive.reaction && currentActive.memory) {
          if (currentHovered === 'reaction') {
            targetReaction = 1.0;
            targetMemory = 0.05;
          } else if (currentHovered === 'memory') {
            targetReaction = 0.05;
            targetMemory = 1.0;
          }
        }

        // Lerp suavizado para filtros
        dynamicRefs.opacities.reaction += (targetReaction - dynamicRefs.opacities.reaction) * 0.15;
        dynamicRefs.opacities.memory += (targetMemory - dynamicRefs.opacities.memory) * 0.15;

        const rFactor = dynamicRefs.opacities.reaction;
        const mFactor = dynamicRefs.opacities.memory;
        const lineFade = dynamicRefs.gatherConfig.lineFade !== undefined ? dynamicRefs.gatherConfig.lineFade : 1.0;

        // Actualización eficiente por lotes de opacidades por defecto
        dynamicRefs.basePointsMats.forEach((mat) => {
          mat.opacity = 0.35;
        });
        dynamicRefs.reactionPointsMats.forEach((mat) => {
          mat.opacity = 0.75 * rFactor;
        });
        dynamicRefs.reactionLineMats.forEach((mat) => {
          mat.opacity = 0.4 * rFactor * lineFade;
        });
        dynamicRefs.memoryPointsMats.forEach((mat) => {
          mat.opacity = 0.75 * mFactor;
        });
        dynamicRefs.memoryLineMats.forEach((mat) => {
          mat.opacity = 0.4 * mFactor * lineFade;
        });

        // Actualización por grupo de sprites
        dynamicRefs.reactionSpritesGroup.visible = rFactor > 0.01;
        dynamicRefs.memorySpritesGroup.visible = mFactor > 0.01;

        // Pulsación sutil continua de nodos
        if (!dynamicRefs.gatherConfig.isGathering) {
          for (let i = 0; i < dynamicRefs.spritesData.length; i++) {
            const item = dynamicRefs.spritesData[i];
            item.phase += item.speed;
            const pulse = (Math.sin(item.phase) + 1) / 2;
            const factor = item.type === 'reaction' ? rFactor : mFactor;
            item.sprite.material.opacity = item.baseOpacity * (0.3 + pulse * 0.7) * factor;
          }
        }

        if (brainMesh) {
          const scrollY = window.scrollY || 0;
          brainMesh.rotation.y += 0.003;
          brainMesh.position.y = Math.sin(Date.now() * 0.0012) * 0.04 + scrollY * 0.0003;
        }

        controls.update();
        renderer.render(scene, camera);
      };

      // Registrar callback en el ticker unificado de GSAP
      gsap.ticker.add(renderLoop);

      const handleResize = () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        gsap.ticker.remove(renderLoop);
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
        controls.dispose();
        if (container && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    },
    { scope: containerRef }
  );

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col items-center justify-center">
      <div
        ref={containerRef}
        className="w-full h-full min-h-[400px] relative overflow-visible pointer-events-auto"
        style={{ outline: 'none' }}
      />

      {/* Botones de Selección e Interacción Dinámica */}
      {modelLoaded && (
        <div className="absolute bottom-2 inset-x-0 mx-auto w-fit z-20 flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-[#0c101d]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl animate-fade-in pointer-events-auto">
          {/* Botón Reacción Mirror */}
          <button
            type="button"
            onClick={() => toggleModule('reaction')}
            onMouseEnter={() => setHoveredModule('reaction')}
            onMouseLeave={() => setHoveredModule(null)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer border text-left ${
              activeModules.reaction
                ? 'bg-blue-500/15 border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'bg-slate-900/60 border-slate-700/50 opacity-40 hover:opacity-75'
            }`}
          >
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 ${
                  activeModules.reaction ? 'opacity-75' : 'opacity-0'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  activeModules.reaction ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-500'
                }`}
              />
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-bold ${
                    activeModules.reaction ? 'text-sky-300' : 'text-slate-400 line-through'
                  }`}
                >
                  Reacción Mirror
                </span>
                <span
                  className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                    activeModules.reaction ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {activeModules.reaction ? 'ON' : 'OFF'}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">
                Corteza Frontal / Motora (Go/No-Go &amp; Bimanual)
              </span>
            </div>
          </button>

          {/* Botón Memory Mirror */}
          <button
            type="button"
            onClick={() => toggleModule('memory')}
            onMouseEnter={() => setHoveredModule('memory')}
            onMouseLeave={() => setHoveredModule(null)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer border text-left ${
              activeModules.memory
                ? 'bg-purple-500/15 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'bg-slate-900/60 border-slate-700/50 opacity-40 hover:opacity-75'
            }`}
          >
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 ${
                  activeModules.memory ? 'opacity-75' : 'opacity-0'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  activeModules.memory ? 'bg-purple-400 shadow-[0_0_8px_#a855f7]' : 'bg-slate-500'
                }`}
              />
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-bold ${
                    activeModules.memory ? 'text-purple-300' : 'text-slate-400 line-through'
                  }`}
                >
                  Memory Mirror
                </span>
                <span
                  className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                    activeModules.memory ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {activeModules.memory ? 'ON' : 'OFF'}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">
                Corteza Parietal / Temporal (Test de Corsi)
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
