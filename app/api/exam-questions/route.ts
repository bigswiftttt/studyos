import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { z } from 'zod'
import { requireUser } from '@/app/lib/requireUser'
import { checkRateLimit } from '@/app/lib/rateLimit'
import { extractText, FileTooLargeError } from '@/app/lib/extractText'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const ExamQuestionsSchema = z.array(z.object({
    question: z.string(),
    type: z.enum(['essay', 'short answer', 'calculation']),
    marks: z.number(),
    hint: z.string().optional().default(''),
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

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const text = await extractText(file)

        if (!text || text.trim().length < 50) {
            return NextResponse.json({ error: 'Could not extract enough text from the file.' }, { status: 400 })
        }

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 2048,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert university professor. Return ONLY valid JSON, no markdown, no explanation.'
                },
                {
                    role: 'user',
                    content: `Generate 5 likely exam questions from these lecture notes. These should be the kind of questions that would appear in a university exam.

Return ONLY a JSON array like this:
[
  {
    "question": "Discuss the role of X in Y...",
    "type": "essay",
    "marks": 10,
    "hint": "Consider discussing A, B and C in your answer"
  }
]

Types can be: "essay", "short answer", or "calculation"

Notes:
${text.slice(0, 6000)}`
                }
            ]
        })

        const content = completion.choices[0]?.message?.content || '[]'
        const cleaned = content.replace(/```json|```/g, '').trim()

        let questions
        try {
            questions = ExamQuestionsSchema.parse(JSON.parse(cleaned))
        } catch (parseErr) {
            console.error('[api/exam-questions] malformed AI response:', cleaned)
            return NextResponse.json(
                { error: 'The AI returned an unexpected format. Please try generating again.' },
                { status: 502 }
            )
        }

        return NextResponse.json({ questions })

    } catch (error: any) {
        if (error instanceof FileTooLargeError) {
            return NextResponse.json({ error: error.message }, { status: 413 })
        }
        console.error('[api/exam-questions]', error)
        return NextResponse.json(
            { error: 'Something went wrong generating exam questions. Please try again.' },
            { status: 500 }
        )
    }
}