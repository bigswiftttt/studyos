'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const MODES = {
  focus: { label: 'Focus', duration: 25 * 60, color: '#f59e0b' },
  short: { label: 'Short Break', duration: 5 * 60, color: '#22c55e' },
  long: { label: 'Long Break', duration: 15 * 60, color: '#3b82f6' },
}

const QUOTES = [
  "Focus is the art of knowing what to ignore.",
  "Small steps every day lead to big results.",
  "The secret of getting ahead is getting started.",
  "You don't have to be great to start, but you have to start to be great.",
  "Concentrate all your thoughts upon the work at hand.",
  "It's not about having time. It's about making time.",
  "Deep work is the superpower of the 21st century.",
  "One task at a time. Do it well. Move on.",
]

const SOUNDS = [
  { label: '🔇 None', value: 'none' },
  { label: '🌧️ Rain', value: 'rain' },
  { label: '☕ Café', value: 'cafe' },
  { label: '🌊 Ocean', value: 'ocean' },
  { label: '🌿 Forest', value: 'forest' },
]

export default function FocusMode() {
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus')
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [sound, setSound] = useState('none')
  const [quote, setQuote] = useState(QUOTES[0])
  const [user, setUser] = useState<any>(null)
  const [todaySessions, setTodaySessions] = useState<any[]>([])
  const intervalRef = useRef<any>(null)
  const audioCtxRef = useRef<any>(null)
  const noiseRef = useRef<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchTodaySessions(user.id)
      }
    })
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
  }, [])

  const fetchTodaySessions = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_date', today)
      .order('created_at', { ascending: false })
    if (data) setTodaySessions(data)
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            playDing()
            if (mode === 'focus') {
              setSessions(s => s + 1)
              saveSession()
              setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
            }
            return 0
          }
          return t - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  const saveSession = async () => {
    if (!user) return
    const { data } = await supabase.from('focus_sessions').insert({
      user_id: user.id,
      duration_mins: MODES[mode].duration / 60,
      session_date: new Date().toISOString().split('T')[0],
      completed: true
    }).select()
    if (data) fetchTodaySessions(user.id)

    // Update total hours in profile
    await supabase.from('profiles')
      .update({ total_hours: (MODES[mode].duration / 60 / 60) })
      .eq('id', user.id)
  }

  const playDing = () => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 1)
    } catch (e) {}
  }

  const startAmbient = (type: string) => {
    stopAmbient()
    if (type === 'none') return
    try {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const bufferSize = 4096
      const node = ctx.createScriptProcessor(bufferSize, 1, 1)
      let lastOut = 0
      node.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          if (type === 'rain') {
            output[i] = white * 0.15
          } else if (type === 'cafe') {
            lastOut = (lastOut + (0.02 * white)) / 1.02
            output[i] = lastOut * 3.5
          } else if (type === 'ocean') {
            output[i] = Math.sin(i * 0.01) * white * 0.1
          } else if (type === 'forest') {
            output[i] = white * 0.05
          }
        }
      }
      noiseRef.current = node
      node.connect(ctx.destination)
    } catch (e) {}
  }

  const stopAmbient = () => {
    try {
      noiseRef.current?.disconnect()
      audioCtxRef.current?.close()
    } catch (e) {}
  }

  const handleSoundChange = (s: string) => {
    setSound(s)
    if (s === 'none') stopAmbient()
    else startAmbient(s)
  }

  const switchMode = (m: 'focus' | 'short' | 'long') => {
    setMode(m)
    setTimeLeft(MODES[m].duration)
    setRunning(false)
    clearInterval(intervalRef.current)
  }

  const reset = () => {
    setRunning(false)
    setTimeLeft(MODES[mode].duration)
    clearInterval(intervalRef.current)
  }

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const secs = (timeLeft % 60).toString().padStart(2, '0')
  const progress = 1 - timeLeft / MODES[mode].duration
  const circumference = 2 * Math.PI * 120
  const accent = MODES[mode].color

  const totalMinsToday = todaySessions.reduce((acc, s) => acc + s.duration_mins, 0)

  return (
    <main style={{minHeight: '100vh', background: '#0d0d0a', color: '#f5f5f0', fontFamily: 'Inter, sans-serif'}}>

      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem', borderBottom: '1px solid #1f1f18',
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(13,13,10,0.92)', backdropFilter: 'blur(12px)'
      }}>
        <span style={{fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.02em'}}>
          Study<span style={{color: '#f59e0b'}}>OS</span>
        </span>
        <a href="/dashboard" style={{fontSize: '0.82rem', color: '#5a5a4a', textDecoration: 'none', fontWeight: 500}}>
          ← Dashboard
        </a>
      </nav>

      <div style={{maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem'}}>

        <div style={{marginBottom: '2.5rem'}}>
          <h1 style={{fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem'}}>
            Focus Mode
          </h1>
          <p style={{fontSize: '0.85rem', color: '#5a5a4a'}}>Stay in the zone. One session at a time.</p>
        </div>

        {/* Mode Selector */}
        <div style={{display: 'flex', gap: '0.5rem', marginBottom: '3rem', background: '#111110', border: '1px solid #1f1f18', borderRadius: '12px', padding: '0.4rem'}}>
          {(Object.keys(MODES) as Array<keyof typeof MODES>).map((m) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none',
              background: mode === m ? MODES[m].color : 'transparent',
              color: mode === m ? '#0d0d0a' : '#5a5a4a',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}>
              {MODES[m].label}
            </button>
          ))}
        </div>

        {/* Timer Circle */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem'}}>
          <div style={{position: 'relative', width: '280px', height: '280px', marginBottom: '2rem'}}>
            <svg width="280" height="280" style={{position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)'}}>
              <circle cx="140" cy="140" r="120" fill="none" stroke="#1f1f18" strokeWidth="6"/>
              <circle
                cx="140" cy="140" r="120" fill="none"
                stroke={accent} strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                style={{transition: 'stroke-dashoffset 1s linear'}}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'monospace', color: accent}}>
                {mins}:{secs}
              </div>
              <div style={{fontSize: '0.75rem', color: '#5a5a4a', marginTop: '0.25rem', fontFamily: 'monospace', letterSpacing: '0.1em'}}>
                {MODES[mode].label.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <button onClick={reset} style={{
              padding: '0.75rem 1.5rem', borderRadius: '10px',
              border: '1px solid #2a2a22', background: 'none',
              color: '#5a5a4a', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit'
            }}>Reset</button>
            <button onClick={() => setRunning(!running)} style={{
              padding: '0.9rem 2.5rem', borderRadius: '10px', border: 'none',
              background: accent, color: '#0d0d0a',
              fontSize: '1rem', fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              minWidth: '140px'
            }}>
              {running ? 'Pause' : timeLeft === MODES[mode].duration ? 'Start' : 'Resume'}
            </button>
          </div>
        </div>

        {/* Quote */}
        <div style={{
          background: '#111110', border: '1px solid #1f1f18',
          borderRadius: '12px', padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem', textAlign: 'center'
        }}>
          <p style={{fontSize: '0.875rem', color: '#8a8a7a', fontStyle: 'italic', lineHeight: 1.6}}>
            "{quote}"
          </p>
        </div>

        {/* Ambient Sounds */}
        <div style={{
          background: '#111110', border: '1px solid #1f1f18',
          borderRadius: '12px', padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{fontSize: '0.72rem', color: '#5a5a4a', marginBottom: '0.75rem', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase'}}>
            Ambient Sound
          </p>
          <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
            {SOUNDS.map((s) => (
              <button key={s.value} onClick={() => handleSoundChange(s.value)} style={{
                padding: '0.5rem 0.9rem', borderRadius: '8px',
                border: `1px solid ${sound === s.value ? accent : '#2a2a22'}`,
                background: sound === s.value ? `rgba(245,158,11,0.1)` : 'transparent',
                color: sound === s.value ? accent : '#5a5a4a',
                fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Today's Stats */}
        <div style={{
          background: '#111110', border: '1px solid #1f1f18',
          borderRadius: '12px', padding: '1.25rem 1.5rem'
        }}>
          <p style={{fontSize: '0.72rem', color: '#5a5a4a', marginBottom: '1rem', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase'}}>
            Today's Sessions
          </p>
          <div style={{display: 'flex', gap: '1.5rem', marginBottom: '1rem'}}>
            <div>
              <div style={{fontSize: '1.5rem', fontWeight: 800, color: accent}}>{todaySessions.length}</div>
              <div style={{fontSize: '0.72rem', color: '#5a5a4a'}}>Sessions</div>
            </div>
            <div>
              <div style={{fontSize: '1.5rem', fontWeight: 800, color: accent}}>{totalMinsToday}m</div>
              <div style={{fontSize: '0.72rem', color: '#5a5a4a'}}>Focus time</div>
            </div>
            <div>
              <div style={{fontSize: '1.5rem', fontWeight: 800, color: accent}}>{sessions}</div>
              <div style={{fontSize: '0.72rem', color: '#5a5a4a'}}>This session</div>
            </div>
          </div>
          {todaySessions.length === 0 ? (
            <p style={{fontSize: '0.8rem', color: '#3a3a30'}}>No sessions yet today. Start your first one! 🎯</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.4rem'}}>
              {todaySessions.slice(0, 5).map((s, i) => (
                <div key={s.id} style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#5a5a4a'}}>
                  <span>Session {todaySessions.length - i}</span>
                  <span style={{fontFamily: 'monospace'}}>{s.duration_mins} min</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}