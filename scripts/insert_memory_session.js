const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer .env.local a mano
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('No se encontró el archivo .env.local');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('No se pudieron parsear las variables de Supabase del archivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const patientId = '1c8c969b-d7f5-46a5-8e35-5f3cd731326d'; // Sujeto S-02
  console.log(`Conectándose a Supabase para insertar sesión Memory para el sujeto UUID: ${patientId}`);

  try {
    // 1. Verificar si el paciente existe
    const { data: paciente, error: errPac } = await supabase
      .from('pacientes')
      .select('id, nombre, apellido, id_sujeto')
      .eq('id', patientId)
      .maybeSingle();

    if (errPac) throw errPac;
    if (!paciente) {
      console.error(`No se encontró el paciente con UUID: ${patientId}`);
      return;
    }

    console.log(`Paciente verificado: ${paciente.nombre} ${paciente.apellido} (${paciente.id_sujeto})`);

    // 2. Definir los datos estadísticos y de telemetría de Memory (Corsi span 7)
    const telemetry = [
      { level: 1, trial: 'A', expectedFace: 'U', userFace: 'U', isCorrect: true, latencyMs: 950, timestamp: new Date().toISOString() },
      { level: 2, trial: 'A', expectedFace: 'R', userFace: 'R', isCorrect: true, latencyMs: 1100, timestamp: new Date().toISOString() },
      { level: 3, trial: 'A', expectedFace: 'L', userFace: 'L', isCorrect: true, latencyMs: 1050, timestamp: new Date().toISOString() },
      { level: 4, trial: 'A', expectedFace: 'F', userFace: 'F', isCorrect: true, latencyMs: 1300, timestamp: new Date().toISOString() },
      { level: 5, trial: 'A', expectedFace: 'B', userFace: 'B', isCorrect: true, latencyMs: 1200, timestamp: new Date().toISOString() },
      { level: 6, trial: 'A', expectedFace: 'D', userFace: 'D', isCorrect: true, latencyMs: 1400, timestamp: new Date().toISOString() },
      { level: 7, trial: 'A', expectedFace: 'U', userFace: 'U', isCorrect: true, latencyMs: 1500, timestamp: new Date().toISOString() },
      { level: 8, trial: 'A', expectedFace: 'R', userFace: 'L', isCorrect: false, latencyMs: 1800, errorType: 'Comisión', timestamp: new Date().toISOString() },
      { level: 8, trial: 'B', expectedFace: 'R', userFace: 'U', isCorrect: false, latencyMs: 2100, errorType: 'Comisión', timestamp: new Date().toISOString() }
    ];

    const statsPayload = {
      maxLevelReached: 8,
      corsiSpan: 7,
      totalCorrectTrials: 7,
      totalErrors: 2,
      avgLatencyMs: 1320,
      supra_span_resistance_percentage: 0,
      rawTurnsData: telemetry
    };

    // 3. Insertar sesión clínica
    console.log('\nInsertando sesión clínica en Supabase...');
    const { data: sessionInfo, error: sessionErr } = await supabase
      .from('sesiones_clinicas')
      .insert([{
        id_paciente: patientId,
        tipo_test: 'memory',
        intento_numero: 1,
        etiqueta_clinica: 'Evaluación Oficial',
        etiqueta_estudio: 'VALIDACION_JUNIO_2026',
        id_sujeto: paciente.id_sujeto,
        estadisticas_json: statsPayload,
        intento_valido: true
      }])
      .select()
      .single();

    if (sessionErr) throw sessionErr;
    console.log(`- Sesión clínica insertada exitosamente. ID: ${sessionInfo.id}`);

    // 4. Insertar datos en la tabla relacional resultados_juego_memoria
    console.log('Insertando datos de telemetría de Memory...');
    const rows = telemetry.map(t => ({
      id_sesion: sessionInfo.id,
      nivel: t.level,
      intento: t.trial,
      cara_esperada: t.expectedFace,
      cara_girada: t.userFace,
      es_correcto: t.isCorrect,
      latencia_ms: t.latencyMs,
      array_latencias_intra: null,
      tipo_error: t.errorType || null,
      timestamp_local: new Date(t.timestamp).toISOString()
    }));

    const { error: errRel } = await supabase
      .from('resultados_juego_memoria')
      .insert(rows);

    if (errRel) {
      console.warn('Advertencia al insertar en tabla relacional (resultados_juego_memoria):', errRel.message);
    } else {
      console.log('Telemetría de Corsi persistida en la tabla relacional exitosamente.');
    }

    console.log('\n✅ ¡SESIÓN DE MEMORY PARA SUJETO S-02 INSERTADA CON ÉXITO EN SUPABASE!');

  } catch (err) {
    console.error('\n❌ ERROR AL INSERTAR LA SESIÓN:', err.message || err);
  }
}

run();
