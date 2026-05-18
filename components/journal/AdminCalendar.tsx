'use client'

import { useRouter } from 'next/navigation'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import 'react-day-picker/dist/style.css'

interface AdminCalendarProps {
  entryDates: string[]
}

export default function AdminCalendar({ entryDates }: AdminCalendarProps) {
  const router = useRouter()

  const entryDateObjects = entryDates.map(d => new Date(d + 'T00:00:00'))

  return (
    <div className="flex flex-col items-center">
      <DayPicker
        navLayout="around"
        onDayClick={(date) => router.push(`/admin/${format(date, 'yyyy-MM-dd')}`)}
        modifiers={{ hasEntry: entryDateObjects }}
        modifiersClassNames={{ hasEntry: 'day-has-entry' }}
      />
      <p className="mt-4 text-sm" style={{ color: '#C8A19C', opacity: 0.4 }}>Click any day to see every user's entry for that date</p>
    </div>
  )
}
