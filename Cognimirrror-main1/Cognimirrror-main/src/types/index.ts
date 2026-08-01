//index.ts

export type GameType = 'memory_mirror' | 'digit_span' | 'rubik_cube' | 'observer_dashboard';

export interface ObservationEvent {
  type: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface GameRound {
  roundId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  correct: number;
  incorrect: number;
  skipped: number;
  level?: number;
  score?: number;
  metadata?: Record<string, any>;
}

export interface ObservationSession {
  sessionId: string;
  observerId: string;
  patientId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  game: GameType;
  sessionType: 'observacion';
  metrics: {
    events: ObservationEvent[];
    notes: string[];
    rounds: GameRound[];
    startTime: number;
    endTime?: number;
    duration?: number;
    lastUpdated?: number;
    stats?: {
      totalRounds: number;
      totalCorrect: number;
      totalIncorrect: number;
      totalSkipped: number;
      accuracy: number;
      averageTimePerRound: number;
    };
  };
}

export interface GameMetric {
  gameName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  level?: number;
  score?: number;
  completed: boolean;
}

export interface TimeMetrics {
  userId: string;
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  games: GameMetric[];
  pages: Record<string, number>;
  timestamp: string;
}

export type UserType = 'institucional' | 'terapeuta' | 'paciente';

export interface User {
  id: string;
  email: string;
  password: string;
  type: UserType;
  name: string;
  institutionId?: string;
  createdAt: Date;
}

export interface Institution extends User {
  type: 'institucional';
  therapists: string[];
  patients: string[];
}

export interface Therapist extends User {
  type: 'terapeuta';
  institutionId?: string;
  patients: string[];
}

export interface Patient extends User {
  type: 'paciente';
  parentEmails: string[];
  therapistId: string;
  institutionId?: string;
  age?: number;
  diagnosis?: string[];
  progress: number;
  achievements: Achievement[];
  sessions: GameSession[];
  // Nuevo: Perfil Cognitivo CogniMirror 2.0
  cognitiveProfile?: CognitiveProfile;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  goal?: number;
}

// ============================================================================
// SISTEMA DE ESPEJOS COGNITIVOS - CogniMirror 2.0
// ============================================================================

export type MirrorType = 'memory_mirror_v1' | 'spatial_mirror_v1' | 'strategy_mirror_v1' | 'sudoku_mirror_v1' | 'chess_mirror_v1' | 'tetris_mirror_v1' | 'digit_span_v1';
export type SessionOutcome = 'completed' | 'abandoned';
export type EventType = 
  | 'user_input' 
  | 'level_up' 
  | 'mistake' 
  | 'hint_used'
  | 'sequence_start'
  | 'sequence_end'
  | 'move_executed'
  | 'rotation_detected'
  | 'comparison_made';

/**
 * Evento individual dentro de una sesión de espejo
 */
export interface SessionEvent {
  timestamp: string; // ISO 8601
  type: EventType;
  value: any;
  isCorrect?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Contrato de datos universal para todos los Espejos Cognitivos
 * ESTE ES EL FORMATO ESTÁNDAR que todos los espejos deben generar
 */
export interface CognitiveSession {
  gameId: MirrorType;
  userId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  outcome: SessionOutcome;
  finalScore: number;
  events: SessionEvent[];
  metadata?: {
    difficulty?: string;
    assistanceUsed?: number;
    [key: string]: any;
  };
}

/**
 * Métricas CognTech - El corazón del análisis cognitivo
 * Calculadas por el Coach IA a partir de los eventos
 */
export interface CognitiveMetrics {
  persistencia: number;  // 0-1: Capacidad de mantener el esfuerzo
  eficiencia: number;    // 0-1: Ratio de éxito vs intentos
  resiliencia: number;   // 0-1: Recuperación después de errores
  adaptacion: number;    // 0-1: Flexibilidad estratégica
}

/**
 * Perfil cognitivo del usuario - Acumula insights
 */
export interface CognitiveProfile {
  userId: string;
  sessions: CognitiveSession[];
  aggregatedMetrics: CognitiveMetrics;
  insights: string[]; // Generados por Coach IA
  strengths: string[];
  areasToExplore: string[];
  lastUpdated: string;
}

// Legacy GameSession (mantener compatibilidad)
export interface GameSession {
  id: string;
  gameType: 'rubik' | 'sudoku' | 'ajedrez' | MirrorType;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  moves: number;
  efficiency: number;
  completed: boolean;
  metrics: {
    [key: string]: number | string;
  };
  // Nuevo: referencia a sesión cognitiva
  cognitiveSession?: CognitiveSession;
}

export type GameMode = 'juego' | 'observador';

export interface GameStats {
  totalSessions: number;
  totalTime: number;
  averageEfficiency: number;
  totalMoves: number;
  completedGames: number;
  strategies: string[];
}

// ============================================================================
// SISTEMA DE ANÁLISIS COGNITIVO DE ALTA FIDELIDAD - LOG DE BATALLA
// ============================================================================

/**
 * Datos de cada pulsación individual (granularidad máxima)
 */
export interface TapData {
  timestamp: number; // performance.now() en ms
  blockId: number; // Qué bloque se pulsó
  expected: number; // Qué bloque se esperaba
  isCorrect: boolean;
  position: number; // Posición en la secuencia (0-indexed)
}

/**
 * Datos de cada ronda/intento en un nivel
 */
export interface RoundData {
  level: number; // Longitud de la secuencia
  attempt: number; // Número de intento en este nivel (1, 2, 3...)
  isCorrect: boolean; // Si completó la ronda correctamente
  timeTaken: number; // Tiempo total para completar la ronda en segundos
  taps: TapData[]; // Array con cada pulsación individual
  startTime: string; // ISO timestamp de inicio de ronda
  endTime: string; // ISO timestamp de fin de ronda
}

/**
 * Métricas calculadas de rendimiento y proceso (Capa 1 y 2)
 */
export interface GameMetrics {
  // --- Capa 1: Métricas de Rendimiento (El "Qué") ---
  maxSpan: number; // Nivel más alto completado con éxito
  totalSessionTime: number; // Duración total en segundos
  errorRate: number; // Porcentaje de intentos fallidos (0-100)
  totalAttempts: number; // Total de intentos realizados
  successfulAttempts: number; // Intentos exitosos

  // --- Capa 2: Métricas de Proceso (El "Cómo") ---
  persistence: number; // Número total de reintentos después de fallos
  cognitiveFluency: number; // Tiempo promedio en ms entre pulsaciones correctas
  selfCorrectionIndex: number; // Cambio porcentual de velocidad después de errores (+ = ralentiza, - = acelera)
  
  // --- Datos RAW para análisis posterior ---
  allTaps: TapData[]; // Todas las pulsaciones de la sesión
  roundsData: RoundData[]; // Detalle completo de cada ronda
}

/**
 * Sesión completa de juego con análisis cognitivo
 */
export interface AnalysisGameSession {
  gameId: string; // ej: 'memory_mirror_v1', 'tetris_mirror_v1'
  userId: string;
  userName: string;
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  metrics: GameMetrics | TetrisMetrics; // Métricas específicas del juego
  rounds: RoundData[] | PieceData[]; // Historial detallado
}

// ============================================================================
// SISTEMA DE ANÁLISIS COGNITIVO - TETRIS MIRROR
// ============================================================================

/**
 * Datos de cada acción individual del usuario en Tetris
 */
export interface TetrisActionData {
  timestamp: number; // performance.now() en ms
  actionType: 'move_left' | 'move_right' | 'rotate' | 'drop' | 'soft_drop';
  pieceType: string; // Tipo de pieza actual
  position: { x: number; y: number }; // Posición de la pieza
}

/**
 * Datos de cada pieza colocada (equivalente a RoundData)
 */
export interface PieceData {
  pieceNumber: number; // Número secuencial de pieza
  pieceType: string; // I, O, T, S, Z, J, L
  spawnTime: string; // ISO timestamp cuando apareció
  lockTime: string; // ISO timestamp cuando se fijó
  thinkingTime: number; // Tiempo desde spawn hasta primer movimiento (ms)
  totalTime: number; // Tiempo total para colocar la pieza (segundos)
  actions: TetrisActionData[]; // Todas las acciones para esta pieza
  linesCleared: number; // Líneas eliminadas con esta pieza
  levelAtPlacement: number; // Nivel cuando se colocó
}

/**
 * Métricas calculadas específicas de Tetris
 */
export interface TetrisMetrics {
  // --- Capa 1: Métricas de Rendimiento ---
  finalScore: number; // Puntaje final
  totalLines: number; // Total de líneas eliminadas
  maxLevel: number; // Nivel más alto alcanzado
  totalSessionTime: number; // Duración total en segundos
  totalPieces: number; // Total de piezas colocadas
  piecesPerMinute: number; // Velocidad de juego
  
  // --- Capa 2: Métricas de Proceso ---
  averageThinkingTime: number; // Tiempo promedio antes del primer movimiento (ms)
  averageActionsPerPiece: number; // Eficiencia de movimientos
  cognitiveFluency: number; // Tiempo promedio entre acciones (ms)
  adaptationIndex: number; // Cambio en performance entre niveles (0-100)
  selfCorrectionIndex: number; // Cambio de ritmo post-error
  
  // --- Datos RAW ---
  allActions: TetrisActionData[]; // Todas las acciones
  piecesData: PieceData[]; // Detalle de cada pieza
}

// ============================================================================
// CONFIGURACIÓN DE ESPEJOS COGNITIVOS
// ============================================================================

export interface MirrorConfig {
  id: MirrorType;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  scientificBasis: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number; // minutos
  targetMetrics: (keyof CognitiveMetrics)[];
}

/**
 * Catálogo de Espejos Cognitivos - CogniMirror 2.0
 */
export const MIRROR_CATALOG: Record<MirrorType, MirrorConfig> = {
  memory_mirror_v1: {
    id: 'memory_mirror_v1',
    name: 'Memory Mirror',
    displayName: 'El Detective de Patrones',
    description: 'Revela tu memoria de trabajo y capacidad de atención sostenida',
    icon: '🧠',
    color: '#00D9FF',
    gradient: 'from-cyan-400 to-cyan-600',
    scientificBasis: 'Test de Corsi (Maceda Martínez et al., 2025: +0.54 en autoestima)',
    difficulty: 'easy',
    estimatedDuration: 5,
    targetMetrics: ['persistencia', 'eficiencia', 'adaptacion']
  },
  digit_span_v1: {
    id: 'digit_span_v1',
    name: 'Digit Span Mirror',
    displayName: 'El Sensor Verbal',
    description: 'Evalúa tu memoria verbal y capacidad de retención auditiva',
    icon: '🔢',
    color: '#14B8A6',
    gradient: 'from-teal-400 to-green-600',
    scientificBasis: 'Test de amplitud de dígitos (WAIS-IV)',
    difficulty: 'easy',
    estimatedDuration: 5,
    targetMetrics: ['persistencia', 'eficiencia', 'adaptacion']
  },
  tetris_mirror_v1: {
    id: 'tetris_mirror_v1',
    name: 'Tetris Mirror',
    displayName: 'Rey del Tetris',
    description: 'Revela tu velocidad de procesamiento y coordinación visoespacial',
    icon: '👑',
    color: '#F59E0B',
    gradient: 'from-amber-400 to-orange-600',
    scientificBasis: 'Tetris cognitivo: rotación mental y velocidad de procesamiento',
    difficulty: 'medium',
    estimatedDuration: 10,
    targetMetrics: ['eficiencia', 'adaptacion', 'resiliencia']
  },
  strategy_mirror_v1: {
    id: 'strategy_mirror_v1',
    name: 'Strategy Mirror',
    displayName: 'El Estratega del Cubo',
    description: 'Refleja tu flexibilidad cognitiva y resolución de problemas complejos',
    icon: '🧩',
    color: '#EC4899',
    gradient: 'from-pink-400 to-red-600',
    scientificBasis: 'Cubo de Rubik terapéutico (Cardoso et al., 2025: +46% en precisión)',
    difficulty: 'hard',
    estimatedDuration: 15,
    targetMetrics: ['persistencia', 'eficiencia', 'resiliencia', 'adaptacion']
  },
  spatial_mirror_v1: {
    id: 'spatial_mirror_v1',
    name: 'Spatial Mirror',
    displayName: 'El Arquitecto Mental',
    description: 'Descubre tu razonamiento espacial y rotación mental',
    icon: '🔮',
    color: '#8B5CF6',
    gradient: 'from-purple-400 to-purple-600',
    scientificBasis: 'Test de Rotación Mental de Shepard y Metzler',
    difficulty: 'medium',
    estimatedDuration: 8,
    targetMetrics: ['eficiencia', 'adaptacion']
  },
  sudoku_mirror_v1: {
    id: 'sudoku_mirror_v1',
    name: 'Sudoku Mirror',
    displayName: 'El Lógico Deductivo',
    description: 'Desvela tu pensamiento lógico y resolución de acertijos numéricos',
    icon: '🔢',
    color: '#10B981',
    gradient: 'from-green-400 to-emerald-600',
    scientificBasis: 'Entrenamiento cognitivo con Sudoku (Próximamente)',
    difficulty: 'medium',
    estimatedDuration: 10,
    targetMetrics: ['persistencia', 'eficiencia', 'adaptacion']
  },
  chess_mirror_v1: {
    id: 'chess_mirror_v1',
    name: 'Chess Mirror',
    displayName: 'El Maestro Táctico',
    description: 'Revela tu pensamiento estratégico y planificación a largo plazo',
    icon: '♟️',
    color: '#6366F1',
    gradient: 'from-indigo-400 to-indigo-600',
    scientificBasis: 'Ajedrez como herramienta cognitiva (Próximamente)',
    difficulty: 'hard',
    estimatedDuration: 20,
    targetMetrics: ['persistencia', 'eficiencia', 'resiliencia', 'adaptacion']
  }
};
