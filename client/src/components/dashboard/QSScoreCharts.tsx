import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export const ScoreEvolutionChart = ({ data }: { data: any[] }) => {
    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Evolução do QS Score
                </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            stroke="#9ca3af"
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 1000]}
                            fontSize={12}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#2563eb"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorScore)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export const AreaComparisonChart = ({ data }: { data: any[] }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Score por Área
                </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" domain={[0, 1000]} hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#4b5563"
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                            width={100}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Bar
                            dataKey="score"
                            fill="#3b82f6"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
