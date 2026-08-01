# Actualización: Métricas en Firebase + Corrección de Bugs

## 📋 Resumen de Cambios

Se han implementado las siguientes mejoras críticas:

1. ✅ **Corrección de bugs de niveles en Memory Mirror**
2. ✅ **Guardado automático de métricas en Firebase por usuario**
3. ✅ **Exportación de métricas a Excel (CSV) y JSON**
4. ✅ **Sistema robusto de tracking con logging detallado**

---

## 🐛 Correcciones en Memory Mirror

### Bugs Identificados y Corregidos:

#### 1. **Secuencias con números duplicados consecutivos**
**Problema:** La secuencia podía generar el mismo número dos veces seguidas (ej: [3, 3, 5]), confundiendo al jugador.

**Solución:**
```typescript
const generateSequence = (length: number) => {
  const newSeq: number[] = [];
  let lastNumber = -1;
  
  // Generar secuencia sin números consecutivos repetidos
  for (let i = 0; i < length; i++) {
    let randomNum;
    do {
      randomNum = Math.floor(Math.random() * 9);
    } while (randomNum === lastNumber && length > 1);
    
    newSeq.push(randomNum);
    lastNumber = randomNum;
  }
  // ...
};
```

#### 2. **Mejor tracking de errores y niveles**
**Mejoras:**
- Logging detallado de cada click del usuario
- Validación de posición correcta en la secuencia
- Registro de nivel actual y máximo en cada evento
- Mensajes de consola para debugging

**Ejemplo de logs:**
```
🎮 [Memory Mirror] Secuencia generada - Nivel 4: [2, 7, 1, 5]
👆 [Memory Mirror] Click: 2, Esperado: 2, Correcto: true, Posición: 1/4
👆 [Memory Mirror] Click: 7, Esperado: 7, Correcto: true, Posición: 2/4
❌ [Memory Mirror] Error! Vidas restantes: 2, Nivel actual: 4
✅ [Memory Mirror] Nivel completado! Nuevo nivel: 5, Mejor nivel: 5
```

#### 3. **Sincronización de estados mejorada**
- Cálculo explícito de `newMaxLevel` antes de actualizar estados
- Registro de `maxLevel` en todos los eventos relevantes
- Mejor manejo de errores con información contextual

---

## 🔥 Integración con Firebase

### Nuevas Funciones en `firebase.ts`:

#### 1. **`saveUserTimeMetrics(metrics)`**
Guarda métricas de tiempo por usuario en Firestore.

```typescript
await saveUserTimeMetrics({
  userId: 'user123',
  sessionId: 'session_abc',
  startTime: 1730123456789,
  totalDuration: 300000,
  games: [...],
  pages: {...},
  timestamp: '2024-10-28T10:00:00.000Z'
});
```

**Colección Firestore:** `userTimeMetrics`  
**Documento ID:** `{userId}_{sessionId}`

#### 2. **`getUserTimeMetrics(userId)`**
Obtiene todas las métricas de un usuario, ordenadas por fecha descendente.

#### 3. **`getRecentUserTimeMetrics(userId, limit)`**
Obtiene las últimas N métricas de un usuario.

#### 4. **`getUserMetricsStats(userId)`**
Calcula estadísticas agregadas:
- Total de sesiones
- Tiempo total
- Total de juegos
- Distribución por tipo de juego
- Duración promedio de sesiones

#### 5. **`exportUserMetricsToJSON(userId)`**
Exporta métricas en formato plano para Excel:

```json
[
  {
    "Tipo": "SESION",
    "Usuario": "user123",
    "SessionID": "session_abc",
    "FechaInicio": "28/10/2024 10:00:00",
    "FechaFin": "28/10/2024 10:05:00",
    "DuracionMinutos": 5,
    "TotalJuegos": 2,
    "Juego": "",
    "Nivel": "",
    "Score": "",
    "Completado": ""
  },
  {
    "Tipo": "JUEGO",
    "Usuario": "user123",
    "SessionID": "session_abc",
    "FechaInicio": "28/10/2024 10:01:00",
    "FechaFin": "28/10/2024 10:03:00",
    "DuracionMinutos": 2,
    "TotalJuegos": "",
    "Juego": "memory_mirror",
    "Nivel": 7,
    "Score": 7,
    "Completado": "SÍ"
  }
]
```

---

## 📊 Servicio de Métricas Actualizado

### Nuevas Funcionalidades en `metrics.ts`:

#### 1. **`setUserId(userId)`**
Establece el ID del usuario actual para asociar métricas.

```typescript
metrics.setUserId('user123');
```

#### 2. **Guardado automático en Firebase**
- Se guarda cada 30 segundos automáticamente
- Se guarda al finalizar la sesión
- Se guarda al cerrar el navegador

```typescript
private async saveToFirebase(): Promise<void> {
  if (!this.currentUserId) {
    console.warn('⚠️ No se puede guardar en Firebase: usuario no establecido');
    return;
  }
  
  await saveUserTimeMetrics({
    userId: this.currentUserId,
    sessionId: this.sessionId,
    // ... datos de la sesión
  });
}
```

#### 3. **Integración en App.tsx**
El userId se establece automáticamente cuando el usuario inicia sesión:

```typescript
useEffect(() => {
  if (currentUser) {
    metrics.setUserId(currentUser.id);
    // ...
  }
}, [currentUser]);
```

---

## 📤 Exportación a Excel

### Componente `ExportMetrics.tsx`

Permite exportar métricas en dos formatos:

#### 1. **CSV (Excel)**
- Compatible con Excel, Google Sheets, etc.
- Formato UTF-8 con BOM para caracteres especiales
- Nombre de archivo: `CogniMirror_Metricas_{userName}_{fecha}.csv`

#### 2. **JSON**
- Formato estructurado para análisis programático
- Nombre de archivo: `CogniMirror_Metricas_{userName}_{fecha}.json`

### Uso:

```tsx
<ExportMetrics userId={userId} userName={userName} />
```

**Ubicación:** Integrado en el `MetricsViewer`

---

## 🗂️ Estructura de Datos en Firebase

### Colección: `userTimeMetrics`

```
userTimeMetrics/
  ├── user123_session_abc/
  │   ├── userId: "user123"
  │   ├── sessionId: "session_abc"
  │   ├── startTime: 1730123456789
  │   ├── endTime: 1730123756789
  │   ├── totalDuration: 300000
  │   ├── games: [
  │   │   {
  │   │     gameName: "memory_mirror",
  │   │     startTime: 1730123460000,
  │   │     endTime: 1730123580000,
  │   │     duration: 120000,
  │   │     level: 7,
  │   │     score: 7,
  │   │     completed: true
  │   │   }
  │   │ ]
  │   ├── pages: {
  │   │   "patient-profile": 45000,
  │   │   "mirror-hub": 30000,
  │   │   "memory-mirror": 225000
  │   │ }
  │   ├── timestamp: "2024-10-28T10:00:00.000Z"
  │   └── savedAt: 1730123756789
```

---

## 📁 Archivos Modificados/Creados

### Modificados:
1. ✏️ **`src/components/mirrors/MemoryMirror.tsx`**
   - Corrección de bugs de niveles
   - Mejora de logging
   - Prevención de duplicados consecutivos

2. ✏️ **`src/data/firebase.ts`**
   - Funciones para guardar/recuperar métricas
   - Función de exportación a JSON
   - Estadísticas agregadas

3. ✏️ **`src/services/metrics.ts`**
   - Integración con Firebase
   - Método `setUserId()`
   - Guardado automático periódico

4. ✏️ **`src/App.tsx`**
   - Establecer userId al iniciar sesión

5. ✏️ **`src/components/common/MetricsViewer.tsx`**
   - Props para userId y userName
   - Integración de botones de exportación

6. ✏️ **`src/pages/PatientProfile.tsx`**
   - Pasar userId y userName al MetricsViewer

### Creados:
7. ✨ **`src/components/common/ExportMetrics.tsx`**
   - Componente de exportación a CSV/JSON
   - Descarga automática de archivos

8. ✨ **`ACTUALIZACION_METRICAS_FIREBASE.md`**
   - Esta documentación

---

## 🚀 Cómo Usar

### Para el Usuario:

1. **Jugar** Memory Mirror o Strategy Mirror
2. Las métricas se guardan **automáticamente** en Firebase cada 30 segundos
3. Ir a **Perfil de Paciente** → **"Ver Métricas"**
4. Hacer clic en **"Exportar a Excel (CSV)"** o **"Exportar a JSON"**
5. El archivo se descarga automáticamente

### Para el Desarrollador:

```typescript
import { metrics } from './services/metrics';
import { saveUserTimeMetrics, getUserTimeMetrics } from './data/firebase';

// Establecer usuario
metrics.setUserId('user123');

// Las métricas se guardan automáticamente en Firebase

// Obtener métricas de un usuario
const userMetrics = await getUserTimeMetrics('user123');

// Exportar a JSON
const exportData = await exportUserMetricsToJSON('user123');
```

---

## 📊 Reglas de Firestore Recomendadas

Agregar a `firestore.rules`:

```javascript
match /userTimeMetrics/{document} {
  // Permitir lectura solo al propietario o admin
  allow read: if request.auth != null && 
    (resource.data.userId == request.auth.uid || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.type == 'institucional');
  
  // Permitir escritura solo al propietario
  allow write: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
}
```

---

## ✅ Checklist de Implementación

- [x] Corrección de bugs de niveles en Memory Mirror
- [x] Prevención de duplicados consecutivos en secuencias
- [x] Logging detallado para debugging
- [x] Funciones de Firebase para guardar métricas por usuario
- [x] Integración de guardado automático en `metrics.ts`
- [x] Establecer userId automáticamente en `App.tsx`
- [x] Componente de exportación a CSV/JSON
- [x] Integración en MetricsViewer
- [x] Documentación completa

---

## 🎯 Beneficios

### Para Usuarios:
- ✅ Juego más justo sin secuencias confusas
- ✅ Métricas guardadas automáticamente
- ✅ Exportación fácil a Excel
- ✅ Datos persistentes en la nube

### Para Terapeutas/Instituciones:
- ✅ Datos centralizados por usuario
- ✅ Análisis en Excel/Google Sheets
- ✅ Estadísticas agregadas disponibles
- ✅ Historial completo de sesiones

### Para Desarrolladores:
- ✅ Código limpio y documentado
- ✅ Logging detallado para debugging
- ✅ API clara para consultas
- ✅ Fácil integración con otros servicios

---

## 🔍 Debugging

### Logs en Consola:

```
👤 [Metrics] Usuario establecido: user123
🎮 [Memory Mirror] Secuencia generada - Nivel 3: [2, 5, 8]
👆 [Memory Mirror] Click: 2, Esperado: 2, Correcto: true, Posición: 1/3
🎉 [Memory Mirror] ¡Secuencia completada correctamente!
✅ [Memory Mirror] Nivel completado! Nuevo nivel: 4, Mejor nivel: 4
💾 [Metrics] Métricas guardadas localmente
🔥 [Metrics] Métricas guardadas en Firebase
📊 [Metrics] Sesión finalizada: { duration: '120s', games: 1, pages: 2 }
```

---

## ⚠️ Notas Importantes

1. **Firebase:** Asegúrate de que las reglas de Firestore permitan escritura en `userTimeMetrics`
2. **Usuario:** El userId debe estar establecido antes de jugar para que las métricas se guarden en Firebase
3. **Exportación:** Los archivos CSV usan UTF-8 con BOM para compatibilidad con Excel
4. **Límites:** Firebase tiene límites de escritura (1 escritura/segundo por documento)

---

## 🎉 Conclusión

**Sistema completamente funcional:**

✅ Bugs de Memory Mirror corregidos  
✅ Métricas guardadas en Firebase por usuario  
✅ Exportación a Excel (CSV) y JSON  
✅ Guardado automático cada 30 segundos  
✅ Logging detallado para debugging  
✅ Documentación completa  

**¡Todo listo para producción! 🚀**
