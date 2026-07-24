'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // TODO: send to Sentry/error tracking once wired up (see audit §9 — no
        // error tracking currently exists anywhere in the app).
        console.error('[unhandled error]', error)
    }, [error])

    return (
        <main style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1rem',
            background: '#0d0d0a', color: '#f5f5f0', fontFamily: 'Inter, sans-serif',
            padding: '2rem', textAlign: 'center'
        }}>
            <p style={{ fontSize: '2rem' }}>⚠️</p>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Something went wrong</h1>
            <p style={{ fontSize: '0.875rem', color: '#5a5a4a', maxWidth: '360px' }}>
                This has been logged. You can try again, or head back to your dashboard.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                    onClick={reset}
                    style={{
                        padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
                        background: '#f59e0b', color: '#0d0d0a', fontWeight: 700,
                        fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit'
                    }}
                >
                    Try again
                </button>
                <a
                    href="/dashboard"
                    style={{
                        padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #2a2a22',
                        color: '#8a8a7a', fontWeight: 600, fontSize: '0.875rem',
                        textDecoration: 'none', fontFamily: 'inherit'
                    }}
                >
                    Go to dashboard
                </a>
            </div>
        </main>
    )
}