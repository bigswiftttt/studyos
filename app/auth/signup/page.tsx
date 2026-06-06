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
  const [googleLoading, setGoogleLoading] = useState(false)
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

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d0d0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.03em', color: '#f5f5f0' }}>
            Study<span style={{ color: '#f59e0b' }}>OS</span>
          </span>
        </div>

        <div style={{
          background: '#111110',
          border: '1px solid #1f1f18',
          borderRadius: '16px',
          padding: '2rem'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#f5f5f0',
            marginBottom: '0.35rem'
          }}>Create account</h1>
          <p style={{ fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '1.75rem' }}>
            Join StudyOS and study smarter
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.82rem',
              color: '#f87171',
              marginBottom: '1.25rem'
            }}>
              {error}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            style={{
              width: '100%', padding: '0.85rem', borderRadius: '8px',
              border: '1px solid #2a2a22', background: '#1a1a14',
              color: '#f5f5f0', fontSize: '0.875rem', fontWeight: 600,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.6rem', marginBottom: '1.25rem',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#3a3a30'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a22'}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#2a2a22' }} />
            <span style={{ fontSize: '0.72rem', color: '#3a3a30', fontFamily: 'monospace' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#2a2a22' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                background: '#0d0d0a', border: '1px solid #2a2a22',
                borderRadius: '8px', padding: '0.85rem 1rem',
                color: '#f5f5f0', fontSize: '0.875rem',
                outline: 'none', fontFamily: 'inherit', width: '100%',
                boxSizing: 'border-box' as const
              }}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: '#0d0d0a', border: '1px solid #2a2a22',
                borderRadius: '8px', padding: '0.85rem 1rem',
                color: '#f5f5f0', fontSize: '0.875rem',
                outline: 'none', fontFamily: 'inherit', width: '100%',
                boxSizing: 'border-box' as const
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: '#0d0d0a', border: '1px solid #2a2a22',
                borderRadius: '8px', padding: '0.85rem 1rem',
                color: '#f5f5f0', fontSize: '0.875rem',
                outline: 'none', fontFamily: 'inherit', width: '100%',
                boxSizing: 'border-box' as const
              }}
            />
            <button
              onClick={handleSignUp}
              disabled={loading}
              style={{
                background: loading ? '#a06b00' : '#f59e0b',
                color: '#0d0d0a', border: 'none', borderRadius: '8px',
                padding: '0.9rem', fontSize: '0.9rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', marginTop: '0.25rem', width: '100%'
              }}
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: '#5a5a4a' }}>
            Already have an account?{' '}
            <a href="/auth/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}