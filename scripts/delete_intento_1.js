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
  const subjectId = 'S-01';
  console.log(`Buscando paciente en Supabase con id_sujeto: ${subjectId}`);

  try {
    // 1. Buscar el paciente por id_sujeto
    const { data: paciente, error: errPac } = await supabase
      .from('pacientes')
      .select('id, nombre, apellido')
      .eq('id_sujeto', subjectId)
      .maybeSingle();

    if (errPac) throw errPac;

    if (!paciente) {
      console.log(`No se encontró ningún paciente con id_sujeto = '${subjectId}'`);
      return;
    }

    console.log(`Paciente encontrado: ${paciente.nombre} ${paciente.apellido} (UUID: ${paciente.id})`);

    // 2. Obtener la sesión del Intento 1 de Reaction
    const { data: sesiones, error: errFetch } = await supabase
      .from('sesiones_clinicas')
      .select('id, intento_numero, tipo_test, fecha_sesion')
      .eq('id_paciente', paciente.id)
      .eq('intento_numero', 1)
      .eq('tipo_test', 'reaction');

    if (errFetch) throw errFetch;

    if (!sesiones || sesiones.length === 0) {
      console.log(`No se encontró el Intento N° 1 de Reacción para el sujeto ${subjectId}.`);
      return;
    }

    const sesionABorrar = sesiones[0];
    console.log(`\nEncontrada sesión a eliminar:`);
    console.log(`- ID Sesión: ${sesionABorrar.id}`);
    console.log(`- Tipo Test: ${sesionABorrar.tipo_test}`);
    console.log(`- Intento N°: ${sesionABorrar.intento_numero}`);
    console.log(`- Fecha: ${sesionABorrar.fecha_sesion}`);

    // 3. Eliminar resultados asociados en resultados_juego_reaccion
    console.log('\nEliminando registros de telemetría asociados...');
    const { error: errRel } = await supabase
      .from('resultados_juego_reaccion')
      .delete()
      .eq('id_sesion', sesionABorrar.id);

    if (errRel) {
      console.warn('Advertencia al eliminar telemetría:', errRel.message);
    } else {
      console.log('Registros de telemetría eliminados con éxito.');
    }

    // 4. Eliminar la sesión clínica principal
    console.log('Eliminando la sesión clínica...');
    const { error: errDel } = await supabase
      .from('sesiones_clinicas')
      .delete()
      .eq('id', sesionABorrar.id);

    if (errDel) throw errDel;

    console.log('\n✅ ¡SESIÓN DEL INTENTO 1 ELIMINADA CON ÉXITO DE SUPABASE!');

    // 5. Actualizar intentos posteriores del mismo tipo de test para este paciente
    console.log('\nReajustando correlativo de intentos para este sujeto...');
    const { data: sesionesRestantes, error: errRestantes } = await supabase
      .from('sesiones_clinicas')
      .select('id, intento_numero, fecha_sesion')
      .eq('id_paciente', paciente.id)
      .eq('tipo_test', 'reaction')
      .order('fecha_sesion', { ascending: true });

    if (errRestantes) throw errRestantes;

    for (let i = 0; i < sesionesRestantes.length; i++) {
      const ses = sesionesRestantes[i];
      const nuevoIntento = i + 1;
      if (ses.intento_numero !== nuevoIntento) {
        console.log(`- Actualizando Sesión ${ses.id}: Intento ${ses.intento_numero} -> ${nuevoIntento}`);
        await supabase
          .from('sesiones_clinicas')
          .update({ intento_numero: nuevoIntento })
          .eq('id', ses.id);
      }
    }
    console.log('Ajuste de correlativos finalizado.');

  } catch (err) {
    console.error('\n❌ ERROR AL ELIMINAR EL INTENTO:', err.message || err);
  }
}

run();
