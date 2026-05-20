'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
            } else {
                setUser(user)
                setLoading(false)
            }
        }
        getUser()
    }, [])

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d0a' }}>
                <p style={{ color: '#5a5a4a' }}>Loading...</p>
            </main>
        )
    }

    return (
        <main className="min-h-screen p-8" style={{ background: '#0d0d0a', color: '#fafaf5' }}>
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">
                            Good morning, {user?.user_metadata?.full_name || 'Student'} 👋
                        </h1>
                        <p style={{ color: '#5a5a4a' }} className="mt-1">Here's your study overview for today</p>
                    </div>
                    <span className="font-black text-lg">Study<span style={{ color: '#f59e0b' }}>OS</span></span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Study Streak', value: '0 days', icon: '🔥' },
                        { label: 'Hours This Week', value: '0h', icon: '⏱️' },
                        { label: 'Tasks Done', value: '0/0', icon: '✅' },
                        { label: 'Subjects', value: '0', icon: '📚' },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-xl p-5 border" style={{ background: '#111110', borderColor: '#1f1f18' }}>
                            <div className="text-2xl mb-3">{stat.icon}</div>
                            <div className="text-2xl font-black">{stat.value}</div>
                            <div className="text-sm mt-1" style={{ color: '#5a5a4a' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Subjects + Tasks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-xl p-6 border" style={{ background: '#111110', borderColor: '#1f1f18' }}>
                        <h2 className="font-bold text-lg mb-4">📚 My Subjects</h2>
                        <p className="text-sm" style={{ color: '#5a5a4a' }}>No subjects yet. Add your first subject!</p>
                        <button className="mt-4 font-bold px-4 py-2 rounded-lg text-sm transition-all text-[#0d0d0a]" style={{ background: '#f59e0b' }}>
                            + Add Subject
                        </button>
                    </div>

                    <div className="rounded-xl p-6 border" style={{ background: '#111110', borderColor: '#1f1f18' }}>
                        <h2 className="font-bold text-lg mb-4">✅ Today's Tasks</h2>
                        <p className="text-sm" style={{ color: '#5a5a4a' }}>No tasks yet. Add something to do!</p>
                        <button className="mt-4 font-bold px-4 py-2 rounded-lg text-sm transition-all text-[#0d0d0a]" style={{ background: '#f59e0b' }}>
                            + Add Task
                        </button>
                    </div>
                </div>

                {/* Nav Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {[
                        { label: '🤖 AI Assistant', href: '/assistant' },
                        { label: '⏱️ Focus Mode', href: '/focus' },
                        { label: '🚨 Panic Mode', href: '/panic' },
                        { label: '📖 Materials', href: '/materials' },
                    ].map((link) => (
                        <a key={link.label} href={link.href} className="rounded-xl p-4 border text-sm font-bold text-center transition-all hover:border-[#f59e0b]" style={{ background: '#111110', borderColor: '#1f1f18', color: '#8a8a7a' }}>
                            {link.label}
                        </a>
                    ))}
                </div>

                <button
                    onClick={async () => {
                        await supabase.auth.signOut()
                        router.push('/')
                    }}
                    className="text-sm transition-all"
                    style={{ color: '#3a3a30' }}
                >
                    Sign out
                </button>
            </div>
        </main>
    )
}