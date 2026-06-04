'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

function getGreeting(name: string) {
    const hour = new Date().getHours()
    const first = name?.split(' ')[0] || 'there'
    if (hour < 12) return `Good morning, ${first} 👋`
    if (hour < 17) return `Good afternoon, ${first} 👋`
    if (hour < 21) return `Good evening, ${first} 👋`
    return `Welcome back, ${first} 👋`
}

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [showCourseModal, setShowCourseModal] = useState(false)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [editCourse, setEditCourse] = useState<any | null>(null)
    const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null)
    const [courseName, setCourseName] = useState('')
    const [courseCode, setCourseCode] = useState('')
    const [examDate, setExamDate] = useState('')
    const [taskTitle, setTaskTitle] = useState('')
    const [taskDue, setTaskDue] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [achievementPopup, setAchievementPopup] = useState<{ title: string; description: string; icon: string; rarity: string } | null>(null)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/auth/login'); return }
            setUser(user)
            fetchCourses(user.id)
            checkAchievements(user.id)
            fetchTasks(user.id)
            setLoading(false)
        }
        init()
    }, [])

    const fetchCourses = async (userId: string) => {
        const { data } = await supabase.from('courses').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        if (data) setCourses(data)
    }

    const fetchTasks = async (userId: string) => {
        const { data } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        if (data) setTasks(data)
    }

    const addCourse = async () => {
        if (!courseName.trim()) return
        setSaving(true)
        const { error } = await supabase.from('courses').insert({
            user_id: user.id,
            name: courseName,
            color: '#f59e0b',
            exam_date: examDate || null,
            code: courseCode || null,
        })
        if (error) alert('Error: ' + error.message)
        resetCourseForm()
        setShowCourseModal(false); setSaving(false)
        fetchCourses(user.id)
    }

    const saveEditCourse = async () => {
        if (!editCourse || !courseName.trim()) return
        setSaving(true)
        const { error } = await supabase.from('courses').update({
            name: courseName,
            code: courseCode || null,
            exam_date: examDate || null,
        }).eq('id', editCourse.id)
        if (error) alert('Error: ' + error.message)
        resetCourseForm()
        setEditCourse(null); setSaving(false)
        fetchCourses(user.id)
    }

    const confirmDeleteCourse = async () => {
        if (!deleteCourseId) return
        setDeleting(true)
        await supabase.from('courses').delete().eq('id', deleteCourseId)
        setDeleteCourseId(null); setDeleting(false)
        fetchCourses(user.id)
    }

    const openEditCourse = (course: any) => {
        setCourseName(course.name)
        setCourseCode(course.code || '')
        setExamDate(course.exam_date ? course.exam_date.split('T')[0] : '')
        setEditCourse(course)
    }

    const resetCourseForm = () => {
        setCourseName(''); setCourseCode(''); setExamDate('')
    }

    const addTask = async () => {
        if (!taskTitle.trim()) return
        setSaving(true)
        const { error } = await supabase.from('tasks').insert({
            user_id: user.id, title: taskTitle,
            due_date: taskDue || null, completed: false
        })
        if (error) alert('Error: ' + error.message)
        setTaskTitle(''); setTaskDue('')
        setShowTaskModal(false); setSaving(false)
        fetchTasks(user.id)
    }

    const toggleTask = async (taskId: string, completed: boolean) => {
        await supabase.from('tasks').update({ completed: !completed }).eq('id', taskId)
        fetchTasks(user.id)
    }
    const checkAchievements = async (userId: string) => {
        const [
            { data: sessions },
            { data: materials },
            { data: panicPlans },
            { data: gradeEntries },
            { data: quizAttempts },
            { data: existing },
        ] = await Promise.all([
            supabase.from('focus_sessions').select('*').eq('user_id', userId),
            supabase.from('study_materials').select('id').eq('user_id', userId),
            supabase.from('panic_plans').select('*').eq('user_id', userId),
            supabase.from('grade_entries').select('units, grade').eq('user_id', userId),
            supabase.from('quiz_attempts').select('*').eq('user_id', userId),
            supabase.from('achievements').select('achievement_key').eq('user_id', userId),
        ])

        const existingKeys = (existing || []).map((a: any) => a.achievement_key)

        const totalSessions = sessions?.length || 0
        const totalHours = (sessions || []).reduce((acc: number, s: any) => acc + (s.duration_mins || 0), 0) / 60
        const materialCount = materials?.length || 0
        const panicCount = panicPlans?.length || 0
        const panicUnder72h = (panicPlans || []).some((p: any) => p.days_until_exam !== null && p.days_until_exam * 24 < 72)

        const sessionDates = [...new Set((sessions || []).map((s: any) => s.session_date))].sort()
        let maxStreak = 0, streak = 0
        for (let i = 0; i < sessionDates.length; i++) {
            if (i === 0) { streak = 1 } else {
                const diff = (new Date(sessionDates[i]).getTime() - new Date(sessionDates[i - 1]).getTime()) / 86400000
                streak = diff === 1 ? streak + 1 : 1
            }
            maxStreak = Math.max(maxStreak, streak)
        }

        const gradePoints: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 }
        const totalPoints = (gradeEntries || []).reduce((acc: number, e: any) => acc + (gradePoints[e.grade] || 0) * e.units, 0)
        const totalUnits = (gradeEntries || []).reduce((acc: number, e: any) => acc + e.units, 0)
        const cgpa = totalUnits > 0 ? totalPoints / totalUnits : 0

        const quiz90 = (quizAttempts || []).filter((q: any) => q.total > 0 && q.score / q.total >= 0.9).length
        const quiz100 = (quizAttempts || []).filter((q: any) => q.total > 0 && q.score === q.total).length
        const quiz80x10 = (quizAttempts || []).filter((q: any) => q.total > 0 && q.score / q.total >= 0.8).length >= 10

        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sessionsIn7Days = (sessions || []).filter((s: any) => new Date(s.created_at) >= sevenDaysAgo).length
        const nightOwl = (sessions || []).filter((s: any) => { const h = new Date(s.created_at).getHours(); return h >= 0 && h < 4 }).length
        const earlyBird = (sessions || []).filter((s: any) => new Date(s.created_at).getHours() < 6).length

        const checks: Record<string, boolean> = {
            deep_diver: totalSessions >= 5,
            locked_in: totalSessions >= 10,
            monk_mode: totalSessions >= 30,
            week_warrior: maxStreak >= 3,
            unstoppable: maxStreak >= 7,
            academic_machine: maxStreak >= 14,
            sharpshooter: quiz90 >= 1,
            perfect_run: quiz100 >= 1,
            exam_slayer: quiz80x10,
            rising_star: cgpa > 3.0,
            honor_roll: cgpa > 4.0,
            deans_list: cgpa > 4.5,
            ten_hours: totalHours >= 10,
            twenty_five_hours: totalHours >= 25,
            fifty_hours: totalHours >= 50,
            hundred_hours: totalHours >= 100,
            archivist: materialCount >= 15,
            knowledge_vault: materialCount >= 25,
            crisis_manager: panicCount >= 5,
            against_all_odds: panicUnder72h,
            night_owl: nightOwl >= 10,
            early_bird: earlyBird >= 1,
            survived_finals: sessionsIn7Days >= 15,
        }

        const META: Record<string, { title: string; description: string; icon: string; rarity: string }> = {
            deep_diver: { title: 'Deep Diver', description: 'Completed 5 focus sessions', icon: '🤿', rarity: 'Common' },
            locked_in: { title: 'Locked In', description: 'Completed 10 focus sessions', icon: '🔒', rarity: 'Rare' },
            monk_mode: { title: 'Monk Mode', description: 'Completed 30 focus sessions', icon: '🧘', rarity: 'Epic' },
            week_warrior: { title: 'Week Warrior', description: 'Studied 3 consecutive days', icon: '⚔️', rarity: 'Common' },
            unstoppable: { title: 'Unstoppable', description: 'Studied 7 consecutive days', icon: '🔥', rarity: 'Rare' },
            academic_machine: { title: 'Academic Machine', description: 'Studied 14 consecutive days', icon: '🤖', rarity: 'Legendary' },
            sharpshooter: { title: 'Sharpshooter', description: 'Scored 90%+ on a quiz', icon: '🎯', rarity: 'Rare' },
            perfect_run: { title: 'Perfect Run', description: 'Scored 100% on a quiz', icon: '💯', rarity: 'Epic' },
            exam_slayer: { title: 'Exam Slayer', description: 'Scored 80%+ on 10 quizzes', icon: '🗡️', rarity: 'Legendary' },
            rising_star: { title: 'Rising Star', description: 'CGPA above 3.0', icon: '⭐', rarity: 'Common' },
            honor_roll: { title: 'Honor Roll', description: 'CGPA above 4.0', icon: '🏅', rarity: 'Rare' },
            deans_list: { title: "Dean's List", description: 'CGPA above 4.5', icon: '🎖️', rarity: 'Epic' },
            ten_hours: { title: '10 Hours Strong', description: 'Studied 10 total hours', icon: '⏱️', rarity: 'Common' },
            twenty_five_hours: { title: 'Grind Mode', description: 'Studied 25 total hours', icon: '💪', rarity: 'Rare' },
            fifty_hours: { title: 'Half Century', description: 'Studied 50 total hours', icon: '🔋', rarity: 'Epic' },
            hundred_hours: { title: 'Century Scholar', description: 'Studied 100 total hours', icon: '👑', rarity: 'Legendary' },
            archivist: { title: 'Archivist', description: 'Stored 15 study materials', icon: '📚', rarity: 'Rare' },
            knowledge_vault: { title: 'Knowledge Vault', description: 'Stored 25 study materials', icon: '🏛️', rarity: 'Epic' },
            crisis_manager: { title: 'Crisis Manager', description: 'Generated 5 panic plans', icon: '🚨', rarity: 'Rare' },
            against_all_odds: { title: 'Against All Odds', description: 'Panic plan under 72 hours to exam', icon: '⚡', rarity: 'Epic' },
            night_owl: { title: 'Night Owl', description: 'Studied after midnight 10 times', icon: '🦉', rarity: 'Rare' },
            early_bird: { title: 'Early Bird', description: 'Completed a session before 6 AM', icon: '🌅', rarity: 'Rare' },
            survived_finals: { title: 'Survived Finals', description: '15 sessions in 7 days', icon: '🎓', rarity: 'Legendary' },
        }

        for (const [key, unlocked] of Object.entries(checks)) {
            if (unlocked && !existingKeys.includes(key)) {
                await supabase.from('achievements').insert({ user_id: userId, achievement_key: key })
                setAchievementPopup(META[key])
                break // show one at a time
            }
        }
    }

    if (loading) return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0a' }}>
            <p style={{ color: '#5a5a4a', fontSize: '0.875rem' }}>Loading...</p>
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
                <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
                    style={{ fontSize: '0.8rem', color: '#5a5a4a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Sign out
                </button>
            </nav>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>

                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '0.4rem' }}>
                        {getGreeting(user?.user_metadata?.full_name)}
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: '#5a5a4a' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                    {[
                        { label: 'Study Streak', value: '0 days', icon: '🔥' },
                        { label: 'Courses', value: `${courses.length}`, icon: '📚' },
                        { label: 'Tasks', value: `${tasks.filter(t => !t.completed).length} pending`, icon: '✅' },
                        { label: 'Focus Today', value: '0 min', icon: '⏱️' },
                    ].map((stat) => (
                        <div key={stat.label} style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '12px', padding: '1.25rem' }}>
                            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.2rem' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>

                    {/* Courses */}
                    <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '12px', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 700 }}>My Courses</h2>
                            <button onClick={() => { resetCourseForm(); setShowCourseModal(true) }}
                                style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f59e0b', color: '#0d0d0a', border: 'none', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                + Add
                            </button>
                        </div>
                        {courses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📚</p>
                                <p style={{ fontSize: '0.8rem', color: '#5a5a4a' }}>No courses yet. Add your first one!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {courses.map((s) => (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #1a1a14' }}>
                                        <div style={{ background: '#1f1f18', borderRadius: '5px', padding: '0.2rem 0.5rem', flexShrink: 0 }}>
                                            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>
                                                {s.code || '—'}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                                        {s.exam_date && <span style={{ fontSize: '0.7rem', color: '#5a5a4a', flexShrink: 0 }}>{new Date(s.exam_date).toLocaleDateString()}</span>}
                                        {/* Edit / Delete */}
                                        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                                            <button onClick={() => openEditCourse(s)} style={{ padding: '0.25rem 0.5rem', borderRadius: '5px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                Edit
                                            </button>
                                            <button onClick={() => setDeleteCourseId(s.id)} style={{ padding: '0.25rem 0.5rem', borderRadius: '5px', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#f87171', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                Del
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tasks */}
                    <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '12px', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Today's Tasks</h2>
                            <button onClick={() => setShowTaskModal(true)}
                                style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f59e0b', color: '#0d0d0a', border: 'none', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                + Add
                            </button>
                        </div>
                        {tasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</p>
                                <p style={{ fontSize: '0.8rem', color: '#5a5a4a' }}>No tasks yet. Add something to do!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {tasks.map((t) => (
                                    <div key={t.id} onClick={() => toggleTask(t.id, t.completed)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1f1f18', cursor: 'pointer' }}>
                                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${t.completed ? '#f59e0b' : '#3a3a30'}`, background: t.completed ? '#f59e0b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {t.completed && <span style={{ color: '#0d0d0a', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', flex: 1, textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#5a5a4a' : '#f5f5f0' }}>
                                            {t.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {[
                        { label: 'AI Assistant', icon: '🤖', href: '/assistant', desc: 'Upload notes & generate materials' },
                        { label: 'Focus Mode', icon: '⏱️', href: '/focus', desc: 'Start a Pomodoro session' },
                        { label: 'Panic Mode', icon: '🚨', href: '/panic', desc: 'AI crash revision planner' },
                        { label: 'Library', icon: '📖', href: '/library', desc: 'Your saved study materials' },
                        { label: 'Grade Entries', icon: '🎓', href: '/grade-entries', desc: 'Track grades & CGPA' },
                    ].map((link) => (
                        <a key={link.label} href={link.href}
                            style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '12px', padding: '1.25rem', textDecoration: 'none', color: 'inherit', display: 'block' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#1f1f18'}
                        >
                            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{link.icon}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>{link.label}</div>
                            <div style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>{link.desc}</div>
                        </a>
                    ))}
                </div>

            </div>

            {/* Add Course Modal */}
            {showCourseModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.75)' }}>
                    <div style={{ width: '100%', maxWidth: '420px', background: '#111110', border: '1px solid #1f1f18', borderRadius: '16px', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>Add Course</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input placeholder="Course title e.g. Human Anatomy" value={courseName} onChange={(e) => setCourseName(e.target.value)}
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }} />
                            <input placeholder="Course code e.g. ANAT301" value={courseCode} onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f59e0b', fontSize: '0.875rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.05em' }} />
                            <div>
                                <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginBottom: '0.4rem', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Exam Date (optional)</p>
                                <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)}
                                    style={{ width: '100%', background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={() => { resetCourseForm(); setShowCourseModal(false) }}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #1f1f18', background: 'none', color: '#5a5a4a', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Cancel
                                </button>
                                <button onClick={addCourse} disabled={saving}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#0d0d0a', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {saving ? 'Saving...' : 'Add Course'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Course Modal */}
            {editCourse && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.75)' }}>
                    <div style={{ width: '100%', maxWidth: '420px', background: '#111110', border: '1px solid #1f1f18', borderRadius: '16px', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>Edit Course</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input placeholder="Course title" value={courseName} onChange={(e) => setCourseName(e.target.value)}
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }} />
                            <input placeholder="Course code" value={courseCode} onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f59e0b', fontSize: '0.875rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.05em' }} />
                            <div>
                                <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginBottom: '0.4rem', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Exam Date (optional)</p>
                                <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)}
                                    style={{ width: '100%', background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={() => { resetCourseForm(); setEditCourse(null) }}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #1f1f18', background: 'none', color: '#5a5a4a', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Cancel
                                </button>
                                <button onClick={saveEditCourse} disabled={saving}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#0d0d0a', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Course Modal */}
            {deleteCourseId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.75)' }}>
                    <div style={{ width: '100%', maxWidth: '380px', background: '#111110', border: '1px solid #2a2a22', borderRadius: '16px', padding: '2rem' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Delete course?</p>
                        <p style={{ fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            This will permanently remove this course. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDeleteCourseId(null)}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancel
                            </button>
                            <button onClick={confirmDeleteCourse} disabled={deleting}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Task Modal */}
            {showTaskModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.75)' }}>
                    <div style={{ width: '100%', maxWidth: '420px', background: '#111110', border: '1px solid #1f1f18', borderRadius: '16px', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>Add Task</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }} />
                            <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)}
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={() => setShowTaskModal(false)}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #1f1f18', background: 'none', color: '#5a5a4a', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Cancel
                                </button>
                                <button onClick={addTask} disabled={saving}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#0d0d0a', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {saving ? 'Saving...' : 'Add Task'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Achievement Popup */}
            {achievementPopup && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#111110', border: `1px solid ${achievementPopup.rarity === 'Legendary' ? '#f59e0b50' : achievementPopup.rarity === 'Epic' ? '#a855f750' : achievementPopup.rarity === 'Rare' ? '#3b82f650' : '#8a8a7a50'}`, borderRadius: '20px', padding: '2.5rem 2rem', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Achievement Unlocked</p>
                        <div style={{ width: '80px', height: '80px', borderRadius: '18px', margin: '0 auto 1.25rem', background: 'rgba(245,158,11,0.08)', border: '2px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                            {achievementPopup.icon}
                        </div>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem' }}>{achievementPopup.title}</p>
                        <p style={{ fontSize: '0.85rem', color: '#8a8a7a', marginBottom: '0.75rem', lineHeight: 1.5 }}>{achievementPopup.description}</p>
                        <span style={{ display: 'inline-block', fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.08em', padding: '0.25rem 0.75rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700 }}>
                            {achievementPopup.rarity.toUpperCase()}
                        </span>
                        <button onClick={() => setAchievementPopup(null)} style={{ display: 'block', width: '100%', padding: '0.85rem', borderRadius: '10px', border: 'none', background: '#f59e0b', color: '#0d0d0a', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Let's go! 🎉
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}
function checkAchievements(id: string) {
    throw new Error('Function not implemented.')
}

