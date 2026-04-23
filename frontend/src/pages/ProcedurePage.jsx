import { useEffect, useMemo, useState } from 'react'
import { getStorage, listStorageKeysByPrefix, setStorage } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'

export default function ProcedurePage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [records, setRecords] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    area: '',
    place: '',
    cost: '',
    memo: '',
  })

  useEffect(() => {
    setRecords(getStorage(`procedure_records_${dateKey}`, []))
  }, [dateKey])

  const persist = (next) => {
    setStorage(`procedure_records_${dateKey}`, next)
    setRecords(next)
  }

  const highlightDates = useMemo(() => {
    return listStorageKeysByPrefix('procedure_records_')
      .map((k) => k.replace('procedure_records_', ''))
      .filter((dk) => (getStorage(`procedure_records_${dk}`, []) || []).length > 0)
  }, [dateKey, records])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', area: '', place: '', cost: '', memo: '' })
    setModal(true)
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      name: r.name || '',
      area: r.area || '',
      place: r.place || '',
      cost: r.cost || '',
      memo: r.memo || '',
    })
    setModal(true)
  }

  const save = () => {
    if (!form.name.trim()) return
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
      <div className="page-route-body">
        <div className="page-title-row">
          <h1>시술</h1>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            추가
          </button>
        </div>

        <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          선택한 날짜({dateKey})에 시술 기록이 저장됩니다.
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
                      <div className="card-title">{r.name}</div>
                      <div className="card-meta">
                        {[r.area, r.place].filter(Boolean).join(' · ')}
                        {r.cost ? ` · ${r.cost}` : ''}
                      </div>
                      {r.memo && <div className="card-content">{r.memo}</div>}
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
              <label>시술명 *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 울쎄라, 보톡스" />
            </div>
            <div className="form-group">
              <label>부위</label>
              <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="예: 턱선, 이마" />
            </div>
            <div className="form-group">
              <label>시술처</label>
              <input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="병원·클리닉 이름" />
            </div>
            <div className="form-group">
              <label>금액</label>
              <input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="예: 30만원" />
            </div>
            <div className="form-group">
              <label>메모</label>
              <textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
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
