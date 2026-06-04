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
        const questions = JSON.parse(cleaned)

        return NextResponse.json({ questions })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
