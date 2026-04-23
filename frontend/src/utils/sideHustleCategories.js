import { getStorage, setStorage } from './storage'

const STORAGE_KEY = 'mylab_side_hustle_categories'

export const DEFAULT_SIDE_HUSTLE_CATEGORIES = ['콘텐츠', '쇼핑몰', '디자인', '개발', '마케팅', '기타']

function normalize(list) {
  if (!Array.isArray(list)) return [...DEFAULT_SIDE_HUSTLE_CATEGORIES]
  const next = list
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .slice(0, 20)
  if (next.length === 0) return [...DEFAULT_SIDE_HUSTLE_CATEGORIES]
  return next
}

export function getSideHustleCategories() {
  const raw = getStorage(STORAGE_KEY, null)
  return normalize(raw)
}

export function setSideHustleCategories(list) {
  const normalized = normalize(list)
  setStorage(STORAGE_KEY, normalized)
  window.dispatchEvent(new CustomEvent('mylab-side-hustle-categories-changed'))
}
