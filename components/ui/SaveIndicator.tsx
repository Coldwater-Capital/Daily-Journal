interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved'
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === 'idle') return null

  return (
    <span className="text-xs text-neutral-600">
      {status === 'saving' ? 'Saving...' : '✓ Saved'}
    </span>
  )
}
