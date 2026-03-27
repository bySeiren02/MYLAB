import { useEffect, useState } from 'react'
import { getStorage, setStorage, listStorageKeysByPrefix } from '../utils/storage'
import { useMonthNavigation } from '../hooks/useDateNavigation'
import { formatMonthLabel } from '../utils/dateUtils'

export default function MonthlyGoalPage() {
  const { currentMonth, goToPrevious, goToNext, monthKey } = useMonthNavigation()
  const [goals, setGoals] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    setGoals(getStorage(`monthly_goals_${monthKey}`, []))
  }, [monthKey])

  const persist = (next) => {
    setStorage(`monthly_goals_${monthKey}`, next)
    setGoals(next)
  }

  const add = () => {
    if (!text.trim()) return
    persist([...goals, { id: Date.now(), text: text.trim(), completed: false }])
    setText('')
  }

  const toggle = (id) => persist(goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)))
  const remove = (id) => persist(goals.filter((g) => g.id !== id))

  const done = goals.filter((g) => g.completed).length
  const total = goals.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const monthsWithData = listStorageKeysByPrefix('monthly_goals_')
    .map((k) => k.replace('monthly_goals_', ''))
    .filter((mk) => (getStorage(`monthly_goals_${mk}`, []) || []).length > 0)

  return (
    <div>
      <div className="page-title-row">
        <h1>월 목표</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={goToPrevious}>
          ‹
        </button>
        <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatMonthLabel(currentMonth)}</div>
        <button type="button" className="btn btn-secondary" onClick={goToNext}>
          ›
        </button>
      </div>

      {monthsWithData.includes(monthKey) && <div className="card" style={{ marginBottom: '0.75rem' }}>이번 달 기록 있음 · 진행 {pct}%</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          style={{ flex: 1, padding: '0.65rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="월 목표 입력"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className="btn btn-primary" onClick={add}>
          추가
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">목표가 없습니다.</div>
      ) : (
        goals.map((g) => (
          <div key={g.id} className="item-row">
            <input type="checkbox" checked={!!g.completed} onChange={() => toggle(g.id)} />
            <input type="text" value={g.text} onChange={(e) => persist(goals.map((x) => (x.id === g.id ? { ...x, text: e.target.value } : x)))} style={{ textDecoration: g.completed ? 'line-through' : 'none' }} />
            <button type="button" className="btn btn-danger" onClick={() => remove(g.id)}>
              삭제
            </button>
          </div>
        ))
      )}
    </div>
  )
}
