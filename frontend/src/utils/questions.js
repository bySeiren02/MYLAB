const pool = [
  '오늘 가장 고마웠던 순간은?',
  '내일 조금이라도 더 잘하고 싶은 한 가지는?',
  '지금 나를 가장 설레게 하는 것은?',
  '오늘 배운 것 한 가지는?',
  '스스로에게 칭찬 한 마디를 한다면?',
]

export function getQuestionForDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const idx = (d.getFullYear() + d.getMonth() + d.getDate()) % pool.length
  return pool[idx]
}
