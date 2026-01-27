// 전역 러닝 타이머 관리

let globalTimerInterval = null
let globalTimerCallbacks = new Set()

// 전역 타이머 시작
export const startGlobalTimer = (callback) => {
  if (globalTimerInterval) {
    // 이미 실행 중이면 콜백만 추가
    globalTimerCallbacks.add(callback)
    return
  }

  globalTimerCallbacks.add(callback)
  
  globalTimerInterval = setInterval(() => {
    globalTimerCallbacks.forEach(cb => {
      try {
        cb()
      } catch (error) {
        console.error('Timer callback error:', error)
      }
    })
  }, 10)
}

// 전역 타이머 중지
export const stopGlobalTimer = (callback) => {
  if (callback) {
    globalTimerCallbacks.delete(callback)
  } else {
    globalTimerCallbacks.clear()
  }

  if (globalTimerCallbacks.size === 0 && globalTimerInterval) {
    clearInterval(globalTimerInterval)
    globalTimerInterval = null
  }
}

// 전역 타이머 완전 정리
export const clearGlobalTimer = () => {
  if (globalTimerInterval) {
    clearInterval(globalTimerInterval)
    globalTimerInterval = null
  }
  globalTimerCallbacks.clear()
}
