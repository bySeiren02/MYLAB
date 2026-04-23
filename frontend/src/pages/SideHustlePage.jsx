import { useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage, listStorageKeysByPrefix } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'
import { getSideHustleCategories } from '../utils/sideHustleCategories'

const STORAGE_PREFIX = 'side_hustle_'

export default function SideHustlePage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [category, setCategory] = useState('')
  const [categoryOptions, setCategoryOptions] = useState(() => getSideHustleCategories())

  useEffect(() => {
    setTodos(getStorage(`${STORAGE_PREFIX}${dateKey}`, []))
  }, [dateKey])

  useEffect(() => {
    const sync = () => {
      const next = getSideHustleCategories()
      setCategoryOptions(next)
      setCategory((prev) => prev || next[0] || '')
    }
    sync()
    window.addEventListener('mylab-side-hustle-categories-changed', sync)
    return () => window.removeEventListener('mylab-side-hustle-categories-changed', sync)
  }, [])

  const persist = (next) => {
    setStorage(`${STORAGE_PREFIX}${dateKey}`, next)
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
    const safeCategory = category || categoryOptions[0] || '기타'
    persist([...todos, { id: Date.now(), text: text.trim(), category: safeCategory, completed: false }])
    setText('')
  }

  const highlightDates = useMemo(() => {
    return listStorageKeysByPrefix(STORAGE_PREFIX)
      .map((k) => k.replace(STORAGE_PREFIX, ''))
      .filter((dk) => (getStorage(`${STORAGE_PREFIX}${dk}`, []) || []).length > 0)
  }, [dateKey, todos])

  return (
    <div>
      <div className="page-route-body">
        <div className="page-title-row">
          <h1>부업 할 일</h1>
        </div>

        <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginTop: '0.35rem' }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '7.8rem',
              padding: '0.65rem 0.55rem',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className="form-group"
            style={{
              flex: 1,
              padding: '0.65rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="오늘 할 부업 일을 입력"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
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
                  <select
                    value={t.category || categoryOptions[0] || '기타'}
                    onChange={(e) => persist(todos.map((x) => (x.id === t.id ? { ...x, category: e.target.value } : x)))}
                    style={{ maxWidth: '7.5rem', fontSize: '0.82rem' }}
                  >
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={t.text}
                    onChange={(e) => persist(todos.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)))}
                    style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.65 : 1 }}
                  />
                  <button type="button" className="btn btn-danger" onClick={() => remove(t.id)}>
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
