
//RubikGamePage.tsx

import { useState } from 'react';
import { UserPlus, Users, Calendar, TrendingUp, AlertCircle, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Patient } from '../types';

interface TherapistPanelProps {
  onNavigate: (page: string) => void;
}

export const TherapistPanel = ({ onNavigate }: TherapistPanelProps) => {
  const { currentUser, registerPatient, getPatientsByTherapist } = useAuth();
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    parentEmails: [''],
    age: '',
    diagnosis: [] as string[],
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [lastGeneratedPatientId, setLastGeneratedPatientId] = useState<string | null>(null);

  const patients = getPatientsByTherapist(currentUser?.id || '');

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const newPatientId = registerPatient({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      parentEmails: formData.parentEmails.filter((e) => e),
      therapistId: currentUser?.id,
      institutionId: currentUser?.institutionId,
      age: formData.age ? parseInt(formData.age) : undefined,
      diagnosis: formData.diagnosis,
    });

    if (!newPatientId) {
      alert('No se pudo registrar el paciente. Intenta nuevamente.');
      return;
    }

    setSuccessMessage('Paciente registrado correctamente');
    setLastGeneratedPatientId(newPatientId);
    setShowAddPatient(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      parentEmails: [''],
      age: '',
      diagnosis: [],
    });

    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDiagnosisChange = (diagnosis: string) => {
    setFormData({
      ...formData,
      diagnosis: formData.diagnosis.includes(diagnosis)
        ? formData.diagnosis.filter((d) => d !== diagnosis)
        : [...formData.diagnosis, diagnosis],
    });
  };

  const addParentEmail = () => {
    setFormData({
      ...formData,
      parentEmails: [...formData.parentEmails, ''],
    });
  };

  const updateParentEmail = (index: number, value: string) => {
    const newEmails = [...formData.parentEmails];
    newEmails[index] = value;
    setFormData({ ...formData, parentEmails: newEmails });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-gradient-to-r from-green-600 to-teal-500 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Panel del Terapeuta</h1>
          <p className="text-green-100">Bienvenido, {currentUser?.name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">{successMessage}</p>
            {lastGeneratedPatientId && (
              <p className="text-green-700 text-sm">ID asignado: {lastGeneratedPatientId}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pacientes Activos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{patients.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Sesiones Totales</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {patients.reduce((sum, p) => sum + p.sessions.length, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Progreso Promedio</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {patients.length > 0
                    ? Math.round(patients.reduce((sum, p) => sum + p.progress, 0) / patients.length)
                    : 0}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Users className="w-6 h-6 text-green-600" />
              <span>Mis Pacientes</span>
            </h2>
            <button
              onClick={() => setShowAddPatient(!showAddPatient)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>Registrar Paciente</span>
            </button>
          </div>

          {showAddPatient && (
            <form onSubmit={handleAddPatient} className="mb-8 p-6 bg-green-50 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Paciente</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre del Niño *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Lucas Martínez"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Edad
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Correo del Paciente *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="paciente@cogntech.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña del Paciente *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Correos de Tutores/Padres
                </label>
                {formData.parentEmails.map((email, index) => (
                  <input
                    key={index}
                    type="email"
                    value={email}
                    onChange={(e) => updateParentEmail(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="padre@email.com"
                  />
                ))}
                <button
                  type="button"
                  onClick={addParentEmail}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  + Agregar otro correo
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Diagnóstico
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.diagnosis.includes('TEA')}
                      onChange={() => handleDiagnosisChange('TEA')}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">TEA</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.diagnosis.includes('TDAH')}
                      onChange={() => handleDiagnosisChange('TDAH')}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">TDAH</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Registrar Paciente
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPatient(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {patients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tienes pacientes registrados aún</p>
                <p className="text-sm text-gray-400">Haz clic en "Registrar Paciente" para comenzar</p>
              </div>
            ) : (
              patients.map((patient: Patient) => (
                <div
                  key={patient.id}
                  className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>Edad: {patient.age} años</p>
                        <p>Diagnóstico: {patient.diagnosis?.join(', ') || 'No especificado'}</p>
                        <p>Tutores: {patient.parentEmails.join(', ')}</p>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Progreso</span>
                          <span className="text-sm font-semibold text-green-600">
                            {patient.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${patient.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 text-right space-y-2">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-blue-600">
                          {patient.sessions.length}
                        </p>
                        <p className="text-xs text-gray-600">Sesiones</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-yellow-600">
                          {patient.achievements.filter((a) => a.unlockedAt).length}
                        </p>
                        <p className="text-xs text-gray-600">Logros</p>
                      </div>
                    </div>
                  </div>

                  {patient.sessions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Última Sesión
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Movimientos</p>
                          <p className="font-semibold text-gray-900">
                            {patient.sessions[0].moves}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Eficiencia</p>
                          <p className="font-semibold text-gray-900">
                            {patient.sessions[0].efficiency}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tiempo</p>
                          <p className="font-semibold text-gray-900">
                            {Math.round((patient.sessions[0].duration || 0) / 60)} min
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sección Cerebro 3D Amelia */}
        {patients.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 rounded-2xl shadow-2xl p-8 border-2 border-purple-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Visualización Cognitiva 3D</h2>
                <p className="text-gray-600">Análisis cerebral con Amelia Brain 2.0</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 rounded-xl shadow-lg border border-purple-200 py-6">
              <div className="text-center space-y-4 px-6">
                {/* Cerebro animado con CSS - MÁS COMPACTO */}
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute inset-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute inset-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-16 h-16 text-purple-600 animate-pulse" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    Visualización Cerebral 3D
                  </h3>
                  <p className="text-sm text-gray-600">
                    Análisis cognitivo de pacientes con Amelia Brain 2.0
                  </p>
                  <div className="mt-2 inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>Sistema de mapeo cognitivo</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-2xl mb-1">🧠</div>
                    <p className="text-xs text-gray-600">Memoria</p>
                    <p className="text-base font-bold text-cyan-600">85%</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-2xl mb-1">⚡</div>
                    <p className="text-xs text-gray-600">Flexibilidad</p>
                    <p className="text-base font-bold text-purple-600">78%</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-2xl mb-1">🎯</div>
                    <p className="text-xs text-gray-600">Resolución</p>
                    <p className="text-base font-bold text-emerald-600">92%</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-2xl mb-1">🔥</div>
                    <p className="text-xs text-gray-600">Persistencia</p>
                    <p className="text-base font-bold text-orange-600">88%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 text-white">
                <p className="text-sm opacity-90">Memoria de Trabajo</p>
                <p className="text-3xl font-bold">85%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
                <p className="text-sm opacity-90">Flexibilidad Cognitiva</p>
                <p className="text-3xl font-bold">78%</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                <p className="text-sm opacity-90">Resolución de Problemas</p>
                <p className="text-3xl font-bold">92%</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-md p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Recomendaciones</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Revisa el progreso de tus pacientes semanalmente para ajustar estrategias</li>
                <li>• Personaliza los retos según el perfil cognitivo de cada niño</li>
                <li>• Mantén comunicación constante con los tutores sobre avances y áreas de mejora</li>
                <li>• Celebra cada logro para mantener la motivación del paciente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
