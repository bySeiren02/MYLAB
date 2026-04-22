import { getStorage, setStorage } from './storage'

const MS_PER_DAY = 24 * 60 * 60 * 1000
/** 몸 메뉴 > 생리 전용 (다른 화면 캘린더와 분리) */
const PERIOD_BODY_KEY = 'period_body_ranges'
const PERIOD_LEGACY_KEY = 'period_ranges'

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

function readBodyRanges() {
  let cur = getStorage(PERIOD_BODY_KEY, [])
  if (Array.isArray(cur) && cur.length > 0) return cur
  const old = getStorage(PERIOD_LEGACY_KEY, [])
  if (Array.isArray(old) && old.length > 0) {
    setStorage(PERIOD_BODY_KEY, old)
    setStorage(PERIOD_LEGACY_KEY, [])
    return old
  }
  return []
}

export function getPeriodRanges() {
  return readBodyRanges()
}

export function setPeriodRanges(next) {
  setStorage(PERIOD_BODY_KEY, Array.isArray(next) ? next : [])
}

export function getPeriodDateKeysFromRanges(ranges) {
  const out = []
  ;(ranges || []).forEach((r) => {
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

export function getPeriodDateKeys() {
  return getPeriodDateKeysFromRanges(getPeriodRanges())
}

export function isPeriodDate(dateKey) {
  return getPeriodDateKeys().includes(dateKey)
}
