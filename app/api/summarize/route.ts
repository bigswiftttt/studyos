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
      return NextResponse.json({
        error: 'Could not extract enough text. Make sure the file has readable content.'
      }, { status: 400 })
    }

    // Scale based on document size
    const isLarge = text.length > 8000
    const isVeryLarge = text.length > 16000
    const textLimit = isVeryLarge ? 24000 : isLarge ? 14000 : 6000
    const maxTokens = isVeryLarge ? 6000 : isLarge ? 4000 : 2048

    const sizeInstruction = isVeryLarge
      ? 'This is a very large document. Cover ALL major topics thoroughly. Each section should be detailed with multiple points. Do not skip any major topic.'
      : isLarge
        ? 'This is a moderately large document. Make sure to cover all topics present, not just the first few sections.'
        : 'Create a focused summary covering all key points.'

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'system',
          content: 'You are an expert study assistant who creates clear, structured, and comprehensive study summaries. Always cover every major topic present in the document.'
        },
        {
          role: 'user',
          content: `Analyze these lecture notes and create a comprehensive study summary. ${sizeInstruction}

## Overview
[2-4 sentence overview of the entire document]

## Key Concepts
[All important concepts — do not limit yourself, cover every major one]

## Important Definitions
[All key terms and definitions found in the notes]

## Topic Breakdown
[Go through each major topic/section in the document and summarize it in 3-5 bullet points]

## Key Points to Remember
[Critical facts and details to memorize for exams]

## Exam Tips
[3-5 exam focus tips based on what was emphasized in the notes]

Notes:
${text.slice(0, textLimit)}`
        }
      ]
    })

    const summary = completion.choices[0]?.message?.content || ''
    return NextResponse.json({ summary })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}