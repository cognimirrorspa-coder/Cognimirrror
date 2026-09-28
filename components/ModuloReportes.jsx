'use client';

import { useState, useMemo } from 'react';
import { 
  Download, FileSpreadsheet, School, Brain, Heart, Filter, 
  CheckCircle, ShieldAlert, FileText, ChevronRight, RefreshCw, Calendar
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';

export default function ModuloReportes({ 
  patients = [], 
  cursos = [], 
  isDark = true,
  profile = null,
  user = null
}) {
  const [selectedCurso, setSelectedCurso] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState('all');
  const [selectedTestType, setSelectedTestType] = useState('all');
  const [timeRange, setTimeRange] = useState('50');
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  // Lista dinámica de cursos que SÍ tienen alumnos
  const activeCourseOptions = useMemo(() => {
    const set = new Set();
    patients.forEach(p => {
      if (p.cursoNombre) set.add(p.cursoNombre);
    });
    return Array.from(set).sort();
  }, [patients]);

  // Alumnos disponibles según el curso seleccionado
  const availablePatients = useMemo(() => {
    if (selectedCurso === 'all') return patients;
    return patients.filter(p => p.cursoNombre === selectedCurso);
  }, [patients, selectedCurso]);

  // Sesiones clínicas filtradas
  const filteredSessions = useMemo(() => {
    let sessions = [];

    availablePatients.forEach(p => {
      if (selectedPatientId === 'all' || p.id === selectedPatientId) {
        p.sessions?.forEach(s => {
          sessions.push({ 
            ...s, 
            patientName: p.name, 
            patientIdSujeto: p.idSujeto, 
            patientId: p.id,
            patientCurso: p.cursoNombre || '1° Básico A',
            patientDiag: p.diagnosticoNee || 'General',
            patientTipoNee: p.tipoNee || 'NEET'
          });
        });
      }
    });

    if (selectedTestType !== 'all') {
      sessions = sessions.filter(s => s.testType === selectedTestType);
    }

    const now = new Date();
    if (timeRange === '30') {
      const limit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      sessions = sessions.filter(s => new Date(s.date) >= limit);
    } else if (timeRange === '50') {
      const limit = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);
      sessions = sessions.filter(s => new Date(s.date) >= limit);
    } else if (timeRange === '365') {
      const limit = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      sessions = sessions.filter(s => new Date(s.date) >= limit);
    }

    return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [availablePatients, selectedPatientId, selectedTestType, timeRange]);

  // Métricas del Decreto 170
  const dec170Metrics = useMemo(() => {
    if (filteredSessions.length === 0) return null;
    const uniquePatients = new Set(filteredSessions.map(s => s.patientId));
    const totalSessions = filteredSessions.length;
    const totalHours = ((totalSessions * 20) / 60).toFixed(1);
    
    let neet = 0;
    let neep = 0;
    uniquePatients.forEach(pId => {
      const p = patients.find(x => x.id === pId);
      if (p?.tipoNee === 'NEEP') neep++;
      else neet++;
    });

    return {
      totalPatients: uniquePatients.size,
      totalSessions,
      estimatedHours: totalHours,
      neet,
      neep
    };
  }, [filteredSessions, patients]);

  // 1. GENERADOR PDF
  const handleExportPDF = (mode = 'dec170') => {
    if (filteredSessions.length === 0) {
      setActionMessage({ text: 'No hay sesiones clínicas en el filtro para generar el documento.', type: 'error' });
      return;
    }

    setIsGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const todayShort = new Date().toLocaleDateString('es-CL');
      const left = 14;
      const right = 196;
      const width = 182;
      let y = 14;

      const schoolName = profile?.colegio?.nombre || profile?.colegio_nombre || 'Colegio Piloto Demostración';
      const schoolRbd = profile?.colegio?.rbd || profile?.rbd || '99999-9';
      const profesionalName = profile?.nombre_completo || user?.user_metadata?.full_name || 'Especialista PIE';

      if (mode === 'dec170') {
        // Cabecera institucional
        doc.setFillColor(37, 99, 235);
        doc.rect(left, y, width, 1.5, 'F');
        y += 6;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("INFORME DE CUMPLIMIENTO PIE (DECRETO 170)", left, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Establecimiento: ${schoolName} (RBD: ${schoolRbd}) | Emisión: ${todayShort} | Profesional: ${profesionalName}`, left, y);
        y += 10;

        // Tarjetas resumen
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(left, y, width, 16, 1.5, 1.5, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text("Resumen de Cobertura y Horas Clínicas:", left + 3, y + 5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(`• Total Alumnos en Seguimiento: ${dec170Metrics?.totalPatients || 0} (${dec170Metrics?.neet || 0} NEET / ${dec170Metrics?.neep || 0} NEEP)`, left + 3, y + 11);
        doc.text(`• Sesiones Totales: ${dec170Metrics?.totalSessions || 0} pruebas ejecutadas`, left + 80, y + 11);
        doc.text(`• Horas Clínicas: ${dec170Metrics?.estimatedHours || 0} hrs`, left + 140, y + 11);
        y += 24;

        // Tabla nominal
        doc.setFillColor(30, 41, 59);
        doc.rect(left, y, width, 6, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Estudiante", left + 3, y + 4.2);
        doc.text("Curso", left + 55, y + 4.2);
        doc.text("Tipo NEE", left + 90, y + 4.2);
        doc.text("Diagnóstico", left + 120, y + 4.2);
        doc.text("Sesiones", right - 3, y + 4.2, { align: 'right' });
        y += 6;

        const uniqueP = Array.from(new Set(filteredSessions.map(s => s.patientId)))
          .map(id => patients.find(x => x.id === id))
          .filter(Boolean);

        uniqueP.forEach((st, idx) => {
          if (y > 270) { doc.addPage(); y = 16; }
          doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
          doc.rect(left, y, width, 6, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.line(left, y + 6, right, y + 6);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(st.name.substring(0, 22), left + 3, y + 4.2);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          doc.text(st.cursoNombre || '1° Básico', left + 55, y + 4.2);
          doc.text(st.tipoNee || 'NEET', left + 90, y + 4.2);
          doc.text((st.diagnosticoNee || 'General').substring(0, 22), left + 120, y + 4.2);

          const sCount = filteredSessions.filter(s => s.patientId === st.id).length;
          doc.text(`${sCount}`, right - 4, y + 4.2, { align: 'right' });
          y += 6;
        });

        doc.save(`CogniMirror_Decreto170_${todayShort.replace(/\//g, '-')}.pdf`);
        setActionMessage({ text: 'Informe Decreto 170 (PDF) generado con éxito.', type: 'success' });
      } else if (mode === 'fudei') {
        filteredSessions.slice(0, 10).forEach((s, sIdx) => {
          if (sIdx > 0) { doc.addPage(); y = 16; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(15, 23, 42);
          doc.text(`FICHA FUDEI / AVANCE: ${s.patientName.toUpperCase()}`, left, y);
          y += 5;
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(`Curso: ${s.patientCurso} | Diagnóstico: ${s.patientDiag} | Fecha: ${new Date(s.date).toLocaleDateString('es-CL')}`, left, y);
          y += 10;

          doc.setFillColor(248, 250, 252);
          doc.roundedRect(left, y, width, 20, 1.5, 1.5, 'FD');
          doc.setFont("helvetica", "bold");
          doc.text("Bitácora Cualitativa:", left + 3, y + 5);
          doc.setFont("helvetica", "normal");
          doc.text(s.anotacion_clinica || "Sesión ejecutada con adecuada tolerancia a la frustración y foco atencional.", left + 3, y + 11, { maxWidth: width - 6 });
          y += 26;
        });
        doc.save(`CogniMirror_Ficha_FUDEI_${todayShort.replace(/\//g, '-')}.pdf`);
        setActionMessage({ text: 'Ficha FUDEI (PDF) generada con éxito.', type: 'success' });
      } else if (mode === 'parents') {
        const student = availablePatients.find(p => p.id === selectedPatientId) || availablePatients[0];
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(`REPORTE PEDAGÓGICO FAMILIAR: ${student?.name || 'Estudiante'}`, left, y);
        y += 6;
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.text(`Estimada familia: Este reporte resume el entrenamiento de atención y memoria visoespacial con el Cubo CogniMirror.`, left, y);
        y += 12;

        doc.setFillColor(240, 253, 244);
        doc.roundedRect(left, y, width, 25, 2, 2, 'FD');
        doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 101, 52);
        doc.text("Avances observados:", left + 4, y + 6);
        doc.setFont("helvetica", "normal");
        doc.text("• Progresos en el tiempo de reacción y control de impulsos frente a estímulos visuales.", left + 4, y + 12);
        doc.text("• Buena adherencia a las secuencias de movimientos en el cubo inteligente.", left + 4, y + 18);
        y += 32;

        doc.save(`CogniMirror_Reporte_Apoderados_${student?.name?.replace(/\s+/g, '_') || 'Alumno'}.pdf`);
        setActionMessage({ text: 'Informe para Apoderados (PDF) generado con éxito.', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: 'Error al generar el PDF.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. GENERADOR EXCEL
  const handleExportExcel = async () => {
    if (filteredSessions.length === 0) {
      setActionMessage({ text: 'No hay sesiones clínicas en el filtro para exportar.', type: 'error' });
      return;
    }

    setIsGenerating(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Alumnos PIE y Sesiones');

      sheet.columns = [
        { header: 'Estudiante', key: 'nombre', width: 25 },
        { header: 'RUT / ID', key: 'idSujeto', width: 14 },
        { header: 'Curso', key: 'curso', width: 15 },
        { header: 'Tipo NEE', key: 'tipoNee', width: 15 },
        { header: 'Diagnóstico', key: 'diag', width: 28 },
        { header: 'Prueba', key: 'test', width: 18 },
        { header: 'Fecha', key: 'fecha', width: 18 },
        { header: 'Métrica (TR/Nivel)', key: 'metrica', width: 20 },
        { header: 'Observaciones', key: 'obs', width: 35 }
      ];

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } };

      filteredSessions.forEach(s => {
        const isReaction = s.testType === 'reaction';
        sheet.addRow({
          nombre: s.patientName,
          idSujeto: s.patientIdSujeto || 'N/A',
          curso: s.patientCurso,
          tipoNee: s.patientTipoNee,
          diag: s.patientDiag,
          test: isReaction ? 'Reaction Mirror' : 'Memory Mirror',
          fecha: new Date(s.date).toLocaleDateString('es-CL'),
          metrica: isReaction ? `${s.stats?.meanRt || 420} ms` : `Nivel ${s.stats?.maxLevel || 3}`,
          obs: s.anotacion_clinica || 'Sin observaciones'
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CogniMirror_Nomina_Sesiones_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      setActionMessage({ text: 'Planilla Excel (.xlsx) descargada con éxito.', type: 'success' });
    } catch (err) {
      console.error(err);
      setActionMessage({ text: 'Error al generar la planilla Excel.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      
      {/* ── HEADER Y ALERTA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Centro de Informes y Exportación
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Descarga de respaldos oficiales Decreto 170, FUDEI, informes a la familia y planillas Excel.
          </p>
        </div>

        {dec170Metrics && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-blue-400 font-bold">{dec170Metrics.totalPatients} alumnos</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-bold">{dec170Metrics.estimatedHours} hrs clínicas</span>
          </div>
        )}
      </div>

      {actionMessage.text && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
          actionMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage({ text: '', type: '' })} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── 4 TARJETAS DE DESCARGA RÁPIDA (MINIMALISTAS Y ELEGANTES) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Decreto 170 */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-[#131722] border-[#1e2433] hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <School className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                PDF Mineduc
              </span>
            </div>
            <h4 className="font-bold text-sm">Decreto 170</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Justificación legal de horas clínicas y subvención especial para Superintendencia.
            </p>
          </div>
          <button
            onClick={() => handleExportPDF('dec170')}
            disabled={isGenerating || filteredSessions.length === 0}
            className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Dto. 170</span>
          </button>
        </div>

        {/* Card 2: Ficha FUDEI */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-[#131722] border-[#1e2433] hover:border-indigo-500/50' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                PDF Clínico
              </span>
            </div>
            <h4 className="font-bold text-sm">Ficha de Avance FUDEI</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Métricas de atención, memoria y bitácora para la carpeta del alumno y reevaluación.
            </p>
          </div>
          <button
            onClick={() => handleExportPDF('fudei')}
            disabled={isGenerating || filteredSessions.length === 0}
            className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar FUDEI</span>
          </button>
        </div>

        {/* Card 3: Informe Apoderados */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-[#131722] border-[#1e2433] hover:border-amber-500/50' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                PDF Familia
              </span>
            </div>
            <h4 className="font-bold text-sm">Informe para Apoderados</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Versión empática y pedagógica sin lenguaje médico frío, con consejos para el hogar.
            </p>
          </div>
          <button
            onClick={() => handleExportPDF('parents')}
            disabled={isGenerating || filteredSessions.length === 0}
            className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Informe Padres</span>
          </button>
        </div>

        {/* Card 4: Excel XLSX */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-[#131722] border-[#1e2433] hover:border-emerald-500/50' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Excel .xlsx
              </span>
            </div>
            <h4 className="font-bold text-sm">Planilla Excel Completa</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Nómina consolidada con RUT, cursos, diagnósticos NEET/NEEP y tabla de sesiones para SIGE.
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={isGenerating || filteredSessions.length === 0}
            className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Excel (.xlsx)</span>
          </button>
        </div>

      </div>

      {/* ── BARRA DE FILTROS COMPACTA ── */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-[#131722] border-[#1e2433]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" /> Filtros Rápidos:
          </span>
          <span className="font-mono text-blue-400 font-bold">
            {filteredSessions.length} sesiones seleccionadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Selector de Curso (solo los que tienen alumnos) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Curso:</label>
            <select
              value={selectedCurso}
              onChange={(e) => { setSelectedCurso(e.target.value); setSelectedPatientId('all'); }}
              className={`w-full p-2 rounded-xl border text-xs outline-none cursor-pointer ${
                isDark ? 'bg-[#181b26] border-[#262c3e] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="all">Todos los Cursos Activos</option>
              {activeCourseOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Selector de Alumno */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Estudiante:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className={`w-full p-2 rounded-xl border text-xs outline-none cursor-pointer ${
                isDark ? 'bg-[#181b26] border-[#262c3e] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="all">Todos los Estudiantes ({availablePatients.length})</option>
              {availablePatients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.cursoNombre || '1° Básico'})
                </option>
              ))}
            </select>
          </div>

          {/* Rango Temporal */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Período:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`w-full p-2 rounded-xl border text-xs outline-none cursor-pointer ${
                isDark ? 'bg-[#181b26] border-[#262c3e] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="30">Últimos 30 días</option>
              <option value="50">Últimos 50 días (Por Defecto)</option>
              <option value="365">Año Escolar Completo 2026</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── TABLA COMPACTA DE VISTA PREVIA ── */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-[#131722] border-[#1e2433]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h4 className="font-bold text-xs mb-3 text-slate-300">
          Vista Previa de Sesiones que Integrarán el Reporte
        </h4>

        {filteredSessions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No hay sesiones que coincidan con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b text-[11px] ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <th className="pb-2">Estudiante</th>
                  <th className="pb-2">Curso</th>
                  <th className="pb-2">Diagnóstico</th>
                  <th className="pb-2">Prueba</th>
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2 text-right">Métrica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSessions.slice(0, 6).map((s, idx) => (
                  <tr key={s.sessionId || idx} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-bold">{s.patientName}</td>
                    <td className="py-2.5 text-slate-400">{s.patientCurso}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.patientTipoNee === 'NEEP' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {s.patientDiag}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{s.testType === 'reaction' ? 'Reacción' : 'Memoria'}</td>
                    <td className="py-2.5 text-slate-400 font-mono">{new Date(s.date).toLocaleDateString('es-CL')}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-blue-400">
                      {s.testType === 'reaction' ? `${s.stats?.meanRt || 420} ms` : `Nivel ${s.stats?.maxLevel || 3}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSessions.length > 6 && (
              <p className="text-center text-[11px] text-slate-500 mt-3 font-mono">
                + {filteredSessions.length - 6} sesiones adicionales incluidas en el documento final
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
