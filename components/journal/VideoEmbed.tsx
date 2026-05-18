import { getEmbedUrl } from '@/lib/utils'

interface VideoEmbedProps {
  url: string
}

export default function VideoEmbed({ url }: VideoEmbedProps) {
  const embedUrl = getEmbedUrl(url)
  if (!embedUrl) return null

  return (
    <div className="mt-4 w-full aspect-video rounded-xl overflow-hidden" style={{ border: '1px solid #D4D4D4' }}>
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
