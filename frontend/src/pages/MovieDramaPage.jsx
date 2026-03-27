import { useEffect, useMemo, useState } from 'react'
import { getStorage, listStorageKeysByPrefix, setStorage } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'

const types = ['영화', '드라마']

export default function MovieDramaPage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [records, setRecords] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    type: types[0],
    title: '',
    platform: '',
    rating: '',
    review: '',
  })

  useEffect(() => {
    setRecords(getStorage(`movie_drama_records_${dateKey}`, []))
  }, [dateKey])

  const persist = (next) => {
    setStorage(`movie_drama_records_${dateKey}`, next)
    setRecords(next)
  }

  const highlightDates = useMemo(() => {
    return listStorageKeysByPrefix('movie_drama_records_')
      .map((k) => k.replace('movie_drama_records_', ''))
      .filter((dk) => (getStorage(`movie_drama_records_${dk}`, []) || []).length > 0)
  }, [dateKey, records])

  const openNew = () => {
    setEditing(null)
    setForm({ type: types[0], title: '', platform: '', rating: '', review: '' })
    setModal(true)
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      type: r.type || types[0],
      title: r.title || '',
      platform: r.platform || '',
      rating: r.rating || '',
      review: r.review || '',
    })
    setModal(true)
  }

  const save = () => {
    if (!form.title.trim()) return
    if (editing) {
      persist(records.map((r) => (r.id === editing.id ? { ...r, ...form } : r)))
    } else {
      persist([...records, { id: Date.now(), ...form }])
    }
    setModal(false)
  }

  const remove = (id) => {
    if (!window.confirm('삭제할까요?')) return
    persist(records.filter((r) => r.id !== id))
  }

  return (
    <div>
      <div className="page-title-row">
        <h1>영화&드라마</h1>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          추가
        </button>
      </div>

      <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

      {records.length === 0 ? (
        <div className="empty-state">기록이 없습니다.</div>
      ) : (
        records.map((r) => (
          <div key={r.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div className="card-title">{r.title}</div>
                <div className="card-meta">
                  {r.type}
                  {r.platform ? ` · ${r.platform}` : ''}
                  {r.rating ? ` · 평점 ${r.rating}` : ''}
                </div>
                {r.review && <div className="card-content">{r.review}</div>}
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
        ))
      )}

      {modal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>{editing ? '수정' : '추가'}</h2>
            <div className="form-group">
              <label>유형</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {types.map((t) => (
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
              <label>플랫폼</label>
              <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
            </div>
            <div className="form-group">
              <label>평점</label>
              <input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder="예: 4.5/5" />
            </div>
            <div className="form-group">
              <label>메모</label>
              <textarea value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} />
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
