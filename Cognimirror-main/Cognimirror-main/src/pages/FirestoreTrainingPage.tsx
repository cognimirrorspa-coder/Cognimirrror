import { useState, useEffect } from 'react';
import { collection, addDoc, doc, query, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../data/firebase';
import { ArrowLeft, RefreshCw, Plus, Users, Play } from 'lucide-react';
import { TrainingMemoryMirror } from '../components/training/TrainingMemoryMirror';
import { EnhancedSessionDashboard } from '../components/training/EnhancedSessionDashboard';



// Misión 1: Listar todos los usuarios
const UserListComponent = ({ onSelectUser }: { onSelectUser: (user: any) => void }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const loadedUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(loadedUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al inicio
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Usuarios Encontrados: {users.length}</h3>
        <button
          onClick={fetchUsers}
          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-xs font-medium flex items-center"
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100 mb-2">{error}</p>}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {users.length === 0 && !loading && (
          <p className="text-gray-400 text-sm italic">No se encontraron usuarios en la colección 'usuarios'.</p>
        )}

        {users.map((user) => (
          <div key={user.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex justify-between items-center group hover:border-purple-300 transition-colors">
            <div>
              <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-mono mr-2">
                {user.id}
              </span>
              <span className="font-medium text-gray-800">
                {user.nombre || 'Sin nombre'}
              </span>
              {user.edad && (
                <span className="ml-2 text-xs text-gray-500">
                  ({user.edad} años)
                </span>
              )}
            </div>
            <button
              onClick={() => onSelectUser(user)}
              className="px-2 py-1 bg-purple-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
            >
              <Play className="w-3 h-3 mr-1" />
              Jugar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Misión 2: Agregar usuario incremental
const UserAddComponent = ({ onUserAdded }: { onUserAdded: () => void }) => {
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAge.trim()) return;

    setAdding(true);
    setMessage(null);
    try {
      // 1. Obtener todos los usuarios para validar nombre y calcular ID
      const querySnapshot = await getDocs(collection(db, 'usuarios'));

      // Validar nombre duplicado
      const existingUser = querySnapshot.docs.find(doc =>
        doc.data().nombre?.toLowerCase() === newName.trim().toLowerCase()
      );

      if (existingUser) {
        setMessage({ type: 'error', text: 'el nombre de usuario esta ocupado, selecciona otro' });
        setAdding(false);
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

      // 3. Crear el nuevo documento con el ID calculado y la nueva estructura
      await setDoc(doc(db, 'usuarios', nextId), {
        nombre: newName,
        edad: Number(newAge),
        fecha_registro: serverTimestamp()
      });

      setMessage({ type: 'success', text: `¡Usuario creado con ID ${nextId}!` });
      setNewName('');
      setNewAge('');
      onUserAdded(); // Recargar la lista
    } catch (err: any) {
      console.error("Error adding user:", err);
      setMessage({ type: 'error', text: 'Error al crear: ' + err.message });
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleAddUser} className="mt-2">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del nuevo usuario"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          disabled={adding}
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={newAge}
            onChange={(e) => setNewAge(e.target.value)}
            placeholder="Edad"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !newName.trim() || !newAge.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center text-sm font-medium whitespace-nowrap"
          >
            {adding ? '...' : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Agregar Usuario
              </>
            )}
          </button>
        </div>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
};

import { TrainingDigitSpanMirror } from '../components/training/TrainingDigitSpanMirror';
import { GameStatisticsDashboard } from '../components/dashboard/GameStatisticsDashboard';

// ... imports ...

export const FirestoreTrainingPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  // Estado para forzar recarga de la lista de usuarios
  const [refreshUsersTrigger, setRefreshUsersTrigger] = useState(0);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
  const [selectedGame, setSelectedGame] = useState<'memory' | 'digit'>('memory');

  const handleSelectUser = (user: any) => {
    setSelectedUser({
      id: user.id,
      name: user.nombre || 'Sin nombre'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al Inicio
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Panel de Control Firestore</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Misión 1: Listar Usuarios */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-500 flex flex-col">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-purple-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Misión 1: Listar Usuarios</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex-1">
              <p className="text-xs text-gray-500 mb-3">
                Colección: <code className="font-mono text-purple-600">usuarios</code>
                <br />
                <span className="text-purple-600 font-medium">Selecciona un usuario para jugar</span>
              </p>
              <UserListComponent key={refreshUsersTrigger} onSelectUser={handleSelectUser} />
            </div>
          </div>

          {/* Misión 2: Agregar Usuario Incremental */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500 flex flex-col">
            <div className="flex items-center mb-4">
              <Plus className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Misión 2: Crear Usuario</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex-1">
              <p className="text-xs text-gray-500 mb-3">
                Se asignará ID incremental (ej: 002, 003...)
              </p>
              <UserAddComponent onUserAdded={() => setRefreshUsersTrigger(prev => prev + 1)} />
            </div>
          </div>
        </div>

        {/* Área de Juego */}
        <div className="mb-8">
          {selectedUser ? (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Entrenando con: <span className="text-purple-600">{selectedUser.name}</span>
                </h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-sm text-gray-500 hover:text-red-500 underline"
                >
                  Cerrar juego
                </button>
              </div>
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setSelectedGame('memory')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${selectedGame === 'memory'
                    ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  🧠 Memory Mirror (Visual)
                </button>
                <button
                  onClick={() => setSelectedGame('digit')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${selectedGame === 'digit'
                    ? 'bg-green-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  🔢 Digit Mirror (Auditivo)
                </button>
              </div>

              {selectedGame === 'memory' ? (
                <TrainingMemoryMirror
                  userId={selectedUser.id}
                  userName={selectedUser.name}
                />
              ) : (
                <TrainingDigitSpanMirror
                  userId={selectedUser.id}
                  userName={selectedUser.name}
                />
              )}

              <div className="mt-8">
                <EnhancedSessionDashboard
                  userId={selectedUser.id}
                  userName={selectedUser.name}
                  gameId={selectedGame === 'memory' ? 'memory_mirror' : 'digit_span_v1'}
                />
              </div>

              <div className="mt-8">
                <GameStatisticsDashboard
                  userId={selectedUser.id}
                  userName={selectedUser.name}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4 opacity-20">🎮</div>
              <h3 className="text-xl font-bold text-gray-400 mb-2">Zona de Juego Inactiva</h3>
              <p className="text-gray-500">
                Selecciona un usuario de la lista (Misión 1) para cargar el juego Memory Mirror.
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Panel de entrenamiento para gestión de usuarios en Firestore</p>
        </div>
      </div>
    </div >
  );
};
