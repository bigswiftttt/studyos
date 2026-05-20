'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Assistant() {
    const [file, setFile] = useState<File | null>(null)
    const [activeTab, setActiveTab] = useState('summary')
    const [dragging, setDragging] = useState(false)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const dropped = e.dataTransfer.files[0]
        if (dropped?.type === 'application/pdf') setFile(dropped)
    }

    return (
        <main className="min-h-screen p-8" style={{ background: '#0d0d0a', color: '#fafaf5' }}>
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">🤖 AI Study Assistant</h1>
                        <p className="mt-1 text-sm" style={{ color: '#5a5a4a' }}>Upload your notes, get instant study materials</p>
                    </div>
                    <a href="/dashboard" className="text-sm font-bold" style={{ color: '#f59e0b' }}>← Dashboard</a>
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
                            <p className="font-bold text-lg" style={{ color: '#f59e0b' }}>{file.name}</p>
                            <p className="text-sm mt-1" style={{ color: '#5a5a4a' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF ready</p>
                        </div>
                    ) : (
                        <div>
                            <p className="font-bold text-lg">Drop your PDF here</p>
                            <p className="text-sm mt-1" style={{ color: '#5a5a4a' }}>or click to browse · PDF files only</p>
                        </div>
                    )}
                </div>

                {/* Generate Button */}
                <button
                    disabled={!file}
                    className="w-full font-bold py-4 rounded-xl text-lg mb-8 transition-all"
                    style={{
                        background: file ? '#f59e0b' : '#1f1f18',
                        color: file ? '#0d0d0a' : '#3a3a30',
                        cursor: file ? 'pointer' : 'not-allowed'
                    }}
                >
                    {file ? 'Generate Study Materials →' : 'Upload a PDF to get started'}
                </button>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {['summary', 'flashcards', 'mcqs', 'examquestions'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize"
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
                <div className="rounded-2xl border p-8 text-center" style={{ background: '#111110', borderColor: '#1f1f18' }}>
                    <p className="text-4xl mb-4">
                        {activeTab === 'summary' ? '📝' : activeTab === 'flashcards' ? '🃏' : activeTab === 'mcqs' ? '❓' : '🎯'}
                    </p>
                    <p className="font-bold" style={{ color: '#5a5a4a' }}>
                        Upload a PDF and click Generate to see your {activeTab === 'examquestions' ? 'exam questions' : activeTab} here
                    </p>
                </div>

            </div>
        </main>
    )
}