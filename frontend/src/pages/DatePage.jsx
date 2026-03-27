import { useEffect, useMemo, useState } from 'react'
import CompactCalendar from '../components/CompactCalendar'
import { useDateNavigation } from '../hooks/useDateNavigation'
import { formatDate, formatYmdKey } from '../utils/dateUtils'
import { getStorage, setStorage } from '../utils/storage'
import DatePickButton from '../components/DatePickButton'

const ANNIVERSARY_DAYS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

const toDateKey = (date) => formatYmdKey(date.getFullYear(), date.getMonth(), date.getDate())

const getDiffDays = (startDate, endDate) => {
  const oneDay = 1000 * 60 * 60 * 24
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  return Math.floor((end - start) / oneDay)
}

export default function DatePage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [relationshipStart, setRelationshipStart] = useState('')
  const [record, setRecord] = useState({
    place: '',
    restaurant: '',
    mood: '',
    notes: '',
  })

  useEffect(() => {
    setRelationshipStart(getStorage('date_relationship_start', ''))
  }, [])

  useEffect(() => {
    const data = getStorage(`date_record_${dateKey}`, { place: '', restaurant: '', mood: '', notes: '' })
    setRecord(data)
  }, [dateKey])

  const saveRecord = (next) => {
    setStorage(`date_record_${dateKey}`, next)
    setRecord(next)
  }

  const anniversaryKeys = useMemo(() => {
    if (!relationshipStart) return []
    const start = new Date(`${relationshipStart}T00:00:00`)
    return ANNIVERSARY_DAYS.map((n) => {
      const d = new Date(start)
      d.setDate(d.getDate() + (n - 1))
      return toDateKey(d)
    })
  }, [relationshipStart])

  const dateRecordKeys = useMemo(() => {
    const keys = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith('date_record_')) keys.push(k.replace('date_record_', ''))
    }
    return keys
  }, [dateKey, record])

  const highlightDates = useMemo(() => {
    return [...new Set([...anniversaryKeys, ...dateRecordKeys])]
  }, [anniversaryKeys, dateRecordKeys])

  const dDayText = useMemo(() => {
    if (!relationshipStart) return '시작일을 설정해 주세요.'
    const start = new Date(`${relationshipStart}T00:00:00`)
    const today = new Date()
    const diff = getDiffDays(start, today) + 1
    return `D+${diff}`
  }, [relationshipStart])

  const selectedAnniversary = useMemo(() => {
    if (!relationshipStart) return null
    const idx = anniversaryKeys.findIndex((k) => k === dateKey)
    if (idx < 0) return null
    return `${ANNIVERSARY_DAYS[idx]}일 기념일`
  }, [relationshipStart, anniversaryKeys, dateKey])

  return (
    <div>
      <div className="page-title-row">
        <h1>데이트</h1>
      </div>

      <div className="card">
        <div className="form-group">
          <DatePickButton
            label="언제부터 만났나요? (시작일)"
            value={relationshipStart}
            onChange={(v) => {
              setRelationshipStart(v)
              setStorage('date_relationship_start', v)
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700 }}>현재 {dDayText}</div>
          {selectedAnniversary && <div style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedAnniversary}</div>}
        </div>
      </div>

      <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{formatDate(currentDate)} 데이트 기록</div>
        <div className="form-group">
          <label>장소</label>
          <input value={record.place} onChange={(e) => saveRecord({ ...record, place: e.target.value })} placeholder="어디서 만났는지" />
        </div>
        <div className="form-group">
          <label>식당</label>
          <input value={record.restaurant} onChange={(e) => saveRecord({ ...record, restaurant: e.target.value })} placeholder="어디서 먹었는지" />
        </div>
        <div className="form-group">
          <label>기분</label>
          <input value={record.mood} onChange={(e) => saveRecord({ ...record, mood: e.target.value })} placeholder="오늘 기분" />
        </div>
        <div className="form-group">
          <label>메모</label>
          <textarea value={record.notes} onChange={(e) => saveRecord({ ...record, notes: e.target.value })} placeholder="특별한 일, 선물, 기억하고 싶은 것" />
        </div>
      </div>

      {relationshipStart && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>기념일 안내</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>달력에서 하이라이트된 날짜가 100일/200일/300일/400일... 기념일입니다.</div>
          <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {ANNIVERSARY_DAYS.map((n, i) => (
              <span key={n} style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '0.25rem 0.55rem', fontSize: '0.8rem' }}>
                {n}일: {anniversaryKeys[i]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
