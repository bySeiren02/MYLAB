import { getStorage, setStorage } from './storage'

export const DEFAULT_EVENT_CATEGORIES = [
  { id: 0, name: '업무', color: '#c45c5c' },
  { id: 1, name: '개인', color: '#2d9d8c' },
  { id: 2, name: '운동', color: '#3b82c4' },
  { id: 3, name: '공부', color: '#c9783a' },
  { id: 4, name: '약속', color: '#6b9e8f' },
  { id: 5, name: '기타', color: '#8b7ab8' },
]

const STORAGE_KEY = 'mylab_event_categories'

const HEX6 = /^#[0-9A-Fa-f]{6}$/

function mergeWithDefaults(list) {
  return DEFAULT_EVENT_CATEGORIES.map((d) => {
    const x = Array.isArray(list) ? list.find((l) => l && Number(l.id) === d.id) : null
    if (!x) return { ...d }
    const name = typeof x.name === 'string' && x.name.trim() ? x.name.trim() : d.name
    const color = typeof x.color === 'string' && HEX6.test(x.color) ? x.color : d.color
    return { id: d.id, name, color }
  })
}

export function getEventCategories() {
  const raw = getStorage(STORAGE_KEY, null)
  return mergeWithDefaults(raw)
}

export function setEventCategories(list) {
  const merged = mergeWithDefaults(list)
  setStorage(STORAGE_KEY, merged)
  window.dispatchEvent(new CustomEvent('mylab-event-categories-changed'))
}
