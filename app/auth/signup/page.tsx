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
            options: {
                data: { full_name: fullName }
            }
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
                <h1 className="text-3xl font-black mb-1">Create account</h1>
                <p className="text-gray-400 text-sm mb-8">Join StudyOS and study smarter</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-[#0a0a12] border border-gray-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-violet-500 transition-all"
                    />
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
                        onClick={handleSignUp}
                        disabled={loading}
                        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all mt-2"
                    >
                        {loading ? 'Creating account...' : 'Create Account →'}
                    </button>
                </div>

                <p className="text-gray-500 text-sm text-center mt-6">
                    Already have an account?{' '}
                    <a href="/auth/login" className="text-violet-400 hover:text-violet-300">
                        Sign in
                    </a>
                </p>
            </div>
        </main>
    )
}