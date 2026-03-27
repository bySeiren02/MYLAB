import { useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage, getDateKey } from '../utils/storage'
import { buildMonthGridDays, formatMonthLabel, formatYmdKey } from '../utils/dateUtils'
import { moodIcons } from '../utils/moodIcons'
import { useDateNavigation } from '../hooks/useDateNavigation'
import { getEventsForDate, sortEventsByTime } from '../utils/calendarEvents'
import { getPeriodDateKeys, getPeriodRanges } from '../utils/periodUtils'
import DatePickButton from '../components/DatePickButton'
import './HomePage.css'

const EVENT_CATEGORIES = [
  { id: 0, name: '업무', color: '#FF6B6B' },
  { id: 1, name: '개인', color: '#4ECDC4' },
  { id: 2, name: '운동', color: '#45B7D1' },
  { id: 3, name: '공부', color: '#FFA07A' },
  { id: 4, name: '약속', color: '#98D8C8' },
  { id: 5, name: '기타', color: '#F7DC6F' },
]

export default function HomePage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [viewDate, setViewDate] = useState(() => new Date())
  const [events, setEvents] = useState([])
  const [mood, setMood] = useState(null)
  const [answer, setAnswer] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelKey, setPanelKey] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [periodRanges, setPeriodRanges] = useState([])
  const [periodForm, setPeriodForm] = useState({ startDate: '', endDate: '', memo: '' })
  const [eventForm, setEventForm] = useState({
    title: '',
    time: '',
    description: '',
    category: 0,
  })

  useEffect(() => {
    setEvents(getStorage('calendar_events', []))
    setPeriodRanges(getPeriodRanges())
  }, [])

  useEffect(() => {
    const data = getStorage(`diary_${dateKey}`, { mood: null, questionAnswer: '' })
    setMood(data.mood || null)
    setAnswer(data.questionAnswer || '')
  }, [dateKey])

  const saveDiary = (next) => {
    setStorage(`diary_${dateKey}`, next)
  }

  const todayKey = formatYmdKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const days = useMemo(() => buildMonthGridDays(viewDate.getFullYear(), viewDate.getMonth()), [viewDate])
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  const handleDayClick = (cell) => {
    if (cell.isOtherMonth) {
      setViewDate(new Date(cell.year, cell.month, 1))
      return
    }
    const d = new Date(cell.year, cell.month, cell.day)
    setCurrentDate(d)
    const key = formatYmdKey(cell.year, cell.month, cell.day)
    const list = sortEventsByTime(getEventsForDate(events, key))
    setPanelKey(key)
    setPanelOpen(list.length > 0)
    if (list.length === 0) {
      setEventForm({ title: '', time: '', description: '', category: 0 })
      setShowAddModal(true)
    }
  }
  const saveEvent = () => {
    if (!panelKey || !eventForm.title.trim()) return
    const next = [
      ...events,
      {
        id: Date.now(),
        title: eventForm.title.trim(),
        date: panelKey,
        time: eventForm.time,
        description: eventForm.description,
        category: eventForm.category,
        eventType: 'single',
      },
    ]
    setStorage('calendar_events', next)
    setEvents(next)
    setShowAddModal(false)
    setPanelOpen(true)
  }


  const panelEvents = panelKey ? sortEventsByTime(getEventsForDate(events, panelKey)) : []
  const periodDateKeys = useMemo(() => getPeriodDateKeys(), [periodRanges])

  const savePeriodRange = () => {
    if (!periodForm.startDate || !periodForm.endDate) return
    const next = [
      ...periodRanges,
      {
        id: Date.now(),
        startDate: periodForm.startDate,
        endDate: periodForm.endDate,
        memo: periodForm.memo || '',
      },
    ]
    setStorage('period_ranges', next)
    setPeriodRanges(next)
    setPeriodForm({ startDate: '', endDate: '', memo: '' })
    setShowPeriodModal(false)
  }

  return (
    <div className="home">
      <div className="page-title-row">
        <h1>홈</h1>
      </div>

      <section className="home__compact">
        <div className="home__block">
          <h2 className="home__h2">오늘 기분</h2>
          <div className="home__moods">
            {moodIcons.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`home__mood ${mood?.id === m.id ? 'active' : ''}`}
                style={{ borderColor: m.color }}
                onClick={() => {
                  setMood(m)
                  saveDiary({ mood: m, questionAnswer: answer })
                }}
                aria-label={m.label}
              >
                <span>{m.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="home__block">
          <h2 className="home__h2">왜 오늘 이 기분인지</h2>
          <textarea
            className="home__ta"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onBlur={() => saveDiary({ mood, questionAnswer: answer })}
            placeholder="오늘 이런 기분이 된 이유를 적어보세요"
          />
        </div>
      </section>

      <section className="home__cal">
        <div className="home__calHead">
          <button type="button" className="home__nav" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
            ‹
          </button>
          <div className="home__calTitle">{formatMonthLabel(viewDate)}</div>
          <button type="button" className="home__nav" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
            ›
          </button>
        </div>

        <div className="calendar-grid" style={{ marginTop: '0.5rem' }}>
          {weekdays.map((w) => (
            <div key={w} className="calendar-weekday">
              {w}
            </div>
          ))}
          {days.map((cell, idx) => {
            const key = formatYmdKey(cell.year, cell.month, cell.day)
            const dayEvents = getEventsForDate(events, key)
            const isToday = key === todayKey
            const isSelected = key === getDateKey(currentDate)
            const isPeriod = periodDateKeys.includes(key)

            return (
              <button
                key={`${key}-${idx}`}
                type="button"
                className={[
                  'calendar-cell',
                  cell.isOtherMonth ? 'dim' : '',
                  isToday ? 'today' : '',
                  isSelected ? 'selected' : '',
                  isPeriod ? 'period' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleDayClick(cell)}
              >
                <div style={{ fontWeight: 600 }}>{cell.day}</div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    width: '100%',
                    marginTop: 2,
                  }}
                >
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        fontSize: '0.62rem',
                        lineHeight: 1.2,
                        color: 'var(--text)',
                        background: 'rgba(255, 135, 161, 0.12)',
                        borderRadius: 4,
                        padding: '1px 3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                      }}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        <div className="home__hint" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
          <span>날짜를 누르면 그날 일기(기분/답)가 위에 반영됩니다. 일정이 있는 날은 아래 패널이 열립니다.</span>
          <button type="button" className="btn btn-secondary" onClick={() => setShowPeriodModal(true)}>
            생리기간 추가
          </button>
        </div>
      </section>

      {panelOpen && panelKey && (
        <div className="dock-panel">
          <div className="home__panelHead">
            <div style={{ fontWeight: 700 }}>{panelKey} 일정</div>
            <button type="button" className="btn btn-secondary" onClick={() => setPanelOpen(false)}>
              닫기
            </button>
          </div>
          {panelEvents.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '0.75rem' }}>
              일정이 없습니다.
            </div>
          ) : (
            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
              {panelEvents.map((ev) => (
                <div key={ev.id} className="card" style={{ marginBottom: 0 }}>
                  <div className="card-title">{ev.title}</div>
                  {ev.time && <div className="card-meta">{ev.time}</div>}
                  {ev.description && <div className="card-content">{ev.description}</div>}
                  <div className="card-meta">
                    카테고리:{' '}
                    {EVENT_CATEGORIES.find((c) => c.id === Number(ev.category))?.name || '기타'}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>홈 달력에서 날짜를 눌러 일정을 확인하세요.</div>
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEventForm({ title: '', time: '', description: '', category: 0 })
                setShowAddModal(true)
              }}
            >
              이 날짜에 일정 추가
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>{panelKey} 일정 등록</h2>
            <div className="form-group">
              <label>제목 *</label>
              <input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>시간</label>
              <input type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} />
            </div>
            <div className="form-group">
              <label>카테고리</label>
              <select
                value={eventForm.category}
                onChange={(e) =>
                  setEventForm({ ...eventForm, category: Number(e.target.value) })
                }
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>메모</label>
              <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={saveEvent}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {showPeriodModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>생리기간 등록</h2>
            <DatePickButton
              label="시작일 *"
              value={periodForm.startDate}
              onChange={(v) => setPeriodForm({ ...periodForm, startDate: v })}
            />
            <DatePickButton
              label="종료일 *"
              value={periodForm.endDate}
              onChange={(v) => setPeriodForm({ ...periodForm, endDate: v })}
            />
            <div className="form-group">
              <label>메모</label>
              <textarea
                value={periodForm.memo}
                onChange={(e) => setPeriodForm({ ...periodForm, memo: e.target.value })}
                placeholder="증상/컨디션 등을 기록해요"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPeriodModal(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={savePeriodRange}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
