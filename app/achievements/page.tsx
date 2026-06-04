'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Achievement = {
    id: string
    category: string
    icon: string
    title: string
    description: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret'
    condition: (stats: Stats) => boolean
    progress?: (stats: Stats) => { current: number; max: number }
}

type Stats = {
    totalFocusSessions: number
    totalFocusMinutes: number
    quizAttempts: number
    perfectQuizzes: number
    panicPlansGenerated: number
    materialsUploaded: number
    daysStudied: number
    avgGrade: number
    streakDays: number
}

const RARITY_CONFIG = {
    common: { label: 'COMMON', color: '#8a8a7a', glow: '#8a8a7a' },
    rare: { label: 'RARE', color: '#60a5fa', glow: '#3b82f6' },
    epic: { label: 'EPIC', color: '#a78bfa', glow: '#8b5cf6' },
    legendary: { label: 'LEGENDARY', color: '#f59e0b', glow: '#f59e0b' },
    secret: { label: 'SECRET', color: '#f472b6', glow: '#ec4899' },
}

const ACHIEVEMENTS: Achievement[] = [
    // Focus
    { id: 'first_focus', category: 'Focus', icon: '🎯', title: 'First Lock-In', description: 'Complete your first focus session', rarity: 'common', condition: s => s.totalFocusSessions >= 1 },
    { id: 'focus_10', category: 'Focus', icon: '🔥', title: 'On A Roll', description: 'Complete 10 focus sessions', rarity: 'rare', condition: s => s.totalFocusSessions >= 10, progress: s => ({ current: Math.min(s.totalFocusSessions, 10), max: 10 }) },
    { id: 'focus_50', category: 'Focus', icon: '⚡', title: 'Locked In', description: 'Complete 50 focus sessions', rarity: 'epic', condition: s => s.totalFocusSessions >= 50, progress: s => ({ current: Math.min(s.totalFocusSessions, 50), max: 50 }) },
    { id: 'focus_2h', category: 'Focus', icon: '🕐', title: 'Deep Work', description: 'Study for 2+ hours in a single session', rarity: 'rare', condition: s => s.totalFocusMinutes >= 120 },
    { id: 'focus_marathon', category: 'Focus', icon: '🏃', title: 'Marathon Mode', description: 'Accumulate 1000 minutes of focus time', rarity: 'legendary', condition: s => s.totalFocusMinutes >= 1000, progress: s => ({ current: Math.min(s.totalFocusMinutes, 1000), max: 1000 }) },
    // Consistency
    { id: 'streak_3', category: 'Consistency', icon: '📅', title: '3-Day Grind', description: 'Study 3 days in a row', rarity: 'common', condition: s => s.streakDays >= 3, progress: s => ({ current: Math.min(s.streakDays, 3), max: 3 }) },
    { id: 'streak_7', category: 'Consistency', icon: '🗓️', title: 'Week Warrior', description: '7-day study streak', rarity: 'rare', condition: s => s.streakDays >= 7, progress: s => ({ current: Math.min(s.streakDays, 7), max: 7 }) },
    { id: 'streak_30', category: 'Consistency', icon: '👑', title: 'Unstoppable', description: '30-day study streak', rarity: 'legendary', condition: s => s.streakDays >= 30, progress: s => ({ current: Math.min(s.streakDays, 30), max: 30 }) },
    // Grades
    { id: 'first_grade', category: 'Grades', icon: '📝', title: 'Grade Tracker', description: 'Log your first grade', rarity: 'common', condition: s => s.avgGrade > 0 },
    { id: 'grade_80', category: 'Grades', icon: '💯', title: 'Honour Roll', description: 'Maintain an average above 80%', rarity: 'epic', condition: s => s.avgGrade >= 80 },
    { id: 'grade_90', category: 'Grades', icon: '🏆', title: 'Academic Elite', description: 'Maintain an average above 90%', rarity: 'legendary', condition: s => s.avgGrade >= 90 },
    // Materials
    { id: 'material_1', category: 'Materials', icon: '📄', title: 'First Upload', description: 'Upload your first study material', rarity: 'common', condition: s => s.materialsUploaded >= 1 },
    { id: 'material_10', category: 'Materials', icon: '📚', title: 'Library Builder', description: 'Upload 10 study materials', rarity: 'rare', condition: s => s.materialsUploaded >= 10, progress: s => ({ current: Math.min(s.materialsUploaded, 10), max: 10 }) },
    { id: 'quiz_1', category: 'Materials', icon: '❓', title: 'Quiz Taker', description: 'Complete your first quiz', rarity: 'common', condition: s => s.quizAttempts >= 1 },
    { id: 'quiz_perfect', category: 'Materials', icon: '🌟', title: 'Perfect Score', description: 'Get 100% on any quiz', rarity: 'epic', condition: s => s.perfectQuizzes >= 1 },
    { id: 'quiz_10', category: 'Materials', icon: '🎓', title: 'Quiz Master', description: 'Complete 10 quizzes', rarity: 'rare', condition: s => s.quizAttempts >= 10, progress: s => ({ current: Math.min(s.quizAttempts, 10), max: 10 }) },
    // Panic Mode
    { id: 'panic_1', category: 'Panic Mode', icon: '😰', title: 'Clutch Mode', description: 'Generate your first panic plan', rarity: 'common', condition: s => s.panicPlansGenerated >= 1 },
    { id: 'panic_5', category: 'Panic Mode', icon: '🚨', title: 'Panic Pro', description: 'Generate 5 panic plans', rarity: 'rare', condition: s => s.panicPlansGenerated >= 5, progress: s => ({ current: Math.min(s.panicPlansGenerated, 5), max: 5 }) },
    { id: 'panic_survivor', category: 'Panic Mode', icon: '💀', title: 'Survivor', description: 'Generate a plan with 1 day left', rarity: 'epic', condition: s => s.panicPlansGenerated >= 1 },
    // Secret
    { id: 'secret_grind', category: 'Secret', icon: '👁️', title: '???', description: 'Discovered by the truly dedicated', rarity: 'secret', condition: s => s.totalFocusSessions >= 100 },
    { id: 'secret_perfect_week', category: 'Secret', icon: '🌙', title: '???', description: 'A hidden path for night owls', rarity: 'secret', condition: s => s.streakDays >= 14 && s.perfectQuizzes >= 3 },
]

const CATEGORIES = ['All', 'Focus', 'Consistency', 'Grades', 'Materials', 'Panic Mode', 'Secret']

export default function Achievements() {
    const [stats, setStats] = useState<Stats>({
        totalFocusSessions: 0,
        totalFocusMinutes: 0,
        quizAttempts: 0,
        perfectQuizzes: 0,
        panicPlansGenerated: 0,
        materialsUploaded: 0,
        daysStudied: 0,
        avgGrade: 0,
        streakDays: 0,
    })
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState('All')
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) { setLoading(false); return }
            setUser(user)

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

            setStats({
                totalFocusSessions: sessions.length,
                totalFocusMinutes,
                quizAttempts: quizzes.length,
                perfectQuizzes,
                panicPlansGenerated: panics.length,
                materialsUploaded: materials.length,
                daysStudied: sessions.length,
                avgGrade: Math.round(avgGrade),
                streakDays: 0,
            })
            setLoading(false)
        })
    }, [])

    const unlocked = (a: Achievement) => a.condition(stats)
    const filtered = ACHIEVEMENTS.filter(a => activeCategory === 'All' || a.category === activeCategory)
    const unlockedCount = ACHIEVEMENTS.filter(unlocked).length
    const completionPct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)

    if (loading) return (
        <main style={{ minHeight: '100vh', background: '#0d0d0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#5a5a4a', fontFamily: 'monospace', fontSize: '0.85rem' }}>Loading achievements...</p>
        </main>
    )

    return (
        <main style={{ minHeight: '100vh', background: '#0d0d0a', color: '#f5f5f0', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <p style={{ fontSize: '0.7rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        StudyOS / Achievements
                    </p>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>🏅 Achievements</h1>
                    <p style={{ fontSize: '0.85rem', color: '#5a5a4a' }}>Track your progress. Unlock rewards. Become unstoppable.</p>
                </div>

                {/* Overall Progress */}
                <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.7rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Overall Completion</p>
                            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{completionPct}%</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                                {unlockedCount}<span style={{ fontSize: '0.85rem', color: '#5a5a4a', fontWeight: 400 }}>/{ACHIEVEMENTS.length}</span>
                            </p>
                            <p style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>achievements unlocked</p>
                        </div>
                    </div>
                    <div style={{ height: '6px', background: '#1f1f18', borderRadius: '999px' }}>
                        <div style={{
                            height: '100%', borderRadius: '999px',
                            background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                            width: `${completionPct}%`, transition: 'width 1s ease',
                            boxShadow: '0 0 12px rgba(245,158,11,0.4)'
                        }} />
                    </div>
                </div>

                {/* Category Filter */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                            padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                            fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
                            border: activeCategory === cat ? 'none' : '1px solid #2a2a22',
                            background: activeCategory === cat ? '#f59e0b' : 'transparent',
                            color: activeCategory === cat ? '#0d0d0a' : '#5a5a4a',
                        }}>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Achievement Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {filtered.map(a => {
                        const isUnlocked = unlocked(a)
                        const rarity = RARITY_CONFIG[a.rarity]
                        const prog = a.progress?.(stats)
                        const isHovered = hoveredId === a.id

                        return (
                            <div
                                key={a.id}
                                onMouseEnter={() => setHoveredId(a.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    background: isUnlocked ? '#111110' : '#0d0d0a',
                                    border: `1px solid ${isUnlocked ? rarity.color + '40' : '#1a1a14'}`,
                                    borderRadius: '14px', padding: '1.25rem',
                                    position: 'relative', overflow: 'hidden',
                                    transition: 'all 0.2s',
                                    transform: isHovered && isUnlocked ? 'translateY(-2px)' : 'none',
                                    boxShadow: isHovered && isUnlocked ? `0 8px 24px ${rarity.glow}20` : 'none',
                                    opacity: isUnlocked ? 1 : 0.5,
                                    cursor: 'default',
                                }}
                            >
                                {/* Rarity glow strip */}
                                {isUnlocked && (
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                                        background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)`
                                    }} />
                                )}

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
                                    <div style={{
                                        fontSize: '1.75rem', lineHeight: 1,
                                        filter: isUnlocked ? 'none' : 'grayscale(1)',
                                        flexShrink: 0,
                                    }}>
                                        {isUnlocked || a.rarity !== 'secret' ? a.icon : '🔒'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isUnlocked ? '#f5f5f0' : '#3a3a30' }}>
                                                {a.rarity === 'secret' && !isUnlocked ? '???' : a.title}
                                            </span>
                                            <span style={{
                                                fontSize: '0.55rem', fontFamily: 'monospace', letterSpacing: '0.08em',
                                                padding: '0.15rem 0.4rem', borderRadius: '3px', fontWeight: 700,
                                                color: isUnlocked ? rarity.color : '#2a2a22',
                                                border: `1px solid ${isUnlocked ? rarity.color + '40' : '#1a1a14'}`,
                                                background: isUnlocked ? rarity.color + '10' : 'transparent',
                                            }}>
                                                {rarity.label}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: isUnlocked ? '#8a8a7a' : '#2a2a22', lineHeight: 1.5 }}>
                                            {a.rarity === 'secret' && !isUnlocked ? 'Keep grinding to discover this...' : a.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                {prog && !isUnlocked && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#3a3a30', fontFamily: 'monospace' }}>Progress</span>
                                            <span style={{ fontSize: '0.65rem', color: '#5a5a4a', fontFamily: 'monospace' }}>{prog.current}/{prog.max}</span>
                                        </div>
                                        <div style={{ height: '3px', background: '#1a1a14', borderRadius: '999px' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '999px',
                                                background: rarity.color,
                                                width: `${(prog.current / prog.max) * 100}%`,
                                                opacity: 0.5
                                            }} />
                                        </div>
                                    </div>
                                )}

                                {/* Unlocked checkmark */}
                                {isUnlocked && (
                                    <div style={{
                                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        background: rarity.color + '20',
                                        border: `1px solid ${rarity.color}40`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <span style={{ fontSize: '0.6rem', color: rarity.color }}>✓</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

            </div>
        </main>
    )
}
