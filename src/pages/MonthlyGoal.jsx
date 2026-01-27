import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'
import { icons } from '../utils/icons'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'

const MonthlyGoal = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [goals, setGoals] = useState([])
  const [newGoal, setNewGoal] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)

  useEffect(() => {
    loadGoals()
  }, [currentMonth])

  const loadGoals = () => {
    const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
    const data = getStorage(`monthly_goals_${monthKey}`, [])
    setGoals(data)
  }

  const saveGoals = (updatedGoals) => {
    const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
    setStorage(`monthly_goals_${monthKey}`, updatedGoals)
    setGoals(updatedGoals)
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      const goal = {
        id: Date.now(),
        text: newGoal.trim(),
        icon: selectedIcon || '',
        completed: false,
      }
      saveGoals([...goals, goal])
      setNewGoal('')
      setSelectedIcon('')
      setShowIconPicker(false)
    }
  }

  const toggleGoal = (id) => {
    const updated = goals.map((goal) =>
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    )
    saveGoals(updated)
  }

  const deleteGoal = (id) => {
    const updated = goals.filter((goal) => goal.id !== id)
    saveGoals(updated)
  }

  const updateGoal = (id, text) => {
    const updated = goals.map((goal) =>
      goal.id === id ? { ...goal, text } : goal
    )
    saveGoals(updated)
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newGoals = [...goals]
    const draggedItem = newGoals[draggedIndex]
    newGoals.splice(draggedIndex, 1)
    newGoals.splice(index, 0, draggedItem)
    setDraggedIndex(index)
    setGoals(newGoals)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      saveGoals(goals)
    }
    setDraggedIndex(null)
  }

  const formatMonth = (date) => {
    if (language === 'ko') {
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
    } else {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const completedCount = goals.filter((g) => g.completed).length
  const totalCount = goals.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('monthlyGoal')}</h1>
      </div>

      <div className="date-selector" style={{ marginBottom: '20px' }}>
        <button className="date-btn" onClick={goToPreviousMonth}>
          &lt;
        </button>
        <div className="date-display">{formatMonth(currentMonth)}</div>
        <button className="date-btn" onClick={goToNextMonth}>
          &gt;
        </button>
      </div>

      {totalCount > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <div style={{ color: 'var(--color-secondary)', marginBottom: '8px' }}>{t('progress')}</div>
          <div style={{ background: 'var(--input-bg)', borderRadius: '10px', height: '20px', overflow: 'hidden' }}>
            <div
              style={{
                background: 'var(--color-primary)',
                height: '100%',
                width: `${progress}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div style={{ color: 'var(--color-text)', marginTop: '8px', fontSize: '14px' }}>
            {completedCount} / {totalCount} {t('completed')}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            className="action-btn"
            onClick={() => setShowIconPicker(!showIconPicker)}
            style={{ minWidth: '50px', padding: '10px' }}
          >
          </button>
          <input
            className="form-input"
            type="text"
            placeholder={t('goalPlaceholder')}
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            style={{ flex: 1 }}
          />
          <button className="add-btn" onClick={addGoal}>
            {t('add')}
          </button>
        </div>
        {showIconPicker && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '8px',
            padding: '15px',
            background: 'var(--input-bg)',
            borderRadius: '10px',
            maxHeight: '200px',
            overflowY: 'auto',
            marginBottom: '10px'
          }}>
            {icons.map((icon, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedIcon(icon)
                  setShowIconPicker(false)
                }}
                style={{
                  background: selectedIcon === icon ? 'var(--card-bg)' : 'transparent',
                  border: `1px solid ${selectedIcon === icon ? 'var(--color-primary)' : 'var(--card-border)'}`,
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">{t('noGoals')}</div>
      ) : (
        <div className="item-list">
          {goals.map((goal, index) => (
            <div
              key={goal.id}
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
                checked={goal.completed}
                onChange={() => toggleGoal(goal.id)}
              />
              {goal.icon && (
                <span style={{ fontSize: '20px', minWidth: '30px', textAlign: 'center' }}>
                  {goal.icon}
                </span>
              )}
              <input
                type="text"
                className="item-input"
                value={goal.text}
                onChange={(e) => updateGoal(goal.id, e.target.value)}
                onBlur={() => saveGoals(goals)}
                style={{
                  textDecoration: goal.completed ? 'line-through' : 'none',
                  opacity: goal.completed ? 0.6 : 1,
                }}
              />
              <button
                className="action-btn delete-btn"
                onClick={() => deleteGoal(goal.id)}
              >
                {t('delete')}
              </button>
            </div>
          ))}
        </div>
      )}
      <BottomMenu />
    </div>
  )
}

export default MonthlyGoal
