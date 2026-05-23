'use client'

import { useState } from 'react'

export default function Assistant() {
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [flashcards, setFlashcards] = useState<{front: string, back: string}[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('')

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
    setCurrentCard(0)
    setFlipped(false)

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

      setActiveTab('summary')
      setStep('')
    } catch (err: any) {
      setError(err.message)
      setStep('')
    }

    setLoading(false)
  }

  const tabs = ['summary', 'flashcards', 'mcqs', 'examquestions']

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d0d0a',
      color: '#f5f5f0',
      fontFamily: 'Inter, sans-serif',
      padding: '0'
    }}>
      {/* Nav */}
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

        {/* Header */}
        <div style={{marginBottom: '2.5rem'}}>
          <h1 style={{fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem'}}>
            AI Study Assistant
          </h1>
          <p style={{fontSize: '0.85rem', color: '#5a5a4a'}}>
            Upload your lecture notes — get summaries, flashcards and exam materials instantly
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
            borderRadius: '14px',
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(245,158,11,0.04)' : '#111110',
            transition: 'all 0.2s',
            marginBottom: '1rem'
          }}
        >
          <input
            id="fileInput"
            type="file"
            accept=".pdf"
            style={{display: 'none'}}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div style={{fontSize: '2rem', marginBottom: '0.75rem'}}>📄</div>
          {file ? (
            <div>
              <p style={{fontWeight: 700, color: '#f59e0b', marginBottom: '0.25rem'}}>{file.name}</p>
              <p style={{fontSize: '0.8rem', color: '#5a5a4a'}}>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF ready to process</p>
            </div>
          ) : (
            <div>
              <p style={{fontWeight: 600, marginBottom: '0.35rem'}}>Drop your PDF here</p>
              <p style={{fontSize: '0.8rem', color: '#5a5a4a'}}>or click to browse · PDF files only</p>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generate}
          disabled={!file || loading}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '10px',
            border: 'none',
            background: file && !loading ? '#f59e0b' : '#1a1a14',
            color: file && !loading ? '#0d0d0a' : '#3a3a30',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: file && !loading ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            marginBottom: '2rem',
            transition: 'all 0.2s'
          }}
        >
          {loading ? step || 'Generating...' : file ? 'Generate Study Materials →' : 'Upload a PDF to get started'}
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

        {/* Tabs */}
        <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap'}}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${activeTab === tab ? '#f59e0b' : '#2a2a22'}`,
                background: activeTab === tab ? '#f59e0b' : '#111110',
                color: activeTab === tab ? '#0d0d0a' : '#5a5a4a',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'examquestions' ? 'Exam Questions' : tab === 'mcqs' ? 'MCQs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'flashcards' && flashcards.length > 0 && (
                <span style={{marginLeft: '0.4rem', fontSize: '0.7rem', opacity: 0.8}}>({flashcards.length})</span>
              )}
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
                  <p style={{fontSize: '0.78rem', color: '#5a5a4a', fontFamily: 'monospace'}}>
                    Card {currentCard + 1} of {flashcards.length}
                  </p>
                  <p style={{fontSize: '0.72rem', color: '#3a3a30'}}>Click to flip</p>
                </div>

                <div
                  onClick={() => setFlipped(!flipped)}
                  style={{
                    background: flipped ? '#181810' : '#0d0d0a',
                    border: `2px solid ${flipped ? '#f59e0b' : '#2a2a22'}`,
                    borderRadius: '12px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <p style={{fontSize: '0.7rem', color: '#3a3a30', marginBottom: '1rem', fontFamily: 'monospace', letterSpacing: '0.1em'}}>
                    {flipped ? '✓ ANSWER' : '? QUESTION'}
                  </p>
                  <p style={{fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, color: flipped ? '#f59e0b' : '#f5f5f0'}}>
                    {flipped ? flashcards[currentCard].back : flashcards[currentCard].front}
                  </p>
                </div>

                <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'center'}}>
                  <button
                    onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setFlipped(false) }}
                    disabled={currentCard === 0}
                    style={{
                      padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #2a2a22',
                      background: 'none', color: currentCard === 0 ? '#3a3a30' : '#8a8a7a',
                      fontSize: '0.82rem', fontWeight: 600, cursor: currentCard === 0 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >← Prev</button>
                  <button
                    onClick={() => { setFlipped(false); setCurrentCard(0) }}
                    style={{
                      padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #2a2a22',
                      background: 'none', color: '#8a8a7a', fontSize: '0.82rem',
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >Restart</button>
                  <button
                    onClick={() => { setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1)); setFlipped(false) }}
                    disabled={currentCard === flashcards.length - 1}
                    style={{
                      padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                      background: currentCard === flashcards.length - 1 ? '#1a1a14' : '#f59e0b',
                      color: currentCard === flashcards.length - 1 ? '#3a3a30' : '#0d0d0a',
                      fontSize: '0.82rem', fontWeight: 700,
                      cursor: currentCard === flashcards.length - 1 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >Next →</button>
                </div>
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '3rem 0'}}>
                <p style={{fontSize: '2rem', marginBottom: '0.75rem'}}>🃏</p>
                <p style={{fontSize: '0.875rem', color: '#5a5a4a'}}>Upload a PDF and click Generate to see flashcards here</p>
              </div>
            )
          )}

          {/* MCQs + Exam Questions placeholders */}
          {(activeTab === 'mcqs' || activeTab === 'examquestions') && (
            <div style={{textAlign: 'center', padding: '3rem 0'}}>
              <p style={{fontSize: '2rem', marginBottom: '0.75rem'}}>{activeTab === 'mcqs' ? '❓' : '🎯'}</p>
              <p style={{fontSize: '0.875rem', color: '#5a5a4a'}}>
                {activeTab === 'mcqs' ? 'MCQ Quiz' : 'Exam Questions'} — coming next!
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}