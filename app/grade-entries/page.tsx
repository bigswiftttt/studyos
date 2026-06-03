'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Semester = {
    id: string
    name: string
    created_at: string
}

type GradeEntry = {
    id: string
    semester_id: string
    course_title: string
    course_code: string
    units: number
    grade: string
}

type PredictorCourse = {
    id: string
    title: string
    units: string
    expectedGrade: string
}

const GRADE_POINTS_5: Record<string, number> = {
    'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
}

const GRADE_POINTS_4: Record<string, number> = {
    'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0
}

const GRADE_COLORS: Record<string, string> = {
    'A': '#22c55e', 'B': '#f59e0b', 'C': '#f97316', 'D': '#ef4444', 'E': '#ef4444', 'F': '#dc2626'
}

export default function GradeEntries() {
    const [user, setUser] = useState<any>(null)
    const [semesters, setSemesters] = useState<Semester[]>([])
    const [entries, setEntries] = useState<GradeEntry[]>([])
    const [activeSemester, setActiveSemester] = useState<string | null>(null)
    const [scale, setScale] = useState<4 | 5>(5)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'grades' | 'predictor'>('grades')

    // Modals
    const [showAddSemester, setShowAddSemester] = useState(false)
    const [showAddEntry, setShowAddEntry] = useState(false)
    const [editEntry, setEditEntry] = useState<GradeEntry | null>(null)
    const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)
    const [deleteSemesterId, setDeleteSemesterId] = useState<string | null>(null)

    // Form state
    const [semesterName, setSemesterName] = useState('')
    const [courseTitle, setCourseTitle] = useState('')
    const [courseCode, setCourseCode] = useState('')
    const [units, setUnits] = useState('3')
    const [grade, setGrade] = useState('A')
    const [saving, setSaving] = useState(false)

    // Predictor state
    const [predictorCourses, setPredictorCourses] = useState<PredictorCourse[]>([
        { id: '1', title: '', units: '3', expectedGrade: 'A' }
    ])

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) { setUser(user); fetchAll(user.id) }
            else setLoading(false)
        })
    }, [])

    const fetchAll = async (userId: string) => {
        setLoading(true)
        const { data: semData } = await supabase
            .from('semesters').select('*').eq('user_id', userId).order('created_at', { ascending: true })
        const { data: entryData } = await supabase
            .from('grade_entries').select('*').eq('user_id', userId)

        if (semData) {
            setSemesters(semData)
            if (semData.length > 0 && !activeSemester) setActiveSemester(semData[semData.length - 1].id)
        }
        if (entryData) setEntries(entryData)
        setLoading(false)
    }

    const addSemester = async () => {
        if (!semesterName.trim() || !user) return
        setSaving(true)
        const { data } = await supabase.from('semesters').insert({ user_id: user.id, name: semesterName }).select().single()
        if (data) { setActiveSemester(data.id); setSemesterName(''); setShowAddSemester(false) }
        setSaving(false)
        fetchAll(user.id)
    }

    const addEntry = async () => {
        if (!courseTitle.trim() || !activeSemester || !user) return
        setSaving(true)
        await supabase.from('grade_entries').insert({
            user_id: user.id, semester_id: activeSemester,
            course_title: courseTitle, course_code: courseCode,
            units: parseInt(units), grade
        })
        resetEntryForm()
        setShowAddEntry(false)
        setSaving(false)
        fetchAll(user.id)
    }

    const saveEditEntry = async () => {
        if (!editEntry || !user) return
        setSaving(true)
        await supabase.from('grade_entries').update({
            course_title: courseTitle, course_code: courseCode,
            units: parseInt(units), grade
        }).eq('id', editEntry.id)
        resetEntryForm()
        setEditEntry(null)
        setSaving(false)
        fetchAll(user.id)
    }

    const confirmDeleteEntry = async () => {
        if (!deleteEntryId || !user) return
        await supabase.from('grade_entries').delete().eq('id', deleteEntryId)
        setDeleteEntryId(null)
        fetchAll(user.id)
    }

    const confirmDeleteSemester = async () => {
        if (!deleteSemesterId || !user) return
        await supabase.from('grade_entries').delete().eq('semester_id', deleteSemesterId)
        await supabase.from('semesters').delete().eq('id', deleteSemesterId)
        if (activeSemester === deleteSemesterId) setActiveSemester(semesters.find(s => s.id !== deleteSemesterId)?.id || null)
        setDeleteSemesterId(null)
        fetchAll(user.id)
    }

    const openEditEntry = (entry: GradeEntry) => {
        setCourseTitle(entry.course_title)
        setCourseCode(entry.course_code || '')
        setUnits(entry.units.toString())
        setGrade(entry.grade)
        setEditEntry(entry)
    }

    const resetEntryForm = () => {
        setCourseTitle(''); setCourseCode(''); setUnits('3'); setGrade('A')
    }

    // Predictor helpers
    const addPredictorCourse = () => {
        setPredictorCourses(prev => [...prev, { id: Date.now().toString(), title: '', units: '3', expectedGrade: 'A' }])
    }

    const removePredictorCourse = (id: string) => {
        setPredictorCourses(prev => prev.filter(c => c.id !== id))
    }

    const updatePredictorCourse = (id: string, field: keyof PredictorCourse, value: string) => {
        setPredictorCourses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    }

    const gradePoints = scale === 5 ? GRADE_POINTS_5 : GRADE_POINTS_4
    const grades = scale === 5 ? ['A', 'B', 'C', 'D', 'E', 'F'] : ['A', 'B', 'C', 'D', 'F']

    const calcGPA = (semEntries: GradeEntry[]) => {
        if (semEntries.length === 0) return null
        const totalPoints = semEntries.reduce((acc, e) => acc + (gradePoints[e.grade] ?? 0) * e.units, 0)
        const totalUnits = semEntries.reduce((acc, e) => acc + e.units, 0)
        return totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : null
    }

    const calcCGPA = () => {
        if (entries.length === 0) return null
        const totalPoints = entries.reduce((acc, e) => acc + (gradePoints[e.grade] ?? 0) * e.units, 0)
        const totalUnits = entries.reduce((acc, e) => acc + e.units, 0)
        return totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : null
    }

    // Predictor calculation
    const calcPredictedCGPA = () => {
        const validNew = predictorCourses.filter(c => parseInt(c.units) > 0)
        if (validNew.length === 0) return null

        const existingPoints = entries.reduce((acc, e) => acc + (gradePoints[e.grade] ?? 0) * e.units, 0)
        const existingUnits = entries.reduce((acc, e) => acc + e.units, 0)

        const newPoints = validNew.reduce((acc, c) => acc + (gradePoints[c.expectedGrade] ?? 0) * parseInt(c.units), 0)
        const newUnits = validNew.reduce((acc, c) => acc + parseInt(c.units), 0)

        const totalPoints = existingPoints + newPoints
        const totalUnits = existingUnits + newUnits

        return totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : null
    }

    const cgpa = calcCGPA()
    const predictedCGPA = calcPredictedCGPA()
    const cgpaNum = cgpa ? parseFloat(cgpa) : 0
    const predictedNum = predictedCGPA ? parseFloat(predictedCGPA) : 0
    const cgpaColor = (n: number) => n >= (scale === 5 ? 4.5 : 3.5) ? '#22c55e' : n >= (scale === 5 ? 3.5 : 2.5) ? '#f59e0b' : n >= (scale === 5 ? 2.5 : 1.5) ? '#f97316' : '#ef4444'

    const activeEntries = entries.filter(e => e.semester_id === activeSemester)
    const semesterGPA = calcGPA(activeEntries)

    const inputStyle = {
        width: '100%', padding: '0.75rem 1rem',
        background: '#0d0d0a', border: '1px solid #1f1f18',
        borderRadius: '8px', color: '#f5f5f0',
        fontSize: '0.875rem', fontFamily: 'Inter, sans-serif',
        outline: 'none', boxSizing: 'border-box' as const
    }

    const labelStyle = {
        fontSize: '0.7rem', color: '#5a5a4a', fontFamily: 'monospace',
        letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        display: 'block', marginBottom: '0.4rem'
    }

    if (loading) return (
        <main style={{ minHeight: '100vh', background: '#0d0d0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#5a5a4a', fontSize: '0.875rem' }}>Loading...</p>
        </main>
    )

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

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem' }}>
                            Grade Entries
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: '#5a5a4a' }}>Track your courses, grades and CGPA by semester.</p>
                    </div>
                    {/* GPA Scale Toggle */}
                    <div style={{ display: 'flex', gap: '0.4rem', background: '#111110', border: '1px solid #1f1f18', borderRadius: '10px', padding: '0.3rem' }}>
                        {([5, 4] as const).map(s => (
                            <button key={s} onClick={() => setScale(s)} style={{
                                padding: '0.4rem 0.9rem', borderRadius: '7px', border: 'none',
                                background: scale === s ? '#f59e0b' : 'transparent',
                                color: scale === s ? '#0d0d0a' : '#5a5a4a',
                                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                            }}>
                                {s}.0 Scale
                            </button>
                        ))}
                    </div>
                </div>

                {/* CGPA Card */}
                <div style={{
                    background: '#111110', border: `1px solid ${cgpa ? cgpaColor(cgpaNum) + '40' : '#1f1f18'}`,
                    borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
                }}>
                    <div>
                        <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            Cumulative GPA
                        </p>
                        <p style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'monospace', color: cgpa ? cgpaColor(cgpaNum) : '#2a2a22', lineHeight: 1 }}>
                            {cgpa ?? '—'}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginTop: '0.4rem' }}>
                            {cgpa ? `out of ${scale}.0` : 'No entries yet'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                        <p style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>{entries.length} courses · {entries.reduce((a, e) => a + e.units, 0)} total units</p>
                        <p style={{ fontSize: '0.72rem', color: '#5a5a4a' }}>{semesters.length} semesters</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#111110', border: '1px solid #1f1f18', borderRadius: '12px', padding: '0.35rem' }}>
                    {[
                        { key: 'grades', label: '📋 Grade Records' },
                        { key: 'predictor', label: '🔮 CGPA Predictor' }
                    ].map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
                            flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none',
                            background: activeTab === t.key ? '#f59e0b' : 'transparent',
                            color: activeTab === t.key ? '#0d0d0a' : '#5a5a4a',
                            fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.2s'
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── GRADE RECORDS TAB ── */}
                {activeTab === 'grades' && (
                    <>
                        {/* Semester Tabs */}
                        {semesters.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {semesters.map(s => (
                                    <button key={s.id} onClick={() => setActiveSemester(s.id)} style={{
                                        padding: '0.5rem 1rem', borderRadius: '8px',
                                        border: `1px solid ${activeSemester === s.id ? '#f59e0b' : '#2a2a22'}`,
                                        background: activeSemester === s.id ? '#f59e0b' : '#111110',
                                        color: activeSemester === s.id ? '#0d0d0a' : '#5a5a4a',
                                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                                    }}>
                                        {s.name}
                                    </button>
                                ))}
                                <button onClick={() => setShowAddSemester(true)} style={{
                                    padding: '0.5rem 1rem', borderRadius: '8px',
                                    border: '1px dashed #2a2a22', background: 'transparent',
                                    color: '#5a5a4a', fontSize: '0.8rem', fontWeight: 600,
                                    cursor: 'pointer', fontFamily: 'inherit'
                                }}>
                                    + New Semester
                                </button>
                            </div>
                        )}

                        {/* No semesters */}
                        {semesters.length === 0 && (
                            <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</p>
                                <p style={{ fontSize: '0.875rem', color: '#5a5a4a', marginBottom: '1.5rem' }}>No semesters yet. Create your first one to start tracking grades.</p>
                                <button onClick={() => setShowAddSemester(true)} style={{
                                    padding: '0.75rem 1.5rem', borderRadius: '9px', border: 'none',
                                    background: '#f59e0b', color: '#0d0d0a', fontSize: '0.875rem',
                                    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                                }}>
                                    + Add First Semester
                                </button>
                            </div>
                        )}

                        {/* Active Semester Panel */}
                        {activeSemester && (
                            <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '14px', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #1a1a14', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{semesters.find(s => s.id === activeSemester)?.name}</p>
                                        {semesterGPA && (
                                            <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginTop: '0.15rem' }}>
                                                Semester GPA: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{semesterGPA}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => { resetEntryForm(); setShowAddEntry(true) }} style={{
                                            padding: '0.45rem 0.9rem', borderRadius: '7px', border: 'none',
                                            background: '#f59e0b', color: '#0d0d0a',
                                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                                        }}>
                                            + Add Course
                                        </button>
                                        <button onClick={() => setDeleteSemesterId(activeSemester)} style={{
                                            padding: '0.45rem 0.75rem', borderRadius: '7px',
                                            border: '1px solid rgba(239,68,68,0.2)', background: 'transparent',
                                            color: '#f87171', fontSize: '0.78rem', fontWeight: 600,
                                            cursor: 'pointer', fontFamily: 'inherit'
                                        }}>
                                            Delete Semester
                                        </button>
                                    </div>
                                </div>

                                {activeEntries.length === 0 ? (
                                    <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.875rem', color: '#5a5a4a' }}>No courses yet. Add your first course above.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '0.5rem', padding: '0.6rem 1.25rem', borderBottom: '1px solid #1a1a14' }}>
                                            {['Course', 'Code', 'Units', 'Grade', ''].map((h, i) => (
                                                <p key={i} style={{ fontSize: '0.65rem', color: '#3a3a30', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: i > 1 ? 'center' : 'left' }}>{h}</p>
                                            ))}
                                        </div>
                                        {activeEntries.map(entry => (
                                            <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '0.5rem', padding: '0.85rem 1.25rem', borderBottom: '1px solid #1a1a14', alignItems: 'center' }}>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e0e0d0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.course_title}</p>
                                                <p style={{ fontSize: '0.72rem', color: '#f59e0b', fontFamily: 'monospace', fontWeight: 700, textAlign: 'center' }}>{entry.course_code || '—'}</p>
                                                <p style={{ fontSize: '0.82rem', color: '#8a8a7a', textAlign: 'center' }}>{entry.units}</p>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 800, textAlign: 'center', color: GRADE_COLORS[entry.grade] || '#f5f5f0' }}>{entry.grade}</p>
                                                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => openEditEntry(entry)} style={{ padding: '0.3rem 0.6rem', borderRadius: '5px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                                                    <button onClick={() => setDeleteEntryId(entry.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: '5px', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#f87171', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>Del</button>
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '0.5rem', padding: '0.85rem 1.25rem', background: '#0d0d0a' }}>
                                            <p style={{ fontSize: '0.72rem', color: '#5a5a4a', fontFamily: 'monospace' }}>TOTAL</p>
                                            <p style={{ fontSize: '0.72rem', color: '#3a3a30', textAlign: 'center' }}></p>
                                            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f5f5f0', textAlign: 'center' }}>{activeEntries.reduce((a, e) => a + e.units, 0)}</p>
                                            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', textAlign: 'center' }}>{semesterGPA ?? '—'}</p>
                                            <p></p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ── CGPA PREDICTOR TAB ── */}
                {activeTab === 'predictor' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Prediction Result */}
                        <div style={{
                            background: '#111110',
                            border: `1px solid ${predictedCGPA ? cgpaColor(predictedNum) + '40' : '#1f1f18'}`,
                            borderRadius: '14px', padding: '1.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
                        }}>
                            <div>
                                <p style={{ fontSize: '0.68rem', color: '#5a5a4a', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Predicted CGPA
                                </p>
                                <p style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'monospace', color: predictedCGPA ? cgpaColor(predictedNum) : '#2a2a22', lineHeight: 1 }}>
                                    {predictedCGPA ?? '—'}
                                </p>
                                <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginTop: '0.4rem' }}>
                                    {predictedCGPA ? `out of ${scale}.0` : 'Add courses below to predict'}
                                </p>
                            </div>
                            {cgpa && predictedCGPA && (
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.72rem', color: '#5a5a4a', marginBottom: '0.25rem' }}>Current CGPA</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: cgpaColor(cgpaNum) }}>{cgpa}</p>
                                    <p style={{
                                        fontSize: '0.78rem', fontWeight: 700, marginTop: '0.35rem',
                                        color: predictedNum > cgpaNum ? '#22c55e' : predictedNum < cgpaNum ? '#ef4444' : '#5a5a4a'
                                    }}>
                                        {predictedNum > cgpaNum ? `▲ +${(predictedNum - cgpaNum).toFixed(2)}` :
                                            predictedNum < cgpaNum ? `▼ ${(predictedNum - cgpaNum).toFixed(2)}` : '→ No change'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: '#8a8a7a', lineHeight: 1.6 }}>
                                💡 Enter your <strong style={{ color: '#f59e0b' }}>current semester courses</strong> with your expected grades to see how they'll affect your overall CGPA.
                                {!cgpa && <span> Add past semester grades first to get an accurate prediction.</span>}
                            </p>
                        </div>

                        {/* Predictor Course List */}
                        <div style={{ background: '#111110', border: '1px solid #1f1f18', borderRadius: '14px', overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', padding: '0.6rem 1.25rem', borderBottom: '1px solid #1a1a14' }}>
                                {['Course', 'Units', 'Expected Grade', ''].map((h, i) => (
                                    <p key={i} style={{ fontSize: '0.65rem', color: '#3a3a30', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</p>
                                ))}
                            </div>

                            {predictorCourses.map((c, idx) => (
                                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.75rem', padding: '0.85rem 1.25rem', borderBottom: '1px solid #1a1a14', alignItems: 'center' }}>
                                    <input
                                        value={c.title}
                                        onChange={e => updatePredictorCourse(c.id, 'title', e.target.value)}
                                        placeholder={`Course ${idx + 1}`}
                                        style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#f5f5f0', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const }}
                                    />
                                    <select value={c.units} onChange={e => updatePredictorCourse(c.id, 'units', e.target.value)}
                                        style={{ background: '#0d0d0a', border: '1px solid #1f1f18', borderRadius: '6px', padding: '0.5rem 0.6rem', color: '#f5f5f0', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                                        {[1, 2, 3, 4, 5, 6].map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        {grades.map(g => (
                                            <button key={g} onClick={() => updatePredictorCourse(c.id, 'expectedGrade', g)} style={{
                                                padding: '0.35rem 0.55rem', borderRadius: '5px',
                                                border: `1px solid ${c.expectedGrade === g ? GRADE_COLORS[g] : '#2a2a22'}`,
                                                background: c.expectedGrade === g ? `${GRADE_COLORS[g]}18` : 'transparent',
                                                color: c.expectedGrade === g ? GRADE_COLORS[g] : '#5a5a4a',
                                                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                                            }}>{g}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => removePredictorCourse(c.id)} style={{
                                        padding: '0.35rem 0.6rem', borderRadius: '5px',
                                        border: '1px solid rgba(239,68,68,0.2)', background: 'transparent',
                                        color: '#f87171', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit'
                                    }}>✕</button>
                                </div>
                            ))}

                            <div style={{ padding: '0.85rem 1.25rem' }}>
                                <button onClick={addPredictorCourse} style={{
                                    padding: '0.5rem 1rem', borderRadius: '7px',
                                    border: '1px dashed #2a2a22', background: 'transparent',
                                    color: '#5a5a4a', fontSize: '0.8rem', fontWeight: 600,
                                    cursor: 'pointer', fontFamily: 'inherit'
                                }}>
                                    + Add Course
                                </button>
                            </div>
                        </div>

                    </div>
                )}

            </div>

            {/* Add Semester Modal */}
            {showAddSemester && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#111110', border: '1px solid #2a2a22', borderRadius: '16px', padding: '1.75rem', maxWidth: '400px', width: '100%' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>New Semester</p>
                        <label style={labelStyle}>Semester Name</label>
                        <input value={semesterName} onChange={e => setSemesterName(e.target.value)}
                            placeholder="e.g. Year 1 Semester 1" style={{ ...inputStyle, marginBottom: '1.25rem' }} />
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setShowAddSemester(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button onClick={addSemester} disabled={saving} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: 'none', background: '#f59e0b', color: '#0d0d0a', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {saving ? 'Saving...' : 'Add Semester'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Entry Modal */}
            {(showAddEntry || editEntry) && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#111110', border: '1px solid #2a2a22', borderRadius: '16px', padding: '1.75rem', maxWidth: '420px', width: '100%' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>{editEntry ? 'Edit Course' : 'Add Course'}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div>
                                <label style={labelStyle}>Course Title</label>
                                <input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="e.g. Human Anatomy" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Course Code</label>
                                <input value={courseCode} onChange={e => setCourseCode(e.target.value.toUpperCase())} placeholder="e.g. ANAT301" style={{ ...inputStyle, color: '#f59e0b', fontFamily: 'monospace' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Units</label>
                                    <select value={units} onChange={e => setUnits(e.target.value)} style={{ ...inputStyle }}>
                                        {[1, 2, 3, 4, 5, 6].map(u => <option key={u} value={u}>{u} units</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Grade</label>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {grades.map(g => (
                                            <button key={g} onClick={() => setGrade(g)} style={{
                                                padding: '0.5rem 0.75rem', borderRadius: '7px',
                                                border: `1px solid ${grade === g ? GRADE_COLORS[g] : '#2a2a22'}`,
                                                background: grade === g ? `${GRADE_COLORS[g]}18` : 'transparent',
                                                color: grade === g ? GRADE_COLORS[g] : '#5a5a4a',
                                                fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                                            }}>{g}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                <button onClick={() => { resetEntryForm(); setShowAddEntry(false); setEditEntry(null) }} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                                <button onClick={editEntry ? saveEditEntry : addEntry} disabled={saving} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: 'none', background: '#f59e0b', color: '#0d0d0a', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {saving ? 'Saving...' : editEntry ? 'Save Changes' : 'Add Course'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Entry Modal */}
            {deleteEntryId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#111110', border: '1px solid #2a2a22', borderRadius: '16px', padding: '1.75rem', maxWidth: '380px', width: '100%' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Delete course?</p>
                        <p style={{ fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '1.5rem', lineHeight: 1.6 }}>This will permanently remove this course entry.</p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDeleteEntryId(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button onClick={confirmDeleteEntry} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Semester Modal */}
            {deleteSemesterId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#111110', border: '1px solid #2a2a22', borderRadius: '16px', padding: '1.75rem', maxWidth: '380px', width: '100%' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Delete semester?</p>
                        <p style={{ fontSize: '0.85rem', color: '#5a5a4a', marginBottom: '1.5rem', lineHeight: 1.6 }}>This will permanently delete this semester and all its course entries.</p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDeleteSemesterId(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: '1px solid #2a2a22', background: 'transparent', color: '#8a8a7a', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button onClick={confirmDeleteSemester} style={{ flex: 1, padding: '0.75rem', borderRadius: '9px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    )
}
