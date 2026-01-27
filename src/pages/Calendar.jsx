import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'
import './Calendar.css'

const Calendar = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  
  const categories = language === 'ko'
    ? [
        { id: 0, name: '업무', color: '#FF6B6B' },
        { id: 1, name: '개인', color: '#4ECDC4' },
        { id: 2, name: '운동', color: '#45B7D1' },
        { id: 3, name: '공부', color: '#FFA07A' },
        { id: 4, name: '약속', color: '#98D8C8' },
        { id: 5, name: '기타', color: '#F7DC6F' },
      ]
    : [
        { id: 0, name: 'Work', color: '#FF6B6B' },
        { id: 1, name: 'Personal', color: '#4ECDC4' },
        { id: 2, name: 'Exercise', color: '#45B7D1' },
        { id: 3, name: 'Study', color: '#FFA07A' },
        { id: 4, name: 'Appointment', color: '#98D8C8' },
        { id: 5, name: 'Other', color: '#F7DC6F' },
      ]

  const eventTypes = language === 'ko'
    ? [
        { id: 'single', name: '당일' },
        { id: 'range', name: '기간' },
        { id: 'repeat', name: '반복' },
      ]
    : [
        { id: 'single', name: 'Single Day' },
        { id: 'range', name: 'Range' },
        { id: 'repeat', name: 'Repeat' },
      ]

  const repeatIntervals = language === 'ko'
    ? [
        { id: '1week', name: '1주' },
        { id: '2week', name: '2주' },
        { id: '1month', name: '한달' },
        { id: '6month', name: '6개월' },
        { id: '1year', name: '1년' },
      ]
    : [
        { id: '1week', name: '1 Week' },
        { id: '2week', name: '2 Weeks' },
        { id: '1month', name: '1 Month' },
        { id: '6month', name: '6 Months' },
        { id: '1year', name: '1 Year' },
      ]
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editMode, setEditMode] = useState(null) // 'all', 'this', 'future'
  const [formData, setFormData] = useState({
    title: '',
    eventType: 'single',
    date: '',
    endDate: '',
    time: '',
    category: categories[0].id,
    description: '',
    repeatInterval: '1week',
    repeatCalendar: 'solar', // 'solar' or 'lunar'
    order: 0,
  })

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = () => {
    const data = getStorage('calendar_events', [])
    setEvents(data)
  }

  const saveEvents = (updatedEvents) => {
    setStorage('calendar_events', updatedEvents)
    setEvents(updatedEvents)
  }

  // 날짜에 해당하는 모든 일정 가져오기 (당일, 기간, 반복 포함)
  const getEventsForDate = (date) => {
    const dateStr = date
    const dateObj = new Date(dateStr + 'T00:00:00')
    
    return events.filter((event) => {
      if (event.eventType === 'single') {
        return event.date === dateStr
      } else if (event.eventType === 'range') {
        return event.date <= dateStr && event.endDate >= dateStr
      } else if (event.eventType === 'repeat') {
        // 반복 일정 처리 (간단한 버전, 실제로는 더 복잡한 로직 필요)
        const startDate = new Date(event.date + 'T00:00:00')
        const diffTime = dateObj - startDate
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays < 0) return false
        
        if (event.repeatInterval === '1week') {
          return diffDays % 7 === 0
        } else if (event.repeatInterval === '2week') {
          return diffDays % 14 === 0
        } else if (event.repeatInterval === '1month') {
          return dateObj.getDate() === startDate.getDate()
        } else if (event.repeatInterval === '6month') {
          const monthDiff = (dateObj.getFullYear() - startDate.getFullYear()) * 12 + 
                           (dateObj.getMonth() - startDate.getMonth())
          return monthDiff >= 0 && monthDiff % 6 === 0 && dateObj.getDate() === startDate.getDate()
        } else if (event.repeatInterval === '1year') {
          return dateObj.getMonth() === startDate.getMonth() && 
                 dateObj.getDate() === startDate.getDate()
        }
      }
      return false
    })
  }

  // 일정 정렬 (시간순, 시간 없으면 맨 아래)
  const sortEvents = (events) => {
    return [...events].sort((a, b) => {
      if (a.time && b.time) {
        return a.time.localeCompare(b.time)
      } else if (a.time && !b.time) {
        return -1
      } else if (!a.time && b.time) {
        return 1
      } else {
        return (a.order || 0) - (b.order || 0)
      }
    })
  }

  const openModal = (event = null, date = null) => {
    if (event) {
      setEditingEvent(event)
      setFormData({
        title: event.title,
        eventType: event.eventType || 'single',
        date: event.date,
        endDate: event.endDate || '',
        time: event.time || '',
        category: event.category,
        description: event.description || '',
        repeatInterval: event.repeatInterval || '1week',
        repeatCalendar: event.repeatCalendar || 'solar',
        order: event.order || 0,
      })
    } else {
      setEditingEvent(null)
      const today = date || new Date().toISOString().split('T')[0]
      setFormData({
        title: '',
        eventType: 'single',
        date: today,
        endDate: '',
        time: '',
        category: categories[0].id,
        description: '',
        repeatInterval: '1week',
        repeatCalendar: 'solar',
        order: 0,
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingEvent(null)
    setEditMode(null)
  }

  const saveEvent = () => {
    if (!formData.title || !formData.date) return

    if (editingEvent) {
      if (editMode === 'all') {
        // 전체 일정 변경
        const updated = events.map((e) => {
          if (e.id === editingEvent.id || (e.parentId && e.parentId === editingEvent.id)) {
            return { ...e, ...formData }
          }
          return e
        })
        saveEvents(updated)
      } else if (editMode === 'this') {
        // 해당 일정만 변경 (새 일정 생성)
        const newEvent = {
          id: Date.now(),
          ...formData,
          parentId: editingEvent.id,
          date: formData.date,
        }
        saveEvents([...events, newEvent])
      } else if (editMode === 'future') {
        // 해당 날짜 포함 앞으로 변경
        const updated = events.map((e) => {
          if (e.id === editingEvent.id || (e.parentId && e.parentId === editingEvent.id)) {
            const eventDate = new Date(e.date + 'T00:00:00')
            const editDate = new Date(formData.date + 'T00:00:00')
            if (eventDate >= editDate) {
              return { ...e, ...formData }
            }
          }
          return e
        })
        saveEvents(updated)
      } else {
        // 일반 수정
        const updated = events.map((e) =>
          e.id === editingEvent.id ? { ...editingEvent, ...formData } : e
        )
        saveEvents(updated)
      }
    } else {
      const newEvent = {
        id: Date.now(),
        ...formData,
        order: events.filter((e) => e.date === formData.date).length,
      }
      saveEvents([...events, newEvent])
    }
    closeModal()
    setSelectedDate(null)
  }

  const deleteEvent = (id) => {
    if (window.confirm(language === 'ko' ? '일정을 삭제하시겠습니까?' : 'Are you sure you want to delete this event?')) {
      const updated = events.filter((e) => e.id !== id && e.parentId !== id)
      saveEvents(updated)
    }
  }

  const updateEventOrder = (eventId, newOrder) => {
    const updated = events.map((e) => {
      if (e.id === eventId) {
        return { ...e, order: newOrder }
      }
      return e
    })
    saveEvents(updated)
  }

  const handleDateClick = (dateKey) => {
    setSelectedDate(dateKey)
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const endingDayOfWeek = lastDay.getDay()

    // 이전 달의 마지막 날짜들
    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    
    const days = []
    
    // 첫날이 월요일이면 빈 공간이 없으므로 이전 달 날짜 추가 안 함
    // 그 외의 경우: 이전 달의 마지막 날짜들 추가
    if (startingDayOfWeek === 0) {
      // 일요일이면 이전 달 날짜 추가 안 함 (빈 공간 없음)
    } else if (startingDayOfWeek !== 1) {
      // 월요일이 아닌 다른 요일이면 이전 달의 마지막 날짜들 추가
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        days.push({
          day: prevMonthDays - i,
          month: month - 1,
          year: month === 0 ? year - 1 : year,
          isOtherMonth: true,
        })
      }
    }
    // startingDayOfWeek === 1 (월요일)이면 아무것도 추가하지 않음
    
    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isOtherMonth: false,
      })
    }
    
    // 마지막날이 일요일이면 빈 공간이 없으므로 다음 달 날짜 추가 안 함
    // 그 외의 경우: 항상 6주(42일)로 채우기
    if (endingDayOfWeek !== 0) {
      const totalCells = days.length
      const targetWeeks = 6 // 6주 고정
      const remainingCells = (targetWeeks * 7) - totalCells
      
      if (remainingCells > 0) {
        for (let i = 1; i <= remainingCells; i++) {
          days.push({
            day: i,
            month: month + 1,
            year: month === 11 ? year + 1 : year,
            isOtherMonth: true,
          })
        }
      }
    }
    
    return days
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const formatDate = (date) => {
    if (language === 'ko') {
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
    } else {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    }
  }

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    const weekdays = language === 'ko' 
      ? ['일', '월', '화', '수', '목', '금', '토']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} (${weekdays[date.getDay()]})`
  }

  const days = getDaysInMonth(currentDate)
  const weekdays = language === 'ko' 
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const selectedDateEvents = selectedDate ? sortEvents(getEventsForDate(selectedDate)) : []

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('calendar')}</h1>
      </div>

      <div className="calendar-header">
        <button className="date-btn" onClick={goToPreviousMonth}>
          &lt;
        </button>
        <h2 className="calendar-month">{formatDate(currentDate)}</h2>
        <button className="date-btn" onClick={goToNextMonth}>
          &gt;
        </button>
      </div>

      <div className="calendar-grid">
        {weekdays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {days.map((dayObj, index) => {
          const dateKey = formatDateKey(dayObj.year, dayObj.month, dayObj.day)
          const dayEvents = getEventsForDate(dateKey)
          const isToday = dateKey === new Date().toISOString().split('T')[0]

          return (
            <div
              key={`${dayObj.year}-${dayObj.month}-${dayObj.day}-${index}`}
              className={`calendar-day ${dayObj.isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${selectedDate === dateKey ? 'selected' : ''}`}
              onClick={() => {
                if (dayObj.isOtherMonth) {
                  // 다른 달 클릭 시 해당 달로 이동
                  setCurrentDate(new Date(dayObj.year, dayObj.month, 1))
                } else {
                  handleDateClick(dateKey)
                }
              }}
            >
              <div className="calendar-day-number">{dayObj.day}</div>
              <div className="calendar-events-bar">
                {dayEvents.map((event) => {
                  const category = categories.find((c) => c.id === event.category)
                  return (
                    <div
                      key={event.id}
                      className="calendar-event-bar"
                      style={{ backgroundColor: category?.color }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal(event)
                      }}
                      title={event.title}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDate && (
        <div className="selected-date-events">
          <div className="selected-date-header">
            <h3 style={{ color: '#FFB6C1', margin: 0 }}>
              {formatDateDisplay(selectedDate)}
            </h3>
            <button
              className="action-btn"
              onClick={() => setSelectedDate(null)}
              style={{ padding: '6px 12px', fontSize: '14px' }}
            >
              {language === 'ko' ? '닫기' : 'Close'}
            </button>
          </div>
          {selectedDateEvents.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              {language === 'ko' ? '일정이 없습니다' : 'No events'}
            </div>
          ) : (
            <div className="event-list">
              {selectedDateEvents.map((event, index) => {
                const category = categories.find((c) => c.id === event.category)
                return (
                  <div
                    key={event.id}
                    className="event-item"
                    style={{ borderLeft: `4px solid ${category?.color}` }}
                  >
                    <div className="event-content">
                      <div className="event-title">{event.title}</div>
                      {event.time && (
                        <div className="event-time">{event.time}</div>
                      )}
                      {event.description && (
                        <div className="event-description">{event.description}</div>
                      )}
                      <div className="event-meta">
                        <span style={{ color: category?.color }}>{category?.name}</span>
                        {event.eventType === 'range' && (
                          <span style={{ color: '#FFB6C1', marginLeft: '10px' }}>
                            ~ {event.endDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="event-actions">
                      <button
                        className="action-btn"
                        onClick={() => openModal(event)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        {language === 'ko' ? '수정' : 'Edit'}
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteEvent(event.id)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        {language === 'ko' ? '삭제' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <button
            className="add-btn"
            onClick={() => openModal(null, selectedDate)}
            style={{ width: '100%', marginTop: '15px' }}
          >
            {language === 'ko' ? '일정 추가' : 'Add Event'}
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#FFB6C1', marginBottom: '20px' }}>
              {editingEvent ? (language === 'ko' ? '일정 수정' : 'Edit Event') : (language === 'ko' ? '일정 추가' : 'Add Event')}
            </h2>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '제목 *' : 'Title *'}</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '일정 타입' : 'Event Type'}</label>
              <select
                className="form-select"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              >
                {eventTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '시작 날짜 *' : 'Start Date *'}</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                lang={language}
              />
            </div>
            {formData.eventType === 'range' && (
              <div className="form-group">
                <label className="form-label">{language === 'ko' ? '종료 날짜 *' : 'End Date *'}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  lang={language}
                />
              </div>
            )}
            {formData.eventType === 'repeat' && (
              <>
                <div className="form-group">
                  <label className="form-label">{language === 'ko' ? '반복 주기' : 'Repeat Interval'}</label>
                  <select
                    className="form-select"
                    value={formData.repeatInterval}
                    onChange={(e) =>
                      setFormData({ ...formData, repeatInterval: e.target.value })
                    }
                  >
                    {repeatIntervals.map((interval) => (
                      <option key={interval.id} value={interval.id}>
                        {interval.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{language === 'ko' ? '달력' : 'Calendar'}</label>
                  <select
                    className="form-select"
                    value={formData.repeatCalendar}
                    onChange={(e) =>
                      setFormData({ ...formData, repeatCalendar: e.target.value })
                    }
                  >
                    <option value="solar">{language === 'ko' ? '양력' : 'Solar'}</option>
                    <option value="lunar">{language === 'ko' ? '음력' : 'Lunar'}</option>
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '시간' : 'Time'}</label>
              <input
                type="time"
                className="form-input"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '카테고리' : 'Category'}</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: parseInt(e.target.value) })
                }
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '설명' : 'Description'}</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            {editingEvent && editingEvent.eventType === 'repeat' && (
              <div className="form-group">
                <label className="form-label">{language === 'ko' ? '수정 범위' : 'Edit Range'}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className={`action-btn ${editMode === 'all' ? 'active' : ''}`}
                    onClick={() => setEditMode('all')}
                  >
                    {language === 'ko' ? '전체 변경' : 'All'}
                  </button>
                  <button
                    className={`action-btn ${editMode === 'this' ? 'active' : ''}`}
                    onClick={() => setEditMode('this')}
                  >
                    {language === 'ko' ? '해당 일정만' : 'This Only'}
                  </button>
                  <button
                    className={`action-btn ${editMode === 'future' ? 'active' : ''}`}
                    onClick={() => setEditMode('future')}
                  >
                    {language === 'ko' ? '앞으로 변경' : 'Future'}
                  </button>
                </div>
              </div>
            )}
            <div className="form-actions">
              <button className="action-btn" onClick={closeModal}>
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button className="add-btn" onClick={saveEvent}>
                {language === 'ko' ? '저장' : 'Save'}
              </button>
              {editingEvent && (
                <button
                  className="action-btn delete-btn"
                  onClick={() => {
                    deleteEvent(editingEvent.id)
                    closeModal()
                  }}
                >
                  {language === 'ko' ? '삭제' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <BottomMenu />
    </div>
  )
}

export default Calendar
