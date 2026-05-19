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
            <main className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#0a0a12] text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-black mb-1">
                    Good morning, {user?.user_metadata?.full_name || 'Student'} 👋
                </h1>
                <p className="text-gray-400 mb-8">Here's your study overview for today</p>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Study Streak', value: '0 days', icon: '🔥' },
                        { label: 'Hours This Week', value: '0h', icon: '⏱️' },
                        { label: 'Tasks Done', value: '0/0', icon: '✅' },
                        { label: 'Subjects', value: '0', icon: '📚' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-[#111120] border border-gray-800 rounded-xl p-4">
                            <div className="text-2xl mb-2">{stat.icon}</div>
                            <div className="text-2xl font-black">{stat.value}</div>
                            <div className="text-gray-400 text-sm">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Subjects + Tasks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#111120] border border-gray-800 rounded-xl p-6">
                        <h2 className="font-bold text-lg mb-4">📚 My Subjects</h2>
                        <p className="text-gray-500 text-sm">No subjects yet. Add your first subject!</p>
                        <button className="mt-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all">
                            + Add Subject
                        </button>
                    </div>

                    <div className="bg-[#111120] border border-gray-800 rounded-xl p-6">
                        <h2 className="font-bold text-lg mb-4">✅ Today's Tasks</h2>
                        <p className="text-gray-500 text-sm">No tasks yet. Add something to do!</p>
                        <button className="mt-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all">
                            + Add Task
                        </button>
                    </div>
                </div>

                {/* Sign out */}
                <button
                    onClick={async () => {
                        await supabase.auth.signOut()
                        router.push('/')
                    }}
                    className="mt-8 text-gray-500 hover:text-gray-300 text-sm transition-all"
                >
                    Sign out
                </button>
            </div>
        </main>
    )
}