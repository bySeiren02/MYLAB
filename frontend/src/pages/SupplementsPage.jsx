import { useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage, listStorageKeysByPrefix } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'

export default function SupplementsPage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [items, setItems] = useState([])
  const [text, setText] = useState('')
  const [routines, setRoutines] = useState([])
  const [routineText, setRoutineText] = useState('')
  const [showRoutine, setShowRoutine] = useState(false)

  useEffect(() => {
    setRoutines(getStorage('supplements_routines', []))
  }, [])

  useEffect(() => {
    const saved = getStorage(`supplements_${dateKey}`, [])
    const merged = [...saved]
    routines.forEach((r) => {
      if (!merged.some((x) => x.routineId === r.id)) {
        merged.push({ id: Date.now() + Math.random(), name: r.name, taken: false, isRoutine: true, routineId: r.id })
      }
    })
    setItems(merged)
  }, [dateKey, routines])

  const persist = (next) => {
    setStorage(`supplements_${dateKey}`, next)
    setItems(next)
  }

  const toggle = (id) => persist(items.map((x) => (x.id === id ? { ...x, taken: !x.taken } : x)))
  const remove = (id) => persist(items.filter((x) => x.id !== id))

  const add = () => {
    if (!text.trim()) return
    persist([...items, { id: Date.now(), name: text.trim(), taken: false, isRoutine: false }])
    setText('')
  }

  const addRoutine = () => {
    if (!routineText.trim()) return
    const r = { id: Date.now(), name: routineText.trim() }
    const nextR = [...routines, r]
    setStorage('supplements_routines', nextR)
    setRoutines(nextR)
    setRoutineText('')
    setShowRoutine(false)
    persist([...items, { id: Date.now() + Math.random(), name: r.name, taken: false, isRoutine: true, routineId: r.id }])
  }

  const deleteRoutine = (id) => {
    const nextR = routines.filter((r) => r.id !== id)
    setStorage('supplements_routines', nextR)
    setRoutines(nextR)
  }

  const highlightDates = useMemo(() => {
    return listStorageKeysByPrefix('supplements_')
      .map((k) => k.replace('supplements_', ''))
      .filter((dk) => (getStorage(`supplements_${dk}`, []) || []).some((x) => x.taken))
  }, [dateKey, items])

  const taken = items.filter((x) => x.taken).length

  return (
    <div>
      <div className="page-title-row">
        <h1>영양제</h1>
        <button type="button" className="btn btn-secondary" onClick={() => setShowRoutine(true)}>
          루틴 관리
        </button>
      </div>

      <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

      {items.length > 0 && (
        <div className="card" style={{ marginBottom: '0.75rem' }}>
          복용 체크: {taken} / {items.length}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          style={{ flex: 1, padding: '0.65rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="영양제 이름"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className="btn btn-primary" onClick={add}>
          추가
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">항목이 없습니다.</div>
      ) : (
        items.map((x) => (
          <div key={x.id} className="item-row">
            <input type="checkbox" checked={!!x.taken} onChange={() => toggle(x.id)} />
            <input type="text" value={x.name} onChange={(e) => persist(items.map((t) => (t.id === x.id ? { ...t, name: e.target.value } : t)))} />
            <button type="button" className="btn btn-danger" onClick={() => remove(x.id)}>
              삭제
            </button>
          </div>
        ))
      )}

      {showRoutine && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>루틴 관리</h2>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                style={{ flex: 1, padding: '0.65rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={routineText}
                onChange={(e) => setRoutineText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRoutine()}
              />
              <button type="button" className="btn btn-primary" onClick={addRoutine}>
                추가
              </button>
            </div>
            {routines.map((r) => (
              <div key={r.id} className="item-row">
                <span style={{ flex: 1 }}>{r.name}</span>
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
