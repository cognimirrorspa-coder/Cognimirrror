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

console.log('Conectándose a Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data: pacientes, error } = await supabase
      .from('pacientes')
      .select('id, nombre, apellido, creado_en')
      .limit(5);

    if (error) throw error;

    console.log('\n--- ÚLTIMOS 5 PACIENTES EN LA BASE DE DATOS ---');
    if (pacientes.length === 0) {
      console.log('No hay pacientes registrados en la base de datos.');
    } else {
      pacientes.forEach(p => {
        console.log(`- [ID: ${p.id}] ${p.nombre} ${p.apellido} (Creado: ${p.creado_en})`);
      });
    }

    const { count, error: errCount } = await supabase
      .from('sesiones_clinicas')
      .select('*', { count: 'exact', head: true });

    if (errCount) throw errCount;
    console.log(`\nTotal de sesiones guardadas en Supabase: ${count}`);

  } catch (err) {
    console.error('Error al consultar Supabase:', err.message);
  }
}

run();
