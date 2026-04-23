import { useEffect, useMemo, useState } from 'react'
import { getStorage } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import { getPeriodRanges, setPeriodRanges, getPeriodDateKeysFromRanges } from '../utils/periodUtils'
import CompactCalendar from '../components/CompactCalendar'
import DatePickButton from '../components/DatePickButton'

function isFemaleUser() {
  return getStorage('current_user', null)?.gender === 'female'
}

export default function PeriodPage() {
  const { currentDate, setCurrentDate } = useDateNavigation()
  const [ranges, setRanges] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ startDate: '', endDate: '', memo: '' })

  useEffect(() => {
    setRanges(getPeriodRanges())
  }, [])

  const persist = (next) => {
    setPeriodRanges(next)
    setRanges(next)
  }

  const periodKeys = useMemo(() => (isFemaleUser() ? getPeriodDateKeysFromRanges(ranges) : []), [ranges])

  const saveRange = () => {
    if (!form.startDate || !form.endDate) return
    persist([
      ...ranges,
      {
        id: Date.now(),
        startDate: form.startDate,
        endDate: form.endDate,
        memo: form.memo || '',
      },
    ])
    setForm({ startDate: '', endDate: '', memo: '' })
    setShowModal(false)
  }

  const removeRange = (id) => {
    if (!window.confirm('이 생리 기록을 삭제할까요?')) return
    persist(ranges.filter((r) => r.id !== id))
  }

  if (!isFemaleUser()) {
    return (
      <div>
        <div className="page-route-body">
          <div className="page-title-row">
            <h1>생리</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
            생리 캘린더는 <strong>설정</strong>에서 성별을 여성으로 저장한 경우에만 사용할 수 있어요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-route-body">
        <div className="page-title-row">
          <h1>생리</h1>
          <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
            기간 추가
          </button>
        </div>

        <CompactCalendar
          currentDate={currentDate}
          selectedDate={currentDate}
          highlightDates={[]}
          periodKeys={periodKeys}
          onDateChange={(d) => setCurrentDate(d)}
        />

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: '0.35rem' }}>
          이 화면의 분홍 표시는 <strong>여기에만</strong> 저장된 생리 기간이에요. 다른 메뉴 달력과는 따로 동작합니다.
        </p>

        <div className="page-route-body__grow" style={{ marginTop: '0.5rem' }}>
          {ranges.length === 0 ? (
            <div className="empty-state" />
          ) : (
            <div style={{ minHeight: 0, display: 'grid', gap: '0.5rem' }}>
              {ranges
                .slice()
                .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
                .map((r) => (
                  <div key={r.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="card-title">
                          {r.startDate} ~ {r.endDate}
                        </div>
                        {r.memo ? <div className="card-content">{r.memo}</div> : null}
                      </div>
                      <button type="button" className="btn btn-danger" onClick={() => removeRange(r.id)}>
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>생리기간 등록</h2>
            <DatePickButton label="시작일 *" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
            <DatePickButton label="종료일 *" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
            <div className="form-group">
              <label>메모</label>
              <textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={saveRange}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
