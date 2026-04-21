import { useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage, listStorageKeysByPrefix } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'

const types = ['전시회', '페스티벌', '기타']

export default function CulturalPage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [records, setRecords] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ type: types[0], title: '', location: '', withWhom: '', thoughts: '' })

  useEffect(() => {
    setRecords(getStorage(`cultural_life_records_${dateKey}`, []))
  }, [dateKey])

  const persist = (next) => {
    setStorage(`cultural_life_records_${dateKey}`, next)
    setRecords(next)
  }

  const highlightDates = useMemo(() => {
    return listStorageKeysByPrefix('cultural_life_records_')
      .map((k) => k.replace('cultural_life_records_', ''))
      .filter((dk) => (getStorage(`cultural_life_records_${dk}`, []) || []).length > 0)
  }, [dateKey, records])

  const openNew = () => {
    setEditing(null)
    setForm({ type: types[0], title: '', location: '', withWhom: '', thoughts: '' })
    setModal(true)
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      type: r.type || types[0],
      title: r.title || '',
      location: r.location || '',
      withWhom: r.withWhom || '',
      thoughts: r.thoughts || '',
    })
    setModal(true)
  }

  const save = () => {
    if (!form.title.trim()) return
    if (editing) persist(records.map((r) => (r.id === editing.id ? { ...r, ...form } : r)))
    else persist([...records, { id: Date.now(), ...form }])
    setModal(false)
  }

  const remove = (id) => {
    if (!window.confirm('삭제할까요?')) return
    persist(records.filter((r) => r.id !== id))
  }

  return (
    <div>
      <div className="page-route-body">
        <div className="page-title-row">
          <h1>전시·나들이</h1>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            추가
          </button>
        </div>

        <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          전시·축제 등 밖에서 즐긴 문화 나들이는 여기, 공연·영상은 <strong>감상 기록 → 시청·공연</strong>으로 나눠도 좋아요.
        </div>

        <div className="page-route-body__grow">
          {records.length === 0 ? (
            <div className="empty-state" />
          ) : (
            <div style={{ minHeight: 0 }}>
              {records.map((r) => (
                <div key={r.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div className="card-title">{r.title}</div>
                      <div className="card-meta">{r.type}</div>
                      {r.location && <div className="card-meta">장소: {r.location}</div>}
                      {r.withWhom && <div className="card-meta">함께: {r.withWhom}</div>}
                      {r.thoughts && <div className="card-content">{r.thoughts}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => openEdit(r)}>
                        수정
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => remove(r.id)}>
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>{editing ? '수정' : '추가'}</h2>
            <div className="form-group">
              <label>유형</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {[...new Set([...types, form.type].filter(Boolean))].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>제목 *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>장소</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label>함께</label>
              <input value={form.withWhom} onChange={(e) => setForm({ ...form, withWhom: e.target.value })} />
            </div>
            <div className="form-group">
              <label>느낀 점</label>
              <textarea value={form.thoughts} onChange={(e) => setForm({ ...form, thoughts: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
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
