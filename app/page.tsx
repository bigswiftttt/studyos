export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d0d0a',
      color: '#f5f5f0',
      fontFamily: 'var(--font-inter), Inter, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid #1f1f18',
        position: 'sticky',
        top: 0,
        background: 'rgba(13,13,10,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 50
      }}>
        <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.03em' }}>
          Study<span style={{ color: '#f59e0b' }}>OS</span>
        </span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="/auth/login" style={{
            fontSize: '0.875rem', color: '#8a8a7a',
            textDecoration: 'none', fontWeight: 500
          }}>Sign in</a>
          <a href="/auth/signup" style={{
            fontSize: '0.875rem', fontWeight: 700,
            background: '#f59e0b', color: '#0d0d0a',
            padding: '0.5rem 1.25rem', borderRadius: '8px',
            textDecoration: 'none'
          }}>Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '6rem 2rem 5rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.75rem', fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)',
          background: 'rgba(245,158,11,0.07)',
          padding: '0.35em 1em', borderRadius: '999px',
          marginBottom: '2.5rem'
        }}>
          ✦ AI-powered · Built for students
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 7vw, 5rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.0,
          marginBottom: '1.5rem'
        }}>
          Stop studying<br />
          <span style={{ color: '#f59e0b' }}>randomly.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#8a8a7a',
          lineHeight: 1.7,
          maxWidth: '480px',
          margin: '0 auto 3rem',
          fontWeight: 400
        }}>
          StudyOS turns your lecture notes into summaries, flashcards, and exam plans — instantly.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/auth/signup" style={{
            fontWeight: 700, fontSize: '1rem',
            background: '#f59e0b', color: '#0d0d0a',
            padding: '0.875rem 2rem', borderRadius: '10px',
            textDecoration: 'none', letterSpacing: '-0.01em'
          }}>
            Start for free →
          </a>
          <a href="/auth/login" style={{
            fontWeight: 600, fontSize: '1rem',
            background: 'transparent', color: '#8a8a7a',
            padding: '0.875rem 2rem', borderRadius: '10px',
            textDecoration: 'none', border: '1px solid #1f1f18'
          }}>
            Sign in
          </a>
        </div>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 2rem 6rem',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1px',
          background: '#1f1f18',
          border: '1px solid #1f1f18',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {[
            { icon: '🤖', title: 'AI Assistant', desc: 'Upload PDFs, get summaries, flashcards and MCQs instantly' },
            { icon: '📊', title: 'Dashboard', desc: 'Track your streak, hours studied and upcoming exams' },
            { icon: '⏱️', title: 'Focus Mode', desc: 'Pomodoro timer with session tracking and ambient sounds' },
            { icon: '🚨', title: 'Panic Mode', desc: 'AI builds your crash revision plan before any exam' },
          ].map((f) => (
            <div key={f.title} style={{
              background: '#0d0d0a',
              padding: '2rem 1.5rem',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <div style={{
                fontWeight: 700, fontSize: '0.95rem',
                marginBottom: '0.5rem', letterSpacing: '-0.01em'
              }}>{f.title}</div>
              <div style={{
                fontSize: '0.8rem', color: '#5a5a4a',
                lineHeight: 1.6
              }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <p style={{
          textAlign: 'center', marginTop: '3rem',
          fontSize: '0.8rem', color: '#3a3a30',
          fontFamily: 'var(--font-mono), monospace',
          letterSpacing: '0.05em'
        }}>
          StudyOS · Built for students who mean business
        </p>
      </section>

    </main>
  )
}