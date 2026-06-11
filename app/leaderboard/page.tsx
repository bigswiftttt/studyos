'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

type LeaderboardEntry = {
    rank: number
    name: string
    totalStudyMins: number
    focusMins: number
    quizMins: number
    materialMins: number
    isCurrentUser: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

function formatMins(mins: number): string {
    if (mins < 60) return `${Math.round(mins)}m`
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function anonymizeName(fullName: string): string {
    if (!fullName) return 'Anonymous'
    const parts = fullName.trim().split(' ')
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export default function Leaderboard() {
    const router = useRouter()
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [range, setRange] = useState<'week' | 'month' | 'all'>('week')
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/auth/login'); return }
            setCurrentUserId(user.id)
            await fetchLeaderboard(user.id, range)
            setLoading(false)
        }
        init()
    }, [])

    useEffect(() => {
        if (currentUserId) fetchLeaderboard(currentUserId, range)
    }, [range])

    const fetchLeaderboard = async (userId: string, r: 'week' | 'month' | 'all') => {
        setLoading(true)

        // Calculate date filter
        let since: string | null = null
        if (r === 'week') {
            const d = new Date(); d.setDate(d.getDate() - 7)
            since = d.toISOString()
        } else if (r === 'month') {
            const d = new Date(); d.setDate(d.getDate() - 30)
            since = d.toISOString()
        }

        // Fetch all data in parallel
        const [focusRes, quizRes, materialRes, profileRes] = await Promise.all([
            since
                ? supabase.from('focus_sessions').select('user_id, duration_mins, created_at').gte('created_at', since)
                : supabase.from('focus_sessions').select('user_id, duration_mins, created_at'),
            since
                ? supabase.from('quiz_attempts').select('user_id, total, created_at').gte('created_at', since)
                : supabase.from('quiz_attempts').select('user_id, total, created_at'),
            since
                ? supabase.from('study_materials').select('user_id, created_at').gte('created_at', since)
                : supabase.from('study_materials').select('user_id, created_at'),
            supabase.from('profiles').select('id, full_name'),
        ])

        const focusSessions = focusRes.data || []
        const quizAttempts = quizRes.data || []
        const materials = materialRes.data || []
        const profiles = profileRes.data || []

        // Build score per user
        const scores: Record<string, { focusMins: number; quizMins: number; materialMins: number }> = {}

        const ensureUser = (uid: string) => {
            if (!scores[uid]) scores[uid] = { focusMins: 0, quizMins: 0, materialMins: 0 }
        }

        // Focus mins — actual duration
        focusSessions.forEach((s: any) => {
            ensureUser(s.user_id)
            scores[s.user_id].focusMins += s.duration_mins || 0
        })

        // Quiz mins — each question = 0.75 mins (45 seconds)
        quizAttempts.forEach((q: any) => {
            ensureUser(q.user_id)
            scores[q.user_id].quizMins += (q.total || 0) * 0.75
        })

        // Material mins — each material = 5 mins
        materials.forEach((m: any) => {
            ensureUser(m.user_id)
            scores[m.user_id].materialMins += 5
        })

        // Build profile map
        const profileMap: Record<string, string> = {}
        profiles.forEach((p: any) => { profileMap[p.id] = p.full_name || 'Anonymous' })

        // Also fetch current user's metadata if not in profiles
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser && !profileMap[authUser.id]) {
            profileMap[authUser.id] = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'You'
        }

        // Sort by total study mins
        const sorted = Object.entries(scores)
            .map(([uid, s]) => ({
                uid,
                name: anonymizeName(profileMap[uid] || 'Anonymous'),
                focusMins: s.focusMins,
                quizMins: s.quizMins,
                materialMins: s.materialMins,
                totalStudyMins: s.focusMins + s.quizMins + s.materialMins,
                isCurrentUser: uid === userId,
            }))
            .sort((a, b) => b.totalStudyMins - a.totalStudyMins)
            .map((entry, i) => ({ ...entry, rank: i + 1 }))

        // Top 10 for display
        const top10 = sorted.slice(0, 10)

        // Find current user's rank (even if outside top 10)
        const currentUserEntry = sorted.find(e => e.isCurrentUser)
        if (currentUserEntry && currentUserEntry.rank > 10) {
            setUserRank(currentUserEntry)
        } else {
            setUserRank(null)
        }

        setEntries(top10)
        setLoading(false)
    }

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

            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <p style={{ fontSize: '0.7rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        StudyOS / Leaderboard
                    </p>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>🏆 Leaderboard</h1>
                    <p style={{ fontSize: '0.85rem', color: '#5a5a4a' }}>Ranked by total study time — focus sessions, quizzes & AI assistant usage.</p>
                </div>

                {/* Range Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: '#111110', border: '1px solid #1f1f18', borderRadius: '10px', padding: '0.35rem' }}>
                    {(['week', 'month', 'all'] as const).map(r => (
                        <button key={r} onClick={() => setRange(r)} style={{
                            flex: 1, padding: '0.5rem', borderRadius: '7px', border: 'none',
                            background: range === r ? '#f59e0b' : 'transparent',
                            color: range === r ? '#0d0d0a' : '#5a5a4a',
                            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.15s'
                        }}>
                            {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'All Time'}
                        </button>
                    ))}
                </div>

                {/* Leaderboard List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <p style={{ fontSize: '0.82rem', color: '#3a3a30', fontFamily: 'monospace' }}>Loading...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', background: '#111110', border: '1px solid #1f1f18', borderRadius: '16px' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</p>
                        <p style={{ fontSize: '0.875rem', color: '#5a5a4a' }}>No activity yet for this period. Start studying to appear here!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {entries.map((entry, i) => (
                            <div key={i} style={{
                                background: entry.isCurrentUser ? 'rgba(245,158,11,0.06)' : '#111110',
                                border: `1px solid ${entry.isCurrentUser ? '#f59e0b40' : '#1f1f18'}`,
                                borderRadius: '14px', padding: '1.1rem 1.25rem',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* Top strip for #1 */}
                                {entry.rank === 1 && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />
                                )}

                                {/* Rank */}
                                <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                                    {entry.rank <= 3
                                        ? <span style={{ fontSize: '1.25rem' }}>{MEDALS[entry.rank - 1]}</span>
                                        : <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3a3a30', fontFamily: 'monospace' }}>#{entry.rank}</span>
                                    }
                                </div>

                                {/* Name */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: entry.isCurrentUser ? '#f59e0b' : '#f5f5f0' }}>
                                            {entry.name}
                                        </p>
                                        {entry.isCurrentUser && (
                                            <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>YOU</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: '#5a5a4a', fontFamily: 'monospace' }}>⏱️ {formatMins(entry.focusMins)}</span>
                                        <span style={{ fontSize: '0.65rem', color: '#5a5a4a', fontFamily: 'monospace' }}>❓ {formatMins(entry.quizMins)}</span>
                                        <span style={{ fontSize: '0.65rem', color: '#5a5a4a', fontFamily: 'monospace' }}>📄 {formatMins(entry.materialMins)}</span>
                                    </div>
                                </div>

                                {/* Total */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontSize: '1rem', fontWeight: 900, color: entry.rank === 1 ? '#f59e0b' : '#f5f5f0' }}>
                                        {formatMins(entry.totalStudyMins)}
                                    </p>
                                    <p style={{ fontSize: '0.65rem', color: '#3a3a30', fontFamily: 'monospace' }}>total</p>
                                </div>
                            </div>
                        ))}

                        {/* Current user rank if outside top 10 */}
                        {userRank && (
                            <>
                                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                                    <span style={{ fontSize: '0.65rem', color: '#3a3a30', fontFamily: 'monospace' }}>· · ·</span>
                                </div>
                                <div style={{
                                    background: 'rgba(245,158,11,0.06)', border: '1px solid #f59e0b40',
                                    borderRadius: '14px', padding: '1.1rem 1.25rem',
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                }}>
                                    <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#5a5a4a', fontFamily: 'monospace' }}>#{userRank.rank}</span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>{userRank.name}</p>
                                            <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>YOU</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#5a5a4a', fontFamily: 'monospace' }}>⏱️ {formatMins(userRank.focusMins)}</span>
                                            <span style={{ fontSize: '0.65rem', color: '#5a5a4a', fontFamily: 'monospace' }}>❓ {formatMins(userRank.quizMins)}</span>
                                            <span style={{ fontSize: '0.65rem', color: '#5a5a4a', fontFamily: 'monospace' }}>📄 {formatMins(userRank.materialMins)}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontSize: '1rem', fontWeight: 900 }}>{formatMins(userRank.totalStudyMins)}</p>
                                        <p style={{ fontSize: '0.65rem', color: '#3a3a30', fontFamily: 'monospace' }}>total</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.68rem', color: '#2a2a22', marginTop: '2rem', fontFamily: 'monospace' }}>
                    Names are anonymized. Rankings update in real time.
                </p>

            </div>
        </main>
    )
}