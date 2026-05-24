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
          content: 'You are a study assistant. Return ONLY valid JSON, no markdown, no explanation.'
        },
        {
          role: 'user',
          content: `Generate 12 flashcards from these lecture notes.

Return ONLY a JSON array like this:
[
  {"front": "What is X?", "back": "X is..."},
  {"front": "Define Y", "back": "Y means..."}
]

Notes:
${text.slice(0, 6000)}`
        }
      ]
    })

    const content = completion.choices[0]?.message?.content || '[]'
    
    // Clean and parse JSON
    const cleaned = content.replace(/```json|```/g, '').trim()
    const flashcards = JSON.parse(cleaned)

    return NextResponse.json({ flashcards })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}