import type { CognitiveSummary } from './useCognitiveMetrics';

export function getCoachMessages(m: CognitiveSummary | null): string[] {
  if (!m) return [
    'Aún no hay suficientes datos. Juega algunas sesiones para activar el coach.'
  ];

  const msgs: string[] = [];

  if (m.accuracy < 60 && m.fatigue < -0.1) {
    msgs.push('Estás cansado. Probemos una pausa breve y retomemos con un nivel anterior.');
  }

  if (m.selfCorrectionRate > 0.5) {
    msgs.push('¡Excelente resiliencia! Te recuperas rápido tras un error.');
  }

  if (m.fluency >= 1000) {
    msgs.push('Fluidez cognitiva destacada. Mantén el ritmo y enfócate en precisión.');
  } else if (m.fluency < 700) {
    msgs.push('Trabaja en la consistencia: respira, mira el patrón y actúa con calma.');
  }

  if (m.avgRT > 1500) {
    msgs.push('Los tiempos de reacción están algo altos. Intenta anticipar visualmente el próximo paso.');
  }

  if (msgs.length === 0) {
    msgs.push('Buen progreso. Continúa practicando para consolidar avances.');
  }

  return msgs;
}
