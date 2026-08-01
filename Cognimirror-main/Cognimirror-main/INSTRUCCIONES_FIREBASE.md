# 🔥 INSTRUCCIONES: CONECTAR FIREBASE

## ⚠️ PROBLEMA DETECTADO

**Firebase está vacío porque las reglas NO permiten escribir en `analysisGameSessions`**

---

## ✅ SOLUCIÓN: Actualizar Reglas de Firestore

### **OPCIÓN A: Copiar y Pegar en Firebase Console (Más Fácil)**

#### PASO 1: Ir a Firebase Console
```
https://console.firebase.google.com/project/cogntech-2fca1/firestore/rules
```

#### PASO 2: Reemplazar TODAS las reglas con esto:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios (incluyendo anónimos)
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     (request.auth.uid == userId || request.resource.data.isAnonymous == true);
    }
    
    // Sesiones cognitivas (usuarios autenticados y anónimos)
    match /cognitiveSessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Perfiles cognitivos (usuarios autenticados y anónimos)
    match /cognitiveProfiles/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // ============================================================================
    // ANÁLISIS COGNITIVO DE ALTA FIDELIDAD - LOG DE BATALLA
    // ============================================================================
    
    // Sesiones de análisis cognitivo (usuarios autenticados y anónimos)
    match /analysisGameSessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Métricas de tiempo de usuario (para dashboard)
    match /userTimeMetrics/{metricId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### PASO 3: Click en "Publicar" o "Publish"

---

### **OPCIÓN B: Desplegar con Firebase CLI (Avanzado)**

```bash
# 1. Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# 2. Login a Firebase
firebase login

# 3. Desplegar reglas
firebase deploy --only firestore:rules
```

---

## 🧪 VERIFICAR QUE FUNCIONÓ

### **Test 1: Verificar Reglas en Console**

1. Ve a Firebase Console → Firestore → Reglas
2. Deberías ver la sección: `// ANÁLISIS COGNITIVO DE ALTA FIDELIDAD`
3. Confirma que existe: `match /analysisGameSessions/{sessionId}`

### **Test 2: Jugar y Verificar Datos**

1. Ve a tu app: `http://localhost:5173`
2. **IMPORTANTE**: Necesitas estar autenticado (aunque sea como anónimo)
3. Juega una partida COMPLETA de Memory Mirror
4. Abre Consola del navegador (F12)
5. Busca el log: `☁️ [Historial] Sesión sincronizada con Firebase`

### **Test 3: Ver Datos en Firebase**

1. Ve a: `https://console.firebase.google.com/project/cogntech-2fca1/firestore/data`
2. Deberías ver colección: `analysisGameSessions`
3. Click en ella → Verás documentos con formato: `{userId}_{timestamp}`
4. Click en un documento → Verás toda la estructura con timestamps

---

## 📊 QUÉ DATOS SE GUARDAN

Cada vez que terminas una partida, se guarda un documento con:

```json
{
  "gameId": "memory_mirror_v1",
  "userId": "tu-user-id-aqui",
  "userName": "Brayan",
  "startTime": "2025-01-29T08:30:00.000Z",
  "endTime": "2025-01-29T08:32:15.500Z",
  
  "metrics": {
    // CAPA 1: Rendimiento
    "maxSpan": 7,
    "totalSessionTime": 135.5,
    "errorRate": 25,
    "totalAttempts": 12,
    "successfulAttempts": 9,
    
    // CAPA 2: Proceso
    "persistence": 3,
    "cognitiveFluency": 850,
    "selfCorrectionIndex": 15.3,
    
    // DATOS RAW
    "allTaps": [
      {
        "timestamp": 1234.5678,
        "blockId": 3,
        "expected": 3,
        "isCorrect": true,
        "position": 0
      },
      // ... 50+ taps más
    ],
    
    "roundsData": [
      {
        "level": 3,
        "attempt": 1,
        "isCorrect": true,
        "timeTaken": 5.2,
        "taps": [/* ... */],
        "startTime": "2025-01-29T08:30:00.000Z",
        "endTime": "2025-01-29T08:30:05.200Z"
      }
      // ... más rondas
    ]
  }
}
```

---

## ⚠️ IMPORTANTE: NECESITAS AUTENTICACIÓN

El sistema requiere que el usuario esté autenticado (aunque sea como anónimo).

### **Verificar Estado de Autenticación:**

Abre consola del navegador y ejecuta:

```javascript
// Verificar si hay usuario autenticado
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('Usuario actual:', auth.currentUser);
```

Si devuelve `null`, necesitas habilitar **Anonymous Authentication**:

1. Firebase Console → Authentication → Sign-in method
2. Click en "Anonymous" → Enable → Save

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "Missing or insufficient permissions"

**Causa:** Las reglas no están actualizadas

**Solución:** Repite PASO 2 y asegúrate de publicar las reglas

### Error: "User not authenticated"

**Causa:** No hay sesión de usuario

**Solución:** 
1. Firebase Console → Authentication → Sign-in method
2. Habilita "Anonymous"
3. Reinicia la app

### Firebase está vacío después de jugar

**Posibles causas:**
1. Las reglas no se publicaron → Verifica en Firebase Console → Reglas
2. No completaste la partida → Debe llegar a "Game Over"
3. Error de red → Revisa consola del navegador

---

## ✅ CHECKLIST FINAL

- [ ] Reglas actualizadas en Firebase Console
- [ ] Botón "Publicar" clickeado
- [ ] Anonymous Auth habilitado
- [ ] Partida jugada COMPLETA (hasta Game Over)
- [ ] Log en consola: "☁️ Sesión sincronizada con Firebase"
- [ ] Colección `analysisGameSessions` visible en Firestore
- [ ] Documentos con estructura correcta

---

## 🎯 RESULTADO ESPERADO

Después de jugar 1 partida:

```
Firebase Console
└── Firestore Database
    └── analysisGameSessions (colección)
        └── demo-user_2025-01-29T... (documento)
            ├── gameId: "memory_mirror_v1"
            ├── metrics: { ... }
            │   ├── allTaps: [50+ objetos]
            │   └── roundsData: [10+ objetos]
            └── rounds: [...]
```

**Estado esperado:** 🟢 DATOS GUARDADOS Y VISIBLES EN FIREBASE
