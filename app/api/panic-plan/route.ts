import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const { examName, daysLeft, topicList, confidence, hoursPerDay, intensity } = await req.json()

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
        const parsed = JSON.parse(cleaned)

        return NextResponse.json(parsed)

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}