//InstitutionPanel.tsx

import { useState } from 'react';
import { Users, UserPlus, BarChart3, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface InstitutionPanelProps {
  onNavigate: (page: string) => void;
}

export const InstitutionPanel = ({ onNavigate }: InstitutionPanelProps) => {
  const { currentUser, getTherapistsByInstitution, getAllPatients, allUsers, addTherapistToInstitution } = useAuth();
  const [showAddTherapist, setShowAddTherapist] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const therapists = getTherapistsByInstitution(currentUser?.id || '');
  const patients = getAllPatients().filter(
    (p) => p.institutionId === currentUser?.id
  );

  const availableTherapists = allUsers.filter(
    (u) => u.type === 'terapeuta' && !u.institutionId
  );

  const handleAddTherapist = () => {
    if (selectedTherapist) {
      addTherapistToInstitution(selectedTherapist, currentUser?.id || '');
      setSuccessMessage('Terapeuta agregado correctamente a la institución');
      setShowAddTherapist(false);
      setSelectedTherapist('');

      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const avgProgress = patients.length > 0
    ? Math.round(patients.reduce((sum, p) => sum + p.progress, 0) / patients.length)
    : 0;

  const totalSessions = patients.reduce(
    (sum, p) => sum + p.sessions.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Panel Institucional</h1>
          <p className="text-blue-100">Bienvenido, {currentUser?.name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Terapeutas</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{therapists.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pacientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{patients.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Progreso Promedio</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{avgProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Users className="w-6 h-6 text-blue-600" />
                <span>Terapeutas Registrados</span>
              </h2>
              <button
                onClick={() => setShowAddTherapist(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            {showAddTherapist && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Seleccionar Terapeuta
                </label>
                <select
                  value={selectedTherapist}
                  onChange={(e) => setSelectedTherapist(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un terapeuta...</option>
                  {availableTherapists.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} - {t.email}
                    </option>
                  ))}
                </select>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddTherapist}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setShowAddTherapist(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {therapists.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay terapeutas registrados
                </p>
              ) : (
                therapists.map((therapist) => (
                  <div
                    key={therapist.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-900">{therapist.name}</h3>
                    <p className="text-sm text-gray-600">{therapist.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pacientes asignados: {
                        patients.filter((p) => p.therapistId === therapist.id).length
                      }
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 mb-6">
              <Award className="w-6 h-6 text-green-600" />
              <span>Pacientes Asociados</span>
            </h2>

            <div className="space-y-3">
              {patients.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay pacientes registrados
                </p>
              ) : (
                patients.map((patient) => {
                  const therapist = therapists.find((t) => t.id === patient.therapistId);
                  return (
                    <div
                      key={patient.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                          <p className="text-sm text-gray-600">
                            Terapeuta: {therapist?.name || 'No asignado'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Edad: {patient.age} años | Diagnóstico: {patient.diagnosis?.join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{patient.progress}%</p>
                          <p className="text-xs text-gray-500">Progreso</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 mb-6">
            <BarChart3 className="w-6 h-6 text-yellow-600" />
            <span>Resumen Institucional</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{totalSessions}</p>
              <p className="text-sm text-gray-600 mt-1">Sesiones Totales</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {patients.filter((p) => p.progress > 50).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Progreso Alto</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">
                {patients.reduce((sum, p) => sum + p.achievements.length, 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Logros Totales</p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">
                {Math.round(totalSessions / (patients.length || 1))}
              </p>
              <p className="text-sm text-gray-600 mt-1">Sesiones/Paciente</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Recomendaciones</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  El progreso promedio es del {avgProgress}%. Considera implementar más sesiones
                  grupales.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  {therapists.length} terapeutas gestionan {patients.length} pacientes.
                  Ratio actual: {(patients.length / (therapists.length || 1)).toFixed(1)} pacientes
                  por terapeuta.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
