import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'

const Dermatology = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  
  const [visits, setVisits] = useState({})
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [showModal, setShowModal] = useState(false)
  const [editingWeek, setEditingWeek] = useState(null)
  const [formData, setFormData] = useState({
    week: 1,
    date: '',
    weekday: '',
    treatments: '',
    notes: ''
  })

  // 현재 달의 주차 수 계산
  const getWeeksInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    // 첫 주의 일요일이 0이므로 월요일 기준으로 조정
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1
    
    // 주차 수 계산
    const weeks = Math.ceil((daysInMonth + adjustedStartingDay) / 7)
    return weeks
  }

  // 주차별 시작일과 종료일 계산
  const getWeekRange = (year, month, week) => {
    const firstDay = new Date(year, month, 1)
    const startingDayOfWeek = firstDay.getDay()
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1
    
    const weekStart = (week - 1) * 7 - adjustedStartingDay + 1
    const weekEnd = weekStart + 6
    
    return {
      start: Math.max(1, weekStart),
      end: Math.min(new Date(year, month + 1, 0).getDate(), weekEnd)
    }
  }

  useEffect(() => {
    loadVisits()
  }, [])

  const loadVisits = () => {
    const data = getStorage('dermatology_visits', {})
    setVisits(data)
  }

  const saveVisits = (updatedVisits) => {
    setStorage('dermatology_visits', updatedVisits)
    setVisits(updatedVisits)
  }

  const getMonthKey = () => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
  }

  const openModal = (week = null) => {
    if (week) {
      const monthKey = getMonthKey()
      const weekData = visits[monthKey]?.[week] || null
      setEditingWeek(week)
      if (weekData) {
        setFormData({
          week: week,
          date: weekData.date || '',
          weekday: weekData.weekday || '',
          treatments: weekData.treatments || '',
          notes: weekData.notes || ''
        })
      } else {
        setFormData({
          week: week,
          date: '',
          weekday: '',
          treatments: '',
          notes: ''
        })
      }
    } else {
      setEditingWeek(null)
      setFormData({
        week: 1,
        date: '',
        weekday: '',
        treatments: '',
        notes: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingWeek(null)
    setFormData({
      week: 1,
      date: '',
      weekday: '',
      treatments: '',
      notes: ''
    })
  }

  const saveVisit = () => {
    if (!formData.date) {
      alert(language === 'ko' ? '날짜를 선택해주세요.' : 'Please select a date.')
      return
    }
    
    const monthKey = getMonthKey()
    const week = formData.week
    
    const visit = {
      week: week,
      date: formData.date,
      weekday: formData.weekday,
      treatments: formData.treatments,
      notes: formData.notes
    }
    
    const monthVisits = visits[monthKey] || {}
    const updatedVisits = {
      ...visits,
      [monthKey]: {
        ...monthVisits,
        [week]: visit
      }
    }
    
    saveVisits(updatedVisits)
    closeModal()
  }

  const deleteVisit = (week) => {
    if (window.confirm(language === 'ko' ? '피부과 방문 기록을 삭제하시겠습니까?' : 'Are you sure you want to delete this dermatology visit record?')) {
      const monthKey = getMonthKey()
      const monthVisits = { ...visits[monthKey] }
      delete monthVisits[week]
      
      const updatedVisits = {
        ...visits,
        [monthKey]: monthVisits
      }
      
      saveVisits(updatedVisits)
    }
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const formatMonthYear = () => {
    if (language === 'ko') {
      return `${currentYear}년 ${currentMonth + 1}월`
    } else {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      return `${monthNames[currentMonth]} ${currentYear}`
    }
  }

  const getWeekdays = () => {
    return language === 'ko' 
      ? ['월', '화', '수', '목', '금', '토', '일']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }

  const getWeekdayOptions = () => {
    const weekdays = getWeekdays()
    return weekdays.map((day, index) => ({
      value: index,
      label: day
    }))
  }

  const weeksInMonth = getWeeksInMonth(currentYear, currentMonth)
  const monthKey = getMonthKey()
  const monthVisits = visits[monthKey] || {}

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('dermatology')}</h1>
      </div>

      <div className="date-selector" style={{ marginBottom: '20px', marginTop: '20px' }}>
        <button className="date-btn" onClick={goToPreviousMonth}>
          &lt;
        </button>
        <h2 style={{ color: 'var(--color-secondary)', margin: 0 }}>
          {formatMonthYear()}
        </h2>
        <button className="date-btn" onClick={goToNextMonth}>
          &gt;
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {Array.from({ length: weeksInMonth }, (_, i) => i + 1).map((week) => {
          const weekData = monthVisits[week]
          const weekRange = getWeekRange(currentYear, currentMonth, week)

          return (
            <div key={week} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ color: 'var(--color-secondary)', margin: 0 }}>
                  {language === 'ko' ? `${week}주차` : `Week ${week}`}
                </h2>
                <button
                  className="add-btn"
                  onClick={() => openModal(week)}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  {weekData ? t('edit') : t('add')}
                </button>
              </div>
              
              <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '10px' }}>
                {language === 'ko' 
                  ? `${weekRange.start}일 ~ ${weekRange.end}일`
                  : `${weekRange.start} ~ ${weekRange.end}`
                }
              </div>

              {weekData ? (
                <div className="item-card" style={{ marginBottom: '10px' }}>
                  <div className="item-content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    {weekData.date && (
                      <div style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>
                        {(() => {
                          const date = new Date(weekData.date)
                          const year = date.getFullYear()
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const day = String(date.getDate()).padStart(2, '0')
                          if (language === 'ko') {
                            return `${year}.${month}.${day}${weekData.weekday !== undefined ? ` (${getWeekdays()[weekData.weekday]})` : ''}`
                          } else {
                            return `${year}-${month}-${day}${weekData.weekday !== undefined ? ` (${getWeekdays()[weekData.weekday]})` : ''}`
                          }
                        })()}
                      </div>
                    )}
                    {weekData.treatments && (
                      <div style={{ color: 'var(--color-text)' }}>
                        <strong style={{ color: 'var(--color-secondary)' }}>{language === 'ko' ? '받은 치료' : 'Treatments'}:</strong> {weekData.treatments}
                      </div>
                    )}
                    {weekData.notes && (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        {weekData.notes}
                      </div>
                    )}
                  </div>
                  <div className="item-actions">
                    <button className="action-btn delete-btn" onClick={() => deleteVisit(week)}>
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  {language === 'ko' ? '방문 기록이 없습니다' : 'No visit records'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--color-secondary)', marginBottom: '20px' }}>
              {editingWeek ? (language === 'ko' ? '피부과 방문 기록 수정' : 'Edit Dermatology Visit') : (language === 'ko' ? '피부과 방문 기록 추가' : 'Add Dermatology Visit')}
            </h2>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '주차' : 'Week'}</label>
              <select
                className="form-select"
                value={formData.week}
                onChange={(e) => setFormData({ ...formData, week: parseInt(e.target.value) })}
              >
                {Array.from({ length: weeksInMonth }, (_, i) => i + 1).map((week) => (
                  <option key={week} value={week}>
                    {language === 'ko' ? `${week}주차` : `Week ${week}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '날짜' : 'Date'}</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value)
                  const weekday = selectedDate.getDay()
                  const adjustedWeekday = weekday === 0 ? 6 : weekday - 1
                  setFormData({ ...formData, date: e.target.value, weekday: adjustedWeekday })
                }}
                lang={language}
              />
            </div>
            {formData.date && (
              <div className="form-group">
                <label className="form-label">{language === 'ko' ? '요일' : 'Weekday'}</label>
                <select
                  className="form-select"
                  value={formData.weekday}
                  onChange={(e) => setFormData({ ...formData, weekday: parseInt(e.target.value) })}
                >
                  {getWeekdayOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '받은 치료' : 'Treatments Received'}</label>
              <input
                type="text"
                className="form-input"
                value={formData.treatments}
                onChange={(e) => setFormData({ ...formData, treatments: e.target.value })}
                placeholder={language === 'ko' ? '받은 치료를 입력하세요...' : 'Enter treatments received...'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '메모' : 'Notes'}</label>
              <textarea
                className="form-textarea"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={language === 'ko' ? '메모를 입력하세요...' : 'Enter notes...'}
              />
            </div>
            <div className="form-actions">
              <button className="action-btn" onClick={closeModal}>
                {t('cancel')}
              </button>
              <button className="add-btn" onClick={saveVisit}>
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomMenu />
    </div>
  )
}

export default Dermatology
