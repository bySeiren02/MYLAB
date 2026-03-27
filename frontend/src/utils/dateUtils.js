export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

export function formatMonthLabel(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

export function formatYearLabel(year) {
  return `${year}년`
}

/** month: 0-11 */
export function buildMonthGridDays(viewYear, viewMonth) {
  const year = viewYear
  const month = viewMonth
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days = []

  if (startingDayOfWeek === 0) {
    // 일요일 시작: 이전 달 패딩 없음(기존 Calendar.jsx와 동일)
  } else if (startingDayOfWeek !== 1) {
    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i -= 1) {
      days.push({
        day: prevMonthDays - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isOtherMonth: true,
      })
    }
  }

  for (let i = 1; i <= daysInMonth; i += 1) {
    days.push({
      day: i,
      month,
      year,
      isOtherMonth: false,
    })
  }

  const targetWeeks = 6
  const remainingCells = targetWeeks * 7 - days.length
  if (remainingCells > 0) {
    for (let i = 1; i <= remainingCells; i += 1) {
      days.push({
        day: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isOtherMonth: true,
      })
    }
  }

  return days
}

export function formatYmdKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
