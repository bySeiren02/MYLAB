import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useClickOutside } from '../hooks/useClickOutside'
import './BottomMenu.css'

const categories = [
  {
    id: 'plan',
    label: '계획',
    icon: '📋',
    items: [
      { to: '/monthly-goal', label: '월 목표' },
      { to: '/yearly-goal', label: '연 목표' },
    ],
  },
  {
    id: 'body',
    label: '몸',
    icon: '💪',
    directTo: '/diet',
    items: [{ to: '/diet', label: '식단/운동/러닝' }],
  },
  {
    id: 'care',
    label: '관리',
    icon: '✨',
    items: [
      { to: '/supplements', label: '영양제' },
      { to: '/skincare', label: '피부관리' },
      { to: '/dermatology', label: '피부과' },
    ],
  },
  {
    id: 'grow',
    label: '성장',
    icon: '📚',
    items: [
      { to: '/reading', label: '독서' },
      { to: '/study-plan', label: '공부' },
      { to: '/movie-drama', label: '영화&드라마' },
      { to: '/cultural', label: '문화생활' },
    ],
  },
  {
    id: 'date',
    label: '데이트',
    icon: '💖',
    directTo: '/date',
    items: [{ to: '/date', label: '데이트 캘린더' }],
  },
]

export default function BottomMenu() {
  const location = useLocation()
  const [open, setOpen] = useState(null)
  const ref = useClickOutside(open !== null, () => setOpen(null))

  const isActiveCategory = (cat) => cat.items.some((i) => location.pathname === i.to)

  return (
    <nav className="bottom-nav" ref={ref}>
      <NavLink to="/" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`} end>
        <span className="bottom-nav__icon">🏠</span>
        <span className="bottom-nav__label">홈</span>
      </NavLink>

      {categories.map((cat) => (
        <div key={cat.id} className="bottom-nav__cat">
          {cat.directTo ? (
            <NavLink
              to={cat.directTo}
              className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(null)}
            >
              <span className="bottom-nav__icon">{cat.icon}</span>
              <span className="bottom-nav__label">{cat.label}</span>
            </NavLink>
          ) : (
            <>
              <button
                type="button"
                className={`bottom-nav__item ${isActiveCategory(cat) ? 'active' : ''} ${open === cat.id ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen((v) => (v === cat.id ? null : cat.id))
                }}
              >
                <span className="bottom-nav__icon">{cat.icon}</span>
                <span className="bottom-nav__label">{cat.label}</span>
              </button>
              {open === cat.id && (
                <div className="bottom-nav__dropdown" role="menu">
                  {cat.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `bottom-nav__dd ${isActive ? 'active' : ''}`}
                      onClick={() => setOpen(null)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  )
}
