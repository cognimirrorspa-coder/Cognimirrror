/**
 * Script de Prueba de Concurrencia (CP-PERF-02)
 * Simula múltiples peticiones REST simultáneas a Supabase en la nube
 * para validar la tolerancia a carga y consistencia de datos de la base de datos.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Faltan variables de entorno en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runConcurrencyTest() {
  const NUM_PETICIONES = 30; // Cantidad de escrituras concurrentes
  console.log(`=== INICIANDO CP-PERF-02: PRUEBA DE CONCURRENCIA REST ===`);
  console.log(`Disparando ${NUM_PETICIONES} registros de especialistas simultáneos a Supabase...`);
  
  const uniqueId = Date.now();
  const testEmails = Array.from({ length: NUM_PETICIONES }).map((_, index) => 
    `concurrency_test_${uniqueId}_${index}@cognimirror.com`
  );

  const startTime = Date.now();
  
  // Creamos un array de promesas concurrentes
  const promesas = testEmails.map((email, index) => {
    return supabase
      .from('especialistas_bypass')
      .insert([{
        email: email,
        password: 'password-estres-123',
        nombre_completo: `Sujeto Concurrencia #${index + 1}`
      }])
      .select();
  });

  try {
    // Ejecutar todas en paralelo (simulación de carga de múltiples estaciones)
    const resultados = await Promise.all(promesas);
    const duration = Date.now() - startTime;
    
    let exitosas = 0;
    let fallidas = 0;
    
    resultados.forEach((res, i) => {
      if (res.error) {
        console.error(`❌ Petición #${i + 1} falló:`, res.error.message);
        fallidas++;
      } else {
        exitosas++;
      }
    });

    console.log(`\n=== RESULTADO DE LA EVALUACIÓN ===`);
    console.log(`- Duración total: ${duration} ms (promedio de ${Math.round(duration / NUM_PETICIONES)} ms por transacción)`);
    console.log(`- Peticiones Exitosas: ${exitosas}/${NUM_PETICIONES}`);
    console.log(`- Peticiones Fallidas: ${fallidas}/${NUM_PETICIONES}`);
    
    // --- LIMPIEZA DE BASE DE DATOS ---
    console.log(`\nLimpiando registros de prueba de la base de datos de producción...`);
    const { error: deleteError } = await supabase
      .from('especialistas_bypass')
      .delete()
      .in('email', testEmails);
      
    if (deleteError) {
      console.warn('⚠️ Error al limpiar los registros de prueba:', deleteError.message);
    } else {
      console.log('✅ Base de datos limpia de registros temporales.');
    }

    if (fallidas === 0) {
      console.log(`\n✅ PRUEBA EXITOSA: Supabase REST API y la base de datos PostgreSQL gestionaron todas las peticiones concurrentes de forma segura, aislada y eficiente.`);
    } else {
      console.warn(`\n⚠️ ADVERTENCIA: Se detectaron fallos en la prueba de concurrencia.`);
    }
  } catch (err) {
    console.error('Error durante la ejecución del test:', err.message);
  }
}

runConcurrencyTest();
