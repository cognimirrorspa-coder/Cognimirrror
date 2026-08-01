import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Cliente de base de datos origen (Producción)
const supabaseSource = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Cliente de almacenamiento destino (Staging u otro bucket remoto si está configurado)
const targetUrl = process.env.BACKUP_TARGET_SUPABASE_URL || supabaseUrl;
const targetKey = process.env.BACKUP_TARGET_SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabaseTarget = createClient(targetUrl, targetKey, {
  auth: { persistSession: false }
});

// Soportamos tanto GET como POST para facilitar pruebas desde el navegador o Postman
export async function GET(request) {
  return handleGenerateBackup(request);
}

export async function POST(request) {
  return handleGenerateBackup(request);
}

async function handleGenerateBackup(request) {
  try {
    // 1. Extraer los datos de la base de datos de producción para el grupo específico
    let pacientes;
    const { data: dataPacientes, error: errPacientes } = await supabaseSource
      .from('pacientes')
      .select('*')
      .eq('grupo_id', 'grupo_brayan')
      .order('creado_en', { ascending: false });

    if (errPacientes) {
      if (errPacientes.message.includes('grupo_id') || errPacientes.message.includes('does not exist')) {
        // Fallback: la columna grupo_id no existe en producción, extraemos sin filtro
        const { data: fbPacientes, error: fbErrPacientes } = await supabaseSource
          .from('pacientes')
          .select('*')
          .order('creado_en', { ascending: false });
        if (fbErrPacientes) {
          throw new Error('Error al extraer pacientes de producción: ' + fbErrPacientes.message);
        }
        pacientes = fbPacientes;
      } else {
        throw new Error('Error al extraer pacientes de producción: ' + errPacientes.message);
      }
    } else {
      pacientes = dataPacientes;
    }

    let sesiones;
    const { data: dataSesiones, error: errSesiones } = await supabaseSource
      .from('sesiones_clinicas')
      .select('*')
      .eq('grupo_id', 'grupo_brayan')
      .order('fecha_sesion', { ascending: false });

    if (errSesiones) {
      if (errSesiones.message.includes('grupo_id') || errSesiones.message.includes('does not exist')) {
        // Fallback: la columna grupo_id no existe en producción, extraemos sin filtro
        const { data: fbSesiones, error: fbErrSesiones } = await supabaseSource
          .from('sesiones_clinicas')
          .select('*')
          .order('fecha_sesion', { ascending: false });
        if (fbErrSesiones) {
          throw new Error('Error al extraer sesiones clínicas de producción: ' + fbErrSesiones.message);
        }
        sesiones = fbSesiones;
      } else {
        throw new Error('Error al extraer sesiones clínicas de producción: ' + errSesiones.message);
      }
    } else {
      sesiones = dataSesiones;
    }

    // 2. Transformar los datos a un objeto consolidado
    const backupData = {
      fecha_generacion: new Date().toISOString(),
      grupo_id: 'grupo_brayan',
      fuente: supabaseUrl,
      destino: targetUrl,
      resumen: {
        total_pacientes: pacientes?.length || 0,
        total_sesiones: sesiones?.length || 0
      },
      pacientes: pacientes || [],
      sesiones_clinicas: sesiones || []
    };

    const fileContent = JSON.stringify(backupData, null, 2);
    // Convertimos a Buffer para subir el archivo de manera transaccional y binaria segura en Node.js
    const fileBuffer = Buffer.from(fileContent, 'utf-8');

    // 3. Formatear el nombre del archivo: backup-YYYY-MM-DD_HH-mm-ss.json
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const fileName = `backup-${dateStr}_${timeStr}.json`;

    // 4. Subir el archivo al Supabase Storage configurado como destino (Staging)
    let uploadResult = await supabaseTarget
      .storage
      .from('backups-clinicos')
      .upload(fileName, fileBuffer, {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadResult.error && (uploadResult.error.message.includes('not found') || uploadResult.error.message.includes('does not exist') || uploadResult.error.statusCode === '404' || uploadResult.error.status === 404)) {
      console.log('Bucket "backups-clinicos" no encontrado. Intentando crearlo...');
      const { error: createError } = await supabaseTarget
        .storage
        .createBucket('backups-clinicos', {
          public: false
        });

      if (!createError) {
        // Reintentar subida
        uploadResult = await supabaseTarget
          .storage
          .from('backups-clinicos')
          .upload(fileName, fileBuffer, {
            contentType: 'application/json',
            upsert: true
          });
      } else {
        throw new Error('Error al crear el bucket backups-clinicos: ' + createError.message);
      }
    }

    if (uploadResult.error) {
      throw new Error('Error al subir backup al Supabase Storage de destino: ' + uploadResult.error.message);
    }

    const uploadData = uploadResult.data;

    return NextResponse.json({
      success: true,
      message: `Respaldo de producción generado y almacenado con éxito en el Object Storage de destino (${targetUrl === supabaseUrl ? 'Producción' : 'Staging'}).`,
      fileName,
      path: uploadData.path,
      source: supabaseUrl,
      destination: targetUrl,
      summary: {
        pacientes_respaldados: pacientes?.length || 0,
        sesiones_respaldadas: sesiones?.length || 0
      }
    });

  } catch (error) {
    console.error('Error generando backup:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
