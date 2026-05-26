import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('pdf') as File

        if (!file) {
            return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const pdf = (await import('pdf-parse')).default
        const pdfData = await pdf(buffer)
        const text = pdfData.text

        if (!text || text.trim().length < 50) {
            return NextResponse.json({ error: 'Could not extract text from PDF.' }, { status: 400 })
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
        const questions = JSON.parse(cleaned)

        return NextResponse.json({ questions })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}