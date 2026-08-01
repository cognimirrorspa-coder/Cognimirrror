// MirrorRecorder.ts - Sistema de Captura de Sesiones Cognitivas
import { 
  CognitiveSession, 
  SessionEvent, 
  MirrorType, 
  SessionOutcome 
} from '../types';

/**
 * Graba una sesión de espejo cognitivo en tiempo real
 * Genera el JSON estandarizado que cumple el contrato de datos
 */
export class MirrorRecorder {
  private session: Partial<CognitiveSession>;
  private events: SessionEvent[] = [];
  private isRecording: boolean = false;

  constructor(
    private gameId: MirrorType,
    private userId: string
  ) {
    this.session = {
      gameId,
      userId,
      events: []
    };
  }

  /**
   * Inicia la grabación de la sesión
   */
  start(): void {
    this.session.startTime = new Date().toISOString();
    this.isRecording = true;
    this.events = [];
    console.log(`🔴 [MirrorRecorder] Sesión iniciada: ${this.gameId}`);
  }

  /**
   * Registra un evento individual
   */
  recordEvent(event: Omit<SessionEvent, 'timestamp'>): void {
    if (!this.isRecording) {
      console.warn('[MirrorRecorder] No está grabando');
      return;
    }

    const completeEvent: SessionEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.push(completeEvent);
    console.log(`⏺ [MirrorRecorder] Evento: ${event.type}`, event.value);
  }

  /**
   * Finaliza la sesión y retorna el JSON completo
   */
  end(
    outcome: SessionOutcome,
    finalScore: number,
    metadata?: Record<string, any>
  ): CognitiveSession {
    if (!this.isRecording) {
      throw new Error('[MirrorRecorder] No hay sesión activa');
    }

    this.session.endTime = new Date().toISOString();
    this.session.outcome = outcome;
    this.session.finalScore = finalScore;
    this.session.events = this.events;
    this.session.metadata = metadata;
    this.isRecording = false;

    const completedSession = this.session as CognitiveSession;

    console.log(`✅ [MirrorRecorder] Sesión finalizada:`, {
      duration: this.getDuration(),
      events: this.events.length,
      outcome,
      finalScore
    });

    return completedSession;
  }

  /**
   * Duración de la sesión en segundos
   */
  getDuration(): number {
    if (!this.session.startTime) return 0;
    const start = new Date(this.session.startTime).getTime();
    const end = this.session.endTime 
      ? new Date(this.session.endTime).getTime() 
      : Date.now();
    return Math.floor((end - start) / 1000);
  }

  getEventCount(): number { 
    return this.events.length; 
  }

  isActive(): boolean { 
    return this.isRecording; 
  }

  abandon(): CognitiveSession { 
    return this.end('abandoned', 0, { reason: 'user_abandoned' }); 
  }
}

/**
 * Factory para crear recorders
 */
export class MirrorRecorderFactory {
  static create(mirrorType: MirrorType, userId: string): MirrorRecorder {
    return new MirrorRecorder(mirrorType, userId);
  }
}