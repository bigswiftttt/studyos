import { createClient } from '@supabase/supabase-js'

// Server-side client using the service role key so it can bypass RLS to write
// to the rate_limits table. Requires SUPABASE_SERVICE_ROLE_KEY to be set in
// your environment (never expose this key to the client/browser).
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Sliding-window-ish rate limiter: allows `limit` calls per `windowMinutes`
 * per (userId, action) pair. Backed by the `check_rate_limit` Postgres
 * function — see supabase/migrations/001_production_fixes.sql
 *
 * Returns { success: true } if the call is allowed, { success: false, retryAfterMinutes }
 * if the limit has been hit.
 */
export async function checkRateLimit(
    userId: string,
    action: string,
    limit: number,
    windowMinutes: number
): Promise<{ success: boolean; retryAfterMinutes?: number }> {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
        p_user_id: userId,
        p_action: action,
        p_limit: limit,
        p_window_minutes: windowMinutes,
    })

    if (error) {
        // Fail open with a warning rather than blocking all generation if the
        // rate-limit infra itself has a problem — but log it loudly so it gets noticed.
        console.error('[rateLimit] check_rate_limit RPC failed:', error.message)
        return { success: true }
    }

    return data.allowed
        ? { success: true }
        : { success: false, retryAfterMinutes: data.retry_after_minutes }
}