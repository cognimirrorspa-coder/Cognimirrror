import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';

interface PersistenceData {
    name: string;
    persistencia?: number;
    tasa_error?: number;
    // Comparison fields
    persistence_memory?: number;
    persistence_digit?: number;
    error_memory?: number;
    error_digit?: number;
}

interface PersistenceChartProps {
    data: PersistenceData[];
}

export const PersistenceChart = ({ data }: PersistenceChartProps) => {
    const isComparison = data.length > 0 && 'persistence_memory' in data[0];

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Persistencia & Tasa de Error</h3>
                        <p className="text-xs text-gray-500">Relación entre el esfuerzo sostenido y la precisión</p>
                    </div>
                </div>
                {isComparison && (
                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div>Persist. Memory</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Persist. Digit</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Error Memory</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Error Digit</div>
                    </div>
                )}
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            stroke="#9ca3af"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 'auto']}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        {!isComparison && <Legend verticalAlign="top" height={36} iconType="circle" />}

                        {!isComparison ? (
                            <>
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="persistencia"
                                    name="Persistencia"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="tasa_error"
                                    name="Tasa de Error"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            </>
                        ) : (
                            <>
                                {/* Persistence Lines (Left Axis) */}
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="persistence_memory"
                                    stroke="#a855f7" // Purple
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    name="Persist. Memory"
                                    connectNulls
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="persistence_digit"
                                    stroke="#3b82f6" // Blue
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    name="Persist. Digit"
                                    connectNulls
                                />
                                {/* Error Rate Lines (Right Axis) */}
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="error_memory"
                                    stroke="#ef4444" // Red
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    name="Error Memory"
                                    connectNulls
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="error_digit"
                                    stroke="#22c55e" // Green
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    name="Error Digit"
                                    connectNulls
                                />
                            </>
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
