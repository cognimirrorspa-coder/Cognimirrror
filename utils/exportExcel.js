/**
 * exportExcel.js — Exportador Excel Profesional CogniMirror
 * Usa ExcelJS (browser build) + html2canvas para incrustar el gráfico.
 */

const BLUE_CORP = 'FF1E3A5F';
const BLUE_LIGHT = 'FFD6E4F7';
const WHITE = 'FFFFFFFF';
const GRAY_ROW = 'FFF8FAFC';

function cellStyle(bold = false, bg = WHITE, fontColor = 'FF1E293B', sz = 11) {
  return {
    font: { bold, color: { argb: fontColor }, size: sz, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    },
  };
}

function applyHeader(row, values) {
  row.values = values;
  row.eachCell(cell => {
    Object.assign(cell, cellStyle(true, BLUE_CORP, WHITE, 11));
  });
  row.height = 22;
}

export async function exportReactionMirrorExcel({ playerName, date, metrics, postInhibitory, rawTurnsData, chartElementId }) {
  // Dynamic import for Next.js client compatibility
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CogniMirror Engine';
  workbook.created = new Date();

  // ── Capturar gráfico con html2canvas ────────────────────────
  let chartImageId = null;
  try {
    if (typeof window !== 'undefined' && chartElementId) {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById(chartElementId);
      if (el) {
        const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
        const imgBase64 = canvas.toDataURL('image/png').split(',')[1];
        chartImageId = workbook.addImage({ base64: imgBase64, extension: 'png' });
      }
    }
  } catch (e) {
    console.warn('html2canvas no disponible:', e);
  }

  // ════════════════════════════════════════════════════════════
  // HOJA 1 — Resumen Clínico
  // ════════════════════════════════════════════════════════════
  const sheet1 = workbook.addWorksheet('Resumen Clínico', {
    pageSetup: { paperSize: 9, orientation: 'portrait' },
    properties: { tabColor: { argb: 'FF4F46E5' } },
  });
  sheet1.columns = [
    { key: 'A', width: 36 },
    { key: 'B', width: 28 },
    { key: 'C', width: 28 },
    { key: 'D', width: 28 },
  ];

  // Título principal
  sheet1.mergeCells('A1:D1');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = 'CogniMirror — Reaction Mirror | Reporte Clínico';
  Object.assign(titleCell, cellStyle(true, BLUE_CORP, WHITE, 16));
  sheet1.getRow(1).height = 32;

  // Subtítulo paciente
  sheet1.mergeCells('A2:D2');
  const subCell = sheet1.getCell('A2');
  subCell.value = `Paciente: ${playerName || 'Anónimo'}   |   Fecha: ${date ? new Date(date).toLocaleString('es-CL') : new Date().toLocaleString('es-CL')}`;
  Object.assign(subCell, cellStyle(false, BLUE_LIGHT, BLUE_CORP, 11));
  sheet1.getRow(2).height = 20;

  sheet1.addRow([]); // espacio

  // Sección métricas clínicas
  applyHeader(sheet1.addRow(['MÉTRICA CLÍNICA', 'VALOR', 'INTERPRETACIÓN', '']), ['MÉTRICA CLÍNICA', 'VALOR', 'INTERPRETACIÓN', '']);
  sheet1.mergeCells(`C${sheet1.lastRow.number}:D${sheet1.lastRow.number}`);

  const metricRows = [
    ['Velocidad Promedio Global', metrics.avgTotal ? `${metrics.avgTotal} ms` : '—', metrics.speedCategory],
    ['Promedio Mano Derecha (Naranja)', metrics.avgRight ? `${metrics.avgRight} ms` : '—', ''],
    ['Promedio Mano Izquierda (Roja)', metrics.avgLeft ? `${metrics.avgLeft} ms` : '—', ''],
    ['Dominancia Motriz Detectada', metrics.dominance, metrics.dominanceIcon],
    ['Atención Sostenida', metrics.attentionLevel, metrics.attentionText?.substring(0, 80) || ''],
    ['Control Inhibitorio', metrics.controlCategory, `Falsos: ${metrics.falseStartCount} | Comisión: ${metrics.commissionCount} | Omisión: ${metrics.omissionCount}`],
    ['Post-Inhibitory Slowing (Acierto)', postInhibitory?.postSuccessSlowing_ms != null ? `${postInhibitory.postSuccessSlowing_ms > 0 ? '+' : ''}${postInhibitory.postSuccessSlowing_ms} ms` : '—', `n=${postInhibitory?.postSuccessSample || 0}`],
    ['Post-Error Slowing (Fallo No-Go)', postInhibitory?.postErrorSlowing_ms != null ? `${postInhibitory.postErrorSlowing_ms > 0 ? '+' : ''}${postInhibitory.postErrorSlowing_ms} ms` : '—', `n=${postInhibitory?.postErrorSample || 0}`],
  ];

  metricRows.forEach((vals, i) => {
    const r = sheet1.addRow(vals);
    const bg = i % 2 === 0 ? WHITE : GRAY_ROW;
    r.eachCell((cell, colNum) => {
      Object.assign(cell, cellStyle(colNum === 1, bg));
      cell.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'left' : 'center', wrapText: true };
    });
    sheet1.mergeCells(`C${r.number}:D${r.number}`);
    r.height = 18;
  });

  // Insertar gráfico capturado
  if (chartImageId !== null) {
    const imgRow = sheet1.lastRow.number + 2;
    sheet1.mergeCells(`A${imgRow}:D${imgRow}`);
    const imgHeaderCell = sheet1.getCell(`A${imgRow}`);
    imgHeaderCell.value = 'Gráfico de Telemetría — Tiempos de Reacción por Turno';
    Object.assign(imgHeaderCell, cellStyle(true, BLUE_CORP, WHITE, 11));

    sheet1.addImage(chartImageId, {
      tl: { col: 0, row: imgRow },
      ext: { width: 680, height: 280 },
    });
    for (let i = 0; i < 16; i++) sheet1.addRow([]);
  }

  // ════════════════════════════════════════════════════════════
  // HOJA 2 — Telemetría Bruta
  // ════════════════════════════════════════════════════════════
  const sheet2 = workbook.addWorksheet('Telemetría Bruta', {
    properties: { tabColor: { argb: 'FF059669' } },
  });
  sheet2.columns = [
    { key: 'turn', header: 'Turno', width: 10 },
    { key: 'type', header: 'Tipo', width: 10 },
    { key: 'expected', header: 'Cara Esperada', width: 18 },
    { key: 'actual', header: 'Cara Girada', width: 16 },
    { key: 'rt', header: 'RT Neto (ms)', width: 16 },
    { key: 'correct', header: 'Correcto', width: 12 },
    { key: 'status', header: 'Estado', width: 24 },
  ];

  applyHeader(sheet2.getRow(1), ['Turno', 'Tipo', 'Cara Esperada', 'Cara Girada', 'RT Neto (ms)', 'Correcto', 'Estado']);

  const faceLabel = f => f === 'L' ? 'Roja (L)' : f === 'R' ? 'Naranja (R)' : f || '—';

  (rawTurnsData || []).forEach((t, i) => {
    const isNew = t.type !== undefined;
    const type = isNew ? t.type : (t.isOmission ? 'NOGO' : 'GO');
    const expected = isNew ? faceLabel(t.expected) : faceLabel(t.expectedFace);
    const actual = faceLabel(t.actualFace || (t.status === 'Ok' || t.status === 'Corregido' || t.isCorrect ? (t.expected || t.expectedFace) : null));
    const rt = isNew ? (t.time || '—') : (t.reactionTimeMs || '—');
    const correct = isNew ? (t.status === 'Ok' || t.status === 'Corregido') : t.isCorrect;
    const status = isNew ? (t.status || '') : (t.isFalseStart ? 'Falso Arranque' : t.isOmission ? 'Omisión' : t.firstMoveWrong ? 'Corregido' : 'Ok');

    const r = sheet2.addRow([
      (isNew ? t.round : t.turn) || i + 1,
      type,
      expected,
      actual,
      rt,
      correct ? 'SÍ' : 'NO',
      status,
    ]);

    const bg = i % 2 === 0 ? WHITE : GRAY_ROW;
    const isError = !correct;
    r.eachCell(cell => {
      Object.assign(cell, cellStyle(false, isError ? 'FFFFF0F0' : bg));
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const correctCell = r.getCell(6);
    correctCell.font = { bold: true, color: { argb: correct ? 'FF059669' : 'FFE11D48' }, name: 'Calibri' };
    r.height = 17;
  });

  sheet2.autoFilter = { from: 'A1', to: 'G1' };

  // Generar y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CogniMirror_ReactionMirror_${(playerName || 'Anonimo').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════════
// EXPORTADOR HISTÓRICO MASIVO: REACTION MIRROR
// ════════════════════════════════════════════════════════════
export async function exportAllReactionHistoryExcel(historyList) {
  if (!historyList || historyList.length === 0) return;
  
  // Clonar y ordenar cronológicamente ascendente por fecha (más antiguo primero)
  const sortedHistory = [...historyList].sort((a, b) => new Date(a.date) - new Date(b.date));

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CogniMirror Clinical Engine';
  workbook.created = new Date();

  // HOJA 1: Resumen General
  const sheet1 = workbook.addWorksheet('Resumen Histórico', {
    properties: { tabColor: { argb: 'FF2563EB' } }
  });

  const summaryHeaders = [
    'Paciente',
    'Fecha Evaluación',
    'Dominancia Motriz',
    'Aciertos Izquierda (Roja)',
    'Aciertos Derecha (Naranja)',
    'Fallas Control No-Go',
    'TR Promedio Izq (ms)',
    'TR Promedio Der (ms)',
    'Racha Máxima',
    'Duración Sesión (s)'
  ];

  applyHeader(sheet1.getRow(1), summaryHeaders);

  sortedHistory.forEach((session, i) => {
    const m = session.metrics || {};
    const avgL = m.tiempo_promedio_por_mano?.L || Math.round(m.avgLeft) || 0;
    const avgR = m.tiempo_promedio_por_mano?.R || Math.round(m.avgRight) || 0;
    const durSec = Math.round((m.game_duration_ms || session.sessionDurationMs || 0) / 1000);

    const r = sheet1.addRow([
      session.playerName || 'Anónimo',
      new Date(session.date).toLocaleString('es-CL'),
      m.dominance || 'Test v2',
      m.aciertos_rojo ?? m.correctLeft ?? 0,
      m.aciertos_naranja ?? m.correctRight ?? 0,
      m.errores_falsos ?? m.falseStartCount ?? 0,
      avgL,
      avgR,
      m.max_streak ?? 0,
      durSec
    ]);

    const bg = i % 2 === 0 ? WHITE : GRAY_ROW;
    r.eachCell(cell => {
      Object.assign(cell, cellStyle(false, bg));
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    r.height = 18;
  });

  // Auto-width
  sheet1.columns.forEach(col => {
    let maxLen = 12;
    col.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? String(cell.value) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(32, maxLen + 4);
  });
  sheet1.autoFilter = { from: 'A1', to: 'J1' };


  // HOJA 2: Detalle de Turnos Estímulo
  const sheet2 = workbook.addWorksheet('Detalles de Turnos', {
    properties: { tabColor: { argb: 'FF059669' } }
  });

  const detailHeaders = [
    'Paciente',
    'Fecha de Sesión',
    'Turno ID',
    'Tipo Estímulo',
    'Cara Esperada',
    'Cara Girada',
    'Tiempo Neto (ms)',
    'Acierto',
    'Estado'
  ];

  applyHeader(sheet2.getRow(1), detailHeaders);

  const faceLabel = f => f === 'L' ? 'Roja (L)' : f === 'R' ? 'Naranja (R)' : f || '—';

  let rowIdx = 0;
  sortedHistory.forEach(session => {
    const rawData = session.rawTurnsData || [];
    rawData.forEach(t => {
      const isNew = t.type !== undefined;
      const type = isNew ? t.type : (t.isOmission ? 'NOGO' : 'GO');
      const expected = isNew ? faceLabel(t.expected) : faceLabel(t.expectedFace);
      const actual = faceLabel(t.actualFace || (t.status === 'Ok' || t.status === 'Corregido' || t.isCorrect ? (t.expected || t.expectedFace) : null));
      const rt = isNew ? (t.time || '—') : (t.reactionTimeMs || '—');
      const correct = isNew ? (t.status === 'Ok' || t.status === 'Corregido') : t.isCorrect;
      const status = isNew ? (t.status || '') : (t.isFalseStart ? 'Falso Arranque' : t.isOmission ? 'Omisión' : t.firstMoveWrong ? 'Corregido' : 'Ok');

      const r = sheet2.addRow([
        session.playerName || 'Anónimo',
        new Date(session.date).toLocaleString('es-CL'),
        (isNew ? t.round : t.turn) || 1,
        type,
        expected,
        actual,
        rt,
        correct ? 'SÍ' : 'NO',
        status
      ]);

      const bg = rowIdx % 2 === 0 ? WHITE : GRAY_ROW;
      const isError = !correct;
      r.eachCell(cell => {
        Object.assign(cell, cellStyle(false, isError ? 'FFFFF0F0' : bg));
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      const correctCell = r.getCell(8);
      correctCell.font = { bold: true, color: { argb: correct ? 'FF059669' : 'FFE11D48' }, name: 'Calibri' };
      r.height = 17;
      rowIdx++;
    });
  });

  sheet2.columns.forEach(col => {
    let maxLen = 12;
    col.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? String(cell.value) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(32, maxLen + 4);
  });
  sheet2.autoFilter = { from: 'A1', to: 'I1' };

  // Descarga del buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CogniMirror_Historial_ReactionMirror_Clinico_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════════
// EXPORTADOR HISTÓRICO MASIVO: MEMORY MIRROR (TEST DE CORSI)
// ════════════════════════════════════════════════════════════
export async function exportAllMemoryHistoryExcel(historyList) {
  if (!historyList || historyList.length === 0) return;

  // Clonar y ordenar cronológicamente ascendente por fecha (más antiguo primero)
  const sortedHistory = [...historyList].sort((a, b) => new Date(a.date) - new Date(b.date));

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CogniMirror Clinical Engine';
  workbook.created = new Date();

  // HOJA 1: Resumen General de Memoria
  const sheet1 = workbook.addWorksheet('Resumen de Memoria', {
    properties: { tabColor: { argb: 'FF8B5CF6' } }
  });

  const memoryHeaders = [
    'Paciente',
    'Fecha Evaluación',
    'Nivel Máximo Alcanzado',
    'Corsi Memory Span',
    'Intentos Correctos (Trials)',
    'Fallas / Errores Totales',
    'Latencia Promedio (ms)',
    'Duración Sesión (s)'
  ];

  applyHeader(sheet1.getRow(1), memoryHeaders);

  sortedHistory.forEach((session, i) => {
    const m = session.metrics || {};
    const corsiSpan = m.corsiSpan ?? Math.max(0, (m.maxLevelReached || 2) - 1);
    const correctTrials = m.totalCorrectTrials ?? corsiSpan;
    const durSec = Math.round((session.sessionDurationMs || 0) / 1000);

    const r = sheet1.addRow([
      session.playerName || 'Anónimo',
      new Date(session.date).toLocaleString('es-CL'),
      m.maxLevelReached ?? 2,
      corsiSpan,
      correctTrials,
      m.totalErrors ?? 0,
      m.avgLatencyMs ?? 0,
      durSec
    ]);

    const bg = i % 2 === 0 ? WHITE : GRAY_ROW;
    r.eachCell(cell => {
      Object.assign(cell, cellStyle(false, bg));
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    r.height = 18;
  });

  sheet1.columns.forEach(col => {
    let maxLen = 12;
    col.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? String(cell.value) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(32, maxLen + 4);
  });
  sheet1.autoFilter = { from: 'A1', to: 'H1' };


  // HOJA 2: Detalle de Secuencias de Corsi
  const sheet2 = workbook.addWorksheet('Secuencias y Telemetría', {
    properties: { tabColor: { argb: 'FF06B6D4' } }
  });

  const detailHeaders = [
    'Paciente',
    'Fecha de Sesión',
    'Nivel (Span)',
    'Intento',
    'Cara Esperada',
    'Cara Girada',
    'Acierto',
    'Latencia (ms)'
  ];

  applyHeader(sheet2.getRow(1), detailHeaders);

  let rowIdx = 0;
  sortedHistory.forEach(session => {
    const telemetry = session.telemetry || [];
    telemetry.forEach(t => {
      const r = sheet2.addRow([
        session.playerName || 'Anónimo',
        new Date(session.date).toLocaleString('es-CL'),
        t.level ?? 2,
        t.trial ?? 'A',
        t.expectedFace ?? '—',
        t.userFace ?? '—',
        t.isCorrect ? 'SÍ' : 'NO',
        t.latencyMs ?? '—'
      ]);

      const bg = rowIdx % 2 === 0 ? WHITE : GRAY_ROW;
      const isError = !t.isCorrect;
      r.eachCell(cell => {
        Object.assign(cell, cellStyle(false, isError ? 'FFFFF0F0' : bg));
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      const correctCell = r.getCell(7);
      correctCell.font = { bold: true, color: { argb: t.isCorrect ? 'FF059669' : 'FFE11D48' }, name: 'Calibri' };
      r.height = 17;
      rowIdx++;
    });
  });

  sheet2.columns.forEach(col => {
    let maxLen = 12;
    col.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? String(cell.value) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(32, maxLen + 4);
  });
  sheet2.autoFilter = { from: 'A1', to: 'H1' };

  // Generar y descargar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CogniMirror_Historial_MemoryMirror_Clinico_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
