import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { getStorage, setStorage, getDateKey } from '../utils/storage'
import { addYearsToYmd, buildMonthGridDays, formatMonthLabel, formatYmdKey } from '../utils/dateUtils'
import { moodIcons } from '../utils/moodIcons'
import { useDateNavigation } from '../hooks/useDateNavigation'
import {
  getEventsForDate,
  getCategoryColor,
  REPEAT_INTERVALS,
  sortEventsByTime,
  matchesRepeat,
} from '../utils/calendarEvents'
import { getPeriodDateKeys, getPeriodRanges } from '../utils/periodUtils'
import { getTitleFavorites } from '../utils/eventTitleFavorites'
import { getEventCategories } from '../utils/eventCategories'
import {
  EVENT_CATEGORIES_PREVIEW,
  EVENT_FAVORITES_PREVIEW,
  SETTINGS_PREVIEW_DISCARD,
} from '../utils/settingsPreview'
import DatePickButton from '../components/DatePickButton'
import './HomePage.css'

function isFemaleUser() {
  return getStorage('current_user', null)?.gender === 'female'
}

/** 한 주(7칸) 안에서 기간 일정을 가로 한 줄 막대로 묶음 (제목 표시) */
function getWeekRangeTitleSegments(weekCells, allEvents, categories) {
  const segments = []
  for (const e of allEvents) {
    if (e.eventType !== 'range' || !e.date || !e.endDate) continue
    let startCol = -1
    let endCol = -1
    for (let c = 0; c < 7; c++) {
      const cell = weekCells[c]
      const key = formatYmdKey(cell.year, cell.month, cell.day)
      if (key >= e.date && key <= e.endDate) {
        if (startCol === -1) startCol = c
        endCol = c
      }
    }
    if (startCol === -1) continue
    const sk = formatYmdKey(weekCells[startCol].year, weekCells[startCol].month, weekCells[startCol].day)
    const ek = formatYmdKey(weekCells[endCol].year, weekCells[endCol].month, weekCells[endCol].day)
    segments.push({
      id: e.id,
      title: (e.title && String(e.title).trim()) || '일정',
      startCol,
      endCol,
      color: getCategoryColor(categories, e.category),
      globalStart: sk === e.date,
      globalEnd: ek === e.endDate,
    })
  }
  segments.sort((a, b) => a.startCol - b.startCol || a.id - b.id)
  return segments
}

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '')
  if (h.length !== 6) return { r: 148, g: 163, b: 184 }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/** 미리보기 달력 셀 배경·테두리 (카테고리 색) */
function previewCellTint(hex, fill = 0.18, borderA = 0.45) {
  const { r, g, b } = hexToRgb(hex)
  return {
    background: `rgba(${r},${g},${b},${fill})`,
    borderColor: `rgba(${r},${g},${b},${borderA})`,
  }
}

const defaultForm = (dateKey) => ({
  title: '',
  description: '',
  category: 0,
  eventType: 'single',
  date: dateKey,
  endDate: dateKey,
  repeatInterval: '1week',
  repeatUntil: addYearsToYmd(dateKey, 1),
})

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
  const [eventForm, setEventForm] = useState(() => defaultForm(dateKey))
  const [editingContext, setEditingContext] = useState(null)
  const [rangePickViewDate, setRangePickViewDate] = useState(() => new Date())
  const [repeatPreviewViewDate, setRepeatPreviewViewDate] = useState(() => new Date())
  const [showRepeatScopeModal, setShowRepeatScopeModal] = useState(false)
  const rangeSecondClickPendingRef = useRef(false)
  const pendingSaveRef = useRef(null)
  const scheduleDateAnchorRef = useRef(dateKey)

  useEffect(() => {
    setEvents(getStorage('calendar_events', []))
    setPeriodRanges(getPeriodRanges())
  }, [])

  const [favListTick, setFavListTick] = useState(0)
  useEffect(() => {
    const onFav = () => setFavListTick((n) => n + 1)
    window.addEventListener('mylab-event-favorites-changed', onFav)
    return () => window.removeEventListener('mylab-event-favorites-changed', onFav)
  }, [])

  const [categoryTick, setCategoryTick] = useState(0)
  useEffect(() => {
    const onCat = () => setCategoryTick((n) => n + 1)
    window.addEventListener('mylab-event-categories-changed', onCat)
    return () => window.removeEventListener('mylab-event-categories-changed', onCat)
  }, [])

  const [previewCategories, setPreviewCategories] = useState(null)
  const [previewFavorites, setPreviewFavorites] = useState(null)
  useEffect(() => {
    const onCatPrev = (e) => {
      if (e.detail?.list) setPreviewCategories(e.detail.list)
    }
    const onFavPrev = (e) => {
      if (e.detail?.list) setPreviewFavorites(e.detail.list)
    }
    const clearPreview = () => {
      setPreviewCategories(null)
      setPreviewFavorites(null)
    }
    const clearCatPreview = () => setPreviewCategories(null)
    const clearFavPreview = () => setPreviewFavorites(null)
    window.addEventListener(EVENT_CATEGORIES_PREVIEW, onCatPrev)
    window.addEventListener(EVENT_FAVORITES_PREVIEW, onFavPrev)
    window.addEventListener(SETTINGS_PREVIEW_DISCARD, clearPreview)
    window.addEventListener('mylab-event-categories-changed', clearCatPreview)
    window.addEventListener('mylab-event-favorites-changed', clearFavPreview)
    return () => {
      window.removeEventListener(EVENT_CATEGORIES_PREVIEW, onCatPrev)
      window.removeEventListener(EVENT_FAVORITES_PREVIEW, onFavPrev)
      window.removeEventListener(SETTINGS_PREVIEW_DISCARD, clearPreview)
      window.removeEventListener('mylab-event-categories-changed', clearCatPreview)
      window.removeEventListener('mylab-event-favorites-changed', clearFavPreview)
    }
  }, [])

  const eventCategories = useMemo(
    () => previewCategories ?? getEventCategories(),
    [categoryTick, previewCategories],
  )

  const modalTitleFavorites = useMemo(
    () => (showAddModal ? previewFavorites ?? getTitleFavorites() : []),
    [showAddModal, favListTick, previewFavorites],
  )

  useEffect(() => {
    const data = getStorage(`diary_${dateKey}`, { mood: null, questionAnswer: '' })
    setMood(data.mood || null)
    setAnswer(data.questionAnswer || '')
  }, [dateKey])

  const saveDiary = (next) => {
    setStorage(`diary_${dateKey}`, next)
  }

  const persistEvents = (next) => {
    setStorage('calendar_events', next)
    setEvents(next)
  }

  const todayKey = formatYmdKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  const days = useMemo(() => buildMonthGridDays(viewDate.getFullYear(), viewDate.getMonth()), [viewDate])
  const calWeeks = useMemo(() => {
    const w = []
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7))
    }
    return w
  }, [days])
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  const needsRepeatScope = () => editingContext?.kind === 'edit_repeat'

  const validateForm = (form) => {
    if (!form.title?.trim()) return false
    if (form.eventType === 'range') {
      if (!form.date || !form.endDate) return false
      return form.date <= form.endDate
    }
    if (form.eventType === 'repeat') {
      if (!form.date || !form.repeatUntil || form.repeatUntil < form.date) return false
      return REPEAT_INTERVALS.some((r) => r.value === form.repeatInterval)
    }
    return !!form.date
  }

  const buildPayloadFromForm = (form, options = {}) => {
    const base = {
      title: form.title.trim(),
      time: '',
      description: form.description || '',
      category: Number(form.category),
    }
    if (form.eventType === 'single') {
      return { ...base, eventType: 'single', date: form.date }
    }
    if (form.eventType === 'range') {
      return { ...base, eventType: 'range', date: form.date, endDate: form.endDate }
    }
    return {
      ...base,
      eventType: 'repeat',
      date: form.date,
      repeatInterval: form.repeatInterval,
      repeatUntil: form.repeatUntil,
      seriesId: options.seriesId || form.seriesId || `s_${Date.now()}`,
    }
  }

  const doCommit = (form, ctx, repeatScope) => {
    if (!validateForm(form)) return

    if (ctx?.kind === 'new') {
      const payload = buildPayloadFromForm(form)
      payload.id = Date.now()
      if (payload.eventType === 'repeat' && !payload.seriesId) payload.seriesId = `s_${payload.id}`
      persistEvents([...events, payload])
    } else if (ctx?.kind === 'edit_single') {
      const payload = buildPayloadFromForm(form)
      persistEvents(
        events.map((e) => (e.id === ctx.id ? { ...e, ...payload, id: ctx.id } : e)),
      )
    } else if (ctx?.kind === 'edit_repeat' && repeatScope === 'all') {
      const masterId = ctx.masterId
      const master = events.find((e) => e.id === masterId)
      const payload = buildPayloadFromForm(
        { ...form, eventType: 'repeat', date: form.date, repeatInterval: form.repeatInterval },
        { seriesId: master?.seriesId || ctx.seriesId },
      )
      const cleared = events.filter((e) => !(e.eventType === 'repeat_exception' && e.parentEventId === masterId))
      persistEvents(
        cleared.map((e) => {
          if (e.id === masterId) {
            return {
              ...e,
              ...payload,
              id: masterId,
              eventType: 'repeat',
              seriesId: payload.seriesId || e.seriesId || `s_${masterId}`,
            }
          }
          return e
        }),
      )
    } else if (ctx?.kind === 'edit_repeat' && repeatScope === 'only') {
      const masterId = ctx.masterId
      const occ = ctx.occurrenceDate
      const payload = {
        id: ctx.sourceExceptionId || Date.now(),
        eventType: 'repeat_exception',
        parentEventId: masterId,
        occurrenceDate: occ,
        title: form.title.trim(),
        time: '',
        description: form.description || '',
        category: Number(form.category),
      }
      const without = events.filter(
        (e) =>
          !(
            e.eventType === 'repeat_exception' &&
            e.parentEventId === masterId &&
            e.occurrenceDate === occ
          ),
      )
      persistEvents([...without, payload])
    }

    setShowAddModal(false)
    setShowRepeatScopeModal(false)
    setEditingContext(null)
    pendingSaveRef.current = null
    if (panelKey) setPanelOpen(true)
  }

  const trySubmit = () => {
    if (!validateForm(eventForm)) return
    if (needsRepeatScope()) {
      pendingSaveRef.current = { form: { ...eventForm }, ctx: { ...editingContext } }
      setShowRepeatScopeModal(true)
      return
    }
    doCommit(eventForm, editingContext, null)
  }

  const applyRepeatScope = (scope) => {
    const p = pendingSaveRef.current
    if (p) {
      doCommit(p.form, p.ctx, scope)
      return
    }
    doCommit(eventForm, editingContext, scope)
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setEditingContext(null)
    pendingSaveRef.current = null
    rangeSecondClickPendingRef.current = false
  }

  const handleMainModalOverlay = (e) => {
    if (e.target !== e.currentTarget) return
    trySubmit()
  }

  const handleRepeatScopeOverlay = (e) => {
    if (e.target !== e.currentTarget) return
    applyRepeatScope('only')
  }

  const openNewEvent = (key) => {
    scheduleDateAnchorRef.current = key
    setEditingContext({ kind: 'new' })
    setEventForm({ ...defaultForm(key), date: key, endDate: key })
    rangeSecondClickPendingRef.current = false
    const [y, m, d] = key.split('-').map(Number)
    setRangePickViewDate(new Date(y, m - 1, d))
    setRepeatPreviewViewDate(new Date(y, m - 1, d))
    setShowAddModal(true)
  }

  const openEditEvent = (ev) => {
    const cat = typeof ev.category === 'number' ? ev.category : 0
    let anchor = ev.date || panelKey || dateKey
    if (ev._fromException) {
      const master = events.find((x) => x.id === ev.parentEventId)
      anchor = master?.date || ev.occurrenceDate || anchor
    }
    scheduleDateAnchorRef.current = anchor

    if (ev._fromException) {
      const master = events.find((x) => x.id === ev.parentEventId)
      const masterStart = master?.date || ev.occurrenceDate
      setEditingContext({
        kind: 'edit_repeat',
        masterId: ev.parentEventId,
        occurrenceDate: ev.occurrenceDate,
        sourceExceptionId: ev.id,
        seriesId: master?.seriesId,
      })
      setEventForm({
        title: ev.title || '',
        description: ev.description || '',
        category: cat,
        eventType: 'repeat',
        date: masterStart,
        endDate: ev.occurrenceDate,
        repeatInterval: master?.repeatInterval || '1week',
        repeatUntil: master?.repeatUntil || addYearsToYmd(masterStart, 1),
        seriesId: master?.seriesId || '',
      })
    } else if (ev._virtualRepeat) {
      setEditingContext({
        kind: 'edit_repeat',
        masterId: ev.id,
        occurrenceDate: ev._occurrenceDate,
        sourceExceptionId: null,
        seriesId: ev.seriesId,
      })
      setEventForm({
        title: ev.title || '',
        description: ev.description || '',
        category: cat,
        eventType: 'repeat',
        date: ev.date,
        endDate: ev.date,
        repeatInterval: ev.repeatInterval || '1week',
        repeatUntil: ev.repeatUntil || addYearsToYmd(ev.date, 1),
        seriesId: ev.seriesId || '',
      })
    } else {
      setEditingContext({ kind: 'edit_single', id: ev.id })
      setEventForm({
        title: ev.title || '',
        description: ev.description || '',
        category: cat,
        eventType: ev.eventType || 'single',
        date: ev.date,
        endDate: ev.endDate || ev.date,
        repeatInterval: ev.repeatInterval || '1week',
        repeatUntil: ev.repeatUntil || addYearsToYmd(ev.date || panelKey || dateKey, 1),
        seriesId: ev.seriesId || '',
      })
    }
    if ((ev.eventType || 'single') === 'range' && ev.date) {
      const [yy, mm, dd] = ev.date.split('-').map(Number)
      setRangePickViewDate(new Date(yy, mm - 1, dd))
    }
    const repeatPreviewAnchor =
      ev._fromException || ev._virtualRepeat || ev.eventType === 'repeat' ? anchor : null
    if (repeatPreviewAnchor) {
      const [yy, mm, dd] = repeatPreviewAnchor.split('-').map(Number)
      setRepeatPreviewViewDate(new Date(yy, mm - 1, dd))
    }
    rangeSecondClickPendingRef.current = false
    setShowAddModal(true)
  }

  const handleDayClick = (cell) => {
    if (cell.isOtherMonth) {
      setViewDate(new Date(cell.year, cell.month, 1))
      return
    }
    const key = formatYmdKey(cell.year, cell.month, cell.day)
    setCurrentDate(new Date(cell.year, cell.month, cell.day))

    const list = sortEventsByTime(getEventsForDate(events, key))
    setPanelKey(key)
    setPanelOpen(true)
    if (list.length === 0) {
      openNewEvent(key)
    }
  }

  const periodDateKeys = useMemo(
    () => (isFemaleUser() ? getPeriodDateKeys() : []),
    [periodRanges],
  )

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

  const panelEvents = panelKey ? sortEventsByTime(getEventsForDate(events, panelKey)) : []

  const rangePickDays = useMemo(
    () => buildMonthGridDays(rangePickViewDate.getFullYear(), rangePickViewDate.getMonth()),
    [rangePickViewDate],
  )

  const repeatPreviewDays = useMemo(
    () => buildMonthGridDays(repeatPreviewViewDate.getFullYear(), repeatPreviewViewDate.getMonth()),
    [repeatPreviewViewDate],
  )

  const repeatPreviewStub = useMemo(
    () => ({
      eventType: 'repeat',
      date: eventForm.date,
      repeatInterval: eventForm.repeatInterval,
      repeatUntil: eventForm.repeatUntil,
    }),
    [eventForm.date, eventForm.repeatInterval, eventForm.repeatUntil],
  )

  const eventPreviewColor = useMemo(
    () => getCategoryColor(eventCategories, eventForm.category),
    [eventCategories, eventForm.category],
  )

  const switchEventType = (v) => {
    const anchor = scheduleDateAnchorRef.current || panelKey || dateKey
    const [ya, ma, da] = anchor.split('-').map(Number)
    if (v === 'range') {
      rangeSecondClickPendingRef.current = false
      setRangePickViewDate(new Date(ya, ma - 1, da))
      setEventForm((f) => {
        const end =
          f.eventType === 'range' && f.date === anchor && f.endDate >= anchor ? f.endDate : anchor
        return { ...f, eventType: 'range', date: anchor, endDate: end }
      })
      return
    }
    if (v === 'repeat') {
      setRepeatPreviewViewDate(new Date(ya, ma - 1, da))
      setEventForm((f) => {
        const keepUntil =
          f.eventType === 'repeat' &&
          f.date === anchor &&
          f.repeatUntil &&
          f.repeatUntil >= anchor
        return {
          ...f,
          eventType: 'repeat',
          date: anchor,
          endDate: anchor,
          repeatUntil: keepUntil ? f.repeatUntil : addYearsToYmd(anchor, 1),
        }
      })
      return
    }
    setEventForm((f) => ({ ...f, eventType: 'single', date: anchor, endDate: anchor }))
  }

  const handleRangePickCell = (cell) => {
    if (cell.isOtherMonth) {
      setRangePickViewDate(new Date(cell.year, cell.month, 1))
      return
    }
    const key = formatYmdKey(cell.year, cell.month, cell.day)
    const awaiting = rangeSecondClickPendingRef.current
    setEventForm((f) => {
      if (!awaiting) {
        return { ...f, eventType: 'range', date: key, endDate: key }
      }
      const a = f.date || key
      const start = key <= a ? key : a
      const end = key >= a ? key : a
      return { ...f, eventType: 'range', date: start, endDate: end }
    })
    rangeSecondClickPendingRef.current = !awaiting
  }

  const handleRepeatPreviewCell = (cell) => {
    if (cell.isOtherMonth) {
      setRepeatPreviewViewDate(new Date(cell.year, cell.month, 1))
      return
    }
    const key = formatYmdKey(cell.year, cell.month, cell.day)
    setEventForm((f) => {
      const until =
        f.repeatUntil && f.repeatUntil >= key ? f.repeatUntil : addYearsToYmd(key, 1)
      return { ...f, date: key, endDate: key, repeatUntil: until }
    })
    scheduleDateAnchorRef.current = key
  }

  const isRepeatPreviewDay = (cell, key) =>
    !cell.isOtherMonth &&
    eventForm.date &&
    matchesRepeat(repeatPreviewStub, key)

  const modalTitle = () => {
    if (editingContext?.kind === 'new') return `${eventForm.date || panelKey} 일정 등록`
    if (panelKey) return `${panelKey} 일정 수정`
    return '일정'
  }

  return (
    <div className="home">
      <div className="page-route-body">
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
                style={{
                  borderColor: mood?.id === m.id ? m.color : 'var(--border)',
                  ...(mood?.id === m.id ? { '--mood-accent': m.color } : {}),
                }}
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
            placeholder=""
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

        <div className="calendar-grid home__calendarGrid" style={{ marginTop: '0.5rem' }}>
          {weekdays.map((w) => (
            <div key={w} className="calendar-weekday">
              {w}
            </div>
          ))}
          {calWeeks.map((weekCells, wIdx) => (
            <Fragment key={`week-${wIdx}`}>
              {(() => {
                const segs = getWeekRangeTitleSegments(weekCells, events, eventCategories)
                if (segs.length === 0) return null
                return (
                  <div className="home__calWeekLanes">
                    {segs.map((seg) => (
                      <div key={seg.id} className="home__calWeekLaneRow">
                        <div
                          className="home__calRangeTitleBar"
                          style={{
                            gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`,
                            background: `color-mix(in srgb, ${seg.color} 42%, var(--surface))`,
                            borderColor: seg.color,
                            borderTopLeftRadius: seg.globalStart ? 6 : 0,
                            borderBottomLeftRadius: seg.globalStart ? 6 : 0,
                            borderTopRightRadius: seg.globalEnd ? 6 : 0,
                            borderBottomRightRadius: seg.globalEnd ? 6 : 0,
                          }}
                          title={seg.title}
                        >
                          <span className="home__calRangeTitleBar__text">{seg.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
              {weekCells.map((cell, colIdx) => {
                const idx = wIdx * 7 + colIdx
                const key = formatYmdKey(cell.year, cell.month, cell.day)
                const dayEvents = getEventsForDate(events, key)
                const chipEvents = dayEvents.filter((ev) => (ev.eventType || 'single') !== 'range')
                const isToday = key === todayKey
                const isSelected = key === getDateKey(currentDate)
                const isPeriod = periodDateKeys.includes(key)

                return (
                  <button
                    key={`${key}-${idx}`}
                    type="button"
                    className={[
                      'calendar-cell',
                      'home__calCell',
                      colIdx === 6 ? 'home__calCell--rowEnd' : '',
                      wIdx === calWeeks.length - 1 ? 'home__calCell--lastRow' : '',
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
                    <div className="home__eventChips">
                      {chipEvents.slice(0, 2).map((ev) => {
                        const c = getCategoryColor(eventCategories, ev.category)
                        return (
                          <div
                            key={`${ev.id}-${ev._occurrenceDate || ''}`}
                            className="home__eventChip"
                            style={{
                              color: 'var(--text)',
                              background: `${c}26`,
                              border: `1px solid ${c}55`,
                            }}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        )
                      })}
                    </div>
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>

        {isFemaleUser() && (
          <div className="home__hint" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowPeriodModal(true)}>
              생리기간 추가
            </button>
          </div>
        )}
      </section>
      </div>

      {panelOpen && panelKey && (
        <div className="dock-panel">
          <div className="home__panelHead">
            <div style={{ fontWeight: 700 }}>{panelKey} 일정</div>
            <button type="button" className="btn btn-secondary" onClick={() => setPanelOpen(false)}>
              닫기
            </button>
          </div>
          <div className="dock-panel__body">
            {panelEvents.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 0 }} />
            ) : (
              <div className="page-route-body__grow" style={{ marginTop: 0 }}>
                <div style={{ display: 'grid', gap: '0.5rem', minHeight: 0 }}>
                  {panelEvents.map((ev) => (
                    <button
                      key={`${ev.id}-${ev._occurrenceDate || 'x'}`}
                      type="button"
                      className="card home__panelEventBtn"
                      onClick={() => openEditEvent(ev)}
                    >
                      <div className="card-title">{ev.title}</div>
                      {ev.description && <div className="card-content">{ev.description}</div>}
                      <div className="card-meta">
                        {eventCategories.find((c) => c.id === Number(ev.category))?.name || '기타'}
                        {ev.eventType === 'range' && ` · ${ev.date} ~ ${ev.endDate}`}
                        {(ev.eventType === 'repeat' || ev._virtualRepeat) &&
                          ` · 반복 (${REPEAT_INTERVALS.find((r) => r.value === ev.repeatInterval)?.label || ev.repeatInterval})${ev.repeatUntil ? ` · ${ev.repeatUntil}까지` : ''}`}
                        {ev._fromException && ' · 반복(이 날만 수정)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  openNewEvent(panelKey)
                }}
              >
                이 날짜에 일정 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleMainModalOverlay}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '0.75rem' }}>{modalTitle()}</h2>
            <div className="form-group">
              <label>유형</label>
              <div className="home__typeRow">
                {[
                  { v: 'single', l: '당일' },
                  { v: 'range', l: '기간' },
                  { v: 'repeat', l: '반복' },
                ].map((t) => (
                  <button
                    key={t.v}
                    type="button"
                    className={`btn btn-uniform ${eventForm.eventType === t.v ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={editingContext?.kind === 'edit_repeat'}
                    onClick={() => switchEventType(t.v)}
                  >
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>제목 *</label>
              <input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
              {modalTitleFavorites.length > 0 && (
                <div className="home__favRow home__favRow--belowTitle">
                  {modalTitleFavorites.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="home__favChip home__favChip--plain"
                      onClick={() => setEventForm({ ...eventForm, title: t })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {eventForm.eventType === 'single' && (
              <DatePickButton
                label="날짜"
                value={eventForm.date}
                onChange={(v) => {
                  setEventForm((f) => ({ ...f, date: v, endDate: v }))
                  scheduleDateAnchorRef.current = v
                }}
              />
            )}
            {eventForm.eventType === 'range' && (
              <div className="form-group home__rangeEmbed">
                <label>기간</label>
                {eventForm.date && eventForm.endDate && (
                  <div className="home__rangeEmbedSummary">
                    <strong>{eventForm.date}</strong> ~ <strong>{eventForm.endDate}</strong>
                  </div>
                )}
                <div className="home__rangePickHead">
                  <button
                    type="button"
                    className="btn btn-secondary btn-uniform"
                    onClick={() => setRangePickViewDate(new Date(rangePickViewDate.getFullYear(), rangePickViewDate.getMonth() - 1, 1))}
                  >
                    ‹
                  </button>
                  <div className="home__rangePickTitle">{formatMonthLabel(rangePickViewDate)}</div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-uniform"
                    onClick={() => setRangePickViewDate(new Date(rangePickViewDate.getFullYear(), rangePickViewDate.getMonth() + 1, 1))}
                  >
                    ›
                  </button>
                </div>
                <div className="calendar-grid home__calendarGrid home__rangeEmbedGrid">
                  {weekdays.map((w) => (
                    <div key={`emb-${w}`} className="calendar-weekday">
                      {w}
                    </div>
                  ))}
                  {rangePickDays.map((cell, idx) => {
                    const key = formatYmdKey(cell.year, cell.month, cell.day)
                    const inSpan =
                      !cell.isOtherMonth &&
                      eventForm.date &&
                      eventForm.endDate &&
                      key >= eventForm.date &&
                      key <= eventForm.endDate
                    const isRangeAnchor =
                      inSpan && (key === eventForm.date || key === eventForm.endDate)
                    return (
                      <button
                        key={`emb-${key}-${idx}`}
                        type="button"
                        className={['calendar-cell', 'home__calCell', 'home__rangeEmbedCell', cell.isOtherMonth ? 'dim' : '']
                          .filter(Boolean)
                          .join(' ')}
                        style={{
                          ...(inSpan ? previewCellTint(eventPreviewColor) : {}),
                          ...(isRangeAnchor
                            ? { boxShadow: `0 0 0 2px ${eventPreviewColor} inset`, fontWeight: 800 }
                            : {}),
                        }}
                        onClick={() => handleRangePickCell(cell)}
                      >
                        <div style={{ fontWeight: 600 }}>{cell.day}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {eventForm.eventType === 'repeat' && (
              <div className="form-group home__rangeEmbed">
                <label>반복</label>
                <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                  <label>반복 주기</label>
                  <div className="home__typeRow home__typeRow--wrap">
                    {REPEAT_INTERVALS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        className={`btn btn-uniform ${eventForm.repeatInterval === r.value ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setEventForm({ ...eventForm, repeatInterval: r.value })}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <DatePickButton
                  label="반복 종료일"
                  value={eventForm.repeatUntil}
                  onChange={(v) => setEventForm({ ...eventForm, repeatUntil: v })}
                />
                <div className="home__rangePickHead">
                  <button
                    type="button"
                    className="btn btn-secondary btn-uniform"
                    onClick={() =>
                      setRepeatPreviewViewDate(
                        new Date(repeatPreviewViewDate.getFullYear(), repeatPreviewViewDate.getMonth() - 1, 1),
                      )
                    }
                  >
                    ‹
                  </button>
                  <div className="home__rangePickTitle">{formatMonthLabel(repeatPreviewViewDate)}</div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-uniform"
                    onClick={() =>
                      setRepeatPreviewViewDate(
                        new Date(repeatPreviewViewDate.getFullYear(), repeatPreviewViewDate.getMonth() + 1, 1),
                      )
                    }
                  >
                    ›
                  </button>
                </div>
                <div className="calendar-grid home__calendarGrid home__rangeEmbedGrid">
                  {weekdays.map((w) => (
                    <div key={`rpv-${w}`} className="calendar-weekday">
                      {w}
                    </div>
                  ))}
                  {repeatPreviewDays.map((cell, idx) => {
                    const key = formatYmdKey(cell.year, cell.month, cell.day)
                    const hit = isRepeatPreviewDay(cell, key)
                    const isRepAnchor = !cell.isOtherMonth && key === eventForm.date
                    return (
                      <button
                        key={`rpv-${key}-${idx}`}
                        type="button"
                        className={['calendar-cell', 'home__calCell', 'home__repeatPreviewCell', cell.isOtherMonth ? 'dim' : '']
                          .filter(Boolean)
                          .join(' ')}
                        style={{
                          ...(hit ? previewCellTint(eventPreviewColor, 0.2, 0.5) : {}),
                          ...(isRepAnchor
                            ? { boxShadow: `0 0 0 2px ${eventPreviewColor} inset`, fontWeight: 800 }
                            : {}),
                        }}
                        onClick={() => handleRepeatPreviewCell(cell)}
                      >
                        <div style={{ fontWeight: 600 }}>{cell.day}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>카테고리</label>
              <div className="home__catRow">
                {eventCategories.map((c) => {
                  const on = eventForm.category === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="home__catChip"
                      style={{
                        borderColor: on ? c.color : undefined,
                        background: on ? `${c.color}2a` : 'transparent',
                        fontWeight: on ? 700 : 400,
                      }}
                      onClick={() => setEventForm({ ...eventForm, category: c.id })}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="form-group">
              <label>메모</label>
              <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={closeAddModal}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={trySubmit}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {showRepeatScopeModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleRepeatScopeOverlay}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '0.75rem' }}>반복 일정 저장</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => applyRepeatScope('all')}>
                모든 반복 일정 변경
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => applyRepeatScope('only')}>
                이 날짜만 변경
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  pendingSaveRef.current = null
                  setShowRepeatScopeModal(false)
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showPeriodModal && isFemaleUser() && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.75rem' }}>생리기간 등록</h2>
            <DatePickButton label="시작일 *" value={periodForm.startDate} onChange={(v) => setPeriodForm({ ...periodForm, startDate: v })} />
            <DatePickButton label="종료일 *" value={periodForm.endDate} onChange={(v) => setPeriodForm({ ...periodForm, endDate: v })} />
            <div className="form-group">
              <label>메모</label>
              <textarea
                value={periodForm.memo}
                onChange={(e) => setPeriodForm({ ...periodForm, memo: e.target.value })}
                placeholder=""
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
