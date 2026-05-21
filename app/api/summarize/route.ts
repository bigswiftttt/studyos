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

    // Dynamic require to avoid ESM issues
    const pdf = (await import('pdf-parse')).default
    const pdfData = await pdf(buffer)
    const text = pdfData.text

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ 
        error: 'Could not extract text. Make sure your PDF is text-based not a scanned image.' 
      }, { status: 400 })
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: 'You are an expert study assistant who creates clear structured study summaries.'
        },
        {
          role: 'user',
          content: `Analyze these lecture notes and create a comprehensive study summary.

## Overview
[2-3 sentence overview]

## Key Concepts
[5-8 most important concepts]

## Important Definitions
[Key terms and definitions]

## Key Points to Remember
[Critical facts to memorize]

## Exam Tips
[2-3 exam focus tips]

Notes:
${text.slice(0, 6000)}`
        }
      ]
    })

    const summary = completion.choices[0]?.message?.content || ''
    return NextResponse.json({ summary })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}