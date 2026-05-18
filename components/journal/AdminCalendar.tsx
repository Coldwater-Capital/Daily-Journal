import CalendarGrid from './CalendarGrid'

interface AdminCalendarProps {
  entryDates: string[]
}

export default function AdminCalendar({ entryDates }: AdminCalendarProps) {
  return <CalendarGrid entryDates={entryDates} routeBase="/admin" />
}
