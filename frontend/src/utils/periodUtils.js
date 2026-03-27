import { getStorage } from './storage'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toDateOnly(dateLike) {
  const d = new Date(dateLike)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getPeriodRanges() {
  return getStorage('period_ranges', [])
}

export function getPeriodDateKeys() {
  const ranges = getPeriodRanges()
  const out = []
  ranges.forEach((r) => {
    if (!r.startDate || !r.endDate) return
    const start = toDateOnly(r.startDate)
    const end = toDateOnly(r.endDate)
    if (end < start) return
    for (let t = start.getTime(); t <= end.getTime(); t += MS_PER_DAY) {
      out.push(toKey(new Date(t)))
    }
  })
  return [...new Set(out)]
}

export function isPeriodDate(dateKey) {
  return getPeriodDateKeys().includes(dateKey)
}
