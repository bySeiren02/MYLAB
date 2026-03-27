import { useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage } from '../utils/storage'
import { buildMonthGridDays, formatMonthLabel, formatYmdKey } from '../utils/dateUtils'
import { getEventsForDate, sortEventsByTime } from '../utils/calendarEvents'
import DatePickButton from '../components/DatePickButton'
import './CalendarPage.css'

const categories = [
  { id: 0, name: '업무', color: '#FF6B6B' },
  { id: 1, name: '개인', color: '#4ECDC4' },
  { id: 2, name: '운동', color: '#45B7D1' },
  { id: 3, name: '공부', color: '#FFA07A' },
  { id: 4, name: '약속', color: '#98D8C8' },
  { id: 5, name: '기타', color: '#F7DC6F' },
]

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [events, setEvents] = useState([])
  const [selectedKey, setSelectedKey] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '',
    eventType: 'single',
    date: '',
    endDate: '',
    time: '',
    category: 0,
    description: '',
    repeatInterval: '1week',
  })

  useEffect(() => {
    setEvents(getStorage('calendar_events', []))
  }, [])

  const saveEvents = (next) => {
    setStorage('calendar_events', next)
    setEvents(next)
  }

  const days = useMemo(() => buildMonthGridDays(viewDate.getFullYear(), viewDate.getMonth()), [viewDate])
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const todayKey = formatYmdKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const openNew = (dateKey) => {
    setEditing(null)
    setForm({
      title: '',
      eventType: 'single',
      date: dateKey,
      endDate: '',
      time: '',
      category: 0,
      description: '',
      repeatInterval: '1week',
    })
    setModalOpen(true)
  }

  const openEdit = (ev) => {
    setEditing(ev)
    setForm({
      title: ev.title || '',
      eventType: ev.eventType || 'single',
      date: ev.date || '',
      endDate: ev.endDate || '',
      time: ev.time || '',
      category: typeof ev.category === 'number' ? ev.category : 0,
      description: ev.description || '',
      repeatInterval: ev.repeatInterval || '1week',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const save = () => {
    if (!form.title?.trim() || !form.date) return

    if (editing) {
      const next = events.map((e) => (e.id === editing.id ? { ...editing, ...form, id: editing.id } : e))
      saveEvents(next)
    } else {
      const item = {
        id: Date.now(),
        ...form,
        order: getEventsForDate(events, form.date).length,
      }
      saveEvents([...events, item])
    }
    closeModal()
  }

  const remove = (id) => {
    if (!window.confirm('삭제할까요?')) return
    saveEvents(events.filter((e) => e.id !== id && e.parentId !== id))
    closeModal()
  }

  const selectedEvents = selectedKey ? sortEventsByTime(getEventsForDate(events, selectedKey)) : []

  return (
    <div>
      <div className="page-title-row">
        <h1>일정</h1>
      </div>

      <div className="cal-toolbar">
        <button type="button" className="btn btn-secondary" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
          ‹
        </button>
        <div className="cal-toolbar__title">{formatMonthLabel(viewDate)}</div>
        <button type="button" className="btn btn-secondary" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {weekdays.map((w) => (
          <div key={w} className="calendar-weekday">
            {w}
          </div>
        ))}
        {days.map((cell, idx) => {
          const key = formatYmdKey(cell.year, cell.month, cell.day)
          const list = getEventsForDate(events, key)
          const isToday = key === todayKey
          const isSel = key === selectedKey

          return (
            <button
              key={`${key}-${idx}`}
              type="button"
              className={['calendar-cell', cell.isOtherMonth ? 'dim' : '', isToday ? 'is-today' : '', isSel ? 'selected' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (cell.isOtherMonth) {
                  setViewDate(new Date(cell.year, cell.month, 1))
                  return
                }
                setSelectedKey(key)
              }}
            >
              <div style={{ fontWeight: 700 }}>{cell.day}</div>
              <div className="cal-bars">
                {list.slice(0, 4).map((ev) => {
                  const c = categories.find((x) => x.id === ev.category)
                  return <span key={ev.id} className="cal-bar" style={{ background: c?.color || '#ff87a1' }} title={ev.title} />
                })}
              </div>
            </button>
          )
        })}
      </div>

      {selectedKey && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>{selectedKey}</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => openNew(selectedKey)}>
                추가
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedKey(null)}>
                닫기
              </button>
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '0.75rem' }}>
              일정이 없습니다.
            </div>
          ) : (
            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
              {selectedEvents.map((ev) => {
                const c = categories.find((x) => x.id === ev.category)
                return (
                  <div key={ev.id} className="card" style={{ margin: 0, borderLeft: `4px solid ${c?.color || '#ff87a1'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <div className="card-title">{ev.title}</div>
                        {ev.time && <div className="card-meta">{ev.time}</div>}
                        {ev.description && <div className="card-content">{ev.description}</div>}
                        <div className="card-meta">
                          {c?.name} {ev.eventType === 'range' && ev.endDate ? `~ ${ev.endDate}` : ''}
                        </div>
                      </div>
                      <button type="button" className="btn btn-secondary" onClick={() => openEdit(ev)}>
                        수정
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>{editing ? '일정 수정' : '일정 추가'}</h2>

            <div className="form-group">
              <label>제목 *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="form-group">
              <label>유형</label>
              <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                <option value="single">당일</option>
                <option value="range">기간</option>
                <option value="repeat">반복</option>
              </select>
            </div>

            <DatePickButton
              label="시작일 *"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
            />

            {form.eventType === 'range' && (
              <DatePickButton
                label="종료일 *"
                value={form.endDate}
                onChange={(v) => setForm({ ...form, endDate: v })}
              />
            )}

            {form.eventType === 'repeat' && (
              <div className="form-group">
                <label>반복 주기</label>
                <select value={form.repeatInterval} onChange={(e) => setForm({ ...form, repeatInterval: e.target.value })}>
                  <option value="1week">1주</option>
                  <option value="2week">2주</option>
                  <option value="1month">한달</option>
                  <option value="6month">6개월</option>
                  <option value="1year">1년</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>시간</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>

            <div className="form-group">
              <label>카테고리</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: Number(e.target.value) })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>메모</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                취소
              </button>
              {editing && (
                <button type="button" className="btn btn-danger" onClick={() => remove(editing.id)}>
                  삭제
                </button>
              )}
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
