export function getDateKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined) return defaultValue
    return JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

export function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('setStorage', key, e)
  }
}

export function listStorageKeysByPrefix(prefix) {
  const keys = []
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix)) keys.push(k)
    }
  } catch {
    /* ignore */
  }
  return keys
}
