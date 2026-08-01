import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { rts } = body;

    if (!rts || !Array.isArray(rts) || rts.length === 0) {
      return NextResponse.json(
        { error: 'Formato inválido. Se requiere un array "rts" con tiempos de reacción.' },
        { status: 400 }
      );
    }

    // Filtrar valores válidos
    const validRts = rts.map(Number).filter(n => !isNaN(n) && n > 0);
    if (validRts.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron tiempos de reacción numéricos válidos en el array.' },
        { status: 400 }
      );
    }

    const totalIntentos = validRts.length;
    const sum = validRts.reduce((a, b) => a + b, 0);
    const avgTotal = Math.round(sum / totalIntentos);

    // Calcular Desviación Estándar
    const squareDiffs = validRts.map(x => Math.pow(x - avgTotal, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / totalIntentos;
    const stdDev = Math.round(Math.sqrt(avgSquareDiff));

    // Analizar Fatiga (Comparación de mitades de la prueba)
    let porcentajeDegradacion = 0;
    let diagnostico = 'Estable / Fatiga Baja';
    let sugerencia = 'Reserva cognitiva y consistencia atencional en rangos óptimos.';

    if (totalIntentos >= 4) {
      const mid = Math.floor(totalIntentos / 2);
      const firstHalf = validRts.slice(0, mid);
      const secondHalf = validRts.slice(mid);

      const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      // El incremento en latencia (ms) indica fatiga
      porcentajeDegradacion = Number((((avg2 - avg1) / avg1) * 100).toFixed(1));

      if (porcentajeDegradacion > 15) {
        diagnostico = 'Fatiga Atencional Severa';
        sugerencia = 'Pérdida marcada en la consistencia de respuesta. Se recomienda encarecidamente suspender actividades académicas o realizar pausas prolongadas.';
      } else if (porcentajeDegradacion > 8) {
        diagnostico = 'Fatiga Atencional Moderada';
        sugerencia = 'Aparición de cansancio cognitivo típico. Recomendado intercalar pausas breves de 5-10 minutos antes de continuar con evaluaciones complejas.';
      }
    } else {
      diagnostico = 'Insuficientes datos';
      sugerencia = 'Se requieren al menos 4 giros válidos para estimar la curva de fatiga del estudiante.';
    }

    // Costo de inhibición (porcentaje de respuestas sumamente lentas > 1.5x de la media)
    const slowThreshold = avgTotal * 1.5;
    const slowResponses = validRts.filter(x => x > slowThreshold).length;
    const costoInhibicionPct = Number(((slowResponses / totalIntentos) * 100).toFixed(1));

    return NextResponse.json({
      total_intentos: totalIntentos,
      tiempo_promedio_ms: avgTotal,
      desviacion_estandar_ms: stdDev,
      porcentaje_degradacion: porcentajeDegradacion,
      diagnostico: diagnostico,
      costo_inhibicion_porcentaje: costoInhibicionPct,
      sugerencia: sugerencia,
      metadata: {
        motor_version: 'CogniMirror XAI Engine v5.0',
        grupo_id: 'grupo_brayan',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno al procesar los datos de telemetría: ' + error.message },
      { status: 500 }
    );
  }
}
