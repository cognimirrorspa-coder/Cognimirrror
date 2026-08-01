# 🔄 Implementación de la Máquina de Estados Finitos (FSM)

## 📋 Descripción General

El componente `VOnboarding.tsx` implementa una **Máquina de Estados Finitos (FSM)** para gestionar el diálogo vocal del onboarding. Esta arquitectura garantiza un flujo predecible y robusto.

## 🎯 Estados de la FSM

```typescript
type DialogState = 
  | 'welcome'           // Estado inicial: Bienvenida
  | 'askName'           // Estado 2: Pregunta nombre
  | 'confirmName'       // Estado 3: Confirmación de nombre
  | 'askAge'            // Estado 4: Pregunta edad
  | 'finalCheck'        // Estado 5: Verificación final
  | 'completed';        // Estado final: Completado
```

## 🔄 Diagrama de Transiciones

```
┌─────────┐
│ welcome │ ─── Sí ───→ ┌─────────┐
└─────────┘             │ askName │
     │                  └─────────┘
     No                      │
     │                       ↓
     ↓                  ┌─────────────┐
   [Home]              │ confirmName │
                       └─────────────┘
                            │     │
                           Sí    No (VUELTA)
                            │     │
                            ↓     ↓
                       ┌─────────┐
                       │ askAge  │←─┘
                       └─────────┘
                            │
                            ↓
                       ┌────────────┐
                       │ finalCheck │
                       └────────────┘
                            │     │
                           Sí    No (RESET)
                            │     │
                            ↓     └──→ [Volver a askName]
                       ┌───────────┐
                       │ completed │
                       └───────────┘
                            │
                            ↓
                       [Dashboard]
```

## 🔧 Implementación Técnica

### 1. Estado de la FSM

```typescript
const [dialogPhase, setDialogPhase] = useState<DialogState>('welcome');
```

### 2. Función de Transición

```typescript
const transitionToState = (newState: DialogState) => {
  setDialogPhase(newState);
  addToHistory(`📍 Estado: ${getStateLabel(newState)}`);

  switch (newState) {
    case 'welcome':
      speak('¿Deseas probar la aplicación ahora mismo?', () => {
        startListening();
      });
      break;

    case 'askName':
      speak('Excelente. Para crear tu perfil cognitivo, ¿cuál es tu nombre completo?', () => {
        startListening();
      });
      break;

    case 'confirmName':
      speak(`Entendido. Tu nombre es ${userName}. ¿Es correcto?`, () => {
        startListening();
      });
      break;

    case 'askAge':
      speak('¿Cuál es tu edad actual?', () => {
        startListening();
      });
      break;

    case 'finalCheck':
      speak(`Tu nombre es ${userName} y tu edad es ${userAge}. ¿Está todo listo para empezar a descubrir tu genialidad?`, () => {
        startListening();
      });
      break;

    case 'completed':
      speak('¡Perfecto! Bienvenido a CogniMirror. Vamos a tu perfil.', () => {
        setTimeout(() => {
          handleLogin(userName, userAge!);
        }, 1000);
      });
      break;
  }
};
```

### 3. Lógica de Manejo de Input (SWITCH/CASE)

```typescript
const handleVoiceInput = (transcript: string) => {
  switch (dialogPhase) {
    case 'welcome':
      if (intentFilters.isAffirmative(transcript)) {
        transitionToState('askName');
      } else if (intentFilters.isNegative(transcript)) {
        speak('De acuerdo. Puedes volver cuando quieras.', () => {
          setTimeout(() => onNavigate('home'), 2000);
        });
      } else {
        speak('No entendí tu respuesta. Por favor, di sí o no.', () => {
          startListening();
        });
      }
      break;

    case 'askName':
      const extractedName = intentFilters.extractName(transcript);
      if (extractedName && extractedName.length > 2) {
        setUserName(extractedName);
        setTimeout(() => {
          transitionToState('confirmName');
        }, 100);
      } else {
        speak('No pude capturar tu nombre correctamente. Por favor, repítelo.', () => {
          startListening();
        });
      }
      break;

    case 'confirmName':
      // VUELTA AL ESTADO: Si dice "no", resetea y vuelve a askName
      if (intentFilters.isAffirmative(transcript)) {
        transitionToState('askAge');
      } else if (intentFilters.isNegative(transcript)) {
        setUserName('');  // Resetear nombre
        addToHistory('🔄 Volviendo a preguntar el nombre...');
        speak('¿Cuál es tu nombre correcto?', () => {
          setTimeout(() => {
            transitionToState('askName');
          }, 100);
        });
      } else {
        speak('No entendí. ¿Tu nombre es correcto? Di sí o no.', () => {
          startListening();
        });
      }
      break;

    case 'askAge':
      const extractedAge = intentFilters.extractAge(transcript);
      if (extractedAge !== null) {
        setUserAge(extractedAge);
        setTimeout(() => {
          transitionToState('finalCheck');
        }, 100);
      } else {
        speak('No pude capturar tu edad. Por favor, di un número entre 4 y 18.', () => {
          startListening();
        });
      }
      break;

    case 'finalCheck':
      if (intentFilters.isAffirmative(transcript)) {
        transitionToState('completed');
      } else if (intentFilters.isNegative(transcript)) {
        setUserName('');
        setUserAge(null);
        addToHistory('🔄 Reiniciando proceso...');
        speak('De acuerdo. Volvamos a empezar.', () => {
          setTimeout(() => {
            transitionToState('askName');
          }, 100);
        });
      } else {
        speak('No entendí. ¿Está todo correcto? Di sí o no.', () => {
          startListening();
        });
      }
      break;

    case 'completed':
      // Estado final - no hace nada
      break;
  }
};
```

## 🎨 Feedback Visual: Tela Flotante

### Implementación

```tsx
<div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-full shadow-2xl transition-all duration-300 ${
  isListening 
    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse scale-110' 
    : 'bg-gray-600'
}`}>
  <div className="flex items-center gap-3">
    <Mic className={`w-5 h-5 text-white ${isListening ? 'animate-bounce' : ''}`} />
    <span className="font-bold text-white text-sm">
      {isListening ? '🎤 ESCUCHANDO...' : 'MODO VOCAL ACTIVO'}
    </span>
    {isListening && (
      <div className="flex gap-1">
        <div className="w-1 h-4 bg-white rounded-full animate-pulse"></div>
        <div className="w-1 h-4 bg-white rounded-full animate-pulse delay-75"></div>
        <div className="w-1 h-4 bg-white rounded-full animate-pulse delay-150"></div>
      </div>
    )}
  </div>
</div>
```

### Estados Visuales

1. **Inactivo** (gris):
   - Texto: "MODO VOCAL ACTIVO"
   - Sin animación

2. **Escuchando** (azul pulsante):
   - Texto: "🎤 ESCUCHANDO..."
   - Micrófono rebotando
   - Barras de audio animadas
   - Escala aumentada (scale-110)

## 🔄 Vuelta al Estado (Rollback)

### Caso 1: Confirmación de Nombre

```typescript
case 'confirmName':
  if (intentFilters.isNegative(transcript)) {
    setUserName('');  // ← Resetear el nombre
    transitionToState('askName');  // ← Volver al estado anterior
  }
```

### Caso 2: Verificación Final

```typescript
case 'finalCheck':
  if (intentFilters.isNegative(transcript)) {
    setUserName('');    // ← Resetear nombre
    setUserAge(null);   // ← Resetear edad
    transitionToState('askName');  // ← Volver al inicio
  }
```

## 📊 Ventajas de la FSM

### 1. **Predecibilidad**
- Cada estado tiene transiciones claramente definidas
- No hay estados ambiguos

### 2. **Mantenibilidad**
- Fácil agregar nuevos estados
- Lógica centralizada en `handleVoiceInput`

### 3. **Debugging**
- Historial completo de transiciones
- Estado actual siempre visible

### 4. **Robustez**
- Manejo de errores por estado
- Recuperación automática de errores

### 5. **Testabilidad**
- Cada estado puede probarse independientemente
- Transiciones verificables

## 🧪 Casos de Prueba

### Test 1: Flujo Completo Exitoso
```
welcome → "sí" → askName → "Juan Pérez" → confirmName → "sí" 
→ askAge → "12" → finalCheck → "sí" → completed → [Dashboard]
```

### Test 2: Corrección de Nombre
```
welcome → "sí" → askName → "Juan" → confirmName → "no" 
→ askName → "Juan Pérez" → confirmName → "sí" → askAge...
```

### Test 3: Reinicio Completo
```
welcome → "sí" → askName → "Juan" → confirmName → "sí" 
→ askAge → "12" → finalCheck → "no" → askName → ...
```

### Test 4: Cancelación
```
welcome → "no" → [Home]
```

## 🎯 Intent Filters Utilizados

### isAffirmative()
Palabras: sí, si, claro, acepto, correcto, exacto, listo, adelante, ok, vale, perfecto

### isNegative()
Palabras: no, después, cancelar, error, mal, incorrecto

### extractName()
- Capitaliza cada palabra
- Ejemplo: "maría garcía" → "María García"

### extractAge()
- Extrae números del texto
- Valida rango 4-18 años
- Ejemplo: "tengo 12 años" → 12

## 📝 Mejores Prácticas Implementadas

1. ✅ **Un solo punto de entrada**: `handleVoiceInput()`
2. ✅ **Transiciones explícitas**: `transitionToState()`
3. ✅ **Reseteo de estado**: Limpia datos al volver atrás
4. ✅ **Feedback visual**: Tela flotante indica estado actual
5. ✅ **Historial**: Registro completo de la conversación
6. ✅ **Manejo de errores**: Reintentos automáticos
7. ✅ **Timeouts**: Delays para actualización de estado React

## 🚀 Próximas Mejoras

- [ ] Agregar estado de "pausa" para interrupciones
- [ ] Implementar timeout por inactividad
- [ ] Agregar comandos de navegación ("volver", "cancelar")
- [ ] Persistir estado en localStorage
- [ ] Agregar animaciones de transición entre estados

---

**Versión**: 2.0.0  
**Fecha**: Noviembre 2024  
**Arquitectura**: Finite State Machine (FSM)
