// ExportMetrics.tsx - Componente para exportar métricas a Excel
import { useState } from 'react';
import { Download, FileSpreadsheet, Loader } from 'lucide-react';
import { exportUserMetricsToJSON } from '../../data/firebase';

interface ExportMetricsProps {
  userId: string;
  userName: string;
}

export const ExportMetrics = ({ userId, userName }: ExportMetricsProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const data = await exportUserMetricsToJSON(userId);
      
      if (data.length === 0) {
        alert('No hay métricas disponibles para exportar');
        setIsExporting(false);
        return;
      }

      // Convertir a CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escapar valores que contengan comas o comillas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Crear archivo y descargar
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `CogniMirror_Metricas_${userName}_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Métricas exportadas exitosamente');
    } catch (error) {
      console.error('Error exportando métricas:', error);
      alert('Error al exportar métricas. Por favor, intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = async () => {
    setIsExporting(true);
    try {
      const data = await exportUserMetricsToJSON(userId);
      
      if (data.length === 0) {
        alert('No hay métricas disponibles para exportar');
        setIsExporting(false);
        return;
      }

      // Crear archivo JSON y descargar
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `CogniMirror_Metricas_${userName}_${timestamp}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Métricas exportadas exitosamente (JSON)');
    } catch (error) {
      console.error('Error exportando métricas:', error);
      alert('Error al exportar métricas. Por favor, intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={exportToCSV}
        disabled={isExporting}
        className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isExporting ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-5 h-5" />
            <span>Exportar a Excel (CSV)</span>
          </>
        )}
      </button>

      <button
        onClick={exportToJSON}
        disabled={isExporting}
        className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isExporting ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>Exportar a JSON</span>
          </>
        )}
      </button>
    </div>
  );
};
