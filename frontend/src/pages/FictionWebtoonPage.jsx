import { useEffect, useMemo, useState } from 'react'
import { getStorage, listStorageKeysByPrefix, setStorage } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'

const types = ['소설', '웹툰']

export default function FictionWebtoonPage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [records, setRecords] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    type: types[0],
    title: '',
    platform: '',
    progress: '',
    review: '',
  })

  useEffect(() => {
    setRecords(getStorage(`fiction_webtoon_records_${dateKey}`, []))
  }, [dateKey])

  const persist = (next) => {
    setStorage(`fiction_webtoon_records_${dateKey}`, next)
    setRecords(next)
  }

  const highlightDates = useMemo(() => {
    return listStorageKeysByPrefix('fiction_webtoon_records_')
      .map((k) => k.replace('fiction_webtoon_records_', ''))
      .filter((dk) => (getStorage(`fiction_webtoon_records_${dk}`, []) || []).length > 0)
  }, [dateKey, records])

  const openNew = () => {
    setEditing(null)
    setForm({ type: types[0], title: '', platform: '', progress: '', review: '' })
    setModal(true)
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      type: r.type || types[0],
      title: r.title || '',
      platform: r.platform || '',
      progress: r.progress || '',
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

  const typeOptions = [...new Set([...types, form.type].filter(Boolean))]

  return (
    <div>
      <div className="page-route-body">
        <div className="page-title-row">
          <h1>소설·웹툰</h1>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            추가
          </button>
        </div>

        <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          이야기형 작품 감상은 여기, 교양·학습 독서는 <strong>성장 → 독서</strong>에 적어도 좋아요.
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
                      <div className="card-meta">
                        {r.type}
                        {r.platform ? ` · ${r.platform}` : ''}
                        {r.progress ? ` · ${r.progress}` : ''}
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
                {typeOptions.map((t) => (
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
              <label>출판사 / 연재처</label>
              <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="예: 창비, 네이버 웹툰" />
            </div>
            <div className="form-group">
              <label>진행</label>
              <input value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} placeholder="예: 12화 / 3권 완독" />
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
