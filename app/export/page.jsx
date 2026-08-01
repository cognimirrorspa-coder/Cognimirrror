'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePatientsDB } from '../../hooks/usePatientsDB';
import { supabase } from '../../utils/supabaseClient';
import { 
  ArrowLeft, Download, FileSpreadsheet, FileText, Link2, 
  Calendar, User, Brain, Zap, Clock, ShieldAlert, CheckCircle, Trash2 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../contexts/AuthContext';
import ExcelJS from 'exceljs';
import Cube3DViewer from '../../components/Cube3DViewer';
import { CubeStateProvider } from '../../contexts/CubeStateContext';

export default function ExportCenter() {
  const { 
    patients, 
    fetchRemoteEvaluations, 
    createRemoteEvaluation, 
    invalidateRemoteEvaluation 
  } = usePatientsDB();
  const { signOut } = useAuth();
  const [savedSessionId, setSavedSessionId] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('exports');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'remote') {
        setActiveTab('remote');
      }
    }
  }, []);

  // Filter States
  const [selectedPatientId, setSelectedPatientId] = useState('all');
  const [selectedTestType, setSelectedTestType] = useState('all');
  const [timeRange, setTimeRange] = useState('50'); // 30, 50, 365, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detailLevel, setDetailLevel] = useState('summary'); // summary, telemetry, dec170

  // Remote Evaluation States
  const [remoteEvals, setRemoteEvals] = useState([]);
  const [loadingEvals, setLoadingEvals] = useState(false);
  const [selectedRemotePatient, setSelectedRemotePatient] = useState('');
  const [selectedRemoteTest, setSelectedRemoteTest] = useState('reaction');
  const [generatedLink, setGeneratedLink] = useState('');
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Control Room States
  const [activeControlEval, setActiveControlEval] = useState(null);
  const [patientOnline, setPatientOnline] = useState(false);
  const [patientDevice, setPatientDevice] = useState('');
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [twinMove, setTwinMove] = useState(null);
  const [twinKey, setTwinKey] = useState(0);
  const controlChannelRef = useRef(null);

  // Load Remote Evaluations
  const loadRemoteEvals = async () => {
    setLoadingEvals(true);
    const data = await fetchRemoteEvaluations();
    setRemoteEvals(data || []);
    setLoadingEvals(false);
  };

  useEffect(() => {
    if (activeTab === 'remote') {
      loadRemoteEvals();
    }
  }, [activeTab]);

  // Clean messages after a few seconds
  useEffect(() => {
    if (actionMessage.text) {
      const timer = setTimeout(() => setActionMessage({ text: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // Realtime subscription for monitoring
  useEffect(() => {
    if (!activeControlEval) return;

    console.log('[Realtime Docente] Inicializando canal para token:', activeControlEval.token);
    const channel = supabase.channel(`eval_${activeControlEval.token}`);

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('[Realtime Docente] Presence State Sync:', state);
      const users = Object.values(state).flat();
      if (users.length > 0) {
        setPatientOnline(true);
        setPatientDevice(users[0].device || 'Conectado');
      } else {
        setPatientOnline(false);
        setPatientDevice('');
      }
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('[Realtime Docente] Presence Join:', newPresences);
      setPatientOnline(true);
      setPatientDevice(newPresences[0]?.device || 'Conectado');
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('[Realtime Docente] Presence Leave:', leftPresences);
      const state = channel.presenceState();
      const users = Object.values(state).flat();
      if (users.length > 0) {
        setPatientOnline(true);
        setPatientDevice(users[0].device || 'Conectado');
      } else {
        setPatientOnline(false);
        setPatientDevice('');
      }
    });

    channel.on('broadcast', { event: 'move' }, (event) => {
      console.log('[Realtime Docente] Movimiento recibido:', event.payload.notation);
      setTwinMove([event.payload.notation]);
      setTwinKey(Date.now());
    });

    channel.on('broadcast', { event: 'telemetry' }, (event) => {
      console.log('[Realtime Docente] Telemetría recibida:', event.payload);
      setLiveTelemetry(event.payload);
    });

    channel.on('broadcast', { event: 'finished_session' }, (event) => {
      console.log('[Realtime Docente] Sesión finalizada recibida:', event.payload);
      setSavedSessionId(event.payload.sessionId);
    });

    channel.subscribe((status, err) => {
      console.log(`[Realtime Docente] Canal status: ${status}`, err || '');
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime Docente] Suscripción exitosa a eval_' + activeControlEval.token);
      }
    });

    controlChannelRef.current = channel;

    return () => {
      console.log('[Realtime Docente] Limpiando canal para token:', activeControlEval.token);
      channel.unsubscribe();
      controlChannelRef.current = null;
      setPatientOnline(false);
      setPatientDevice('');
      setLiveTelemetry(null);
      setTwinMove(null);
      setSavedSessionId(null);
    };
  }, [activeControlEval]);

  const sendRemoteCommand = (type, extra = {}) => {
    if (controlChannelRef.current) {
      controlChannelRef.current.send({
        type: 'broadcast',
        event: 'command',
        payload: { type, ...extra }
      });
    }
  };

  // Filter Sessions Clinicas locally
  const filteredSessions = useMemo(() => {
    let sessions = [];

    // Collect sessions from selected patients
    if (selectedPatientId === 'all') {
      patients.forEach(p => {
        p.sessions?.forEach(s => {
          sessions.push({ ...s, patientName: p.name, patientIdSujeto: p.idSujeto, patientId: p.id });
        });
      });
    } else {
      const p = patients.find(x => x.id === selectedPatientId);
      p?.sessions?.forEach(s => {
        sessions.push({ ...s, patientName: p.name, patientIdSujeto: p.idSujeto, patientId: p.id });
      });
    }

    // Filter by test type
    if (selectedTestType !== 'all') {
      sessions = sessions.filter(s => s.testType === selectedTestType);
    }

    // Filter by time range
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
    } else if (timeRange === 'custom') {
      if (startDate) {
        sessions = sessions.filter(s => new Date(s.date) >= new Date(startDate));
      }
      if (endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setHours(23, 59, 59, 999);
        sessions = sessions.filter(s => new Date(s.date) <= adjustedEndDate);
      }
    }

    // Order sessions chronologically
    return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [patients, selectedPatientId, selectedTestType, timeRange, startDate, endDate]);

  // General statistics for Reporte Decreto 170 (PIE)
  const dec170Metrics = useMemo(() => {
    if (filteredSessions.length === 0) return null;

    const uniquePatients = new Set(filteredSessions.map(s => s.patientId));
    const totalSessions = filteredSessions.length;
    
    // Estimate total hours of use (each session averages about 15 minutes of assessment and prep)
    const minutesPerSession = 15;
    const totalHours = ((totalSessions * minutesPerSession) / 60).toFixed(1);

    // Calculate overall clinical improvement rate
    // We check how much reaction speed decreases or memory scores improve between initial and final sessions
    let patientsWithMultipleSessions = 0;
    let totalImprovement = 0;

    uniquePatients.forEach(pId => {
      const pSessions = filteredSessions.filter(s => s.patientId === pId).sort((a, b) => new Date(a.date) - new Date(b.date));
      if (pSessions.length >= 2) {
        patientsWithMultipleSessions++;
        
        // Analyze reaction improvement
        const reactionSess = pSessions.filter(s => s.testType === 'reaction');
        if (reactionSess.length >= 2) {
          const firstRt = reactionSess[0].stats?.meanRt || reactionSess[0].stats?.globalAvg || 800;
          const lastRt = reactionSess[reactionSess.length - 1].stats?.meanRt || reactionSess[reactionSess.length - 1].stats?.globalAvg || 800;
          if (firstRt > 0) {
            const improvement = ((firstRt - lastRt) / firstRt) * 100;
            totalImprovement += improvement;
          }
        } else {
          // Analyze memory improvement
          const memorySess = pSessions.filter(s => s.testType === 'memory');
          if (memorySess.length >= 2) {
            const firstScore = memorySess[0].stats?.maxLevel || 3;
            const lastScore = memorySess[memorySess.length - 1].stats?.maxLevel || 3;
            if (firstScore > 0) {
              const improvement = ((lastScore - firstScore) / firstScore) * 100;
              totalImprovement += improvement;
            }
          }
        }
      }
    });

    const averageImprovement = patientsWithMultipleSessions > 0 
      ? Math.max(0, (totalImprovement / patientsWithMultipleSessions).toFixed(1)) 
      : 'N/A';

    return {
      totalPatients: uniquePatients.size,
      totalSessions,
      estimatedHours: totalHours,
      improvementRate: averageImprovement,
      groupTag: 'grupo_brayan'
    };
  }, [filteredSessions]);

  // --- PDF EXPORT FUNCTION ---
  const exportPDF = () => {
    if (filteredSessions.length === 0) {
      setActionMessage({ text: 'No hay sesiones clínicas en el rango seleccionado para exportar.', type: 'error' });
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const today = new Date().toLocaleDateString('es-CL');
    let y = 20;

    // Header Design
    doc.setFillColor(7, 8, 15); // Dark blue / black background
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(0, 255, 255); // Cyan accent
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("COGNIMIRROR SUITE", 15, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("REPORTE CLÍNICO LONGITUDINAL", 15, 27);
    doc.text(`Filtros: ${selectedPatientId === 'all' ? 'Todos' : 'Individual'} | Rango: ${timeRange} días`, 15, 34);

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.text(`Fecha Emisión: ${today}`, 160, 20);
    doc.text("Grupo: grupo_brayan", 160, 26);

    y = 55;

    // CASE 1: Decree 170 Report (Justificación PIE for Director)
    if (detailLevel === 'dec170') {
      if (!dec170Metrics) return;

      doc.setTextColor(37, 99, 235); // Blue
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("REPORTE DE CUMPLIMIENTO PIE (DECRETO 170)", 15, y);
      y += 8;

      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        "Este informe detalla el uso del sistema digital CogniMirror (hardware interactivo inteligente y telemetría de precisión) como herramienta terapéutica de estimulación neurocognitiva, justificando la ejecución de fondos destinados al Programa de Integración Escolar (PIE) según Decreto N° 170.",
        15, y, { maxWidth: 180 }
      );
      y += 20;

      // Summary Table Box
      doc.setFillColor(245, 247, 250);
      doc.rect(15, y, 180, 45, 'F');
      doc.rect(15, y, 180, 45, 'D');

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Métricas Agregadas del Grupo PIE:", 20, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`• Total de Alumnos PIE Atendidos:`, 25, y + 16);
      doc.setFont("helvetica", "bold");
      doc.text(`${dec170Metrics.totalPatients} estudiantes`, 95, y + 16);

      doc.setFont("helvetica", "normal");
      doc.text(`• Sesiones de Evaluación Realizadas:`, 25, y + 23);
      doc.setFont("helvetica", "bold");
      doc.text(`${dec170Metrics.totalSessions} sesiones`, 95, y + 23);

      doc.setFont("helvetica", "normal");
      doc.text(`• Horas Estimadas de Uso Clínico:`, 25, y + 30);
      doc.setFont("helvetica", "bold");
      doc.text(`${dec170Metrics.estimatedHours} horas`, 95, y + 30);

      doc.setFont("helvetica", "normal");
      doc.text(`• Tasa de Mejoría Cognitiva Promedio:`, 25, y + 37);
      doc.setFont("helvetica", "bold");
      doc.text(`${dec170Metrics.improvementRate}%`, 95, y + 37);

      y += 55;

      // Patients list
      doc.setTextColor(37, 99, 235);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Desglose Longitudinal de Alumnos:", 15, y);
      y += 8;

      // Headers of mini table
      doc.setFillColor(37, 99, 235);
      doc.rect(15, y, 180, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("Identificador / Sujeto", 18, y + 5);
      doc.text("Nombre Alumno", 65, y + 5);
      doc.text("N° Sesiones", 125, y + 5);
      doc.text("Última Evaluación", 155, y + 5);
      y += 7;

      // Table lines
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      
      const uniquePatientList = Array.from(new Set(filteredSessions.map(s => s.patientId)));
      uniquePatientList.forEach((pId, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        const pSessions = filteredSessions.filter(s => s.patientId === pId);
        const firstSess = pSessions[0];
        const lastDate = new Date(pSessions[0].date).toLocaleDateString('es-CL');

        doc.rect(15, y, 180, 8);
        doc.text(firstSess.patientIdSujeto || 'N/A', 18, y + 5.5);
        doc.text(firstSess.patientName || 'Estudiante', 65, y + 5.5);
        doc.text(String(pSessions.length), 130, y + 5.5);
        doc.text(lastDate, 155, y + 5.5);

        y += 8;
      });

      y += 20;
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Signatures for the director
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("_____________________________________", 20, y);
      doc.text("_____________________________________", 120, y);
      y += 5;
      doc.text("Firma Especialista / Psicólogo", 30, y);
      doc.text("Firma Director Establecimiento", 130, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Responsable PIE / Registro Clínico", 33, y);
      doc.text("Recepción y Conformidad Decreto 170", 132, y);

      doc.save(`CogniMirror_Decreto170_PIE_${today.replace(/\//g, '-')}.pdf`);
      setActionMessage({ text: 'Reporte Decreto 170 (PDF) descargado con éxito.', type: 'success' });
      return;
    }

    // CASE 2: Clinical Summary or Turn-by-Turn PDF
    filteredSessions.forEach((session, sIdx) => {
      if (sIdx > 0) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`SESIÓN #${session.attemptNumber}: ${session.patientName} (${session.patientIdSujeto || 'Sin ID'})`, 15, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Test: ${session.testType === 'reaction' ? 'Reaction Mirror' : 'Memory Mirror'} | Fecha: ${new Date(session.date).toLocaleString('es-CL')}`, 15, y);
      doc.text(`Etiqueta: ${session.clinicalLabel || 'Sin etiqueta'} | Id Estudio: ${session.etiquetaEstudio || 'N/A'}`, 15, y + 5);
      y += 14;

      // Anotacion clinica (Bitacora)
      doc.setFillColor(250, 245, 245);
      doc.setDrawColor(240, 200, 200);
      doc.rect(15, y, 180, 22, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(200, 50, 50);
      doc.text("Bitácora Clínica (Observación Cualitativa):", 18, y + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      const notes = session.anotacion_clinica || "Sin observaciones cualitativas registradas en esta sesión.";
      doc.text(notes, 18, y + 13, { maxWidth: 174 });
      
      y += 28;

      // Stats block
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(220, 224, 230);
      doc.rect(15, y, 180, 22, 'FD');

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Resultados Cuantitativos:", 18, y + 6);
      
      doc.setFont("helvetica", "normal");
      if (session.testType === 'reaction') {
        const avgRt = session.stats?.meanRt || session.stats?.globalAvg || 'N/A';
        const accuracy = session.stats?.accuracy || 'N/A';
        const errors = session.stats?.errors || '0';

        doc.text(`• Tiempo Reacción Promedio: ${avgRt} ms`, 18, y + 14);
        doc.text(`• Precisión (No-Go): ${accuracy}%`, 85, y + 14);
        doc.text(`• Errores: ${errors}`, 145, y + 14);
      } else {
        const maxLevel = session.stats?.maxLevel || 'N/A';
        const avgLatency = session.stats?.avgLatency || 'N/A';
        const errors = session.stats?.errorsCount || '0';

        doc.text(`• Máximo Nivel Alcanzado: ${maxLevel}`, 18, y + 14);
        doc.text(`• Latencia Promedio Giro: ${avgLatency} ms`, 85, y + 14);
        doc.text(`• Errores: ${errors}`, 145, y + 14);
      }

      y += 28;

      // Detail turns
      if (detailLevel === 'telemetry') {
        doc.setFont("helvetica", "bold");
        doc.text("Telemetría Detallada de Giros (Focos de Atención):", 15, y);
        y += 8;

        // Headers
        doc.setFillColor(7, 8, 15);
        doc.rect(15, y, 180, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.text("Turno", 18, y + 4.5);
        doc.text("Estímulo / Cara", 40, y + 4.5);
        doc.text("Giro Usuario", 90, y + 4.5);
        doc.text("Latencia", 130, y + 4.5);
        doc.text("Resultado", 165, y + 4.5);
        y += 6;

        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        const turns = session.rawTurnsData || [];
        
        turns.slice(0, 20).forEach((t, tIdx) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          doc.rect(15, y, 180, 7);
          doc.text(`#${tIdx + 1}`, 18, y + 5);

          const stim = session.testType === 'reaction' 
            ? (t.type === 'GO' ? `GO (${t.expected})` : 'NOGO') 
            : `Patrón (${t.expectedFace || t.expected || 'N/A'})`;
          
          doc.text(stim, 40, y + 5);

          const actualFace = t.actualFace || t.userFace || '---';
          doc.text(actualFace, 90, y + 5);

          const timeStr = t.time !== undefined ? `${t.time} ms` : (t.latencyMs !== undefined ? `${t.latencyMs} ms` : '---');
          doc.text(timeStr, 130, y + 5);

          const status = t.status || (t.isCorrect ? 'Ok' : 'Error');
          doc.text(status, 165, y + 5);

          y += 7;
        });

        if (turns.length > 20) {
          doc.setFontSize(8);
          doc.text(`* Mostrando los primeros 20 giros de un total de ${turns.length} turnos.`, 15, y + 5);
        }
      }
    });

    doc.save(`CogniMirror_Reporte_Clinico_${today.replace(/\//g, '-')}.pdf`);
    setActionMessage({ text: 'Reporte Clínico (PDF) descargado con éxito.', type: 'success' });
  };

  // --- EXCEL EXPORT FUNCTION (EXCELJS) ---
  const exportExcel = async () => {
    if (filteredSessions.length === 0) {
      setActionMessage({ text: 'No hay sesiones clínicas en el rango seleccionado para exportar.', type: 'error' });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const today = new Date().toLocaleDateString('es-CL');

    // SHEET 1: Clinical Sessions Summary
    const summarySheet = workbook.addWorksheet('Resumen de Evaluaciones');
    
    // Add nice style headers
    summarySheet.columns = [
      { header: 'ID Sesión', key: 'id', width: 25 },
      { header: 'ID Sujeto', key: 'idSujeto', width: 12 },
      { header: 'Paciente', key: 'paciente', width: 25 },
      { header: 'Tipo de Test', key: 'tipoTest', width: 18 },
      { header: 'N° Intento', key: 'intento', width: 12 },
      { header: 'Etiqueta Clínica', key: 'etiqueta', width: 25 },
      { header: 'Fecha Evaluación', key: 'fecha', width: 20 },
      { header: 'Métrica Clave', key: 'metrica', width: 28 },
      { header: 'Pausa Prolongada / Errores', key: 'errores', width: 28 },
      { header: 'Observaciones Cualitativas', key: 'observaciones', width: 45 }
    ];

    // Format headers
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F497D' } // Navy blue
    };

    filteredSessions.forEach(s => {
      const isReaction = s.testType === 'reaction';
      const keyMetric = isReaction 
        ? `T.R. Promedio: ${s.stats?.meanRt || s.stats?.globalAvg || 'N/A'} ms` 
        : `Nivel Máx: ${s.stats?.maxLevel || 'N/A'}`;
      
      const subMetric = isReaction
        ? `Errores: ${s.stats?.errors || 0}`
        : `Latencia Promedio: ${s.stats?.avgLatency || 'N/A'} ms`;

      summarySheet.addRow({
        id: s.sessionId,
        idSujeto: s.patientIdSujeto || 'N/A',
        paciente: s.patientName || 'Anónimo',
        tipoTest: isReaction ? 'Reaction Mirror' : 'Memory Mirror',
        intento: s.attemptNumber,
        etiqueta: s.clinicalLabel || 'N/A',
        fecha: new Date(s.date).toLocaleDateString('es-CL') + ' ' + new Date(s.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        metrica: keyMetric,
        errores: subMetric,
        observaciones: s.anotacion_clinica || 'Sin observaciones.'
      });
    });

    // SHEET 2: Full Telemetry (If selected detail level is telemetry)
    if (detailLevel === 'telemetry') {
      const telemetrySheet = workbook.addWorksheet('Telemetría por Turnos');
      
      telemetrySheet.columns = [
        { header: 'ID Sesión', key: 'idSesion', width: 25 },
        { header: 'Paciente', key: 'paciente', width: 20 },
        { header: 'Tipo Test', key: 'tipoTest', width: 15 },
        { header: 'Giro N°', key: 'giroNum', width: 10 },
        { header: 'Estímulo Esperado', key: 'esperado', width: 18 },
        { header: 'Giro Ejecutado', key: 'girado', width: 18 },
        { header: 'Latencia (ms)', key: 'latencia', width: 15 },
        { header: 'Es Correcto', key: 'correcto', width: 15 },
        { header: 'Tipo Error', key: 'tipoError', width: 18 }
      ];

      telemetrySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      telemetrySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' } // Lighter steel blue
      };

      filteredSessions.forEach(s => {
        const turns = s.rawTurnsData || [];
        turns.forEach((t, tIdx) => {
          const isReaction = s.testType === 'reaction';
          
          const esperado = isReaction 
            ? (t.type === 'GO' ? t.expected : 'NOGO')
            : (t.expectedFace || t.expected || 'N/A');

          const girado = t.actualFace || t.userFace || '---';
          const latencia = t.time !== undefined ? t.time : (t.latencyMs !== undefined ? t.latencyMs : null);
          const correcto = t.status === 'Ok' || t.isCorrect ? 'SÍ' : 'NO';
          const tipoError = t.errorType || (t.status === 'Error' || !t.isCorrect ? 'Omisión/Comisión' : 'Ninguno');

          telemetrySheet.addRow({
            idSesion: s.sessionId,
            paciente: s.patientName || 'Anónimo',
            tipoTest: isReaction ? 'Reaction Mirror' : 'Memory Mirror',
            giroNum: tIdx + 1,
            esperado: esperado,
            girado: girado,
            latencia: latencia,
            correcto: correcto,
            tipoError: tipoError
          });
        });
      });
    }

    // Write buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `CogniMirror_Export_${today.replace(/\//g, '-')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);

    setActionMessage({ text: 'Archivo Excel (.xlsx) exportado con éxito.', type: 'success' });
  };

  // --- MAGIC LINK FUNCTIONS ---
  const handleGenerateMagicLink = async (e) => {
    e.preventDefault();
    if (!selectedRemotePatient) {
      setActionMessage({ text: 'Por favor, selecciona un paciente.', type: 'error' });
      return;
    }

    try {
      const data = await createRemoteEvaluation(selectedRemotePatient, selectedRemoteTest);
      
      // Construct the URL
      const origin = window.location.origin;
      const link = `${origin}/remote-eval?token=${data.token}`;
      setGeneratedLink(link);
      setActionMessage({ text: '¡Magic Link generado con éxito!', type: 'success' });
      
      // Reload remote evaluations list
      loadRemoteEvals();
    } catch (err) {
      setActionMessage({ text: 'Error al generar el Magic Link. Intenta de nuevo.', type: 'error' });
    }
  };

  const handleRevokeLink = async (evalId) => {
    try {
      await invalidateRemoteEvaluation(evalId);
      setActionMessage({ text: 'Enlace revocado correctamente.', type: 'success' });
      loadRemoteEvals();
    } catch (err) {
      setActionMessage({ text: 'Error al revocar el enlace.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-200 font-sans relative overflow-hidden pb-12">
      
      {/* Background Decoratives */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#22c55e_0%,transparent_70%)] mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div className="w-full md:w-auto flex-1">
            <div className="flex justify-between items-center w-full mb-6">
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/30 hover:text-white text-xs tracking-widest uppercase font-bold transition-colors">
                <ArrowLeft size={14} /> Regresar a Panel
              </Link>
              <button 
                onClick={signOut} 
                className="inline-flex items-center gap-2 text-red-400/60 hover:text-red-400 text-xs tracking-widest uppercase font-bold transition-colors bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 px-3 py-1.5 rounded"
              >
                🔒 Cerrar Sesión
              </button>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/30">
              Centro de Exportación.
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-lg leading-relaxed">
              Exportación multiformato para directores (Decreto 170 / PIE) o historiales clínicos avanzados a nivel de milisegundos.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('exports')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-md ${activeTab === 'exports' ? 'bg-[#22c55e] text-black shadow' : 'text-slate-400 hover:text-white'}`}
            >
              📥 Reportes y Descargas
            </button>
            <button 
              onClick={() => setActiveTab('remote')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-md ${activeTab === 'remote' ? 'bg-[#22c55e] text-black shadow' : 'text-slate-400 hover:text-white'}`}
            >
              🔗 Evaluaciones Remotas (PIE)
            </button>
          </div>
        </header>

        {/* Global Action Messages */}
        {actionMessage.text && (
          <div className={`mb-6 p-4 border flex items-center gap-3 rounded-lg animate-fade-in ${
            actionMessage.type === 'success' 
              ? 'bg-green-950/20 border-green-800 text-green-400' 
              : 'bg-red-950/20 border-red-800 text-red-400'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
            <span className="text-sm font-semibold">{actionMessage.text}</span>
          </div>
        )}

        {/* TAB 1: EXPORT SYSTEM */}
        {activeTab === 'exports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Filter Card */}
            <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-md">
              <h2 className="text-lg font-black tracking-tight text-white mb-6 border-b border-white/5 pb-3">1. Filtrado Clínico</h2>
              
              <div className="flex flex-col gap-5">
                {/* Paciente */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Grupo / Paciente</label>
                  <select 
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-white text-sm focus:outline-none focus:border-green-500/50"
                  >
                    <option value="all">Todos los Pacientes (Cohorte)</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.idSujeto ? `(${p.idSujeto})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Test */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Instrumento / Test</label>
                  <select 
                    value={selectedTestType}
                    onChange={(e) => setSelectedTestType(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-white text-sm focus:outline-none focus:border-green-500/50"
                  >
                    <option value="all">Reaction + Memory Mirror</option>
                    <option value="reaction">Reaction Mirror (Go/No-Go)</option>
                    <option value="memory">Memory Mirror (Simón Dice)</option>
                  </select>
                </div>

                {/* Rango Temporal */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Temporalidad</label>
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-white text-sm focus:outline-none focus:border-green-500/50 mb-3"
                  >
                    <option value="30">Últimos 30 días</option>
                    <option value="50">Últimos 50 días (Por Defecto)</option>
                    <option value="365">Último Año</option>
                    <option value="custom">Rango Personalizado</option>
                  </select>

                  {timeRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-3 mt-2 border-t border-white/5 pt-3 animate-fade-in">
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-600 mb-1">Inicio</label>
                        <input 
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-600 mb-1">Fin</label>
                        <input 
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Nivel de Detalle */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Nivel de Detalle</label>
                  <div className="flex flex-col gap-2">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      detailLevel === 'summary' ? 'bg-white/[0.04] border-green-500/30' : 'bg-transparent border-white/5 hover:bg-white/[0.01]'
                    }`}>
                      <input 
                        type="radio" 
                        name="detailLevel" 
                        value="summary" 
                        checked={detailLevel === 'summary'} 
                        onChange={() => setDetailLevel('summary')}
                        className="accent-green-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">Resumen Ejecutivo</div>
                        <div className="text-[10px] text-slate-500">Métricas agregadas y promedios por sesión.</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      detailLevel === 'telemetry' ? 'bg-white/[0.04] border-green-500/30' : 'bg-transparent border-white/5 hover:bg-white/[0.01]'
                    }`}>
                      <input 
                        type="radio" 
                        name="detailLevel" 
                        value="telemetry" 
                        checked={detailLevel === 'telemetry'} 
                        onChange={() => setDetailLevel('telemetry')}
                        className="accent-green-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">Telemetría Completa (milisegundos)</div>
                        <div className="text-[10px] text-slate-500">Registro giro a giro de tiempos de reacción.</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      detailLevel === 'dec170' ? 'bg-white/[0.04] border-blue-500/30' : 'bg-transparent border-white/5 hover:bg-white/[0.01]'
                    }`}>
                      <input 
                        type="radio" 
                        name="detailLevel" 
                        value="dec170" 
                        checked={detailLevel === 'dec170'} 
                        onChange={() => setDetailLevel('dec170')}
                        className="accent-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">Reporte Decreto 170 (Fondo PIE)</div>
                        <div className="text-[10px] text-slate-500">Justificación agregada de fondos para el Director.</div>
                      </div>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Action & Preview Area */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Export Panel Trigger */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-md">
                <h2 className="text-lg font-black tracking-tight text-white mb-6">2. Motores de Descarga</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Excel Download */}
                  <button 
                    onClick={exportExcel}
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-950/20 to-green-950/10 border border-green-800/40 rounded-xl hover:brightness-110 active:brightness-95 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 flex items-center justify-center rounded-lg text-green-400 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet size={24} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase text-green-400 tracking-wider">Planilla de Datos (.xlsx)</h3>
                        <p className="text-xs text-slate-500 mt-1">Minería de datos clínicos y análisis.</p>
                      </div>
                    </div>
                    <Download size={18} className="text-green-500/60" />
                  </button>

                  {/* PDF Download */}
                  <button 
                    onClick={exportPDF}
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-sky-950/20 to-blue-950/10 border border-blue-800/40 rounded-xl hover:brightness-110 active:brightness-95 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 flex items-center justify-center rounded-lg text-blue-400 group-hover:scale-105 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase text-blue-400 tracking-wider">Reporte Clínico PDF (.pdf)</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {detailLevel === 'dec170' ? 'Documento formal para Dirección' : 'Firma de especialista y diagnóstico.'}
                        </p>
                      </div>
                    </div>
                    <Download size={18} className="text-blue-500/60" />
                  </button>
                </div>
              </div>

              {/* Data Preview */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-md flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-black tracking-tight text-white">Vista Previa de Sesiones ({filteredSessions.length})</h2>
                  <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded text-slate-400 uppercase tracking-widest">
                    Aislamiento: grupo_brayan
                  </span>
                </div>

                {filteredSessions.length === 0 ? (
                  <div className="text-center py-20 border border-white/5 bg-black/20 rounded-xl">
                    <Clock className="mx-auto text-slate-700 mb-4" size={48} />
                    <p className="text-sm text-slate-500">No hay sesiones clínicas en el período o paciente seleccionado.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-white/5 max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.03] text-slate-400 uppercase font-bold border-b border-white/5">
                        <tr>
                          <th className="p-3">Paciente</th>
                          <th className="p-3">Intento</th>
                          <th className="p-3">Tipo Test</th>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Etiqueta</th>
                          <th className="p-3 text-right">Bitácora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredSessions.map((s, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01]">
                            <td className="p-3 font-semibold text-white">
                              {s.patientName} 
                              {s.patientIdSujeto && <span className="ml-2 font-mono text-[9px] bg-blue-950/20 text-blue-400 px-1 py-0.5 rounded border border-blue-900/30">{s.patientIdSujeto}</span>}
                            </td>
                            <td className="p-3 text-slate-400">#{s.attemptNumber}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.testType === 'reaction' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}>
                                {s.testType === 'reaction' ? 'Reaction' : 'Memory'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-mono">{new Date(s.date).toLocaleDateString('es-CL')}</td>
                            <td className="p-3 text-slate-400">{s.clinicalLabel}</td>
                            <td className="p-3 text-right">
                              {s.anotacion_clinica ? (
                                <span className="text-green-400 text-xs" title={s.anotacion_clinica}>📝 Con Nota</span>
                              ) : (
                                <span className="text-slate-600 text-xs">Sin Nota</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: REMOTE EVALUATION (MAGIC LINKS) */}
        {activeTab === 'remote' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Generate Link Card */}
            <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-md">
              <h2 className="text-lg font-black tracking-tight text-white mb-6 border-b border-white/5 pb-3">Nuevo Magic Link</h2>
              
              <form onSubmit={handleGenerateMagicLink} className="flex flex-col gap-5">
                {/* Select Paciente */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Paciente Asignado</label>
                  <select 
                    value={selectedRemotePatient}
                    onChange={(e) => setSelectedRemotePatient(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-white text-sm focus:outline-none focus:border-green-500/50"
                  >
                    <option value="">Seleccione Paciente...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.idSujeto ? `(${p.idSujeto})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Select Test Type */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Test Asignado</label>
                  <select 
                    value={selectedRemoteTest}
                    onChange={(e) => setSelectedRemoteTest(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-white text-sm focus:outline-none focus:border-green-500/50"
                  >
                    <option value="reaction">Reaction Mirror (Go/No-Go)</option>
                    <option value="memory">Memory Mirror (Simón Dice)</option>
                  </select>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-500 leading-relaxed">
                  ⚠️ El enlace de evaluación remota expira automáticamente en <strong>24 horas</strong>. El paciente podrá conectar su cubo BLE directamente desde su navegador e inyectar el resultado clínico.
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-[#22c55e] hover:bg-green-500 text-black font-black text-xs uppercase tracking-widest rounded transition-all"
                >
                  Generar Enlace Temporal
                </button>
              </form>

              {/* Display Generated Link */}
              {generatedLink && (
                <div className="mt-6 p-4 bg-green-950/20 border border-green-500/30 rounded-xl animate-fade-in">
                  <h3 className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1.5">
                    <Link2 size={12} /> ¡Enlace Generado!
                  </h3>
                  <textarea 
                    readOnly 
                    value={generatedLink}
                    onClick={(e) => e.target.select()}
                    className="w-full bg-black/60 border border-white/10 rounded p-2 text-xs font-mono text-white/90 h-16 resize-none focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      setActionMessage({ text: 'Enlace copiado al portapapeles.', type: 'success' });
                    }}
                    className="mt-2 text-[10px] text-green-400 font-bold hover:underline"
                  >
                    Copiar Enlace 📋
                  </button>
                </div>
              )}
            </div>

            {/* Links List Area */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-md flex flex-col">
              <h2 className="text-lg font-black tracking-tight text-white mb-6">Administrar Magic Links Activos</h2>
              
              {loadingEvals ? (
                <div className="text-center py-20">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mb-2" />
                  <p className="text-xs text-slate-500">Cargando enlaces...</p>
                </div>
              ) : remoteEvals.length === 0 ? (
                <div className="text-center py-20 border border-white/5 bg-black/20 rounded-xl flex-1 flex flex-col justify-center items-center">
                  <Link2 className="text-slate-700 mb-4" size={48} />
                  <p className="text-sm text-slate-500">No hay evaluaciones remotas vigentes para el grupo.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/5 flex-1 max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.03] text-slate-400 uppercase font-bold border-b border-white/5">
                      <tr>
                        <th className="p-3">Paciente</th>
                        <th className="p-3">Test</th>
                        <th className="p-3">Expiración</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {remoteEvals.map((ev) => {
                        const isExpired = new Date(ev.expira_en) < new Date();
                        const isLinkActive = ev.activo && !isExpired;
                        
                        return (
                          <tr key={ev.id} className="hover:bg-white/[0.01]">
                            <td className="p-3">
                              <div className="font-semibold text-white">
                                {ev.pacientes ? `${ev.pacientes.nombre} ${ev.pacientes.apellido}` : 'Paciente'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">{ev.token}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ev.tipo_test === 'reaction' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                              }`}>
                                {ev.tipo_test === 'reaction' ? 'Reaction' : 'Memory'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 font-mono">
                              {new Date(ev.expira_en).toLocaleString('es-CL', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3">
                              {isLinkActive ? (
                                <span className="text-green-400 font-bold">Vigente</span>
                              ) : isExpired ? (
                                <span className="text-red-500 font-medium">Expirado</span>
                              ) : (
                                <span className="text-slate-500 font-medium">Revocado</span>
                              )}
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                              <button
                                onClick={() => setActiveControlEval(ev)}
                                disabled={!isLinkActive}
                                className="px-2 py-1 bg-green-500 hover:bg-green-600 disabled:bg-slate-800 disabled:text-slate-600 text-black font-black text-[10px] uppercase rounded tracking-wider flex items-center gap-1 transition-all"
                                title="Sala de Control en Vivo"
                              >
                                📺 Controlar
                              </button>
                              <button
                                onClick={() => {
                                  const origin = window.location.origin;
                                  navigator.clipboard.writeText(`${origin}/remote-eval?token=${ev.token}`);
                                  setActionMessage({ text: 'Enlace copiado.', type: 'success' });
                                }}
                                disabled={!isLinkActive}
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 disabled:opacity-40 disabled:pointer-events-none"
                                title="Copiar enlace"
                              >
                                📋
                              </button>
                              <button
                                onClick={() => handleRevokeLink(ev.id)}
                                disabled={!isLinkActive}
                                className="p-1.5 bg-red-950/20 border border-red-800/40 hover:bg-red-950/40 rounded text-red-400 disabled:opacity-40 disabled:pointer-events-none"
                                title="Revocar enlace"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* SALA DE CONTROL REMOTO (OVERLAY GLASSMORPHIC) */}
      {activeControlEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#13161e] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 text-white max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <span className="px-2.5 py-0.5 bg-green-500/10 text-[#22c55e] border border-green-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Monitoreo en Tiempo Real
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mt-1">
                  Sala de Control Remoto
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Paciente: <strong className="text-white">{activeControlEval.pacientes ? `${activeControlEval.pacientes.nombre} ${activeControlEval.pacientes.apellido}` : 'Alumno'}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/5">
                <div className={`w-2.5 h-2.5 rounded-full ${patientOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${patientOnline ? 'text-green-400' : 'text-red-400'}`}>
                  {patientOnline ? `En Línea (${patientDevice})` : 'Desconectado'}
                </span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* COL 1: COMANDOS */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Comandos Clínicos</h3>
                
                <button
                  onClick={() => sendRemoteCommand('START')}
                  disabled={!patientOnline}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-[10px] uppercase tracking-wider rounded transition-all active:scale-[0.98]"
                >
                  ▶️ Iniciar Test
                </button>
                
                <button
                  onClick={() => sendRemoteCommand('RESTART')}
                  disabled={!patientOnline}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-[10px] uppercase tracking-wider rounded transition-all active:scale-[0.98]"
                >
                  🔄 Reiniciar Partida
                </button>

                <button
                  onClick={() => sendRemoteCommand('CANCEL')}
                  disabled={!patientOnline}
                  className="w-full py-3 bg-red-650 hover:bg-red-600 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-[10px] uppercase tracking-wider rounded transition-all active:scale-[0.98]"
                >
                  ⏹️ Cancelar Partida
                </button>

                <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
                  <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Cambiar Test Asignado</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendRemoteCommand('CHANGE_TEST', { testType: 'reaction' })}
                      disabled={!patientOnline}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded"
                    >
                      Reaction
                    </button>
                    <button
                      onClick={() => sendRemoteCommand('CHANGE_TEST', { testType: 'memory' })}
                      disabled={!patientOnline}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded"
                    >
                      Memory
                    </button>
                  </div>
                </div>
              </div>

              {/* COL 2: LIVE TELEMETRY */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between max-h-[460px] min-h-[380px]">
                <div className="flex flex-col min-h-0 flex-1">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Telemetría en Vivo</h3>
                  
                  {!liveTelemetry ? (
                    <div className="text-center py-10 text-slate-500 text-xs font-medium">
                      Esperando inicio de prueba por parte del alumno...
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                      <div className="space-y-2 flex-shrink-0">
                        {liveTelemetry.results ? (
                          // Telemetría Reaction Mirror
                          <>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-xs text-slate-400 font-medium">Ronda:</span>
                              <span className="text-sm font-bold text-white">{liveTelemetry.round} / 40</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-xs text-slate-400 font-medium">Aciertos:</span>
                              <span className="text-sm font-bold text-green-400">
                                {liveTelemetry.results.filter(r => r.status === 'Ok' || r.status === 'Corregido' || !r.fail).length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-xs text-slate-400 font-medium">Fallas:</span>
                              <span className="text-sm font-bold text-red-400">
                                {liveTelemetry.results.filter(r => r.fail || r.status === 'Fallo de Inhibición' || r.status === 'Error').length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-xs text-slate-400 font-medium">Estado Local:</span>
                              <span className="text-xs font-bold uppercase text-blue-400">{liveTelemetry.stage}</span>
                            </div>
                          </>
                        ) : (
                          // Telemetría Memory Mirror
                          <>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-xs text-slate-400 font-medium">Nivel:</span>
                              <span className="text-sm font-bold text-white">{liveTelemetry.level}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-xs text-slate-400 font-medium">Intento:</span>
                              <span className="text-sm font-bold text-white">{liveTelemetry.trial}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-xs text-slate-400 font-medium">Movimientos:</span>
                              <span className="text-sm font-bold text-white">{(liveTelemetry.telemetry || []).length}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-xs text-slate-400 font-medium">Estado Local:</span>
                              <span className="text-xs font-bold uppercase text-purple-400">{liveTelemetry.gameState}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Radiografía en tiempo real */}
                      <div className="border-t border-white/10 pt-3 mt-2 flex-1 flex flex-col min-h-0">
                        <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">Radiografía del Test</h4>
                        <div className="flex-1 overflow-y-auto max-h-[140px] bg-black/40 border border-white/5 rounded-lg p-2 font-mono text-[9px] space-y-1 scrollbar-thin">
                          {liveTelemetry.results ? (
                            liveTelemetry.results.length === 0 ? (
                              <div className="text-center text-slate-600 py-3 italic">Esperando ensayos...</div>
                            ) : (
                              liveTelemetry.results.slice().reverse().map((res, idx) => {
                                const isSuccess = res.status === 'Ok' || res.status === 'Corregido' || !res.fail;
                                return (
                                  <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/5 px-2 py-0.5 rounded">
                                    <span className="text-slate-500">R{res.round || (liveTelemetry.results.length - idx)}:</span>
                                    <span className={`font-bold ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                                      {res.status || (isSuccess ? 'Ok' : 'Error')}
                                    </span>
                                    <span className="text-slate-400">{res.time ? `${res.time} ms` : '—'}</span>
                                  </div>
                                );
                              })
                            )
                          ) : (
                            (!liveTelemetry.telemetry || liveTelemetry.telemetry.length === 0) ? (
                              <div className="text-center text-slate-600 py-3 italic">Esperando giros...</div>
                            ) : (
                              liveTelemetry.telemetry.slice().reverse().map((move, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/5 px-2 py-0.5 rounded">
                                  <span className="text-slate-500">Niv {move.level} (Int {move.trial}):</span>
                                  <span className="text-cyan-400 font-bold">Giro: {move.face}</span>
                                  <span className={move.isCorrect ? 'text-green-400' : 'text-red-400'}>
                                    {move.isCorrect ? '✓' : '✗'}
                                  </span>
                                  <span className="text-slate-400">{move.latencyMs} ms</span>
                                </div>
                              ))
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Botón de Informe cuando termina */}
                {((liveTelemetry && (liveTelemetry.stage === 'finished' || liveTelemetry.gameState === 'finished')) || savedSessionId) && (
                  <Link
                    href={`/patients/${activeControlEval.id_paciente}`}
                    onClick={() => setActiveControlEval(null)}
                    className="w-full text-center py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/10"
                  >
                    📊 Ver Ficha e Informe Clínico
                  </Link>
                )}
                
                <div className="text-[9px] text-slate-500 leading-relaxed border-t border-white/5 pt-2 mt-3 flex-shrink-0">
                  Los datos finales se guardarán de forma permanente una vez que el alumno complete el test.
                </div>
              </div>

              {/* COL 3: DIGITAL TWIN */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[250px]">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 self-start">Gemelo Digital 3D</h3>
                <div className="flex-1 flex items-center justify-center w-full">
                  <CubeStateProvider>
                    <Cube3DViewer 
                      size={180} 
                      isLocked={false} 
                      ignoreSensor={true} 
                      demoMoves={twinMove} 
                      demoKey={twinKey}
                    />
                  </CubeStateProvider>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-white/5 pt-4 mt-2">
              <button
                onClick={() => setActiveControlEval(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.98]"
              >
                Cerrar Sala de Control
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
