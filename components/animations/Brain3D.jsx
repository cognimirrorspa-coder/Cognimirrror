'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const Brain3D = () => {
  const containerRef = useRef(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Estados de filtro multiselect + hover
  const [activeModules, setActiveModules] = useState({ reaction: true, memory: true });
  const [hoveredModule, setHoveredModule] = useState(null);

  // Ref para acceder al estado actual dentro del loop de Three.js (60fps)
  const filterStateRef = useRef({ activeModules, hoveredModule });

  useEffect(() => {
    filterStateRef.current = { activeModules, hoveredModule };
  }, [activeModules, hoveredModule]);

  const toggleModule = (moduleKey) => {
    setActiveModules(prev => {
      const next = { ...prev, [moduleKey]: !prev[moduleKey] };
      return next;
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) return;

    const scene = new THREE.Scene();

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x38bdf8, 2.5);
    pointLight1.position.set(3, 3, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 2.5);
    pointLight2.position.set(-3, -2, 4);
    scene.add(pointLight2);

    let brainMesh = null;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;

    const createGlowTexture = (r, g, b) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
        gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.9)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const cyanGlowTexture = createGlowTexture(56, 189, 248);   // #38bdf8 (Reacción)
    const purpleGlowTexture = createGlowTexture(168, 85, 247); // #a855f7 (Memory)

    // Acumuladores de materiales para control de opacidad cromática
    const dynamicRefs = {
      reactionPointsMats: [],
      memoryPointsMats: [],
      basePointsMats: [],
      reactionLineMats: [],
      memoryLineMats: [],
      reactionSprites: [],
      memorySprites: [],
      opacities: { reaction: 1.0, memory: 1.0 }
    };

    const loader = new OBJLoader();
    loader.load('/models/brain.obj', (obj) => {
      const pointsGroup = new THREE.Group();
      const spritesGroup = new THREE.Group();

      obj.traverse((child) => {
        if (child.isMesh) {
          child.geometry.computeBoundingBox();
          const box = child.geometry.boundingBox;
          if (!box) return;

          const size = box.getSize(new THREE.Vector3());
          const min = box.min;
          const max = box.max;
          const maxDim = Math.max(size.x, size.y, size.z);

          const positions = child.geometry.attributes.position.array;
          const count = positions.length / 3;

          const allVerts = Array.from(positions); // Estructura completa base del cerebro
          const reactionVerts = [];
          const memoryVerts = [];

          const reactionPosList = [];
          const memoryPosList = [];

          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x = positions[idx];
            const y = positions[idx + 1];
            const z = positions[idx + 2];

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

          // 1. ESTRUCTURA COMPLETA SIEMPRE VISIBLE (Base Plata / Gris Azulado #64748b)
          const baseGeo = new THREE.BufferGeometry();
          baseGeo.setAttribute('position', new THREE.Float32BufferAttribute(allVerts, 3));
          const baseMat = new THREE.PointsMaterial({
            color: 0x64748b,
            size: 0.013,
            transparent: true,
            opacity: 0.35,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
          });
          dynamicRefs.basePointsMats.push(baseMat);
          pointsGroup.add(new THREE.Points(baseGeo, baseMat));

          // 2. CAPAS CROMÁTICAS SUPERPUESTAS (Iluminación específica de cada juego)
          const createPointsObj = (vertsArray, colorHex, initialOpacity, size = 0.017) => {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(vertsArray, 3));
            const mat = new THREE.PointsMaterial({
              color: colorHex,
              size,
              transparent: true,
              opacity: initialOpacity,
              sizeAttenuation: true,
              blending: THREE.AdditiveBlending
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

          // Sprites luminosos (Reacción Mirror - Cyan)
          const selReaction = reactionPosList.sort(() => 0.5 - Math.random()).slice(0, 90);
          selReaction.forEach(pos => {
            const spriteMat = new THREE.SpriteMaterial({
              map: cyanGlowTexture,
              color: 0x38bdf8,
              transparent: true,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              opacity: 0.9
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.copy(pos);
            sprite.scale.setScalar(maxDim * 0.022 * (0.6 + Math.random() * 0.6));
            sprite.userData = {
              baseOpacity: 0.6 + Math.random() * 0.4,
              phase: Math.random() * Math.PI * 2,
              speed: 0.015 + Math.random() * 0.02
            };
            spritesGroup.add(sprite);
            dynamicRefs.reactionSprites.push(sprite);
          });

          // Sprites luminosos (Memory Mirror - Purple)
          const selMemory = memoryPosList.sort(() => 0.5 - Math.random()).slice(0, 90);
          selMemory.forEach(pos => {
            const spriteMat = new THREE.SpriteMaterial({
              map: purpleGlowTexture,
              color: 0xa855f7,
              transparent: true,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              opacity: 0.9
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.copy(pos);
            sprite.scale.setScalar(maxDim * 0.022 * (0.6 + Math.random() * 0.6));
            sprite.userData = {
              baseOpacity: 0.6 + Math.random() * 0.4,
              phase: Math.random() * Math.PI * 2,
              speed: 0.015 + Math.random() * 0.02
            };
            spritesGroup.add(sprite);
            dynamicRefs.memorySprites.push(sprite);
          });

          // Líneas de red sináptica por zona
          const createRegionLines = (posArray, colorHex) => {
            const linePositions = [];
            posArray.forEach((pos, i) => {
              const distances = posArray
                .map((target, index) => ({ target, index, dist: pos.distanceTo(target) }))
                .filter(item => item.index !== i)
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 3);

              distances.forEach(d => {
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
                opacity: 0.4,
                blending: THREE.AdditiveBlending
              });
              spritesGroup.add(new THREE.LineSegments(lineGeo, lineMat));
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

      pointsGroup.add(spritesGroup);
      brainMesh = pointsGroup;

      const boundingBox = new THREE.Box3().setFromObject(brainMesh);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());

      const finalMaxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 3.2;
      const scale = targetSize / finalMaxDim;

      brainMesh.scale.setScalar(scale);
      brainMesh.position.x = -center.x * scale;
      brainMesh.position.y = -center.y * scale;
      brainMesh.position.z = -center.z * scale;

      scene.add(brainMesh);
      setModelLoaded(true);
    }, undefined, (error) => {
      console.error('Error loading brain model:', error);
      setModelLoaded(true);
    });

    let animationFrameId;
    let isVisible = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.1 });

    observer.observe(container);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const { activeModules: currentActive, hoveredModule: currentHovered } = filterStateRef.current;

      // Las luces cromáticas se encienden/apagan, pero la base anatómica del cerebro SIEMPRE permanece intacta
      let targetReaction = currentActive.reaction ? 1.0 : 0.0;
      let targetMemory = currentActive.memory ? 1.0 : 0.0;

      // Si AMBOS están ON y sobrevolamos uno con el puntero, aislamos luminosamente ese módulo
      if (currentActive.reaction && currentActive.memory) {
        if (currentHovered === 'reaction') {
          targetReaction = 1.0;
          targetMemory = 0.05;
        } else if (currentHovered === 'memory') {
          targetReaction = 0.05;
          targetMemory = 1.0;
        }
      }

      // Suavizado Lerp (60fps)
      dynamicRefs.opacities.reaction += (targetReaction - dynamicRefs.opacities.reaction) * 0.15;
      dynamicRefs.opacities.memory += (targetMemory - dynamicRefs.opacities.memory) * 0.15;

      const rFactor = dynamicRefs.opacities.reaction;
      const mFactor = dynamicRefs.opacities.memory;

      // Ajustar opacidad de las capas de LUZ CROMÁTICA (puntos de color, líneas y nodos centelleantes)
      dynamicRefs.reactionPointsMats.forEach(mat => { mat.opacity = 0.75 * rFactor; });
      dynamicRefs.reactionLineMats.forEach(mat => { mat.opacity = 0.4 * rFactor; });

      dynamicRefs.memoryPointsMats.forEach(mat => { mat.opacity = 0.75 * mFactor; });
      dynamicRefs.memoryLineMats.forEach(mat => { mat.opacity = 0.4 * mFactor; });

      dynamicRefs.reactionSprites.forEach((sprite) => {
        sprite.userData.phase += sprite.userData.speed;
        const pulse = (Math.sin(sprite.userData.phase) + 1) / 2;
        sprite.material.opacity = sprite.userData.baseOpacity * (0.3 + pulse * 0.7) * rFactor;
      });

      dynamicRefs.memorySprites.forEach((sprite) => {
        sprite.userData.phase += sprite.userData.speed;
        const pulse = (Math.sin(sprite.userData.phase) + 1) / 2;
        sprite.material.opacity = sprite.userData.baseOpacity * (0.3 + pulse * 0.7) * mFactor;
      });

      if (brainMesh) {
        const scrollY = window.scrollY || 0;
        brainMesh.rotation.y = scrollY * 0.001;
        brainMesh.position.y = (Math.sin(Date.now() * 0.001) * 0.05) + (scrollY * 0.0005);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      controls.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

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
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 ${activeModules.reaction ? 'opacity-75' : 'opacity-0'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeModules.reaction ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-500'}`} />
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${activeModules.reaction ? 'text-sky-300' : 'text-slate-400 line-through'}`}>
                  Reacción Mirror
                </span>
                <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${activeModules.reaction ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-500'}`}>
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
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 ${activeModules.memory ? 'opacity-75' : 'opacity-0'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeModules.memory ? 'bg-purple-400 shadow-[0_0_8px_#a855f7]' : 'bg-slate-500'}`} />
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${activeModules.memory ? 'text-purple-300' : 'text-slate-400 line-through'}`}>
                  Memory Mirror
                </span>
                <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${activeModules.memory ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
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
