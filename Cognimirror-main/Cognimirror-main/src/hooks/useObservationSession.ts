// src/hooks/useObservationSession.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { metrics } from '../services/metrics';
import { useAuth } from '../context/AuthContext';
import { GameType, GameRound } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useObservationSession = (patientId?: string) => {
  const { currentUser } = useAuth();
  const [isObserving, setIsObserving] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const roundsRef = useRef<GameRound[]>([]);

  const startObservation = useCallback(async (gameType: GameType = 'observer_dashboard'): Promise<string | undefined> => {
    if (!currentUser?.id || !patientId) return;
    
    const newSessionId = `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    roundsRef.current = [];
    
    try {
      await metrics.startObservationSession({
        sessionId: newSessionId,
        observerId: currentUser.id,
        patientId,
        startTime: Date.now(),
        game: gameType,
        metrics: {
          events: [],
          notes: [],
          rounds: [],
          startTime: Date.now(),
          stats: {
            totalRounds: 0,
            totalCorrect: 0,
            totalIncorrect: 0,
            totalSkipped: 0,
            accuracy: 0,
            averageTimePerRound: 0
          }
        }
      });
      
      setIsObserving(true);
      return newSessionId;
    } catch (error) {
      console.error('Error al iniciar la sesión de observación:', error);
      setSessionId('');
      return undefined;
    }
  }, [currentUser, patientId]);

  const startRound = useCallback((metadata?: Record<string, unknown>): string => {
    if (!isObserving || !sessionId) return '';
    
    const roundId = `round_${uuidv4()}`;
    const newRound: GameRound = {
      roundId,
      startTime: Date.now(),
      correct: 0,
      incorrect: 0,
      skipped: 0,
      metadata
    };
    
    setCurrentRound(newRound);
    return roundId;
  }, [isObserving, sessionId]);

  const endRound = useCallback((roundId: string): void => {
    if (!isObserving || !sessionId || !currentRound || currentRound.roundId !== roundId) return;
    
    const now = Date.now();
    const completedRound: GameRound = {
      ...currentRound,
      endTime: now,
      duration: now - currentRound.startTime
    };
    
    // Agregar la ronda completada al historial
    roundsRef.current = [...roundsRef.current, completedRound];
    
    // Actualizar métricas en tiempo real
    updateSessionMetrics(completedRound);
    
    setCurrentRound(null);
  }, [isObserving, sessionId, currentRound]);

  const recordRoundResult = useCallback((roundId: string, result: 'correct' | 'incorrect' | 'skipped'): void => {
    if (!isObserving || !sessionId || !currentRound || currentRound.roundId !== roundId) return;
    
    setCurrentRound(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [result]: prev[result] + 1
      };
    });
  }, [isObserving, sessionId, currentRound]);

  const updateSessionMetrics = useCallback(async (completedRound: GameRound) => {
    if (!sessionId) return;
    
    try {
      const session = await metrics.getObservationSession(sessionId);
      if (!session) return;
      
      const updatedRounds = [...(session.metrics?.rounds || []), completedRound];
      const stats = calculateSessionStats(updatedRounds);
      
      await metrics.updateObservationSession(sessionId, {
        'metrics.rounds': updatedRounds,
        'metrics.stats': stats,
        'metrics.lastUpdated': Date.now()
      });
      
    } catch (error) {
      console.error('Error actualizando métricas de sesión:', error);
    }
  }, [sessionId]);
  
  const calculateSessionStats = (rounds: GameRound[]) => {
    const totalRounds = rounds.length;
    const totalCorrect = rounds.reduce((sum, round) => sum + round.correct, 0);
    const totalIncorrect = rounds.reduce((sum, round) => sum + round.incorrect, 0);
    const totalSkipped = rounds.reduce((sum, round) => sum + round.skipped, 0);
    const totalAttempts = totalCorrect + totalIncorrect + totalSkipped;
    const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const totalDuration = rounds.reduce((sum, round) => sum + (round.duration || 0), 0);
    const averageTimePerRound = totalRounds > 0 ? totalDuration / totalRounds : 0;
    
    return {
      totalRounds,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      accuracy: parseFloat(accuracy.toFixed(2)),
      averageTimePerRound: Math.round(averageTimePerRound)
    };
  };

  const endObservation = useCallback(async (notes: string = 'Sesión finalizada'): Promise<void> => {
    if (!sessionId) return;
    
    try {
      // Finalizar la ronda actual si existe
      if (currentRound) {
        endRound(currentRound.roundId);
      }
      
      // Actualizar la sesión con las notas finales
      await metrics.endObservationSession(sessionId, {
        endTime: Date.now(),
        notes,
        'metrics.endTime': Date.now(),
        'metrics.duration': Date.now() - (currentRound?.startTime || Date.now())
      });
      
      // Resetear el estado
      setIsObserving(false);
      setSessionId('');
      setCurrentRound(null);
      roundsRef.current = [];
    } catch (error) {
      console.error('Error al finalizar la sesión de observación:', error);
      throw error;
    }
  }, [sessionId, currentRound]);

  const recordEvent = useCallback((type: string, data?: Record<string, unknown>): void => {
    if (!isObserving || !sessionId) return;
    
    try {
      metrics.recordObservationEvent(sessionId, {
        type,
        timestamp: Date.now(),
        data
      });
    } catch (error) {
      console.error('Error al registrar evento de observación:', error);
    }
  }, [isObserving, sessionId]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (isObserving && sessionId) {
        endObservation('Sesión finalizada por navegación').catch(console.error);
      }
    };
  }, [isObserving, sessionId, endObservation]);

  return {
    // Estado
    isObserving,
    sessionId,
    currentRound,
    rounds: roundsRef.current,
    
    // Acciones de sesión
    startObservation,
    endObservation,
    
    // Acciones de ronda
    startRound,
    endRound,
    recordRoundResult,
    
    // Eventos
    recordEvent
  };
};