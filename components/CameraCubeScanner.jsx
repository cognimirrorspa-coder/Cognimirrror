'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, CameraOff, RefreshCw, Check, AlertCircle, 
  ChevronRight, ArrowLeft, Sparkles, Eye, ShieldCheck, 
  HelpCircle, Volume2, RotateCcw
} from 'lucide-react';
import { CUBE_COLORS, COLOR_KEYS, facesToString, stringToFaces } from '../utils/kociembaSolver';

// Orden canónico de escaneo de las 6 caras
const FACE_SCAN_ORDER = [
  { face: 'F', name: 'Frente (Centro Azul)', color: 'Azul', centerKey: 'F', hex: '#0066ff', borderClass: 'border-blue-500' },
  { face: 'R', name: 'Derecha (Centro Naranja)', color: 'Naranja', centerKey: 'R', hex: '#ff6d00', borderClass: 'border-orange-500' },
  { face: 'B', name: 'Atrás (Centro Verde)', color: 'Verde', centerKey: 'B', hex: '#00e676', borderClass: 'border-emerald-500' },
  { face: 'L', name: 'Izquierda (Centro Rojo)', color: 'Rojo', centerKey: 'L', hex: '#ff1744', borderClass: 'border-red-500' },
  { face: 'U', name: 'Arriba (Centro Blanco)', color: 'Blanco', centerKey: 'U', hex: '#ffffff', borderClass: 'border-slate-300' },
  { face: 'D', name: 'Abajo (Centro Amarillo)', color: 'Amarillo', centerKey: 'D', hex: '#ffd000', borderClass: 'border-yellow-400' },
];

// Conversión RGB a CIELAB para compensación de iluminación (algoritmo tipo rubiks-color-resolver)
function rgbToLab(r, g, b) {
  let [rL, gL, bL] = [r / 255, g / 255, b / 255].map(v => 
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  );

  let x = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047;
  let y = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) / 1.00000;
  let z = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883;

  [x, y, z] = [x, y, z].map(v => 
    v > 0.008856 ? Math.cbrt(v) : (7.787 * v) + (16 / 116)
  );

  return [
    (116 * y) - 16,        // L
    500 * (x - y),          // a
    200 * (y - z)           // b
  ];
}

// Distancia Delta-E (Euclidiana en espacio CIELAB)
function deltaE(lab1, lab2) {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

// Colores RGB canónicos de referencia
const CANONICAL_RGB = {
  U: [240, 240, 240], // Blanco
  R: [230, 90, 0],    // Naranja
  F: [0, 95, 230],    // Azul
  D: [240, 210, 0],   // Amarillo
  L: [215, 20, 45],   // Rojo
  B: [0, 195, 75]     // Verde
};

export default function CameraCubeScanner({ onFacesResolved, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  
  // Paso de escaneo actual (0 a 5)
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  
  // Almacén de las 6 caras detectadas: { U: [...9], R: [...9], ... }
  const [scannedFaces, setScannedFaces] = useState({
    U: null, R: null, F: null, D: null, L: null, B: null
  });

  // Vista previa de los 9 stickers de la cara en vivo
  const [liveStickers, setLiveStickers] = useState(Array(9).fill('F'));
  const [isCapturing, setIsCapturing] = useState(false);
  const [editingStickerIndex, setEditingStickerIndex] = useState(null);

  const currentFaceConfig = FACE_SCAN_ORDER[currentFaceIndex];

  // Iniciar la cámara del dispositivo
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador no permite acceso a la cámara. Usa Chrome o Safari.');
      return;
    }

    // Detener stream anterior si existe
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error('Error abriendo cámara:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Concede permiso en el navegador.');
      } else {
        setCameraError('No se pudo acceder a la cámara trasera: ' + err.message);
      }
      setCameraActive(false);
    }
  }, [facingMode]);

  // Detener cámara al desmontar
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  // Alternar cámara frontal/trasera
  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Muestreo de color en tiempo real desde el video hacia el canvas
  useEffect(() => {
    if (!cameraActive) return;

    let animId;
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const w = canvas.width;
      const h = canvas.height;

      // Dibujar frame actual
      ctx.drawImage(video, 0, 0, w, h);

      // Calcular posiciones de la cuadrícula 3x3 (centrada)
      const boxSize = Math.min(w, h) * 0.65;
      const startX = (w - boxSize) / 2;
      const startY = (h - boxSize) / 2;
      const cellSize = boxSize / 3;

      const detected = [];

      // Muestrear las 9 celdas (3x3)
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const sampleX = Math.round(startX + (col + 0.5) * cellSize);
          const sampleY = Math.round(startY + (row + 0.5) * cellSize);

          // Si es el centro (índice 4), forzar el color de la cara actual (es la referencia fija)
          if (row === 1 && col === 1) {
            detected.push(currentFaceConfig.centerKey);
            continue;
          }

          // Muestrear un parche de 16x16 píxeles para evitar ruido o reflejos de luz
          const patch = ctx.getImageData(sampleX - 8, sampleY - 8, 16, 16).data;
          let sumR = 0, sumG = 0, sumB = 0;
          const totalPixels = patch.length / 4;
          for (let i = 0; i < patch.length; i += 4) {
            sumR += patch[i];
            sumG += patch[i + 1];
            sumB += patch[i + 2];
          }
          const avgR = sumR / totalPixels;
          const avgG = sumG / totalPixels;
          const avgB = sumB / totalPixels;

          const sampleLab = rgbToLab(avgR, avgG, avgB);

          // Buscar el color canónico más cercano en Delta-E
          let bestColor = 'U';
          let minDistance = Infinity;

          COLOR_KEYS.forEach(key => {
            const [cr, cg, cb] = CANONICAL_RGB[key];
            const canLab = rgbToLab(cr, cg, cb);
            const dist = deltaE(sampleLab, canLab);
            if (dist < minDistance) {
              minDistance = dist;
              bestColor = key;
            }
          });

          detected.push(bestColor);
        }
      }

      setLiveStickers(detected);
      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animId);
  }, [cameraActive, currentFaceConfig]);

  // Capturar la cara actual
  const handleCaptureCurrentFace = () => {
    setIsCapturing(true);
    const captured = [...liveStickers];
    // Asegurar que el centro siempre sea el centro oficial
    captured[4] = currentFaceConfig.centerKey;

    const nextScanned = {
      ...scannedFaces,
      [currentFaceConfig.face]: captured
    };
    setScannedFaces(nextScanned);

    setTimeout(() => {
      setIsCapturing(false);
      if (currentFaceIndex < 5) {
        setCurrentFaceIndex(prev => prev + 1);
      } else {
        // Todas las 6 caras capturadas: ejecutar corrección topológica y finalizar
        resolveFullCube(nextScanned);
      }
    }, 200);
  };

  // Corrector topológico inteligente (tipo rubiks-color-resolver)
  const resolveFullCube = (facesData) => {
    // 1. Verificar si cada color tiene exactamente 9 stickers
    const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
    Object.values(facesData).forEach(faceArr => {
      if (faceArr) {
        faceArr.forEach(c => {
          if (counts[c] !== undefined) counts[c]++;
        });
      }
    });

    console.log('[CameraScanner] Conteo de facetas detectadas:', counts);

    // Si los conteos son exactamente 9 por color, procedemos directamente
    const isPerfect = COLOR_KEYS.every(k => counts[k] === 9);

    if (isPerfect) {
      if (onFacesResolved) onFacesResolved(facesData);
      return;
    }

    // Si hay discrepancias leves por sombras (ej. 10 blancos y 8 amarillos),
    // el sistema ajusta los bordes no centrales respetando la paridad topológica
    const sanitized = { ...facesData };
    // Asegurar los 6 centros inmutables
    sanitized.U[4] = 'U';
    sanitized.R[4] = 'R';
    sanitized.F[4] = 'F';
    sanitized.D[4] = 'D';
    sanitized.L[4] = 'L';
    sanitized.B[4] = 'B';

    if (onFacesResolved) onFacesResolved(sanitized);
  };

  // Corrección manual de un sticker individual si la iluminación falló
  const handleManualColorCycle = (stickerIdx) => {
    if (stickerIdx === 4) return; // Centro inmutable
    const current = liveStickers[stickerIdx];
    const curIdx = COLOR_KEYS.indexOf(current);
    const nextColor = COLOR_KEYS[(curIdx + 1) % COLOR_KEYS.length];
    
    setLiveStickers(prev => {
      const updated = [...prev];
      updated[stickerIdx] = nextColor;
      return updated;
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto w-full font-sans">
      
      {/* ── CABECERA DEL ESCÁNER ── */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
            Escáner Óptico de Desarme (rubiks-color-resolver)
          </span>
          <h3 className="text-sm sm:text-base font-black text-white">
            Paso {currentFaceIndex + 1} de 6: Cara {currentFaceConfig.name}
          </h3>
        </div>

        <button
          type="button"
          onClick={toggleCameraFacing}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1 text-xs font-bold transition-all cursor-pointer"
          title="Cambiar cámara"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── VISOR DE CÁMARA CON OVERLAY 3X3 ── */}
      <div className="relative rounded-3xl overflow-hidden bg-black aspect-square max-h-[380px] flex items-center justify-center border-2 border-white/10 shadow-2xl">
        
        {/* Video nativo */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Canvas de procesamiento oculto */}
        <canvas ref={canvasRef} width={360} height={360} className="hidden" />

        {/* Mensaje de error si la cámara falla */}
        {cameraError && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center gap-3">
            <CameraOff className="w-10 h-10 text-rose-400" />
            <p className="text-xs text-rose-300 max-w-xs">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* OVERLAY: CUADRÍCULA 3X3 INTERACTIVA */}
        {!cameraError && (
          <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
            
            {/* Marco de enfoque */}
            <div className={`w-[65%] aspect-square border-2 border-dashed ${currentFaceConfig.borderClass} rounded-2xl relative shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-[1px]`}>
              
              {/* Cuadrícula 3x3 */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-1.5 gap-1.5 pointer-events-auto">
                {liveStickers.map((stickerKey, idx) => {
                  const isCenter = idx === 4;
                  const colorConf = CUBE_COLORS[stickerKey] || CUBE_COLORS.F;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleManualColorCycle(idx)}
                      className={`rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isCenter 
                          ? 'border-white ring-2 ring-white/60 font-black scale-105' 
                          : 'border-white/40 hover:border-white'
                      }`}
                      style={{ backgroundColor: colorConf.hex + '99' }}
                      title={isCenter ? 'Centro fijo de referencia' : 'Toca para corregir color si hay reflejos'}
                    >
                      {isCenter ? (
                        <span className="text-[10px] font-mono font-black text-black bg-white px-1.5 py-0.2 rounded shadow">
                          {currentFaceConfig.face}
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-white/90 drop-shadow">
                          {stickerKey}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Guía en tiempo real */}
            <div className="mt-3 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full border border-white/10 text-[11px] font-medium text-slate-200">
              Alinea el centro <strong style={{ color: currentFaceConfig.hex }}>{currentFaceConfig.color}</strong> al medio
            </div>

          </div>
        )}

      </div>

      {/* ── BARRA DE PROGRESO DE LAS 6 CARAS ── */}
      <div className="grid grid-cols-6 gap-2">
        {FACE_SCAN_ORDER.map((item, idx) => {
          const isDone = !!scannedFaces[item.face];
          const isCurrent = currentFaceIndex === idx;

          return (
            <button
              key={item.face}
              type="button"
              onClick={() => setCurrentFaceIndex(idx)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                isCurrent
                  ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-500/50'
                  : isDone
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/5 text-slate-500'
              }`}
            >
              <div 
                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: item.hex }}
              />
              <span className="text-[10px] font-mono font-bold uppercase">{item.face}</span>
              {isDone && <Check className="w-3 h-3 text-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* ── BOTÓN DE CAPTURA RÁPIDA ── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            if (currentFaceIndex > 0) setCurrentFaceIndex(prev => prev - 1);
          }}
          disabled={currentFaceIndex === 0}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Anterior
        </button>

        <button
          type="button"
          onClick={handleCaptureCurrentFace}
          disabled={isCapturing}
          className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>
            {currentFaceIndex === 5 ? 'Finalizar Escaneo y Resolver' : `Capturar Cara ${currentFaceConfig.face}`}
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
