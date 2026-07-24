import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { requireUser } from '@/app/lib/requireUser'
import { checkRateLimit } from '@/app/lib/rateLimit'
import { extractText, FileTooLargeError } from '@/app/lib/extractText'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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
    if (error instanceof FileTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 })
    }
    console.error('[api/summarize]', error)
    return NextResponse.json(
      { error: 'Something went wrong generating your summary. Please try again.' },
      { status: 500 }
    )
  }
}