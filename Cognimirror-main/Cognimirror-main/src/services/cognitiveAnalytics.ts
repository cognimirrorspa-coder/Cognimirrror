// cognitiveAnalytics.ts - Servicio de Análisis Cognitivo Avanzado
import { db } from '../data/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SessionAttempt {
  timestamp: number;
  timeTaken: number;
  isCorrect: boolean;
  level?: number;
  selfCorrectionIndex?: number;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  gameId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  totalSessionTime?: number;
  attempts: SessionAttempt[];
  metrics?: any;
}

export interface UserCognitiveMetrics {
  userId: string;
  userName?: string;
  
  // Métricas básicas
  totalSessions: number;
  totalAttempts: number;
  successfulAttempts: number;
  
  // Métricas de rendimiento
  averageTimeTaken: number;
  accuracy: number;
  maxLevel: number;
  totalSessionTime: number;
  
  // Métricas avanzadas
  correctionIndex: number;
  mistakeRate: number;
  improvementRate: number;
  
  // Evolución temporal
  evolution: {
    date: string;
    level: number;
    accuracy: number;
    avgTime: number;
    sessionDuration: number;
  }[];
  
  // Perfil cognitivo
  cognitiveProfile: {
    logicalMathematical: number;  // 0-100
    spatial: number;              // 0-100
    intrapersonal: number;        // 0-100
    interpersonal: number;        // 0-100
    attentional: number;          // 0-100
  };
  
  // Interpretación
  dominantIntelligence: string;
  strengths: string[];
  interpretation: string;
}

export interface CognitiveRanking {
  userId: string;
  userName?: string;
  overallScore: number;
  rank: number;
  accuracy: number;
  maxLevel: number;
  totalSessions: number;
}

export interface GameSpecificStats {
  gameId: string;
  gameName: string;
  totalSessions: number;
  totalRoundsPlayed: number;
  maxRoundReached: number;
  totalPlayTime: number;
  retryCount: number;
  totalMistakes: number;
  averageRoundsPerSession: number;
  completionRate: number;
  lastPlayed: string;
  sessions: {
    date: string;
    roundsPlayed: number;
    maxRound: number;
    duration: number;
    completed: boolean;
    mistakes: number;
  }[];
}

export interface UserGameAnalysis {
  userId: string;
  userName?: string;
  gameStats: GameSpecificStats[];
  totalGamesPlayed: number;
  favoriteGame: string;
  totalPlayTime: number;
}

// ============================================================================
// SERVICIO DE ANÁLISIS COGNITIVO
// ============================================================================

class CognitiveAnalyticsService {
  private static instance: CognitiveAnalyticsService;
  
  private constructor() {}
  
  public static getInstance(): CognitiveAnalyticsService {
    if (!CognitiveAnalyticsService.instance) {
      CognitiveAnalyticsService.instance = new CognitiveAnalyticsService();
    }
    return CognitiveAnalyticsService.instance;
  }
  
  /**
   * Obtiene datos combinados de las tres colecciones para un usuario
   */
  public async getUserCombinedData(userId: string): Promise<SessionData[]> {
    try {
      const sessions: SessionData[] = [];
      console.log(`🔍 [Analytics] Buscando datos para usuario: ${userId}`);
      
      // 1. Obtener analysisGameSessions
      try {
        const analysisRef = collection(db, 'analysisGameSessions');
        // Intentar con orderBy primero
        let analysisQuery = query(
          analysisRef,
          where('userId', '==', userId),
          orderBy('startTime', 'asc')
        );
        
        let analysisSnapshot;
        try {
          analysisSnapshot = await getDocs(analysisQuery);
        } catch (indexError: any) {
          // Si falla por falta de índice, intentar sin orderBy
          console.warn('⚠️ [Analytics] Índice no disponible, consultando sin orderBy');
          analysisQuery = query(
            analysisRef,
            where('userId', '==', userId)
          );
          analysisSnapshot = await getDocs(analysisQuery);
        }
        
        analysisSnapshot.forEach(doc => {
          const data = doc.data();
          // Convertir timestamps de string ISO a número si es necesario
          const startTime = typeof data.startTime === 'string' 
            ? new Date(data.startTime).getTime() 
            : data.startTime;
          const endTime = data.endTime 
            ? (typeof data.endTime === 'string' ? new Date(data.endTime).getTime() : data.endTime)
            : startTime;
          
          sessions.push({
            sessionId: doc.id,
            userId: data.userId,
            gameId: data.gameId || 'unknown',
            startTime: startTime,
            endTime: endTime,
            duration: endTime - startTime,
            totalSessionTime: endTime - startTime,
            attempts: this.extractAttemptsFromAnalysis(data),
            metrics: data.metrics
          });
        });
        console.log(`✅ [Analytics] analysisGameSessions: ${analysisSnapshot.size} sesiones`);
      } catch (error) {
        console.warn('⚠️ Error obteniendo analysisGameSessions:', error);
      }
      
      // 2. Obtener cognitiveSessions (OMITIR - ya está en analysisGameSessions)
      // Las sesiones se guardan en analysisGameSessions, no necesitamos duplicarlas
      console.log('ℹ️ [Analytics] Omitiendo cognitiveSessions para evitar duplicados');
      
      // 3. Obtener userTimeMetrics
      try {
        const timeRef = collection(db, 'userTimeMetrics');
        let timeQuery = query(
          timeRef,
          where('userId', '==', userId),
          orderBy('startTime', 'asc')
        );
        
        let timeSnapshot;
        try {
          timeSnapshot = await getDocs(timeQuery);
        } catch (indexError) {
          console.warn('⚠️ [Analytics] Índice no disponible, consultando sin orderBy');
          timeQuery = query(
            timeRef,
            where('userId', '==', userId)
          );
          timeSnapshot = await getDocs(timeQuery);
        }
        
        timeSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.games && data.games.length > 0) {
            data.games.forEach((game: any) => {
              sessions.push({
                sessionId: `${doc.id}_${game.gameName}`,
                userId: data.userId,
                gameId: game.gameName,
                startTime: game.startTime,
                endTime: game.endTime,
                duration: game.duration,
                totalSessionTime: game.duration,
                attempts: [],
                metrics: {
                  level: game.level,
                  score: game.score,
                  completed: game.completed
                }
              });
            });
          }
        });
        console.log(`✅ [Analytics] userTimeMetrics: ${timeSnapshot.size} documentos`);
      } catch (error) {
        console.warn('⚠️ Error obteniendo userTimeMetrics:', error);
      }
      
      // Ordenar por fecha
      sessions.sort((a, b) => a.startTime - b.startTime);
      
      console.log(`📊 [Analytics] TOTAL: ${sessions.length} sesiones encontradas para usuario ${userId}`);
      
      // Mostrar detalle de las sesiones encontradas
      if (sessions.length > 0) {
        console.log('📄 [Analytics] Detalle de sesiones:');
        sessions.forEach((s, i) => {
          console.log(`  ${i + 1}. ${s.gameId} - ${new Date(s.startTime).toLocaleString()} - ${s.attempts.length} intentos`);
        });
      } else {
        console.warn('⚠️ [Analytics] No se encontraron sesiones. Verifica:');
        console.warn('  1. Que el userId sea correcto:', userId);
        console.warn('  2. Que las sesiones se estén guardando en Firebase');
        console.warn('  3. Que el campo userId en Firebase coincida exactamente');
      }
      
      return sessions;
      
    } catch (error) {
      console.error('❌ Error obteniendo datos combinados:', error);
      return [];
    }
  }
  
  /**
   * Extrae intentos de analysisGameSessions
   */
  private extractAttemptsFromAnalysis(data: any): SessionAttempt[] {
    const attempts: SessionAttempt[] = [];
    
    // Extraer de rounds si existe
    if (data.rounds && Array.isArray(data.rounds)) {
      data.rounds.forEach((round: any) => {
        // Cada round puede tener múltiples taps
        if (round.taps && Array.isArray(round.taps)) {
          round.taps.forEach((tap: any) => {
            attempts.push({
              timestamp: tap.timestamp || data.startTime,
              timeTaken: tap.timeTaken || 0,
              isCorrect: tap.isCorrect || false,
              level: round.level || 0,
              selfCorrectionIndex: tap.selfCorrectionIndex
            });
          });
        } else {
          // Si no hay taps, crear un intento por el round
          attempts.push({
            timestamp: round.startTime || data.startTime,
            timeTaken: round.duration || 0,
            isCorrect: round.correct > 0,
            level: round.level || 0,
            selfCorrectionIndex: round.metadata?.selfCorrectionIndex
          });
        }
      });
    }
    
    return attempts;
  }
  
  /**
   * Extrae intentos de cognitiveSessions
   */
  private extractAttemptsFromCognitive(data: any): SessionAttempt[] {
    const attempts: SessionAttempt[] = [];
    
    if (data.attempts) {
      data.attempts.forEach((attempt: any) => {
        attempts.push({
          timestamp: attempt.timestamp || data.startTime,
          timeTaken: attempt.timeTaken || 0,
          isCorrect: attempt.isCorrect || false,
          level: attempt.level,
          selfCorrectionIndex: attempt.selfCorrectionIndex
        });
      });
    }
    
    return attempts;
  }
  
  /**
   * Calcula métricas cognitivas para un usuario
   */
  public async calculateUserMetrics(userId: string, userName?: string): Promise<UserCognitiveMetrics> {
    const sessions = await this.getUserCombinedData(userId);
    
    if (sessions.length === 0) {
      return this.getEmptyMetrics(userId, userName);
    }
    
    // Calcular métricas básicas
    const totalSessions = sessions.length;
    const allAttempts = sessions.flatMap(s => s.attempts);
    const totalAttempts = allAttempts.length;
    const successfulAttempts = allAttempts.filter(a => a.isCorrect).length;
    
    // Métricas de rendimiento
    const averageTimeTaken = totalAttempts > 0
      ? allAttempts.reduce((sum, a) => sum + a.timeTaken, 0) / totalAttempts
      : 0;
    
    const accuracy = totalAttempts > 0
      ? (successfulAttempts / totalAttempts) * 100
      : 0;
    
    const maxLevel = Math.max(
      ...sessions.map(s => s.metrics?.level || 0),
      ...allAttempts.map(a => a.level || 0),
      0
    );
    
    const totalSessionTime = sessions.reduce((sum, s) => sum + (s.totalSessionTime || s.duration || 0), 0);
    
    // Métricas avanzadas
    const correctionIndex = this.calculateCorrectionIndex(allAttempts);
    const mistakeRate = this.calculateMistakeRate(allAttempts);
    const improvementRate = this.calculateImprovementRate(sessions);
    
    // Evolución temporal
    const evolution = this.calculateEvolution(sessions);
    
    // Perfil cognitivo
    const cognitiveProfile = this.calculateCognitiveProfile({
      accuracy,
      averageTimeTaken,
      maxLevel,
      correctionIndex,
      totalSessions,
      improvementRate,
      totalSessionTime
    });
    
    // Interpretación
    const { dominantIntelligence, strengths, interpretation } = this.interpretCognitiveProfile(cognitiveProfile);
    
    return {
      userId,
      userName,
      totalSessions,
      totalAttempts,
      successfulAttempts,
      averageTimeTaken,
      accuracy,
      maxLevel,
      totalSessionTime,
      correctionIndex,
      mistakeRate,
      improvementRate,
      evolution,
      cognitiveProfile,
      dominantIntelligence,
      strengths,
      interpretation
    };
  }
  
  /**
   * Calcula el índice de autocorrección
   */
  private calculateCorrectionIndex(attempts: SessionAttempt[]): number {
    const attemptsWithCorrection = attempts.filter(a => a.selfCorrectionIndex !== undefined);
    if (attemptsWithCorrection.length === 0) return 0;
    
    return attemptsWithCorrection.reduce((sum, a) => sum + (a.selfCorrectionIndex || 0), 0) / attemptsWithCorrection.length;
  }
  
  /**
   * Calcula la tasa de errores
   */
  private calculateMistakeRate(attempts: SessionAttempt[]): number {
    if (attempts.length === 0) return 0;
    const mistakes = attempts.filter(a => !a.isCorrect).length;
    return (mistakes / attempts.length) * 100;
  }
  
  /**
   * Calcula la tasa de mejora entre primeras y últimas sesiones
   */
  private calculateImprovementRate(sessions: SessionData[]): number {
    if (sessions.length < 2) return 0;
    
    const firstThird = sessions.slice(0, Math.ceil(sessions.length / 3));
    const lastThird = sessions.slice(-Math.ceil(sessions.length / 3));
    
    const firstAccuracy = this.getSessionsAccuracy(firstThird);
    const lastAccuracy = this.getSessionsAccuracy(lastThird);
    
    return lastAccuracy - firstAccuracy;
  }
  
  /**
   * Obtiene la precisión promedio de un conjunto de sesiones
   */
  private getSessionsAccuracy(sessions: SessionData[]): number {
    const allAttempts = sessions.flatMap(s => s.attempts);
    if (allAttempts.length === 0) return 0;
    
    const successful = allAttempts.filter(a => a.isCorrect).length;
    return (successful / allAttempts.length) * 100;
  }
  
  /**
   * Calcula la evolución temporal
   */
  private calculateEvolution(sessions: SessionData[]): UserCognitiveMetrics['evolution'] {
    return sessions.map(session => {
      const attempts = session.attempts;
      const accuracy = attempts.length > 0
        ? (attempts.filter(a => a.isCorrect).length / attempts.length) * 100
        : 0;
      
      const avgTime = attempts.length > 0
        ? attempts.reduce((sum, a) => sum + a.timeTaken, 0) / attempts.length
        : 0;
      
      const level = session.metrics?.level || Math.max(...attempts.map(a => a.level || 0), 0);
      
      return {
        date: new Date(session.startTime).toLocaleDateString('es-ES'),
        level,
        accuracy,
        avgTime,
        sessionDuration: session.totalSessionTime || session.duration || 0
      };
    });
  }
  
  /**
   * Calcula el perfil cognitivo basado en las métricas
   */
  private calculateCognitiveProfile(metrics: {
    accuracy: number;
    averageTimeTaken: number;
    maxLevel: number;
    correctionIndex: number;
    totalSessions: number;
    improvementRate: number;
    totalSessionTime: number;
  }): UserCognitiveMetrics['cognitiveProfile'] {
    // Inteligencia lógico-matemática: alta exactitud + bajo tiempo
    const logicalMathematical = Math.min(100, (
      (metrics.accuracy * 0.6) +
      (Math.max(0, 100 - (metrics.averageTimeTaken / 100)) * 0.4)
    ));
    
    // Inteligencia espacial: alta exactitud + alto nivel alcanzado
    const spatial = Math.min(100, (
      (metrics.accuracy * 0.5) +
      (Math.min(100, metrics.maxLevel * 10) * 0.5)
    ));
    
    // Inteligencia intrapersonal: alta autocorrección + pocos errores
    const intrapersonal = Math.min(100, (
      (metrics.correctionIndex * 10 * 0.6) +
      (Math.max(0, 100 - (100 - metrics.accuracy)) * 0.4)
    ));
    
    // Inteligencia interpersonal: muchas sesiones + mejora sostenida
    const interpersonal = Math.min(100, (
      (Math.min(100, metrics.totalSessions * 5) * 0.5) +
      (Math.max(0, 50 + metrics.improvementRate) * 0.5)
    ));
    
    // Atencional/concentración: alta duración y consistencia
    const attentional = Math.min(100, (
      (Math.min(100, metrics.totalSessionTime / 60000) * 0.4) +
      (metrics.accuracy * 0.6)
    ));
    
    return {
      logicalMathematical: Math.round(logicalMathematical),
      spatial: Math.round(spatial),
      intrapersonal: Math.round(intrapersonal),
      interpersonal: Math.round(interpersonal),
      attentional: Math.round(attentional)
    };
  }
  
  /**
   * Interpreta el perfil cognitivo
   */
  private interpretCognitiveProfile(profile: UserCognitiveMetrics['cognitiveProfile']): {
    dominantIntelligence: string;
    strengths: string[];
    interpretation: string;
  } {
    const intelligences = [
      { name: 'Lógico-Matemática', value: profile.logicalMathematical, key: 'logicalMathematical' },
      { name: 'Espacial', value: profile.spatial, key: 'spatial' },
      { name: 'Intrapersonal', value: profile.intrapersonal, key: 'intrapersonal' },
      { name: 'Interpersonal', value: profile.interpersonal, key: 'interpersonal' },
      { name: 'Atencional', value: profile.attentional, key: 'attentional' }
    ];
    
    // Ordenar por valor descendente
    intelligences.sort((a, b) => b.value - a.value);
    
    const dominantIntelligence = intelligences[0].name;
    const strengths = intelligences.filter(i => i.value >= 60).map(i => i.name);
    
    // Generar interpretación
    let interpretation = `El usuario muestra un perfil predominantemente ${dominantIntelligence.toLowerCase()}`;
    
    if (strengths.length > 1) {
      interpretation += ` con fortalezas en ${strengths.slice(0, -1).join(', ')} y ${strengths[strengths.length - 1]}.`;
    } else if (strengths.length === 1) {
      interpretation += `.`;
    }
    
    // Añadir detalles específicos
    if (profile.logicalMathematical >= 70) {
      interpretation += ' Demuestra excelente capacidad de razonamiento lógico y resolución de problemas.';
    }
    if (profile.spatial >= 70) {
      interpretation += ' Presenta habilidades espaciales destacadas y capacidad de visualización.';
    }
    if (profile.intrapersonal >= 70) {
      interpretation += ' Muestra alta capacidad de autocorrección y autoconocimiento.';
    }
    if (profile.interpersonal >= 70) {
      interpretation += ' Evidencia constancia y mejora progresiva en el tiempo.';
    }
    if (profile.attentional >= 70) {
      interpretation += ' Demuestra excelente capacidad de concentración y atención sostenida.';
    }
    
    return {
      dominantIntelligence,
      strengths,
      interpretation
    };
  }
  
  /**
   * Obtiene métricas vacías para un usuario sin datos
   */
  private getEmptyMetrics(userId: string, userName?: string): UserCognitiveMetrics {
    return {
      userId,
      userName,
      totalSessions: 0,
      totalAttempts: 0,
      successfulAttempts: 0,
      averageTimeTaken: 0,
      accuracy: 0,
      maxLevel: 0,
      totalSessionTime: 0,
      correctionIndex: 0,
      mistakeRate: 0,
      improvementRate: 0,
      evolution: [],
      cognitiveProfile: {
        logicalMathematical: 0,
        spatial: 0,
        intrapersonal: 0,
        interpersonal: 0,
        attentional: 0
      },
      dominantIntelligence: 'Sin datos',
      strengths: [],
      interpretation: 'No hay suficientes datos para generar un análisis cognitivo.'
    };
  }
  
  /**
   * Obtiene métricas para múltiples usuarios
   */
  public async calculateMultipleUsersMetrics(userIds: string[]): Promise<UserCognitiveMetrics[]> {
    const metricsPromises = userIds.map(userId => this.calculateUserMetrics(userId));
    return Promise.all(metricsPromises);
  }
  
  /**
   * Genera ranking de usuarios por desempeño cognitivo
   */
  public async generateCognitiveRanking(userIds: string[]): Promise<CognitiveRanking[]> {
    const allMetrics = await this.calculateMultipleUsersMetrics(userIds);
    
    const ranking: CognitiveRanking[] = allMetrics.map(metrics => {
      // Calcular puntuación general
      const overallScore = (
        metrics.accuracy * 0.3 +
        Math.min(100, metrics.maxLevel * 10) * 0.2 +
        Math.min(100, metrics.totalSessions * 5) * 0.2 +
        Math.max(0, 100 - metrics.mistakeRate) * 0.15 +
        Math.max(0, 50 + metrics.improvementRate) * 0.15
      );
      
      return {
        userId: metrics.userId,
        userName: metrics.userName,
        overallScore: Math.round(overallScore),
        rank: 0, // Se asignará después de ordenar
        accuracy: metrics.accuracy,
        maxLevel: metrics.maxLevel,
        totalSessions: metrics.totalSessions
      };
    });
    
    // Ordenar por puntuación y asignar ranking
    ranking.sort((a, b) => b.overallScore - a.overallScore);
    ranking.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    return ranking;
  }
  
  /**
   * Obtiene estadísticas detalladas por juego para un usuario
   */
  public async getGameSpecificAnalysis(userId: string, userName?: string): Promise<UserGameAnalysis> {
    try {
      const sessions = await this.getUserCombinedData(userId);
      
      if (sessions.length === 0) {
        return {
          userId,
          userName,
          gameStats: [],
          totalGamesPlayed: 0,
          favoriteGame: 'Ninguno',
          totalPlayTime: 0
        };
      }
      
      // Agrupar sesiones por juego
      const gameGroups = new Map<string, SessionData[]>();
      sessions.forEach(session => {
        const gameId = session.gameId;
        if (!gameGroups.has(gameId)) {
          gameGroups.set(gameId, []);
        }
        gameGroups.get(gameId)!.push(session);
      });
      
      // Calcular estadísticas por juego
      const gameStats: GameSpecificStats[] = [];
      
      gameGroups.forEach((gameSessions, gameId) => {
        const totalSessions = gameSessions.length;
        const totalPlayTime = gameSessions.reduce((sum, s) => sum + (s.totalSessionTime || s.duration || 0), 0);
        
        // Calcular rondas y errores
        let totalRoundsPlayed = 0;
        let maxRoundReached = 0;
        let completedSessions = 0;
        let totalMistakes = 0;
        
        const sessionDetails = gameSessions.map(session => {
          const rounds = session.attempts.length || 1;
          const maxRound = session.metrics?.level || Math.max(...session.attempts.map(a => a.level || 0), 0);
          const completed = session.metrics?.completed || false;
          
          // Contar errores en esta sesión
          const mistakes = session.attempts.filter(a => !a.isCorrect).length;
          
          totalRoundsPlayed += rounds;
          maxRoundReached = Math.max(maxRoundReached, maxRound);
          totalMistakes += mistakes;
          if (completed) completedSessions++;
          
          return {
            date: new Date(session.startTime).toLocaleDateString('es-ES'),
            roundsPlayed: rounds,
            maxRound: maxRound,
            duration: session.totalSessionTime || session.duration || 0,
            completed: completed,
            mistakes: mistakes
          };
        });
        
        // Calcular reintentos (sesiones después de la primera)
        const retryCount = totalSessions - 1;
        
        gameStats.push({
          gameId,
          gameName: this.getGameDisplayName(gameId),
          totalSessions,
          totalRoundsPlayed,
          maxRoundReached,
          totalPlayTime,
          retryCount,
          totalMistakes,
          averageRoundsPerSession: totalRoundsPlayed / totalSessions,
          completionRate: (completedSessions / totalSessions) * 100,
          lastPlayed: sessionDetails[sessionDetails.length - 1].date,
          sessions: sessionDetails
        });
      });
      
      // Ordenar por tiempo jugado (juego favorito)
      gameStats.sort((a, b) => b.totalPlayTime - a.totalPlayTime);
      
      const totalPlayTime = sessions.reduce((sum, s) => sum + (s.totalSessionTime || s.duration || 0), 0);
      
      return {
        userId,
        userName,
        gameStats,
        totalGamesPlayed: gameGroups.size,
        favoriteGame: gameStats.length > 0 ? gameStats[0].gameName : 'Ninguno',
        totalPlayTime
      };
    } catch (error) {
      console.error('❌ Error obteniendo análisis por juego:', error);
      return {
        userId,
        userName,
        gameStats: [],
        totalGamesPlayed: 0,
        favoriteGame: 'Error',
        totalPlayTime: 0
      };
    }
  }
  
  /**
   * Obtiene nombre legible del juego
   */
  private getGameDisplayName(gameId: string): string {
    const gameNames: Record<string, string> = {
      'memory_mirror': 'Memory Mirror',
      'memory_mirror_v1': 'Memory Mirror',
      'tetris_mirror': 'Tetris Mirror',
      'rubik_mirror': 'Rubik Mirror',
      'strategy_mirror': 'Strategy Mirror',
      'unknown': 'Juego Desconocido'
    };
    return gameNames[gameId] || gameId;
  }
  
  /**
   * Calcula promedios del grupo para comparación
   */
  public async calculateGroupAverages(userIds: string[]): Promise<UserCognitiveMetrics['cognitiveProfile']> {
    const allMetrics = await this.calculateMultipleUsersMetrics(userIds);
    
    if (allMetrics.length === 0) {
      return {
        logicalMathematical: 0,
        spatial: 0,
        intrapersonal: 0,
        interpersonal: 0,
        attentional: 0
      };
    }
    
    const sum = allMetrics.reduce((acc, m) => ({
      logicalMathematical: acc.logicalMathematical + m.cognitiveProfile.logicalMathematical,
      spatial: acc.spatial + m.cognitiveProfile.spatial,
      intrapersonal: acc.intrapersonal + m.cognitiveProfile.intrapersonal,
      interpersonal: acc.interpersonal + m.cognitiveProfile.interpersonal,
      attentional: acc.attentional + m.cognitiveProfile.attentional
    }), {
      logicalMathematical: 0,
      spatial: 0,
      intrapersonal: 0,
      interpersonal: 0,
      attentional: 0
    });
    
    return {
      logicalMathematical: Math.round(sum.logicalMathematical / allMetrics.length),
      spatial: Math.round(sum.spatial / allMetrics.length),
      intrapersonal: Math.round(sum.intrapersonal / allMetrics.length),
      interpersonal: Math.round(sum.interpersonal / allMetrics.length),
      attentional: Math.round(sum.attentional / allMetrics.length)
    };
  }
}

export const cognitiveAnalytics = CognitiveAnalyticsService.getInstance();