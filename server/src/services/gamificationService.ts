import prisma from '../prisma';

// XP Constants
export const XP_VALUES = {
    LESSON_COMPLETE: 10,
    COURSE_COMPLETE: 100,
    QUIZ_PASS: 25,
    STREAK_BONUS_3: 50,
    STREAK_BONUS_7: 150,
    STREAK_BONUS_30: 500,
    FIRST_COURSE: 200,
    COMMENT_POSTED: 5
};

// Achievement Definitions
export const ACHIEVEMENTS = {
    FIRST_LESSON: { id: 'first_lesson', title: 'Primeiro Passo', description: 'Completou sua primeira aula', icon: '🎯', xpReward: 20 },
    FIRST_COURSE: { id: 'first_course', title: 'Formado!', description: 'Completou seu primeiro curso', icon: '🎓', xpReward: 200 },
    STREAK_3: { id: 'streak_3', title: 'Em Chamas', description: 'Estudou 3 dias seguidos', icon: '🔥', xpReward: 50 },
    STREAK_7: { id: 'streak_7', title: 'Dedicado', description: 'Estudou 7 dias seguidos', icon: '⚡', xpReward: 150 },
    STREAK_30: { id: 'streak_30', title: 'Imparável', description: 'Estudou 30 dias seguidos', icon: '🏆', xpReward: 500 },
    FIVE_COURSES: { id: 'five_courses', title: 'Estudioso', description: 'Completou 5 cursos', icon: '📚', xpReward: 300 },
    SOCIAL_BUTTERFLY: { id: 'social_butterfly', title: 'Colaborativo', description: 'Fez 10 comentários em aulas', icon: '💬', xpReward: 100 },
    QUIZ_MASTER: { id: 'quiz_master', title: 'Mestre dos Quizzes', description: 'Passou em 10 quizzes', icon: '🧠', xpReward: 250 }
};

// Level Calculation
export const calculateLevel = (xp: number): number => {
    // Formula: Level = 1 + floor(XP / 100)
    return 1 + Math.floor(xp / 100);
};

export const xpForNextLevel = (currentLevel: number): number => {
    return currentLevel * 100;
};

export const xpProgressInLevel = (xp: number): { current: number; required: number; percentage: number } => {
    const level = calculateLevel(xp);
    const xpForCurrentLevel = (level - 1) * 100;
    const xpForNext = level * 100;
    const current = xp - xpForCurrentLevel;
    const required = xpForNext - xpForCurrentLevel;
    return {
        current,
        required,
        percentage: Math.round((current / required) * 100)
    };
};

// Award XP to user
export const awardXP = async (userId: string, amount: number, reason: string): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true }
    });

    if (!user) throw new Error('User not found');

    const oldLevel = user.level;
    const newXp = user.xp + amount;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > oldLevel;

    await prisma.user.update({
        where: { id: userId },
        data: { xp: newXp, level: newLevel }
    });

    // Log the XP award (could be used for history)
    console.log(`[Gamification] User ${userId} awarded ${amount} XP for: ${reason}. New total: ${newXp}, Level: ${newLevel}`);

    return { newXp, newLevel, leveledUp };
};

// Get user gamification profile
export const getGamificationProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            avatar: true,
            xp: true,
            level: true,
            enrollments: {
                where: { completed: true },
                select: { id: true }
            },
            lessonProgress: {
                where: { completed: true },
                select: { id: true, updatedAt: true }
            },
            certificates: {
                select: { id: true }
            },
            quizAttempts: {
                where: { passed: true },
                select: { id: true }
            },
            comments: {
                select: { id: true }
            }
        }
    });

    if (!user) throw new Error('User not found');

    const levelProgress = xpProgressInLevel(user.xp);

    // Calculate streak (simplified - counts consecutive days with progress)
    const streak = await calculateStreak(userId);

    // Check earned achievements
    const achievements = await getEarnedAchievements(userId, {
        lessonsCompleted: user.lessonProgress.length,
        coursesCompleted: user.enrollments.length,
        quizzesPassed: user.quizAttempts.length,
        commentsPosted: user.comments.length,
        currentStreak: streak
    });

    return {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        levelProgress,
        stats: {
            lessonsCompleted: user.lessonProgress.length,
            coursesCompleted: user.enrollments.length,
            certificatesEarned: user.certificates.length,
            quizzesPassed: user.quizAttempts.length,
            commentsPosted: user.comments.length,
            currentStreak: streak
        },
        achievements
    };
};

// Calculate study streak
const calculateStreak = async (userId: string): Promise<number> => {
    const progress = await prisma.lessonProgress.findMany({
        where: { userId, completed: true },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
    });

    if (progress.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Get unique days with activity
    const activityDays = new Set<string>();
    progress.forEach(p => {
        const dayStr = p.updatedAt.toISOString().split('T')[0];
        activityDays.add(dayStr);
    });

    const sortedDays = Array.from(activityDays).sort().reverse();

    for (let i = 0; i < sortedDays.length; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() - i);
        const checkStr = checkDate.toISOString().split('T')[0];

        if (sortedDays.includes(checkStr)) {
            streak++;
        } else if (i > 0) {
            // Only break if we've started counting and missed a day
            break;
        }
    }

    return streak;
};

// Get earned achievements based on stats
const getEarnedAchievements = async (userId: string, stats: {
    lessonsCompleted: number;
    coursesCompleted: number;
    quizzesPassed: number;
    commentsPosted: number;
    currentStreak: number;
}) => {
    const earned: typeof ACHIEVEMENTS[keyof typeof ACHIEVEMENTS][] = [];

    if (stats.lessonsCompleted >= 1) earned.push(ACHIEVEMENTS.FIRST_LESSON);
    if (stats.coursesCompleted >= 1) earned.push(ACHIEVEMENTS.FIRST_COURSE);
    if (stats.coursesCompleted >= 5) earned.push(ACHIEVEMENTS.FIVE_COURSES);
    if (stats.currentStreak >= 3) earned.push(ACHIEVEMENTS.STREAK_3);
    if (stats.currentStreak >= 7) earned.push(ACHIEVEMENTS.STREAK_7);
    if (stats.currentStreak >= 30) earned.push(ACHIEVEMENTS.STREAK_30);
    if (stats.quizzesPassed >= 10) earned.push(ACHIEVEMENTS.QUIZ_MASTER);
    if (stats.commentsPosted >= 10) earned.push(ACHIEVEMENTS.SOCIAL_BUTTERFLY);

    return earned;
};

// Leaderboard
export const getLeaderboard = async (companyId?: string, limit: number = 10) => {
    const where = companyId ? { companyId } : {};

    const users = await prisma.user.findMany({
        where: {
            ...where,
            active: true,
            role: { in: ['COLABORADOR', 'LIDER', 'RH'] } // Exclude MASTER from company leaderboards
        },
        orderBy: { xp: 'desc' },
        take: limit,
        select: {
            id: true,
            name: true,
            avatar: true,
            xp: true,
            level: true,
            role: true
        }
    });

    return users.map((user, index) => ({
        rank: index + 1,
        ...user
    }));
};
