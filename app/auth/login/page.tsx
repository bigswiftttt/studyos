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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d0d0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{width: '100%', maxWidth: '420px', padding: '0 1rem', boxSizing: 'border-box'}}>

  {/* Logo */}
  <div style={{textAlign: 'center', marginBottom: '2.5rem'}}>
    <span style={{fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.03em', color: '#f5f5f0'}}>
      Study<span style={{color: '#f59e0b'}}>OS</span>
    </span>
  </div>

  {/* Card */}
  <div style={{
    background: '#161612',
    border: '1px solid #2a2a22',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    boxSizing: 'border-box'
  }}>
    <h1 style={{
      fontSize: '1.5rem',
      fontWeight: 800,
      letterSpacing: '-0.025em',
      color: '#f5f5f0',
      marginBottom: '0.35rem'
    }}>
          }}>Welcome back</h1>
          <p style={{fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '1.75rem'}}>
            Sign in to your StudyOS account
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

          <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{
                background: '#0d0d0a',
                border: '1px solid #2a2a22',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                color: '#f5f5f0',
                fontSize: '0.875rem',
                outline: 'none',
                fontFamily: 'inherit',
                width: '100%'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{
                background: '#0d0d0a',
                border: '1px solid #2a2a22',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                color: '#f5f5f0',
                fontSize: '0.875rem',
                outline: 'none',
                fontFamily: 'inherit',
                width: '100%'
              }}
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                background: loading ? '#a06b00' : '#f59e0b',
                color: '#0d0d0a',
                border: 'none',
                borderRadius: '8px',
                padding: '0.9rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                marginTop: '0.25rem',
                width: '100%'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </div>

          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.82rem',
            color: '#5a5a4a'
          }}>
            Don't have an account?{' '}
            <a href="/auth/signup" style={{color: '#f59e0b', textDecoration: 'none', fontWeight: 600}}>
              Create one
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}