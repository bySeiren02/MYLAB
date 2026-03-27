import { useEffect, useState } from 'react'
import { getStorage, setStorage } from '../utils/storage'
import { useYearNavigation } from '../hooks/useDateNavigation'
import { formatYearLabel } from '../utils/dateUtils'

export default function YearlyGoalPage() {
  const { currentYear, goToPrevious, goToNext } = useYearNavigation()
  const [goals, setGoals] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    setGoals(getStorage(`yearly_goals_${currentYear}`, []))
  }, [currentYear])

  const persist = (next) => {
    setStorage(`yearly_goals_${currentYear}`, next)
    setGoals(next)
  }

  const add = () => {
    if (!text.trim()) return
    persist([...goals, { id: Date.now(), text: text.trim(), completed: false }])
    setText('')
  }

  const toggle = (id) => persist(goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)))
  const remove = (id) => persist(goals.filter((g) => g.id !== id))

  return (
    <div>
      <div className="page-title-row">
        <h1>연 목표</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={goToPrevious}>
          ‹
        </button>
        <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatYearLabel(currentYear)}</div>
        <button type="button" className="btn btn-secondary" onClick={goToNext}>
          ›
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          style={{ flex: 1, padding: '0.65rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="연 목표 입력"
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
