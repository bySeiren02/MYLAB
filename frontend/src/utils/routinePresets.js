import { getStorage, setStorage } from './storage'

const DAILY_TODO_KEY = 'daily_todo_routines'
const SUPPLEMENTS_KEY = 'supplements_routines'

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeDailyTodo(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((item, idx) => ({
      id: item?.id || Date.now() + idx,
      text: normalizeText(item?.text),
    }))
    .filter((x) => x.text)
}

function normalizeSupplements(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((item, idx) => ({
      id: item?.id || Date.now() + idx,
      name: normalizeText(item?.name),
    }))
    .filter((x) => x.name)
}

export function getDailyTodoRoutines() {
  return normalizeDailyTodo(getStorage(DAILY_TODO_KEY, []))
}

export function setDailyTodoRoutines(list) {
  const normalized = normalizeDailyTodo(list)
  setStorage(DAILY_TODO_KEY, normalized)
  window.dispatchEvent(new CustomEvent('mylab-daily-routines-changed'))
}

export function getSupplementsRoutines() {
  return normalizeSupplements(getStorage(SUPPLEMENTS_KEY, []))
}

export function setSupplementsRoutines(list) {
  const normalized = normalizeSupplements(list)
  setStorage(SUPPLEMENTS_KEY, normalized)
  window.dispatchEvent(new CustomEvent('mylab-supplements-routines-changed'))
}
