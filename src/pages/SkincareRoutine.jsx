import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'

const SkincareRoutine = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  
  const weekdays = language === 'ko' 
    ? ['월', '화', '수', '목', '금', '토', '일']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const [routines, setRoutines] = useState({})
  const [routineTemplates, setRoutineTemplates] = useState([])
  const [newRoutine, setNewRoutine] = useState('')
  const [selectedDay, setSelectedDay] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(null)
  const [templateFormData, setTemplateFormData] = useState({
    title: '',
    items: ['']
  })

  useEffect(() => {
    loadRoutines()
    loadTemplates()
  }, [])

  const loadRoutines = () => {
    const data = getStorage('skincare_routines', {})
    setRoutines(data)
  }

  const loadTemplates = () => {
    const data = getStorage('skincare_routine_templates', [])
    setRoutineTemplates(data)
  }

  const saveRoutines = (updatedRoutines) => {
    setStorage('skincare_routines', updatedRoutines)
    setRoutines(updatedRoutines)
  }

  const saveTemplates = (updatedTemplates) => {
    setStorage('skincare_routine_templates', updatedTemplates)
    setRoutineTemplates(updatedTemplates)
  }

  const addRoutine = (day) => {
    if (newRoutine.trim()) {
      const routine = {
        id: Date.now(),
        text: newRoutine.trim(),
        completed: false,
      }
      const dayRoutines = routines[day] || []
      saveRoutines({ ...routines, [day]: [...dayRoutines, routine] })
      setNewRoutine('')
      setSelectedDay(null)
    }
  }

  const toggleRoutine = (day, id) => {
    const dayRoutines = (routines[day] || []).map((routine) =>
      routine.id === id ? { ...routine, completed: !routine.completed } : routine
    )
    saveRoutines({ ...routines, [day]: dayRoutines })
  }

  const deleteRoutine = (day, id) => {
    const dayRoutines = (routines[day] || []).filter((routine) => routine.id !== id)
    saveRoutines({ ...routines, [day]: dayRoutines })
  }

  const updateRoutine = (day, id, text) => {
    const dayRoutines = (routines[day] || []).map((routine) =>
      routine.id === id ? { ...routine, text } : routine
    )
    saveRoutines({ ...routines, [day]: dayRoutines })
  }

  const handleDragStart = (day, index) => {
    setDraggedIndex({ day, index })
  }

  const handleDragOver = (e, day, index) => {
    e.preventDefault()
    if (!draggedIndex || draggedIndex.day !== day || draggedIndex.index === index) return

    const dayRoutines = [...(routines[day] || [])]
    const draggedItem = dayRoutines[draggedIndex.index]
    dayRoutines.splice(draggedIndex.index, 1)
    dayRoutines.splice(index, 0, draggedItem)
    setDraggedIndex({ day, index })
    saveRoutines({ ...routines, [day]: dayRoutines })
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const openTemplateModal = () => {
    setTemplateFormData({
      title: '',
      items: ['']
    })
    setShowTemplateModal(true)
  }

  const closeTemplateModal = () => {
    setShowTemplateModal(false)
    setTemplateFormData({
      title: '',
      items: ['']
    })
  }

  const addTemplateItem = () => {
    setTemplateFormData({
      ...templateFormData,
      items: [...templateFormData.items, '']
    })
  }

  const updateTemplateItem = (index, value) => {
    const newItems = [...templateFormData.items]
    newItems[index] = value
    setTemplateFormData({
      ...templateFormData,
      items: newItems
    })
  }

  const removeTemplateItem = (index) => {
    const newItems = templateFormData.items.filter((_, i) => i !== index)
    setTemplateFormData({
      ...templateFormData,
      items: newItems
    })
  }

  const saveTemplate = () => {
    if (!templateFormData.title.trim()) {
      alert(language === 'ko' ? '루틴 제목을 입력해주세요.' : 'Please enter a routine title.')
      return
    }
    
    const validItems = templateFormData.items.filter(item => item.trim())
    if (validItems.length === 0) {
      alert(language === 'ko' ? '최소 하나의 항목을 입력해주세요.' : 'Please enter at least one item.')
      return
    }

    const template = {
      id: Date.now(),
      title: templateFormData.title.trim(),
      items: validItems.map(item => item.trim())
    }

    saveTemplates([...routineTemplates, template])
    closeTemplateModal()
  }

  const deleteTemplate = (id) => {
    if (window.confirm(language === 'ko' ? '루틴 템플릿을 삭제하시겠습니까?' : 'Are you sure you want to delete this routine template?')) {
      saveTemplates(routineTemplates.filter(t => t.id !== id))
    }
  }

  const loadTemplateToDay = (day, template) => {
    const dayRoutines = routines[day] || []
    const newRoutines = template.items.map((item, index) => ({
      id: Date.now() + index,
      text: item,
      completed: false
    }))
    
    saveRoutines({
      ...routines,
      [day]: [...dayRoutines, ...newRoutines]
    })
    
    setShowLoadTemplateModal(null)
  }

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('skincareRoutine')}</h1>
        <button className="add-btn" onClick={openTemplateModal} style={{ padding: '8px 16px', fontSize: '14px' }}>
          {language === 'ko' ? '루틴 추가' : 'Add Routine'}
        </button>
      </div>

      {selectedDay && (
        <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <div style={{ color: 'var(--color-secondary)', marginBottom: '10px' }}>
            {selectedDay}{language === 'ko' ? '요일' : 'day'} {language === 'ko' ? '루틴 추가' : 'Routine Add'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              className="form-input"
              type="text"
              placeholder={t('skincarePlaceholder')}
              value={newRoutine}
              onChange={(e) => setNewRoutine(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRoutine(selectedDay)}
              style={{ flex: 1 }}
            />
            <button className="add-btn" onClick={() => addRoutine(selectedDay)}>
              {t('add')}
            </button>
            <button className="action-btn" onClick={() => setSelectedDay(null)}>
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '10px' }}>
        {weekdays.map((day) => {
          const dayRoutines = routines[day] || []
          const completedCount = dayRoutines.filter((r) => r.completed).length
          const totalCount = dayRoutines.length

          return (
            <div key={day} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ color: 'var(--color-secondary)', margin: 0 }}>{day}{language === 'ko' ? '요일' : 'day'}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="action-btn"
                    onClick={() => setShowLoadTemplateModal(day)}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    {language === 'ko' ? '루틴 불러오기' : 'Load Routine'}
                  </button>
                  <button
                    className="add-btn"
                    onClick={() => setSelectedDay(day)}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    + {t('add')}
                  </button>
                </div>
              </div>
              {totalCount > 0 && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '10px' }}>
                  {completedCount} / {totalCount} {language === 'ko' ? '완료' : 'Completed'}
                </div>
              )}
              {dayRoutines.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  {language === 'ko' ? '루틴이 없습니다' : 'No routines'}
                </div>
              ) : (
                <div className="item-list">
                  {dayRoutines.map((routine, index) => (
                    <div
                      key={routine.id}
                      className="item-card"
                      draggable
                      onDragStart={() => handleDragStart(day, index)}
                      onDragOver={(e) => handleDragOver(e, day, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <span className="drag-handle">☰</span>
                      <input
                        type="checkbox"
                        className="item-checkbox"
                        checked={routine.completed}
                        onChange={() => toggleRoutine(day, routine.id)}
                      />
                      <input
                        type="text"
                        className="item-input"
                        value={routine.text}
                        onChange={(e) => updateRoutine(day, routine.id, e.target.value)}
                        onBlur={() => saveRoutines(routines)}
                        style={{
                          textDecoration: routine.completed ? 'line-through' : 'none',
                          opacity: routine.completed ? 0.6 : 1,
                        }}
                      />
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteRoutine(day, routine.id)}
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 루틴 템플릿 추가 모달 */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={closeTemplateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--color-secondary)', marginBottom: '20px' }}>
              {language === 'ko' ? '루틴 추가' : 'Add Routine Template'}
            </h2>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '루틴 제목' : 'Routine Title'}</label>
              <input
                type="text"
                className="form-input"
                value={templateFormData.title}
                onChange={(e) => setTemplateFormData({ ...templateFormData, title: e.target.value })}
                placeholder={language === 'ko' ? '예: 진정루틴' : 'e.g., Soothing Routine'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '항목들' : 'Items'}</label>
              {templateFormData.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={item}
                    onChange={(e) => updateTemplateItem(index, e.target.value)}
                    placeholder={language === 'ko' ? '항목을 입력하세요...' : 'Enter item...'}
                    style={{ flex: 1 }}
                  />
                  {templateFormData.items.length > 1 && (
                    <button
                      className="action-btn delete-btn"
                      onClick={() => removeTemplateItem(index)}
                      style={{ padding: '8px 12px' }}
                    >
                      {t('delete')}
                    </button>
                  )}
                </div>
              ))}
              <button className="action-btn" onClick={addTemplateItem} style={{ marginTop: '10px' }}>
                {language === 'ko' ? '항목 추가' : 'Add Item'}
              </button>
            </div>
            <div className="form-actions">
              <button className="action-btn" onClick={closeTemplateModal}>
                {t('cancel')}
              </button>
              <button className="add-btn" onClick={saveTemplate}>
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 루틴 불러오기 모달 */}
      {showLoadTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowLoadTemplateModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--color-secondary)', marginBottom: '20px' }}>
              {language === 'ko' ? '루틴 불러오기' : 'Load Routine'}
            </h2>
            {routineTemplates.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
                {language === 'ko' ? '저장된 루틴이 없습니다.' : 'No saved routines.'}
              </div>
            ) : (
              <div className="item-list">
                {routineTemplates.map((template) => (
                  <div key={template.id} className="item-card">
                    <div className="item-content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>
                        {template.title}
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        {template.items.join(', ')}
                      </div>
                    </div>
                    <div className="item-actions">
                      <button
                        className="add-btn"
                        onClick={() => loadTemplateToDay(showLoadTemplateModal, template)}
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        {language === 'ko' ? '불러오기' : 'Load'}
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteTemplate(template.id)}
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button className="action-btn" onClick={() => setShowLoadTemplateModal(null)}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomMenu />
    </div>
  )
}

export default SkincareRoutine
