export function getEventsForDate(events, dateStr) {
  const dateObj = new Date(`${dateStr}T00:00:00`)

  return events.filter((event) => {
    if (event.eventType === 'single' || !event.eventType) {
      return event.date === dateStr
    }
    if (event.eventType === 'range') {
      return event.date <= dateStr && event.endDate >= dateStr
    }
    if (event.eventType === 'repeat') {
      const startDate = new Date(`${event.date}T00:00:00`)
      const diffTime = dateObj - startDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays < 0) return false
      const interval = event.repeatInterval || '1week'
      if (interval === '1week') return diffDays % 7 === 0
      if (interval === '2week') return diffDays % 14 === 0
      if (interval === '1month') return dateObj.getDate() === startDate.getDate()
      if (interval === '6month') {
        const monthDiff =
          (dateObj.getFullYear() - startDate.getFullYear()) * 12 + (dateObj.getMonth() - startDate.getMonth())
        return monthDiff >= 0 && monthDiff % 6 === 0 && dateObj.getDate() === startDate.getDate()
      }
      if (interval === '1year') {
        return dateObj.getMonth() === startDate.getMonth() && dateObj.getDate() === startDate.getDate()
      }
    }
    return false
  })
}

export function sortEventsByTime(events) {
  return [...events].sort((a, b) => {
    if (a.time && b.time) return String(a.time).localeCompare(String(b.time))
    if (a.time && !b.time) return -1
    if (!a.time && b.time) return 1
    return (a.order || 0) - (b.order || 0)
  })
}
