import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/storage'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'

const StudyPlan = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [plans, setPlans] = useState([])
  const [newPlan, setNewPlan] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = () => {
    const data = getStorage('study_plans', [])
    setPlans(data)
  }

  const savePlans = (updatedPlans) => {
    setStorage('study_plans', updatedPlans)
    setPlans(updatedPlans)
  }

  const addPlan = () => {
    if (newPlan.trim()) {
      const plan = {
        id: Date.now(),
        text: newPlan.trim(),
        completed: false,
      }
      savePlans([...plans, plan])
      setNewPlan('')
    }
  }

  const togglePlan = (id) => {
    const updated = plans.map((plan) =>
      plan.id === id ? { ...plan, completed: !plan.completed } : plan
    )
    savePlans(updated)
  }

  const deletePlan = (id) => {
    const updated = plans.filter((plan) => plan.id !== id)
    savePlans(updated)
  }

  const updatePlan = (id, text) => {
    const updated = plans.map((plan) =>
      plan.id === id ? { ...plan, text } : plan
    )
    savePlans(updated)
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newPlans = [...plans]
    const draggedItem = newPlans[draggedIndex]
    newPlans.splice(draggedIndex, 1)
    newPlans.splice(index, 0, draggedItem)
    setDraggedIndex(index)
    setPlans(newPlans)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      savePlans(plans)
    }
    setDraggedIndex(null)
  }

  const completedCount = plans.filter((p) => p.completed).length
  const totalCount = plans.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('studyPlan')}</h1>
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
          <div style={{ color: 'white', marginTop: '8px', fontSize: '14px' }}>
            {completedCount} / {totalCount} {t('completed')}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          className="form-input"
          type="text"
          placeholder={t('studyPlanPlaceholder')}
          value={newPlan}
          onChange={(e) => setNewPlan(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addPlan()}
          style={{ flex: 1 }}
        />
        <button className="add-btn" onClick={addPlan}>
          {t('add')}
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state">{t('noStudyPlans')}</div>
      ) : (
        <div className="item-list">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
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
                checked={plan.completed}
                onChange={() => togglePlan(plan.id)}
              />
              <input
                type="text"
                className="item-input"
                value={plan.text}
                onChange={(e) => updatePlan(plan.id, e.target.value)}
                onBlur={() => savePlans(plans)}
                style={{
                  textDecoration: plan.completed ? 'line-through' : 'none',
                  opacity: plan.completed ? 0.6 : 1,
                }}
              />
              <button
                className="action-btn delete-btn"
                onClick={() => deletePlan(plan.id)}
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

export default StudyPlan
