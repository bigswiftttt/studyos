import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'Please provide some text to analyze' }, { status: 400 })
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: 'You are an expert study assistant who creates clear, structured study summaries from lecture notes.'
        },
        {
          role: 'user',
          content: `Analyze these lecture notes and create a comprehensive study summary.

Structure your response exactly like this:
## Overview
[2-3 sentence overview of the topic]

## Key Concepts
[List the 5-8 most important concepts with brief explanations]

## Important Definitions
[List key terms and their definitions]

## Key Points to Remember
[Bullet points of the most critical facts to memorize]

## Exam Tips
[2-3 tips on what to focus on for exams]

Here are the notes:
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