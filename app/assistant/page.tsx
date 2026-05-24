'use client'

import { useState } from 'react'

type MCQ = {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export default function Assistant() {
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [flashcards, setFlashcards] = useState<{front: string, back: string}[]>([])
  const [mcqs, setMcqs] = useState<MCQ[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [step, setStep] = useState('')
  const [mcqCount, setMcqCount] = useState(8)
  const [mcqDifficulty, setMcqDifficulty] = useState('medium')

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf') setFile(dropped)
  }

  const generate = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setSummary('')
    setFlashcards([])
    setMcqs([])
    setCurrentCard(0)
    setFlipped(false)
    setCurrentQ(0)
    setSelected(null)
    setScore(0)

    try {
      setStep('📄 Extracting text from PDF...')
      const formData1 = new FormData()
      formData1.append('pdf', file)
      const summaryRes = await fetch('/api/summarize', { method: 'POST', body: formData1 })
      const summaryData = await summaryRes.json()
      if (summaryData.error) throw new Error(summaryData.error)
      setSummary(summaryData.summary)

      setStep('🃏 Generating flashcards...')
      const formData2 = new FormData()
      formData2.append('pdf', file)
      const flashRes = await fetch('/api/flashcards', { method: 'POST', body: formData2 })
      const flashData = await flashRes.json()
      if (!flashData.error) setFlashcards(flashData.flashcards)

      setStep('❓ Generating MCQ quiz...')
      const formData3 = new FormData()
      formData3.append('pdf', file)
      formData3.append('count', mcqCount.toString())
      formData3.append('difficulty', mcqDifficulty)
      const mcqRes = await fetch('/api/mcqs', { method: 'POST', body: formData3 })
      const mcqData = await mcqRes.json()
      if (!mcqData.error) setMcqs(mcqData.mcqs)

      setActiveTab('summary')
      setStep('')
    } catch (err: any) {
      setError(err.message)
      setStep('')
    }

    setLoading(false)
  }

  const handleAnswer = (index: number) => {
    if (selected !== null) return
    setSelected(index)
    if (index === mcqs[currentQ].correct) setScore(s => s + 1)
  }

  const nextQuestion = () => {
    setSelected(null)
    setCurrentQ(q => q + 1)
  }

  const tabs = ['summary', 'flashcards', 'mcqs', 'examquestions']

  const selectStyle = {
    width: '100%', padding: '0.65rem 0.9rem',
    background: '#111110', border: '1px solid #2a2a22',
    borderRadius: '8px', color: '#f5f5f0',
    fontSize: '0.85rem', fontFamily: 'inherit',
    outline: 'none', cursor: 'pointer'
  }

  const labelStyle = {
    fontSize: '0.72rem', color: '#5a5a4a',
    marginBottom: '0.4rem', fontFamily: 'monospace',
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    display: 'block'
  }

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

      <div style={{maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem'}}>

        <div style={{marginBottom: '2.5rem'}}>
          <h1 style={{fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem'}}>
            AI Study Assistant
          </h1>
          <p style={{fontSize: '0.85rem', color: '#5a5a4a'}}>
            Upload your lecture notes — get summaries, flashcards and quiz questions instantly
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => document.getElementById('fileInput')?.click()}
          style={{
            border: `2px dashed ${dragging ? '#f59e0b' : '#2a2a22'}`,
            borderRadius: '14px', padding: '3rem 2rem',
            textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(245,158,11,0.04)' : '#111110',
            transition: 'all 0.2s', marginBottom: '1rem'
          }}
        >
          <input id="fileInput" type="file" accept=".pdf" style={{display: 'none'}}
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div style={{fontSize: '2rem', marginBottom: '0.75rem'}}>📄</div>
          {file ? (
            <div>
              <p style={{fontWeight: 700, color: '#f59e0b', marginBottom: '0.25rem'}}>{file.name}</p>
              <p style={{fontSize: '0.8rem', color: '#5a5a4a'}}>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF ready</p>
            </div>
          ) : (
            <div>
              <p style={{fontWeight: 600, marginBottom: '0.35rem'}}>Drop your PDF here</p>
              <p style={{fontSize: '0.8rem', color: '#5a5a4a'}}>or click to browse · PDF files only</p>
            </div>
          )}
        </div>

        {/* MCQ Settings */}
        <div style={{
          display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap',
          background: '#111110', border: '1px solid #1f1f18',
          borderRadius: '12px', padding: '1.25rem'
        }}>
          <div style={{flex: 1, minWidth: '140px'}}>
            <label style={labelStyle}>Number of MCQs</label>
            <select value={mcqCount} onChange={(e) => setMcqCount(Number(e.target.value))} style={selectStyle}>
              <option value={5}>5 questions</option>
              <option value={8}>8 questions</option>
              <option value={10}>10 questions</option>
              <option value={15}>15 questions</option>
              <option value={20}>20 questions</option>
            </select>
          </div>
          <div style={{flex: 1, minWidth: '140px'}}>
            <label style={labelStyle}>Difficulty</label>
            <select value={mcqDifficulty} onChange={(e) => setMcqDifficulty(e.target.value)} style={selectStyle}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="exam">Exam Level</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button onClick={generate} disabled={!file || loading} style={{
          width: '100%', padding: '1rem', borderRadius: '10px', border: 'none',
          background: file && !loading ? '#f59e0b' : '#1a1a14',
          color: file && !loading ? '#0d0d0a' : '#3a3a30',
          fontSize: '0.95rem', fontWeight: 700,
          cursor: file && !loading ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit', marginBottom: '2rem', transition: 'all 0.2s'
        }}>
          {loading ? step || 'Generating...' : file ? 'Generate Study Materials →' : 'Upload a PDF to get started'}
        </button>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px', padding: '0.9rem 1rem',
            fontSize: '0.82rem', color: '#f87171', marginBottom: '1.5rem'
          }}>⚠️ {error}</div>
        )}

        {/* Tabs */}
        <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap'}}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '0.5rem 1rem', borderRadius: '8px',
              border: `1px solid ${activeTab === tab ? '#f59e0b' : '#2a2a22'}`,
              background: activeTab === tab ? '#f59e0b' : '#111110',
              color: activeTab === tab ? '#0d0d0a' : '#5a5a4a',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}>
              {tab === 'examquestions' ? 'Exam Questions' : tab === 'mcqs' ? 'MCQs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'flashcards' && flashcards.length > 0 && <span style={{marginLeft: '0.4rem', fontSize: '0.7rem'}}>({flashcards.length})</span>}
              {tab === 'mcqs' && mcqs.length > 0 && <span style={{marginLeft: '0.4rem', fontSize: '0.7rem'}}>({mcqs.length})</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{background: '#111110', border: '1px solid #1f1f18', borderRadius: '14px', padding: '2rem'}}>

          {/* Summary */}
          {activeTab === 'summary' && (
            summary ? (
              <div>
                {summary.split('\n').map((line, i) => (
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
            ) : (
              <div style={{textAlign: 'center', padding: '3rem 0'}}>
                <p style={{fontSize: '2rem', marginBottom: '0.75rem'}}>📝</p>
                <p style={{fontSize: '0.875rem', color: '#5a5a4a'}}>Upload a PDF and click Generate to see your summary here</p>
              </div>
            )
          )}

          {/* Flashcards */}
          {activeTab === 'flashcards' && (
            flashcards.length > 0 ? (
              <div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                  <p style={{fontSize: '0.78rem', color: '#5a5a4a', fontFamily: 'monospace'}}>Card {currentCard + 1} of {flashcards.length}</p>
                  <p style={{fontSize: '0.72rem', color: '#3a3a30'}}>Click to flip</p>
                </div>
                <div onClick={() => setFlipped(!flipped)} style={{
                  background: flipped ? '#181810' : '#0d0d0a',
                  border: `2px solid ${flipped ? '#f59e0b' : '#2a2a22'}`,
                  borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center',
                  cursor: 'pointer', minHeight: '180px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.5rem', transition: 'all 0.2s'
                }}>
                  <p style={{fontSize: '0.7rem', color: '#3a3a30', marginBottom: '1rem', fontFamily: 'monospace', letterSpacing: '0.1em'}}>
                    {flipped ? '✓ ANSWER' : '? QUESTION'}
                  </p>
                  <p style={{fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, color: flipped ? '#f59e0b' : '#f5f5f0'}}>
                    {flipped ? flashcards[currentCard].back : flashcards[currentCard].front}
                  </p>
                </div>
                <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'center'}}>
                  <button onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setFlipped(false) }}
                    disabled={currentCard === 0}
                    style={{padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #2a2a22', background: 'none', color: currentCard === 0 ? '#3a3a30' : '#8a8a7a', fontSize: '0.82rem', fontWeight: 600, cursor: currentCard === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit'}}>
                    ← Prev
                  </button>
                  <button onClick={() => { setFlipped(false); setCurrentCard(0) }}
                    style={{padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #2a2a22', background: 'none', color: '#8a8a7a', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'}}>
                    Restart
                  </button>
                  <button onClick={() => { setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1)); setFlipped(false) }}
                    disabled={currentCard === flashcards.length - 1}
                    style={{padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: currentCard === flashcards.length - 1 ? '#1a1a14' : '#f59e0b', color: currentCard === flashcards.length - 1 ? '#3a3a30' : '#0d0d0a', fontSize: '0.82rem', fontWeight: 700, cursor: currentCard === flashcards.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit'}}>
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '3rem 0'}}>
                <p style={{fontSize: '2rem', marginBottom: '0.75rem'}}>🃏</p>
                <p style={{fontSize: '0.875rem', color: '#5a5a4a'}}>Upload a PDF and click Generate to see flashcards here</p>
              </div>
            )
          )}

          {/* MCQs */}
          {activeTab === 'mcqs' && (
            mcqs.length > 0 ? (
              currentQ < mcqs.length ? (
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <p style={{fontSize: '0.78rem', color: '#5a5a4a', fontFamily: 'monospace'}}>
                      Question {currentQ + 1} of {mcqs.length}
                    </p>
                    <p style={{fontSize: '0.78rem', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700}}>
                      Score: {score}/{currentQ + (selected !== null ? 1 : 0)}
                    </p>
                  </div>

                  <div style={{height: '3px', background: '#1f1f18', borderRadius: '999px', marginBottom: '1.5rem'}}>
                    <div style={{height: '100%', background: '#f59e0b', borderRadius: '999px', width: `${((currentQ) / mcqs.length) * 100}%`, transition: 'width 0.3s'}}></div>
                  </div>

                  <p style={{fontSize: '1rem', fontWeight: 700, lineHeight: 1.6, marginBottom: '1.5rem'}}>
                    {mcqs[currentQ].question}
                  </p>

                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem'}}>
                    {mcqs[currentQ].options.map((option, i) => {
                      let bg = '#0d0d0a'
                      let border = '#2a2a22'
                      let color = '#f5f5f0'
                      if (selected !== null) {
                        if (i === mcqs[currentQ].correct) { bg = 'rgba(34,197,94,0.1)'; border = '#22c55e'; color = '#4ade80' }
                        else if (i === selected && i !== mcqs[currentQ].correct) { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; color = '#f87171' }
                      }
                      return (
                        <button key={i} onClick={() => handleAnswer(i)} style={{
                          padding: '1rem', borderRadius: '10px',
                          border: `1px solid ${border}`, background: bg, color,
                          fontSize: '0.875rem', fontWeight: 500, textAlign: 'left',
                          cursor: selected !== null ? 'default' : 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.15s'
                        }}>
                          <span style={{fontFamily: 'monospace', marginRight: '0.75rem', color: '#5a5a4a'}}>
                            {['A', 'B', 'C', 'D'][i]}.
                          </span>
                          {option}
                        </button>
                      )
                    })}
                  </div>

                  {selected !== null && (
                    <div>
                      <div style={{background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem'}}>
                        <p style={{fontSize: '0.8rem', color: '#c0c0b0', lineHeight: 1.6}}>
                          💡 {mcqs[currentQ].explanation}
                        </p>
                      </div>
                      <button onClick={nextQuestion} style={{
                        width: '100%', padding: '0.9rem', borderRadius: '10px', border: 'none',
                        background: '#f59e0b', color: '#0d0d0a',
                        fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                      }}>
                        Next Question →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '2rem 0'}}>
                  <p style={{fontSize: '2.5rem', marginBottom: '1rem'}}>🎉</p>
                  <h3 style={{fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem'}}>Quiz Complete!</h3>
                  <p style={{fontSize: '1rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem'}}>
                    Score: {score}/{mcqs.length}
                  </p>
                  <p style={{fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '2rem'}}>
                    {score === mcqs.length ? 'Perfect score! 🏆' : score >= mcqs.length * 0.7 ? 'Great job! Keep it up 💪' : 'Keep studying — you got this! 📚'}
                  </p>
                  <button onClick={() => { setCurrentQ(0); setSelected(null); setScore(0) }} style={{
                    padding: '0.85rem 2rem', borderRadius: '10px', border: 'none',
                    background: '#f59e0b', color: '#0d0d0a',
                    fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                  }}>
                    Retry Quiz →
                  </button>
                </div>
              )
            ) : (
              <div style={{textAlign: 'center', padding: '3rem 0'}}>
                <p style={{fontSize: '2rem', marginBottom: '0.75rem'}}>❓</p>
                <p style={{fontSize: '0.875rem', color: '#5a5a4a'}}>Upload a PDF and click Generate to see your MCQ quiz here</p>
              </div>
            )
          )}

          {/* Exam Questions */}
          {activeTab === 'examquestions' && (
            <div style={{textAlign: 'center', padding: '3rem 0'}}>
              <p style={{fontSize: '2rem', marginBottom: '0.75rem'}}>🎯</p>
              <p style={{fontSize: '0.875rem', color: '#5a5a4a'}}>Exam Questions — coming next!</p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}  