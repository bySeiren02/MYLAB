import { formatYmdKey } from './dateUtils'

export const INCOME_CATEGORIES = [
  { id: 'salary', name: '월급' },
  { id: 'side', name: '부수입' },
  { id: 'interest', name: '이자·배당' },
  { id: 'refund', name: '환급' },
  { id: 'allowance', name: '용돈' },
  { id: 'gift', name: '경조·선물' },
  { id: 'other_in', name: '기타 입금' },
]

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: '식비' },
  { id: 'transport', name: '교통' },
  { id: 'comm', name: '통신' },
  { id: 'subscr', name: '구독' },
  { id: 'shopping', name: '쇼핑' },
  { id: 'medical', name: '의료' },
  { id: 'culture', name: '문화·여가' },
  { id: 'housing', name: '주거' },
  { id: 'insurance', name: '보험' },
  { id: 'savings', name: '저축·투자' },
  { id: 'tax', name: '세금·공과' },
  { id: 'other_out', name: '기타 지출' },
]

export const LEDGER_STORAGE_KEY = 'ledger_entries_v1'

function parseYmd(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function formatYmdFromDate(dt) {
  return formatYmdKey(dt.getFullYear(), dt.getMonth(), dt.getDate())
}

function addMonthsKeepDay(dt, delta) {
  const y = dt.getFullYear()
  const m = dt.getMonth()
  const day = dt.getDate()
  const t = new Date(y, m + delta, 1)
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  t.setDate(Math.min(day, last))
  return t
}

/** 단일 항목이 만드는 모든 (날짜, 금액) occurrence */
export function expandLedgerEntry(entry) {
  const out = []
  const type = entry.type === 'income' ? 'income' : 'expense'
  const id = entry.id
  const memo = entry.memo || ''
  const categoryId = entry.categoryId || ''

  const push = (dateKey, amount) => {
    if (!dateKey || amount == null || Number.isNaN(amount)) return
    out.push({ dateKey, amount: Number(amount), type, id, memo, categoryId })
  }

  const schedule = entry.scheduleType || 'once'

  if (schedule === 'once') {
    const dk = entry.date || entry.startDate
    const amt = Number(entry.amount) || 0
    if (dk) push(dk, amt)
    return out
  }

  if (schedule === 'installment') {
    const start = entry.startDate || entry.date
    const months = Math.max(1, Math.min(120, Number(entry.installmentMonths) || 1))
    const total = Number(entry.amount) || 0
    const per = Math.round((total / months) * 100) / 100
    const startDt = parseYmd(start)
    if (!startDt) return out
    for (let i = 0; i < months; i += 1) {
      const d = addMonthsKeepDay(startDt, i)
      push(formatYmdFromDate(d), per)
    }
    return out
  }

  if (schedule === 'recurring') {
    const amount = Number(entry.amount) || 0
    const start = parseYmd(entry.recurrenceStart || entry.date)
    const end = parseYmd(entry.recurrenceEnd)
    const interval = entry.recurrenceInterval || 'month'
    if (!start || !end || start > end) return out

    let guard = 0
    const cur = new Date(start)
    while (cur <= end && guard < 5000) {
      push(formatYmdFromDate(cur), amount)
      guard += 1
      if (interval === 'day') cur.setDate(cur.getDate() + 1)
      else if (interval === 'week') cur.setDate(cur.getDate() + 7)
      else cur.setMonth(cur.getMonth() + 1)
    }
    return out
  }

  return out
}

export function expandAllEntries(entries) {
  const list = []
  ;(entries || []).forEach((e) => {
    expandLedgerEntry(e).forEach((x) => list.push(x))
  })
  return list
}

/** 해당 월(0-based month) 합계 + 날짜별 입·출 색상용 */
export function summarizeMonth(entries, year, month) {
  const occ = expandAllEntries(entries)
  let income = 0
  let expense = 0
  const dayTint = {}

  occ.forEach((o) => {
    const [y, m] = o.dateKey.split('-').map(Number)
    if (y !== year || m - 1 !== month) return
    if (o.type === 'income') income += o.amount
    else expense += o.amount
    if (!dayTint[o.dateKey]) dayTint[o.dateKey] = { income: false, expense: false }
    if (o.type === 'income') dayTint[o.dateKey].income = true
    else dayTint[o.dateKey].expense = true
  })

  return { incomeTotal: income, expenseTotal: expense, dayTint }
}

export function occurrencesOnDate(entries, dateKey) {
  return expandAllEntries(entries).filter((o) => o.dateKey === dateKey)
}

export function categoryLabel(type, categoryId) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return list.find((c) => c.id === categoryId)?.name || categoryId
}
