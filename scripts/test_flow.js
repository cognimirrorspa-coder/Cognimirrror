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
  const testSubjectId = 'S-TEST-99';
  console.log(`\n=== INICIANDO PRUEBA DE FLUJO DE EVALUADOR CON ID: ${testSubjectId} ===`);

  try {
    // 1. Limpiar datos viejos de test por si acaso
    const { data: pacienteExistente } = await supabase
      .from('pacientes')
      .select('id')
      .eq('id_sujeto', testSubjectId)
      .maybeSingle();

    if (pacienteExistente) {
      console.log('Paciente de prueba anterior detectado. Limpiando...');
      await supabase.from('sesiones_clinicas').delete().eq('id_paciente', pacienteExistente.id);
      await supabase.from('pacientes').delete().eq('id', pacienteExistente.id);
      console.log('Limpieza completada.');
    }

    // 2. Crear un paciente con id_sujeto
    console.log('1. Creando paciente de prueba...');
    const { data: nuevoPaciente, error: errPac } = await supabase
      .from('pacientes')
      .insert([{ nombre: 'Sujeto Test', apellido: 'Evaluador', id_sujeto: testSubjectId }])
      .select()
      .single();

    if (errPac) throw errPac;
    console.log(`- Paciente creado con UUID: ${nuevoPaciente.id} e id_sujeto: ${nuevoPaciente.id_sujeto}`);

    // 3. Crear una sesión clínica con etiqueta_estudio y etiqueta_clinica
    console.log('\n2. Creando sesión clínica (Intento N° 1)...');
    const { data: nuevaSesion, error: errSes } = await supabase
      .from('sesiones_clinicas')
      .insert([{
        id_paciente: nuevoPaciente.id,
        tipo_test: 'reaction',
        intento_numero: 1,
        etiqueta_clinica: 'Evaluación Oficial',
        etiqueta_estudio: 'VALIDACION_JUNIO_2026',
        id_sujeto: testSubjectId,
        estadisticas_json: { test: true, rawTurnsData: [] }
      }])
      .select()
      .single();

    if (errSes) throw errSes;
    console.log(`- Sesión creada con ID: ${nuevaSesion.id}`);
    console.log(`- etiqueta_estudio: ${nuevaSesion.etiqueta_estudio}`);
    console.log(`- id_sujeto: ${nuevaSesion.id_sujeto}`);
    console.log(`- intento_valido (default): ${nuevaSesion.intento_valido}`);

    // 4. Activar el Botón de Pánico (Anular intento)
    console.log('\n3. Simulando activación del Botón de Pánico (Anulación)...');
    const { error: errUpd } = await supabase
      .from('sesiones_clinicas')
      .update({ intento_valido: false })
      .eq('id', nuevaSesion.id);

    if (errUpd) throw errUpd;

    // Verificar el cambio
    const { data: sesionVerificada, error: errVer } = await supabase
      .from('sesiones_clinicas')
      .select('id, intento_valido')
      .eq('id', nuevaSesion.id)
      .single();

    if (errVer) throw errVer;
    console.log(`- Sesión verificada ID: ${sesionVerificada.id}`);
    console.log(`- intento_valido (post-anulación): ${sesionVerificada.intento_valido}`);

    if (sesionVerificada.intento_valido === false) {
      console.log('\n✅ ¡FLUJO DE EVALUADOR VERIFICADO EXITOSAMENTE EN SUPABASE!');
    } else {
      console.error('\n❌ Error: El intento_valido no se actualizó a false.');
    }

    // 5. Limpieza final de datos de prueba
    console.log('\nLimpiando datos de prueba...');
    await supabase.from('sesiones_clinicas').delete().eq('id_paciente', nuevoPaciente.id);
    await supabase.from('pacientes').delete().eq('id', nuevoPaciente.id);
    console.log('Limpieza de prueba completada.');

  } catch (err) {
    console.error('\n❌ ERROR DURANTE LA EJECUCIÓN DEL FLUJO DE PRUEBA:');
    console.error(err.message || err);
  }
}

run();
