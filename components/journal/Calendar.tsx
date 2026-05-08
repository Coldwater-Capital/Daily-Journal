'use client'

import { useRouter } from 'next/navigation'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import 'react-day-picker/dist/style.css'

interface CalendarProps {
  entryDates: string[]
}

export default function Calendar({ entryDates }: CalendarProps) {
  const router = useRouter()

  const entryDateObjects = entryDates.map(d => new Date(d + 'T00:00:00'))

  function handleDayClick(day: Date) {
    const dateStr = format(day, 'yyyy-MM-dd')
    router.push(`/entry/${dateStr}`)
  }

  return (
    <div className="flex flex-col items-center">
      <DayPicker
        onDayClick={handleDayClick}
        modifiers={{ hasEntry: entryDateObjects }}
        modifiersClassNames={{ hasEntry: 'day-has-entry' }}
      />
      <p className="mt-4 text-sm" style={{ color: '#C8A19C', opacity: 0.4 }}>Click any day to open or create an entry</p>
    </div>
  )
}
