// AnalysisHistoryContext.tsx - Sistema de Historial de Análisis Cognitivo
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnalysisGameSession } from '../types';
import { saveAnalysisGameSession } from '../data/firebase';

interface AnalysisHistoryContextType {
  gameHistory: AnalysisGameSession[];
  addSession: (session: AnalysisGameSession) => void;
  clearHistory: () => void;
  getSessionsByUser: (userId: string) => AnalysisGameSession[];
  getSessionsByGame: (gameId: string) => AnalysisGameSession[];
}

const AnalysisHistoryContext = createContext<AnalysisHistoryContextType | undefined>(undefined);

export const useAnalysisHistory = () => {
  const context = useContext(AnalysisHistoryContext);
  if (!context) {
    throw new Error('useAnalysisHistory debe usarse dentro de AnalysisHistoryProvider');
  }
  return context;
};

interface AnalysisHistoryProviderProps {
  children: ReactNode;
}

export const AnalysisHistoryProvider = ({ children }: AnalysisHistoryProviderProps) => {
  const [gameHistory, setGameHistory] = useState<AnalysisGameSession[]>([]);

  // Cargar historial desde localStorage al iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('cognimirror_analysis_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setGameHistory(parsed);
        console.log(`📚 [Historial] Cargadas ${parsed.length} sesiones desde localStorage`);
      } catch (error) {
        console.error('Error cargando historial:', error);
      }
    }
  }, []);

  // Guardar historial en localStorage cada vez que cambia
  useEffect(() => {
    if (gameHistory.length > 0) {
      localStorage.setItem('cognimirror_analysis_history', JSON.stringify(gameHistory));
      console.log(`💾 [Historial] ${gameHistory.length} sesiones guardadas en localStorage`);
    }
  }, [gameHistory]);

  const addSession = async (session: AnalysisGameSession) => {
    // Guardar en estado local
    setGameHistory(prev => [...prev, session]);
    console.log(`➕ [Historial] Nueva sesión agregada - ${session.gameId} - Max Span: ${session.metrics.maxSpan}`);
    
    // Guardar en Firebase automáticamente
    try {
      await saveAnalysisGameSession(session);
      console.log('☁️ [Historial] Sesión sincronizada con Firebase');
    } catch (error) {
      console.error('⚠️ [Historial] Error sincronizando con Firebase (continuando en local):', error);
    }
  };

  const clearHistory = () => {
    setGameHistory([]);
    localStorage.removeItem('cognimirror_analysis_history');
    console.log('🗑️ [Historial] Historial limpiado');
  };

  const getSessionsByUser = (userId: string) => {
    return gameHistory.filter(session => session.userId === userId);
  };

  const getSessionsByGame = (gameId: string) => {
    return gameHistory.filter(session => session.gameId === gameId);
  };

  return (
    <AnalysisHistoryContext.Provider
      value={{
        gameHistory,
        addSession,
        clearHistory,
        getSessionsByUser,
        getSessionsByGame
      }}
    >
      {children}
    </AnalysisHistoryContext.Provider>
  );
};
