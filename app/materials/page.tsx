'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Material = {
  id: string
  title: string
  summary: string
  flashcards: { front: string; back: string }[]
  mcqs: { question: string; options: string[]; correct: number; explanation: string }[]
  exam_questions: { question: string; type: string; marks: number; hint: string }[]
  created_at: string
}

type ActiveView = { materialId: string; tab: 'summary' | 'flashcards' | 'mcqs' | 'examquestions' } | null

export default function Materials() {
  const [user, setUser] = useState<any>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<ActiveView>(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchMaterials(user.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  const fetchMaterials = async (userId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('study_materials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setMaterials(data)
    setLoading(false)
  }

 const openMaterial = (id: string, tab: 'summary' | 'flashcards' | 'mcqs' | 'examquestions' = 'summary') => {
    setActiveView({ materialId: id, tab })
    setCurrentCard(0)
    setFlipped(false)
    setCurrentQ(0)
    setSelected(null)
    setScore(0)
  }

  const confirmDelete = async () => {
    if (!deleteId || !user) return
    setDeleting(true)
    await supabase.from('study_materials').delete().eq('id', deleteId)
    setDeleteId(null)
    setDeleting(false)
    if (activeView?.materialId === deleteId) setActiveView(null)
    fetchMaterials(user.id)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const activeMaterial = materials.find(m => m.id === activeView?.materialId)

  const handleAnswer = (index: number) => {
    if (!activeMaterial || selected !== null) return
    setSelected(index)
    if (index === activeMaterial.mcqs[currentQ].correct) setScore(s => s + 1)
  }

  const labelStyle = {
    fontSize: '0.72rem', color: '#5a5a4a', fontFamily: 'monospace',
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
  }

  // ── DETAIL VIEW ──
  if (activeView && activeMaterial) {
    const tabs = ['summary', 'flashcards', 'mcqs', 'examquestions'] as const
    const tab = activeView.tab

    return (
      <main style={{ minHeight: '100vh', background: '#0d0d0a', color: '#f5f5f0', fontFamily: 'Inter, sans-serif' }}>
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2rem', borderBottom: '1px solid #1f1f18',
          position: 'sticky', top: 0, zIndex: 40,
          background: 'rgba(13,13,10,0.92)', backdropFilter: 'blur(12px)'
        }}>
          <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.02em' }}>
            Study<span style={{ color: '#f59e0b' }}>OS</span>
          </span>
          <button
            onClick={() => setActiveView(null)}
            style={{ fontSize: '0.82rem', color: '#5a5a4a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Back to Materials
          </button>
        </nav>

        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.6rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.3rem' }}>
              {activeMaterial.title}
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#3a3a30' }}>{formatDate(activeMaterial.created_at)}</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => {
                setActiveView({ materialId: activeView.materialId, tab: t })
                setCurrentCard(0); setFlipped(false); setCurrentQ(0); setSelected(null); setScore(0)
              }} style={{
                padding: '0.5rem 1rem', borderRadius: '8px',
                border: `1px solid ${tab === t ? '#f59e0b' : '#2a2a22'}`,
                background: tab === t ? '#f59e0b' : '#111110',
                color: tab === t ? '#0d0d0a' : '#5a5a4a',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>
                {t === 'examquestions' ? 'Exam Qs' : t === 'mcqs' ? 'MCQs' : t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'flashcards' && activeMaterial.flashcards?.length > 0 && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>({activeMaterial.flashcards.length})</span>}
                {t === 'mcqs' && activeMaterial.mcqs?.length > 0 && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>({activeMaterial.mcqs.length})</span>}
                {t === 'examquestions' && activeMaterial.exam_questions?.length > 0 && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>({activeMaterial.exam_questions.length})</span>}
              </button>
            ))}
          </div>

          <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '14px', padding: '2rem' }}>

            {/* Summary */}
            {tab === 'summary' && (
              activeMaterial.summary ? (
                <div>
                  {activeMaterial.summary.split('\n').map((line, i) => (
                    <p key={i} style={{
                      marginBottom: '0.5rem',
                      fontSize: line.startsWith('##') ? '1rem' : '0.875rem',
                      fontWeight: line.startsWith('##') ? 700 : 400,
                      color: line.startsWith('##') ? '#f59e0b' : '#c0c0b0',
                      lineHeight: 1.7,
                      marginTop: line.startsWith('##') ? '1.5rem' : '0'
                    }}>
                      {line.replace('## ', '')}
                    </p>
                  ))}
                </div>
              ) : <p style={{ color: '#5a5a4a', fontSize: '0.875rem' }}>No summary available.</p>
            )}

            {/* Flashcards */}
            {tab === 'flashcards' && (
              activeMaterial.flashcards?.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.78rem', color: '#5a5a4a', fontFamily: 'monospace' }}>Card {currentCard + 1} of {activeMaterial.flashcards.length}</p>
                    <p style={{ fontSize: '0.72rem', color: '#3a3a30' }}>Click to flip</p>
                  </div>
                  <div onClick={() => setFlipped(!flipped)} style={{
                    background: flipped ? '#181810' : '#0d0d0a',
                    border: `2px solid ${flipped ? '#f59e0b' : '#2a2a22'}`,
                    borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center',
                    cursor: 'pointer', minHeight: '180px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.5rem', transition: 'all 0.2s'
                  }}>
                    <p style={{ fontSize: '0.7rem', color: '#3a3a30', marginBottom: '1rem', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                      {flipped ? '✓ ANSWER' : '? QUESTION'}
                    </p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, color: flipped ? '#f59e0b' : '#f5f5f0' }}>
                      {flipped ? activeMaterial.flashcards[currentCard].back : activeMaterial.flashcards[currentCard].front}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setFlipped(false) }}
                      disabled={currentCard === 0}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #2a2a22', background: 'none', color: currentCard === 0 ? '#3a3a30' : '#8a8a7a', fontSize: '0.82rem', fontWeight: 600, cursor: currentCard === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      ← Prev
                    </button>
                    <button onClick={() => { setFlipped(false); setCurrentCard(0) }}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #2a2a22', background: 'none', color: '#8a8a7a', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Restart
                    </button>
                    <button onClick={() => { setCurrentCard(Math.min(activeMaterial.flashcards.length - 1, currentCard + 1)); setFlipped(false) }}
                      disabled={currentCard === activeMaterial.flashcards.length - 1}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: currentCard === activeMaterial.flashcards.length - 1 ? '#1a1a14' : '#f59e0b', color: currentCard === activeMaterial.flashcards.length - 1 ? '#3a3a30' : '#0d0d0a', fontSize: '0.82rem', fontWeight: 700, cursor: currentCard === activeMaterial.flashcards.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      Next →
                    </button>
                  </div>
                </div>
              ) : <p style={{ color: '#5a5a4a', fontSize: '0.875rem' }}>No flashcards saved.</p>
            )}

            {/* MCQs */}
            {tab === 'mcqs' && (
              activeMaterial.mcqs?.length > 0 ? (
                currentQ < activeMaterial.mcqs.length ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <p style={{ fontSize: '0.78rem', color: '#5a5a4a', fontFamily: 'monospace' }}>Question {currentQ + 1} of {activeMaterial.mcqs.length}</p>
                      <p style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>Score: {score}/{currentQ + (selected !== null ? 1 : 0)}</p>
                    </div>
                    <div style={{ height: '3px', background: '#1f1f18', borderRadius: '999px', marginBottom: '1.5rem' }}>
                      <div style={{ height: '100%', background: '#f59e0b', borderRadius: '999px', width: `${(currentQ / activeMaterial.mcqs.length) * 100}%`, transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.6, marginBottom: '1.5rem' }}>{activeMaterial.mcqs[currentQ].question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {activeMaterial.mcqs[currentQ].options.map((option, i) => {
                        let bg = '#0d0d0a', border = '#2a2a22', color = '#f5f5f0'
                        if (selected !== null) {
                          if (i === activeMaterial.mcqs[currentQ].correct) { bg = 'rgba(34,197,94,0.1)'; border = '#22c55e'; color = '#4ade80' }
                          else if (i === selected && i !== activeMaterial.mcqs[currentQ].correct) { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; color = '#f87171' }
                        }
                        return (
                          <button key={i} onClick={() => handleAnswer(i)} style={{ padding: '1rem', borderRadius: '10px', border: `1px solid ${border}`, background: bg, color, fontSize: '0.875rem', fontWeight: 500, textAlign: 'left', cursor: selected !== null ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                            <span style={{ fontFamily: 'monospace', marginRight: '0.75rem', color: '#5a5a4a' }}>{['A', 'B', 'C', 'D'][i]}.</span>
                            {option}
                          </button>
                        )
                      })}
                    </div>
                    {selected !== null && (
                      <div>
                        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.8rem', color: '#c0c0b0', lineHeight: 1.6 }}>💡 {activeMaterial.mcqs[currentQ].explanation}</p>
                        </div>
                        <button onClick={() => { setSelected(null); setCurrentQ(q => q + 1) }} style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: 'none', background: '#f59e0b', color: '#0d0d0a', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Next Question →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</p>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Quiz Complete!</h3>
                    <p style={{ fontSize: '1rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem' }}>Score: {score}/{activeMaterial.mcqs.length}</p>
                    <p style={{ fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '2rem' }}>
                      {score === activeMaterial.mcqs.length ? 'Perfect score! 🏆' : score >= activeMaterial.mcqs.length * 0.7 ? 'Great job! Keep it up 💪' : 'Keep studying — you got this! 📚'}
                    </p>
                    <button onClick={() => { setCurrentQ(0); setSelected(null); setScore(0) }} style={{ padding: '0.85rem 2rem', borderRadius: '10px', border: 'none', background: '#f59e0b', color: '#0d0d0a', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Retry Quiz →
                    </button>
                  </div>
                )
              ) : <p style={{ color: '#5a5a4a', fontSize: '0.875rem' }}>No MCQs saved.</p>
            )}

            {/* Exam Questions */}
            {tab === 'examquestions' && (
              activeMaterial.exam_questions?.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.78rem', color: '#5a5a4a', fontFamily: 'monospace' }}>
                      {activeMaterial.exam_questions.length} exam questions
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activeMaterial.exam_questions.map((q, i) => (
                      <div key={i} style={{ background: '#0d0d0a', border: '1px solid #2a2a22', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#5a5a4a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Q{i + 1} · {q.type}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>{q.marks} marks</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '0.75rem', color: '#f5f5f0' }}>{q.question}</p>
                        {q.hint && (
                          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', padding: '0.6rem 0.9rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#8a8a7a', lineHeight: 1.5 }}>💡 {q.hint}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p style={{ color: '#5a5a4a', fontSize: '0.875rem' }}>No exam questions saved.</p>
            )}

          </div>
        </div>
      </main>
    )
  }

  // ── LIST VIEW ──
  return (
    <main style={{ minHeight: '100vh', background: '#0d0d0a', color: '#f5f5f0', fontFamily: 'Inter, sans-serif' }}>
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

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem' }}>
              Materials
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5a5a4a' }}>
              Your saved study sessions — summaries, flashcards, MCQs and exam questions.
            </p>
          </div>
          <a href="/assistant" style={{
            padding: '0.65rem 1.25rem', borderRadius: '9px', border: 'none',
            background: '#f59e0b', color: '#0d0d0a',
            fontSize: '0.85rem', fontWeight: 700,
            textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap'
          }}>
            + New Session
          </a>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: '#3a3a30' }}>Loading materials...</p>
          </div>
        ) : materials.length === 0 ? (
          <div style={{
            background: '#111110', border: '1px solid #1f1f18',
            borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center'
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📂</p>
            <p style={{ fontSize: '0.875rem', color: '#5a5a4a', marginBottom: '1.5rem' }}>
              No materials yet. Generate study materials from a PDF to save them here.
            </p>
            <a href="/assistant" style={{
              padding: '0.65rem 1.5rem', borderRadius: '9px', border: 'none',
              background: '#f59e0b', color: '#0d0d0a',
              fontSize: '0.85rem', fontWeight: 700,
              textDecoration: 'none', fontFamily: 'inherit'
            }}>
              Go to Assistant →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {materials.map(m => (
              <div key={m.id} style={{
                background: '#111110', border: '1px solid #1f1f18',
                borderRadius: '14px', padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '1rem', flexWrap: 'wrap'
              }}>
                {/* Left */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0e0d0', marginBottom: '0.4rem' }}>
                    {m.title}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ ...labelStyle, fontSize: '0.68rem' }}>{formatDate(m.created_at)}</span>
                    {m.flashcards?.length > 0 && <span style={{ ...labelStyle, fontSize: '0.68rem', color: '#3a3a30' }}>{m.flashcards.length} cards</span>}
                    {m.mcqs?.length > 0 && <span style={{ ...labelStyle, fontSize: '0.68rem', color: '#3a3a30' }}>{m.mcqs.length} MCQs</span>}
                    {m.exam_questions?.length > 0 && <span style={{ ...labelStyle, fontSize: '0.68rem', color: '#3a3a30' }}>{m.exam_questions.length} exam Qs</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  <button onClick={() => openMaterial(m.id, 'summary')} style={{ padding: '0.45rem 0.85rem', borderRadius: '7px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Summary
                  </button>
                  <button onClick={() => openMaterial(m.id, 'flashcards')} style={{ padding: '0.45rem 0.85rem', borderRadius: '7px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Flashcards
                  </button>
                  <button onClick={() => openMaterial(m.id, 'mcqs')} style={{ padding: '0.45rem 0.85rem', borderRadius: '7px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    MCQs
                  </button>
                  <button onClick={() => setDeleteId(m.id)} style={{ padding: '0.45rem 0.85rem', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#f87171', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div style={{ background: '#111110', border: '1px solid #2a2a22', borderRadius: '16px', padding: '2rem', maxWidth: '380px', width: '100%' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Delete material?</p>
            <p style={{ fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This will permanently remove this study session and all its content. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}