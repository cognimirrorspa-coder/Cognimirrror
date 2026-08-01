# 🔥 VERIFICACIÓN DE FIREBASE - ANÁLISIS COGNITIVO

## ✅ ESTADO: SISTEMA COMPLETAMENTE CONECTADO

### 📋 Configuración Actual

```
Firebase Project: cogntech-2fca1
Colección: analysisGameSessions
ID de Documento: {userId}_{startTime}
```

---

## 🧪 MÉTODO 1: Verificación Visual (Más Fácil)

### Opción A: Botón de Verificación en la App

1. Abre el juego: `http://localhost:5173`
2. Ve a **Memory Mirror**
3. Busca el botón verde: **🧪 Verificar Firebase**
4. Click → Revisa la consola del navegador (F12)

### Opción B: Ver Historial

1. Juega una partida completa
2. Click en botón **Historial Cognitivo** (morado)
3. Si ves tus sesiones = Firebase está guardando ✅

---

## 🔍 MÉTODO 2: Firebase Console (Directo)

### Paso 1: Acceder a Firebase Console

```
URL: https://console.firebase.google.com/project/cogntech-2fca1/firestore/databases/-default-/data/~2F
```

### Paso 2: Navegar a los Datos

1. **Firestore Database** (menú izquierdo)
2. Busca colección: `analysisGameSessions`
3. Deberías ver documentos con formato: `demo-user_2025-01-29T08:30:00.000Z`

### Paso 3: Verificar Estructura

Click en cualquier documento y verifica que contenga:

```json
{
  "gameId": "memory_mirror_v1",
  "userId": "demo-user",
  "userName": "Brayan",
  "startTime": "2025-01-29T08:30:00.000Z",
  "endTime": "2025-01-29T08:32:15.500Z",
  "metrics": {
    "maxSpan": 7,
    "totalSessionTime": 135.5,
    "errorRate": 25,
    "persistence": 3,
    "cognitiveFluency": 850,
    "selfCorrectionIndex": 15.3,
    "allTaps": [Array],  ← Click aquí para ver TODOS los timestamps
    "roundsData": [Array]
  },
  "rounds": [Array]
}
```

---

## 💻 MÉTODO 3: Consola del Navegador (Avanzado)

Abre la consola (F12) y ejecuta:

```javascript
// Importar función de verificación
import { testFirebaseData } from './src/utils/testFirebaseConnection';

// Ejecutar test
await testFirebaseData('demo-user');
```

O copia y pega esto directamente:

```javascript
// Script rápido de verificación
(async () => {
  const { getUserAnalysisSessions } = await import('./src/data/firebase');
  const sessions = await getUserAnalysisSessions('demo-user');
  
  console.log(`📊 Total de sesiones en Firebase: ${sessions.length}`);
  
  if (sessions.length > 0) {
    const last = sessions[0];
    console.log('✅ Última sesión:');
    console.log('   Game:', last.gameId);
    console.log('   Usuario:', last.userName);
    console.log('   Max Span:', last.metrics.maxSpan);
    console.log('   Total Taps:', last.metrics.allTaps?.length);
  }
})();
```

---

## 📝 LOGS DE CONFIRMACIÓN

Cuando juegas una partida, deberías ver en consola:

```
📊 [Análisis Cognitivo] Ronda finalizada - Nivel: 5, Intento: 1...
🧠 ===== MÉTRICAS CALCULADAS =====
...
📤 [Análisis Cognitivo] Sesión enviada al historial
➕ [Historial] Nueva sesión agregada - memory_mirror_v1 - Max Span: 7
💾 [Historial] 1 sesiones guardadas en localStorage
☁️ [Historial] Sesión sincronizada con Firebase  ← ¡CONFIRMACIÓN!
✅ Sesión de análisis guardada en Firebase: memory_mirror_v1 Max Span: 7
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "Permission denied"

**Causa:** Reglas de Firestore muy restrictivas

**Solución:** Ve a Firebase Console → Firestore → Rules y usa:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /analysisGameSessions/{document=**} {
      allow read, write: if true; // TEMP - cambiar en producción
    }
  }
}
```

### Error: "Network error"

**Causa:** Offline o firewall

**Solución:** 
1. Verifica conexión a internet
2. Revisa configuración de red
3. Los datos se guardan en localStorage de todas formas

---

## 📊 ESTRUCTURA DE DATOS GUARDADOS

### Cada documento contiene:

```typescript
{
  // Metadata
  gameId: string;
  userId: string;
  userName: string;
  startTime: string; // ISO timestamp
  endTime: string;
  
  // Métricas agregadas
  metrics: {
    // CAPA 1: Rendimiento
    maxSpan: number;
    totalSessionTime: number;
    errorRate: number;
    totalAttempts: number;
    successfulAttempts: number;
    
    // CAPA 2: Proceso
    persistence: number;
    cognitiveFluency: number;
    selfCorrectionIndex: number;
    
    // DATOS RAW (TODOS los timestamps individuales)
    allTaps: TapData[];      ← Array con 50-100+ objetos
    roundsData: RoundData[]; ← Array con 10-20 objetos
  },
  
  // Historial detallado
  rounds: RoundData[]; // Duplicado para compatibilidad
}
```

### Cada TapData contiene:

```typescript
{
  timestamp: 1234.5678,    // performance.now() - milisegundos
  blockId: 3,              // 0-8
  expected: 3,             // Qué bloque esperaba
  isCorrect: true,         // Si acertó
  position: 0              // Posición en la secuencia
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Firebase Console accesible
- [ ] Colección `analysisGameSessions` existe
- [ ] Documentos con formato correcto
- [ ] Campo `allTaps` tiene múltiples objetos
- [ ] Cada tap tiene `timestamp` individual
- [ ] Logs de confirmación en consola
- [ ] Botón "Historial Cognitivo" muestra datos

---

## 🎯 RESULTADO ESPERADO

Después de jugar **1 partida completa**:

```
Firebase Firestore
└── analysisGameSessions
    └── demo-user_2025-01-29T... (1 documento nuevo)
        ├── 8 métricas calculadas
        ├── 50+ timestamps individuales en allTaps
        └── 10+ rondas detalladas en roundsData
```

**Estado:** ✅ SISTEMA OPERACIONAL Y GUARDANDO
