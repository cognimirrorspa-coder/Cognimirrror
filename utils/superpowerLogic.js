/**
 * DICCIONARIO DE PERFILES COGNITIVOS CLÍNICOS
 * Terminología formal neuropsicológica para informes y pantallas de resultados.
 */
export const SUPERPODERES_DICT = {
  Precision: {
    titulo: 'Precisión y Control Ejecutivo',
    descripcion: 'Patrón caracterizado por deliberación estratégica y supresión de respuestas apresuradas, garantizando una tasa óptima de exactitud y control de impulsos.',
    color: 'from-blue-500 to-indigo-600',
    icon: 'Brain'
  },
  Freno: {
    titulo: 'Control Inhibitorio Prefrontal Superior',
    descripcion: 'Capacidad destacada de supresión de respuestas motoras automatizadas ante estímulos No-Go, reflejando adecuada indemnidad de la función ejecutiva.',
    color: 'from-purple-400 to-indigo-500',
    icon: 'ShieldCheck'
  },
  Velocidad: {
    titulo: 'Velocidad de Procesamiento Psicomotor Rápida',
    descripcion: 'Tiempos de latencia motora en rango percentilar superior, con adecuada decodificación visuoperceptual y rápida respuesta neuromuscular.',
    color: 'from-blue-400 to-cyan-500',
    icon: 'Zap'
  },
  Ambidextrismo: {
    titulo: 'Simetría Interhemisférica Funcional',
    descripcion: 'Equivalencia estadística en las latencias de respuesta entre hemicuerpos, indicando un procesamiento bilateral armónico.',
    color: 'from-emerald-400 to-teal-500',
    icon: 'Activity'
  },
  Flujo: {
    titulo: 'Atención Sostenida y Estabilidad Operativa',
    descripcion: 'Rendimiento continuo y focalizado sin fluctuaciones atencionales marcadas ni bloqueos inhibitorios durante la ejecución de la prueba.',
    color: 'from-blue-400 to-emerald-400',
    icon: 'CheckCircle2'
  },
  Metronomo: {
    titulo: 'Consistencia Temporal y Estabilidad Motriz',
    descripcion: 'Baja variabilidad temporal en las respuestas motoras sucesivas, evidenciando regularidad óptima en los circuitos de control ejecutivo.',
    color: 'from-slate-300 to-slate-500',
    icon: 'Gauge'
  }
};

/**
 * LÓGICA DE CLASIFICACIÓN NEUROCOGNITIVA
 */
export function calcularSuperpoder(historial) {
  if (!historial || historial.length === 0) return SUPERPODERES_DICT.Flujo;

  const turns = historial.filter(t => !t.isFalseStart);
  const goTurns = turns.filter(t => t.reactionTimeMs > 0);
  const correctGoTurns = goTurns.filter(t => t.esCorrecto);
  
  const noGoTurns = historial.filter(t => t.expectedFace === 'AZUL' || t.expectedFace === 'VERDE');
  const noGoSuccess = noGoTurns.filter(t => t.esCorrecto);

  // 1. Métricas Base
  const precisionNoGo = noGoTurns.length > 0 ? (noGoSuccess.length / noGoTurns.length) : 1;
  const precisionGo = goTurns.length > 0 ? (correctGoTurns.length / goTurns.length) : 1;
  
  const tiempoPromedioGo = correctGoTurns.length > 0 
    ? (correctGoTurns.reduce((s, t) => s + t.reactionTimeMs, 0) / correctGoTurns.length) 
    : 9999;
  
  const rightTurns = correctGoTurns.filter(t => t.expectedFace === 'R');
  const leftTurns = correctGoTurns.filter(t => t.expectedFace === 'L');
  const avgR = rightTurns.length ? (rightTurns.reduce((s, t) => s + t.reactionTimeMs, 0) / rightTurns.length) : 0;
  const avgL = leftTurns.length ? (leftTurns.reduce((s, t) => s + t.reactionTimeMs, 0) / leftTurns.length) : 0;
  const diffDominancia = (avgR && avgL) ? Math.abs(avgR - avgL) : 999;

  // 1.2 Variabilidad
  const calculateVar = (arr) => {
    if (arr.length < 3) return 999;
    const times = arr.map(t => t.reactionTimeMs);
    return Math.max(...times) - Math.min(...times);
  };
  const varR = calculateVar(rightTurns);
  const varL = calculateVar(leftTurns);

  // 2. Evaluación por Criterios Clínicos
  if (precisionNoGo === 1 && precisionGo === 1 && tiempoPromedioGo > 450 && turns.length >= 4) {
    return { ...SUPERPODERES_DICT.Precision, id: 'Precision' };
  }
  
  if (precisionNoGo === 1 && noGoTurns.length >= 2) {
    return { ...SUPERPODERES_DICT.Freno, id: 'Freno' };
  }

  if (varR < 40 && varL < 40 && rightTurns.length >= 3 && leftTurns.length >= 3) {
    return { ...SUPERPODERES_DICT.Metronomo, id: 'Metronomo' };
  }

  if (tiempoPromedioGo < 350) return { ...SUPERPODERES_DICT.Velocidad, id: 'Velocidad' };
  if (diffDominancia < 20 && rightTurns.length >= 2 && leftTurns.length >= 2) {
    return { ...SUPERPODERES_DICT.Ambidextrismo, id: 'Ambidextrismo' };
  }

  return { ...SUPERPODERES_DICT.Flujo, id: 'Flujo' };
}

/**
 * MODULACIÓN DE CONTEXTO CLÍNICO
 */
export function calcularBonoContexto(historial, sessionMeta, perfilId) {
  if (!sessionMeta) return null;

  const { horasSueno, nivelRuido, estadoAnimo } = sessionMeta;

  if (horasSueno && Number(horasSueno) <= 6) {
    return {
      id: 'reserva',
      tipo: 'warning',
      texto: 'Compensación Ejecutiva: A pesar de un descanso reportado menor a 6 horas, se mantuvo adecuado control temporal y estabilidad motriz.'
    };
  }

  if (nivelRuido && Number(nivelRuido) >= 6) {
    return {
      id: 'aislamiento',
      tipo: 'info',
      texto: 'Focalización en Entorno Ruidoso: El sujeto mantuvo focalización atencional sin interferencia ambiental significativa.'
    };
  }

  if (estadoAnimo && (estadoAnimo === 'estresado' || estadoAnimo === 'cansado')) {
    return {
      id: 'regulacion',
      tipo: 'info',
      texto: 'Resiliencia y Autorregulación: Control adecuado de respuestas inhibitorias en condición de estrés o fatiga subjetiva.'
    };
  }

  return null;
}

/**
 * SESGO COGNITIVO
 */
export function calcularSesgo(historial, stats) {
  if (!historial || historial.length === 0) return null;

  const noGoTurns = historial.filter(t => t.expectedFace === 'AZUL' || t.expectedFace === 'VERDE');
  const noGoErrors = noGoTurns.filter(t => !t.esCorrecto).length;

  if (noGoErrors > 0 && stats.avgTime < 380) {
    return {
      nombre: 'Sesgo de Impulsividad Motora',
      descripcion: 'Priorización de velocidad de respuesta sobre la exactitud de discriminación No-Go.'
    };
  }

  if (stats.accuracy === 100 && stats.avgTime > 480) {
    return {
      nombre: 'Sesgo de Cautela Deliberada',
      descripcion: 'Verificación exhaustiva del estímulo antes de iniciar la acción motriz.'
    };
  }

  return {
    nombre: 'Balance Visomotor Homogéneo',
    descripcion: 'Adecuado equilibrio entre latencia de respuesta y precisión ejecutiva.'
  };
}
