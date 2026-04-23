import { useMemo, useState } from 'react'
import DatePickButton from '../components/DatePickButton'
import { getStorage, setStorage } from '../utils/storage'

const STORAGE_KEY = 'dday_items'

const CATEGORY_OPTIONS = [
  { value: 'normal', label: '기념일' },
  { value: 'birthday', label: '생일(매년 반복)' },
]

const toDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const parseDate = (value) => {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const diffDays = (from, to) => {
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor((toDateOnly(to) - toDateOnly(from)) / oneDay)
}

const birthdayTargetFrom = (baseDate, today) => {
  const month = baseDate.getMonth()
  const day = baseDate.getDate()
  const thisYear = new Date(today.getFullYear(), month, day)
  if (diffDays(today, thisYear) >= 0) return thisYear
  return new Date(today.getFullYear() + 1, month, day)
}

const getCountdown = (item, today) => {
  const baseDate = parseDate(item.date)
  if (!baseDate) return { text: '-', subText: '' }

  if (item.category === 'birthday') {
    const target = birthdayTargetFrom(baseDate, today)
    const left = diffDays(today, target)
    if (left === 0) return { text: 'D-Day', subText: '오늘 생일이에요' }
    return { text: `D-${left}`, subText: `다음 생일까지 ${left}일` }
  }

  const d = diffDays(today, baseDate)
  if (d === 0) return { text: 'D-Day', subText: '오늘이에요' }
  if (d < 0) return { text: `D-${Math.abs(d)}`, subText: `${Math.abs(d)}일 남음` }
  return { text: `D+${d}`, subText: `${d}일 지남` }
}

export default function DdayPage() {
  const [items, setItems] = useState(() => getStorage(STORAGE_KEY, []))
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDate, setDraftDate] = useState('')
  const [draftCategory, setDraftCategory] = useState('normal')

  const persist = (next) => {
    setItems(next)
    setStorage(STORAGE_KEY, next)
  }

  const addItem = () => {
    const title = draftTitle.trim()
    if (!title || !draftDate) return
    const next = [
      ...items,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        date: draftDate,
        category: draftCategory,
      },
    ]
    persist(next)
    setDraftTitle('')
    setDraftDate('')
    setDraftCategory('normal')
  }

  const removeItem = (id) => {
    persist(items.filter((item) => item.id !== id))
  }

  const sortedItems = useMemo(() => {
    const today = new Date()
    return [...items].sort((a, b) => {
      const aDate = parseDate(a.date)
      const bDate = parseDate(b.date)
      if (!aDate || !bDate) return 0

      const aTarget = a.category === 'birthday' ? birthdayTargetFrom(aDate, today) : aDate
      const bTarget = b.category === 'birthday' ? birthdayTargetFrom(bDate, today) : bDate
      return aTarget - bTarget
    })
  }, [items])

  return (
    <div className="page-route-body">
      <div className="page-title-row">
        <h1>디데이</h1>
      </div>

      <div className="card">
        <div className="form-group">
          <label>이름</label>
          <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="" />
        </div>

        <DatePickButton label="기준 날짜" value={draftDate} onChange={setDraftDate} />

        <div className="form-group">
          <label>카테고리</label>
          <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn-primary" onClick={addItem}>
          디데이 추가
        </button>
      </div>

      <div className="card">
        {sortedItems.length === 0 ? (
          <div>등록된 디데이가 없습니다.</div>
        ) : (
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {sortedItems.map((item) => {
              const countdown = getCountdown(item, new Date())
              return (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '0.75rem',
                    background: 'var(--bg)',
                    display: 'grid',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'center' }}>
                    <strong>{item.title}</strong>
                    <strong style={{ color: 'var(--primary)' }}>{countdown.text}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    {item.date} · {item.category === 'birthday' ? '생일(매년 반복)' : '기념일'}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{countdown.subText}</div>
                  <div>
                    <button type="button" className="btn btn-danger" onClick={() => removeItem(item.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
