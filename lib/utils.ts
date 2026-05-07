export function getEmbedUrl(url: string): string | null {
  if (!url) return null

  // YouTube watch: youtube.com/watch?v=ID
  const ytWatch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([^&\s]+)/)
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`

  // YouTube short link: youtu.be/ID (stop at ? or &)
  const ytShort = url.match(/youtu\.be\/([^?&\s]+)/)
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`

  // YouTube Shorts page: youtube.com/shorts/ID
  const ytShortsPage = url.match(/youtube\.com\/shorts\/([^?&\s]+)/)
  if (ytShortsPage) return `https://www.youtube.com/embed/${ytShortsPage[1]}`

  // YouTube Live: youtube.com/live/ID
  const ytLive = url.match(/youtube\.com\/live\/([^?&\s]+)/)
  if (ytLive) return `https://www.youtube.com/embed/${ytLive[1]}`

  // Vimeo: vimeo.com/ID
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`

  // Loom: loom.com/share/ID
  const loom = url.match(/loom\.com\/share\/([^?&\s]+)/)
  if (loom) return `https://www.loom.com/embed/${loom[1]}`

  return null
}

export function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
