'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts'

export default function Statistics() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Raw data
    const [quizAttempts, setQuizAttempts] = useState<any[]>([])
    const [focusSessions, setFocusSessions] = useState<any[]>([])

    // Derived chart data
    const [quizChartData, setQuizChartData] = useState<any[]>([])
    const [focusChartData, setFocusChartData] = useState<any[]>([])
    const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})

    // Summary stats
    const [totalFocusHours, setTotalFocusHours] = useState(0)
    const [avgQuizScore, setAvgQuizScore] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [totalSessions, setTotalSessions] = useState(0)

    const [focusRange, setFocusRange] = useState<'7' | '30'>('7')

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/auth/login'); return }
            setUser(user)
            await fetchData(user.id)
            setLoading(false)
        }
        init()
    }, [])

    const fetchData = async (userId: string) => {
        const [{ data: quizzes }, { data: sessions }] = await Promise.all([
            supabase.from('quiz_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
            supabase.from('focus_sessions').select('*').eq('user_id', userId).order('session_date', { ascending: true }),
        ])

        const q = quizzes || []
        const s = sessions || []

        setQuizAttempts(q)
        setFocusSessions(s)

        // Quiz chart — score % per attempt
        const qChart = q.map((a: any, i: number) => ({
            attempt: `#${i + 1}`,
            score: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
            label: `${a.score}/${a.total}`,
        }))
        setQuizChartData(qChart)

        // Focus chart — mins per day (last 7 or 30 days handled at render)
        const focusByDate: Record<string, number> = {}
        s.forEach((session: any) => {
            const d = session.session_date
            focusByDate[d] = (focusByDate[d] || 0) + (session.duration_mins || 0)
        })

        // Build last 30 days
        const days: any[] = []
        for (let i = 29; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toISOString().split('T')[0]
            days.push({
                date: key,
                label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                mins: focusByDate[key] || 0,
            })
        }
        setFocusChartData(days)
        setHeatmapData(focusByDate)

        // Summary stats
        const totalMins = s.reduce((acc: number, s: any) => acc + (s.duration_mins || 0), 0)
        setTotalFocusHours(Math.round((totalMins / 60) * 10) / 10)
        setTotalSessions(s.length)

        const avgScore = q.length > 0
            ? Math.round(q.reduce((acc: number, a: any) => acc + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) / q.length)
            : 0
        setAvgQuizScore(avgScore)

        // Best streak
        const uniqueDates = [...new Set(s.map((s: any) => s.session_date))].sort() as string[]
        let maxStreak = 0, streak = 0
        for (let i = 0; i < uniqueDates.length; i++) {
            if (i === 0) { streak = 1 } else {
                const diff = (new Date(uniqueDates[i]).getTime() - new Date(uniqueDates[i - 1]).getTime()) / 86400000
                streak = diff === 1 ? streak + 1 : 1
            }
            maxStreak = Math.max(maxStreak, streak)
        }
        setBestStreak(maxStreak)
    }

    const filteredFocusData = focusRange === '7' ? focusChartData.slice(-7) : focusChartData

    // Heatmap — last 12 weeks
    const heatmapDays: { date: string; count: number }[] = []
    for (let i = 83; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        heatmapDays.push({ date: key, count: heatmapData[key] ? 1 : 0 })
    }
    const heatmapWeeks: { date: string; count: number }[][] = []
    for (let i = 0; i < heatmapDays.length; i += 7) {
        heatmapWeeks.push(heatmapDays.slice(i, i + 7))
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: '#1a1a14', border: '1px solid #2a2a22', borderRadius: '8px', padding: '0.6rem 0.9rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>{label}</p>
                    <p style={{ fontSize: '0.75rem', color: '#f5f5f0' }}>{payload[0].value}{payload[0].name === 'score' ? '%' : ' min'}</p>
                </div>
            )
        }
        return null
    }

    if (loading) return (
        <main style={{ minHeight: '100vh', background: '#0d0d0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#5a5a4a', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>Loading stats...</p>
        </main>
    )

    return (
        <main style={{ minHeight: '100vh', background: '#0d0d0a', color: '#f5f5f0', fontFamily: 'Inter, sans-serif' }}>

            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 2rem', borderBottom: '1px solid #1a1a14',
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

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <p style={{ fontSize: '0.7rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        StudyOS / Statistics
                    </p>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>📊 Your Stats</h1>
                    <p style={{ fontSize: '0.85rem', color: '#5a5a4a' }}>Track your progress. See how far you've come.</p>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                    {[
                        { label: 'Total Focus Hours', value: `${totalFocusHours}h`, icon: '⏱️' },
                        { label: 'Focus Sessions', value: totalSessions, icon: '🎯' },
                        { label: 'Avg Quiz Score', value: `${avgQuizScore}%`, icon: '📝' },
                        { label: 'Best Streak', value: `${bestStreak} days`, icon: '🔥' },
                    ].map(stat => (
                        <div key={stat.label} style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '12px', padding: '1.25rem' }}>
                            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b', marginBottom: '0.2rem' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Focus Time Chart */}
                <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.2rem' }}>Focus Time</h2>
                            <p style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>Minutes studied per day</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {(['7', '30'] as const).map(r => (
                                <button key={r} onClick={() => setFocusRange(r)} style={{
                                    padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                                    fontFamily: 'inherit', cursor: 'pointer', border: 'none',
                                    background: focusRange === r ? '#f59e0b' : '#1a1a14',
                                    color: focusRange === r ? '#0d0d0a' : '#5a5a4a',
                                }}>
                                    {r}d
                                </button>
                            ))}
                        </div>
                    </div>
                    {focusSessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</p>
                            <p style={{ fontSize: '0.82rem', color: '#3a3a30' }}>No focus sessions yet. Start your first one!</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={filteredFocusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f18" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: '#5a5a4a', fontSize: 11 }} axisLine={false} tickLine={false} interval={focusRange === '30' ? 4 : 0} />
                                <YAxis tick={{ fill: '#5a5a4a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.05)' }} />
                                <Bar dataKey="mins" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Quiz Score Chart */}
                <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.2rem' }}>Quiz Performance</h2>
                        <p style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>Score % per attempt</p>
                    </div>
                    {quizAttempts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</p>
                            <p style={{ fontSize: '0.82rem', color: '#3a3a30' }}>No quiz attempts yet. Upload notes and take a quiz!</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={quizChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f18" vertical={false} />
                                <XAxis dataKey="attempt" tick={{ fill: '#5a5a4a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#5a5a4a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone" dataKey="score" name="score"
                                    stroke="#f59e0b" strokeWidth={2.5}
                                    dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#f59e0b' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                    {quizAttempts.length > 0 && (
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1f1f18' }}>
                            <div>
                                <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginBottom: '0.2rem' }}>Best Score</p>
                                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>
                                    {Math.max(...quizChartData.map(q => q.score))}%
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginBottom: '0.2rem' }}>Total Attempts</p>
                                <p style={{ fontSize: '1rem', fontWeight: 800 }}>{quizAttempts.length}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginBottom: '0.2rem' }}>Perfect Scores</p>
                                <p style={{ fontSize: '1rem', fontWeight: 800 }}>
                                    {quizAttempts.filter((q: any) => q.score === q.total && q.total > 0).length}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Activity Heatmap */}
                <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '16px', padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.2rem' }}>Study Activity</h2>
                        <p style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>Last 12 weeks</p>
                    </div>
                    <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {heatmapWeeks.map((week, wi) => (
                            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {week.map((day, di) => (
                                    <div
                                        key={di}
                                        title={day.date}
                                        style={{
                                            width: '12px', height: '12px', borderRadius: '2px',
                                            background: day.count > 0 ? '#f59e0b' : '#1a1a14',
                                            opacity: day.count > 0 ? 1 : 1,
                                            flexShrink: 0,
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#3a3a30' }}>Less</span>
                        {[0.2, 0.4, 0.6, 0.8, 1].map(o => (
                            <div key={o} style={{ width: '10px', height: '10px', borderRadius: '2px', background: o === 0.2 ? '#1a1a14' : '#f59e0b', opacity: o }} />
                        ))}
                        <span style={{ fontSize: '0.65rem', color: '#3a3a30' }}>More</span>
                    </div>
                </div>

            </div>
        </main>
    )
}
