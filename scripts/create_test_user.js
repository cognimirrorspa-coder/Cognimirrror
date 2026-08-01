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
  const email = 'evaluador@cognimirror.com';
  const password = 'clinica2026';
  const fullName = 'Ps. Evaluador de Prueba';

  console.log(`\n=== CREANDO USUARIO CLÍNICO DE PRUEBA ===`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  try {
    // 1. Intentar el registro
    console.log('Intentando registrar usuario en Supabase...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (signUpError) {
      // Si el usuario ya existe, intentaremos iniciar sesión para comprobar
      if (signUpError.message && signUpError.message.includes('already registered')) {
        console.log('El usuario ya se encuentra registrado. Comprobando inicio de sesión...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          throw signInError;
        }

        console.log('\n✅ ¡INICIO DE SESIÓN EXITOSO!');
        console.log(`Usuario verificado: ${signInData.user.user_metadata?.full_name || 'Especialista'}`);
        console.log(`Email: ${signInData.user.email}`);
        console.log('Esta cuenta está lista y es 100% funcional.');
      } else {
        throw signUpError;
      }
    } else {
      console.log('\n✅ ¡REGISTRO EN SUPABASE REALIZADO CON ÉXITO!');
      const requiresConfirmation = signUpData?.user?.identities?.length === 0 || !signUpData?.session;
      
      if (requiresConfirmation) {
        console.log('⚠️ ADVERTENCIA: Supabase requiere verificación de correo por defecto.');
        console.log('El correo de confirmación ha sido enviado. Por favor, desactiva la opción "Confirm Email" en Supabase.');
      } else {
        console.log('La cuenta se creó directamente en estado verificado y está lista para usarse.');
      }
    }

  } catch (err) {
    console.error('\n❌ ERROR AL CREAR/VERIFICAR EL USUARIO:');
    console.error(err.message || err);
  }
}

run();
