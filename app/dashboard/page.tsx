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
    const [courseName, setCourseName] = useState('')
    const [courseCode, setCourseCode] = useState('')
    const [examDate, setExamDate] = useState('')
    const [taskTitle, setTaskTitle] = useState('')
    const [taskDue, setTaskDue] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/auth/login'); return }
            setUser(user)
            fetchCourses(user.id)
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
        setCourseName(''); setCourseCode(''); setExamDate('')
        setShowCourseModal(false); setSaving(false)
        fetchCourses(user.id)
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
                            <button onClick={() => setShowCourseModal(true)}
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
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1 }}>{s.name}</span>
                                        {s.exam_date && <span style={{ fontSize: '0.7rem', color: '#5a5a4a' }}>{new Date(s.exam_date).toLocaleDateString()}</span>}
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
                            <input
                                placeholder="Course title e.g. Human Anatomy"
                                value={courseName}
                                onChange={(e) => setCourseName(e.target.value)}
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
                            />
                            <input
                                placeholder="Course code e.g. ANAT301"
                                value={courseCode}
                                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f59e0b', fontSize: '0.875rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                            />
                            <div>
                                <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginBottom: '0.4rem', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Exam Date (optional)</p>
                                <input
                                    type="date"
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    style={{ width: '100%', background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={() => setShowCourseModal(false)}
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
        </main>
    )
}
