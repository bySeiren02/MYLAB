import { useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage, listStorageKeysByPrefix } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'

export default function ReadingPage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [books, setBooks] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', author: '', status: '읽는중', review: '' })

  useEffect(() => {
    setBooks(getStorage(`reading_books_${dateKey}`, []))
  }, [dateKey])

  const persist = (next) => {
    setStorage(`reading_books_${dateKey}`, next)
    setBooks(next)
  }

  const highlightDates = useMemo(() => {
    return listStorageKeysByPrefix('reading_books_')
      .map((k) => k.replace('reading_books_', ''))
      .filter((dk) => (getStorage(`reading_books_${dk}`, []) || []).length > 0)
  }, [dateKey, books])

  const openNew = () => {
    setEditing(null)
    setForm({ title: '', author: '', status: '읽는중', review: '' })
    setModal(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setForm({ title: b.title || '', author: b.author || '', status: b.status || '읽는중', review: b.review || '' })
    setModal(true)
  }

  const save = () => {
    if (!form.title.trim()) return
    if (editing) persist(books.map((b) => (b.id === editing.id ? { ...b, ...form } : b)))
    else persist([...books, { id: Date.now(), ...form }])
    setModal(false)
  }

  const remove = (id) => {
    if (!window.confirm('삭제할까요?')) return
    persist(books.filter((b) => b.id !== id))
  }

  return (
    <div>
      <div className="page-title-row">
        <h1>독서</h1>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          추가
        </button>
      </div>

      <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        선택한 날짜({dateKey})에 기록됩니다.
      </div>

      {books.length === 0 ? (
        <div className="empty-state">기록이 없습니다.</div>
      ) : (
        books.map((b) => (
          <div key={b.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div className="card-title">{b.title}</div>
                <div className="card-meta">
                  {b.author && <span>{b.author} · </span>}
                  상태: {b.status}
                </div>
                {b.review && <div className="card-content">{b.review}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => openEdit(b)}>
                  수정
                </button>
                <button type="button" className="btn btn-danger" onClick={() => remove(b.id)}>
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
              <label>제목 *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>저자</label>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div className="form-group">
              <label>상태</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="읽는중">읽는중</option>
                <option value="완독">완독</option>
                <option value="중단">중단</option>
              </select>
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
