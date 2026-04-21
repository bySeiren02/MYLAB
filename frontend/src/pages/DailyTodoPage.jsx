import { useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage, listStorageKeysByPrefix } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'

export default function DailyTodoPage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [routines, setRoutines] = useState([])
  const [routineText, setRoutineText] = useState('')
  const [showRoutine, setShowRoutine] = useState(false)

  useEffect(() => {
    setRoutines(getStorage('daily_todo_routines', []))
  }, [])

  useEffect(() => {
    const saved = getStorage(`daily_todo_${dateKey}`, [])
    const merged = [...saved]
    routines.forEach((r) => {
      if (!merged.some((t) => t.routineId === r.id)) {
        merged.push({
          id: Date.now() + Math.random(),
          text: r.text,
          completed: false,
          isRoutine: true,
          routineId: r.id,
        })
      }
    })
    setTodos(merged)
  }, [dateKey, routines])

  const persist = (next) => {
    setStorage(`daily_todo_${dateKey}`, next)
    setTodos(next)
  }

  const toggle = (id) => {
    persist(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const remove = (id) => {
    persist(todos.filter((t) => t.id !== id))
  }

  const add = () => {
    if (!text.trim()) return
    persist([...todos, { id: Date.now(), text: text.trim(), completed: false, isRoutine: false }])
    setText('')
  }

  const addRoutine = () => {
    if (!routineText.trim()) return
    const r = { id: Date.now(), text: routineText.trim() }
    const nextR = [...routines, r]
    setStorage('daily_todo_routines', nextR)
    setRoutines(nextR)
    setRoutineText('')
    setShowRoutine(false)
    persist([
      ...todos,
      { id: Date.now() + Math.random(), text: r.text, completed: false, isRoutine: true, routineId: r.id },
    ])
  }

  const deleteRoutine = (id) => {
    const nextR = routines.filter((r) => r.id !== id)
    setStorage('daily_todo_routines', nextR)
    setRoutines(nextR)
  }

  const highlightDates = useMemo(() => {
    return listStorageKeysByPrefix('daily_todo_')
      .map((k) => k.replace('daily_todo_', ''))
      .filter((dk) => (getStorage(`daily_todo_${dk}`, []) || []).length > 0)
  }, [dateKey, todos])

  return (
    <div>
      <div className="page-route-body">
        <div className="page-title-row">
          <h1>투두리스트</h1>
          <button type="button" className="btn btn-secondary" onClick={() => setShowRoutine(true)}>
            루틴 관리
          </button>
        </div>

        <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <input className="form-group" style={{ flex: 1, padding: '0.65rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} value={text} onChange={(e) => setText(e.target.value)} placeholder="" onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button type="button" className="btn btn-primary" onClick={add}>
            추가
          </button>
        </div>

        <div className="page-route-body__grow">
          {todos.length === 0 ? (
            <div className="empty-state" />
          ) : (
            <div style={{ minHeight: 0 }}>
              {todos.map((t) => (
                <div key={t.id} className="item-row">
                  <input type="checkbox" checked={!!t.completed} onChange={() => toggle(t.id)} />
                  <input type="text" value={t.text} onChange={(e) => persist(todos.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)))} style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.65 : 1 }} />
                  <button type="button" className="btn btn-danger" onClick={() => remove(t.id)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showRoutine && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>루틴 관리</h2>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                style={{ flex: 1, padding: '0.65rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={routineText}
                onChange={(e) => setRoutineText(e.target.value)}
                placeholder=""
                onKeyDown={(e) => e.key === 'Enter' && addRoutine()}
              />
              <button type="button" className="btn btn-primary" onClick={addRoutine}>
                추가
              </button>
            </div>
            {routines.map((r) => (
              <div key={r.id} className="item-row">
                <span style={{ flex: 1 }}>{r.text}</span>
                <button type="button" className="btn btn-danger" onClick={() => deleteRoutine(r.id)}>
                  삭제
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowRoutine(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
