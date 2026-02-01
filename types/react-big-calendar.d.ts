declare module 'react-big-calendar' {
  import { ComponentType } from 'react'

  export type View = 'month' | 'week' | 'day' | 'agenda'

  export interface BigCalendarProps {
    localizer: object
    events: object[]
    view?: View
    date?: Date
    onNavigate?: (date: Date) => void
    onView?: (view: View) => void
    onSelectEvent?: (event: { resource?: unknown }) => void
    onRangeChange?: (range: Date[] | { start: Date; end: Date }) => void
    startAccessor?: string
    endAccessor?: string
    style?: React.CSSProperties
    eventPropGetter?: (event: object) => { style?: React.CSSProperties }
    messages?: Record<string, string>
  }

  export const Calendar: ComponentType<BigCalendarProps>
  export function dateFnsLocalizer(config: {
    format: (date: Date, formatStr: string, options?: object) => string
    startOfWeek: (date: Date, options?: object) => Date
    getDay: (date: Date) => number
    locales?: Record<string, object>
  }): object
}
