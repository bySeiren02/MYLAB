import { getStorage, setStorage } from './storage'

export const EVENT_TITLE_FAVORITES_KEY = 'event_title_favorites'
export const MAX_TITLE_FAVORITES = 5

export function getTitleFavorites() {
  const fav = getStorage(EVENT_TITLE_FAVORITES_KEY, [])
  return Array.isArray(fav) ? fav.slice(0, MAX_TITLE_FAVORITES).filter((s) => String(s || '').trim()) : []
}

export function setTitleFavorites(list) {
  const next = [...list].map((s) => String(s || '').trim()).filter(Boolean).slice(0, MAX_TITLE_FAVORITES)
  setStorage(EVENT_TITLE_FAVORITES_KEY, next)
  try {
    window.dispatchEvent(new Event('mylab-event-favorites-changed'))
  } catch {
    /* ignore */
  }
  return next
}
