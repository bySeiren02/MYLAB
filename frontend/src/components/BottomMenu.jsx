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
      { to: '/daily-todo', label: '투두리스트' },
      { to: '/monthly-goal', label: '월 목표' },
      { to: '/yearly-goal', label: '연 목표' },
    ],
  },
  {
    id: 'body',
    label: '몸',
    icon: '💪',
    items: [
      { to: '/diet', label: '식단/운동/러닝' },
      { to: '/period', label: '생리' },
    ],
  },
  {
    id: 'care',
    label: '관리',
    icon: '✨',
    items: [
      { to: '/supplements', label: '영양제' },
      { to: '/skincare', label: '피부관리' },
      { to: '/procedure', label: '시술' },
      { to: '/dermatology', label: '피부과' },
    ],
  },
  {
    id: 'grow',
    label: '성장',
    icon: '📚',
    items: [
      { to: '/study-plan', label: '공부' },
      { to: '/reading', label: '독서' },
    ],
  },
  {
    id: 'culture_log',
    label: '감상 기록',
    icon: '🎭',
    items: [
      { to: '/movie-drama', label: '시청·공연' },
      { to: '/cultural', label: '전시·나들이' },
      { to: '/fiction', label: '소설·웹툰' },
    ],
  },
  {
    id: 'date',
    label: '데이트',
    icon: '💖',
    directTo: '/date',
    items: [{ to: '/date', label: '데이트 캘린더' }],
  },
  {
    id: 'daily',
    label: '일',
    icon: '🗒️',
    items: [
      { to: '/ledger', label: '가계부' },
      { to: '/side-hustle', label: '부업' },
    ],
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
