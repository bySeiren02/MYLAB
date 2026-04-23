import { useEffect, useState } from 'react'
import { buildMonthGridDays, formatMonthLabel, formatYmdKey } from '../utils/dateUtils'
import './CompactCalendar.css'

export default function CompactCalendar({
  currentDate,
  onDateChange,
  selectedDate,
  highlightDates = [],
  dense = false,
  /** 이 배열을 넘긴 화면에서만 생리 구간 표시. 넘기지 않으면 표시 안 함 */
  periodKeys = null,
  /** 달력에 보이는 월이 바뀔 때 (가계부 월 합계 등) */
  onViewMonthChange,
  /** { 'YYYY-MM-DD': { income?: boolean, expense?: boolean } } */
  dayTint = null,
}) {
  const [viewDate, setViewDate] = useState(currentDate || new Date())
  const periodSet = Array.isArray(periodKeys) ? periodKeys : null

  useEffect(() => {
    if (currentDate) setViewDate(currentDate)
  }, [currentDate])

  useEffect(() => {
    onViewMonthChange?.(viewDate)
  }, [viewDate, onViewMonthChange])

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
    <div className={['compact-cal', dense ? 'compact-cal--dense' : ''].filter(Boolean).join(' ')}>
      <div className="compact-cal__header">
        <button
          type="button"
          className="compact-cal__nav"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
        >
          ‹
        </button>
        <div className="compact-cal__title">{formatMonthLabel(viewDate)}</div>
        <button
          type="button"
          className="compact-cal__nav"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
        >
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
          const isPeriod = periodSet && periodSet.includes(key)
          const tint = dayTint && dayTint[key]
          const tintIncome = tint?.income && !cell.isOtherMonth
          const tintExpense = tint?.expense && !cell.isOtherMonth
          const tintBoth = tintIncome && tintExpense

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
                tintBoth ? 'compact-cal__cell--ledger-both' : '',
                !tintBoth && tintIncome ? 'compact-cal__cell--ledger-income' : '',
                !tintBoth && tintExpense ? 'compact-cal__cell--ledger-expense' : '',
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
