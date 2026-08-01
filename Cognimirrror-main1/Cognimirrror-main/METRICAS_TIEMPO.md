# Sistema de Métricas de Tiempo - CogniMirror

## 📊 Resumen de Implementación

Se ha implementado un **sistema completo de captura de métricas de tiempo** que registra:

1. ✅ **Tiempo de sesión global** (toda la aplicación)
2. ✅ **Tiempo por juego individual** (Memory Mirror y Strategy Mirror)
3. ✅ **Tiempo por página/vista**
4. ✅ **Almacenamiento local persistente** (localStorage)
5. ✅ **Visualizador de métricas** con estadísticas detalladas

---

## 🎮 Juegos Integrados

### Memory Mirror
- ✅ Captura tiempo de inicio y fin de cada partida
- ✅ Registra nivel máximo alcanzado
- ✅ Calcula tasa de completación
- ✅ Almacena duración promedio de partidas

### Strategy Mirror (Rubik Cube)
- ✅ Captura tiempo de inicio y fin de cada partida
- ✅ Registra eficiencia (score)
- ✅ Calcula tasa de completación
- ✅ Almacena duración promedio de partidas

---

## 🔧 Archivos Modificados

### 1. **`src/services/metrics.ts`** (Mejorado completamente)
**Funcionalidades agregadas:**
- `startGame(gameName, metadata)` - Inicia tracking de un juego
- `endGame(completed, finalData)` - Finaliza tracking con datos finales
- `startPageView(pageName)` - Inicia tracking de una página
- `getSessionStats()` - Obtiene estadísticas de todas las sesiones
- `getGameStats(gameName)` - Obtiene estadísticas de un juego específico
- `saveToLocalStorage()` - Guarda métricas en localStorage automáticamente cada 30s
- `getAllSessions()` - Recupera todas las sesiones almacenadas
- `clearAllMetrics()` - Limpia todas las métricas (con confirmación)

**Estructura de datos:**
```typescript
interface SessionMetrics {
  sessionId: string;
  startTime: number;
  totalDuration?: number;
  games: GameMetric[];
  pages: Record<string, number>;
  events: MetricEvent[];
}

interface GameMetric {
  gameName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  level?: number;
  score?: number;
  completed: boolean;
}
```

### 2. **`src/components/mirrors/MemoryMirror.tsx`**
**Cambios:**
- Importa `metrics` service
- Llama `metrics.startGame('memory_mirror')` al iniciar juego
- Llama `metrics.endGame(true, { level, score })` al finalizar
- Mejora lógica de niveles con logging detallado

### 3. **`src/components/games/RubikCube.tsx`**
**Cambios:**
- Importa `metrics` service
- Llama `metrics.startGame('strategy_mirror_rubik')` al mezclar cubo
- Llama `metrics.endGame(true, { level: 1, score: efficiency })` al resolver

### 4. **`src/App.tsx`**
**Cambios:**
- Llama `metrics.startPageView(page)` en cada navegación
- Captura automáticamente tiempo en cada página

### 5. **`src/components/common/MetricsViewer.tsx`** (NUEVO)
**Componente visual completo que muestra:**
- Resumen general (sesiones, tiempo total, juegos jugados)
- Estadísticas de Memory Mirror
- Estadísticas de Strategy Mirror
- Distribución de juegos
- Botón para limpiar métricas

### 6. **`src/pages/PatientProfile.tsx`**
**Cambios:**
- Agrega botón "Ver Métricas" con diseño atractivo
- Integra componente `MetricsViewer` como modal

---

## 📦 Almacenamiento Local

Las métricas se guardan en **localStorage** bajo la clave: `cognimirror_metrics`

**Características:**
- ✅ Guardado automático cada 30 segundos
- ✅ Guardado al cerrar la aplicación (beforeunload)
- ✅ Mantiene las últimas 50 sesiones
- ✅ Formato JSON estructurado

**Ejemplo de datos almacenados:**
```json
[
  {
    "sessionId": "session_1730123456789_abc123",
    "startTime": 1730123456789,
    "totalDuration": 300000,
    "games": [
      {
        "gameName": "memory_mirror",
        "startTime": 1730123460000,
        "endTime": 1730123520000,
        "duration": 60000,
        "level": 7,
        "score": 7,
        "completed": true
      }
    ],
    "pages": {
      "patient-profile": 45000,
      "mirror-hub": 30000,
      "memory-mirror": 225000
    },
    "events": [...]
  }
]
```

---

## 🎯 Cómo Usar

### Para el Usuario (Paciente):
1. Navega a tu **Perfil de Paciente**
2. Busca la sección **"Métricas de Tiempo"** (tarjeta verde)
3. Haz clic en **"Ver Métricas"**
4. Visualiza:
   - Total de sesiones
   - Tiempo total en la aplicación
   - Estadísticas por juego
   - Mejor nivel alcanzado
   - Tasa de completación

### Para el Desarrollador:
```typescript
import { metrics } from './services/metrics';

// Iniciar tracking de un juego
metrics.startGame('mi_juego', { userId: '123' });

// Finalizar juego
metrics.endGame(true, { level: 5, score: 100 });

// Obtener estadísticas
const stats = metrics.getSessionStats();
console.log(stats);

// Obtener estadísticas de un juego específico
const gameStats = metrics.getGameStats('memory_mirror');
console.log(gameStats);
```

---

## 🐛 Correcciones en Memory Mirror

### Problema de Niveles
**Antes:** Posible desincronización entre `currentLevel` y `maxLevel`

**Solución:**
- Se calcula `newMaxLevel` explícitamente antes de actualizar estados
- Se agrega logging detallado para debugging
- Se registra `maxLevel` en eventos del recorder

**Código mejorado:**
```typescript
const handleLevelComplete = () => {
  const newLevel = currentLevel + 1;
  const newMaxLevel = Math.max(maxLevel, newLevel);
  
  setCurrentLevel(newLevel);
  setMaxLevel(newMaxLevel);
  setUserSequence([]);

  recorder.recordEvent({
    type: 'level_up',
    value: { newLevel, sequenceLength: newLevel, maxLevel: newMaxLevel }
  });

  console.log(`✅ [Memory Mirror] Nivel completado! Nuevo nivel: ${newLevel}, Mejor nivel: ${newMaxLevel}`);
  
  // ... resto del código
};
```

---

## 📈 Métricas Capturadas

### Por Sesión:
- ⏱️ Duración total de la sesión
- 🎮 Número de juegos jugados
- 📄 Páginas visitadas y tiempo en cada una
- 📊 Eventos registrados

### Por Juego:
- ⏱️ Duración de cada partida
- 🏆 Nivel alcanzado (Memory Mirror)
- 💯 Score/Eficiencia (Strategy Mirror)
- ✅ Estado de completación
- 📊 Tasa de completación promedio
- ⭐ Mejor nivel alcanzado

### Estadísticas Globales:
- 📊 Total de sesiones
- ⏱️ Tiempo total acumulado
- 🎮 Total de juegos jugados
- 📈 Distribución de juegos por tipo
- ⏰ Duración promedio de sesiones

---

## 🔍 Debugging

El sistema incluye logging detallado en consola:

```
🎮 [Metrics] Juego iniciado: memory_mirror
✅ [Memory Mirror] Nivel completado! Nuevo nivel: 4, Mejor nivel: 4
🏁 [Metrics] Juego finalizado: memory_mirror { duration: '45s', completed: true, level: 7, score: 7 }
💾 [Metrics] Métricas guardadas localmente
📊 [Metrics] Sesión finalizada: { duration: '300s', games: 2, pages: 3 }
```

---

## ⚠️ Notas Importantes

1. **Persistencia:** Las métricas se guardan en localStorage, por lo que persisten entre sesiones del navegador.

2. **Límite de almacenamiento:** Se mantienen las últimas 50 sesiones para evitar llenar el localStorage.

3. **Privacidad:** Todas las métricas se almacenan localmente en el navegador del usuario. No se envían a ningún servidor (por ahora).

4. **Limpieza:** El usuario puede limpiar todas las métricas desde el visualizador con confirmación.

5. **Compatibilidad:** Funciona en todos los navegadores modernos que soporten localStorage.

---

## 🚀 Próximos Pasos (Opcional)

- [ ] Envío de métricas a servidor/Firebase
- [ ] Gráficos de progreso temporal
- [ ] Comparación con otros usuarios (anónima)
- [ ] Exportación de métricas a CSV/JSON
- [ ] Alertas de tiempo de uso excesivo
- [ ] Integración con sistema de logros

---

## ✅ Confirmación de Implementación

**Todo el sistema está funcionando y listo para usar:**

✅ Servicio de métricas completo y robusto  
✅ Integración en Memory Mirror  
✅ Integración en Strategy Mirror (Rubik)  
✅ Tracking de navegación en App.tsx  
✅ Almacenamiento local persistente  
✅ Visualizador de métricas con UI atractiva  
✅ Botón de acceso en Perfil de Paciente  
✅ Corrección de problemas de niveles en Memory Mirror  
✅ Logging detallado para debugging  

**¡El sistema está completamente operativo! 🎉**
