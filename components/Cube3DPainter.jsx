'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CUBE_COLORS, COLOR_KEYS } from '../utils/kociembaSolver';
import { 
  RotateCw, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  Sparkles, Check, Info, Palette
} from 'lucide-react';

const HEX_MAP = {
  U: 0xf8fafc, // Blanco
  D: 0xffd000, // Amarillo
  F: 0x0066ff, // Azul
  B: 0x00e676, // Verde
  L: 0xff1744, // Rojo
  R: 0xff6d00, // Naranja
  CORE: 0x0f172a // Plástico interior oscuro
};

// Mapeo canónico 3D (x, y, z) + normal -> (faceKey, index 0..8)
export function getFaceletInfoFromHit(cubiePos, normal) {
  const nx = Math.round(normal.x);
  const ny = Math.round(normal.y);
  const nz = Math.round(normal.z);

  const x = Math.round(cubiePos.x);
  const y = Math.round(cubiePos.y);
  const z = Math.round(cubiePos.z);

  let faceKey = null;
  let index = null;

  // Cara U (Arriba, +Y)
  if (ny === 1) {
    faceKey = 'U';
    index = (z + 1) * 3 + (x + 1);
  }
  // Cara D (Abajo, -Y)
  else if (ny === -1) {
    faceKey = 'D';
    index = (1 - z) * 3 + (x + 1);
  }
  // Cara F (Frente, +Z)
  else if (nz === 1) {
    faceKey = 'F';
    index = (1 - y) * 3 + (x + 1);
  }
  // Cara B (Atrás, -Z)
  else if (nz === -1) {
    faceKey = 'B';
    index = (1 - y) * 3 + (1 - x);
  }
  // Cara R (Derecha, +X)
  else if (nx === 1) {
    faceKey = 'R';
    index = (1 - y) * 3 + (1 - z);
  }
  // Cara L (Izquierda, -X)
  else if (nx === -1) {
    faceKey = 'L';
    index = (1 - y) * 3 + (z + 1);
  }

  return { faceKey, index, isCenter: index === 4 };
}

// Preset de orientaciones de cámara para ver cualquier cara de frente
const CAMERA_PRESETS = {
  F: { name: 'Frente (Azul)', theta: 0, phi: Math.PI / 2 },
  B: { name: 'Atrás (Verde)', theta: Math.PI, phi: Math.PI / 2 },
  R: { name: 'Derecha (Naranja)', theta: Math.PI / 2, phi: Math.PI / 2 },
  L: { name: 'Izquierda (Rojo)', theta: -Math.PI / 2, phi: Math.PI / 2 },
  U: { name: 'Arriba (Blanco)', theta: 0, phi: 0.15 },
  D: { name: 'Abajo (Amarillo)', theta: 0, phi: Math.PI - 0.15 },
  ISO: { name: 'Perspectiva 3D', theta: Math.PI / 4, phi: Math.PI / 3 }
};

export default function Cube3DPainter({
  faces,
  selectedColor = 'F',
  onPaintFacelet,
  onSelectColor,
  interactive = true,
  className = '',
  showViewPresets = true,
  heightClass = null
}) {
  const containerRef = useRef(null);
  const threeRef = useRef(null);
  const facesRef = useRef(faces);
  facesRef.current = faces;
  const selectedColorRef = useRef(selectedColor);
  selectedColorRef.current = selectedColor;

  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [activePreset, setActivePreset] = useState('ISO');
  const [clickedFacelet, setClickedFacelet] = useState(null); // { faceKey, index, screenX, screenY }

  // ═══════════════════════════════════════════════════════════
  // INICIALIZACIÓN DE THREE.JS CON ORBIT 360° Y RAYCASTING
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    const radius = 8.5;
    const spherical = new THREE.Spherical(radius, Math.PI / 3, Math.PI / 4);
    camera.position.setFromSpherical(spherical);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Iluminación ambiental y direccional suave para no saturar colores
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.1);
    light1.position.set(6, 10, 8);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.7);
    light2.position.set(-6, -6, -8);
    scene.add(light2);

    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);

    // Creación de 27 cubies (piezas 3D) con stickers
    const cubieMeshes = [];
    const cubieSize = 0.94;
    const geo = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);

    // Materiales: orden de caras en BoxGeometry:
    // 0: +X (R), 1: -X (L), 2: +Y (U), 3: -Y (D), 4: +Z (F), 5: -Z (B)
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const materials = [
            new THREE.MeshPhongMaterial({ color: HEX_MAP.CORE, shininess: 40 }), // +X
            new THREE.MeshPhongMaterial({ color: HEX_MAP.CORE, shininess: 40 }), // -X
            new THREE.MeshPhongMaterial({ color: HEX_MAP.CORE, shininess: 40 }), // +Y
            new THREE.MeshPhongMaterial({ color: HEX_MAP.CORE, shininess: 40 }), // -Y
            new THREE.MeshPhongMaterial({ color: HEX_MAP.CORE, shininess: 40 }), // +Z
            new THREE.MeshPhongMaterial({ color: HEX_MAP.CORE, shininess: 40 }), // -Z
          ];

          const mesh = new THREE.Mesh(geo, materials);
          mesh.position.set(x, y, z);
          mesh.userData = { x, y, z };
          cubeGroup.add(mesh);
          cubieMeshes.push(mesh);
        }
      }
    }

    // Función interna para refrescar los colores de las pegatinas en el 3D
    const updateStickerColors = (currentFaces) => {
      if (!currentFaces) return;
      cubieMeshes.forEach(mesh => {
        const { x, y, z } = mesh.userData;
        const pos = mesh.position;

        // +X: R face (x === 1)
        if (x === 1) {
          const { faceKey, index } = getFaceletInfoFromHit(pos, new THREE.Vector3(1, 0, 0));
          const colorKey = currentFaces[faceKey]?.[index] || 'R';
          mesh.material[0].color.setHex(HEX_MAP[colorKey] || HEX_MAP.R);
        }
        // -X: L face (x === -1)
        if (x === -1) {
          const { faceKey, index } = getFaceletInfoFromHit(pos, new THREE.Vector3(-1, 0, 0));
          const colorKey = currentFaces[faceKey]?.[index] || 'L';
          mesh.material[1].color.setHex(HEX_MAP[colorKey] || HEX_MAP.L);
        }
        // +Y: U face (y === 1)
        if (y === 1) {
          const { faceKey, index } = getFaceletInfoFromHit(pos, new THREE.Vector3(0, 1, 0));
          const colorKey = currentFaces[faceKey]?.[index] || 'U';
          mesh.material[2].color.setHex(HEX_MAP[colorKey] || HEX_MAP.U);
        }
        // -Y: D face (y === -1)
        if (y === -1) {
          const { faceKey, index } = getFaceletInfoFromHit(pos, new THREE.Vector3(0, -1, 0));
          const colorKey = currentFaces[faceKey]?.[index] || 'D';
          mesh.material[3].color.setHex(HEX_MAP[colorKey] || HEX_MAP.D);
        }
        // +Z: F face (z === 1)
        if (z === 1) {
          const { faceKey, index } = getFaceletInfoFromHit(pos, new THREE.Vector3(0, 0, 1));
          const colorKey = currentFaces[faceKey]?.[index] || 'F';
          mesh.material[4].color.setHex(HEX_MAP[colorKey] || HEX_MAP.F);
        }
        // -Z: B face (z === -1)
        if (z === -1) {
          const { faceKey, index } = getFaceletInfoFromHit(pos, new THREE.Vector3(0, 0, -1));
          const colorKey = currentFaces[faceKey]?.[index] || 'B';
          mesh.material[5].color.setHex(HEX_MAP[colorKey] || HEX_MAP.B);
        }
      });
    };

    updateStickerColors(facesRef.current);

    // ═══════════════════════════════════════════════════════════
    // GESTIÓN DE RATÓN / TOUCH: ROTACIÓN 360° Y DETECCIÓN CLICK
    // ═══════════════════════════════════════════════════════════
    let isDragging = false;
    let downX = 0;
    let downY = 0;
    let prevX = 0;
    let prevY = 0;
    let targetSpherical = spherical.clone();

    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const getRaycast = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseCoord.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(cubieMeshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.face) {
          const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).round();
          const info = getFaceletInfoFromHit(hit.object.position, worldNormal);
          return { hit, info, worldNormal };
        }
      }
      return null;
    };

    const handlePointerDown = (e) => {
      isDragging = true;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      downX = x;
      downY = y;
      prevX = x;
      prevY = y;
      renderer.domElement.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e) => {
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

      if (isDragging) {
        const dx = x - prevX;
        const dy = y - prevY;
        prevX = x;
        prevY = y;

        // Sensibilidad suave de rotación de órbita 360°
        targetSpherical.theta -= dx * 0.008;
        targetSpherical.phi = Math.max(0.12, Math.min(Math.PI - 0.12, targetSpherical.phi - dy * 0.008));
      } else {
        // Hover sobre faceta cuando no se está arrastrando
        const res = getRaycast(x, y);
        if (res && res.info && res.info.faceKey) {
          renderer.domElement.style.cursor = res.info.isCenter ? 'not-allowed' : 'pointer';
          setHoveredInfo(res.info);
        } else {
          renderer.domElement.style.cursor = 'grab';
          setHoveredInfo(null);
        }
      }
    };

    const handlePointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';

      const x = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.changedTouches?.[0]?.clientY ?? 0;
      const distSq = (x - downX) ** 2 + (y - downY) ** 2;

      // Si el movimiento fue menor a 6 píxeles, fue un CLICK o TAP deliberado
      if (distSq < 36 && interactive) {
        const res = getRaycast(x, y);
        if (res && res.info && res.info.faceKey) {
          const { faceKey, index, isCenter } = res.info;
          if (isCenter) {
            // Centro inmutable
            return;
          }

          const rect = renderer.domElement.getBoundingClientRect();
          const screenX = x - rect.left;
          const screenY = y - rect.top;

          // Si el usuario ya tiene un color seleccionado, pintar de inmediato
          if (selectedColorRef.current && onPaintFacelet) {
            onPaintFacelet(faceKey, index, selectedColorRef.current);
          }

          // Y abrir mini picker flotante en esa pieza por si desea elegir otro color al instante
          setClickedFacelet({
            faceKey,
            index,
            screenX,
            screenY
          });
        } else {
          // Clic fuera de una faceta cierra el picker flotante
          setClickedFacelet(null);
        }
      }
    };

    const dom = renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';
    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    dom.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Bucle de animación (Smooth slerp a la orientación deseada)
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Interpolación suave del ángulo de cámara
      spherical.theta += (targetSpherical.theta - spherical.theta) * 0.15;
      spherical.phi += (targetSpherical.phi - spherical.phi) * 0.15;
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Redimensionamiento
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 360;
      const nh = container.clientHeight || 360;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    threeRef.current = {
      scene,
      camera,
      renderer,
      updateStickerColors,
      setCameraTarget: (theta, phi) => {
        targetSpherical.theta = theta;
        targetSpherical.phi = phi;
      },
      rotateDelta: (dTheta, dPhi) => {
        targetSpherical.theta += dTheta;
        targetSpherical.phi = Math.max(0.12, Math.min(Math.PI - 0.12, targetSpherical.phi + dPhi));
      }
    };

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
  }, [interactive]);

  // Actualizar colores 3D cuando cambia el prop `faces`
  useEffect(() => {
    if (threeRef.current && threeRef.current.updateStickerColors) {
      threeRef.current.updateStickerColors(faces);
    }
  }, [faces]);

  // Cambiar orientación a un preset
  const handleApplyPreset = (presetKey) => {
    setActivePreset(presetKey);
    const p = CAMERA_PRESETS[presetKey];
    if (p && threeRef.current) {
      threeRef.current.setCameraTarget(p.theta, p.phi);
    }
  };

  // Girar 90° rápido con botones
  const handleQuickTurn = (dTheta, dPhi) => {
    if (threeRef.current) {
      threeRef.current.rotateDelta(dTheta, dPhi);
    }
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* CONTENEDOR 3D CANVAS */}
      <div 
        ref={containerRef} 
        className={`w-full ${heightClass || 'h-[250px] sm:h-[350px]'} rounded-3xl relative overflow-hidden bg-gradient-to-b from-slate-950/70 to-[#070b14]/90 border border-white/10 shadow-inner flex items-center justify-center`}
      >
        {/* BADGE DE ROTACIÓN 360° */}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-bold text-slate-300 flex items-center gap-1.5 shadow-sm pointer-events-none">
          <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
          <span>Arrastra para girar 360°</span>
        </div>

        {/* CONTROLES RÁPIDOS DE GIRO EN ESQUINA SUPERIOR DERECHA */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-2xl border border-white/15">
          <button
            onClick={() => handleQuickTurn(-Math.PI / 2, 0)}
            title="Girar a la izquierda 90°"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleQuickTurn(Math.PI / 2, 0)}
            title="Girar a la derecha 90°"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleQuickTurn(0, -Math.PI / 4)}
            title="Ver desde arriba"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleQuickTurn(0, Math.PI / 4)}
            title="Ver desde abajo"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* FEEDBACK DE HOVER SOBRE LA PIEZA */}
        {hoveredInfo && (
          <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-2 shadow-lg pointer-events-none animate-in fade-in duration-100">
            <span 
              className="w-3.5 h-3.5 rounded-full shadow" 
              style={{ backgroundColor: CUBE_COLORS[hoveredInfo.faceKey]?.hex }}
            />
            <span>
              Cara {CUBE_COLORS[hoveredInfo.faceKey]?.name} ({hoveredInfo.faceKey})
            </span>
            {hoveredInfo.isCenter ? (
              <span className="text-[10px] text-amber-300 font-normal">
                (Centro fijo de referencia)
              </span>
            ) : (
              <span className="text-[10px] text-blue-300 font-normal">
                • Clic para pintar con {CUBE_COLORS[selectedColor]?.name}
              </span>
            )}
          </div>
        )}

        {/* POPUP FLOTANTE PARA ELEGIR COLOR DIRECTAMENTE EN LA PIEZA */}
        {clickedFacelet && (
          <div 
            className="absolute z-30 -translate-x-1/2 -translate-y-full p-2 rounded-2xl bg-[#090d18]/95 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-1.5 animate-in zoom-in-75 duration-150"
            style={{ 
              left: Math.max(80, Math.min(clickedFacelet.screenX, 280)), 
              top: Math.max(50, clickedFacelet.screenY - 14) 
            }}
          >
            <div className="flex items-center gap-1">
              {COLOR_KEYS.map((ck) => {
                const cInfo = CUBE_COLORS[ck];
                const isSelected = selectedColor === ck;
                return (
                  <button
                    key={ck}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPaintFacelet) {
                        onPaintFacelet(clickedFacelet.faceKey, clickedFacelet.index, ck);
                      }
                      if (onSelectColor) {
                        onSelectColor(ck);
                      }
                      setClickedFacelet(null);
                    }}
                    title={`Pintar ${cInfo.name}`}
                    className={`w-6 h-6 rounded-full transition-all cursor-pointer border flex items-center justify-center ${
                      isSelected ? 'border-white scale-110 shadow-md ring-2 ring-blue-500' : 'border-black/50 hover:scale-125'
                    }`}
                    style={{ backgroundColor: cInfo.hex }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setClickedFacelet(null); }}
              className="ml-1 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* SELECTOR RÁPIDO DE VISTAS (FRENTE, ATRÁS, ARRIBA, DERECHA, ETC.) */}
      {showViewPresets && (
        <div className="w-full flex items-center justify-between gap-1 mt-2.5 px-1 overflow-x-auto py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 hidden sm:inline">
            Vistas:
          </span>
          <div className="flex items-center gap-1">
            {Object.entries(CAMERA_PRESETS).map(([key, item]) => {
              const isCur = activePreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    isCur
                      ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                >
                  {key === 'ISO' ? '3D Libre' : key}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
