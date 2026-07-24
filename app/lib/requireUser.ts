import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

/**
 * Verifies the caller's Supabase access token (sent as `Authorization: Bearer <token>`)
 * and returns the authenticated user, or null if missing/invalid.
 *
 * Usage in an API route:
 *   const user = await requireUser(req)
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */
export async function requireUser(req: NextRequest | Request) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return null

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return null
    return data.user
}