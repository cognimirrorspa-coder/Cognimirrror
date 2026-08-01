const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Leer .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('No se encontró el archivo .env.local');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let supabaseKey = ''; // Usamos service role key para bypass completo de políticas

for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  // Intentamos service role key primero, si no, anon key
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
  if (!supabaseKey && line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('No se pudieron obtener las credenciales de Supabase del archivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Generador de Telemetría Reaction Mirror (40 turnos: 16 L, 16 R, 8 NOGO)
function generateReactionTelemetry(baselineSpeedFactor = 1.0) {
  const deck = [];
  // Generamos un mazo de 40 cartas: L, R y NOGOs
  const counts = { L: 16, R: 16, NOGO: 8 };
  
  // Regla de inicio: primeros 4 son GO
  deck.push('L', 'R', 'L', 'R');
  counts.L -= 2;
  counts.R -= 2;

  // Llenar el resto del mazo
  const remaining = [];
  for (let i = 0; i < counts.L; i++) remaining.push('L');
  for (let i = 0; i < counts.R; i++) remaining.push('R');
  for (let i = 0; i < counts.NOGO; i++) remaining.push('NOGO');

  // Mezclamos
  remaining.sort(() => Math.random() - 0.5);
  deck.push(...remaining);

  let correctRojo = 0;
  let correctNaranja = 0;
  let nogoFails = 0;
  let streak = 0;
  let maxStreak = 0;
  let sumL = 0;
  let countL = 0;
  let sumR = 0;
  let countR = 0;

  const results = deck.map((type, idx) => {
    const isNogo = type === 'NOGO';
    const expected = isNogo ? (Math.random() > 0.5 ? 'U' : 'D') : type; // U o D para NOGO
    let actualFace = null;
    let time = null;
    let errors = 0;
    let timeout = false;
    let status = 'Ok';
    let fail = false;

    if (!isNogo) {
      // GO: el usuario responde
      const baseReactionTime = expected === 'L' ? 450 : 430;
      // Añadimos variación y aplicamos el factor de velocidad
      time = Math.round((baseReactionTime + (Math.random() - 0.5) * 150) * baselineSpeedFactor);
      
      const esCorrecto = Math.random() > 0.05; // 95% de acierto
      if (esCorrecto) {
        actualFace = expected;
        status = 'Ok';
        streak++;
        if (expected === 'L') {
          correctRojo++;
          sumL += time;
          countL++;
        } else {
          correctNaranja++;
          sumR += time;
          countR++;
        }
      } else {
        actualFace = expected === 'L' ? 'R' : 'L'; // error motor
        status = 'Error';
        errors = 1;
        streak = 0;
      }
    } else {
      // NOGO: el usuario debería abstenerse
      const cometeError = Math.random() > 0.8; // 20% de error de comisión (impulsividad)
      if (cometeError) {
        actualFace = Math.random() > 0.5 ? 'L' : 'R';
        time = Math.round((300 + Math.random() * 200) * baselineSpeedFactor);
        status = 'Error';
        errors = 1;
        fail = true;
        nogoFails++;
        streak = 0;
      } else {
        // Correcto withholding
        status = 'Ok';
        streak++;
      }
    }

    if (streak > maxStreak) maxStreak = streak;

    return {
      round: idx + 1,
      type: isNogo ? 'NOGO' : 'GO',
      expected,
      actualFace,
      time,
      errors,
      timeout,
      status,
      fail,
      isFalseStart: fail,
      isOmission: timeout
    };
  });

  const avgL = countL > 0 ? Math.round(sumL / countL) : 0;
  const avgR = countR > 0 ? Math.round(sumR / countR) : 0;
  const timeTotal = results.filter(r => r.type === 'GO' && r.time).reduce((acc, r) => acc + r.time, 0);

  const stats = {
    tiempo_total: timeTotal,
    aciertos_rojo: correctRojo,
    aciertos_naranja: correctNaranja,
    errores_falsos: nogoFails,
    tiempo_promedio_por_mano: { L: avgL, R: avgR },
    game_duration_ms: timeTotal + 20000,
    session_duration_ms: timeTotal + 40000,
    max_streak: maxStreak
  };

  return { results, stats };
}

// 3. Generador de Telemetría Memory Mirror (Corsi span 2 a N)
function generateMemoryTelemetry(spanLimit = 5) {
  const telemetry = [];
  const faces = ['U', 'D', 'R', 'L', 'F'];
  let currentLevel = 2;
  let trial = 'A';
  let errors = 0;
  let correctTrials = 0;
  let sumLatency = 0;
  let countCorrect = 0;

  while (currentLevel <= spanLimit + 1) {
    const isSuccess = currentLevel <= spanLimit;
    const levelSeq = [];
    let last = null;
    for (let i = 0; i < currentLevel; i++) {
      let f;
      do { f = faces[Math.floor(Math.random() * faces.length)]; } while (f === last);
      levelSeq.push(f);
      last = f;
    }

    if (isSuccess) {
      // Simular respuestas correctas
      levelSeq.forEach((face, idx) => {
        const latency = Math.round(900 + Math.random() * 400);
        sumLatency += latency;
        countCorrect++;

        telemetry.push({
          level: currentLevel,
          trial,
          expectedFace: face,
          userFace: face,
          isCorrect: true,
          latencyMs: latency,
          timestamp: Date.now()
        });
      });
      correctTrials++;
      currentLevel++;
      trial = 'A';
    } else {
      // Simular falla
      // Pasa a trial B si era A
      if (trial === 'A') {
        // Falla en el paso 1 de la secuencia
        telemetry.push({
          level: currentLevel,
          trial: 'A',
          expectedFace: levelSeq[0],
          userFace: faces.find(f => f !== levelSeq[0]),
          isCorrect: false,
          latencyMs: Math.round(1100 + Math.random() * 300),
          errorType: 'primacy',
          timestamp: Date.now()
        });
        errors++;
        trial = 'B';
      } else {
        // Falla en trial B también -> Termina el juego
        telemetry.push({
          level: currentLevel,
          trial: 'B',
          expectedFace: levelSeq[0],
          userFace: faces.find(f => f !== levelSeq[0]),
          isCorrect: false,
          latencyMs: Math.round(1200 + Math.random() * 300),
          errorType: 'primacy',
          timestamp: Date.now()
        });
        errors++;
        break; // Termina
      }
    }
  }

  const avgLatency = countCorrect > 0 ? Math.round(sumLatency / countCorrect) : 0;
  const stats = {
    maxLevelReached: currentLevel,
    corsiSpan: currentLevel - 1,
    totalCorrectTrials: correctTrials,
    totalErrors: errors,
    avgLatencyMs: avgLatency,
    supra_span_resistance_percentage: 0,
  };

  return { telemetry, stats };
}

// 4. Proceso de Inserción
async function run() {
  console.log('=== SEEDING COGNIMIRROR DATABASE ===');
  console.log(`Conectando a: ${supabaseUrl}`);

  const groups = ['grupo_brayan', 'psicologo@clinica.com', 'evaluador@cognimirror.com'];
  const mockPatients = [
    { name: 'Juan', last: 'Pérez', idSujeto: 'S-01' },
    { name: 'María', last: 'González', idSujeto: 'S-02' },
    { name: 'Carlos', last: 'Muñoz', idSujeto: 'S-03' }
  ];

  try {
    for (const group of groups) {
      console.log(`\nCreando pacientes y sesiones para grupo_id: "${group}"...`);

      for (const mp of mockPatients) {
        // 1. Insertar Paciente
        const { data: pData, error: pErr } = await supabase
          .from('pacientes')
          .insert({
            nombre: mp.name,
            apellido: mp.last,
            id_sujeto: `${group}_${mp.idSujeto}`, // Evitar colisión de Unique Constraint de id_sujeto agregando el prefijo del grupo
            grupo_id: group
          })
          .select()
          .single();

        if (pErr) {
          console.error(`Error al insertar paciente ${mp.name}:`, pErr.message);
          continue;
        }

        console.log(`  - Paciente creado: ${pData.nombre} ${pData.apellido} (ID: ${pData.id}, Sujeto Metodológico: ${mp.idSujeto})`);

        // 2. Generar sesiones clínicas según el sujeto
        if (mp.idSujeto === 'S-01') {
          // Juan Pérez:
          // Reaction Mirror Sesión 1: Línea Base (Velocidad normal / factor 1.1)
          const rx1 = generateReactionTelemetry(1.15);
          const { data: sRx1, error: eRx1 } = await supabase
            .from('sesiones_clinicas')
            .insert({
              id_paciente: pData.id,
              tipo_test: 'reaction',
              intento_numero: 1,
              etiqueta_clinica: 'Línea Base',
              etiqueta_estudio: 'VALIDACION_JUNIO_2026',
              id_sujeto: mp.idSujeto,
              intento_valido: true,
              anotacion_clinica: 'Paciente demuestra fatiga inicial leve. Errores de comisión normales.',
              estadisticas_json: { ...rx1.stats, rawTurnsData: rx1.results },
              grupo_id: group,
              fecha_sesion: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() // hace 7 días
            })
            .select().single();

          if (!eRx1) {
            console.log(`    * Sesión Reaction #1 (Línea Base) creada.`);
            // Insertar telemetría relacional
            const relRows = rx1.results.map(r => ({
              id_sesion: sRx1.id,
              nivel: r.round,
              tiempo_reaccion_ms: r.time,
              cara_esperada: r.expected,
              cara_girada: r.actualFace,
              es_correcto: r.status === 'Ok',
              timestamp_local: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
            }));
            await supabase.from('resultados_juego_reaccion').insert(relRows);
          } else {
            console.error(`    Error en Reaction #1:`, eRx1.message);
          }

          // Reaction Mirror Sesión 2: Seguimiento (Mejor velocidad / factor 0.85)
          const rx2 = generateReactionTelemetry(0.85);
          const { data: sRx2, error: eRx2 } = await supabase
            .from('sesiones_clinicas')
            .insert({
              id_paciente: pData.id,
              tipo_test: 'reaction',
              intento_numero: 2,
              etiqueta_clinica: 'Seguimiento',
              etiqueta_estudio: 'VALIDACION_JUNIO_2026',
              id_sujeto: mp.idSujeto,
              intento_valido: true,
              anotacion_clinica: 'Gran avance clínico. Tiempos de reacción reducidos en un 25%. Inhibición conservada.',
              estadisticas_json: { ...rx2.stats, rawTurnsData: rx2.results },
              grupo_id: group,
              fecha_sesion: new Date().toISOString()
            })
            .select().single();

          if (!eRx2) {
            console.log(`    * Sesión Reaction #2 (Seguimiento) creada.`);
            const relRows = rx2.results.map(r => ({
              id_sesion: sRx2.id,
              nivel: r.round,
              tiempo_reaccion_ms: r.time,
              cara_esperada: r.expected,
              cara_girada: r.actualFace,
              es_correcto: r.status === 'Ok',
              timestamp_local: new Date().toISOString()
            }));
            await supabase.from('resultados_juego_reaccion').insert(relRows);
          }

          // Memory Mirror Sesión 1: Corsi span 5
          const mem1 = generateMemoryTelemetry(5);
          const { data: sMem1, error: eMem1 } = await supabase
            .from('sesiones_clinicas')
            .insert({
              id_paciente: pData.id,
              tipo_test: 'memory',
              intento_numero: 1,
              etiqueta_clinica: 'Línea Base',
              etiqueta_estudio: 'VALIDACION_JUNIO_2026',
              id_sujeto: mp.idSujeto,
              intento_valido: true,
              anotacion_clinica: 'Alcanza span de 5 bloques visoespaciales de forma consistente.',
              estadisticas_json: { ...mem1.stats, rawTurnsData: mem1.telemetry },
              grupo_id: group,
              fecha_sesion: new Date().toISOString()
            })
            .select().single();

          if (!eMem1) {
            console.log(`    * Sesión Memory #1 creada.`);
            const relRows = mem1.telemetry.map(t => ({
              id_sesion: sMem1.id,
              nivel: t.level,
              intento: t.trial,
              cara_esperada: t.expectedFace,
              cara_girada: t.userFace,
              es_correcto: t.isCorrect,
              latencia_ms: t.latencyMs,
              tipo_error: t.errorType || null,
              timestamp_local: new Date().toISOString()
            }));
            await supabase.from('resultados_juego_memoria').insert(relRows);
          }

        } else if (mp.idSujeto === 'S-02') {
          // María González:
          // 1 Reaction, 2 Memory
          const rx1 = generateReactionTelemetry(1.0);
          const { data: sRx1, error: eRx1 } = await supabase
            .from('sesiones_clinicas')
            .insert({
              id_paciente: pData.id,
              tipo_test: 'reaction',
              intento_numero: 1,
              etiqueta_clinica: 'Línea Base',
              etiqueta_estudio: 'VALIDACION_JUNIO_2026',
              id_sujeto: mp.idSujeto,
              intento_valido: true,
              anotacion_clinica: 'Atención focalizada estable. Mínimo de falsos positivos.',
              estadisticas_json: { ...rx1.stats, rawTurnsData: rx1.results },
              grupo_id: group,
              fecha_sesion: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
            })
            .select().single();

          if (!eRx1) {
            console.log(`    * Sesión Reaction #1 creada.`);
            const relRows = rx1.results.map(r => ({
              id_sesion: sRx1.id,
              nivel: r.round,
              tiempo_reaccion_ms: r.time,
              cara_esperada: r.expected,
              cara_girada: r.actualFace,
              es_correcto: r.status === 'Ok',
              timestamp_local: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
            }));
            await supabase.from('resultados_juego_reaccion').insert(relRows);
          }

          // Memory #1: Corsi span 4
          const mem1 = generateMemoryTelemetry(4);
          const { data: sMem1, error: eMem1 } = await supabase
            .from('sesiones_clinicas')
            .insert({
              id_paciente: pData.id,
              tipo_test: 'memory',
              intento_numero: 1,
              etiqueta_clinica: 'Línea Base',
              etiqueta_estudio: 'VALIDACION_JUNIO_2026',
              id_sujeto: mp.idSujeto,
              intento_valido: true,
              anotacion_clinica: 'Dificultades en memoria de trabajo espacial a partir del nivel 5 (span 4 completado).',
              estadisticas_json: { ...mem1.stats, rawTurnsData: mem1.telemetry },
              grupo_id: group,
              fecha_sesion: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
            })
            .select().single();

          if (!eMem1) {
            console.log(`    * Sesión Memory #1 (Línea Base) creada.`);
            const relRows = mem1.telemetry.map(t => ({
              id_sesion: sMem1.id,
              nivel: t.level,
              intento: t.trial,
              cara_esperada: t.expectedFace,
              cara_girada: t.userFace,
              es_correcto: t.isCorrect,
              latencia_ms: t.latencyMs,
              tipo_error: t.errorType || null,
              timestamp_local: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
            }));
            await supabase.from('resultados_juego_memoria').insert(relRows);
          }

          // Memory #2: Corsi span 6
          const mem2 = generateMemoryTelemetry(6);
          const { data: sMem2, error: eMem2 } = await supabase
            .from('sesiones_clinicas')
            .insert({
              id_paciente: pData.id,
              tipo_test: 'memory',
              intento_numero: 2,
              etiqueta_clinica: 'Seguimiento',
              etiqueta_estudio: 'VALIDACION_JUNIO_2026',
              id_sujeto: mp.idSujeto,
              intento_valido: true,
              anotacion_clinica: 'Mejoría notable del rendimiento visoespacial tras intervenciones. Alcanza span de 6.',
              estadisticas_json: { ...mem2.stats, rawTurnsData: mem2.telemetry },
              grupo_id: group,
              fecha_sesion: new Date().toISOString()
            })
            .select().single();

          if (!eMem2) {
            console.log(`    * Sesión Memory #2 (Seguimiento) creada.`);
            const relRows = mem2.telemetry.map(t => ({
              id_sesion: sMem2.id,
              nivel: t.level,
              intento: t.trial,
              cara_esperada: t.expectedFace,
              cara_girada: t.userFace,
              es_correcto: t.isCorrect,
              latencia_ms: t.latencyMs,
              tipo_error: t.errorType || null,
              timestamp_local: new Date().toISOString()
            }));
            await supabase.from('resultados_juego_memoria').insert(relRows);
          }

        } else if (mp.idSujeto === 'S-03') {
          // Carlos Muñoz: 1 Reaction, 1 Memory
          const rx1 = generateReactionTelemetry(0.95);
          const { data: sRx1, error: eRx1 } = await supabase
            .from('sesiones_clinicas')
            .insert({
              id_paciente: pData.id,
              tipo_test: 'reaction',
              intento_numero: 1,
              etiqueta_clinica: 'Línea Base',
              etiqueta_estudio: 'VALIDACION_JUNIO_2026',
              id_sujeto: mp.idSujeto,
              intento_valido: true,
              anotacion_clinica: 'Paciente demuestra impulsividad motora moderada. 4 errores de comisión en estímulos NOGO.',
              estadisticas_json: { ...rx1.stats, rawTurnsData: rx1.results },
              grupo_id: group,
              fecha_sesion: new Date().toISOString()
            })
            .select().single();

          if (!eRx1) {
            console.log(`    * Sesión Reaction #1 creada.`);
            const relRows = rx1.results.map(r => ({
              id_sesion: sRx1.id,
              nivel: r.round,
              tiempo_reaccion_ms: r.time,
              cara_esperada: r.expected,
              cara_girada: r.actualFace,
              es_correcto: r.status === 'Ok',
              timestamp_local: new Date().toISOString()
            }));
            await supabase.from('resultados_juego_reaccion').insert(relRows);
          }

          const mem1 = generateMemoryTelemetry(5);
          const { data: sMem1, error: eMem1 } = await supabase
            .from('sesiones_clinicas')
            .insert({
              id_paciente: pData.id,
              tipo_test: 'memory',
              intento_numero: 1,
              etiqueta_clinica: 'Línea Base',
              etiqueta_estudio: 'VALIDACION_JUNIO_2026',
              id_sujeto: mp.idSujeto,
              intento_valido: true,
              anotacion_clinica: 'Corsi span de 5. Desempeño promedio para su rango etario.',
              estadisticas_json: { ...mem1.stats, rawTurnsData: mem1.telemetry },
              grupo_id: group,
              fecha_sesion: new Date().toISOString()
            })
            .select().single();

          if (!eMem1) {
            console.log(`    * Sesión Memory #1 creada.`);
            const relRows = mem1.telemetry.map(t => ({
              id_sesion: sMem1.id,
              nivel: t.level,
              intento: t.trial,
              cara_esperada: t.expectedFace,
              cara_girada: t.userFace,
              es_correcto: t.isCorrect,
              latencia_ms: t.latencyMs,
              tipo_error: t.errorType || null,
              timestamp_local: new Date().toISOString()
            }));
            await supabase.from('resultados_juego_memoria').insert(relRows);
          }
        }
      }
    }

    console.log('\n✅ ¡PROCESO DE SIEMBRA COMPLETADO EXITOSAMENTE!');
    console.log('Se han creado todos los pacientes de prueba con su historial de sesiones y telemetrías.');

  } catch (err) {
    console.error('\n❌ ERROR CRÍTICO AL INJECTAR DATOS:', err.message || err);
  }
}

run();
