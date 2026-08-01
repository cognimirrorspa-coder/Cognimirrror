import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../data/firebase';
import { Gamepad2, Trophy, Clock, ChevronDown, ChevronUp, RotateCcw, AlertCircle, Target, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { demoSessions } from '../../data/demoData';

interface SessionData {
    id: string;
    fecha: Timestamp;
    gameId?: string;
    gameName?: string;
    duracion_segundos: number;
    nivel_maximo: number;
    aciertos: number;
    errores: number;
    persistencia_intentos: number;
    completada: boolean;
    tiempo_promedio_respuesta_ms?: number;
}

interface GameStats {
    gameId: string;
    gameName: string;
    totalSessions: number;
    lastPlayed: Date | null;
    totalRounds: number;
    maxLevel: number;
    totalErrors: number;
    totalRetries: number;
    totalTimeSeconds: number;
    completionRate: number;
    avgLevelsPerSession: number;
    avgResponseTimeMs: number;
}

interface GameStatisticsDashboardProps {
    userId: string;
    userName: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

export const GameStatisticsDashboard = ({ userId, userName }: GameStatisticsDashboardProps) => {
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGame, setExpandedGame] = useState<string | null>(null);
    const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Use demo data for Lucas (pat-1)
        if (userId === 'pat-1') {
            setSessions(demoSessions as SessionData[]);
            setLoading(false);
            return;
        }

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

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando estadísticas globales...</div>;

    // --- Data Processing ---
    const gameStatsMap = new Map<string, GameStats>();

    sessions.forEach(session => {
        // Normalizar gameId
        const gameId = session.gameId || 'memory_mirror_v1'; // Default legacy
        const gameName = session.gameName || (gameId === 'digit_span_v1' ? 'Digit Span' : 'Memory Mirror');

        if (!gameStatsMap.has(gameId)) {
            gameStatsMap.set(gameId, {
                gameId,
                gameName,
                totalSessions: 0,
                lastPlayed: null,
                totalRounds: 0,
                maxLevel: 0,
                totalErrors: 0,
                totalRetries: 0,
                totalTimeSeconds: 0,
                completionRate: 0,
                avgLevelsPerSession: 0,
                avgResponseTimeMs: 0
            });
        }

        const stats = gameStatsMap.get(gameId)!;
        stats.totalSessions++;

        const sessionDate = session.fecha ? session.fecha.toDate() : null;
        if (sessionDate && (!stats.lastPlayed || sessionDate > stats.lastPlayed)) {
            stats.lastPlayed = sessionDate;
        }

        stats.totalRounds += (session.aciertos || 0) + (session.errores || 0);
        stats.maxLevel = Math.max(stats.maxLevel, session.nivel_maximo || 0);
        stats.totalErrors += session.errores || 0;
        stats.totalRetries += session.persistencia_intentos || 0;
        stats.totalTimeSeconds += session.duracion_segundos || 0;
        if (session.completada) stats.completionRate++;
        stats.avgLevelsPerSession += session.nivel_maximo || 0;
        stats.avgResponseTimeMs += session.tiempo_promedio_respuesta_ms || 0;
    });

    // Final calculations
    const gameStatsList = Array.from(gameStatsMap.values()).map(stats => {
        stats.completionRate = stats.totalSessions > 0 ? (stats.completionRate / stats.totalSessions) * 100 : 0;
        stats.avgLevelsPerSession = stats.totalSessions > 0 ? (stats.avgLevelsPerSession / stats.totalSessions) : 0;
        stats.avgResponseTimeMs = stats.totalSessions > 0 ? (stats.avgResponseTimeMs / stats.totalSessions) : 0;
        return stats;
    });

    // Pie Chart Data
    const pieChartData = gameStatsList.map(game => ({
        name: game.gameName,
        value: game.totalSessions
    }));

    // Global Stats
    const totalGamesDifferent = gameStatsList.length;
    const favoriteGame = gameStatsList.sort((a, b) => b.totalSessions - a.totalSessions)[0]?.gameId || 'N/A';
    const totalTimeAllGames = gameStatsList.reduce((sum, s) => sum + s.totalTimeSeconds, 0);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const toggleExpand = (gameId: string) => {
        setExpandedGame(expandedGame === gameId ? null : gameId);
    };

    const toggleHistory = (gameId: string) => {
        setShowHistoryFor(showHistoryFor === gameId ? null : gameId);
    };

    const getGameSessions = (gameId: string) => {
        return sessions.filter(s => {
            const sGameId = s.gameId || 'memory_mirror_v1';
            return sGameId === gameId;
        });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
                <Gamepad2 className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Estadísticas por Juego</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Global Summary Card */}
                <div className="md:col-span-2 bg-purple-50 rounded-xl p-6 flex flex-col justify-between shadow-sm border border-purple-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-purple-800">Resumen Global</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Juegos Diferentes</p>
                            <p className="text-3xl font-bold text-purple-700">{totalGamesDifferent}</p>
                        </div>
                        <div className="border-l border-purple-200">
                            <p className="text-gray-500 text-sm font-medium mb-1">Juego Favorito</p>
                            <p className="text-xl font-bold text-purple-600 truncate px-2">{favoriteGame.replace('_v1', '').replace('_', ' ')}</p>
                        </div>
                        <div className="border-l border-purple-200">
                            <p className="text-gray-500 text-sm font-medium mb-1">Tiempo Total</p>
                            <p className="text-3xl font-bold text-pink-600">{formatTime(totalTimeAllGames)}</p>
                        </div>
                    </div>
                </div>

                {/* Pie Chart Card */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <h3 className="text-sm font-bold text-gray-600 mb-2">Distribución de Sesiones</h3>
                    <div className="w-full h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Game Cards List */}
            <div className="space-y-4">
                {gameStatsList.map(game => (
                    <div key={game.gameId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                        {/* Card Header */}
                        <div
                            className="p-5 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50"
                            onClick={() => toggleExpand(game.gameId)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${game.gameId.includes('digit') ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                                    <Gamepad2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{game.gameName}</h3>
                                    <p className="text-xs text-gray-500">
                                        Última vez: {game.lastPlayed?.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-2xl font-bold text-gray-800">{game.totalSessions}</p>
                                    <p className="text-xs text-gray-500">sesiones</p>
                                </div>
                                {expandedGame === game.gameId ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedGame === game.gameId && (
                            <div className="p-5 border-t border-gray-100 bg-gray-50/50 animate-fadeIn">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Target className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-medium text-gray-600">Rondas</span>
                                        </div>
                                        <p className="text-xl font-bold text-blue-700">{game.totalRounds}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Trophy className="w-4 h-4 text-green-500" />
                                            <span className="text-xs font-medium text-gray-600">Máx Nivel</span>
                                        </div>
                                        <p className="text-xl font-bold text-green-700">{game.maxLevel}</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                            <span className="text-xs font-medium text-gray-600">Errores</span>
                                        </div>
                                        <p className="text-xl font-bold text-red-700">{game.totalErrors}</p>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <RotateCcw className="w-4 h-4 text-purple-500" />
                                            <span className="text-xs font-medium text-gray-600">Reintentos</span>
                                        </div>
                                        <p className="text-xl font-bold text-purple-700">{game.totalRetries}</p>
                                    </div>
                                    <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="w-4 h-4 text-pink-500" />
                                            <span className="text-xs font-medium text-gray-600">Tiempo</span>
                                        </div>
                                        <p className="text-xl font-bold text-pink-700">{formatTime(game.totalTimeSeconds)}</p>
                                    </div>
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Zap className="w-4 h-4 text-yellow-600" />
                                            <span className="text-xs font-medium text-gray-600">Velocidad</span>
                                        </div>
                                        <p className="text-xl font-bold text-yellow-700">{(game.avgResponseTimeMs / 1000).toFixed(2)}s</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">Promedio Rondas/Sesión</p>
                                        <p className="text-lg font-semibold text-gray-800">{game.avgLevelsPerSession.toFixed(1)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">Tasa de Completación</p>
                                        <p className="text-lg font-semibold text-gray-800">{game.completionRate.toFixed(1)}%</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <button
                                        onClick={() => toggleHistory(game.gameId)}
                                        className="text-sm text-purple-600 font-medium hover:text-purple-800 flex items-center justify-center gap-1 mx-auto transition-colors w-full py-2 hover:bg-purple-50 rounded-lg"
                                    >
                                        Ver historial de sesiones ({game.totalSessions})
                                        {showHistoryFor === game.gameId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {showHistoryFor === game.gameId && (
                                        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar border-t border-gray-100 pt-4">
                                            {getGameSessions(game.gameId).map((session) => (
                                                <div key={session.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                                    <div className="flex items-center space-x-4">
                                                        <span className="text-gray-500 w-24 text-xs">
                                                            {session.fecha ? session.fecha.toDate().toLocaleDateString() : '-'}
                                                        </span>
                                                        <span className="font-bold text-gray-700">
                                                            {(session.aciertos || 0) + (session.errores || 0)} rondas
                                                        </span>
                                                        <span className="text-gray-600">
                                                            Nivel {session.nivel_maximo}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-6">
                                                        <span className={`text-xs font-medium ${session.errores === 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {session.errores} errores
                                                        </span>
                                                        <span className="text-gray-400 text-xs w-16 text-right">
                                                            {formatDuration(session.duracion_segundos)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
