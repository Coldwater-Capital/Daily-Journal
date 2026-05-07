interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved'
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === 'idle') return null

  return (
    <span className="text-xs" style={{ color: '#C8A19C', opacity: 0.7 }}>
      {status === 'saving' ? 'Saving...' : '✓ Saved'}
    </span>
  )
}
