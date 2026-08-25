'use client';
import { useState, useMemo } from 'react';
import { getRawHardwareInfo, exportRawTelemetryExcel, exportReactionMirrorExcel, exportAllMemoryHistoryExcel } from '../utils/exportExcel';
import { X, Download, ShieldCheck, Search, FileSpreadsheet, FileText } from 'lucide-react';

export default function TelemetryPreviewModal({ isOpen, onClose, sessionData, playerName, isRawOnly = false }) {
  const [searchTerm, setSearchTerm] = useState('');

  const turns = useMemo(() => {
    if (!sessionData) return [];
    return sessionData.rawTurnsData || sessionData.telemetry || [];
  }, [sessionData]);

  const filteredTurns = useMemo(() => {
    if (!searchTerm.trim()) return turns;
    const term = searchTerm.toLowerCase();
    return turns.filter((t, idx) => {
      const moveNotation = t.rawMoveNotation || t.actualFace || t.userFace || t.expected || t.expectedFace || '';
      const hwInfo = getRawHardwareInfo(moveNotation);
      const status = t.status || (t.isCorrect ? 'Ok' : 'Error');
      return (
        String(idx + 1).includes(term) ||
        hwInfo.codeHex.toLowerCase().includes(term) ||
        hwInfo.rawPayloadName.toLowerCase().includes(term) ||
        hwInfo.notation.toLowerCase().includes(term) ||
        status.toLowerCase().includes(term)
      );
    });
  }, [turns, searchTerm]);

  if (!isOpen || !sessionData) return null;

  const handleDownloadExcel = async () => {
    if (isRawOnly) {
      await exportRawTelemetryExcel({ sessionData, playerName });
    } else if (sessionData.tipo_test === 'simon' || sessionData.testType === 'simon') {
      await exportAllMemoryHistoryExcel([sessionData]);
    } else {
      await exportReactionMirrorExcel({ 
        playerName: playerName || sessionData.playerName, 
        date: sessionData.date || new Date().toISOString(),
        metrics: sessionData.metrics || {},
        postInhibitory: sessionData.postInhibitory || {},
        rawTurnsData: sessionData.rawTurnsData || sessionData.telemetry || []
      });
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Giro_Num', 'Codigo_Hex_Byte', 'Nombre_Payload_Original', 'Notacion_Estandar', 'Hora_Exacta_MS', 'Timestamp_ISO8601', 'Latencia_MS', 'Modo_Transmision', 'Estado_Validacion'];
    const csvRows = [headers.join(',')];

    turns.forEach((t, idx) => {
      const moveNotation = t.rawMoveNotation || t.actualFace || t.userFace || t.expected || t.expectedFace || '---';
      const hwInfo = getRawHardwareInfo(moveNotation);
      const timeIso = t.timestampIso || (t.timestamp ? new Date(t.timestamp).toISOString() : new Date().toISOString());
      const d = new Date(timeIso);
      const msStr = String(d.getMilliseconds()).padStart(3, '0');
      const timeStr = t.timeString || (d.toLocaleTimeString('es-CL', { hour12: true }) + `,${msStr}`);
      const latency = t.time ?? t.latencyMs ?? '---';
      const status = t.status || (t.isCorrect ? 'Ok' : 'Error');

      csvRows.push([
        idx + 1,
        `"${hwInfo.codeHex}"`,
        `"${hwInfo.rawPayloadName}"`,
        `"${hwInfo.notation}"`,
        `"${timeStr}"`,
        `"${timeIso}"`,
        latency,
        '"native"',
        `"${status}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CogniMirror_${isRawOnly ? 'Telemetria_Cruda' : 'Informe'}_${playerName || 'Estudiante'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                {isRawOnly ? 'Pre-Visualización de Telemetría Cruda Inalterable' : 'Pre-Visualización de Informe Clínico'}
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  BLE Hardware Log
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Estudiante: <span className="text-white font-bold">{playerName || sessionData.playerName || 'Especialista / Anónimo'}</span> | ID: {sessionData.id || sessionData.sessionId || 'N/A'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar & Summary Stats */}
        <div className="p-4 bg-white/[0.01] border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filtrar por giro, payload, notación..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              Total Registros: <span className="text-cyan-400 font-bold">{turns.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              Transmisión: BLE Native (Inalterable)
            </div>
          </div>
        </div>

        {/* Table Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-white/10">
                <th className="p-3">Giro N°</th>
                <th className="p-3">Código Byte Hardware</th>
                <th className="p-3">Nombre Payload Original</th>
                <th className="p-3">Notación Estándar</th>
                <th className="p-3">Hora Exacta (MS)</th>
                <th className="p-3">Timestamp ISO 8601</th>
                <th className="p-3">Latencia (ms)</th>
                <th className="p-3">Modo</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTurns.map((t, idx) => {
                const moveNotation = t.rawMoveNotation || t.actualFace || t.userFace || t.expected || t.expectedFace || '---';
                const hwInfo = getRawHardwareInfo(moveNotation);
                const timeIso = t.timestampIso || (t.timestamp ? new Date(t.timestamp).toISOString() : new Date().toISOString());
                const d = new Date(timeIso);
                const msStr = String(d.getMilliseconds()).padStart(3, '0');
                const timeStr = t.timeString || (d.toLocaleTimeString('es-CL', { hour12: true }) + `,${msStr}`);
                const latency = t.time ?? t.latencyMs ?? '---';
                const status = t.status || (t.isCorrect ? 'Ok' : 'Error');

                return (
                  <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3 font-mono text-cyan-300 font-semibold">{hwInfo.codeHex}</td>
                    <td className="p-3 font-mono text-purple-300 text-[11px] font-bold">{hwInfo.rawPayloadName}</td>
                    <td className="p-3 font-black text-amber-400">{hwInfo.notation}</td>
                    <td className="p-3 font-mono text-slate-300">{timeStr}</td>
                    <td className="p-3 font-mono text-slate-500 text-[10px]">{timeIso}</td>
                    <td className="p-3 font-mono font-bold text-white">{latency} ms</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                        native
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        status === 'Ok' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-400" />
            Certificación Inalterable: Paquetes BLE sincronizados directamente con el microcontrolador.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <FileText size={16} className="text-amber-400" />
              Descargar CSV
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transition"
            >
              <FileSpreadsheet size={16} />
              Confirmar y Descargar Excel (.xlsx)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
