import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import './TopMenu.css'

const TopMenu = () => {
  const { language, toggleLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const themes = [
    { id: 'midnight', name: t('midnight') },
    { id: 'white', name: t('white') },
    { id: 'black', name: t('black') },
    { id: 'sky', name: t('sky') },
    { id: 'cotton', name: t('cotton') },
    { id: 'blossom', name: t('blossom') },
  ]

  return (
    <div className="top-menu" ref={menuRef}>
      <button
        className="top-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('settings')}
      >
        <span className="top-menu-icon">⚙️</span>
      </button>

      {isOpen && (
        <div className="top-menu-dropdown">
          <div className="top-menu-section">
            <div className="top-menu-section-title">{t('language')}</div>
            <div className="top-menu-options">
              <button
                className={`top-menu-option ${language === 'ko' ? 'active' : ''}`}
                onClick={() => {
                  if (language !== 'ko') toggleLanguage()
                  setIsOpen(false)
                }}
              >
                {t('korean')}
              </button>
              <button
                className={`top-menu-option ${language === 'en' ? 'active' : ''}`}
                onClick={() => {
                  if (language !== 'en') toggleLanguage()
                  setIsOpen(false)
                }}
              >
                {t('english')}
              </button>
            </div>
          </div>

          <div className="top-menu-section">
            <div className="top-menu-section-title">{t('theme')}</div>
            <div className="top-menu-themes">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.id}
                  className={`top-menu-theme-option ${theme === themeOption.id ? 'active' : ''}`}
                  onClick={() => {
                    setTheme(themeOption.id)
                    setIsOpen(false)
                  }}
                >
                  {themeOption.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TopMenu
