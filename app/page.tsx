export default function Home() {
  return (
    <main className="min-h-screen text-[#fafaf5] flex flex-col items-center justify-center px-6" style={{ background: '#0d0d0a' }}>
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-4 border-b border-[#1f1f18]" style={{ background: '#0d0d0a' }}>
        <span className="font-black text-lg tracking-tight">Study<span style={{ color: '#f59e0b' }}>OS</span></span>
        <a href="/auth/login" className="text-sm text-[#a0a090] hover:text-[#fafaf5] transition-all">Sign in</a>
      </nav>

      <div className="text-center max-w-2xl mt-16">
        <div className="inline-block text-xs font-mono tracking-widest uppercase px-3 py-1 rounded-full border mb-8" style={{ color: '#f59e0b', borderColor: '#f59e0b40', background: '#f59e0b10' }}>
          AI-powered · Built for students
        </div>
        <h1 className="text-6xl font-black tracking-tight leading-none mb-6">
          Stop studying<br />
          <span style={{ color: '#f59e0b' }}>randomly.</span>
        </h1>
        <p className="text-xl mb-4" style={{ color: '#8a8a7a' }}>
          StudyOS is your AI-powered study operating system.
        </p>
        <p className="text-base mb-10" style={{ color: '#5a5a4a' }}>
          Summaries, flashcards, focus tracking, and crash revision plans — all in one place.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="/auth/signup" className="font-bold px-8 py-3 rounded-lg transition-all text-[#0d0d0a]" style={{ background: '#f59e0b' }}>
            Get Started →
          </a>
          <a href="/auth/login" className="font-bold px-8 py-3 rounded-lg border transition-all" style={{ borderColor: '#2a2a20', color: '#8a8a7a' }}>
            Sign In
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mt-20">
        {[
          { icon: '🤖', title: 'AI Assistant', desc: 'Upload notes, get summaries, flashcards & MCQs instantly' },
          { icon: '📊', title: 'Dashboard', desc: 'Track streak, hours, tasks and upcoming exams' },
          { icon: '⏱️', title: 'Focus Mode', desc: 'Pomodoro timer with ambient sounds and session tracking' },
          { icon: '🚨', title: 'Panic Mode', desc: 'AI builds your crash revision plan before any exam' },
        ].map((f) => (
          <div key={f.title} className="rounded-xl p-5 border transition-all hover:border-[#f59e0b40]" style={{ background: '#111110', borderColor: '#1f1f18' }}>
            <div className="text-2xl mb-3">{f.icon}</div>
            <div className="font-bold text-sm mb-1">{f.title}</div>
            <div className="text-xs leading-relaxed" style={{ color: '#5a5a4a' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <p className="mt-16 text-xs font-mono" style={{ color: '#3a3a30' }}>
        StudyOS · Built for students who mean business
      </p>
    </main>
  )
}