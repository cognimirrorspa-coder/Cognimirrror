// voiceRecognition.ts - Servicio de reconocimiento de voz usando Web Speech API

interface VoiceRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private shouldAutoRestart: boolean = false;
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 3;
  private isProcessing: boolean = false;
  private lastTranscript: string = '';

  constructor(config: VoiceRecognitionConfig = {}) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Web Speech API no está soportada en este navegador');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    if (this.recognition) {
      this.recognition.lang = config.language || 'es-ES';
      this.recognition.continuous = config.continuous !== undefined ? config.continuous : false;
      this.recognition.interimResults = config.interimResults !== undefined ? config.interimResults : false;
      this.recognition.maxAlternatives = config.maxAlternatives || 1;

      this.setupEventHandlers();
    }
  }

  private setupEventHandlers() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Solo procesar resultados finales (isFinal = true)
      const last = event.results.length - 1;
      const result = event.results[last];
      
      // Si no es final, ignorar (aún está hablando)
      if (!result.isFinal) {
        return;
      }
      
      const transcript = result[0].transcript.trim();
      
      // Evitar procesar el mismo transcript dos veces
      if (transcript === this.lastTranscript) {
        console.log('⚠️ Transcript duplicado ignorado:', transcript);
        return;
      }
      
      // Evitar procesar si ya estamos procesando
      if (this.isProcessing) {
        console.log('⚠️ Ya procesando, ignorando:', transcript);
        return;
      }
      
      this.lastTranscript = transcript;
      this.isProcessing = true;
      
      console.log('✅ Procesando transcript final:', transcript);
      
      if (this.onResultCallback) {
        this.onResultCallback(transcript);
      }
      
      // Detener el reconocimiento después de capturar
      this.stopListening();
      
      // Resetear flag de procesamiento después de un momento
      setTimeout(() => {
        this.isProcessing = false;
      }, 1000);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Error de reconocimiento de voz:', event.error);
      
      // Errores que permiten reinicio automático
      const restartableErrors = ['no-speech', 'aborted', 'audio-capture', 'network'];
      
      if (restartableErrors.includes(event.error) && this.shouldAutoRestart && this.restartAttempts < this.maxRestartAttempts) {
        console.log('Intentando reiniciar reconocimiento automáticamente...');
        this.restartAttempts++;
        setTimeout(() => {
          if (this.shouldAutoRestart) {
            this.restartRecognition();
          }
        }, 500);
      } else {
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      
      // Si debe reiniciarse automáticamente y no se ha excedido el límite
      if (this.shouldAutoRestart && this.restartAttempts < this.maxRestartAttempts) {
        console.log('Reconocimiento terminado, reiniciando...');
        setTimeout(() => {
          if (this.shouldAutoRestart) {
            this.restartRecognition();
          }
        }, 300);
      } else {
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      }
    };
  }

  public startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    onEnd?: () => void,
    autoRestart: boolean = false
  ): void {
    if (!this.recognition) {
      console.error('Reconocimiento de voz no disponible');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onEndCallback = onEnd || null;
    this.shouldAutoRestart = autoRestart;
    this.restartAttempts = 0;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('Error al iniciar reconocimiento:', error);
    }
  }

  private restartRecognition(): void {
    if (!this.recognition || !this.shouldAutoRestart) return;
    
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('Error al reiniciar reconocimiento:', error);
    }
  }

  public stopListening(): void {
    this.shouldAutoRestart = false;
    this.restartAttempts = 0;
    this.isProcessing = false;
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

// Servicio de síntesis de voz (Text-to-Speech)
export class VoiceSynthesisService {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  public speak(text: string, options: {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
  } = {}): void {
    // Cancelar cualquier síntesis en curso
    this.synth.cancel();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = options.lang || 'es-ES';
    this.currentUtterance.rate = options.rate || 1;
    this.currentUtterance.pitch = options.pitch || 1;
    this.currentUtterance.volume = options.volume || 1;

    if (options.onEnd) {
      this.currentUtterance.onend = options.onEnd;
    }

    this.synth.speak(this.currentUtterance);
  }

  public stop(): void {
    this.synth.cancel();
  }

  public isSpeaking(): boolean {
    return this.synth.speaking;
  }
}

// Funciones de utilidad para filtrado de intenciones
export const intentFilters = {
  // Normalizar texto: quitar acentos, convertir a minúsculas, quitar puntuación
  normalizeText: (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[.,!?¿¡;:]/g, '') // Quitar puntuación
      .trim();
  },

  // Verificar si el texto contiene una afirmación
  isAffirmative: (text: string): boolean => {
    const affirmativeWords = [
      // Afirmaciones directas
      'si', 'sip', 'sep', 'yes', 'ok', 'okay',
      // Afirmaciones elaboradas
      'claro', 'por supuesto', 'desde luego', 'efectivamente',
      'correcto', 'exacto', 'exactamente', 'asi es',
      'afirmativo', 'confirmo', 'acepto', 'de acuerdo',
      // Expresiones positivas
      'perfecto', 'genial', 'excelente', 'bueno', 'bien',
      'listo', 'adelante', 'dale', 'va', 'vale',
      // Frases comunes
      'si deseo', 'si quiero', 'si acepto', 'si confirmo',
      'esta bien', 'todo bien', 'esta correcto'
    ];
    
    const normalizedText = intentFilters.normalizeText(text);
    
    // Buscar cada palabra/frase afirmativa
    return affirmativeWords.some(word => {
      const normalizedWord = intentFilters.normalizeText(word);
      
      // Si es una frase (tiene espacios), buscar como substring
      if (normalizedWord.includes(' ')) {
        return normalizedText.includes(normalizedWord);
      }
      
      // Si es una palabra sola, buscar con word boundaries
      const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
      return regex.test(normalizedText);
    });
  },

  // Verificar si el texto contiene una negación
  isNegative: (text: string): boolean => {
    const negativeWords = [
      // Negaciones directas (palabras solas)
      'nop', 'nope', 'nel', 'never', 'jamas',
      // Negaciones elaboradas
      'negativo', 'incorrecto', 'erroneo', 'equivocado',
      'mal', 'error', 'falso', 'mentira',
      // Expresiones de rechazo
      'cancelar', 'anular', 'rechazar', 'denegar',
      'despues', 'luego', 'mas tarde', 'ahora no',
      // Frases comunes (IMPORTANTE: frases con 'no' primero)
      'no deseo', 'no quiero', 'no acepto', 'no confirmo',
      'no es correcto', 'no esta bien', 'eso no',
      'para nada', 'de ninguna manera',
      // 'no' solo al final para evitar falsos positivos
      'no'
    ];
    
    const normalizedText = intentFilters.normalizeText(text);
    
    // Buscar cada palabra/frase negativa
    return negativeWords.some(word => {
      const normalizedWord = intentFilters.normalizeText(word);
      
      // Si es una frase (tiene espacios), buscar como substring
      if (normalizedWord.includes(' ')) {
        return normalizedText.includes(normalizedWord);
      }
      
      // Si es una palabra sola, buscar con word boundaries
      // Esto evita que 'no' coincida con 'nombre', 'conocer', etc.
      const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
      return regex.test(normalizedText);
    });
  },

  // Extraer nombre del texto
  extractName: (text: string): string => {
    // Palabras comunes que NO son parte del nombre
    const stopWords = [
      'mi', 'nombre', 'es', 'soy', 'me', 'llamo', 'llaman',
      'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del',
      'y', 'o', 'pero', 'con', 'sin', 'para', 'por'
    ];
    
    // Limpiar y normalizar el texto
    let cleanedText = text
      .trim()
      .replace(/[.,!?¿¡;:]/g, '') // Quitar puntuación
      .replace(/\s+/g, ' '); // Normalizar espacios
    
    // Dividir en palabras
    const words = cleanedText.split(' ');
    
    // Filtrar palabras vacías y stop words
    const nameWords = words.filter(word => {
      const lowerWord = word.toLowerCase();
      return word.length > 1 && !stopWords.includes(lowerWord);
    });
    
    // Si no hay palabras válidas, retornar el texto original limpio
    if (nameWords.length === 0) {
      return cleanedText;
    }
    
    // Capitalizar cada palabra del nombre
    return nameWords
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  // Extraer edad del texto
  extractAge: (text: string): number | null => {
    // Buscar números en el texto
    const numbers = text.match(/\d+/);
    if (numbers && numbers.length > 0) {
      const age = parseInt(numbers[0], 10);
      // Validar que sea un número razonable (entre 1 y 120)
      return (age >= 1 && age <= 120) ? age : null;
    }
    
    // Intentar con números escritos en palabras (solo números comunes)
    const numberWords: { [key: string]: number } = {
      'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
      'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
      'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
      'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
      'veinte': 20, 'veintiuno': 21, 'veintidos': 22, 'veintitres': 23,
      'veinticuatro': 24, 'veinticinco': 25, 'treinta': 30, 'cuarenta': 40,
      'cincuenta': 50, 'sesenta': 60, 'setenta': 70, 'ochenta': 80,
      'noventa': 90, 'cien': 100
    };
    
    const normalizedText = intentFilters.normalizeText(text);
    for (const [word, num] of Object.entries(numberWords)) {
      if (normalizedText.includes(word)) {
        return num;
      }
    }
    
    return null;
  }
};
