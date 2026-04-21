import { formatYmdKey } from './dateUtils'

export const REPEAT_INTERVALS = [
  { value: '1week', label: '1주마다' },
  { value: '2week', label: '2주마다' },
  { value: '1month', label: '한 달마다' },
  { value: '1year', label: '1년마다' },
]

/** @param {Array<{id:number,color?:string}>} categories */
export function getCategoryColor(categories, categoryId) {
  const c = categories.find((x) => Number(x.id) === Number(categoryId))
  return c?.color || '#94a3b8'
}

export function matchesRepeat(master, dateStr) {
  if (master.eventType !== 'repeat') return false
  if (master.repeatUntil && dateStr > master.repeatUntil) return false
  const dateObj = new Date(`${dateStr}T12:00:00`)
  const startDate = new Date(`${master.date}T12:00:00`)
  const diffTime = dateObj - startDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return false
  const interval = master.repeatInterval || '1week'
  if (interval === '1week') return diffDays % 7 === 0
  if (interval === '2week') return diffDays % 14 === 0
  if (interval === '1month') {
    const mDiff =
      (dateObj.getFullYear() - startDate.getFullYear()) * 12 + (dateObj.getMonth() - startDate.getMonth())
    return mDiff >= 0 && dateObj.getDate() === startDate.getDate()
  }
  if (interval === '1year') {
    return (
      dateObj.getFullYear() >= startDate.getFullYear() &&
      dateObj.getMonth() === startDate.getMonth() &&
      dateObj.getDate() === startDate.getDate()
    )
  }
  if (interval === '6month') {
    const monthDiff =
      (dateObj.getFullYear() - startDate.getFullYear()) * 12 + (dateObj.getMonth() - startDate.getMonth())
    return monthDiff >= 0 && monthDiff % 6 === 0 && dateObj.getDate() === startDate.getDate()
  }
  return false
}

function inRangeBounds(dateStr, start, end) {
  return start <= dateStr && end >= dateStr
}

/**
 * @param {object[]} events
 * @param {string} dateStr YYYY-MM-DD
 */
export function getEventsForDate(events, dateStr) {
  const list = []
  const safe = Array.isArray(events) ? events : []

  for (const e of safe) {
    if (e.eventType === 'repeat_exception') continue
    if (e.eventType === 'single' || !e.eventType) {
      if (e.date === dateStr) list.push({ ...e, _occurrenceDate: dateStr })
    } else if (e.eventType === 'range') {
      if (e.date && e.endDate && inRangeBounds(dateStr, e.date, e.endDate)) {
        list.push({ ...e, _occurrenceDate: dateStr })
      }
    } else if (e.eventType === 'repeat') {
      if (matchesRepeat(e, dateStr)) {
        const ex = safe.find(
          (x) => x.eventType === 'repeat_exception' && x.parentEventId === e.id && x.occurrenceDate === dateStr,
        )
        if (ex) {
          list.push({
            ...ex,
            _occurrenceDate: dateStr,
            _fromException: true,
            _displayTitle: ex.title,
          })
        } else {
          list.push({ ...e, _virtualRepeat: true, _occurrenceDate: dateStr })
        }
      }
    }
  }
  return list
}

export function sortEventsByTime(events) {
  return [...events].sort((a, b) => {
    if (a.time && b.time) return String(a.time).localeCompare(String(b.time))
    if (a.time && !b.time) return -1
    if (!a.time && b.time) return 1
    return (a.order || 0) - (b.order || 0)
  })
}

/** 셀 인덱스 기준으로 같은 행의 좌우 날짜가 범위에 포함되는지로 막대 시작/끝 판단 */
export function getRangeBarCaps(event, cellYmd, cellIndex, days) {
  if (event.eventType !== 'range' || !event.date || !event.endDate) return null
  if (!inRangeBounds(cellYmd, event.date, event.endDate)) return null

  const ymdAt = (idx) => {
    const c = days[idx]
    if (!c) return null
    return formatYmdKey(c.year, c.month, c.day)
  }

  const inR = (k) => k && inRangeBounds(k, event.date, event.endDate)

  const leftYmd = cellIndex % 7 > 0 ? ymdAt(cellIndex - 1) : null
  const rightYmd = cellIndex % 7 < 6 ? ymdAt(cellIndex + 1) : null

  const barStart = !inR(leftYmd)
  const barEnd = !inR(rightYmd)

  return { barStart, barEnd }
}
