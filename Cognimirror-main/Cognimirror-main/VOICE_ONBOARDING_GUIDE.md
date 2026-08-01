# 🎤 CogniMirror Voice Onboarding - Guía Completa

## 📋 Descripción General

El sistema **Voice Onboarding** (V-Onboarding) permite a los usuarios navegar y completar el proceso de registro en CogniMirror utilizando únicamente comandos de voz, sin necesidad de teclado o mouse.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **VoiceOnboardingWelcome** (`src/pages/VoiceOnboardingWelcome.tsx`)
   - Pantalla inicial de bienvenida
   - Permite al usuario elegir entre modo vocal o tradicional
   - Pregunta automáticamente al cargar: "¿Deseas usar el modo vocal?"

2. **VOnboarding** (`src/pages/VOnboarding.tsx`)
   - Componente principal con máquina de estados finitos (FSM)
   - Gestiona el diálogo completo de registro por voz
   - Captura nombre y edad del usuario

3. **VoiceRecognitionService** (`src/services/voiceRecognition.ts`)
   - Servicio de reconocimiento de voz (Web Speech API)
   - Servicio de síntesis de voz (Text-to-Speech)
   - Filtros de intención para interpretar respuestas

4. **VoiceModeIndicator** (`src/components/common/VoiceModeIndicator.tsx`)
   - Indicador visual de modo vocal activo
   - Muestra estado de escucha/habla

## 🔄 Máquina de Estados Finitos (FSM)

### Estados del Diálogo

```
INITIAL → ASK_NAME → CONFIRM_NAME → ASK_AGE → FINAL_VERIFICATION → COMPLETED
           ↑______________|                        |
                                                   ↓
                                              (volver si error)
```

### Flujo Detallado

#### Estado 1: INITIAL (Pregunta de Acceso)
- **Voz del Coach**: "¿Deseas probar la aplicación ahora mismo?"
- **Respuestas aceptadas**:
  - ✅ Afirmativas: "sí", "claro", "acepto" → Avanza a ASK_NAME
  - ❌ Negativas: "no", "después", "cancelar" → Cancela el proceso

#### Estado 2: ASK_NAME (Captura de Nombre)
- **Voz del Coach**: "Excelente. Para crear tu perfil cognitivo, ¿cuál es tu nombre completo?"
- **Procesamiento**: Captura todo el texto como nombre
- **Siguiente**: Avanza automáticamente a CONFIRM_NAME

#### Estado 3: CONFIRM_NAME (Confirmación de Nombre)
- **Voz del Coach**: "Entendido. Tu nombre es [userName]. ¿Es correcto?"
- **Respuestas aceptadas**:
  - ✅ Afirmativas: "sí", "correcto", "exacto" → Avanza a ASK_AGE
  - ❌ Negativas: "no", "error", "mal" → Vuelve a ASK_NAME

#### Estado 4: ASK_AGE (Captura de Edad)
- **Voz del Coach**: "¿Cuál es tu edad actual?"
- **Procesamiento**: Extrae números del texto (rango válido: 4-18 años)
- **Siguiente**: Avanza automáticamente a FINAL_VERIFICATION

#### Estado 5: FINAL_VERIFICATION (Verificación Total)
- **Voz del Coach**: "Tu nombre es [userName] y tu edad es [userAge]. ¿Está todo listo para empezar a descubrir tu genialidad?"
- **Respuestas aceptadas**:
  - ✅ Afirmativas: "sí", "listo", "adelante" → Avanza a COMPLETED
  - ❌ Negativas: "no" → Vuelve a ASK_NAME

#### Estado 6: COMPLETED (Finalización)
- **Voz del Coach**: "¡Perfecto! Bienvenido a CogniMirror. Vamos a tu perfil."
- **Acción**: Ejecuta `handleLogin(userName, userAge)` y navega al dashboard

## 🎨 Características Visuales

### Indicadores de Estado

1. **Banner Superior**
   - Fondo degradado púrpura-rosa
   - Texto: "MODO VOCAL ACTIVADO"
   - Ícono de micrófono animado

2. **Indicador de Micrófono**
   - 🔴 Rojo pulsante: Escuchando
   - 🔵 Azul pulsante: Coach hablando
   - ⚫ Gris: Inactivo

3. **Panel de Datos Capturados**
   - Muestra nombre y edad en tiempo real
   - Checkmarks verdes cuando se confirman

4. **Historial de Conversación**
   - Registro completo del diálogo
   - Diferenciación visual entre coach y usuario

## 🔧 Integración en App.tsx

### Rutas Agregadas

```typescript
type Page = 
  | 'voice-welcome'      // Pantalla de selección de modo
  | 'voice-onboarding'   // Proceso de registro vocal
  // ... otras rutas
```

### Flujo de Navegación

```
App inicia → 'voice-welcome' (por defecto)
              ↓
         Usuario elige modo
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
'voice-onboarding'  'try-now'
(Modo Vocal)        (Modo Tradicional)
    ↓                   ↓
'patient-profile' (Dashboard)
```

## 🎯 Filtros de Intención

### Palabras Clave Afirmativas
- sí, si, claro, acepto, correcto, exacto, listo, adelante, ok, vale, perfecto

### Palabras Clave Negativas
- no, después, cancelar, error, mal, incorrecto

### Extracción de Datos

**Nombre**: 
- Capitaliza cada palabra
- Ejemplo: "maría garcía" → "María García"

**Edad**:
- Extrae números del texto
- Valida rango 4-18 años
- Ejemplo: "tengo 12 años" → 12

## 🌐 Compatibilidad del Navegador

### Web Speech API
- ✅ Chrome/Edge (Chromium)
- ✅ Safari (iOS/macOS)
- ⚠️ Firefox (soporte limitado)

### Idioma
- Configurado para español (es-ES)
- Puede ajustarse en `VoiceRecognitionService`

## 🚀 Uso

### Para el Usuario

1. Abrir la aplicación
2. Escuchar la pregunta: "¿Deseas usar el modo vocal?"
3. Responder "sí" o hacer clic en "Modo Vocal"
4. Seguir las instrucciones del coach
5. Hablar claramente cuando el micrófono esté rojo
6. Confirmar o corregir información cuando se solicite

### Para el Desarrollador

```typescript
// Usar el servicio de voz en cualquier componente
import { VoiceRecognitionService, VoiceSynthesisService } from '../services/voiceRecognition';

const voiceRecognition = new VoiceRecognitionService();
const voiceSynthesis = new VoiceSynthesisService();

// Hablar
voiceSynthesis.speak('Hola, bienvenido');

// Escuchar
voiceRecognition.startListening(
  (transcript) => console.log('Usuario dijo:', transcript)
);
```

## 🔒 Seguridad y Privacidad

- No se graba audio
- Solo se procesa texto transcrito
- Procesamiento local en el navegador
- No se envían datos de voz a servidores externos

## 🐛 Solución de Problemas

### El micrófono no funciona
- Verificar permisos del navegador
- Asegurar conexión HTTPS (requerida por Web Speech API)
- Comprobar que el micrófono esté conectado

### No reconoce mi voz
- Hablar más claro y despacio
- Reducir ruido de fondo
- Verificar idioma del navegador

### El coach no habla
- Verificar volumen del sistema
- Comprobar que el navegador tenga permisos de audio
- Reiniciar la página

## 📝 Archivos Creados

```
src/
├── services/
│   └── voiceRecognition.ts          # Servicio de reconocimiento y síntesis de voz
├── pages/
│   ├── VoiceOnboardingWelcome.tsx   # Pantalla de selección de modo
│   └── VOnboarding.tsx              # Componente principal FSM
├── components/
│   └── common/
│       └── VoiceModeIndicator.tsx   # Indicador visual de modo vocal
└── App.tsx                          # Integración de rutas
```

## 👥 Créditos

Desarrollado para CogniMirror - Plataforma de Evaluación Cognitiva Infantil

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2024
