import { createContext, useContext, useState, useEffect } from 'react'
import { getStorage, setStorage } from '../utils/storage'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = getStorage('theme', 'midnight')
    return saved
  })

  useEffect(() => {
    setStorage('theme', theme)
    applyTheme(theme)
  }, [theme])

  const applyTheme = (themeName) => {
    const themes = {
      midnight: {
        '--bg-primary': '#0a0e27',
        '--bg-secondary': 'rgba(10, 14, 39, 0.95)',
        '--color-primary': '#FF69B4',
        '--color-secondary': '#FFB6C1',
        '--color-text': '#ffffff',
        '--color-text-muted': 'rgba(255, 182, 193, 0.6)',
        '--border-color': 'rgba(255, 105, 180, 0.3)',
        '--card-bg': 'rgba(255, 182, 193, 0.1)',
        '--card-border': 'rgba(255, 182, 193, 0.3)',
        '--button-text': '#ffffff',
        '--input-bg': 'rgba(0, 0, 0, 0.3)',
      },
      white: {
        '--bg-primary': '#F5F5F5',
        '--bg-secondary': 'rgba(255, 255, 255, 0.95)',
        '--color-primary': '#6B6B6B',
        '--color-secondary': '#9E9E9E',
        '--color-text': '#212121',
        '--color-text-muted': 'rgba(33, 33, 33, 0.6)',
        '--border-color': 'rgba(107, 107, 107, 0.3)',
        '--card-bg': 'rgba(107, 107, 107, 0.08)',
        '--card-border': 'rgba(107, 107, 107, 0.2)',
        '--button-text': '#ffffff',
        '--input-bg': 'rgba(255, 255, 255, 0.8)',
      },
      black: {
        '--bg-primary': '#222222',
        '--bg-secondary': 'rgba(0, 0, 0, 0.95)',
        '--color-primary': '#424242',
        '--color-secondary': '#616161',
        '--color-text': '#000000',
        '--color-text-muted': 'rgba(0, 0, 0, 0.8)',
        '--border-color': 'rgba(66, 66, 66, 0.5)',
        '--card-bg': 'rgba(66, 66, 66, 0.2)',
        '--card-border': 'rgba(66, 66, 66, 0.4)',
        '--button-text': '#ffffff',
        '--input-bg': 'rgba(0, 0, 0, 0.4)',
      },
      sky: {
        '--bg-primary': '#E0F2F1',
        '--bg-secondary': 'rgba(224, 242, 241, 0.95)',
        '--color-primary': '#4FC3F7',
        '--color-secondary': '#81D4FA',
        '--color-text': '#01579B',
        '--color-text-muted': 'rgba(1, 87, 155, 0.6)',
        '--border-color': 'rgba(79, 195, 247, 0.4)',
        '--card-bg': 'rgba(79, 195, 247, 0.15)',
        '--card-border': 'rgba(79, 195, 247, 0.3)',
        '--button-text': '#ffffff',
        '--input-bg': 'rgba(255, 255, 255, 0.7)',
      },
      cotton: {
        '--bg-primary': '#F5F5DC',
        '--bg-secondary': 'rgba(245, 245, 220, 0.95)',
        '--color-primary': '#6D4C41',
        '--color-secondary': '#8D6E63',
        '--color-text': '#3E2723',
        '--color-text-muted': 'rgba(62, 39, 35, 0.6)',
        '--border-color': 'rgba(109, 76, 65, 0.3)',
        '--card-bg': 'rgba(109, 76, 65, 0.1)',
        '--card-border': 'rgba(109, 76, 65, 0.25)',
        '--button-text': '#ffffff',
        '--input-bg': 'rgba(255, 255, 255, 0.7)',
      },
      blossom: {
        '--bg-primary': '#FFE4E1',
        '--bg-secondary': 'rgba(255, 228, 225, 0.95)',
        '--color-primary': '#F48FB1',
        '--color-secondary': '#F8BBD0',
        '--color-text': '#880E4F',
        '--color-text-muted': 'rgba(136, 14, 79, 0.6)',
        '--border-color': 'rgba(244, 143, 177, 0.4)',
        '--card-bg': 'rgba(244, 143, 177, 0.15)',
        '--card-border': 'rgba(244, 143, 177, 0.3)',
        '--button-text': '#ffffff',
        '--input-bg': 'rgba(255, 255, 255, 0.7)',
      },
    }

    const themeColors = themes[themeName] || themes.midnight
    Object.entries(themeColors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
