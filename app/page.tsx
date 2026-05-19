export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a12] text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-6xl font-black tracking-tight mb-4">
        Study<span className="text-violet-500">OS</span>
      </h1>
      <p className="text-xl text-gray-400 mb-2 text-center">
        Your AI-powered study operating system
      </p>
      <p className="text-gray-500 text-center max-w-md mb-8">
        Stop studying randomly. Start studying smart.
      </p>
      <a href="/auth/signup" className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3 rounded-lg transition-all">
        Get Started
      </a>
    </main>
  )
}