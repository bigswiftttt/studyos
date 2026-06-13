'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
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
      <div style={{width: '100%', maxWidth: '420px', boxSizing: 'border-box'}}>

        <div style={{textAlign: 'center', marginBottom: '2.5rem'}}>
          <span style={{fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.03em', color: '#f5f5f0'}}>
            Study<span style={{color: '#f59e0b'}}>OS</span>
          </span>
        </div>

        <div style={{
          background: '#161612',
          border: '1px solid #2a2a22',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {sent ? (
            <div style={{textAlign: 'center'}}>
              <p style={{fontSize: '2rem', marginBottom: '1rem'}}>📬</p>
              <h1 style={{fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f5f5f0'}}>
                Check your email
              </h1>
              <p style={{fontSize: '0.85rem', color: '#5a5a4a', lineHeight: 1.6, marginBottom: '1.5rem'}}>
                We sent a password reset link to <strong style={{color: '#f5f5f0'}}>{email}</strong>
              </p>
              <a href="/auth/login" style={{
                display: 'block', padding: '0.85rem', borderRadius: '8px',
                background: '#f59e0b', color: '#0d0d0a',
                fontSize: '0.875rem', fontWeight: 700,
                textDecoration: 'none', textAlign: 'center'
              }}>
                Back to Sign In
              </a>
            </div>
          ) : (
            <>
              <h1 style={{fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#f5f5f0', marginBottom: '0.35rem'}}>
                Forgot password?
              </h1>
              <p style={{fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '1.75rem', lineHeight: 1.6}}>
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div style={{background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#f87171', marginBottom: '1.25rem'}}>
                  {error}
                </div>
              )}

              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                  style={{background: '#0d0d0a', border: '1px solid #3a3a30', borderRadius: '8px', padding: '0.85rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%'}}
                />
                <button
                  onClick={handleReset}
                  disabled={loading || !email.trim()}
                  style={{background: loading || !email.trim() ? '#a06b00' : '#f59e0b', color: '#0d0d0a', border: 'none', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', width: '100%'}}
                >
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </button>
              </div>

              <p style={{textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: '#5a5a4a'}}>
                Remember your password?{' '}
                <a href="/auth/login" style={{color: '#f59e0b', textDecoration: 'none', fontWeight: 600}}>
                  Sign in
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}