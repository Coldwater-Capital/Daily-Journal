import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { entryId: string } }
) {
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
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: entry } = await supabase
    .from('journal_entries')
    .select('user_id, recorded_video_drive_id')
    .eq('id', params.entryId)
    .single()

  if (!entry?.recorded_video_drive_id) {
    return NextResponse.json({ error: 'no_video' }, { status: 404 })
  }

  const { data: tokens } = await supabase
    .from('user_google_tokens')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', entry.user_id)
    .single()

  if (!tokens) {
    return NextResponse.json({ error: 'owner_has_no_drive_connection' }, { status: 404 })
  }

  let accessToken = tokens.access_token
  const expiresAt = new Date(tokens.token_expires_at).getTime()
  if (Date.now() + 5 * 60 * 1000 >= expiresAt) {
    if (!tokens.refresh_token) {
      return NextResponse.json({ error: 'owner_token_expired_no_refresh' }, { status: 401 })
    }
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    const refreshed = await refreshRes.json()
    if (refreshed.error) {
      return NextResponse.json({ error: 'token_refresh_failed' }, { status: 401 })
    }
    accessToken = refreshed.access_token
    await supabase.from('user_google_tokens').update({
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq('user_id', entry.user_id)
  }

  const driveHeaders: HeadersInit = { Authorization: `Bearer ${accessToken}` }
  const range = request.headers.get('range')
  if (range) (driveHeaders as Record<string, string>).Range = range

  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${entry.recorded_video_drive_id}?alt=media`,
    { headers: driveHeaders }
  )

  if (!driveRes.ok || !driveRes.body) {
    const text = await driveRes.text().catch(() => '')
    return NextResponse.json(
      { error: 'drive_fetch_failed', status: driveRes.status, body: text.slice(0, 500) },
      { status: 502 }
    )
  }

  const headers = new Headers()
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const v = driveRes.headers.get(h)
    if (v) headers.set(h, v)
  }

  return new NextResponse(driveRes.body, { status: driveRes.status, headers })
}
