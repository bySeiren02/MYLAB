import { useEffect, useState } from 'react'
import { buildMonthGridDays, formatMonthLabel, formatYmdKey } from '../utils/dateUtils'
import { getStorage } from '../utils/storage'
import { getPeriodDateKeys } from '../utils/periodUtils'
import './CompactCalendar.css'

export default function CompactCalendar({
  currentDate,
  onDateChange,
  selectedDate,
  highlightDates = [],
}) {
  const [viewDate, setViewDate] = useState(currentDate || new Date())
  const [periodKeys, setPeriodKeys] = useState([])

  useEffect(() => {
    if (currentDate) setViewDate(currentDate)
  }, [currentDate])

  useEffect(() => {
    const female = getStorage('current_user', null)?.gender === 'female'
    setPeriodKeys(female ? getPeriodDateKeys() : [])
  }, [viewDate])

  const today = new Date()
  const todayKey = formatYmdKey(today.getFullYear(), today.getMonth(), today.getDate())

  const days = buildMonthGridDays(viewDate.getFullYear(), viewDate.getMonth())
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  const selectedKey = selectedDate
    ? formatYmdKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    : null

  const handleCell = (cell) => {
    if (cell.isOtherMonth) {
      setViewDate(new Date(cell.year, cell.month, 1))
      return
    }
    const d = new Date(cell.year, cell.month, cell.day)
    onDateChange?.(d)
  }

  return (
    <div className="compact-cal">
      <div className="compact-cal__header">
        <button type="button" className="compact-cal__nav" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
          ‹
        </button>
        <div className="compact-cal__title">{formatMonthLabel(viewDate)}</div>
        <button type="button" className="compact-cal__nav" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
          ›
        </button>
      </div>
      <div className="compact-cal__grid">
        {weekdays.map((w) => (
          <div key={w} className="compact-cal__weekday">
            {w}
          </div>
        ))}
        {days.map((cell, idx) => {
          const key = formatYmdKey(cell.year, cell.month, cell.day)
          const isToday = key === todayKey
          const isSelected = selectedKey === key
          const isHl = highlightDates.includes(key)
          const isPeriod = periodKeys.includes(key)

          return (
            <button
              key={`${key}-${idx}`}
              type="button"
              className={[
                'compact-cal__cell',
                cell.isOtherMonth ? 'compact-cal__cell--muted' : '',
                isToday ? 'compact-cal__cell--today' : '',
                isSelected ? 'compact-cal__cell--selected' : '',
                isHl ? 'compact-cal__cell--hl' : '',
                isPeriod ? 'compact-cal__cell--period' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleCell(cell)}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
