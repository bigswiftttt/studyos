import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { z } from 'zod'
import { requireUser } from '@/app/lib/requireUser'
import { checkRateLimit } from '@/app/lib/rateLimit'
import { extractText, FileTooLargeError } from '@/app/lib/extractText'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MCQSchema = z.array(z.object({
  question: z.string(),
  options: z.array(z.string()).min(2).max(6),
  correct: z.number().int().min(0),
  explanation: z.string(),
}))

export async function POST(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in and try again.' }, { status: 401 })
  }

  const { success, retryAfterMinutes } = await checkRateLimit(user.id, 'generate', 20, 60)
  if (!success) {
    return NextResponse.json(
      { error: `You're generating too quickly. Try again in about ${retryAfterMinutes} minute(s).` },
      { status: 429 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File
    const count = Math.min(parseInt(formData.get('count') as string) || 8, 40)
    const difficulty = formData.get('difficulty') as string || 'medium'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await extractText(file)

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract enough text from the file.' }, { status: 400 })
    }

    const difficultyGuide = {
      easy: 'basic recall and simple understanding questions',
      medium: 'application and comprehension questions requiring understanding of concepts',
      hard: 'analysis and synthesis questions requiring deep understanding',
      exam: 'challenging exam-style questions similar to university or professional exams'
    }[difficulty] || 'medium difficulty'

    // Scale text input based on question count — more questions need more context
    const textLimit = count <= 10 ? 4000 : count <= 20 ? 8000 : count <= 30 ? 12000 : 16000

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: count <= 10 ? 3000 : count <= 20 ? 5000 : count <= 30 ? 7000 : 9000,
      messages: [
        {
          role: 'system',
          content: 'You are a study assistant. Return ONLY valid JSON, no markdown, no explanation.'
        },
        {
          role: 'user',
          content: `Generate exactly ${count} multiple choice questions from these lecture notes.
Difficulty level: ${difficultyGuide}

Spread the questions evenly across ALL major topics in the notes. Do not focus on just one section.

Return ONLY a JSON array:
[
  {
    "question": "What is X?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Option A is correct because..."
  }
]

Where "correct" is the index (0-3) of the right answer.

Notes:
${text.slice(0, textLimit)}`
        }
      ]
    })

    const content = completion.choices[0]?.message?.content || '[]'
    const cleaned = content.replace(/```json|```/g, '').trim()

    let mcqs
    try {
      mcqs = MCQSchema.parse(JSON.parse(cleaned))
    } catch (parseErr) {
      console.error('[api/mcqs] malformed AI response:', cleaned)
      return NextResponse.json(
        { error: 'The AI returned an unexpected format. Please try generating again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ mcqs })

  } catch (error: any) {
    if (error instanceof FileTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 })
    }
    console.error('[api/mcqs]', error)
    return NextResponse.json(
      { error: 'Something went wrong generating your quiz. Please try again.' },
      { status: 500 }
    )
  }
}