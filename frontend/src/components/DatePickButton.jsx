import { useMemo, useState } from 'react'
import CompactCalendar from './CompactCalendar'

function parseDate(value) {
  if (!value) return new Date()
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function DatePickButton({ label, value, onChange, placeholder = '' }) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => parseDate(value), [value])

  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <button
        type="button"
        className="btn btn-secondary"
        style={{ width: '100%', justifyContent: 'space-between' }}
        onClick={() => setOpen(true)}
      >
        <span>{value || placeholder}</span>
        <span>📅</span>
      </button>

      {open && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3 style={{ marginBottom: '0.75rem' }}>{label || '날짜 선택'}</h3>
            <CompactCalendar
              currentDate={selected}
              selectedDate={selected}
              onDateChange={(d) => {
                onChange(toDateKey(d))
                setOpen(false)
              }}
              highlightDates={[]}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
