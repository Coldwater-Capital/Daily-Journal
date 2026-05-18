export function calculateStats(entryDates: string[], today: Date = new Date()) {
  const dateSet = new Set(entryDates)

  const todayStr = formatYMD(today)
  const yyyyMm = todayStr.slice(0, 7)

  const thisMonth = entryDates.filter(d => d.startsWith(yyyyMm)).length
  const allTime = entryDates.length

  let streak = 0
  const cursor = new Date(today)
  if (!dateSet.has(formatYMD(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (dateSet.has(formatYMD(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return { streak, thisMonth, allTime }
}

function formatYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
