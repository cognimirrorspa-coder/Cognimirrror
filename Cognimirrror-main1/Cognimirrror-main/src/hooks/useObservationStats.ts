import { useState, useEffect, useCallback } from 'react';
import { getPatientObservationSessions } from '../data/firebase';
import { ObservationSession } from '../types';

export interface GameStats {
  game: string;
  count: number;
  totalDuration: number;
  lastPlayed?: number;
  avgDuration: number;
  totalRounds: number;
  avgRoundsPerSession: number;
  successRate: number;
  avgTimePerRound: number;
}

export interface GameComparison {
  mostPlayedGame: string;
  bestPerformanceGame: string;
  mostImprovedGame: string;
  gamesPerformance: Array<{
    game: string;
    playCount: number;
    avgDuration: number;
    successRate: number;
    improvement: number;
  }>;
}

export interface ObservationStatsResult {
  // Estadísticas básicas
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
  sessionsByGame: GameStats[];
  lastSessions: ObservationSession[];
  
  // Métricas comparativas
  gameComparison: GameComparison;
  
  // Estados
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const useObservationStats = (patientId: string | null): ObservationStatsResult => {
  const [stats, setStats] = useState<Omit<ObservationStatsResult, 'refresh'>>({
    totalSessions: 0,
    totalDuration: 0,
    averageDuration: 0,
    sessionsByGame: [],
    lastSessions: [],
    gameComparison: {
      mostPlayedGame: 'N/A',
      bestPerformanceGame: 'N/A',
      mostImprovedGame: 'N/A',
      gamesPerformance: []
    },
    loading: true,
    error: null
  });

  const calculateGameMetrics = useCallback((sessions: ObservationSession[]): Record<string, GameStats> => {
    const gameStats: Record<string, GameStats> = {};
    
    sessions.forEach(session => {
      const { game, duration = 0, metrics } = session;
      const rounds = metrics?.rounds || [];
      const totalRounds = rounds.length;
      const successfulRounds = rounds.filter(round => round.correct).length;
      const successRate = totalRounds > 0 ? (successfulRounds / totalRounds) * 100 : 0;
      
      if (!gameStats[game]) {
        gameStats[game] = {
          game,
          count: 0,
          totalDuration: 0,
          totalRounds: 0,
          successRate: 0,
          avgDuration: 0,
          avgRoundsPerSession: 0,
          avgTimePerRound: 0,
          lastPlayed: 0
        };
      }
      
      gameStats[game].count += 1;
      gameStats[game].totalDuration += duration;
      gameStats[game].totalRounds += totalRounds;
      gameStats[game].successRate = ((gameStats[game].successRate || 0) * (gameStats[game].count - 1) + successRate) / gameStats[game].count;
      gameStats[game].lastPlayed = Math.max(gameStats[game].lastPlayed || 0, session.startTime);
    });

    // Calcular promedios
    Object.values(gameStats).forEach(stat => {
      stat.avgDuration = stat.totalDuration / stat.count;
      stat.avgRoundsPerSession = stat.totalRounds / stat.count;
      stat.avgTimePerRound = stat.totalDuration / (stat.totalRounds || 1);
    });

    return gameStats;
  }, []);
  const gameStats: Record<string, GameStats> = {};
  
  sessions.forEach(session => {
    const { game, duration = 0, metrics } = session;
    const rounds = metrics?.rounds || [];
    const totalRounds = rounds.length;
    const successfulRounds = rounds.filter(round => round.correct).length;
    const successRate = totalRounds > 0 ? (successfulRounds / totalRounds) * 100 : 0;
    
    if (!gameStats[game]) {
      gameStats[game] = {
        game,
        count: 0,
        totalDuration: 0,
        totalRounds: 0,
        successRate: 0,
        avgDuration: 0,
        avgRoundsPerSession: 0,
        avgTimePerRound: 0,
        lastPlayed: 0
      };
    }
    
    gameStats[game].count += 1;
    gameStats[game].totalDuration += duration;
    gameStats[game].totalRounds += totalRounds;
    gameStats[game].successRate = ((gameStats[game].successRate || 0) * (gameStats[game].count - 1) + successRate) / gameStats[game].count;
    gameStats[game].lastPlayed = Math.max(gameStats[game].lastPlayed || 0, session.startTime);
  });

  // Calcular promedios
  Object.values(gameStats).forEach(stat => {
    stat.avgDuration = stat.totalDuration / stat.count;
    stat.avgRoundsPerSession = stat.totalRounds / stat.count;
    stat.avgTimePerRound = stat.totalDuration / (stat.totalRounds || 1);
  });

  return gameStats;
};

// Función para comparar juegos
const compareGames = (gameStats: Record<string, GameStats>): GameComparison => {
  const games = Object.values(gameStats);
  
  if (games.length === 0) {
    return {
      mostPlayedGame: 'N/A',
      bestPerformanceGame: 'N/A',
      mostImprovedGame: 'N/A',
      gamesPerformance: []
    };
  }

  // Ordenar por número de partidas
  const byPlayCount = [...games].sort((a, b) => b.count - a.count);
  
  // Ordenar por tasa de éxito
  const bySuccessRate = [...games].sort((a, b) => (b.successRate || 0) - (a.successRate || 0));
  
  // Calcular mejora (asumiendo que las sesiones más recientes son mejores)
  const gamesWithImprovement = games.map(game => {
    // Implementar lógica de mejora basada en el tiempo
    // Esto es un ejemplo simplificado
    return {
      ...game,
      improvement: 0 // Implementar lógica real de mejora
    };
  });

  const compareGames = useCallback((gameStats: Record<string, GameStats>): GameComparison => {
    const games = Object.values(gameStats);
    
    if (games.length === 0) {
      return {
        mostPlayedGame: 'N/A',
        bestPerformanceGame: 'N/A',
        mostImprovedGame: 'N/A',
        gamesPerformance: []
      };
    }

    // Ordenar por número de partidas
    const byPlayCount = [...games].sort((a, b) => b.count - a.count);
    
    // Ordenar por tasa de éxito
    const bySuccessRate = [...games].sort((a, b) => (b.successRate || 0) - (a.successRate || 0));
    
    // Ordenar por mejora (usando la tasa de éxito como proxy por ahora)
    const byImprovement = [...games].sort((a, b) => (b.successRate || 0) - (a.successRate || 0));

    return {
      mostPlayedGame: byPlayCount[0]?.game || 'N/A',
      bestPerformanceGame: bySuccessRate[0]?.game || 'N/A',
      mostImprovedGame: byImprovement[0]?.game || 'N/A',
      gamesPerformance: games.map(game => ({
        game: game.game,
        playCount: game.count,
        avgDuration: game.avgDuration,
        successRate: game.successRate || 0,
        improvement: 0 // Implementar lógica de mejora real
      }))
    };
    },
    loading: true,
    error: null
  });

  const calculateGameMetrics = useCallback((sessions: ObservationSession[]): Record<string, GameStats> => {
    const gameStats: Record<string, GameStats> = {};
    
    sessions.forEach(session => {
      const { game, duration = 0, metrics } = session;
      const rounds = metrics?.rounds || [];
      const totalRounds = rounds.length;
      const successfulRounds = rounds.filter(round => round.correct).length;
      const successRate = totalRounds > 0 ? (successfulRounds / totalRounds) * 100 : 0;
      
      if (!gameStats[game]) {
        gameStats[game] = {
          game,
          count: 0,
          totalDuration: 0,
          totalRounds: 0,
          successRate: 0,
          avgDuration: 0,
          avgRoundsPerSession: 0,
          avgTimePerRound: 0,
          lastPlayed: 0
        };
      }
      
      gameStats[game].count += 1;
      gameStats[game].totalDuration += duration;
      gameStats[game].totalRounds += totalRounds;
      gameStats[game].successRate = ((gameStats[game].successRate || 0) * (gameStats[game].count - 1) + successRate) / gameStats[game].count;
      gameStats[game].lastPlayed = Math.max(gameStats[game].lastPlayed || 0, session.startTime);
    });

    // Calcular promedios
    Object.values(gameStats).forEach(stat => {
      stat.avgDuration = stat.totalDuration / stat.count;
      stat.avgRoundsPerSession = stat.totalRounds / stat.count;
      stat.avgTimePerRound = stat.totalDuration / (stat.totalRounds || 1);
    });

    return gameStats;
  }, []);

  const compareGames = useCallback((gameStats: Record<string, GameStats>): GameComparison => {
    const games = Object.values(gameStats);
    
    if (games.length === 0) {
      return {
        mostPlayedGame: 'N/A',
        bestPerformanceGame: 'N/A',
        mostImprovedGame: 'N/A',
        gamesPerformance: []
      };
    }

    // Ordenar por número de partidas
    const byPlayCount = [...games].sort((a, b) => b.count - a.count);
    
    // Ordenar por tasa de éxito
    const bySuccessRate = [...games].sort((a, b) => (b.successRate || 0) - (a.successRate || 0));
    
    // Ordenar por mejora (usando la tasa de éxito como proxy por ahora)
    const byImprovement = [...games].sort((a, b) => (b.successRate || 0) - (a.successRate || 0));

    return {
      mostPlayedGame: byPlayCount[0]?.game || 'N/A',
      bestPerformanceGame: bySuccessRate[0]?.game || 'N/A',
      mostImprovedGame: byImprovement[0]?.game || 'N/A',
      gamesPerformance: games.map(game => ({
        game: game.game,
  const fetchStats = useCallback(async () => {
    if (!patientId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      // Obtener todas las sesiones del paciente
      const sessions = await getPatientObservationSessions(patientId);
      
      if (!sessions || sessions.length === 0) {
        setStats({
          totalSessions: 0,
          totalDuration: 0,
          averageDuration: 0,
          sessionsByGame: [],
          lastSessions: [],
          gameComparison: {
            mostPlayedGame: 'N/A',
            bestPerformanceGame: 'N/A',
            mostImprovedGame: 'N/A',
            gamesPerformance: []
          },
          loading: false,
          error: null
        });
        return;
      }

      // Calcular métricas básicas
      const totalSessions = sessions.length;
      const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

      // Calcular métricas por juego
      const gameStats = calculateGameMetrics(sessions);
      const gameComparison = compareGames(gameStats);

      // Ordenar sesiones por fecha (más recientes primero)
      const lastSessions = [...sessions]
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 5);

      setStats({
        totalSessions,
        totalDuration,
        averageDuration,
        sessionsByGame: Object.values(gameStats),
        lastSessions,
        gameComparison,
        loading: false,
        error: null
      });
      
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar las estadísticas. Intenta de nuevo más tarde.'
      }));
    }
  }, [patientId, calculateGameMetrics, compareGames]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...stats,
    refresh: fetchStats,
  };
};

export default useObservationStats;
