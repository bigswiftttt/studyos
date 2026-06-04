'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Achievement = {
    key: string
    title: string
    description: string
    icon: string
    category: string
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
    secret?: boolean
    check: (stats: Stats) => boolean
    progress?: (stats: Stats) => { current: number; target: number }
}

type Stats = {
    totalSessions: number
    totalHours: number
    consecutiveDays: number
    materialCount: number
    panicPlanCount: number
    panicPlanUnder72h: boolean
    cgpa: number
    quizAttempts: number
    quizScore90Plus: number
    quizScore100: number
    quizScore80Plus10: boolean
    nightOwlSessions: number
    earlyBirdSessions: number
    sessionsin7Days: number
}

const RARITY_COLORS = {
    Common: '#8a8a7a',
    Rare: '#3b82f6',
    Epic: '#a855f7',
    Legendary: '#f59e0b',
}

const RARITY_BG = {
    Common: 'rgba(138,138,122,0.08)',
    Rare: 'rgba(59,130,246,0.08)',
    Epic: 'rgba(168,85,247,0.08)',
    Legendary: 'rgba(245,158,11,0.08)',
}

const ACHIEVEMENTS: Achievement[] = [
    // Focus
    {
        key: 'deep_diver', title: 'Deep Diver', description: 'Complete 5 focus sessions',
        icon: '🤿', category: 'Focus', rarity: 'Common',
        check: s => s.totalSessions >= 5,
        progress: s => ({ current: Math.min(s.totalSessions, 5), target: 5 })
    },
    {
        key: 'locked_in', title: 'Locked In', description: 'Complete 10 focus sessions',
        icon: '🔒', category: 'Focus', rarity: 'Rare',
        check: s => s.totalSessions >= 10,
        progress: s => ({ current: Math.min(s.totalSessions, 10), target: 10 })
    },
    {
        key: 'monk_mode', title: 'Monk Mode', description: 'Complete 30 focus sessions',
        icon: '🧘', category: 'Focus', rarity: 'Epic',
        check: s => s.totalSessions >= 30,
        progress: s => ({ current: Math.min(s.totalSessions, 30), target: 30 })
    },
    // Consistency
    {
        key: 'week_warrior', title: 'Week Warrior', description: 'Study 3 consecutive days',
        icon: '⚔️', category: 'Consistency', rarity: 'Common',
        check: s => s.consecutiveDays >= 3,
        progress: s => ({ current: Math.min(s.consecutiveDays, 3), target: 3 })
    },
    {
        key: 'unstoppable', title: 'Unstoppable', description: 'Study 7 consecutive days',
        icon: '🔥', category: 'Consistency', rarity: 'Rare',
        check: s => s.consecutiveDays >= 7,
        progress: s => ({ current: Math.min(s.consecutiveDays, 7), target: 7 })
    },
    {
        key: 'academic_machine', title: 'Academic Machine', description: 'Study 14 consecutive days',
        icon: '🤖', category: 'Consistency', rarity: 'Legendary',
        check: s => s.consecutiveDays >= 14,
        progress: s => ({ current: Math.min(s.consecutiveDays, 14), target: 14 })
    },
    // Knowledge
    {
        key: 'sharpshooter', title: 'Sharpshooter', description: 'Score 90%+ on an MCQ quiz',
        icon: '🎯', category: 'Knowledge', rarity: 'Rare',
        check: s => s.quizScore90Plus >= 1,
    },
    {
        key: 'perfect_run', title: 'Perfect Run', description: 'Score 100% on a quiz',
        icon: '💯', category: 'Knowledge', rarity: 'Epic',
        check: s => s.quizScore100 >= 1,
    },
    {
        key: 'exam_slayer', title: 'Exam Slayer', description: 'Score 80%+ on 10 quizzes',
        icon: '🗡️', category: 'Knowledge', rarity: 'Legendary',
        check: s => s.quizScore80Plus10,
        progress: s => ({ current: Math.min(s.quizAttempts, 10), target: 10 })
    },
    // Grades
    {
        key: 'rising_star', title: 'Rising Star', description: 'Achieve a CGPA above 3.0',
        icon: '⭐', category: 'Grades', rarity: 'Common',
        check: s => s.cgpa > 3.0,
    },
    {
        key: 'honor_roll', title: 'Honor Roll', description: 'Achieve a CGPA above 4.0',
        icon: '🏅', category: 'Grades', rarity: 'Rare',
        check: s => s.cgpa > 4.0,
    },
    {
        key: 'deans_list', title: "Dean's List", description: 'Achieve a CGPA above 4.5',
        icon: '🎖️', category: 'Grades', rarity: 'Epic',
        check: s => s.cgpa > 4.5,
    },
    // Study Volume
    {
        key: 'ten_hours', title: '10 Hours Strong', description: 'Study for 10 total hours',
        icon: '⏱️', category: 'Study Volume', rarity: 'Common',
        check: s => s.totalHours >= 10,
        progress: s => ({ current: Math.min(Math.floor(s.totalHours), 10), target: 10 })
    },
    {
        key: 'twenty_five_hours', title: 'Grind Mode', description: 'Study for 25 total hours',
        icon: '💪', category: 'Study Volume', rarity: 'Rare',
        check: s => s.totalHours >= 25,
        progress: s => ({ current: Math.min(Math.floor(s.totalHours), 25), target: 25 })
    },
    {
        key: 'fifty_hours', title: 'Half Century', description: 'Study for 50 total hours',
        icon: '🔋', category: 'Study Volume', rarity: 'Epic',
        check: s => s.totalHours >= 50,
        progress: s => ({ current: Math.min(Math.floor(s.totalHours), 50), target: 50 })
    },
    {
        key: 'hundred_hours', title: 'Century Scholar', description: 'Study for 100 total hours',
        icon: '👑', category: 'Study Volume', rarity: 'Legendary',
        check: s => s.totalHours >= 100,
        progress: s => ({ current: Math.min(Math.floor(s.totalHours), 100), target: 100 })
    },
    // Materials
    {
        key: 'archivist', title: 'Archivist', description: 'Store 15 study materials',
        icon: '📚', category: 'Materials', rarity: 'Rare',
        check: s => s.materialCount >= 15,
        progress: s => ({ current: Math.min(s.materialCount, 15), target: 15 })
    },
    {
        key: 'knowledge_vault', title: 'Knowledge Vault', description: 'Store 25 study materials',
        icon: '🏛️', category: 'Materials', rarity: 'Epic',
        check: s => s.materialCount >= 25,
        progress: s => ({ current: Math.min(s.materialCount, 25), target: 25 })
    },
    // Panic Mode
    {
        key: 'crisis_manager', title: 'Crisis Manager', description: 'Generate 5 panic plans',
        icon: '🚨', category: 'Panic Mode', rarity: 'Rare',
        check: s => s.panicPlanCount >= 5,
        progress: s => ({ current: Math.min(s.panicPlanCount, 5), target: 5 })
    },
    {
        key: 'against_all_odds', title: 'Against All Odds', description: 'Create a panic plan with less than 72 hours until exam',
        icon: '⚡', category: 'Panic Mode', rarity: 'Epic',
        check: s => s.panicPlanUnder72h,
    },
    // Secret
    {
        key: 'night_owl', title: 'Night Owl', description: 'Complete focus sessions after midnight 10 times',
        icon: '🦉', category: 'Secret', rarity: 'Rare', secret: true,
        check: s => s.nightOwlSessions >= 10,
        progress: s => ({ current: Math.min(s.nightOwlSessions, 10), target: 10 })
    },
    {
        key: 'early_bird', title: 'Early Bird', description: 'Complete focus sessions before 6 AM',
        icon: '🌅', category: 'Secret', rarity: 'Rare', secret: true,
        check: s => s.earlyBirdSessions >= 1,
    },
    {
        key: 'survived_finals', title: 'Survived Finals', description: 'Complete 15 focus sessions within 7 days',
        icon: '🎓', category: 'Secret', rarity: 'Legendary', secret: true,
        check: s => s.sessionsin7Days >= 15,
        progress: s => ({ current: Math.min(s.sessionsin7Days, 15), target: 15 })
    },
]

const CATEGORIES = ['Focus', 'Consistency', 'Knowledge', 'Grades', 'Study Volume', 'Materials', 'Panic Mode', 'Secret']

export default function Achievements() {
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState<Stats | null>(null)
    const [unlockedKeys, setUnlockedKeys] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState('All')
    const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([])
    const [showPopup, setShowPopup] = useState(false)
    const [popupIndex, setPopupIndex] = useState(0)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) { setUser(user); init(user.id) }
            else setLoading(false)
        })
    }, [])

    const init = async (userId: string) => {
        setLoading(true)

        // Fetch all data in parallel
        const [
            { data: sessions },
            { data: materials },
            { data: panicPlans },
            { data: gradeEntries },
            { data: quizAttempts },
            { data: existingAchievements },
        ] = await Promise.all([
            supabase.from('focus_sessions').select('*').eq('user_id', userId),
            supabase.from('study_materials').select('id').eq('user_id', userId),
            supabase.from('panic_plans').select('*').eq('user_id', userId),
            supabase.from('grade_entries').select('units, grade').eq('user_id', userId),
            supabase.from('quiz_attempts').select('*').eq('user_id', userId),
            supabase.from('achievements').select('achievement_key').eq('user_id', userId),
        ])

        const existingKeys = (existingAchievements || []).map((a: any) => a.achievement_key)

        // Calculate stats
        const totalSessions = sessions?.length || 0
        const totalHours = (sessions || []).reduce((acc: number, s: any) => acc + (s.duration_mins || 0), 0) / 60

        // Consecutive days
        const sessionDates = [...new Set((sessions || []).map((s: any) => s.session_date))].sort()
        let maxStreak = 0, currentStreak = 0
        for (let i = 0; i < sessionDates.length; i++) {
            if (i === 0) { currentStreak = 1 }
            else {
                const prev = new Date(sessionDates[i - 1])
                const curr = new Date(sessionDates[i])
                const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
                if (diff === 1) currentStreak++
                else currentStreak = 1
            }
            maxStreak = Math.max(maxStreak, currentStreak)
        }

        // CGPA
        const gradePoints: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 }
        const totalPoints = (gradeEntries || []).reduce((acc: number, e: any) => acc + (gradePoints[e.grade] || 0) * e.units, 0)
        const totalUnits = (gradeEntries || []).reduce((acc: number, e: any) => acc + e.units, 0)
        const cgpa = totalUnits > 0 ? totalPoints / totalUnits : 0

        // Quiz stats
        const quizScore90Plus = (quizAttempts || []).filter((q: any) => q.total > 0 && q.score / q.total >= 0.9).length
        const quizScore100 = (quizAttempts || []).filter((q: any) => q.total > 0 && q.score === q.total).length
        const quiz80PlusList = (quizAttempts || []).filter((q: any) => q.total > 0 && q.score / q.total >= 0.8)

        // Panic under 72h
        const panicUnder72h = (panicPlans || []).some((p: any) => p.days_until_exam !== null && p.days_until_exam * 24 < 72)

        // Night owl / early bird
        const nightOwl = (sessions || []).filter((s: any) => {
            const h = new Date(s.created_at).getHours()
            return h >= 0 && h < 4
        }).length
        const earlyBird = (sessions || []).filter((s: any) => {
            const h = new Date(s.created_at).getHours()
            return h < 6
        }).length

        // Sessions in last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sessionsIn7Days = (sessions || []).filter((s: any) => new Date(s.created_at) >= sevenDaysAgo).length

        const computedStats: Stats = {
            totalSessions,
            totalHours,
            consecutiveDays: maxStreak,
            materialCount: materials?.length || 0,
            panicPlanCount: panicPlans?.length || 0,
            panicPlanUnder72h: panicUnder72h,
            cgpa,
            quizAttempts: quizAttempts?.length || 0,
            quizScore90Plus,
            quizScore100,
            quizScore80Plus10: quiz80PlusList.length >= 10,
            nightOwlSessions: nightOwl,
            earlyBirdSessions: earlyBird,
            sessionsin7Days: sessionsIn7Days,
        }

        setStats(computedStats)

        // Check for new unlocks
        const newlyUnlocked: Achievement[] = []
        for (const a of ACHIEVEMENTS) {
            if (!existingKeys.includes(a.key) && a.check(computedStats)) {
                newlyUnlocked.push(a)
                await supabase.from('achievements').insert({ user_id: userId, achievement_key: a.key })
            }
        }

        const allUnlocked = [...existingKeys, ...newlyUnlocked.map(a => a.key)]
        setUnlockedKeys(allUnlocked)

        if (newlyUnlocked.length > 0) {
            setNewUnlocks(newlyUnlocked)
            setPopupIndex(0)
            setShowPopup(true)
        }

        setLoading(false)
    }

    const unlockedCount = unlockedKeys.length
    const totalCount = ACHIEVEMENTS.length
    const completionPct = Math.round((unlockedCount / totalCount) * 100)

    const filteredAchievements = activeCategory === 'All'
        ? ACHIEVEMENTS
        : ACHIEVEMENTS.filter(a => a.category === activeCategory)

    if (loading) return (
        <main style={{ minHeight: '100vh', background: '#0d0d0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#5a5a4a', fontSize: '0.875rem' }}>Loading achievements...</p>
        </main>
    )

    return (
        <main style={{ minHeight: '100vh', background: '#0d0d0a', color: '#f5f5f0', fontFamily: 'Inter, sans-serif' }}>

            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 2rem', borderBottom: '1px solid #1f1f18',
                position: 'sticky', top: 0, zIndex: 40,
                background: 'rgba(13,13,10,0.92)', backdropFilter: 'blur(12px)'
            }}>
                <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                    Study<span style={{ color: '#f59e0b' }}>OS</span>
                </span>
                <a href="/dashboard" style={{ fontSize: '0.82rem', color: '#5a5a4a', textDecoration: 'none', fontWeight: 500 }}>
                    ← Dashboard
                </a>
            </nav>

            <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem' }}>
                        Achievements
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: '#5a5a4a' }}>
                        Earn achievements through consistency, discipline and mastery.
                    </p>
                </div>

                {/* Progress Card */}
                <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Overall Progress</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', fontFamily: 'monospace', color: '#f59e0b' }}>{completionPct}%</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f5f5f0' }}>{unlockedCount}<span style={{ fontSize: '1rem', color: '#5a5a4a' }}>/{totalCount}</span></p>
                            <p style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>unlocked</p>
                        </div>
                    </div>
                    <div style={{ height: '6px', background: '#1f1f18', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #f59e0b, #f97316)', borderRadius: '999px', width: `${completionPct}%`, transition: 'width 1s ease' }} />
                    </div>
                </div>

                {/* Stats Row */}
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Focus Sessions', value: stats.totalSessions, icon: '⏱️' },
                            { label: 'Hours Studied', value: `${stats.totalHours.toFixed(1)}h`, icon: '📖' },
                            { label: 'Best Streak', value: `${stats.consecutiveDays}d`, icon: '🔥' },
                            { label: 'Quiz Attempts', value: stats.quizAttempts, icon: '🎯' },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                                <p style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{s.icon}</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>{s.value}</p>
                                <p style={{ fontSize: '0.68rem', color: '#5a5a4a' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Category Filter */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {['All', ...CATEGORIES].map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                            padding: '0.45rem 0.9rem', borderRadius: '8px',
                            border: `1px solid ${activeCategory === cat ? '#f59e0b' : '#2a2a22'}`,
                            background: activeCategory === cat ? '#f59e0b' : '#111110',
                            color: activeCategory === cat ? '#0d0d0a' : '#5a5a4a',
                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                        }}>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Achievement Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredAchievements.map(a => {
                        const unlocked = unlockedKeys.includes(a.key)
                        const prog = stats && a.progress ? a.progress(stats) : null
                        const isSecret = a.secret && !unlocked

                        return (
                            <div key={a.key} style={{
                                background: unlocked ? '#111110' : '#0d0d0a',
                                border: `1px solid ${unlocked ? RARITY_COLORS[a.rarity] + '40' : '#1a1a14'}`,
                                borderRadius: '12px', padding: '1.1rem 1.25rem',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                opacity: unlocked ? 1 : 0.6, transition: 'all 0.2s'
                            }}>
                                {/* Icon */}
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                                    background: unlocked ? RARITY_BG[a.rarity] : '#1a1a14',
                                    border: `1px solid ${unlocked ? RARITY_COLORS[a.rarity] + '30' : '#2a2a22'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.3rem', filter: unlocked ? 'none' : 'grayscale(100%)'
                                }}>
                                    {isSecret ? '🔒' : a.icon}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: unlocked ? '#f5f5f0' : '#5a5a4a' }}>
                                            {isSecret ? '???' : a.title}
                                        </p>
                                        <span style={{
                                            fontSize: '0.6rem', fontFamily: 'monospace', letterSpacing: '0.08em',
                                            padding: '0.15rem 0.45rem', borderRadius: '4px',
                                            color: RARITY_COLORS[a.rarity],
                                            background: RARITY_BG[a.rarity],
                                            border: `1px solid ${RARITY_COLORS[a.rarity]}30`,
                                            fontWeight: 700
                                        }}>
                                            {a.rarity.toUpperCase()}
                                        </span>
                                        {unlocked && (
                                            <span style={{ fontSize: '0.6rem', color: '#22c55e', fontFamily: 'monospace', fontWeight: 700 }}>✓ UNLOCKED</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: '#5a5a4a', lineHeight: 1.4 }}>
                                        {isSecret ? 'Keep studying to discover this achievement' : a.description}
                                    </p>
                                    {/* Progress bar */}
                                    {!unlocked && prog && !isSecret && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.65rem', color: '#3a3a30', fontFamily: 'monospace' }}>{prog.current}/{prog.target}</span>
                                                <span style={{ fontSize: '0.65rem', color: '#3a3a30', fontFamily: 'monospace' }}>{Math.round((prog.current / prog.target) * 100)}%</span>
                                            </div>
                                            <div style={{ height: '3px', background: '#1f1f18', borderRadius: '999px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', background: RARITY_COLORS[a.rarity], borderRadius: '999px', width: `${(prog.current / prog.target) * 100}%`, transition: 'width 0.8s ease' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Category tag */}
                                <div style={{ flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.62rem', color: '#3a3a30', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                                        {a.category.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Achievement Unlock Popup */}
            {showPopup && newUnlocks[popupIndex] && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
                }}>
                    <div style={{
                        background: '#111110',
                        border: `1px solid ${RARITY_COLORS[newUnlocks[popupIndex].rarity]}50`,
                        borderRadius: '20px', padding: '2.5rem 2rem',
                        maxWidth: '360px', width: '100%', textAlign: 'center',
                        boxShadow: `0 0 40px ${RARITY_COLORS[newUnlocks[popupIndex].rarity]}20`
                    }}>
                        <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                            Achievement Unlocked
                        </p>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '18px', margin: '0 auto 1.25rem',
                            background: RARITY_BG[newUnlocks[popupIndex].rarity],
                            border: `2px solid ${RARITY_COLORS[newUnlocks[popupIndex].rarity]}50`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem'
                        }}>
                            {newUnlocks[popupIndex].icon}
                        </div>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                            {newUnlocks[popupIndex].title}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#8a8a7a', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                            {newUnlocks[popupIndex].description}
                        </p>
                        <span style={{
                            display: 'inline-block', fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.08em',
                            padding: '0.25rem 0.75rem', borderRadius: '6px', marginBottom: '1.5rem',
                            color: RARITY_COLORS[newUnlocks[popupIndex].rarity],
                            background: RARITY_BG[newUnlocks[popupIndex].rarity],
                            border: `1px solid ${RARITY_COLORS[newUnlocks[popupIndex].rarity]}30`,
                            fontWeight: 700
                        }}>
                            {newUnlocks[popupIndex].rarity.toUpperCase()}
                        </span>
                        <button onClick={() => {
                            if (popupIndex + 1 < newUnlocks.length) setPopupIndex(i => i + 1)
                            else setShowPopup(false)
                        }} style={{
                            display: 'block', width: '100%', padding: '0.85rem',
                            borderRadius: '10px', border: 'none',
                            background: RARITY_COLORS[newUnlocks[popupIndex].rarity],
                            color: '#0d0d0a', fontSize: '0.9rem', fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit'
                        }}>
                            {popupIndex + 1 < newUnlocks.length ? `Next (${popupIndex + 1}/${newUnlocks.length})` : 'Awesome! 🎉'}
                        </button>
                    </div>
                </div>
            )}

        </main>
    )
}
