import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Award, Trophy, Zap, Target, TrendingUp, Users, Star, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface GamificationProfile {
    userId: string;
    name: string;
    avatar?: string;
    xp: number;
    level: number;
    levelProgress: {
        current: number;
        required: number;
        percentage: number;
    };
    stats: {
        lessonsCompleted: number;
        coursesCompleted: number;
        certificatesEarned: number;
        quizzesPassed: number;
        commentsPosted: number;
        currentStreak: number;
    };
    achievements: Achievement[];
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
}

interface LeaderboardEntry {
    rank: number;
    id: string;
    name: string;
    avatar?: string;
    xp: number;
    level: number;
}

const GamificationPage = () => {
    const [profile, setProfile] = useState<GamificationProfile | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'leaderboard' | 'achievements'>('profile');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, leaderboardRes, achievementsRes] = await Promise.all([
                    api.get('/gamification/profile'),
                    api.get('/gamification/leaderboard?limit=10'),
                    api.get('/gamification/achievements')
                ]);
                setProfile(profileRes.data);
                setLeaderboard(leaderboardRes.data);
                setAllAchievements(achievementsRes.data);
            } catch (error) {
                console.error('Error fetching gamification data', error);
                toast.error('Erro ao carregar dados de gamificação');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-6 text-center">Carregando...</div>;
    if (!profile) return <div className="p-6 text-center">Erro ao carregar perfil</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Meu Progresso
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Acompanhe sua evolução na Universidade Corporativa</p>
                </div>
            </div>

            {/* XP Card */}
            <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold border-4 border-white/40">
                        {profile.level}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">{profile.name}</h2>
                        <p className="text-white/80">Nível {profile.level} • {profile.xp} XP Total</p>
                        <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Progresso para Nível {profile.level + 1}</span>
                                <span>{profile.levelProgress.current}/{profile.levelProgress.required} XP</span>
                            </div>
                            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-500"
                                    style={{ width: `${profile.levelProgress.percentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    {profile.stats.currentStreak > 0 && (
                        <div className="text-center">
                            <div className="flex items-center gap-1 text-orange-300">
                                <Flame className="h-6 w-6" />
                                <span className="text-2xl font-bold">{profile.stats.currentStreak}</span>
                            </div>
                            <p className="text-xs text-white/70">dias seguidos</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {[
                    { id: 'profile', label: 'Estatísticas', icon: TrendingUp },
                    { id: 'leaderboard', label: 'Ranking', icon: Users },
                    { id: 'achievements', label: 'Conquistas', icon: Award },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Aulas Concluídas', value: profile.stats.lessonsCompleted, icon: Target, color: 'blue' },
                        { label: 'Cursos Concluídos', value: profile.stats.coursesCompleted, icon: Award, color: 'green' },
                        { label: 'Certificados', value: profile.stats.certificatesEarned, icon: Star, color: 'yellow' },
                        { label: 'Quizzes Aprovados', value: profile.stats.quizzesPassed, icon: Zap, color: 'purple' },
                        { label: 'Comentários', value: profile.stats.commentsPosted, icon: Users, color: 'pink' },
                        { label: 'Streak Atual', value: profile.stats.currentStreak, icon: Flame, color: 'orange' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                            <stat.icon className={`h-8 w-8 mx-auto mb-2 text-${stat.color}-500`} />
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'leaderboard' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Top 10 da Empresa
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {leaderboard.map((entry, index) => (
                            <div
                                key={entry.id}
                                className={`flex items-center gap-4 p-4 ${entry.id === profile.userId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        index === 1 ? 'bg-gray-100 text-gray-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-50 text-gray-500'
                                    }`}>
                                    {entry.rank}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        entry.name.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">{entry.name}</div>
                                    <div className="text-sm text-gray-500">Nível {entry.level}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-purple-600">{entry.xp.toLocaleString()} XP</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'achievements' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {allAchievements.map(achievement => {
                        const isEarned = profile.achievements.some(a => a.id === achievement.id);
                        return (
                            <div
                                key={achievement.id}
                                className={`p-4 rounded-xl border transition-all ${isEarned
                                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700'
                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`text-3xl ${isEarned ? '' : 'grayscale'}`}>
                                        {achievement.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{achievement.title}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                                        <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                                            +{achievement.xpReward} XP
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GamificationPage;
