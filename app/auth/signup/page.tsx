'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUp() {
    const router = useRouter()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSignUp = async () => {
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        })
        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0d0d0a', color: '#fafaf5' }}>
            <div className="w-full max-w-md rounded-2xl p-8 border" style={{ background: '#111110', borderColor: '#1f1f18' }}>

                <span className="font-black text-lg tracking-tight">Study<span style={{ color: '#f59e0b' }}>OS</span></span>
                <h1 className="text-3xl font-black mt-4 mb-1">Create account</h1>
                <p className="text-sm mb-8" style={{ color: '#5a5a4a' }}>Join StudyOS and study smarter</p>

                {error && (
                    <div className="text-sm px-4 py-3 rounded-lg mb-6" style={{ background: '#2a1010', border: '1px solid #5a2020', color: '#ff8080' }}>
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="rounded-lg px-4 py-3 text-sm outline-none transition-all"
                        style={{ background: '#0d0d0a', border: '1px solid #1f1f18', color: '#fafaf5' }}
                    />
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-lg px-4 py-3 text-sm outline-none transition-all"
                        style={{ background: '#0d0d0a', border: '1px solid #1f1f18', color: '#fafaf5' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-lg px-4 py-3 text-sm outline-none transition-all"
                        style={{ background: '#0d0d0a', border: '1px solid #1f1f18', color: '#fafaf5' }}
                    />
                    <button
                        onClick={handleSignUp}
                        disabled={loading}
                        className="font-bold py-3 rounded-lg transition-all mt-2 text-[#0d0d0a]"
                        style={{ background: loading ? '#a06b00' : '#f59e0b' }}
                    >
                        {loading ? 'Creating account...' : 'Create Account →'}
                    </button>
                </div>

                <p className="text-sm text-center mt-6" style={{ color: '#3a3a30' }}>
                    Already have an account?{' '}
                    <a href="/auth/login" style={{ color: '#f59e0b' }}>Sign in</a>
                </p>
            </div>
        </main>
    )
}