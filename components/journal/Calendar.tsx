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
      <style>{`
        .rdp { --rdp-accent-color: transparent; --rdp-background-color: #1A1410; --rdp-today-color: transparent; }
        .rdp-root { background: #111111; border: 0.5px solid #91766E; border-radius: 14px; padding: 20px 24px; zoom: 1.124; }
        .rdp-month { position: relative; }
        .rdp-month_caption { display: flex; justify-content: center; align-items: center; height: var(--rdp-nav-height); color: #F3ECE3; font-weight: 600; }
        .rdp-nav { position: absolute; top: 0; left: 0; right: 0; height: var(--rdp-nav-height); display: flex; justify-content: space-between; align-items: center; pointer-events: none; }
        .rdp-button_previous, .rdp-button_next { background: transparent !important; border: none !important; color: #C8A19C !important; cursor: pointer; pointer-events: all; padding: 0; }
        .rdp-button_previous:hover, .rdp-button_next:hover { opacity: 0.7; }
        .rdp-weekday { color: #C8A19C; opacity: 0.5; }
        .rdp-weekday abbr { text-decoration: none; }
        .rdp-day_button { color: #F3ECE3 !important; background: transparent !important; border: none !important; }
        .rdp-day_button:hover { background: #1A1410 !important; }
        .rdp-outside .rdp-day_button { opacity: 0.2; }
        .rdp-today .rdp-day_button { color: #C8A19C !important; font-weight: 700; }
        .rdp-today:not(.day-has-entry) .rdp-day_button::after { display: none !important; }
        .rdp-chevron { fill: #C8A19C !important; }
        .day-has-entry { position: relative; }
        .day-has-entry::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #C8A19C;
        }
      `}</style>
      <DayPicker
        onDayClick={handleDayClick}
        modifiers={{ hasEntry: entryDateObjects }}
        modifiersClassNames={{ hasEntry: 'day-has-entry' }}
      />
      <p className="mt-4 text-sm" style={{ color: '#C8A19C', opacity: 0.4 }}>Click any day to open or create an entry</p>
    </div>
  )
}
