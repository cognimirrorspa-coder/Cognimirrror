import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface EvolutionData {
    date: string;
    precision?: number;
    level?: number;
    fullDate: string;
    // Comparison fields
    level_memory?: number;
    level_digit?: number;
    precision_memory?: number;
    precision_digit?: number;
}

interface EvolutionChartProps {
    data: EvolutionData[];
}

export const EvolutionChart = ({ data }: EvolutionChartProps) => {
    // Check if we are in comparison mode
    const isComparison = data.length > 0 && 'level_memory' in data[0];

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-800">Evolución Temporal</h3>
                </div>
                {/* Legend for Comparison */}
                {isComparison && (
                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div>Nivel Memory</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Nivel Digit</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Prec. Memory</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Prec. Digit</div>
                    </div>
                )}
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            stroke="#9ca3af"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            domain={[0, 100]}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 'auto']}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        {!isComparison && <Legend verticalAlign="top" height={36} iconType="circle" />}

                        {!isComparison ? (
                            <>
                                <Line
                                    yAxisId="left"
                                    name="Precisión"
                                    type="monotone"
                                    dataKey="precision"
                                    stroke="#22c55e"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    yAxisId="right"
                                    name="Nivel"
                                    type="monotone"
                                    dataKey="level"
                                    stroke="#a855f7"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            </>
                        ) : (
                            <>
                                {/* Precision Lines (Left Axis) */}
                                <Line yAxisId="left" name="Prec. Memory" type="monotone" dataKey="precision_memory" stroke="#ef4444" strokeWidth={3} dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                <Line yAxisId="left" name="Prec. Digit" type="monotone" dataKey="precision_digit" stroke="#22c55e" strokeWidth={3} dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 5 }} />

                                {/* Level Lines (Right Axis) */}
                                <Line yAxisId="right" name="Nivel Memory" type="monotone" dataKey="level_memory" stroke="#a855f7" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" name="Nivel Digit" type="monotone" dataKey="level_digit" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </>
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
