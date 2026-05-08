import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c) {
          try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tokens } = await supabase
    .from('user_google_tokens')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', user.id)
    .single()

  if (!tokens) {
    return NextResponse.json({ error: 'no_drive_connection' }, { status: 404 })
  }

  let accessToken = tokens.access_token

  // Refresh if within 5 minutes of expiry
  const expiresAt = new Date(tokens.token_expires_at).getTime()
  if (Date.now() + 5 * 60 * 1000 >= expiresAt) {
    if (!tokens.refresh_token) {
      return NextResponse.json({ error: 'no_refresh_token' }, { status: 401 })
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const refreshed = await res.json()
    if (refreshed.error) {
      return NextResponse.json({ error: 'token_refresh_failed' }, { status: 401 })
    }

    accessToken = refreshed.access_token
    await supabase.from('user_google_tokens').update({
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq('user_id', user.id)
  }

  return NextResponse.json({ accessToken })
}
