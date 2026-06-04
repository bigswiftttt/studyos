import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Stats = {
    totalFocusSessions: number
    totalFocusMinutes: number
    quizAttempts: number
    perfectQuizzes: number
    panicPlansGenerated: number
    materialsUploaded: number
    avgGrade: number
    streakDays: number
}

type Achievement = {
    id: string
    icon: string
    title: string
    description: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret'
    condition: (stats: Stats) => boolean
}

const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_focus', icon: '🎯', title: 'First Lock-In', description: 'Complete your first focus session', rarity: 'common', condition: s => s.totalFocusSessions >= 1 },
    { id: 'focus_10', icon: '🔥', title: 'On A Roll', description: 'Complete 10 focus sessions', rarity: 'rare', condition: s => s.totalFocusSessions >= 10 },
    { id: 'focus_50', icon: '⚡', title: 'Locked In', description: 'Complete 50 focus sessions', rarity: 'epic', condition: s => s.totalFocusSessions >= 50 },
    { id: 'focus_2h', icon: '🕐', title: 'Deep Work', description: 'Study for 2+ hours total', rarity: 'rare', condition: s => s.totalFocusMinutes >= 120 },
    { id: 'focus_marathon', icon: '🏃', title: 'Marathon Mode', description: 'Accumulate 1000 minutes of focus time', rarity: 'legendary', condition: s => s.totalFocusMinutes >= 1000 },
    { id: 'streak_3', icon: '📅', title: '3-Day Grind', description: 'Study 3 days in a row', rarity: 'common', condition: s => s.streakDays >= 3 },
    { id: 'streak_7', icon: '🗓️', title: 'Week Warrior', description: '7-day study streak', rarity: 'rare', condition: s => s.streakDays >= 7 },
    { id: 'streak_30', icon: '👑', title: 'Unstoppable', description: '30-day study streak', rarity: 'legendary', condition: s => s.streakDays >= 30 },
    { id: 'first_grade', icon: '📝', title: 'Grade Tracker', description: 'Log your first grade', rarity: 'common', condition: s => s.avgGrade > 0 },
    { id: 'grade_80', icon: '💯', title: 'Honour Roll', description: 'Maintain an average above 80%', rarity: 'epic', condition: s => s.avgGrade >= 80 },
    { id: 'grade_90', icon: '🏆', title: 'Academic Elite', description: 'Maintain an average above 90%', rarity: 'legendary', condition: s => s.avgGrade >= 90 },
    { id: 'material_1', icon: '📄', title: 'First Upload', description: 'Upload your first study material', rarity: 'common', condition: s => s.materialsUploaded >= 1 },
    { id: 'material_10', icon: '📚', title: 'Library Builder', description: 'Upload 10 study materials', rarity: 'rare', condition: s => s.materialsUploaded >= 10 },
    { id: 'quiz_1', icon: '❓', title: 'Quiz Taker', description: 'Complete your first quiz', rarity: 'common', condition: s => s.quizAttempts >= 1 },
    { id: 'quiz_perfect', icon: '🌟', title: 'Perfect Score', description: 'Get 100% on any quiz', rarity: 'epic', condition: s => s.perfectQuizzes >= 1 },
    { id: 'quiz_10', icon: '🎓', title: 'Quiz Master', description: 'Complete 10 quizzes', rarity: 'rare', condition: s => s.quizAttempts >= 10 },
    { id: 'panic_1', icon: '😰', title: 'Clutch Mode', description: 'Generate your first panic plan', rarity: 'common', condition: s => s.panicPlansGenerated >= 1 },
    { id: 'panic_5', icon: '🚨', title: 'Panic Pro', description: 'Generate 5 panic plans', rarity: 'rare', condition: s => s.panicPlansGenerated >= 5 },
    { id: 'secret_grind', icon: '👁️', title: 'The Obsessed', description: 'Discovered by the truly dedicated', rarity: 'secret', condition: s => s.totalFocusSessions >= 100 },
    { id: 'secret_perfect_week', icon: '🌙', title: 'Night Owl Elite', description: 'A hidden path for night owls', rarity: 'secret', condition: s => s.streakDays >= 14 && s.perfectQuizzes >= 3 },
]

const STORAGE_KEY = 'studyos_unlocked_achievements'

export function useAchievements() {
    const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([])

    useEffect(() => {
        const run = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const uid = user.id
            const [focusRes, quizRes, panicRes, materialsRes, gradesRes] = await Promise.all([
                supabase.from('focus_sessions').select('duration').eq('user_id', uid),
                supabase.from('quiz_attempts').select('score, total').eq('user_id', uid),
                supabase.from('panic_plans').select('id').eq('user_id', uid),
                supabase.from('study_Library').select('id').eq('user_id', uid),
                supabase.from('grade_entries').select('grade').eq('user_id', uid),
            ])

            const sessions = focusRes.data || []
            const quizzes = quizRes.data || []
            const panics = panicRes.data || []
            const materials = materialsRes.data || []
            const grades = gradesRes.data || []

            const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0)
            const perfectQuizzes = quizzes.filter(q => q.score === q.total && q.total > 0).length
            const avgGrade = grades.length > 0
                ? grades.reduce((a, g) => a + (g.grade || 0), 0) / grades.length
                : 0

            const stats: Stats = {
                totalFocusSessions: sessions.length,
                totalFocusMinutes,
                quizAttempts: quizzes.length,
                perfectQuizzes,
                panicPlansGenerated: panics.length,
                materialsUploaded: materials.length,
                avgGrade: Math.round(avgGrade),
                streakDays: 0,
            }

            const previouslyUnlocked: string[] = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || '[]'
            )

            const currentlyUnlocked = ACHIEVEMENTS.filter(a => a.condition(stats)).map(a => a.id)

            const brandNew = ACHIEVEMENTS.filter(
                a => a.condition(stats) && !previouslyUnlocked.includes(a.id)
            )

            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentlyUnlocked))

            if (brandNew.length > 0) {
                setNewUnlocks(brandNew)
            }
        }

        run()
    }, [])

    const dismissFirst = () => {
        setNewUnlocks(prev => prev.slice(1))
    }

    return { newUnlocks, dismissFirst }
}
