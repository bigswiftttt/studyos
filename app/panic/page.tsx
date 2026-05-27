'use client'

import { useState } from 'react'

const CONFIDENCE_LEVELS = [
    { value: 'cooked', label: '💀 Cooked', color: '#ef4444' },
    { value: 'bad', label: '😰 Bad', color: '#f97316' },
    { value: 'manageable', label: '😬 Manageable', color: '#f59e0b' },
    { value: 'confident', label: '😤 Confident', color: '#22c55e' },
]

const HOURS_OPTIONS = [
    { value: '2', label: '2 hrs' },
    { value: '4', label: '4 hrs' },
    { value: '6', label: '6 hrs' },
    { value: '8', label: '8+ hrs' },
]

const INTENSITY_OPTIONS = [
    { value: 'light', label: '🌤 Light Review' },
    { value: 'serious', label: '📚 Serious Catch-Up' },
    { value: 'survival', label: '🔥 Survival Mode' },
    { value: 'demon', label: '👹 Demon Time' },
]

type PlanResult = {
    countdown: number
    daysLabel: string
    riskLevel: string
    riskColor: string
    survivalAnalysis: string
    priorityTopics: { topic: string; priority: 'high' | 'medium' | 'quick' }[]
    dailyPlan: { day: number; date: string; tasks: string[] }[]
    focusSessions: string
    motivationTip: string
}

export default function PanicMode() {
    const [examName, setExamName] = useState('')
    const [examDate, setExamDate] = useState('')
    const [topics, setTopics] = useState('')
    const [confidence, setConfidence] = useState('')
    const [hoursPerDay, setHoursPerDay] = useState('')
    const [intensity, setIntensity] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<PlanResult | null>(null)
    const [error, setError] = useState('')
    const [step, setStep] = useState('')

    const getDaysUntilExam = () => {
        if (!examDate) return null
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const exam = new Date(examDate)
        exam.setHours(0, 0, 0, 0)
        const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return diff
    }

    const generate = async () => {
        if (!examDate || !topics.trim() || !confidence || !hoursPerDay) return
        setLoading(true)
        setError('')
        setResult(null)

        const daysLeft = getDaysUntilExam()
        if (daysLeft === null || daysLeft < 0) {
            setError('Exam date must be in the future.')
            setLoading(false)
            return
        }

        setStep('🧠 Analyzing your situation...')

        const topicList = topics
            .split('\n')
            .map(t => t.replace(/^[-•*]\s*/, '').trim())
            .filter(Boolean)

        const prompt = `You are an expert academic emergency planner. A student has a crisis exam situation. Generate a detailed survival plan.

STUDENT SITUATION:
- Exam: ${examName || 'Upcoming Exam'}
- Days Until Exam: ${daysLeft}
- Topics Remaining: ${topicList.join(', ')}
- Confidence Level: ${confidence}
- Hours Available Per Day: ${hoursPerDay}
- Study Intensity: ${intensity || 'serious'}

Respond ONLY with a valid JSON object (no markdown, no backticks, no preamble):
{
  "survivalAnalysis": "2-3 sentence intelligent overview of their situation and strategy",
  "riskLevel": "one of: Low Risk | Moderate Risk | High Risk | Academic Near-Death Experience",
  "priorityTopics": [
    { "topic": "topic name", "priority": "high" | "medium" | "quick" }
  ],
  "dailyPlan": [
    { "day": 1, "tasks": ["task 1", "task 2", "task 3"] }
  ],
  "focusSessions": "e.g. 4 × 50-minute sessions daily",
  "motivationTip": "1-2 sentences of sharp, tactical study advice (not generic)"
}

Rules:
- dailyPlan should cover ALL days until exam (max 14 days shown if more)
- Each day should have 3-5 specific tasks based on the topics and hours available
- priorityTopics should include ALL topics with appropriate priority levels
- survivalAnalysis should be honest but reassuring
- motivationTip should be specific and actionable, not generic
- riskLevel should reflect reality given days and topics count`

        try {
            setStep('📊 Building your recovery plan...')

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    messages: [{ role: 'user', content: prompt }],
                }),
            })

            const data = await response.json()
            const text = data.content?.map((b: any) => b.text || '').join('') || ''
            const clean = text.replace(/```json|```/g, '').trim()
            const parsed = JSON.parse(clean)

            const daysLabel =
                daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? '1 DAY LEFT' : `${daysLeft} DAYS LEFT`

            const riskColors: Record<string, string> = {
                'Low Risk': '#22c55e',
                'Moderate Risk': '#f59e0b',
                'High Risk': '#f97316',
                'Academic Near-Death Experience': '#ef4444',
            }

            setResult({
                countdown: daysLeft,
                daysLabel,
                riskLevel: parsed.riskLevel,
                riskColor: riskColors[parsed.riskLevel] || '#f59e0b',
                survivalAnalysis: parsed.survivalAnalysis,
                priorityTopics: parsed.priorityTopics,
                dailyPlan: parsed.dailyPlan.map((d: any, i: number) => {
                    const date = new Date()
                    date.setDate(date.getDate() + i)
                    return {
                        day: d.day,
                        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                        tasks: d.tasks,
                    }
                }),
                focusSessions: parsed.focusSessions,
                motivationTip: parsed.motivationTip,
            })

            setStep('')
        } catch (err: any) {
            setError('Failed to generate plan. Please try again.')
            setStep('')
        }

        setLoading(false)
    }

    const canGenerate = examDate && topics.trim() && confidence && hoursPerDay && !loading
    const daysPreview = getDaysUntilExam()

    const labelStyle = {
        fontSize: '0.72rem',
        color: '#5a5a4a',
        marginBottom: '0.5rem',
        fontFamily: 'monospace',
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        display: 'block',
    }

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        background: '#0d0d0a',
        border: '1px solid #2a2a22',
        borderRadius: '8px',
        color: '#f5f5f0',
        fontSize: '0.875rem',
        fontFamily: 'Inter, sans-serif',
        outline: 'none',
        boxSizing: 'border-box' as const,
    }

    const priorityColors = { high: '#ef4444', medium: '#f59e0b', quick: '#22c55e' }
    const priorityLabels = { high: 'HIGH PRIORITY', medium: 'MEDIUM', quick: 'QUICK REVISION' }

    return (
        <main style={{ minHeight: '100vh', background: '#0d0d0a', color: '#f5f5f0', fontFamily: 'Inter, sans-serif' }}>

            {/* Nav */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 2rem', borderBottom: '1px solid #1f1f18',
                position: 'sticky', top: 0, zIndex: 40,
                background: 'rgba(13,13,10,0.92)', backdropFilter: 'blur(12px)'
            }}>
                <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                    Study<span style={{ color: '#f59e0b' }}>OS</span>
                </span>
                <a href="/dashboard" style={{ fontSize: '0.82rem', color: '#5a5a4a', textDecoration: 'none', fontWeight: 500 }}>
                    ← Dashboard
                </a>
            </nav>

            <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>

                {/* Hero */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: '6px', padding: '0.25rem 0.6rem',
                            fontSize: '0.65rem', fontFamily: 'monospace', letterSpacing: '0.1em',
                            color: '#f87171', fontWeight: 700
                        }}>
                            EMERGENCY MODE ACTIVE
                        </div>
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
                        Panic <span style={{ color: '#ef4444' }}>Mode</span>
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#5a5a4a', lineHeight: 1.6 }}>
                        Turn exam chaos into a survival strategy. Enter your situation — get a plan.
                    </p>
                </div>

                {/* Input Card */}
                <div style={{
                    background: '#111110', border: '1px solid #1f1f18',
                    borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem'
                }}>
                    <p style={{
                        fontSize: '0.7rem', color: '#3a3a30', fontFamily: 'monospace',
                        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.75rem'
                    }}>
            // SITUATION REPORT
                    </p>

                    {/* Row 1: Exam Name + Date */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                            <label style={labelStyle}>Exam / Subject</label>
                            <input
                                type="text"
                                value={examName}
                                onChange={e => setExamName(e.target.value)}
                                placeholder="e.g. Anatomy Finals"
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                            <label style={labelStyle}>Exam Date</label>
                            <input
                                type="date"
                                value={examDate}
                                onChange={e => setExamDate(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    colorScheme: 'dark',
                                    borderColor: daysPreview !== null && daysPreview <= 3 ? 'rgba(239,68,68,0.4)' : '#2a2a22'
                                }}
                            />
                            {daysPreview !== null && (
                                <p style={{
                                    fontSize: '0.7rem', marginTop: '0.35rem', fontFamily: 'monospace',
                                    color: daysPreview <= 3 ? '#f87171' : daysPreview <= 7 ? '#f59e0b' : '#5a5a4a'
                                }}>
                                    {daysPreview === 0 ? '⚠️ Exam is today' : daysPreview < 0 ? '⚠️ Date is in the past' : `${daysPreview} days remaining`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Topics */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Topics Remaining</label>
                        <textarea
                            value={topics}
                            onChange={e => setTopics(e.target.value)}
                            placeholder={"- Cardiovascular system\n- Renal physiology\n- ECG interpretation\n- Shock"}
                            rows={5}
                            style={{
                                ...inputStyle,
                                resize: 'vertical',
                                lineHeight: 1.7,
                            }}
                        />
                        <p style={{ fontSize: '0.7rem', color: '#3a3a30', marginTop: '0.35rem' }}>
                            One topic per line. The more specific, the better the plan.
                        </p>
                    </div>

                    {/* Confidence */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Confidence Level</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {CONFIDENCE_LEVELS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setConfidence(c.value)}
                                    style={{
                                        padding: '0.55rem 1rem', borderRadius: '8px', border: `1px solid ${confidence === c.value ? c.color : '#2a2a22'}`,
                                        background: confidence === c.value ? `${c.color}18` : 'transparent',
                                        color: confidence === c.value ? c.color : '#5a5a4a',
                                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Hours + Intensity */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                            <label style={labelStyle}>Hours Available / Day</label>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {HOURS_OPTIONS.map(h => (
                                    <button
                                        key={h.value}
                                        onClick={() => setHoursPerDay(h.value)}
                                        style={{
                                            padding: '0.5rem 0.85rem', borderRadius: '8px',
                                            border: `1px solid ${hoursPerDay === h.value ? '#f59e0b' : '#2a2a22'}`,
                                            background: hoursPerDay === h.value ? 'rgba(245,158,11,0.1)' : 'transparent',
                                            color: hoursPerDay === h.value ? '#f59e0b' : '#5a5a4a',
                                            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {h.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                            <label style={labelStyle}>Study Intensity</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {INTENSITY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setIntensity(opt.value)}
                                        style={{
                                            padding: '0.5rem 0.85rem', borderRadius: '8px', textAlign: 'left',
                                            border: `1px solid ${intensity === opt.value ? '#f59e0b' : '#2a2a22'}`,
                                            background: intensity === opt.value ? 'rgba(245,158,11,0.1)' : 'transparent',
                                            color: intensity === opt.value ? '#f59e0b' : '#5a5a4a',
                                            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={generate}
                    disabled={!canGenerate}
                    style={{
                        width: '100%', padding: '1.1rem', borderRadius: '10px', border: 'none',
                        background: canGenerate ? '#ef4444' : '#1a1a14',
                        color: canGenerate ? '#fff' : '#3a3a30',
                        fontSize: '1rem', fontWeight: 800,
                        cursor: canGenerate ? 'pointer' : 'not-allowed',
                        fontFamily: 'inherit', marginBottom: '2rem',
                        letterSpacing: '-0.01em',
                        transition: 'all 0.2s'
                    }}
                >
                    {loading ? (step || 'Generating...') : '⚡ Build My Survival Plan'}
                </button>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '10px', padding: '0.9rem 1rem',
                        fontSize: '0.82rem', color: '#f87171', marginBottom: '1.5rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <p style={{
                            fontSize: '0.7rem', color: '#3a3a30', fontFamily: 'monospace',
                            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem'
                        }}>
              // SURVIVAL DASHBOARD
                        </p>

                        {/* Top Row: Countdown + Risk */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>

                            {/* Countdown */}
                            <div style={{
                                flex: 1, minWidth: '160px',
                                background: '#111110', border: '1px solid #1f1f18',
                                borderRadius: '14px', padding: '1.75rem',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                    Countdown
                                </p>
                                <p style={{
                                    fontSize: result.countdown <= 3 ? '2.5rem' : '2rem',
                                    fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'monospace',
                                    color: result.countdown <= 3 ? '#ef4444' : result.countdown <= 7 ? '#f59e0b' : '#f5f5f0',
                                    lineHeight: 1
                                }}>
                                    {result.daysLabel}
                                </p>
                                {examName && <p style={{ fontSize: '0.75rem', color: '#5a5a4a', marginTop: '0.5rem' }}>{examName}</p>}
                            </div>

                            {/* Risk Meter */}
                            <div style={{
                                flex: 1, minWidth: '160px',
                                background: '#111110', border: `1px solid ${result.riskColor}30`,
                                borderRadius: '14px', padding: '1.75rem',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                    Risk Level
                                </p>
                                <p style={{
                                    fontSize: '1rem', fontWeight: 800,
                                    color: result.riskColor, lineHeight: 1.3
                                }}>
                                    {result.riskLevel}
                                </p>
                                <div style={{
                                    marginTop: '0.75rem', height: '4px', background: '#1f1f18', borderRadius: '999px', overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%', borderRadius: '999px',
                                        background: result.riskColor,
                                        width: result.riskLevel === 'Low Risk' ? '25%' :
                                            result.riskLevel === 'Moderate Risk' ? '50%' :
                                                result.riskLevel === 'High Risk' ? '75%' : '100%',
                                        transition: 'width 0.8s ease'
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Survival Analysis */}
                        <div style={{
                            background: '#111110', border: '1px solid #1f1f18',
                            borderRadius: '14px', padding: '1.5rem'
                        }}>
                            <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                AI Survival Analysis
                            </p>
                            <p style={{ fontSize: '0.9rem', color: '#c0c0b0', lineHeight: 1.7 }}>
                                {result.survivalAnalysis}
                            </p>
                        </div>

                        {/* Priority Topics */}
                        <div style={{
                            background: '#111110', border: '1px solid #1f1f18',
                            borderRadius: '14px', padding: '1.5rem'
                        }}>
                            <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                Priority Topics
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {result.priorityTopics.map((t, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.65rem 0.9rem', borderRadius: '8px',
                                        background: '#0d0d0a', border: '1px solid #1a1a14'
                                    }}>
                                        <span style={{ fontSize: '0.875rem', color: '#e0e0d0' }}>{t.topic}</span>
                                        <span style={{
                                            fontSize: '0.6rem', fontFamily: 'monospace', letterSpacing: '0.08em',
                                            padding: '0.2rem 0.5rem', borderRadius: '4px',
                                            color: priorityColors[t.priority],
                                            background: `${priorityColors[t.priority]}15`,
                                            border: `1px solid ${priorityColors[t.priority]}30`,
                                            fontWeight: 700
                                        }}>
                                            {priorityLabels[t.priority]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Daily Revision Plan */}
                        <div style={{
                            background: '#111110', border: '1px solid #1f1f18',
                            borderRadius: '14px', padding: '1.5rem'
                        }}>
                            <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                Daily Revision Plan
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {result.dailyPlan.map((day, i) => (
                                    <div key={i} style={{
                                        background: '#0d0d0a', border: '1px solid #1a1a14',
                                        borderRadius: '10px', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.75rem 1rem',
                                            borderBottom: '1px solid #1a1a14',
                                            background: '#111110'
                                        }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b' }}>
                                                DAY {day.day}
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: '#3a3a30', fontFamily: 'monospace' }}>
                                                {day.date}
                                            </span>
                                        </div>
                                        <div style={{ padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {day.tasks.map((task, j) => (
                                                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                                                    <span style={{ color: '#3a3a30', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.1rem', flexShrink: 0 }}>
                                                        {String(j + 1).padStart(2, '0')}
                                                    </span>
                                                    <span style={{ fontSize: '0.84rem', color: '#c0c0b0', lineHeight: 1.5 }}>{task}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Row: Focus Sessions + Motivation */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>

                            {/* Focus Sessions */}
                            <div style={{
                                flex: 1, minWidth: '200px',
                                background: '#111110', border: '1px solid #1f1f18',
                                borderRadius: '14px', padding: '1.5rem'
                            }}>
                                <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                    Recommended Sessions
                                </p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.5rem' }}>
                                    {result.focusSessions}
                                </p>
                                <p style={{ fontSize: '0.78rem', color: '#5a5a4a', lineHeight: 1.5 }}>
                                    Use Focus Mode to run timed sessions and track progress.
                                </p>
                                <a href="/focus" style={{
                                    display: 'inline-block', marginTop: '1rem',
                                    padding: '0.5rem 1rem', borderRadius: '7px',
                                    border: '1px solid #2a2a22', background: 'transparent',
                                    color: '#8a8a7a', fontSize: '0.78rem', fontWeight: 600,
                                    textDecoration: 'none', fontFamily: 'inherit'
                                }}>
                                    Open Focus Mode →
                                </a>
                            </div>

                            {/* Motivation */}
                            <div style={{
                                flex: 1, minWidth: '200px',
                                background: '#111110', border: '1px solid #1f1f18',
                                borderRadius: '14px', padding: '1.5rem'
                            }}>
                                <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                    Tactical Advice
                                </p>
                                <p style={{ fontSize: '0.875rem', color: '#c0c0b0', lineHeight: 1.7, fontStyle: 'italic' }}>
                                    "{result.motivationTip}"
                                </p>
                            </div>
                        </div>

                        {/* Reset */}
                        <button
                            onClick={() => { setResult(null); setExamName(''); setExamDate(''); setTopics(''); setConfidence(''); setHoursPerDay(''); setIntensity('') }}
                            style={{
                                width: '100%', padding: '0.85rem', borderRadius: '10px',
                                border: '1px solid #2a2a22', background: 'transparent',
                                color: '#5a5a4a', fontSize: '0.85rem', fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit', marginTop: '0.5rem'
                            }}
                        >
                            Start New Plan
                        </button>

                    </div>
                )}

            </div>
        </main>
    )
}