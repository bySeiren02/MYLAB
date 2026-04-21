import { useEffect, useState } from 'react'
import { getStorage, setStorage } from '../utils/storage'

const days = ['월', '화', '수', '목', '금', '토', '일']

export default function SkincarePage() {
  const [map, setMap] = useState({})
  const [draft, setDraft] = useState({})

  useEffect(() => {
    setMap(getStorage('skincare_routines', {}))
  }, [])

  const persist = (next) => {
    setStorage('skincare_routines', next)
    setMap(next)
  }

  const add = (day) => {
    const v = (draft[day] || '').trim()
    if (!v) return
    const list = map[day] || []
    persist({ ...map, [day]: [...list, { id: Date.now(), text: v, completed: false }] })
    setDraft({ ...draft, [day]: '' })
  }

  const toggle = (day, id) => {
    const list = (map[day] || []).map((x) => (x.id === id ? { ...x, completed: !x.completed } : x))
    persist({ ...map, [day]: list })
  }

  const remove = (day, id) => {
    persist({ ...map, [day]: (map[day] || []).filter((x) => x.id !== id) })
  }

  return (
    <div>
      <div className="page-route-body">
        <div className="page-title-row">
          <h1>피부관리</h1>
        </div>

        <div className="page-route-body__grow" style={{ display: 'grid', gap: '0.75rem', minHeight: 0 }}>
        {days.map((day) => (
          <div key={day} className="card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>
              {day}요일
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={draft[day] || ''}
                onChange={(e) => setDraft({ ...draft, [day]: e.target.value })}
                placeholder=""
                onKeyDown={(e) => e.key === 'Enter' && add(day)}
              />
              <button type="button" className="btn btn-primary" onClick={() => add(day)}>
                추가
              </button>
            </div>
            {(map[day] || []).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>없음</div>
            ) : (
              (map[day] || []).map((x) => (
                <div key={x.id} className="item-row">
                  <input type="checkbox" checked={!!x.completed} onChange={() => toggle(day, x.id)} />
                  <input type="text" value={x.text} onChange={(e) => persist({ ...map, [day]: (map[day] || []).map((t) => (t.id === x.id ? { ...t, text: e.target.value } : t)) })} />
                  <button type="button" className="btn btn-danger" onClick={() => remove(day, x.id)}>
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}
