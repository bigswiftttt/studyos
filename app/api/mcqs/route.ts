import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function extractText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mime = file.type
  const name = file.name.toLowerCase()

  // PDF
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    const pdf = (await import('pdf-parse')).default
    const data = await pdf(buffer)
    return data.text
  }

  // DOCX
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
    const mammoth = (await import('mammoth')).default
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // PPTX / DOC / ODT and other office formats
  if (name.endsWith('.pptx') || name.endsWith('.doc') || name.endsWith('.odt') || name.endsWith('.odp')) {
    const officeParser = (await import('officeparser')).default
    const text = await new Promise<string>((resolve, reject) => {
      officeParser.parseOffice(buffer, (data: any, err: any) => {
        if (err) reject(err)
        else resolve(data.toString())
      }, { outputErrorToConsole: false })
    })
    return text
  }

  // Plain text
  if (mime === 'text/plain' || name.endsWith('.txt')) {
    return buffer.toString('utf-8')
  }

  // Image — send to Groq vision
  if (mime.startsWith('image/')) {
    const base64 = buffer.toString('base64')
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
            { type: 'text', text: 'Extract and return all the text content from this image as plain text.' }
          ] as any
        }
      ]
    })
    return completion.choices[0]?.message?.content || ''
  }

  throw new Error(`Unsupported file type: ${mime || name}`)
}

export async function POST(req: NextRequest) {
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
    const mcqs = JSON.parse(cleaned)

    return NextResponse.json({ mcqs })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}