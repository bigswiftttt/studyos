'use client'

import { useState } from 'react'

export default function Assistant() {
  const [activeTab, setActiveTab] = useState('summary')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState('')
  const [notes, setNotes] = useState('')

  const generate = async () => {
    if (!notes.trim()) return
    setLoading(true)
    setError('')
    setSummary('')

    try {
      setStep('🤖 AI is analyzing your notes...')
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: notes })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setSummary(data.summary)
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
            <p className="mt-1 text-sm" style={{color: '#5a5a4a'}}>Paste your notes and get instant study materials</p>
          </div>
          <a href="/dashboard" className="text-sm font-bold" style={{color: '#f59e0b'}}>← Dashboard</a>
        </div>

        {/* Notes Input */}
        <div className="rounded-2xl border mb-6" style={{background: '#111110', borderColor: '#1f1f18'}}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-bold" style={{color: '#5a5a4a'}}>📝 Paste your lecture notes here</p>
            <span className="text-xs font-mono" style={{color: '#3a3a30'}}>{notes.length} chars</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your lecture notes, textbook content, or any study material here...

Tip: Open your PDF → Select All (Ctrl+A) → Copy (Ctrl+C) → Paste here"
            className="w-full rounded-b-2xl p-4 text-sm outline-none resize-none"
            style={{
              background: '#111110',
              color: '#fafaf5',
              minHeight: '200px',
              border: 'none'
            }}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={generate}
          disabled={!notes.trim() || loading}
          className="w-full font-bold py-4 rounded-xl text-lg mb-8 transition-all"
          style={{
            background: notes.trim() && !loading ? '#f59e0b' : '#1f1f18',
            color: notes.trim() && !loading ? '#0d0d0a' : '#3a3a30',
            cursor: notes.trim() && !loading ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? step || 'Generating...' : notes.trim() ? 'Generate Study Materials →' : 'Paste your notes to get started'}
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
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border p-8" style={{background: '#111110', borderColor: '#1f1f18'}}>
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
                <p className="font-bold" style={{color: '#5a5a4a'}}>Paste your notes and click Generate to see your summary here</p>
              </div>
            )
          )}

          {activeTab !== 'summary' && (
            <div className="text-center">
              <p className="text-4xl mb-4">
                {activeTab === 'flashcards' ? '🃏' : activeTab === 'mcqs' ? '❓' : '🎯'}
              </p>
              <p className="font-bold" style={{color: '#5a5a4a'}}>
                {activeTab === 'examquestions' ? 'Exam Questions' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} coming next!
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}