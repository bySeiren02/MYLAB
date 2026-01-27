import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage, getDateKey } from '../utils/storage'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'
import './Diet.css'

const Diet = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const mealTypes = language === 'ko' 
    ? ['아침', '점심', '저녁', '간식']
    : ['Breakfast', 'Lunch', 'Dinner', 'Snack']
  const exerciseTypes = language === 'ko'
    ? ['유산소', '근력', '기타']
    : ['Cardio', 'Strength', 'Other']
  const [weight, setWeight] = useState('')
  const [meals, setMeals] = useState([])
  const [exercises, setExercises] = useState([])
  const [showMealModal, setShowMealModal] = useState(false)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [editingMeal, setEditingMeal] = useState(null)
  const [editingExercise, setEditingExercise] = useState(null)
  const [mealForm, setMealForm] = useState({ type: mealTypes[0], name: '', calories: '' })
  const [exerciseForm, setExerciseForm] = useState({ type: exerciseTypes[0], name: '', calories: '', duration: '' })

  useEffect(() => {
    loadData()
  }, [currentDate])

  const loadData = () => {
    const dateKey = getDateKey(currentDate)
    const data = getStorage(`diet_${dateKey}`, {
      weight: '',
      meals: [],
      exercises: [],
    })
    setWeight(data.weight || '')
    setMeals(data.meals || [])
    setExercises(data.exercises || [])
  }

  const saveData = () => {
    const dateKey = getDateKey(currentDate)
    setStorage(`diet_${dateKey}`, {
      weight,
      meals,
      exercises,
    })
  }

  useEffect(() => {
    saveData()
  }, [weight, meals, exercises])

  const addMeal = () => {
    if (mealForm.name && mealForm.calories) {
      const meal = {
        id: Date.now(),
        ...mealForm,
        calories: parseInt(mealForm.calories),
      }
      if (editingMeal) {
        setMeals(meals.map((m) => (m.id === editingMeal.id ? meal : m)))
        setEditingMeal(null)
      } else {
        setMeals([...meals, meal])
      }
      setMealForm({ type: mealTypes[0], name: '', calories: '' })
      setShowMealModal(false)
    }
  }

  const deleteMeal = (id) => {
    setMeals(meals.filter((m) => m.id !== id))
  }

  const openMealEdit = (meal) => {
    setEditingMeal(meal)
    setMealForm({ type: meal.type, name: meal.name, calories: meal.calories.toString() })
    setShowMealModal(true)
  }

  const addExercise = () => {
    if (exerciseForm.name && exerciseForm.calories) {
      const exercise = {
        id: Date.now(),
        ...exerciseForm,
        calories: parseInt(exerciseForm.calories),
        duration: exerciseForm.duration || '',
      }
      if (editingExercise) {
        setExercises(exercises.map((e) => (e.id === editingExercise.id ? exercise : e)))
        setEditingExercise(null)
      } else {
        setExercises([...exercises, exercise])
      }
      setExerciseForm({ type: exerciseTypes[0], name: '', calories: '', duration: '' })
      setShowExerciseModal(false)
    }
  }

  const deleteExercise = (id) => {
    setExercises(exercises.filter((e) => e.id !== id))
  }

  const openExerciseEdit = (exercise) => {
    setEditingExercise(exercise)
    setExerciseForm({
      type: exercise.type,
      name: exercise.name,
      calories: exercise.calories.toString(),
      duration: exercise.duration || '',
    })
    setShowExerciseModal(true)
  }

  const totalMealCalories = meals.reduce((sum, m) => sum + m.calories, 0)
  const totalExerciseCalories = exercises.reduce((sum, e) => sum + e.calories, 0)
  const netCalories = totalMealCalories - totalExerciseCalories

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

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('diet')}</h1>
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

      <div className="diet-summary">
        <div className="summary-item">
          <label className="form-label">{t('weightLabel')} (kg)</label>
          <input
            type="number"
            className="form-input"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={t('weightPlaceholder')}
            style={{ width: '150px' }}
          />
        </div>
        <div className="summary-item">
          <div style={{ color: 'var(--color-secondary)' }}>{t('intakeCalories')}</div>
          <div style={{ fontSize: '24px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
            {totalMealCalories} kcal
          </div>
        </div>
        <div className="summary-item">
          <div style={{ color: 'var(--color-secondary)' }}>{t('burnCalories')}</div>
          <div style={{ fontSize: '24px', color: '#98FB98', fontWeight: 'bold' }}>
            {totalExerciseCalories} kcal
          </div>
        </div>
        <div className="summary-item">
          <div style={{ color: 'var(--color-secondary)' }}>{t('netCalories')}</div>
          <div
            style={{
              fontSize: '24px',
              color: netCalories > 0 ? '#FF6347' : '#87CEEB',
              fontWeight: 'bold',
            }}
          >
            {netCalories} kcal
          </div>
        </div>
      </div>

      <div className="diet-section">
        <div className="section-header">
          <h2 style={{ color: 'var(--color-secondary)' }}>{t('todayMeals')}</h2>
          <button
            className="add-btn"
            onClick={() => {
              setMealForm({ type: mealTypes[0], name: '', calories: '' })
              setEditingMeal(null)
              setShowMealModal(true)
            }}
          >
            {t('add')}
          </button>
        </div>
        {meals.length === 0 ? (
          <div className="empty-state">{t('noMeals')}</div>
        ) : (
          <div className="item-list">
            {meals.map((meal) => (
              <div key={meal.id} className="item-card">
                <div className="item-content">
                  <span style={{ color: 'var(--color-secondary)', minWidth: '60px' }}>{meal.type}</span>
                  <span className="item-text">{meal.name}</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                    {meal.calories} kcal
                  </span>
                </div>
                <div className="item-actions">
                  <button className="action-btn" onClick={() => openMealEdit(meal)}>
                    {t('edit')}
                  </button>
                  <button className="action-btn delete-btn" onClick={() => deleteMeal(meal.id)}>
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="diet-section">
        <div className="section-header">
          <h2 style={{ color: 'var(--color-secondary)' }}>{t('todayExercises')}</h2>
          <button
            className="add-btn"
            onClick={() => {
              setExerciseForm({ type: exerciseTypes[0], name: '', calories: '', duration: '' })
              setEditingExercise(null)
              setShowExerciseModal(true)
            }}
          >
            {t('add')}
          </button>
        </div>
        {exercises.length === 0 ? (
          <div className="empty-state">{t('noExercises')}</div>
        ) : (
          <div className="item-list">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="item-card">
                <div className="item-content">
                  <span style={{ color: 'var(--color-secondary)', minWidth: '60px' }}>{exercise.type}</span>
                  <span className="item-text">{exercise.name}</span>
                  {exercise.duration && (
                    <span style={{ color: '#87CEEB' }}>{exercise.duration} {t('minutes')}</span>
                  )}
                  <span style={{ color: '#98FB98', fontWeight: 'bold' }}>
                    -{exercise.calories} kcal
                  </span>
                </div>
                <div className="item-actions">
                  <button className="action-btn" onClick={() => openExerciseEdit(exercise)}>
                    {t('edit')}
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteExercise(exercise.id)}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showMealModal && (
        <div className="modal-overlay" onClick={() => setShowMealModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--color-secondary)', marginBottom: '20px' }}>
              {editingMeal ? t('editMeal') : t('addMeal')}
            </h2>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '식사 종류' : 'Meal Type'}</label>
              <select
                className="form-select"
                value={mealForm.type}
                onChange={(e) => setMealForm({ ...mealForm, type: e.target.value })}
              >
                {mealTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '음식명' : 'Food Name'}</label>
              <input
                type="text"
                className="form-input"
                value={mealForm.name}
                onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '칼로리 (kcal)' : 'Calories (kcal)'}</label>
              <input
                type="number"
                className="form-input"
                value={mealForm.calories}
                onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button className="action-btn" onClick={() => setShowMealModal(false)}>
                {t('cancel')}
              </button>
              <button className="add-btn" onClick={addMeal}>
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExerciseModal && (
        <div className="modal-overlay" onClick={() => setShowExerciseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--color-secondary)', marginBottom: '20px' }}>
              {editingExercise ? t('editExercise') : t('addExercise')}
            </h2>
            <div className="form-group">
              <label className="form-label">{t('exerciseType')}</label>
              <select
                className="form-select"
                value={exerciseForm.type}
                onChange={(e) => setExerciseForm({ ...exerciseForm, type: e.target.value })}
              >
                {exerciseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('exerciseName')}</label>
              <input
                type="text"
                className="form-input"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{language === 'ko' ? '소모 칼로리 (kcal)' : 'Burn Calories (kcal)'}</label>
              <input
                type="number"
                className="form-input"
                value={exerciseForm.calories}
                onChange={(e) => setExerciseForm({ ...exerciseForm, calories: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('exerciseDuration')}</label>
              <input
                type="number"
                className="form-input"
                value={exerciseForm.duration}
                onChange={(e) => setExerciseForm({ ...exerciseForm, duration: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button className="action-btn" onClick={() => setShowExerciseModal(false)}>
                {t('cancel')}
              </button>
              <button className="add-btn" onClick={addExercise}>
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

export default Diet
