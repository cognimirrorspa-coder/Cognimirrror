//RegisterPage.tsx


import { useState } from 'react';
import { UserPlus, Building2, Stethoscope, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserType } from '../types';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

export const RegisterPage = ({ onNavigate }: RegisterPageProps) => {
  const [userType, setUserType] = useState<UserType>('terapeuta');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const newUserId = register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      type: userType,
    });

    if (newUserId) {
      setShowSuccess(true);
      setGeneratedId(newUserId);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        onNavigate('login');
      }, 2000);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Crear Usuario</h2>
            <p className="text-gray-600">Únete a la plataforma CogniMirror</p>
          </div>

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Usuario creado correctamente</p>
                {generatedId && (
                  <p className="text-sm text-green-700">ID asignado: {generatedId}</p>
                )}
                <p className="text-sm text-green-700">Redirigiendo al inicio de sesión...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Usuario
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserType('institucional')}
                className={`p-6 rounded-xl border-2 transition-all ${userType === 'institucional'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }`}
              >
                <Building2
                  className={`w-10 h-10 mx-auto mb-3 ${userType === 'institucional' ? 'text-blue-600' : 'text-gray-400'
                    }`}
                />
                <h3 className="font-semibold text-gray-900">Institucional</h3>
                <p className="text-sm text-gray-600 mt-1">Centro educativo o institución</p>
              </button>

              <button
                type="button"
                onClick={() => setUserType('terapeuta')}
                className={`p-6 rounded-xl border-2 transition-all ${userType === 'terapeuta'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }`}
              >
                <Stethoscope
                  className={`w-10 h-10 mx-auto mb-3 ${userType === 'terapeuta' ? 'text-blue-600' : 'text-gray-400'
                    }`}
                />
                <h3 className="font-semibold text-gray-900">Terapeuta</h3>
                <p className="text-sm text-gray-600 mt-1">Profesional de la salud</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {userType === 'institucional' ? 'Nombre de la Institución' : 'Nombre Completo'}
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={
                  userType === 'institucional'
                    ? 'Centro de Desarrollo Integral'
                    : 'Juan Pérez García'
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              Crear Usuario
            </button>
          </form>

          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Iniciar Sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
