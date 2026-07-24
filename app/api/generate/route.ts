import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import mammoth from 'mammoth'
import officeParser from 'officeparser'

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY!,
})

const MODEL = 'nousresearch/hermes-3-llama-3.1-405b:free'

// ─── Text extraction ───────────────────────────────────────────────────────

async function extractText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mime = file.type
    const name = file.name.toLowerCase()

    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
        const pdf = (await import('pdf-parse')).default
        const data = await pdf(buffer)
        return data.text
    }

    if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        name.endsWith('.docx')
    ) {
        const result = await mammoth.extractRawText({ buffer })
        return result.value
    }

    if (
        name.endsWith('.pptx') || name.endsWith('.doc') ||
        name.endsWith('.odt') || name.endsWith('.odp')
    ) {
        return await new Promise<string>((resolve, reject) => {
            officeParser.parseOffice(buffer, (data: any, err: any) => {
                if (err) reject(err)
                else resolve(data.toString())
            }, { outputErrorToConsole: false })
        })
    }

    if (mime === 'text/plain' || name.endsWith('.txt')) {
        return buffer.toString('utf-8')
    }

    // Image — extract text via vision
    if (mime.startsWith('image/')) {
        const base64 = buffer.toString('base64')
        const res = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 2048,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
                        { type: 'text', text: 'Extract and return all the text content from this image as plain text.' },
                    ],
                },
            ],
        })
        return res.choices[0]?.message?.content || ''
    }

    throw new Error(`Unsupported file type: ${mime || name}`)
}

// ─── Scale helpers ─────────────────────────────────────────────────────────

function getSummaryInstruction(charCount: number): string {
    if (charCount > 20000) return 'This is a very large document. Cover ALL major topics thoroughly. Each section should be detailed with multiple sub-points. Do not skip or compress any major topic.'
    if (charCount > 8000) return 'This is a moderately large document. Cover all topics present — do not limit yourself to the first few sections.'
    return 'Create a focused summary covering all key points in the document.'
}

function getMaxTokens(charCount: number, mcqCount: number): number {
    const base = charCount > 20000 ? 8000 : charCount > 8000 ? 6000 : 4000
    return Math.min(base + Math.floor(mcqCount / 10) * 1000, 16000)
}

// ─── Main handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('pdf') as File
        const mcqCount = Math.min(parseInt(formData.get('count') as string) || 8, 40)
        const difficulty = (formData.get('difficulty') as string) || 'medium'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const text = await extractText(file)

        if (!text || text.trim().length < 50) {
            return NextResponse.json(
                { error: 'Could not extract enough text. Make sure the file has readable content.' },
                { status: 400 }
            )
        }

        const charCount = text.length
        const textLimit = charCount > 20000 ? 28000 : charCount > 8000 ? 16000 : 8000
        const summaryInstruction = getSummaryInstruction(charCount)
        const maxTokens = getMaxTokens(charCount, mcqCount)

        const difficultyGuide: Record<string, string> = {
            easy: 'basic recall and simple understanding questions',
            medium: 'application and comprehension questions requiring understanding of concepts',
            hard: 'analysis and synthesis questions requiring deep understanding',
            exam: 'challenging exam-style questions similar to university or professional exams',
        }
        const difficultyDesc = difficultyGuide[difficulty] || difficultyGuide.medium

        const prompt = `You are an expert study assistant. Analyze the document and return a single JSON object with ALL four sections. Return ONLY valid JSON — no markdown fences, no explanation, no preamble.

{
  "summary": "Full structured markdown summary using ## headings. ${summaryInstruction} Include: Overview, Key Concepts, Important Definitions, Topic Breakdown, Key Points to Remember, Exam Tips.",
  "flashcards": [
    { "front": "Question or term", "back": "Answer or definition" }
  ],
  "mcqs": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why the correct answer is right"
    }
  ],
  "exam_questions": [
    {
      "question": "Exam question text",
      "type": "essay",
      "marks": 10,
      "hint": "What to include in a strong answer"
    }
  ]
}

Rules:
- summary: Use ## headings. Cover every major topic. Scale depth to document size.
- flashcards: Generate 12-20 cards covering all major topics.
- mcqs: Generate EXACTLY ${mcqCount} questions. Difficulty: ${difficultyDesc}. Spread across ALL topics. "correct" is the index (0-3) of the right answer.
- exam_questions: Generate 5 university-style exam questions. Types: "essay", "short answer", or "calculation". Realistic marks and helpful hints.
- Return ONLY the JSON object. No extra text.

Document:
${text.slice(0, textLimit)}`

        const res = await client.chat.completions.create({
            model: MODEL,
            max_tokens: maxTokens,
            temperature: 0.4,
            messages: [
                { role: 'system', content: 'You are an expert study assistant. Return ONLY valid JSON, no markdown, no explanation.' },
                { role: 'user', content: prompt },
            ],
        })

        const raw = res.choices[0]?.message?.content || ''
        const cleaned = raw.replace(/```json|```/g, '').trim()

        let parsed: {
            summary: string
            flashcards: { front: string; back: string }[]
            mcqs: { question: string; options: string[]; correct: number; explanation: string }[]
            exam_questions: { question: string; type: string; marks: number; hint: string }[]
        }

        try {
            parsed = JSON.parse(cleaned)
        } catch {
            const match = cleaned.match(/\{[\s\S]*\}/)
            if (!match) throw new Error('Model returned malformed JSON. Please try again.')
            parsed = JSON.parse(match[0])
        }

        return NextResponse.json({
            summary: parsed.summary || '',
            flashcards: parsed.flashcards || [],
            mcqs: parsed.mcqs || [],
            exam_questions: parsed.exam_questions || [],
        })

    } catch (error: any) {
        console.error('[/api/generate]', error)
        return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 })
    }
}