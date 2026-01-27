import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage, getDateKey } from '../utils/storage'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'

const Supplements = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [supplements, setSupplements] = useState([])
  const [newSupplement, setNewSupplement] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showRoutineModal, setShowRoutineModal] = useState(false)
  const [routines, setRoutines] = useState([])
  const [newRoutine, setNewRoutine] = useState('')

  useEffect(() => {
    loadRoutines()
    loadSupplements()
  }, [currentDate])

  const loadRoutines = () => {
    const data = getStorage('supplements_routines', [])
    setRoutines(data)
  }

  const saveRoutines = (updatedRoutines) => {
    setStorage('supplements_routines', updatedRoutines)
    setRoutines(updatedRoutines)
  }

  const loadSupplements = () => {
    const dateKey = getDateKey(currentDate)
    const savedSupplements = getStorage(`supplements_${dateKey}`, [])
    
    // 고정 루틴에서 오늘 날짜에 추가되지 않은 항목들을 찾아서 추가
    const routineSupplements = routines
      .filter((routine) => {
        // 이미 추가된 고정 루틴인지 확인
        return !savedSupplements.some((supplement) => supplement.routineId === routine.id)
      })
      .map((routine) => ({
        id: Date.now() + Math.random(),
        name: routine.name,
        taken: false,
        isRoutine: true,
        routineId: routine.id,
      }))
    
    // 기존 영양제와 고정 루틴을 합침
    const allSupplements = [...savedSupplements, ...routineSupplements]
    setSupplements(allSupplements)
  }

  const saveSupplements = (updatedSupplements) => {
    const dateKey = getDateKey(currentDate)
    setStorage(`supplements_${dateKey}`, updatedSupplements)
    setSupplements(updatedSupplements)
  }

  const addSupplement = () => {
    if (newSupplement.trim()) {
      const supplement = {
        id: Date.now(),
        name: newSupplement.trim(),
        taken: false,
        isRoutine: false,
      }
      saveSupplements([...supplements, supplement])
      setNewSupplement('')
    }
  }

  const addRoutine = () => {
    if (newRoutine.trim()) {
      const routine = {
        id: Date.now(),
        name: newRoutine.trim(),
      }
      saveRoutines([...routines, routine])
      setNewRoutine('')
      setShowRoutineModal(false)
      // 오늘 날짜에 즉시 추가
      const routineSupplement = {
        id: Date.now() + Math.random(),
        name: routine.name,
        taken: false,
        isRoutine: true,
        routineId: routine.id,
      }
      saveSupplements([...supplements, routineSupplement])
    }
  }

  const deleteRoutine = (id) => {
    const updated = routines.filter((r) => r.id !== id)
    saveRoutines(updated)
  }

  const toggleSupplement = (id) => {
    const updated = supplements.map((supplement) =>
      supplement.id === id ? { ...supplement, taken: !supplement.taken } : supplement
    )
    saveSupplements(updated)
  }

  const deleteSupplement = (id) => {
    const supplement = supplements.find((s) => s.id === id)
    if (supplement?.isRoutine) {
      // 고정 루틴인 경우, 해당 날짜에서만 제거 (고정 루틴 목록은 유지)
      const updated = supplements.filter((supplement) => supplement.id !== id)
      saveSupplements(updated)
    } else {
      const updated = supplements.filter((supplement) => supplement.id !== id)
      saveSupplements(updated)
    }
  }

  const updateSupplement = (id, name) => {
    const updated = supplements.map((supplement) => {
      if (supplement.id === id) {
        if (supplement.isRoutine) {
          // 고정 루틴인 경우, 해당 날짜의 영양제만 수정 (고정 루틴 목록은 유지)
          return { ...supplement, name }
        } else {
          return { ...supplement, name }
        }
      }
      return supplement
    })
    saveSupplements(updated)
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newSupplements = [...supplements]
    const draggedItem = newSupplements[draggedIndex]
    newSupplements.splice(draggedIndex, 1)
    newSupplements.splice(index, 0, draggedItem)
    setDraggedIndex(index)
    setSupplements(newSupplements)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      saveSupplements(supplements)
    }
    setDraggedIndex(null)
  }

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  }

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const takenCount = supplements.filter((s) => s.taken).length
  const totalCount = supplements.length

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('supplementsPage')}</h1>
        <button className="add-btn" onClick={() => setShowRoutineModal(true)}>
          {t('routineManagement')}
        </button>
      </div>

      <div className="date-selector" style={{ marginBottom: '20px' }}>
        <button className="date-btn" onClick={goToPreviousDay}>
          &lt;
        </button>
        <div className="date-display">{formatDate(currentDate)}</div>
        <button className="date-btn" onClick={goToNextDay}>
          &gt;
        </button>
      </div>

      {totalCount > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255, 182, 193, 0.1)', borderRadius: '10px' }}>
          <div style={{ color: 'white', fontSize: '14px' }}>
            복용: {takenCount} / {totalCount}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          className="form-input"
          type="text"
          placeholder={t('supplementPlaceholder')}
          value={newSupplement}
          onChange={(e) => setNewSupplement(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addSupplement()}
          style={{ flex: 1 }}
        />
        <button className="add-btn" onClick={addSupplement}>
          {t('add')}
        </button>
      </div>

      {supplements.length === 0 ? (
        <div className="empty-state">{t('noSupplements')}</div>
      ) : (
        <div className="item-list">
          {supplements.map((supplement, index) => (
            <div
              key={supplement.id}
              className="item-card"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <span className="drag-handle">☰</span>
              <input
                type="checkbox"
                className="item-checkbox"
                checked={supplement.taken}
                onChange={() => toggleSupplement(supplement.id)}
              />
              <input
                type="text"
                className="item-input"
                value={supplement.name}
                onChange={(e) => updateSupplement(supplement.id, e.target.value)}
                onBlur={() => saveSupplements(supplements)}
                style={{
                  textDecoration: supplement.taken ? 'line-through' : 'none',
                  opacity: supplement.taken ? 0.6 : 1,
                }}
              />
              <button
                className="action-btn delete-btn"
                onClick={() => deleteSupplement(supplement.id)}
              >
                {t('delete')}
              </button>
            </div>
          ))}
        </div>
      )}

      {showRoutineModal && (
        <div className="modal-overlay" onClick={() => setShowRoutineModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--color-secondary)', marginBottom: '20px' }}>{t('routineManagement')}</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                className="form-input"
                type="text"
                placeholder={t('routineManagement')}
                value={newRoutine}
                onChange={(e) => setNewRoutine(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRoutine()}
                style={{ flex: 1 }}
              />
              <button className="add-btn" onClick={addRoutine}>
                {t('add')}
              </button>
            </div>
            {routines.length > 0 && (
              <div className="item-list">
                {routines.map((routine) => (
                  <div key={routine.id} className="item-card">
                    <span className="item-text">{routine.name}</span>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deleteRoutine(routine.id)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="form-actions">
              <button className="action-btn" onClick={() => setShowRoutineModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomMenu />
    </div>
  )
}

export default Supplements
