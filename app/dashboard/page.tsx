'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

const COLORS = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316']

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [subjects, setSubjects] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [showSubjectModal, setShowSubjectModal] = useState(false)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [subjectName, setSubjectName] = useState('')
    const [subjectColor, setSubjectColor] = useState('#f59e0b')
    const [examDate, setExamDate] = useState('')
    const [taskTitle, setTaskTitle] = useState('')
    const [taskDue, setTaskDue] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/auth/login'); return }
            setUser(user)
            fetchSubjects(user.id)
            fetchTasks(user.id)
            setLoading(false)
        }
        init()
    }, [])

    const fetchSubjects = async (userId: string) => {
        const { data } = await supabase.from('subjects').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        if (data) setSubjects(data)
    }

    const fetchTasks = async (userId: string) => {
        const { data } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        if (data) setTasks(data)
    }

    const addSubject = async () => {
        if (!subjectName.trim()) return
        setSaving(true)
        const { error } = await supabase.from('subjects').insert({
            user_id: user.id,
            name: subjectName,
            color: subjectColor,
            exam_date: examDate || null
        })
        if (error) alert('Error: ' + error.message)
        setSubjectName('')
        setExamDate('')
        setSubjectColor('#f59e0b')
        setShowSubjectModal(false)
        setSaving(false)
        fetchSubjects(user.id)
    }

    const addTask = async () => {
        if (!taskTitle.trim()) return
        setSaving(true)
        const { error } = await supabase.from('tasks').insert({
            user_id: user.id,
            title: taskTitle,
            due_date: taskDue || null,
            completed: false
        })
        if (error) alert('Error: ' + error.message)
        setTaskTitle('')
        setTaskDue('')
        setShowTaskModal(false)
        setSaving(false)
        fetchTasks(user.id)
    }

    const toggleTask = async (taskId: string, completed: boolean) => {
        await supabase.from('tasks').update({ completed: !completed }).eq('id', taskId)
        fetchTasks(user.id)
    }

    if (loading) return (
        <main className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d0a' }}>
            <p style={{ color: '#5a5a4a' }}>Loading...</p>
        </main>
    )

    return (
        <main className="min-h-screen p-8" style={{ background: '#0d0d0a', color: '#fafaf5' }}>
            <div className="max-w-6xl mx-auto">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">
                            Good morning, {user?.user_metadata?.full_name || 'Student'} 👋
                        </h1>
                        <p className="mt-1" style={{ color: '#5a5a4a' }}>Here's your study overview for today</p>
                    </div>
                    <span className="font-black text-lg">Study<span style={{ color: '#f59e0b' }}>OS</span></span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Study Streak', value: '0 days', icon: '🔥' },
                        { label: 'Hours This Week', value: '0h', icon: '⏱️' },
                        { label: 'Tasks Done', value: `${tasks.filter(t => t.completed).length}/${tasks.length}`, icon: '✅' },
                        { label: 'Subjects', value: `${subjects.length}`, icon: '📚' },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-xl p-5 border" style={{ background: '#111110', borderColor: '#1f1f18' }}>
                            <div className="text-2xl mb-3">{stat.icon}</div>
                            <div className="text-2xl font-black">{stat.value}</div>
                            <div className="text-sm mt-1" style={{ color: '#5a5a4a' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-xl p-6 border" style={{ background: '#111110', borderColor: '#1f1f18' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-lg">📚 My Subjects</h2>
                            <button onClick={() => setShowSubjectModal(true)} className="text-xs font-bold px-3 py-1 rounded-lg text-[#0d0d0a]" style={{ background: '#f59e0b' }}>
                                + Add
                            </button>
                        </div>
                        {subjects.length === 0 ? (
                            <p className="text-sm" style={{ color: '#5a5a4a' }}>No subjects yet. Add your first!</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {subjects.map((s) => (
                                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: '#1f1f18' }}>
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }}></div>
                                        <span className="font-medium text-sm flex-1">{s.name}</span>
                                        {s.exam_date && (
                                            <span className="text-xs font-mono" style={{ color: '#5a5a4a' }}>
                                                {new Date(s.exam_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl p-6 border" style={{ background: '#111110', borderColor: '#1f1f18' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-lg">✅ Today's Tasks</h2>
                            <button onClick={() => setShowTaskModal(true)} className="text-xs font-bold px-3 py-1 rounded-lg text-[#0d0d0a]" style={{ background: '#f59e0b' }}>
                                + Add
                            </button>
                        </div>
                        {tasks.length === 0 ? (
                            <p className="text-sm" style={{ color: '#5a5a4a' }}>No tasks yet. Add something to do!</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {tasks.map((t) => (
                                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer" style={{ borderColor: '#1f1f18' }} onClick={() => toggleTask(t.id, t.completed)}>
                                        <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0" style={{ borderColor: t.completed ? '#f59e0b' : '#3a3a30', background: t.completed ? '#f59e0b' : 'transparent' }}>
                                            {t.completed && <span className="text-[#0d0d0a] text-xs font-black">✓</span>}
                                        </div>
                                        <span className="text-sm flex-1" style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#5a5a4a' : '#fafaf5' }}>
                                            {t.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {[
                        { label: '🤖 AI Assistant', href: '/assistant' },
                        { label: '⏱️ Focus Mode', href: '/focus' },
                        { label: '🚨 Panic Mode', href: '/panic' },
                        { label: '📖 Materials', href: '/materials' },
                    ].map((link) => (
                        <a key={link.label} href={link.href} className="rounded-xl p-4 border text-sm font-bold text-center transition-all" style={{ background: '#111110', borderColor: '#1f1f18', color: '#8a8a7a' }}>
                            {link.label}
                        </a>
                    ))}
                </div>

                <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="text-sm" style={{ color: '#3a3a30' }}>
                    Sign out
                </button>
            </div>

            {showSubjectModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6 border" style={{ background: '#111110', borderColor: '#1f1f18' }}>
                        <h3 className="font-black text-lg mb-4">Add Subject</h3>
                        <div className="flex flex-col gap-3">
                            <input
                                placeholder="Subject name"
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                className="rounded-lg px-4 py-3 text-sm outline-none"
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', color: '#fafaf5' }}
                            />
                            <div>
                                <p className="text-xs mb-2" style={{ color: '#5a5a4a' }}>Pick a color</p>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map((c) => (
                                        <div key={c} onClick={() => setSubjectColor(c)} className="w-7 h-7 rounded-full cursor-pointer flex items-center justify-center" style={{ background: c, outline: subjectColor === c ? '2px solid #fafaf5' : 'none', outlineOffset: '2px' }}>
                                            {subjectColor === c && <span className="text-xs font-black text-white">✓</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <input
                                type="date"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                className="rounded-lg px-4 py-3 text-sm outline-none"
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', color: '#fafaf5' }}
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setShowSubjectModal(false)} className="flex-1 py-2 rounded-lg text-sm font-bold border" style={{ borderColor: '#1f1f18', color: '#5a5a4a' }}>
                                    Cancel
                                </button>
                                <button onClick={addSubject} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-bold text-[#0d0d0a]" style={{ background: '#f59e0b' }}>
                                    {saving ? 'Saving...' : 'Add Subject'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showTaskModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6 border" style={{ background: '#111110', borderColor: '#1f1f18' }}>
                        <h3 className="font-black text-lg mb-4">Add Task</h3>
                        <div className="flex flex-col gap-3">
                            <input
                                placeholder="Task title"
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                className="rounded-lg px-4 py-3 text-sm outline-none"
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', color: '#fafaf5' }}
                            />
                            <input
                                type="date"
                                value={taskDue}
                                onChange={(e) => setTaskDue(e.target.value)}
                                className="rounded-lg px-4 py-3 text-sm outline-none"
                                style={{ background: '#0d0d0a', border: '1px solid #1f1f18', color: '#fafaf5' }}
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setShowTaskModal(false)} className="flex-1 py-2 rounded-lg text-sm font-bold border" style={{ borderColor: '#1f1f18', color: '#5a5a4a' }}>
                                    Cancel
                                </button>
                                <button onClick={addTask} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-bold text-[#0d0d0a]" style={{ background: '#f59e0b' }}>
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