import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../data/firebase';
import { Clock, Trophy, AlertCircle, RotateCcw, Activity, Calendar, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';

interface SessionData {
    id: string;
    fecha: Timestamp;
    duracion_segundos: number;
    nivel_maximo: number;
    aciertos: number;
    errores: number;
    tasa_error: number;
    persistencia_intentos: number;
    completada: boolean;
}

interface UserSessionDashboardProps {
    userId: string;
    userName: string;
}

export const UserSessionDashboard = ({ userId, userName }: UserSessionDashboardProps) => {
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const sessionsRef = collection(db, 'usuarios', userId, 'sesiones');
        const q = query(sessionsRef, orderBy('fecha', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedSessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SessionData[];
            setSessions(loadedSessions);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    // Cálculos de estadísticas
    const totalSessions = sessions.length;
    const maxLevel = sessions.reduce((max, s) => Math.max(max, s.nivel_maximo || 0), 0);
    const totalErrors = sessions.reduce((sum, s) => sum + (s.errores || 0), 0);
    const totalRetries = sessions.reduce((sum, s) => sum + (s.persistencia_intentos || 0), 0); // Asumiendo persistencia_intentos como reintentos o rondas totales
    const totalTimeSeconds = sessions.reduce((sum, s) => sum + (s.duracion_segundos || 0), 0);

    const completedSessions = sessions.filter(s => s.completada).length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Formato de tiempo
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp) return '-';
        return timestamp.toDate().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando estadísticas...</div>;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Dashboard Principal */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Memory Mirror</h2>
                            <p className="text-xs text-gray-500">Última vez: {sessions.length > 0 ? formatDate(sessions[0].fecha) : 'Nunca'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-purple-600">{totalSessions}</span>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Sesiones</p>
                    </div>
                </div>

                {/* Tarjetas de Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2 text-blue-700">
                            <Trophy className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase">Nivel Máximo</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-800">{maxLevel}</p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase">Errores Totales</span>
                        </div>
                        <p className="text-2xl font-bold text-red-800">{totalErrors}</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2 text-purple-700">
                            <RotateCcw className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase">Intentos Totales</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-800">{totalRetries}</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2 text-green-700">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase">Tiempo Total</span>
                        </div>
                        <p className="text-2xl font-bold text-green-800">{formatTime(totalTimeSeconds)}</p>
                    </div>
                </div>

                {/* Métricas Secundarias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl mb-6">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Promedio Duración/Sesión</p>
                        <p className="font-semibold text-gray-700">
                            {totalSessions > 0 ? formatTime(Math.round(totalTimeSeconds / totalSessions)) : '0m 0s'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Tasa de Completación</p>
                        <p className="font-semibold text-gray-700">{completionRate.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Toggle Historial */}
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                    {showHistory ? 'Ocultar historial de sesiones' : 'Ver historial de sesiones'}
                    {showHistory ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </button>

                {/* Lista de Historial (Estilo Tabla Simple) */}
                {showHistory && (
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {sessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                <div className="flex items-center space-x-4">
                                    <span className="text-gray-500 w-24 text-xs">{formatDate(session.fecha).split(',')[0]}</span>
                                    <span className="font-medium text-gray-700">Nivel {session.nivel_maximo}</span>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <span className={`text-xs ${session.errores === 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {session.errores} errores
                                    </span>
                                    <span className="text-gray-400 text-xs w-16 text-right">{formatTime(session.duracion_segundos)}</span>
                                    {session.completada && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cronograma de Sesiones (Estilo Timeline Detallado) */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                    <Calendar className="w-6 h-6 text-cyan-600 mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">Cronograma de Sesiones</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">Historial detallado de cada sesión jugada, mostrando nivel alcanzado, juego y precisión.</p>

                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div key={session.id} className="relative pl-6 border-l-2 border-gray-200 hover:border-cyan-400 transition-colors pb-4 last:pb-0">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-cyan-500"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                                <div className="mb-2 md:mb-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm text-gray-500">{formatDate(session.fecha)}</span>
                                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Juego</span>
                                    </div>
                                    <h4 className="font-bold text-gray-800">Nivel {session.nivel_maximo}</h4>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Precisión</p>
                                        <p className="font-bold text-gray-700">
                                            {session.aciertos + session.errores > 0
                                                ? Math.round((session.aciertos / (session.aciertos + session.errores)) * 100)
                                                : 0}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Duración</p>
                                        <p className="font-bold text-gray-700">{formatTime(session.duracion_segundos)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <p className="text-center text-gray-400 italic py-4">No hay sesiones registradas aún.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
