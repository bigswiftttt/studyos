'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

type Material = {
  id: string
  name: string
  size: number
  path: string
  url: string
  created_at: string
}

export default function Materials() {
  const [user, setUser] = useState<any>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUser(user); fetchMaterials(user.id) }
      else setLoading(false)
    })
  }, [])

  const fetchMaterials = async (userId: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    console.log('data:', data, 'error:', error)
    if (data) setMaterials(data)
    setLoading(false)
  }

  const handleUpload = async (file: File) => {
    if (!user) return
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.')
      return
    }
    setUploading(true)
    setError('')

    const path = `${user.id}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(path, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path)

    await supabase.from('materials').insert({
      user_id: user.id,
      name: file.name,
      size: file.size,
      path,
      url: urlData.publicUrl,
    })

    setUploading(false)
    fetchMaterials(user.id)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const confirmDelete = async () => {
    if (!deleteId || !user) return
    setDeleting(true)
    const material = materials.find(m => m.id === deleteId)
    if (material) {
      await supabase.storage.from('materials').remove([material.path])
      await supabase.from('materials').delete().eq('id', deleteId)
    }
    setDeleteId(null)
    setDeleting(false)
    fetchMaterials(user.id)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem' }}>
              Materials
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5a5a4a' }}>
              Upload and manage your PDF study files.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '0.65rem 1.25rem', borderRadius: '9px', border: 'none',
              background: uploading ? '#1a1a14' : '#f59e0b',
              color: uploading ? '#3a3a30' : '#0d0d0a',
              fontSize: '0.85rem', fontWeight: 700,
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap'
            }}
          >
            {uploading ? 'Uploading...' : '+ Upload PDF'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          />
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#f59e0b' : '#2a2a22'}`,
            borderRadius: '14px', padding: '2.5rem',
            textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer',
            background: dragging ? 'rgba(245,158,11,0.04)' : '#111110',
            transition: 'all 0.2s', marginBottom: '1.5rem'
          }}
        >
          <p style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📄</p>
          {uploading ? (
            <p style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: 600 }}>Uploading...</p>
          ) : (
            <>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Drop a PDF here or <span style={{ color: '#f59e0b' }}>browse</span>
              </p>
              <p style={{ fontSize: '0.75rem', color: '#3a3a30', fontFamily: 'monospace' }}>PDF files only</p>
            </>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px', padding: '0.9rem 1rem',
            fontSize: '0.82rem', color: '#f87171', marginBottom: '1.5rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: '#3a3a30' }}>Loading...</p>
          </div>
        ) : materials.length === 0 ? (
          <div style={{
            background: '#111110', border: '1px solid #1f1f18',
            borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center'
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📂</p>
            <p style={{ fontSize: '0.875rem', color: '#5a5a4a' }}>No PDFs yet. Upload your first file above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {materials.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#111110', border: '1px solid #1f1f18',
                borderRadius: '12px', padding: '1rem 1.25rem', gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>📄</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.875rem', fontWeight: 600, color: '#e0e0d0',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px'
                    }}>
                      {m.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#3a3a30', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                      {formatSize(m.size)} · {formatDate(m.created_at)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <a
                    href={`/assistant?url=${encodeURIComponent(m.url)}&name=${encodeURIComponent(m.name)}`}
                    style={{
                      padding: '0.45rem 0.85rem', borderRadius: '7px',
                      border: '1px solid #2a2a22', background: 'transparent',
                      color: '#8a8a7a', fontSize: '0.75rem', fontWeight: 600,
                      textDecoration: 'none', fontFamily: 'inherit'
                    }}
                  >
                    Open in Assistant
                  </a>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.45rem 0.75rem', borderRadius: '7px',
                      border: '1px solid #2a2a22', background: 'transparent',
                      color: '#8a8a7a', fontSize: '0.75rem', fontWeight: 600,
                      textDecoration: 'none', fontFamily: 'inherit'
                    }}
                  >
                    View
                  </a>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    style={{
                      padding: '0.45rem 0.75rem', borderRadius: '7px',
                      border: '1px solid rgba(239,68,68,0.2)', background: 'transparent',
                      color: '#f87171', fontSize: '0.75rem', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div style={{ background: '#111110', border: '1px solid #2a2a22', borderRadius: '16px', padding: '2rem', maxWidth: '380px', width: '100%' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Delete file?</p>
            <p style={{ fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This will permanently remove the file. This cannot be undone.
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
