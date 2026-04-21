import { useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage, listStorageKeysByPrefix } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'

export default function StudyPlanPage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [plans, setPlans] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    setPlans(getStorage(`study_plans_${dateKey}`, []))
  }, [dateKey])

  const persist = (next) => {
    setStorage(`study_plans_${dateKey}`, next)
    setPlans(next)
  }

  const highlightDates = useMemo(() => {
    return listStorageKeysByPrefix('study_plans_')
      .map((k) => k.replace('study_plans_', ''))
      .filter((dk) => (getStorage(`study_plans_${dk}`, []) || []).length > 0)
  }, [dateKey, plans])

  const add = () => {
    if (!text.trim()) return
    persist([...plans, { id: Date.now(), text: text.trim(), completed: false }])
    setText('')
  }

  const toggle = (id) => persist(plans.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p)))
  const remove = (id) => persist(plans.filter((p) => p.id !== id))

  const done = plans.filter((p) => p.completed).length
  const total = plans.length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div>
      <div className="page-route-body">
        <div className="page-title-row">
          <h1>공부</h1>
        </div>

        <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

        {total > 0 && (
          <div className="card" style={{ margin: 0, flexShrink: 0 }}>
            진행 {pct}% ({done}/{total})
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <input
            style={{ flex: 1, padding: '0.65rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder=""
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button type="button" className="btn btn-primary" onClick={add}>
            추가
          </button>
        </div>

        <div className="page-route-body__grow">
          {plans.length === 0 ? (
            <div className="empty-state" />
          ) : (
            <div style={{ minHeight: 0 }}>
              {plans.map((p) => (
                <div key={p.id} className="item-row">
                  <input type="checkbox" checked={!!p.completed} onChange={() => toggle(p.id)} />
                  <input type="text" value={p.text} onChange={(e) => persist(plans.map((x) => (x.id === p.id ? { ...x, text: e.target.value } : x)))} style={{ textDecoration: p.completed ? 'line-through' : 'none' }} />
                  <button type="button" className="btn btn-danger" onClick={() => remove(p.id)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
