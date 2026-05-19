'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async () => {
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <main className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center px-6">
            <div className="w-full max-w-md bg-[#111120] border border-gray-800 rounded-2xl p-8">
                <h1 className="text-3xl font-black mb-1">Welcome back</h1>
                <p className="text-gray-400 text-sm mb-8">Sign in to your StudyOS account</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#0a0a12] border border-gray-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-violet-500 transition-all"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[#0a0a12] border border-gray-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-violet-500 transition-all"
                    />
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all mt-2"
                    >
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </div>

                <p className="text-gray-500 text-sm text-center mt-6">
                    Don't have an account?{' '}
                    <a href="/auth/signup" className="text-violet-400 hover:text-violet-300">
                        Create one
                    </a>
                </p>
            </div>
        </main>
    )
}