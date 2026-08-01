import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { supabase } from '../../../utils/supabaseClient';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get('paciente_id');
    const grupoId = searchParams.get('grupo_id') || 'grupo_brayan';

    // 1. Consultar base de datos
    let query = supabase
      .from('sesiones_clinicas')
      .select('*, pacientes(*)')
      .eq('grupo_id', grupoId);

    if (pacienteId) {
      query = query.eq('id_paciente', pacienteId);
    }

    const { data: sessions, error } = await query.order('fecha_sesion', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al consultar Supabase: ' + error.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'No se encontraron sesiones clínicas para los filtros proporcionados.' }, { status: 404 });
    }

    // 2. Crear Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte de Auditoría PIE');

    // Estilo general y columnas
    sheet.columns = [
      { header: 'ID SESIÓN', key: 'id', width: 25 },
      { header: 'IDENTIFICADOR SUJETO', key: 'idSujeto', width: 15 },
      { header: 'PACIENTE', key: 'paciente', width: 25 },
      { header: 'TIPO DE TEST', key: 'tipoTest', width: 18 },
      { header: 'INTENTO N°', key: 'intento', width: 12 },
      { header: 'ETIQUETA CLÍNICA', key: 'etiqueta', width: 25 },
      { header: 'FECHA EVALUACIÓN', key: 'fecha', width: 20 },
      { header: 'TIEMPO REACCIÓN / NIVEL MÁX', key: 'metricaClave', width: 25 },
      { header: 'ERRORES / LATENCIA PROMEDIO', key: 'metricaSecundaria', width: 25 },
      { header: 'BITÁCORA (OBSERVACIÓN CUALITATIVA)', key: 'anotacion', width: 45 }
    ];

    // Formatear Cabecera
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Segoe UI', size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '22c55e' } // Green theme matching CogniMirror design
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Rellenar filas
    sessions.forEach(s => {
      const isReaction = s.tipo_test === 'reaction';
      
      const pacName = s.pacientes 
        ? `${s.pacientes.nombre} ${s.pacientes.apellido}`.trim() 
        : 'Paciente Desconocido';
      
      const subjId = s.id_sujeto || (s.pacientes ? s.pacientes.id_sujeto : 'N/A');

      const keyMetric = isReaction 
        ? `${s.estadisticas_json?.meanRt || s.estadisticas_json?.globalAvg || 'N/A'} ms` 
        : `Nivel ${s.estadisticas_json?.maxLevel || 'N/A'}`;
      
      const secMetric = isReaction
        ? `Errores: ${s.estadisticas_json?.errors || 0}`
        : `${s.estadisticas_json?.avgLatency || 'N/A'} ms por giro`;

      const formattedDate = new Date(s.fecha_sesion).toLocaleDateString('es-CL') + ' ' + new Date(s.fecha_sesion).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

      sheet.addRow({
        id: s.id,
        idSujeto: subjId,
        paciente: pacName,
        tipoTest: isReaction ? 'Reaction Mirror' : 'Memory Mirror',
        intento: s.intento_numero,
        etiqueta: s.etiqueta_clinica || 'Seguimiento',
        fecha: formattedDate,
        metricaClave: keyMetric,
        metricaSecundaria: secMetric,
        anotacion: s.anotacion_clinica || 'Sin observaciones registradas.'
      });
    });

    // Añadir bordes y alineaciones a las celdas de datos
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.font = { name: 'Segoe UI', size: 9 };
        row.alignment = { vertical: 'middle' };
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
            left: { style: 'thin', color: { argb: 'E2E8F0' } },
            right: { style: 'thin', color: { argb: 'E2E8F0' } }
          };
        });
      }
    });

    // Generar Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="CogniMirror_Auditoria_PIE_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error del servidor al compilar planilla de auditoría: ' + error.message },
      { status: 500 }
    );
  }
}
