import { useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage } from '../utils/storage'
import DatePickButton from '../components/DatePickButton'

function weeksInMonth(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const dim = last.getDate()
  const start = first.getDay()
  const adj = start === 0 ? 6 : start - 1
  return Math.ceil((dim + adj) / 7)
}

export default function DermatologyPage() {
  const now = new Date()
  const [y, setY] = useState(now.getFullYear())
  const [m, setM] = useState(now.getMonth())
  const [visits, setVisits] = useState({})
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ date: '', treatments: '', notes: '' })

  useEffect(() => {
    setVisits(getStorage('dermatology_visits', {}))
  }, [])

  const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`
  const wcount = useMemo(() => weeksInMonth(y, m), [y, m])

  const persist = (next) => {
    setStorage('dermatology_visits', next)
    setVisits(next)
  }

  const open = (week) => {
    const cur = visits[monthKey]?.[week]
    setForm({
      date: cur?.date || '',
      treatments: cur?.treatments || '',
      notes: cur?.notes || '',
    })
    setModal(week)
  }

  const save = () => {
    if (!form.date) {
      window.alert('날짜를 입력해주세요.')
      return
    }
    const mk = visits[monthKey] || {}
    persist({ ...visits, [monthKey]: { ...mk, [modal]: { ...form, week: modal } } })
    setModal(null)
  }

  const remove = (week) => {
    if (!window.confirm('삭제할까요?')) return
    const mk = { ...(visits[monthKey] || {}) }
    delete mk[week]
    persist({ ...visits, [monthKey]: mk })
  }

  return (
    <div>
      <div className="page-title-row">
        <h1>피부과</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (m === 0) {
              setM(11)
              setY((yy) => yy - 1)
            } else setM((mm) => mm - 1)
          }}
        >
          ‹
        </button>
        <div style={{ fontWeight: 800, color: 'var(--primary)' }}>
          {y}년 {m + 1}월
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (m === 11) {
              setM(0)
              setY((yy) => yy + 1)
            } else setM((mm) => mm + 1)
          }}
        >
          ›
        </button>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {Array.from({ length: wcount }, (_, i) => i + 1).map((week) => {
          const data = visits[monthKey]?.[week]
          return (
            <div key={week} className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ fontWeight: 800 }}>{week}주차</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-primary" onClick={() => open(week)}>
                    {data ? '수정' : '추가'}
                  </button>
                  {data && (
                    <button type="button" className="btn btn-danger" onClick={() => remove(week)}>
                      삭제
                    </button>
                  )}
                </div>
              </div>
              {data?.date && <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>방문일: {data.date}</div>}
              {data?.treatments && <div style={{ marginTop: '0.35rem' }}>치료: {data.treatments}</div>}
              {data?.notes && <div style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>{data.notes}</div>}
            </div>
          )
        })}
      </div>

      {modal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>{modal}주차 기록</h2>
            <DatePickButton
              label="방문일 *"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
            />
            <div className="form-group">
              <label>받은 치료</label>
              <input value={form.treatments} onChange={(e) => setForm({ ...form, treatments: e.target.value })} />
            </div>
            <div className="form-group">
              <label>메모</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={save}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
