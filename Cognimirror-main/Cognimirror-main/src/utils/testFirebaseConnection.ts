// testFirebaseConnection.ts - Script de verificación de Firebase
import { getUserAnalysisSessions } from '../data/firebase';

/**
 * Función de prueba para verificar que los datos se están guardando
 */
export async function testFirebaseData(userId: string) {
  console.log('🔍 [TEST] Verificando datos en Firebase...');
  
  try {
    const sessions = await getUserAnalysisSessions(userId);
    
    console.log('✅ [TEST] Datos recuperados de Firebase:');
    console.log(`📊 Total de sesiones: ${sessions.length}`);
    
    if (sessions.length > 0) {
      const lastSession = sessions[0];
      console.log('\n📋 Última sesión:');
      console.log(`   • Game ID: ${lastSession.gameId}`);
      console.log(`   • Usuario: ${lastSession.userName}`);
      console.log(`   • Fecha: ${new Date(lastSession.startTime).toLocaleString('es-ES')}`);
      
      // Verificar que tiene la estructura correcta
      if ('maxSpan' in lastSession.metrics) {
        const metrics = lastSession.metrics as any;
        console.log('\n🎯 Métricas capturadas:');
        console.log(`   • Max Span: ${metrics.maxSpan}`);
        console.log(`   • Total Taps: ${metrics.allTaps?.length || 0}`);
        console.log(`   • Persistencia: ${metrics.persistence}`);
        console.log(`   • Auto-Corrección: ${metrics.selfCorrectionIndex?.toFixed(1)}%`);
        console.log(`   • Fluidez Cognitiva: ${Math.round(metrics.cognitiveFluency)}ms`);
        
        // Verificar timestamps individuales
        if (metrics.allTaps && metrics.allTaps.length > 0) {
          console.log('\n⏱️ Primeros 5 timestamps:');
          metrics.allTaps.slice(0, 5).forEach((tap: any, i: number) => {
            console.log(`   ${i + 1}. ${tap.timestamp.toFixed(2)}ms - Bloque ${tap.blockId} - ${tap.isCorrect ? '✓' : '✗'}`);
          });
        }
      }
      
      return sessions;
    } else {
      console.log('⚠️ [TEST] No hay sesiones guardadas todavía');
      console.log('💡 [TEST] Juega una partida completa para generar datos');
      return [];
    }
  } catch (error) {
    console.error('❌ [TEST] Error conectando a Firebase:', error);
    throw error;
  }
}

/**
 * Verificar conexión a Firebase
 */
export async function checkFirebaseConnection() {
  console.log('🔌 [TEST] Verificando conexión a Firebase...');
  
  try {
    // Intentar leer datos (aunque estén vacíos)
    await getUserAnalysisSessions('test-connection');
    console.log('✅ [TEST] Conexión a Firebase exitosa');
    return true;
  } catch (error) {
    console.error('❌ [TEST] Error de conexión a Firebase:', error);
    return false;
  }
}
