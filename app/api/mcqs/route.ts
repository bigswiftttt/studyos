import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File
    const count = parseInt(formData.get('count') as string) || 8
    const difficulty = formData.get('difficulty') as string || 'medium'

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

    const difficultyGuide = {
      easy: 'basic recall and simple understanding questions',
      medium: 'application and comprehension questions requiring understanding of concepts',
      hard: 'analysis and synthesis questions requiring deep understanding',
      exam: 'challenging exam-style questions similar to university or professional exams'
    }[difficulty] || 'medium difficulty'

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 3000,
      messages: [
        {
          role: 'system',
          content: 'You are a study assistant. Return ONLY valid JSON, no markdown, no explanation.'
        },
        {
          role: 'user',
          content: `Generate exactly ${count} multiple choice questions from these lecture notes.
Difficulty level: ${difficultyGuide}

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
${text.slice(0, 6000)}`
        }
      ]
    })

    const content = completion.choices[0]?.message?.content || '[]'
    const cleaned = content.replace(/```json|```/g, '').trim()
    const mcqs = JSON.parse(cleaned)

    return NextResponse.json({ mcqs })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
                      
                               
                        
                           