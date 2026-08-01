// CoachAI.ts - Sistema de Coach IA con Firebase AI SDK oficial
import { geminiConfig, googleTTSConfig, fallbackVoiceConfig } from '../data/firebase';
import { CognitiveMetrics } from '../types';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app } from '../data/firebase';

// ============================================================================
// TTS AVAILABILITY CHECK
// ============================================================================

/**
 * Verifica la disponibilidad de los servicios de voz
 * @returns Objeto con el estado de disponibilidad de cada servicio
 */
export async function checkTTSAvailability(): Promise<{ 
  googleTTS: boolean; 
  webSpeech: boolean;
  activeService: 'google' | 'web-speech' | 'none';
}> {
  // Verificar Web Speech API
  const webSpeechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  
  // Verificar Google TTS
  let googleAvailable = false;
  if (googleTTSConfig.apiKey) {
    try {
      const testText = 'Test';
      const utterance = new SpeechSynthesisUtterance(testText);
      // Verificar si hay voces disponibles (solo para diagnóstico)
      const voices = window.speechSynthesis.getVoices();
      console.log('Voces disponibles:', voices);
      
      // Verificar conexión a Google TTS con una petición simple
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/voices?key=${googleTTSConfig.apiKey}`,
        { method: 'GET' }
      );
      googleAvailable = response.ok;
    } catch (error) {
      console.warn('Google TTS no disponible:', error);
      googleAvailable = false;
    }
  }
  
  return {
    googleTTS: googleAvailable,
    webSpeech: webSpeechAvailable,
    activeService: googleAvailable ? 'google' : (webSpeechAvailable ? 'web-speech' : 'none')
  };
}

// ============================================================================
// FIREBASE AI SDK SETUP
// ============================================================================

// Inicializar Firebase AI con el backend oficial
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: 'gemini-1.5-flash' });

// ============================================================================
// TEXT-TO-SPEECH
// ============================================================================

let voiceEnabled = true;
let currentAudio: HTMLAudioElement | null = null;
let userInteracted = false;

if (typeof window !== 'undefined') {
  window.addEventListener('click', () => { userInteracted = true; }, { once: true });
  window.addEventListener('keydown', () => { userInteracted = true; }, { once: true });
}

export function toggleVoice(enabled: boolean): void {
  voiceEnabled = enabled;
  if (!enabled && currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

export function isVoiceEnabled(): boolean {
  return voiceEnabled;
}

// Estado global para rastrear el servicio de voz activo
let activeVoiceService: 'google' | 'web-speech' | 'none' = 'none';

/**
 * Reproduce texto usando Google Cloud TTS o Web Speech API
 * @param text Texto a reproducir
 * @param onVoiceServiceChange Callback opcional cuando cambia el servicio de voz
 */
export async function speakText(
  text: string, 
  onVoiceServiceChange?: (service: 'google' | 'web-speech' | 'none') => void
): Promise<void> {
  // Verificar condiciones básicas
  if (!voiceEnabled || !text || !userInteracted) {
    console.log('🔇 Voz deshabilitada, sin texto o sin interacción del usuario');
    return;
  }

  const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  let googleSuccess = false;
  
  // Verificar disponibilidad de Google TTS primero
  const { googleTTS } = await checkTTSAvailability();
  
  // 1. Intentar con Google TTS si está disponible
  if (googleTTS) {
    console.log('🔊 Intentando reproducir con Google TTS...');
    googleSuccess = await tryGoogleTTS(cleanText);
    
    if (googleSuccess) {
      console.log('✅ Voz reproducida con Google TTS');
      if (activeVoiceService !== 'google' && onVoiceServiceChange) {
        activeVoiceService = 'google';
        onVoiceServiceChange('google');
      }
      return;
    }
    
    console.warn('⚠️ Falló Google TTS, intentando con Web Speech API...');
  } else {
    console.log('ℹ️ Google TTS no disponible, usando Web Speech API');
  }
  
  // 2. Fallback a Web Speech API
  const webSpeechSuccess = await new Promise<boolean>((resolve) => {
    try {
      fallbackSpeak(cleanText);
      console.log('🔊 Voz reproducida con Web Speech API');
      if (activeVoiceService !== 'web-speech' && onVoiceServiceChange) {
        activeVoiceService = 'web-speech';
        onVoiceServiceChange('web-speech');
      }
      resolve(true);
    } catch (error) {
      console.error('❌ Error al reproducir con Web Speech API:', error);
      resolve(false);
    }
  });
  
  // 3. Si todo falla
  if (!webSpeechSuccess) {
    console.error('❌ No se pudo reproducir el audio con ningún servicio');
    if (onVoiceServiceChange) {
      activeVoiceService = 'none';
      onVoiceServiceChange('none');
    }
  }
}

/**
 * Intenta reproducir texto usando Google TTS
 * @param text Texto a reproducir
 * @returns true si se reprodujo correctamente, false en caso contrario
 */
async function tryGoogleTTS(text: string): Promise<boolean> {
  if (!text) {
    console.warn('⚠️ Intento de reproducir texto vacío con Google TTS');
    return false;
  }

  try {
    // Detener cualquier audio actual
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    // Verificar API key
    const apiKey = googleTTSConfig.apiKey;
    if (!apiKey) {
      console.warn('⚠️ No hay API key configurada para Google TTS');
      return false;
    }

    console.log('🔊 Generando audio con Google TTS...');
    
    // Configurar la petición a la API de Google TTS
    const request = {
      input: { text },
      voice: {
        languageCode: googleTTSConfig.voice.languageCode,
        name: googleTTSConfig.voice.name,
        ssmlGender: googleTTSConfig.voice.ssmlGender,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: googleTTSConfig.audio.speakingRate,
        pitch: googleTTSConfig.audio.pitch,
        volumeGainDb: googleTTSConfig.audio.volumeGainDb,
      },
    };

    const startTime = performance.now();
    
    // Realizar la petición a la API con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    let response: Response;
    try {
      response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.warn('⚠️ Tiempo de espera agotado para Google TTS');
      } else {
        console.warn('⚠️ Error de red al conectar con Google TTS:', error);
      }
      return false;
    }

    // Verificar respuesta HTTP
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Error desconocido');
      console.warn(`⚠️ Error en la respuesta de Google TTS (${response.status}):`, errorText);
      return false;
    }

    // Procesar la respuesta
    const data = await response.json().catch(error => {
      console.warn('⚠️ Error al analizar la respuesta de Google TTS:', error);
      return null;
    });

    if (!data || !data.audioContent) {
      console.warn('⚠️ Respuesta de Google TTS sin contenido de audio');
      return false;
    }
    
    // Crear y reproducir el audio
    try {
      console.log(`✅ Audio generado en ${(performance.now() - startTime).toFixed(0)}ms`);
      
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      
      // Configurar manejadores de eventos para el audio
      audio.onerror = (e) => {
        console.error('❌ Error al reproducir el audio:', e);
        currentAudio = null;
      };
      
      audio.onended = () => {
        console.log('🎵 Reproducción de audio finalizada');
        currentAudio = null;
      };
      
      // Reproducir el audio
      currentAudio = audio;
      await audio.play();
      
      console.log('🔊 Audio en reproducción');
      return true;
      
    } catch (error) {
      console.error('❌ Error al reproducir el audio generado:', error);
      currentAudio = null;
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error inesperado en Google TTS:', error);
    return false;
  }
}

/**
 * Reproduce texto usando la Web Speech API del navegador
 * @param text Texto a reproducir
 * @returns true si se pudo iniciar la reproducción, false en caso contrario
 */
function fallbackSpeak(text: string): boolean {
  if (!text) {
    console.warn('⚠️ Intento de reproducir texto vacío con Web Speech API');
    return false;
  }

  // Verificar si la API está disponible
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    console.warn('⚠️ Web Speech API no soportada en este navegador');
    return false;
  }
  
  try {
    // Detener cualquier síntesis de voz en curso
    window.speechSynthesis.cancel();
    
    // Crear un nuevo objeto de síntesis de voz
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurar opciones de voz
    utterance.lang = fallbackVoiceConfig.lang;
    utterance.rate = fallbackVoiceConfig.rate;
    utterance.pitch = fallbackVoiceConfig.pitch;
    utterance.volume = fallbackVoiceConfig.volume;
    
    // Seleccionar una voz adecuada si está disponible
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Intentar encontrar una voz en el idioma configurado
      const lang = fallbackVoiceConfig.lang.substring(0, 2); // Obtener solo el código de idioma (ej: 'es')
      const preferredVoice = voices.find(v => v.lang.startsWith(lang));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`🔊 Usando voz: ${preferredVoice.name} (${preferredVoice.lang})`);
      } else {
        console.warn(`⚠️ No se encontró una voz para ${fallbackVoiceConfig.lang}, usando voz por defecto`);
      }
    }
    
    // Configurar manejadores de eventos
    utterance.onstart = () => {
      console.log('🔊 Iniciando reproducción con Web Speech API');
    };
    
    utterance.onend = () => {
      console.log('🎵 Reproducción finalizada (Web Speech API)');
    };
    
    utterance.onerror = (event) => {
      console.error('❌ Error en Web Speech API:', event.error);
    };
    
    // Iniciar la síntesis de voz
    window.speechSynthesis.speak(utterance);
    return true;
    
  } catch (error) {
    console.error('❌ Error inesperado en Web Speech API:', error);
    return false;
  }
}

// ============================================================================
// COACH AI (FIREBASE AI SDK OFICIAL - SIN DUPLICACIÓN)
// ============================================================================

const systemPrompt = `Eres el Coach CogniTech, un compañero cercano y motivador para niños y adolescentes.

TONO: Cálido, personal y empático, como un amigo que entiende sus desafíos. Usa 1-2 emojis para conectar emocionalmente.

OBJETIVO: Crear una sensación de "estoy aquí contigo, te entiendo, y tengo la pista perfecta para ti".

FORMATO: 
- 2-3 oraciones máximo
- SIEMPRE menciona el nombre del usuario
- Si hay una pista matemática, hazla divertida y clara
- Termina con ánimo positivo

ESTILO: No uses frases genéricas. Sé específico con los datos que recibes.`;

interface CoachRequest {
  userName: string;
  userAge: number;
  mirrorType: string;
  metrics: CognitiveMetrics;
  context?: string;
  currentSequence?: number[]; // Para Memory Mirror: secuencia actual
  needsHint?: boolean; // Si el usuario pidió consejo explícitamente
  isFinalMessage?: boolean; // Si es el mensaje final de felicitación después de completar un espejo
  finalLevel?: number; // Nivel máximo alcanzado en el espejo
}

// Variable para prevenir múltiples llamadas simultáneas
let isProcessingCoach = false;

/**
 * Solicita un consejo personalizado al Coach AI usando Firebase AI SDK oficial
 * PREVIENE DUPLICACIÓN DE AUDIO
 */
export async function askCoach(request: CoachRequest, autoSpeak = false): Promise<string> {
  // Prevenir múltiples llamadas simultáneas
  if (isProcessingCoach) {
    console.warn('⚠️ Coach AI ya está procesando, ignorando llamada duplicada');
    return '';
  }

  isProcessingCoach = true;

  try {
    // Construir el prompt según el tipo de solicitud
    let userMsg = '';
    let prompt = '';
    
    if (request.needsHint && request.currentSequence && request.currentSequence.length > 0) {
      // PISTA MATEMÁTICA - Usar Gemini para hacerla más creativa
      const firstNumber = request.currentSequence[0] + 1;
      const mathHint = generateMathHint(firstNumber);
      
      userMsg = `Nombre: ${request.userName}. Edad: ${request.userAge} años.
Espejo: ${request.mirrorType}.
Métricas: Persistencia ${request.metrics.persistencia.toFixed(2)}, Eficiencia ${request.metrics.eficiencia.toFixed(2)}.
${request.context ? `Contexto: ${request.context}` : ''}

EL USUARIO PIDIÓ AYUDA. Dale una pista MUY ESPECÍFICA y MOTIVADORA:
- La secuencia empieza con el número que resulta de: ${mathHint}
- Usa un tono cercano y personal: "${request.userName}, ¡te tengo la pista perfecta! 🧠"
- Máximo 2 oraciones cortas.
- NO reveles el número directamente, solo el acertijo matemático.
- Añade un emoji y ánimo positivo.`;
    } else if (request.isFinalMessage) {
      // MENSAJE FINAL DE FELICITACIÓN - Usar Protocolo de Revelación Narrativa (P.I.N.)
      const personalityType = getPersonalityType(request.metrics);
      const finalMessage = `¡Felicitaciones, ${request.userName}! 🎉 Has alcanzado el nivel ${request.finalLevel} en el espejo ${request.mirrorType}. Tu tipo de personalidad según el modelo 16Personalities es ${personalityType}. ¡Sigue adelante y descubre más sobre ti mismo!`;
      
      userMsg = `Nombre: ${request.userName}. Edad: ${request.userAge} años.
Espejo: ${request.mirrorType}.
Métricas: Persistencia ${request.metrics.persistencia.toFixed(2)}, Eficiencia ${request.metrics.eficiencia.toFixed(2)}, Resiliencia ${request.metrics.resiliencia.toFixed(2)}, Adaptación ${request.metrics.adaptacion.toFixed(2)}.
${request.context ? `Contexto: ${request.context}` : ''}

Objetivo: Ofrece un mensaje de felicitación MUY PERSONALIZADO basado en las métricas y el tipo de personalidad. 2-3 oraciones máximo. Usa 1-2 emojis.`;
      
      prompt = `${systemPrompt}\n\n${userMsg}\n\n${finalMessage}`;
    } else {
      // MENSAJE MOTIVACIONAL - Usar Gemini para personalizar
      userMsg = `Nombre: ${request.userName}. Edad: ${request.userAge} años.
Espejo: ${request.mirrorType}.
Métricas: Persistencia ${request.metrics.persistencia.toFixed(2)}, Eficiencia ${request.metrics.eficiencia.toFixed(2)}, Resiliencia ${request.metrics.resiliencia.toFixed(2)}, Adaptación ${request.metrics.adaptacion.toFixed(2)}.
${request.context ? `Contexto: ${request.context}` : ''}

Objetivo: Ofrece un mensaje de ánimo MUY PERSONALIZADO basado en las métricas. 2-3 oraciones máximo. Usa 1-2 emojis.`;
    }

    console.log('🤖 Consultando Gemini AI (Firebase SDK)...');
    
    // Usar Firebase AI SDK oficial
    const result = await model.generateContent(prompt);
    const response = result.response;
    const tip = response.text();
    
    console.log('✅ Gemini respondió exitosamente:', tip.substring(0, 50) + '...');
    
    // Solo reproducir audio si se solicita explícitamente Y está habilitado
    if (autoSpeak && voiceEnabled && userInteracted) {
      await speakText(tip);
    }
    
    return tip.trim();
    
  } catch (error) {
    console.warn('⚠️ Error con Firebase AI SDK:', error);
    
    // FALLBACK LOCAL (solo si Gemini falla)
    const localTip = request.needsHint && request.currentSequence 
      ? generateLocalHint(request)
      : generateLocalMotivation(request);
    
    // Solo reproducir audio si se solicita explícitamente Y está habilitado
    if (autoSpeak && voiceEnabled && userInteracted) {
      await speakText(localTip);
    }
    
    return localTip;
  } finally {
    // Siempre liberar el bloqueo
    isProcessingCoach = false;
  }
}

// Genera pistas matemáticas para números del 1 al 9
function generateMathHint(number: number): string {
  const hints: { [key: number]: string[] } = {
    1: ['1 + 0', 'el primer número natural'],
    2: ['4 ÷ 2', '1 + 1'],
    3: ['9 ÷ 3', '6 ÷ 2'],
    4: ['16 ÷ 4', '2 + 2', '8 ÷ 2'],
    5: ['10 ÷ 2', '15 ÷ 3', '3 + 2'],
    6: ['12 ÷ 2', '18 ÷ 3', '3 + 3'],
    7: ['14 ÷ 2', '21 ÷ 3', '4 + 3'],
    8: ['16 ÷ 2', '24 ÷ 3', '4 + 4'],
    9: ['18 ÷ 2', '27 ÷ 3', '5 + 4']
  };
  
  const options = hints[number] || [`${number}`];
  return options[Math.floor(Math.random() * options.length)];
}

// Genera pista matemática localmente (SIN necesidad de API)
function generateLocalHint(request: CoachRequest): string {
  if (!request.currentSequence || request.currentSequence.length === 0) {
    return getFallbackTip(request.userName);
  }
  
  const firstNumber = request.currentSequence[0] + 1;
  const mathHint = generateMathHint(firstNumber);
  
  const templates = [
    `${request.userName}, ¡te tengo una pista perfecta! 🧠 El primer número es el resultado de: ${mathHint}. ¡Concéntrate y lo lograrás!`,
    `¡Escucha bien, ${request.userName}! 💡 La secuencia empieza con el número que sale de: ${mathHint}. ¡Tú puedes!`,
    `${request.userName}, aquí va tu pista especial: ✨ El primer bloque es ${mathHint}. ¡Confía en tu memoria!`,
    `¡Atención ${request.userName}! 🎯 Necesitas presionar el número que resulta de: ${mathHint}. ¡Vamos!`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Genera motivación local basada en métricas (SIN necesidad de API)
function generateLocalMotivation(request: CoachRequest): string {
  const { userName, metrics, context } = request;
  const { persistencia, eficiencia, resiliencia } = metrics;
  
  // Mensajes personalizados según métricas
  if (persistencia > 0.7) {
    return `¡Increíble, ${userName}! 💪 Tu persistencia es notable. Sigue así y alcanzarás niveles que ni imaginas. 🌟`;
  }
  
  if (eficiencia > 0.8) {
    return `${userName}, tu eficiencia es impresionante. 🎯 Cada movimiento cuenta, ¡y tú lo sabes! Sigue confiando en tu estrategia. ✨`;
  }
  
  if (resiliencia < 0.5) {
    return `${userName}, cada error es una oportunidad para crecer. 🌱 No te desanimes, tu cerebro está aprendiendo con cada intento. ¡Adelante!`;
  }
  
  // Mensaje genérico motivador
  const genericMessages = [
    `${userName}, sigue explorando. 🧠 Cada intento te acerca más a descubrir tu genialidad única. 🌟`,
    `¡Vas muy bien, ${userName}! 💡 Tu mente está en constante evolución. Confía en el proceso. ✨`,
    `${userName}, estás entrenando tu cerebro de forma asombrosa. 🎯 Cada sesión te hace más fuerte. ¡Sigue así!`,
    `¡Excelente trabajo, ${userName}! 🚀 Tu capacidad cognitiva está en pleno desarrollo. No pares ahora. 💪`
  ];
  
  return genericMessages[Math.floor(Math.random() * genericMessages.length)];
}

function getFallbackTip(userName: string): string {
  return `${userName}, sigue explorando. Cada intento te acerca más a descubrir tu genialidad única. 🌟`;
}

// Función de diagnóstico para probar Gemini API
export async function diagnoseGeminiAPI(): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    console.log('🔍 DIAGNÓSTICO: Probando Gemini API...');
    
    // Test simple con modelo básico
    const testPrompt = `Di "Hola" en español.`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Diagnóstico fallido:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        details: { status: response.status, body: errorText }
      };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      return {
        success: false,
        error: 'Gemini devolvió respuesta vacía',
        details: data
      };
    }

    console.log('✅ Diagnóstico exitoso:', content);
    return {
      success: true,
      details: { response: content }
    };
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: error
    };
  }
}

export default {
  askCoach,
  speakText,
  toggleVoice,
  isVoiceEnabled,
  diagnoseGeminiAPI,
};