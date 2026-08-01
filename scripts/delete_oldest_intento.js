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
  const subjectId = 'S-02';
  console.log(`Buscando sesiones del sujeto ${subjectId} para eliminar la más antigua de 'Intento 1'...`);

  try {
    // 1. Buscar el paciente
    const { data: paciente, error: errPac } = await supabase
      .from('pacientes')
      .select('id')
      .eq('id_sujeto', subjectId)
      .maybeSingle();

    if (errPac) throw errPac;
    if (!paciente) {
      console.log(`No se encontró el sujeto ${subjectId}`);
      return;
    }

    // 2. Buscar las sesiones de memory que tengan intento_numero = 1 ordenadas por fecha ascendente
    const { data: sesiones, error: errFetch } = await supabase
      .from('sesiones_clinicas')
      .select('id, intento_numero, fecha_sesion, tipo_test')
      .eq('id_paciente', paciente.id)
      .eq('tipo_test', 'memory')
      .eq('intento_numero', 1)
      .order('fecha_sesion', { ascending: true });

    if (errFetch) throw errFetch;

    if (!sesiones || sesiones.length < 2) {
      console.log(`No se encontraron duplicados de 'Intento 1' para el test de Memory. Encontradas: ${sesiones?.length || 0}`);
      return;
    }

    const masAntigua = sesiones[0];
    console.log(`\nSesión duplicada más antigua encontrada:`);
    console.log(`- ID: ${masAntigua.id}`);
    console.log(`- Fecha: ${masAntigua.fecha_sesion}`);
    console.log(`- Intento N°: ${masAntigua.intento_numero}`);

    // 3. Eliminar telemetría de esa sesión
    console.log('\nEliminando registros de telemetría de la sesión antigua...');
    await supabase
      .from('resultados_juego_memoria')
      .delete()
      .eq('id_sesion', masAntigua.id);

    // 4. Eliminar la sesión principal
    console.log('Eliminando la sesión clínica antigua...');
    const { error: errDel } = await supabase
      .from('sesiones_clinicas')
      .delete()
      .eq('id', masAntigua.id);

    if (errDel) throw errDel;

    console.log('\n✅ ¡SESIÓN DUPLICADA MÁS ANTIGUA ELIMINADA CON ÉXITO DE SUPABASE!');

  } catch (err) {
    console.error('\n❌ ERROR DURANTE LA OPERACIÓN:', err.message || err);
  }
}

run();
