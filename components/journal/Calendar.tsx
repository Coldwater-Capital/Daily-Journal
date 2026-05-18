import CalendarGrid from './CalendarGrid'

interface CalendarProps {
  entryDates: string[]
}

export default function Calendar({ entryDates }: CalendarProps) {
  return <CalendarGrid entryDates={entryDates} routeBase="/entry" />
}
