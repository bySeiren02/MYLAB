import { useState } from 'react'
import { getDateKey } from '../utils/storage'

export function useDateNavigation(initialDate = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate)

  const goToPrevious = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() - 1)
    setCurrentDate(next)
  }

  const goToNext = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + 1)
    setCurrentDate(next)
  }

  return {
    currentDate,
    setCurrentDate,
    goToPrevious,
    goToNext,
    dateKey: getDateKey(currentDate),
  }
}

export function useMonthNavigation(initialDate = new Date()) {
  const [currentMonth, setCurrentMonth] = useState(initialDate)

  const goToPrevious = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNext = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

  return {
    currentMonth,
    setCurrentMonth,
    goToPrevious,
    goToNext,
    monthKey,
  }
}

export function useYearNavigation(initialYear = new Date().getFullYear()) {
  const [currentYear, setCurrentYear] = useState(initialYear)

  const goToPrevious = () => setCurrentYear((y) => y - 1)
  const goToNext = () => setCurrentYear((y) => y + 1)

  return {
    currentYear,
    setCurrentYear,
    goToPrevious,
    goToNext,
  }
}
