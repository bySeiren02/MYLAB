import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useClickOutside } from '../hooks/useClickOutside'
import { getMenuCategories } from '../utils/menuCategories'
import './BottomMenu.css'

export default function BottomMenu() {
  const location = useLocation()
  const [open, setOpen] = useState(null)
  const [categories, setCategories] = useState(() => getMenuCategories())
  const ref = useClickOutside(open !== null, () => setOpen(null))
  useEffect(() => {
    const nav = ref.current
    if (!nav) return undefined

    const setBottomNavHeight = () => {
      document.documentElement.style.setProperty('--bottom-nav-height', `${nav.offsetHeight}px`)
    }

    setBottomNavHeight()
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(setBottomNavHeight) : null
    resizeObserver?.observe(nav)
    window.addEventListener('resize', setBottomNavHeight)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', setBottomNavHeight)
      document.documentElement.style.removeProperty('--bottom-nav-height')
    }
  }, [ref])

  useEffect(() => {
    const sync = () => setCategories(getMenuCategories())
    window.addEventListener('mylab-menu-categories-changed', sync)
    return () => window.removeEventListener('mylab-menu-categories-changed', sync)
  }, [])

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
