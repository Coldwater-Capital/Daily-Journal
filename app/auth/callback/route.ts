import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(c) {
            try {
              c.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )

    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.session?.provider_token) {
      const tokenData: Record<string, unknown> = {
        user_id: data.session.user.id,
        access_token: data.session.provider_token,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      }
      // Only include refresh_token when Google sends one (first auth / prompt:consent)
      // Upsert without it preserves the previously stored refresh_token
      if (data.session.provider_refresh_token) {
        tokenData.refresh_token = data.session.provider_refresh_token
      }
      await supabase.from('user_google_tokens').upsert(tokenData, { onConflict: 'user_id' })
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
