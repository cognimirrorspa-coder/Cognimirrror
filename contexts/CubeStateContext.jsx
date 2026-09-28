'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useBluetoothCube } from './BluetoothContext';
import { getFacesFromMoves, applyMoveToFaces, facesToString, stringToFaces } from '../utils/kociembaSolver';

const CubeStateContext = createContext(null);

const SOLVED_FACES = {
  U: Array(9).fill('U'),
  R: Array(9).fill('R'),
  F: Array(9).fill('F'),
  D: Array(9).fill('D'),
  L: Array(9).fill('L'),
  B: Array(9).fill('B')
};

export function CubeStateProvider({ children }) {
  const { subscribeToMoves, subscribeToGyro } = useBluetoothCube();
  
  // ── ESTADO PERSISTENTE DE MOVIMIENTOS ──
  // Se restaura de localStorage para que navegar entre pestañas NUNCA desincronice el cubo
  const [moveHistory, setMoveHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('COGNIMIRROR_CUBE_MOVES');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Error leyendo COGNIMIRROR_CUBE_MOVES:', e);
      }
    }
    return [];
  });

  // ── ESTADO DE LAS 54 FACETAS (CANÓNICO) ──
  const [cubeFaces, setCubeFaces] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFaces = localStorage.getItem('COGNIMIRROR_CUBE_FACES');
        if (savedFaces) return JSON.parse(savedFaces);
        const savedMoves = localStorage.getItem('COGNIMIRROR_CUBE_MOVES');
        if (savedMoves) {
          const parsed = JSON.parse(savedMoves);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return getFacesFromMoves(parsed);
          }
        }
      } catch (e) {
        console.warn('Error calculando cubeFaces inicial:', e);
      }
    }
    return SOLVED_FACES;
  });

  const [cubeRotation, setCubeRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isCubesyncActive, setIsCubesyncActive] = useState(true);

  // Escuchar movimientos globales desde el sensor Bluetooth o simulación
  useEffect(() => {
    const unsub = subscribeToMoves((move) => {
      if (!move) return;

      setMoveHistory(prev => {
        const nextMoves = [...prev, move];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('COGNIMIRROR_CUBE_MOVES', JSON.stringify(nextMoves));
          } catch (_) {}
        }
        return nextMoves;
      });

      setCubeFaces(prevFaces => {
        const nextFaces = applyMoveToFaces(prevFaces || SOLVED_FACES, move);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('COGNIMIRROR_CUBE_FACES', JSON.stringify(nextFaces));
          } catch (_) {}
        }
        return nextFaces;
      });
    });

    return () => unsub();
  }, [subscribeToMoves]);

  // Escuchar rotación global
  useEffect(() => {
    const unsub = subscribeToGyro((data) => {
      if (data) setCubeRotation(data);
    });
    return () => unsub();
  }, [subscribeToGyro]);

  // Reiniciar estado a cubo armado
  const resetCubeState = useCallback(() => {
    setMoveHistory([]);
    setCubeFaces(SOLVED_FACES);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('COGNIMIRROR_CUBE_MOVES');
        localStorage.setItem('COGNIMIRROR_CUBE_FACES', JSON.stringify(SOLVED_FACES));
      } catch (_) {}
    }
  }, []);

  // Establecer estado personalizado (desde escaneo por cámara o pintor 3D)
  const setCustomCubeState = useCallback((newFaces, customMoves = []) => {
    if (newFaces) {
      setCubeFaces(newFaces);
      setMoveHistory(customMoves);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('COGNIMIRROR_CUBE_FACES', JSON.stringify(newFaces));
          localStorage.setItem('COGNIMIRROR_CUBE_MOVES', JSON.stringify(customMoves));
        } catch (_) {}
      }
    }
  }, []);

  const value = {
    moveHistory,
    setMoveHistory,
    cubeFaces,
    setCubeFaces,
    setCustomCubeState,
    cubeRotation,
    resetCubeState,
    isCubesyncActive,
    setIsCubesyncActive
  };

  return (
    <CubeStateContext.Provider value={value}>
      {children}
    </CubeStateContext.Provider>
  );
}

export function useCubeState() {
  const context = useContext(CubeStateContext);
  if (!context) {
    throw new Error('useCubeState debe ser usado dentro de un CubeStateProvider');
  }
  return context;
}
