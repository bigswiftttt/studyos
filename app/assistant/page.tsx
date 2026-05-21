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
      // Generate Summary
      setStep('📄 Extracting text from PDF...')
      const formData1 = new FormData()
      formData1.append('pdf', file)
      const summaryRes = await fetch('/api/summarize', {
        method: 'POST',
        body: formData1
      })
      const summaryData = await summaryRes.json()
      if (summaryData.error) throw new Error(summaryData.error)
      setSummary(summaryData.summary)

      // Generate Flashcards
      setStep('🃏 Generating flashcards...')
      const formData2 = new FormData()
      formData2.append('pdf', file)
      const flashRes = await fetch('/api/flashcards', {
        method: 'POST',
        body: formData2
      })
      const flashData = await flashRes.json()
      if (flashData.error) throw new Error(flashData.error)
      setFlashcards(flashData.flashcards)

      setActiveTab('summary')
      setStep('')
    } catch (err: any) {
      setError(err.message)
      setStep('')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen p-8" style={{background: '#0d0d0a', color: '#fafaf5'}}>
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">🤖 AI Study Assistant</h1>
            <p className="mt-1 text-sm" style={{color: '#5a5a4a'}}>Upload your PDF notes, get instant study materials</p>
          </div>
          <a href="/dashboard" className="text-sm font-bold" style={{color: '#f59e0b'}}>← Dashboard</a>
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => document.getElementById('fileInput')?.click()}
          className="rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all mb-6"
          style={{
            borderColor: dragging ? '#f59e0b' : '#1f1f18',
            background: dragging ? 'rgba(245,158,11,0.05)' : '#111110'
          }}
        >
          <input
            id="fileInput"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div className="text-4xl mb-4">📄</div>
          {file ? (
            <div>
              <p className="font-bold text-lg" style={{color: '#f59e0b'}}>{file.name}</p>
              <p className="text-sm mt-1" style={{color: '#5a5a4a'}}>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF ready</p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-lg">Drop your PDF here</p>
              <p className="text-sm mt-1" style={{color: '#5a5a4a'}}>or click to browse · PDF files only</p>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generate}
          disabled={!file || loading}
          className="w-full font-bold py-4 rounded-xl text-lg mb-8 transition-all"
          style={{
            background: file && !loading ? '#f59e0b' : '#1f1f18',
            color: file && !loading ? '#0d0d0a' : '#3a3a30',
            cursor: file && !loading ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? step || 'Generating...' : file ? 'Generate Study Materials →' : 'Upload a PDF to get started'}
        </button>

        {error && (
          <div className="rounded-xl p-4 mb-6 text-sm" style={{background: '#2a1010', border: '1px solid #5a2020', color: '#ff8080'}}>
            ⚠️ {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['summary', 'flashcards', 'mcqs', 'examquestions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                background: activeTab === tab ? '#f59e0b' : '#111110',
                color: activeTab === tab ? '#0d0d0a' : '#5a5a4a',
                border: `1px solid ${activeTab === tab ? '#f59e0b' : '#1f1f18'}`
              }}
            >
              {tab === 'examquestions' ? 'Exam Questions' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'flashcards' && flashcards.length > 0 && (
                <span className="ml-2 text-xs">({flashcards.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border p-8" style={{background: '#111110', borderColor: '#1f1f18'}}>

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            summary ? (
              <div className="max-w-none">
                {summary.split('\n').map((line, i) => (
                  <p key={i} className={`mb-2 ${line.startsWith('##') ? 'text-xl font-black mt-6' : 'text-sm leading-relaxed'}`}
                    style={{color: line.startsWith('##') ? '#f59e0b' : '#c0c0b0'}}>
                    {line.replace('## ', '')}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-4xl mb-4">📝</p>
                <p className="font-bold" style={{color: '#5a5a4a'}}>Upload a PDF and click Generate to see your summary here</p>
              </div>
            )
          )}

          {/* Flashcards Tab */}
          {activeTab === 'flashcards' && (
            flashcards.length > 0 ? (
              <div>
                {/* Card Counter */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-mono" style={{color: '#5a5a4a'}}>
                    Card {currentCard + 1} of {flashcards.length}
                  </p>
                  <p className="text-xs" style={{color: '#3a3a30'}}>Click card to flip</p>
                </div>

                {/* Flashcard */}
                <div
                  onClick={() => setFlipped(!flipped)}
                  className="rounded-2xl p-10 text-center cursor-pointer transition-all mb-6 min-h-48 flex items-center justify-center"
                  style={{
                    background: flipped ? '#1a1a0f' : '#0d0d0a',
                    border: `2px solid ${flipped ? '#f59e0b' : '#2a2a20'}`,
                    minHeight: '200px'
                  }}
                >
                  <div>
                    <p className="text-xs font-mono mb-4" style={{color: '#3a3a30'}}>
                      {flipped ? '✓ ANSWER' : '? QUESTION'}
                    </p>
                    <p className="text-lg font-bold leading-relaxed" style={{color: flipped ? '#f59e0b' : '#fafaf5'}}>
                      {flipped ? flashcards[currentCard].back : flashcards[currentCard].front}
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setFlipped(false) }}
                    disabled={currentCard === 0}
                    className="px-6 py-2 rounded-lg font-bold text-sm transition-all"
                    style={{
                      background: currentCard === 0 ? '#1a1a14' : '#1f1f18',
                      color: currentCard === 0 ? '#3a3a30' : '#8a8a7a'
                    }}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => { setFlipped(false); setCurrentCard(0) }}
                    className="px-6 py-2 rounded-lg font-bold text-sm"
                    style={{background: '#1f1f18', color: '#8a8a7a'}}
                  >
                    Restart
                  </button>
                  <button
                    onClick={() => { setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1)); setFlipped(false) }}
                    disabled={currentCard === flashcards.length - 1}
                    className="px-6 py-2 rounded-lg font-bold text-sm transition-all"
                    style={{
                      background: currentCard === flashcards.length - 1 ? '#1a1a14' : '#f59e0b',
                      color: currentCard === flashcards.length - 1 ? '#3a3a30' : '#0d0d0a'
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-4xl mb-4">🃏</p>
                <p className="font-bold" style={{color: '#5a5a4a'}}>Upload a PDF and click Generate to see flashcards here</p>
              </div>
            )
          )}

          {/* MCQs + Exam Questions placeholders */}
          {(activeTab === 'mcqs' || activeTab === 'examquestions') && (
            <div className="text-center">
              <p className="text-4xl mb-4">{activeTab === 'mcqs' ? '❓' : '🎯'}</p>
              <p className="font-bold" style={{color: '#5a5a4a'}}>
                {activeTab === 'mcqs' ? 'MCQ Quiz' : 'Exam Questions'} coming next!
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}