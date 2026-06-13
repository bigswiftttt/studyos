'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  const handleReset = async () => {
    if (!password.trim()) return
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
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
          {done ? (
            <div style={{textAlign: 'center'}}>
              <p style={{fontSize: '2rem', marginBottom: '1rem'}}>✅</p>
              <h1 style={{fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f5f5f0'}}>
                Password updated!
              </h1>
              <p style={{fontSize: '0.85rem', color: '#5a5a4a'}}>
                Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <h1 style={{fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#f5f5f0', marginBottom: '0.35rem'}}>
                Set new password
              </h1>
              <p style={{fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '1.75rem'}}>
                Choose a strong password for your account.
              </p>

              {error && (
                <div style={{background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#f87171', marginBottom: '1.25rem'}}>
                  {error}
                </div>
              )}

              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{background: '#0d0d0a', border: '1px solid #3a3a30', borderRadius: '8px', padding: '0.85rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%'}}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                  style={{background: '#0d0d0a', border: '1px solid #3a3a30', borderRadius: '8px', padding: '0.85rem 1rem', color: '#f5f5f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%'}}
                />
                <button
                  onClick={handleReset}
                  disabled={loading || !password.trim()}
                  style={{background: loading || !password.trim() ? '#a06b00' : '#f59e0b', color: '#0d0d0a', border: 'none', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', width: '100%'}}
                >
                  {loading ? 'Updating...' : 'Update Password →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}