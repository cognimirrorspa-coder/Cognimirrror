// VoiceOnboardingWelcome.tsx - Componente de Registro de Usuario (Tradicional, sin modo vocal)

import { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../data/firebase';

interface VoiceOnboardingWelcomeProps {
  onNavigate: (page: string) => void;
}

export const VoiceOnboardingWelcome = ({ onNavigate }: VoiceOnboardingWelcomeProps) => {
  const { setUserWithFirestoreId } = useAuth();

  // Datos del formulario
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const ageNumber = typeof userAge === 'string' ? parseInt(userAge || '0', 10) : userAge;

    if (!userName.trim() || !ageNumber || ageNumber < 1 || ageNumber > 120) {
      setError('Ingresa un nombre y una edad válida (1 a 120 años).');
      setLoading(false);
      return;
    }

    try {
      // 1. Obtener todos los usuarios para validar nombre y calcular ID
      const querySnapshot = await getDocs(collection(db, 'usuarios'));

      // Validar nombre duplicado
      const existingUser = querySnapshot.docs.find(doc =>
        doc.data().nombre?.toLowerCase() === userName.trim().toLowerCase()
      );

      if (existingUser) {
        setError('El nombre de usuario está ocupado, selecciona otro.');
        setLoading(false);
        return;
      }

      const ids = querySnapshot.docs.map(doc => doc.id);

      // 2. Calcular el siguiente ID (asumiendo formato numérico '001', '002'...)
      let maxId = 0;
      ids.forEach(id => {
        const num = parseInt(id, 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      });

      const nextId = String(maxId + 1).padStart(3, '0');

      // 3. Crear el nuevo documento con el ID calculado en Firestore
      await setDoc(doc(db, 'usuarios', nextId), {
        nombre: userName.trim(),
        edad: ageNumber,
        fecha_registro: serverTimestamp()
      });

      console.log(`✅ Usuario creado en Firestore: ${userName.trim()} (ID: ${nextId})`);

      // 4. Establecer como paciente seleccionado con el ID correcto de Firestore
      setUserWithFirestoreId(nextId, userName.trim(), ageNumber);

      // 5. Navegar al perfil del usuario
      onNavigate('patient-profile');
    } catch (err) {
      console.error('Error al crear usuario:', err);
      setError('Error al crear el usuario. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Bienvenido a CogniMirror</h2>
            <p className="text-gray-600">Completa tus datos para crear tu perfil cognitivo</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 text-center">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ej: Sofía Ramirez"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Edad</label>
              <input
                type="number"
                min={1}
                max={120}
                value={userAge}
                onChange={(e) => setUserAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ingresa tu edad"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando Perfil...' : 'Registrar y Continuar'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Volver al inicio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
