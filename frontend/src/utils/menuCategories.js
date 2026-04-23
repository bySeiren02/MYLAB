import { getStorage, setStorage } from './storage'

const STORAGE_KEY = 'mylab_menu_categories'

export const DEFAULT_MENU_CATEGORIES = [
  {
    id: 'plan',
    label: '계획',
    icon: '📋',
    items: [
      { to: '/daily-todo', label: '투두리스트' },
      { to: '/monthly-goal', label: '월 목표' },
      { to: '/yearly-goal', label: '연 목표' },
    ],
  },
  {
    id: 'body',
    label: '몸',
    icon: '💪',
    items: [
      { to: '/diet', label: '식단/운동/러닝' },
      { to: '/period', label: '생리' },
    ],
  },
  {
    id: 'care',
    label: '관리',
    icon: '✨',
    items: [
      { to: '/supplements', label: '영양제' },
      { to: '/skincare', label: '피부관리' },
      { to: '/procedure', label: '시술' },
      { to: '/dermatology', label: '피부과' },
    ],
  },
  {
    id: 'grow',
    label: '성장',
    icon: '📚',
    items: [
      { to: '/study-plan', label: '공부' },
      { to: '/reading', label: '독서' },
    ],
  },
  {
    id: 'culture_log',
    label: '감상 기록',
    icon: '🎭',
    items: [
      { to: '/movie-drama', label: '시청·공연' },
      { to: '/cultural', label: '전시·나들이' },
      { to: '/fiction', label: '소설·웹툰' },
    ],
  },
  {
    id: 'date',
    label: '디데이',
    icon: '💖',
    items: [
      { to: '/date', label: '커플' },
      { to: '/dday', label: '디데이' },
    ],
  },
  {
    id: 'daily',
    label: '일',
    icon: '🗒️',
    items: [
      { to: '/ledger', label: '가계부' },
      { to: '/side-hustle', label: '부업' },
    ],
  },
]

function mergeWithDefaults(list) {
  return DEFAULT_MENU_CATEGORIES.map((def) => {
    const from = Array.isArray(list) ? list.find((x) => x && x.id === def.id) : null
    const nextLabel = typeof from?.label === 'string' && from.label.trim() ? from.label.trim() : def.label
    const nextItems = def.items.map((itemDef) => {
      const fromItem = Array.isArray(from?.items) ? from.items.find((x) => x && x.to === itemDef.to) : null
      const label = typeof fromItem?.label === 'string' && fromItem.label.trim() ? fromItem.label.trim() : itemDef.label
      return { to: itemDef.to, label }
    })
    return { ...def, label: nextLabel, items: nextItems }
  })
}

export function getMenuCategories() {
  const raw = getStorage(STORAGE_KEY, null)
  return mergeWithDefaults(raw)
}

export function setMenuCategories(list) {
  const merged = mergeWithDefaults(list)
  setStorage(STORAGE_KEY, merged)
  window.dispatchEvent(new CustomEvent('mylab-menu-categories-changed'))
}
