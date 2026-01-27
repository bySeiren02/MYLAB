import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import './BottomMenu.css'

const BottomMenu = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const [openCategory, setOpenCategory] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenCategory(null)
      }
    }

    if (openCategory) {
      // 다음 프레임에서 이벤트 리스너 추가 (현재 클릭 이벤트가 먼저 처리되도록)
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.addEventListener('mousedown', handleClickOutside)
          document.addEventListener('touchstart', handleClickOutside)
        }, 0)
      })
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [openCategory])

  const categories = [
    {
      id: 'plan',
      name: t('plan'),
      icon: '📋',
      items: [
        { id: 'todo', name: t('todoList'), path: '/daily-todo', icon: '✓' },
        { id: 'monthly', name: t('monthlyGoals'), path: '/monthly-goal', icon: '📊' },
        { id: 'yearly', name: t('yearlyGoals'), path: '/yearly-goal', icon: '🎯' },
      ]
    },
    {
      id: 'body',
      name: t('body'),
      icon: '💪',
      items: [
        { id: 'meal', name: t('mealPlanExercise'), path: '/diet', icon: '🍽️' },
        { id: 'running', name: t('running'), path: '/running', icon: '👟' },
      ]
    },
    {
      id: 'care',
      name: t('care'),
      icon: '✨',
      items: [
        { id: 'supplements', name: t('supplements'), path: '/supplements', icon: '💊' },
        { id: 'skincare', name: t('selfBeauty'), path: '/skincare', icon: '💅' },
        { id: 'dermatology', name: t('dermatology'), path: '/dermatology', icon: '✨' },
      ]
    },
    {
      id: 'grow',
      name: t('grow'),
      icon: '📚',
      items: [
        { id: 'reading', name: t('reading'), path: '/reading', icon: '📚' },
        { id: 'study', name: t('study'), path: '/study-plan', icon: '📝' },
        { id: 'cultural', name: t('culturalLife'), path: '/cultural', icon: '🎭' },
      ]
    },
  ]

  const handleCategoryClick = (e, categoryId) => {
    e.stopPropagation()
    if (openCategory === categoryId) {
      setOpenCategory(null)
    } else {
      setOpenCategory(categoryId)
    }
  }

  const handleItemClick = (e, path) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    navigate(path)
    setOpenCategory(null)
  }

  const isActiveCategory = (category) => {
    return category.items.some(item => location.pathname === item.path)
  }

  return (
    <div className="bottom-menu" ref={menuRef}>
      <button
        className={`bottom-menu-item ${location.pathname === '/' ? 'active' : ''}`}
        onClick={(e) => handleItemClick(e, '/')}
      >
        <span className="bottom-menu-icon">🏠</span>
        <span className="bottom-menu-label">{t('home')}</span>
      </button>
      
      {categories.map((category) => (
        <div key={category.id} className="bottom-menu-category">
          <button
            className={`bottom-menu-item ${isActiveCategory(category) ? 'active' : ''} ${openCategory === category.id ? 'open' : ''}`}
            onClick={(e) => handleCategoryClick(e, category.id)}
          >
            <span className="bottom-menu-icon">{category.icon}</span>
            <span className="bottom-menu-label">{category.name}</span>
          </button>
          
          {openCategory === category.id && (
            <div 
              className="bottom-menu-dropdown" 
              onClick={(e) => e.stopPropagation()}
            >
              {category.items.map((item) => (
                <button
                  key={item.id}
                  className={`bottom-menu-dropdown-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={(e) => handleItemClick(e, item.path)}
                >
                  <span className="bottom-menu-dropdown-icon">{item.icon}</span>
                  <span className="bottom-menu-dropdown-label">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default BottomMenu
