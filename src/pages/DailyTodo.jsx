import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage, getDateKey } from '../utils/storage'
import { icons } from '../utils/icons'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'

const DailyTodo = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showRoutineModal, setShowRoutineModal] = useState(false)
  const [routines, setRoutines] = useState([])
  const [newRoutine, setNewRoutine] = useState('')
  const [selectedRoutineIcon, setSelectedRoutineIcon] = useState('')
  const [showRoutineIconPicker, setShowRoutineIconPicker] = useState(false)

  useEffect(() => {
    loadRoutines()
    loadTodos()
  }, [currentDate])

  const loadRoutines = () => {
    const data = getStorage('daily_todo_routines', [])
    setRoutines(data)
  }

  const saveRoutines = (updatedRoutines) => {
    setStorage('daily_todo_routines', updatedRoutines)
    setRoutines(updatedRoutines)
  }

  const loadTodos = () => {
    const dateKey = getDateKey(currentDate)
    const savedTodos = getStorage(`daily_todo_${dateKey}`, [])
    
    // 고정 루틴에서 오늘 날짜에 추가되지 않은 항목들을 찾아서 추가
    const routineTodos = routines
      .filter((routine) => {
        // 이미 추가된 고정 루틴인지 확인
        return !savedTodos.some((todo) => todo.routineId === routine.id)
      })
      .map((routine) => ({
        id: Date.now() + Math.random(),
        text: routine.text,
        icon: routine.icon || '',
        completed: false,
        isRoutine: true,
        routineId: routine.id,
      }))
    
    // 기존 투두와 고정 루틴을 합침
    const allTodos = [...savedTodos, ...routineTodos]
    setTodos(allTodos)
  }

  const saveTodos = (updatedTodos) => {
    const dateKey = getDateKey(currentDate)
    // 고정 루틴 정보를 포함하여 저장
    setStorage(`daily_todo_${dateKey}`, updatedTodos)
    setTodos(updatedTodos)
  }

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo = {
        id: Date.now(),
        text: newTodo.trim(),
        icon: selectedIcon || '',
        completed: false,
        isRoutine: false,
      }
      saveTodos([...todos, todo])
      setNewTodo('')
      setSelectedIcon('')
      setShowIconPicker(false)
    }
  }

  const addRoutine = () => {
    if (newRoutine.trim()) {
      const routine = {
        id: Date.now(),
        text: newRoutine.trim(),
        icon: selectedRoutineIcon || '',
      }
      saveRoutines([...routines, routine])
      setNewRoutine('')
      setSelectedRoutineIcon('')
      setShowRoutineIconPicker(false)
      setShowRoutineModal(false)
      // 오늘 날짜에 즉시 추가
      const routineTodo = {
        id: Date.now() + Math.random(),
        text: routine.text,
        icon: routine.icon || '',
        completed: false,
        isRoutine: true,
        routineId: routine.id,
      }
      saveTodos([...todos, routineTodo])
    }
  }

  const deleteRoutine = (id) => {
    const updated = routines.filter((r) => r.id !== id)
    saveRoutines(updated)
  }

  const toggleTodo = (id) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
    saveTodos(updated)
  }

  const deleteTodo = (id) => {
    const todo = todos.find((t) => t.id === id)
    if (todo?.isRoutine) {
      // 고정 루틴인 경우, 해당 날짜에서만 제거 (고정 루틴 목록은 유지)
      const updated = todos.filter((todo) => todo.id !== id)
      saveTodos(updated)
    } else {
      const updated = todos.filter((todo) => todo.id !== id)
      saveTodos(updated)
    }
  }

  const updateTodo = (id, text) => {
    const updated = todos.map((todo) => {
      if (todo.id === id) {
        if (todo.isRoutine) {
          // 고정 루틴인 경우, 해당 날짜의 투두만 수정 (고정 루틴 목록은 유지)
          return { ...todo, text }
        } else {
          return { ...todo, text }
        }
      }
      return todo
    })
    saveTodos(updated)
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newTodos = [...todos]
    const draggedItem = newTodos[draggedIndex]
    newTodos.splice(draggedIndex, 1)
    newTodos.splice(index, 0, draggedItem)
    setDraggedIndex(index)
    setTodos(newTodos)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      saveTodos(todos)
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

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('dailyTodo')}</h1>
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

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            className="action-btn"
            onClick={() => setShowIconPicker(!showIconPicker)}
            style={{ minWidth: '50px', padding: '10px' }}
          >
            {selectedIcon || '✓'} {t('icon')}
          </button>
          <input
            className="form-input"
            type="text"
            placeholder={t('todoPlaceholder')}
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            style={{ flex: 1 }}
          />
          <button className="add-btn" onClick={addTodo}>
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

      {todos.length === 0 ? (
        <div className="empty-state">{t('noTodos')}</div>
      ) : (
        <div className="item-list">
          {todos.map((todo, index) => (
            <div
              key={todo.id}
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
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              {todo.icon && (
                <span style={{ fontSize: '20px', minWidth: '30px', textAlign: 'center' }}>
                  {todo.icon}
                </span>
              )}
              <input
                type="text"
                className="item-input"
                value={todo.text}
                onChange={(e) => updateTodo(todo.id, e.target.value)}
                onBlur={() => saveTodos(todos)}
                style={{
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  opacity: todo.completed ? 0.6 : 1,
                }}
              />
              <button
                className="action-btn delete-btn"
                onClick={() => deleteTodo(todo.id)}
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
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button
                  className="action-btn"
                  onClick={() => setShowRoutineIconPicker(!showRoutineIconPicker)}
                  style={{ minWidth: '50px', padding: '10px' }}
                >
                  {selectedRoutineIcon || '🔄'} {t('icon')}
                </button>
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
              {showRoutineIconPicker && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: '8px',
                  padding: '15px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '10px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginBottom: '10px'
                }}>
                  {icons.map((icon, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedRoutineIcon(icon)
                        setShowRoutineIconPicker(false)
                      }}
                      style={{
                        background: selectedRoutineIcon === icon ? 'rgba(255, 105, 180, 0.3)' : 'transparent',
                        border: `1px solid ${selectedRoutineIcon === icon ? '#FF69B4' : 'rgba(255, 182, 193, 0.3)'}`,
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
            {routines.length > 0 && (
              <div className="item-list">
                {routines.map((routine) => (
                  <div key={routine.id} className="item-card">
                    {routine.icon && (
                      <span style={{ fontSize: '20px', minWidth: '30px', textAlign: 'center' }}>
                        {routine.icon}
                      </span>
                    )}
                    <span className="item-text">{routine.text}</span>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deleteRoutine(routine.id)}
                    >
                      {t('delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="form-actions">
              <button className="action-btn" onClick={() => setShowRoutineModal(false)}>
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomMenu />
    </div>
  )
}

export default DailyTodo
