import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { z } from 'zod'
import { requireUser } from '@/app/lib/requireUser'
import { checkRateLimit } from '@/app/lib/rateLimit'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const PanicPlanSchema = z.object({
    survivalAnalysis: z.string(),
    riskLevel: z.enum(['Low Risk', 'Moderate Risk', 'High Risk', 'Academic Near-Death Experience']),
    priorityTopics: z.array(z.object({
        topic: z.string(),
        priority: z.enum(['high', 'medium', 'quick']),
    })),
    dailyPlan: z.array(z.object({
        day: z.number(),
        tasks: z.array(z.string()),
    })),
    focusSessions: z.string(),
    motivationTip: z.string(),
})

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
        const { examName, daysLeft: rawDaysLeft, topicList, confidence, hoursPerDay, intensity } = await req.json()

        if (!Array.isArray(topicList) || topicList.length === 0) {
            return NextResponse.json({ error: 'Please provide at least one topic.' }, { status: 400 })
        }

        // Clamp so the "max 14 days" instruction below is actually true, not just requested.
        const daysLeft = Math.max(0, Math.min(Number(rawDaysLeft) || 0, 14))

        const prompt = `You are an expert academic emergency planner. A student has a crisis exam situation. Generate a detailed survival plan.

STUDENT SITUATION:
- Exam: ${examName || 'Upcoming Exam'}
- Days Until Exam: ${daysLeft}
- Topics Remaining: ${topicList.join(', ')}
- Confidence Level: ${confidence}
- Hours Available Per Day: ${hoursPerDay}
- Study Intensity: ${intensity || 'serious'}

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "survivalAnalysis": "2-3 sentence intelligent overview of their situation and strategy",
  "riskLevel": "one of: Low Risk | Moderate Risk | High Risk | Academic Near-Death Experience",
  "priorityTopics": [
    { "topic": "topic name", "priority": "high" }
  ],
  "dailyPlan": [
    { "day": 1, "tasks": ["task 1", "task 2", "task 3"] }
  ],
  "focusSessions": "e.g. 4 × 50-minute sessions daily",
  "motivationTip": "1-2 sentences of sharp, tactical study advice"
}

Rules:
- dailyPlan must cover ALL days until exam (max 14)
- Each day must have 3-5 specific tasks based on topics and hours available
- priorityTopics must include ALL topics with priority: high, medium, or quick
- riskLevel must reflect reality given days and topic count
- motivationTip must be specific and actionable, not generic`

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 2048,
            messages: [
                {
                    role: 'system',
                    content: 'You are an academic emergency planner. Return ONLY valid JSON, no markdown, no explanation.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })

        const content = completion.choices[0]?.message?.content || '{}'
        const cleaned = content.replace(/```json|```/g, '').trim()

        let parsed
        try {
            parsed = PanicPlanSchema.parse(JSON.parse(cleaned))
        } catch (parseErr) {
            console.error('[api/panic-plan] malformed AI response:', cleaned)
            return NextResponse.json(
                { error: 'The AI returned an unexpected format. Please try generating again.' },
                { status: 502 }
            )
        }

        return NextResponse.json(parsed)

    } catch (error: any) {
        console.error('[api/panic-plan]', error)
        return NextResponse.json(
            { error: 'Something went wrong generating your plan. Please try again.' },
            { status: 500 }
        )
    }
}