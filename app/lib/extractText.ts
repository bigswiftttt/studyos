import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15MB

export class FileTooLargeError extends Error {
    constructor() {
        super('File too large (max 15MB).')
        this.name = 'FileTooLargeError'
    }
}

export async function extractText(file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new FileTooLargeError()
    }

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