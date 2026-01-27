import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage, removeStorage } from '../utils/storage'
import { startGlobalTimer, stopGlobalTimer, clearGlobalTimer } from '../utils/runningTimer'
import { useLanguage } from '../contexts/LanguageContext'
import BottomMenu from '../components/BottomMenu'
import TopMenu from '../components/TopMenu'
import './BasePage.css'
import './RunningStopwatch.css'

const RunningStopwatch = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [phase, setPhase] = useState('idle') // idle, warmup, running, walking, cooldown, countdown
  const [time, setTime] = useState(0)
  const [phaseTime, setPhaseTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [completedRoutines, setCompletedRoutines] = useState(new Set())
  const [startFromRoutine, setStartFromRoutine] = useState(null)
  
  const [settings, setSettings] = useState({
    warmupMinutes: 5,
    runningMinutes: 2,
    walkingMinutes: 3,
    set1Repeat: 1, // 기본 세트(세트1)의 반복 횟수
    sets: 5,
    cooldownMinutes: 5,
  })
  
  const [history, setHistory] = useState([])
  const [isEnded, setIsEnded] = useState(false) // 러닝 끝내기 버튼 클릭 여부
  const [showEndModal, setShowEndModal] = useState(false) // 러닝 끝내기 모달
  const [showAddSetModal, setShowAddSetModal] = useState(false) // 세트 추가 모달
  const [showHistoryModal, setShowHistoryModal] = useState(false) // 기록 상세 모달
  const [selectedHistory, setSelectedHistory] = useState(null) // 선택된 기록
  const [newSetRunning, setNewSetRunning] = useState(2) // 새 세트 러닝 시간
  const [newSetWalking, setNewSetWalking] = useState(3) // 새 세트 워킹 시간
  const [newSetRepeat, setNewSetRepeat] = useState(1) // 새 세트 반복 횟수
  const [setTimes, setSetTimes] = useState([]) // 각 세트별 러닝/워킹 시간 및 반복 횟수 [{running: 2, walking: 3, repeat: 2}, ...]
  const [currentSetGroup, setCurrentSetGroup] = useState(1) // 현재 세트 그룹 (1, 2, 3...)
  const [currentRepeat, setCurrentRepeat] = useState(1) // 현재 세트 그룹의 반복 횟수 (1, 2, 3...)
  const intervalRef = useRef(null)
  const alarm30Ref = useRef(false)
  const alarm10Ref = useRef(false)
  const backgroundTimeRef = useRef(0) // 백그라운드 시간 추적
  const timerCallbackRef = useRef(null) // 전역 타이머 콜백

  // 음성 알람 함수
  const speakAlarm = (message) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = 'ko-KR'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      speechSynthesis.speak(utterance)
    }
  }

  // 루틴 목록 생성
  const getRoutineList = () => {
    const routines = []
    
    // 워밍업이 0이 아니면 추가
    if (settings.warmupMinutes > 0) {
      routines.push({ id: 'warmup', name: t('warmup'), duration: settings.warmupMinutes, type: 'warmup' })
    }
    
    // 기본 세트(세트1) 반복
    for (let r = 1; r <= settings.set1Repeat; r++) {
      const suffix = settings.set1Repeat > 1 ? ` (${r}/${settings.set1Repeat})` : ''
      
      // 러닝 시간이 0이 아니면 추가
      if (settings.runningMinutes > 0) {
        routines.push({ 
          id: `running-1-${r}`, 
          name: `${t('runningSet')} 1${suffix}`, 
          duration: settings.runningMinutes, 
          type: 'running', 
          setGroup: 1, 
          repeat: r 
        })
      }
      
      // 워킹 시간이 0이 아니면 추가
      if (settings.walkingMinutes > 0) {
        routines.push({ 
          id: `walking-1-${r}`, 
          name: `${t('walking')} 1${suffix}`, 
          duration: settings.walkingMinutes, 
          type: 'walking', 
          setGroup: 1, 
          repeat: r 
        })
      }
    }
    
    // 추가된 세트들 (세트2, 세트3...) 반복
    for (let i = 0; i < setTimes.length; i++) {
      const setGroup = i + 2
      const repeat = setTimes[i].repeat || 1
      for (let r = 1; r <= repeat; r++) {
        const suffix = repeat > 1 ? ` (${r}/${repeat})` : ''
        
        // 러닝 시간이 0이 아니면 추가
        if (setTimes[i].running > 0) {
          routines.push({ 
            id: `running-${setGroup}-${r}`, 
            name: `${t('runningSet')} ${setGroup}${suffix}`, 
            duration: setTimes[i].running, 
            type: 'running', 
            setGroup, 
            repeat: r 
          })
        }
        
        // 워킹 시간이 0이 아니면 추가
        if (setTimes[i].walking > 0) {
          routines.push({ 
            id: `walking-${setGroup}-${r}`, 
            name: `${t('walking')} ${setGroup}${suffix}`, 
            duration: setTimes[i].walking, 
            type: 'walking', 
            setGroup, 
            repeat: r 
          })
        }
      }
    }
    
    // 쿨다운이 0이 아니면 추가
    if (settings.cooldownMinutes > 0) {
      routines.push({ id: 'cooldown', name: t('cooldown'), duration: settings.cooldownMinutes, type: 'cooldown' })
    }
    
    return routines
  }

  // 총 시간 계산 (분)
  const getTotalMinutes = () => {
    // 기본 세트(세트1) 시간 * 반복 횟수
    let totalSetsTime = (settings.runningMinutes + settings.walkingMinutes) * settings.set1Repeat
    // 추가된 세트들 시간 * 각각의 반복 횟수
    setTimes.forEach(setTime => {
      const repeat = setTime.repeat || 1
      totalSetsTime += (setTime.running + setTime.walking) * repeat
    })
    return settings.warmupMinutes + totalSetsTime + settings.cooldownMinutes
  }

  // 예상 칼로리 계산 (체중 70kg 기준, 러닝 10kcal/분, 워킹 4kcal/분)
  const getEstimatedCalories = () => {
    // 기본 세트(세트1) 칼로리 * 반복 횟수
    let runningCalories = settings.runningMinutes * 9 * settings.set1Repeat
    let walkingCalories = settings.walkingMinutes * 3 * settings.set1Repeat
    // 추가된 세트들 칼로리 * 각각의 반복 횟수
    setTimes.forEach(setTime => {
      const repeat = setTime.repeat || 1
      runningCalories += setTime.running * 9 * repeat
      walkingCalories += setTime.walking * 3 * repeat
    })
    const warmupCalories = settings.warmupMinutes * 2
    const cooldownCalories = settings.cooldownMinutes * 2
    return runningCalories + walkingCalories + warmupCalories + cooldownCalories
  }

  // 실제 소모 칼로리 계산 (실제 운동 시간 기반)
  const getActualCalories = (totalMinutes) => {
    // 실제 운동 시간을 기반으로 칼로리 계산
    // 러닝: 10kcal/분, 워킹: 4kcal/분, 워밍업/쿨다운: 3kcal/분
    // 실제 시간 비율로 계산
    const totalExpectedMinutes = getTotalMinutes()
    if (totalExpectedMinutes === 0) return 0
    
    const ratio = totalMinutes / totalExpectedMinutes
    return Math.round(getEstimatedCalories() * ratio)
  }

  // 실시간 칼로리 계산 (운동 중)
  const getRealtimeCalories = () => {
    let calories = 0
    
    // 완료된 루틴들의 칼로리 계산
    const routines = getRoutineList()
    routines.forEach(routine => {
      if (completedRoutines.has(routine.id)) {
        if (routine.type === 'warmup' || routine.type === 'cooldown') {
          calories += routine.duration * 3
        } else if (routine.type === 'running') {
          calories += routine.duration * 10
        } else if (routine.type === 'walking') {
          calories += routine.duration * 4
        }
      }
    })
    
    // 현재 진행 중인 phase의 칼로리 계산
    if (phase === 'warmup' && settings.warmupMinutes > 0) {
      const minutes = phaseTime / (60 * 1000)
      calories += minutes * 3
    } else if (phase === 'running') {
      const runningTime = currentSetGroup === 1 
        ? settings.runningMinutes 
        : setTimes[currentSetGroup - 2]?.running || settings.runningMinutes
      if (runningTime > 0) {
        const minutes = phaseTime / (60 * 1000)
        calories += minutes * 10
      }
    } else if (phase === 'walking') {
      const walkingTime = currentSetGroup === 1 
        ? settings.walkingMinutes 
        : setTimes[currentSetGroup - 2]?.walking || settings.walkingMinutes
      if (walkingTime > 0) {
        const minutes = phaseTime / (60 * 1000)
        calories += minutes * 4
      }
    } else if (phase === 'cooldown' && settings.cooldownMinutes > 0) {
      const minutes = phaseTime / (60 * 1000)
      calories += minutes * 3
    }
    
    return Math.round(calories)
  }

  // 백그라운드 실행 처리
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 백그라운드로 갔을 때 현재 시간 저장
        backgroundTimeRef.current = Date.now()
      } else {
        // 포그라운드로 돌아왔을 때 경과 시간 추가
        if (isRunning && phase !== 'idle' && phase !== 'countdown' && !isEnded) {
          const elapsed = Date.now() - backgroundTimeRef.current
          setTime((prev) => prev + elapsed)
          setPhaseTime((prev) => prev + elapsed)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRunning, phase, isEnded])

  // localStorage에서 러닝 상태 복원
  useEffect(() => {
    const savedState = getStorage('running_state', null)
    if (savedState && savedState.isRunning && !savedState.isEnded) {
      // 저장된 상태가 있으면 복원
      setPhase(savedState.phase)
      setTime(savedState.time)
      setPhaseTime(savedState.phaseTime)
      setCurrentSetGroup(savedState.currentSetGroup || savedState.currentSet || 1)
      setCurrentRepeat(savedState.currentRepeat || 1)
      setIsRunning(savedState.isRunning)
      setSettings(savedState.settings)
      setSetTimes(savedState.setTimes || [])
      setIsEnded(false)
    }
  }, [])

  // 러닝 상태를 localStorage에 저장
  useEffect(() => {
    if (phase !== 'idle' && phase !== 'countdown') {
      setStorage('running_state', {
        phase,
        time,
        phaseTime,
        currentSetGroup,
        currentRepeat,
        isRunning,
        isEnded,
        settings,
        setTimes,
      })
    } else if (phase === 'idle' && isEnded) {
      removeStorage('running_state')
    }
  }, [phase, time, phaseTime, currentSetGroup, currentRepeat, isRunning, isEnded, settings, setTimes])

  // 전역 타이머 사용
  useEffect(() => {
    if (isRunning && phase !== 'idle' && phase !== 'countdown' && !isEnded) {
      // 전역 타이머 콜백 설정
      timerCallbackRef.current = () => {
        setTime((prev) => prev + 10)
        setPhaseTime((prev) => prev + 10)
      }
      
      startGlobalTimer(timerCallbackRef.current)
      
      return () => {
        stopGlobalTimer(timerCallbackRef.current)
        timerCallbackRef.current = null
      }
    } else {
      if (timerCallbackRef.current) {
        stopGlobalTimer(timerCallbackRef.current)
        timerCallbackRef.current = null
      }
    }
  }, [isRunning, phase, isEnded])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerCallbackRef.current) {
        stopGlobalTimer(timerCallbackRef.current)
      }
    }
  }, [])

  // 다음 유효한 phase 찾기 (0이 아닌 항목)
  const findNextValidPhase = (startPhase, startSetGroup = 1, startRepeat = 1) => {
    const routines = getRoutineList()
    if (routines.length === 0) return null
    
    // 특정 루틴부터 시작하는 경우
    if (startPhase === 'warmup' && settings.warmupMinutes > 0) {
      return { phase: 'warmup', setGroup: 1, repeat: 1 }
    }
    if (startPhase === 'running') {
      const runningTime = startSetGroup === 1 
        ? settings.runningMinutes 
        : setTimes[startSetGroup - 2]?.running || 0
      if (runningTime > 0) {
        return { phase: 'running', setGroup: startSetGroup, repeat: startRepeat }
      }
    }
    if (startPhase === 'walking') {
      const walkingTime = startSetGroup === 1 
        ? settings.walkingMinutes 
        : setTimes[startSetGroup - 2]?.walking || 0
      if (walkingTime > 0) {
        return { phase: 'walking', setGroup: startSetGroup, repeat: startRepeat }
      }
    }
    if (startPhase === 'cooldown' && settings.cooldownMinutes > 0) {
      return { phase: 'cooldown', setGroup: setTimes.length + 1, repeat: 1 }
    }
    
    // 루틴 목록에서 첫 번째 유효한 루틴 찾기
    if (routines.length > 0) {
      const firstRoutine = routines[0]
      if (firstRoutine.type === 'warmup') {
        return { phase: 'warmup', setGroup: 1, repeat: 1 }
      } else if (firstRoutine.type === 'running') {
        return { phase: 'running', setGroup: firstRoutine.setGroup || 1, repeat: firstRoutine.repeat || 1 }
      } else if (firstRoutine.type === 'walking') {
        return { phase: 'walking', setGroup: firstRoutine.setGroup || 1, repeat: firstRoutine.repeat || 1 }
      } else if (firstRoutine.type === 'cooldown') {
        return { phase: 'cooldown', setGroup: setTimes.length + 1, repeat: 1 }
      }
    }
    
    return null
  }

  // 카운트다운 처리
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          // 카운트다운이 끝나면 시작할 페이즈 결정
          if (startFromRoutine) {
            const routines = getRoutineList()
            const routineIndex = routines.findIndex(r => r.id === startFromRoutine.id)
            if (routineIndex !== -1) {
              const routine = routines[routineIndex]
              if (routine.type === 'warmup') {
                setPhase('warmup')
                setCurrentSetGroup(1)
                setCurrentRepeat(1)
              } else if (routine.type === 'running') {
                setPhase('running')
                setCurrentSetGroup(routine.setGroup || routine.setNum || 1)
                setCurrentRepeat(routine.repeat || 1)
              } else if (routine.type === 'walking') {
                setPhase('walking')
                setCurrentSetGroup(routine.setGroup || routine.setNum || 1)
                setCurrentRepeat(routine.repeat || 1)
              } else if (routine.type === 'cooldown') {
                setPhase('cooldown')
                setCurrentSetGroup(setTimes.length + 1)
                setCurrentRepeat(1)
              }
            }
          } else {
            // 처음부터 시작 - 0이 아닌 첫 번째 항목 찾기
            const nextPhase = findNextValidPhase('warmup')
            if (nextPhase) {
              setPhase(nextPhase.phase)
              setCurrentSetGroup(nextPhase.setGroup)
              setCurrentRepeat(nextPhase.repeat)
            } else {
              // 모든 항목이 0이면 시작 불가 (이미 start 함수에서 검증했지만 안전장치)
              alert('시작할 수 있는 루틴이 없습니다.')
              setPhase('idle')
              return
            }
          }
          setCountdown(0)
          setIsRunning(true)
        } else {
          setCountdown(countdown - 1)
          if (countdown <= 3) {
            speakAlarm(`${countdown}`)
          }
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, countdown, startFromRoutine, settings])

  // 알람 체크 및 음성 알람
  useEffect(() => {
    if (!isRunning || phase === 'idle' || phase === 'countdown') {
      alarm30Ref.current = false
      alarm10Ref.current = false
      return
    }

    const targetTime = getPhaseTarget()
    const remaining = targetTime - phaseTime
    const remainingSeconds = Math.floor(remaining / 1000)

    // 30초 전 알람
    if (remainingSeconds === 30 && !alarm30Ref.current) {
      const phaseName = getPhaseName()
      speakAlarm(`${phaseName} 끝나기 30초 전입니다!`)
      alarm30Ref.current = true
    }

    // 10초 전 알람
    if (remainingSeconds === 10 && !alarm10Ref.current) {
      const phaseName = getPhaseName()
      speakAlarm(`${phaseName} 끝나기 10초 전입니다!`)
      alarm10Ref.current = true
    }
  }, [phaseTime, phase, isRunning])

  useEffect(() => {
    if (phase === 'warmup') {
      // 워밍업이 0이면 바로 다음으로
      if (settings.warmupMinutes === 0) {
        setCompletedRoutines(prev => new Set([...prev, 'warmup']))
        // 다음 유효한 phase 찾기
        const nextPhase = findNextValidPhase('running', 1, 1)
        if (nextPhase) {
          setPhase(nextPhase.phase)
          setCurrentSetGroup(nextPhase.setGroup)
          setCurrentRepeat(nextPhase.repeat)
        } else {
          // 모든 항목이 끝났으면 종료
          setIsRunning(false)
          setIsEnded(true)
          setShowEndModal(true)
        }
        setPhaseTime(0)
        alarm30Ref.current = false
        alarm10Ref.current = false
        return
      }
      
      const targetTime = settings.warmupMinutes * 60 * 1000
      if (phaseTime >= targetTime) {
        setCompletedRoutines(prev => new Set([...prev, 'warmup']))
        // 다음 유효한 phase 찾기
        const nextPhase = findNextValidPhase('running', 1, 1)
        if (nextPhase) {
          setPhase(nextPhase.phase)
          setCurrentSetGroup(nextPhase.setGroup)
          setCurrentRepeat(nextPhase.repeat)
        } else {
          // 모든 항목이 끝났으면 종료
          setIsRunning(false)
          setIsEnded(true)
          setShowEndModal(true)
        }
        setPhaseTime(0)
        alarm30Ref.current = false
        alarm10Ref.current = false
      }
    } else if (phase === 'running') {
      // 현재 세트 그룹의 러닝 시간 가져오기
      const runningTime = currentSetGroup === 1 
        ? settings.runningMinutes 
        : setTimes[currentSetGroup - 2]?.running || settings.runningMinutes
      
      // 러닝 시간이 0이면 바로 다음으로
      if (runningTime === 0) {
        setCompletedRoutines(prev => new Set([...prev, `running-${currentSetGroup}-${currentRepeat}`]))
        // 다음 유효한 phase 찾기 (walking)
        const walkingTime = currentSetGroup === 1 
          ? settings.walkingMinutes 
          : setTimes[currentSetGroup - 2]?.walking || 0
        if (walkingTime > 0) {
          setPhase('walking')
        } else {
          // 워킹도 0이면 다음 세트 또는 쿨다운으로
          const currentSetRepeat = currentSetGroup === 1 
            ? settings.set1Repeat 
            : (setTimes[currentSetGroup - 2]?.repeat || 1)
          if (currentRepeat < currentSetRepeat) {
            setCurrentRepeat(currentRepeat + 1)
            const nextRunningTime = currentSetGroup === 1 
              ? settings.runningMinutes 
              : setTimes[currentSetGroup - 2]?.running || 0
            if (nextRunningTime > 0) {
              setPhase('running')
            } else {
              // 다음 러닝도 0이면 계속 건너뛰기
              const nextPhase = findNextValidPhase('running', currentSetGroup, currentRepeat + 1)
              if (nextPhase) {
                setPhase(nextPhase.phase)
                setCurrentSetGroup(nextPhase.setGroup)
                setCurrentRepeat(nextPhase.repeat)
              } else {
                setIsRunning(false)
                setIsEnded(true)
                setShowEndModal(true)
              }
            }
          } else {
            const totalSetGroups = setTimes.length + 1
            if (currentSetGroup < totalSetGroups) {
              setCurrentSetGroup(currentSetGroup + 1)
              setCurrentRepeat(1)
              const nextRunningTime = setTimes[currentSetGroup - 1]?.running || 0
              if (nextRunningTime > 0) {
                setPhase('running')
              } else {
                const nextPhase = findNextValidPhase('running', currentSetGroup + 1, 1)
                if (nextPhase) {
                  setPhase(nextPhase.phase)
                  setCurrentSetGroup(nextPhase.setGroup)
                  setCurrentRepeat(nextPhase.repeat)
                } else if (settings.cooldownMinutes > 0) {
                  setPhase('cooldown')
                } else {
                  setIsRunning(false)
                  setIsEnded(true)
                  setShowEndModal(true)
                }
              }
            } else if (settings.cooldownMinutes > 0) {
              setPhase('cooldown')
            } else {
              setIsRunning(false)
              setIsEnded(true)
              setShowEndModal(true)
            }
          }
        }
        setPhaseTime(0)
        alarm30Ref.current = false
        alarm10Ref.current = false
        return
      }
      
      const targetTime = runningTime * 60 * 1000
      if (phaseTime >= targetTime) {
        setCompletedRoutines(prev => new Set([...prev, `running-${currentSetGroup}-${currentRepeat}`]))
        // 다음 유효한 phase 찾기 (walking)
        const walkingTime = currentSetGroup === 1 
          ? settings.walkingMinutes 
          : setTimes[currentSetGroup - 2]?.walking || 0
        if (walkingTime > 0) {
          setPhase('walking')
        } else {
          // 워킹이 0이면 다음 세트 또는 쿨다운으로
          const currentSetRepeat = currentSetGroup === 1 
            ? settings.set1Repeat 
            : (setTimes[currentSetGroup - 2]?.repeat || 1)
          if (currentRepeat < currentSetRepeat) {
            setCurrentRepeat(currentRepeat + 1)
            const nextRunningTime = currentSetGroup === 1 
              ? settings.runningMinutes 
              : setTimes[currentSetGroup - 2]?.running || 0
            if (nextRunningTime > 0) {
              setPhase('running')
            } else {
              const nextPhase = findNextValidPhase('running', currentSetGroup, currentRepeat + 1)
              if (nextPhase) {
                setPhase(nextPhase.phase)
                setCurrentSetGroup(nextPhase.setGroup)
                setCurrentRepeat(nextPhase.repeat)
              } else {
                setIsRunning(false)
                setIsEnded(true)
                setShowEndModal(true)
              }
            }
          } else {
            const totalSetGroups = setTimes.length + 1
            if (currentSetGroup < totalSetGroups) {
              setCurrentSetGroup(currentSetGroup + 1)
              setCurrentRepeat(1)
              const nextRunningTime = setTimes[currentSetGroup - 1]?.running || 0
              if (nextRunningTime > 0) {
                setPhase('running')
              } else {
                const nextPhase = findNextValidPhase('running', currentSetGroup + 1, 1)
                if (nextPhase) {
                  setPhase(nextPhase.phase)
                  setCurrentSetGroup(nextPhase.setGroup)
                  setCurrentRepeat(nextPhase.repeat)
                } else if (settings.cooldownMinutes > 0) {
                  setPhase('cooldown')
                } else {
                  setIsRunning(false)
                  setIsEnded(true)
                  setShowEndModal(true)
                }
              }
            } else if (settings.cooldownMinutes > 0) {
              setPhase('cooldown')
            } else {
              setIsRunning(false)
              setIsEnded(true)
              setShowEndModal(true)
            }
          }
        }
        setPhaseTime(0)
        alarm30Ref.current = false
        alarm10Ref.current = false
      }
    } else if (phase === 'walking') {
      // 현재 세트 그룹의 워킹 시간 가져오기
      const walkingTime = currentSetGroup === 1 
        ? settings.walkingMinutes 
        : setTimes[currentSetGroup - 2]?.walking || settings.walkingMinutes
      
      // 워킹 시간이 0이면 바로 다음으로
      if (walkingTime === 0) {
        setCompletedRoutines(prev => new Set([...prev, `walking-${currentSetGroup}-${currentRepeat}`]))
        
        // 현재 세트 그룹의 반복 횟수 확인
        const currentSetRepeat = currentSetGroup === 1 
          ? settings.set1Repeat 
          : (setTimes[currentSetGroup - 2]?.repeat || 1)
        
        if (currentRepeat < currentSetRepeat) {
          // 같은 세트 그룹의 다음 반복
          setCurrentRepeat(currentRepeat + 1)
          const nextRunningTime = currentSetGroup === 1 
            ? settings.runningMinutes 
            : setTimes[currentSetGroup - 2]?.running || 0
          if (nextRunningTime > 0) {
            setPhase('running')
          } else {
            const nextPhase = findNextValidPhase('running', currentSetGroup, currentRepeat + 1)
            if (nextPhase) {
              setPhase(nextPhase.phase)
              setCurrentSetGroup(nextPhase.setGroup)
              setCurrentRepeat(nextPhase.repeat)
            } else {
              setIsRunning(false)
              setIsEnded(true)
              setShowEndModal(true)
            }
          }
        } else {
          // 현재 세트 그룹의 반복이 끝났으므로 다음 세트 그룹으로
          const totalSetGroups = setTimes.length + 1
          if (currentSetGroup < totalSetGroups) {
            setCurrentSetGroup(currentSetGroup + 1)
            setCurrentRepeat(1)
            const nextRunningTime = setTimes[currentSetGroup - 1]?.running || 0
            if (nextRunningTime > 0) {
              setPhase('running')
            } else {
              const nextPhase = findNextValidPhase('running', currentSetGroup + 1, 1)
              if (nextPhase) {
                setPhase(nextPhase.phase)
                setCurrentSetGroup(nextPhase.setGroup)
                setCurrentRepeat(nextPhase.repeat)
              } else if (settings.cooldownMinutes > 0) {
                setPhase('cooldown')
              } else {
                setIsRunning(false)
                setIsEnded(true)
                setShowEndModal(true)
              }
            }
          } else {
            // 모든 세트 그룹이 끝나면 쿨다운
            if (settings.cooldownMinutes > 0) {
              setPhase('cooldown')
            } else {
              setIsRunning(false)
              setIsEnded(true)
              setShowEndModal(true)
            }
          }
        }
        setPhaseTime(0)
        alarm30Ref.current = false
        alarm10Ref.current = false
        return
      }
      
      const targetTime = walkingTime * 60 * 1000
      if (phaseTime >= targetTime && !isEnded) {
        setCompletedRoutines(prev => new Set([...prev, `walking-${currentSetGroup}-${currentRepeat}`]))
        
        // 현재 세트 그룹의 반복 횟수 확인
        const currentSetRepeat = currentSetGroup === 1 
          ? settings.set1Repeat 
          : (setTimes[currentSetGroup - 2]?.repeat || 1)
        
        if (currentRepeat < currentSetRepeat) {
          // 같은 세트 그룹의 다음 반복
          setCurrentRepeat(currentRepeat + 1)
          const nextRunningTime = currentSetGroup === 1 
            ? settings.runningMinutes 
            : setTimes[currentSetGroup - 2]?.running || 0
          if (nextRunningTime > 0) {
            setPhase('running')
          } else {
            const nextPhase = findNextValidPhase('running', currentSetGroup, currentRepeat + 1)
            if (nextPhase) {
              setPhase(nextPhase.phase)
              setCurrentSetGroup(nextPhase.setGroup)
              setCurrentRepeat(nextPhase.repeat)
            } else {
              setIsRunning(false)
              setIsEnded(true)
              setShowEndModal(true)
            }
          }
        } else {
          // 현재 세트 그룹의 반복이 끝났으므로 다음 세트 그룹으로
          const totalSetGroups = setTimes.length + 1
          if (currentSetGroup < totalSetGroups) {
            setCurrentSetGroup(currentSetGroup + 1)
            setCurrentRepeat(1)
            const nextRunningTime = setTimes[currentSetGroup - 1]?.running || 0
            if (nextRunningTime > 0) {
              setPhase('running')
            } else {
              const nextPhase = findNextValidPhase('running', currentSetGroup + 1, 1)
              if (nextPhase) {
                setPhase(nextPhase.phase)
                setCurrentSetGroup(nextPhase.setGroup)
                setCurrentRepeat(nextPhase.repeat)
              } else if (settings.cooldownMinutes > 0) {
                setPhase('cooldown')
              } else {
                setIsRunning(false)
                setIsEnded(true)
                setShowEndModal(true)
              }
            }
          } else {
            // 모든 세트 그룹이 끝나면 쿨다운
            if (settings.cooldownMinutes > 0) {
              setPhase('cooldown')
            } else {
              setIsRunning(false)
              setIsEnded(true)
              setShowEndModal(true)
            }
          }
        }
        setPhaseTime(0)
        alarm30Ref.current = false
        alarm10Ref.current = false
      }
    } else if (phase === 'cooldown') {
      // 쿨다운이 0이면 바로 종료
      if (settings.cooldownMinutes === 0) {
        setCompletedRoutines(prev => new Set([...prev, 'cooldown']))
        setIsRunning(false)
        setIsEnded(true)
        setShowEndModal(true)
        setPhaseTime(0)
        alarm30Ref.current = false
        alarm10Ref.current = false
        
        const totalMinutes = Math.floor(time / 60000)
        const totalSeconds = Math.floor((time % 60000) / 1000)
        const actualCalories = getActualCalories(totalMinutes + totalSeconds / 60)
        setHistory([...history, { 
          sets: setTimes.length + 1, 
          totalTime: time,
          date: new Date().toISOString(),
          calories: actualCalories
        }])
        setCompletedRoutines(new Set())
        
        if (timerCallbackRef.current) {
          stopGlobalTimer(timerCallbackRef.current)
          timerCallbackRef.current = null
        }
        removeStorage('running_state')
        return
      }
      
      const targetTime = settings.cooldownMinutes * 60 * 1000
      if (phaseTime >= targetTime && !isEnded) {
        setCompletedRoutines(prev => new Set([...prev, 'cooldown']))
        // 쿨다운이 끝나면 자동으로 러닝 종료
        alarm30Ref.current = false
        alarm10Ref.current = false
        // 자동으로 러닝 끝내기
        setIsRunning(false)
        setIsEnded(true)
        
        // 총 시간 계산 (분)
        const totalMinutes = Math.floor(time / 60000)
        const totalSeconds = Math.floor((time % 60000) / 1000)
        
        // 실제 소모 칼로리 계산
        const actualCalories = getActualCalories(totalMinutes + totalSeconds / 60)
        
        // 모달 표시
        setShowEndModal(true)
        
        // 히스토리에 저장
        const actualCaloriesForHistory = getActualCalories(totalMinutes + totalSeconds / 60)
        setHistory([...history, { 
          sets: setTimes.length + 1, 
          totalTime: time,
          date: new Date().toISOString(),
          calories: actualCaloriesForHistory
        }])
        setCompletedRoutines(new Set())
        
        // 전역 타이머 정리
        if (timerCallbackRef.current) {
          stopGlobalTimer(timerCallbackRef.current)
          timerCallbackRef.current = null
        }
        
        // localStorage 정리
        removeStorage('running_state')
      }
    }
  }, [phaseTime, phase, settings, currentSetGroup, currentRepeat, time, history, isEnded])

  const start = (fromRoutine = null) => {
    // 워밍업, 러닝시간, 워킹시간, 쿨다운이 모두 0인지 확인
    const allZero = settings.warmupMinutes === 0 && 
                    settings.runningMinutes === 0 && 
                    settings.walkingMinutes === 0 && 
                    settings.cooldownMinutes === 0
    
    // 추가된 세트들도 모두 0인지 확인
    const allSetTimesZero = setTimes.every(setTime => setTime.running === 0 && setTime.walking === 0)
    
    if (allZero && allSetTimesZero) {
      alert(t('alertMessage'))
      return
    }
    
    if (fromRoutine) {
      // 특정 루틴부터 시작
      const routines = getRoutineList()
      const routineIndex = routines.findIndex(r => r.id === fromRoutine.id)
      if (routineIndex !== -1) {
        setStartFromRoutine(fromRoutine)
        setTime(0)
        setPhaseTime(0)
        setCountdown(3)
        setPhase('countdown')
        setIsRunning(false)
        // 완료된 루틴들 초기화 (선택한 루틴 이전까지만)
        const newCompleted = new Set()
        for (let i = 0; i < routineIndex; i++) {
          newCompleted.add(routines[i].id)
        }
        setCompletedRoutines(newCompleted)
      }
    } else {
      // 처음부터 시작
      setPhase('countdown')
      setTime(0)
      setPhaseTime(0)
      setCurrentSetGroup(1)
      setCurrentRepeat(1)
      setCountdown(3)
      setIsRunning(false)
      setCompletedRoutines(new Set())
      setStartFromRoutine(null)
      setIsEnded(false)
    }
  }

  const pause = () => {
    setIsRunning(false)
  }

  const resume = () => {
    setIsRunning(true)
  }

  const jumpToRoutine = (routine) => {
    // 운동 중 루틴 클릭 시 해당 루틴으로 전환 (현재 시간 유지)
    const routines = getRoutineList()
    const routineIndex = routines.findIndex(r => r.id === routine.id)
    
    if (routineIndex !== -1) {
      // 선택한 루틴 이전의 모든 루틴을 완료 처리
      const newCompleted = new Set(completedRoutines)
      for (let i = 0; i < routineIndex; i++) {
        newCompleted.add(routines[i].id)
      }
      setCompletedRoutines(newCompleted)
      
      // 해당 루틴으로 전환
      if (routine.type === 'warmup') {
        setPhase('warmup')
        setCurrentSetGroup(1)
        setCurrentRepeat(1)
        setPhaseTime(0)
      } else if (routine.type === 'running') {
        setPhase('running')
        setCurrentSetGroup(routine.setGroup || 1)
        setCurrentRepeat(routine.repeat || 1)
        setPhaseTime(0)
      } else if (routine.type === 'walking') {
        setPhase('walking')
        setCurrentSetGroup(routine.setGroup || 1)
        setCurrentRepeat(routine.repeat || 1)
        setPhaseTime(0)
      } else if (routine.type === 'cooldown') {
        setPhase('cooldown')
        setCurrentSetGroup(setTimes.length + 1)
        setCurrentRepeat(1)
        setPhaseTime(0)
      }
      
      // 알람 리셋
      alarm30Ref.current = false
      alarm10Ref.current = false
    }
  }

  const reset = () => {
    setIsRunning(false)
    setPhase('idle')
    setTime(0)
    setPhaseTime(0)
    setCurrentSetGroup(1)
    setCurrentRepeat(1)
    setCountdown(0)
    setCompletedRoutines(new Set())
    setStartFromRoutine(null)
    setIsEnded(false)
    setSetTimes([])
    alarm30Ref.current = false
    alarm10Ref.current = false
  }

  const endRunning = () => {
    setIsRunning(false)
    setIsEnded(true)
    
    // 총 시간 계산 (분)
    const totalMinutes = Math.floor(time / 60000)
    const totalSeconds = Math.floor((time % 60000) / 1000)
    const formattedTime = `${totalMinutes}분 ${totalSeconds}초`
    
    // 실제 소모 칼로리 계산
    const actualCalories = getActualCalories(totalMinutes + totalSeconds / 60)
    
    // 모달 표시
    setShowEndModal(true)
    
    // 히스토리에 저장
    const actualCaloriesForHistory = getActualCalories(totalMinutes + totalSeconds / 60)
    setHistory([...history, { 
      sets: setTimes.length + 1, 
      totalTime: time,
      date: new Date().toISOString(),
      calories: actualCaloriesForHistory
    }])
    setCompletedRoutines(new Set())
    alarm30Ref.current = false
    alarm10Ref.current = false
    
    // 전역 타이머 정리
    if (timerCallbackRef.current) {
      stopGlobalTimer(timerCallbackRef.current)
      timerCallbackRef.current = null
    }
    
    // localStorage 정리
    removeStorage('running_state')
  }

  const closeEndModal = () => {
    setShowEndModal(false)
    setPhase('idle')
    setTime(0)
    setPhaseTime(0)
    setCurrentSetGroup(1)
    setCurrentRepeat(1)
    setSetTimes([])
  }

  const openAddSetModal = () => {
    // 세트 추가 모달 열기
    setNewSetRunning(settings.runningMinutes)
    setNewSetWalking(settings.walkingMinutes)
    setNewSetRepeat(1) // 기본값을 1로 설정
    setShowAddSetModal(true)
  }

  const confirmAddSet = () => {
    // 기존 세트 중에 러닝 시간과 워킹 시간이 모두 같은 값인 세트가 있는지 확인
    // 세트1 확인
    if (settings.runningMinutes === newSetRunning && settings.walkingMinutes === newSetWalking) {
      // 세트1의 세트 수 증가
      setSettings({ ...settings, set1Repeat: settings.set1Repeat + newSetRepeat })
      setShowAddSetModal(false)
      return
    }
    
    // 추가된 세트들 확인
    const matchingIndex = setTimes.findIndex(
      setTime => setTime.running === newSetRunning && setTime.walking === newSetWalking
    )
    
    if (matchingIndex !== -1) {
      // 같은 러닝/워킹 시간을 가진 세트가 있으면 세트 수만 증가
      const newSetTimes = [...setTimes]
      newSetTimes[matchingIndex].repeat = (newSetTimes[matchingIndex].repeat || 0) + newSetRepeat
      setSetTimes(newSetTimes)
    } else {
      // 같은 세트가 없으면 새로운 세트 추가
      setSetTimes([...setTimes, { running: newSetRunning, walking: newSetWalking, repeat: newSetRepeat }])
    }
    
    setShowAddSetModal(false)
  }

  const addSet = () => {
    // 운동 중 세트 추가 - 기본 시간과 반복 횟수 1로 새 세트 추가
    setSetTimes([...setTimes, { running: settings.runningMinutes, walking: settings.walkingMinutes, repeat: 1 }])
    
    // 현재 쿨다운 중이거나 마지막 세트의 워킹이 끝난 상태라면 새로운 세트로 전환
    const totalSetGroups = setTimes.length + 1
    if (phase === 'cooldown' || (phase === 'walking' && currentSetGroup >= totalSetGroups)) {
      setCurrentSetGroup(totalSetGroups + 1)
      setCurrentRepeat(1)
      setPhase('running')
      setPhaseTime(0)
      alarm30Ref.current = false
      alarm10Ref.current = false
    }
  }

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const centiseconds = Math.floor((ms % 1000) / 10)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
  }

  const formatMinutes = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return language === 'ko' 
      ? `${minutes}분 ${seconds}초`
      : `${minutes}${t('minutes')} ${seconds}sec`
  }

  const getPhaseName = () => {
    switch (phase) {
      case 'warmup':
        return t('warmup')
      case 'running':
        const runningRepeat = currentSetGroup === 1 
          ? settings.set1Repeat 
          : (setTimes[currentSetGroup - 2]?.repeat || 1)
        const runningSuffix = runningRepeat > 1 ? ` (${currentRepeat}/${runningRepeat})` : ''
        return `${t('runningSet')} ${t('set')} ${currentSetGroup}${runningSuffix}`
      case 'walking':
        const walkingRepeat = currentSetGroup === 1 
          ? settings.set1Repeat 
          : (setTimes[currentSetGroup - 2]?.repeat || 1)
        const walkingSuffix = walkingRepeat > 1 ? ` (${currentRepeat}/${walkingRepeat})` : ''
        return `${t('walking')} ${t('set')} ${currentSetGroup}${walkingSuffix}`
      case 'cooldown':
        return t('cooldown')
      default:
        return language === 'ko' ? '대기' : 'Waiting'
    }
  }

  // 워킹이 끝나고 다음 세트로 넘어갈 때 동적으로 추가된 세트 처리
  useEffect(() => {
    const totalSetGroups = setTimes.length + 1
    if (phase === 'walking' && currentSetGroup >= totalSetGroups && !isEnded) {
      // 마지막 세트 그룹의 워킹이 끝나면 쿨다운으로 가는 대신 계속 실행
      // 사용자가 세트를 추가하거나 "러닝 끝내기"를 눌러야 종료
    }
  }, [phase, currentSetGroup, setTimes.length, isEnded])

  const getPhaseTarget = () => {
    switch (phase) {
      case 'warmup':
        return settings.warmupMinutes * 60 * 1000
      case 'running':
        // 현재 세트 그룹의 러닝 시간
        const runningTime = currentSetGroup === 1 
          ? settings.runningMinutes 
          : setTimes[currentSetGroup - 2]?.running || settings.runningMinutes
        return runningTime * 60 * 1000
      case 'walking':
        // 현재 세트 그룹의 워킹 시간
        const walkingTime = currentSetGroup === 1 
          ? settings.walkingMinutes 
          : setTimes[currentSetGroup - 2]?.walking || settings.walkingMinutes
        return walkingTime * 60 * 1000
      case 'cooldown':
        return settings.cooldownMinutes * 60 * 1000
      default:
        return 0
    }
  }

  const getPhaseProgress = () => {
    const target = getPhaseTarget()
    if (target === 0) return 0
    return Math.min(100, (phaseTime / target) * 100)
  }

  const routines = getRoutineList()
  const totalMinutes = getTotalMinutes()
  const estimatedCalories = getEstimatedCalories()

  return (
    <div className="base-page">
      <TopMenu />
      <div className="page-header">
        <h1 className="page-title">{t('runningStopwatch')}</h1>
      </div>

      {/* 총 시간 및 칼로리 표시 */}
      {phase === 'idle' && (
        <div className="summary-box">
          <div className="summary-time">
            {t('totalExerciseTime')}: {totalMinutes}{t('minutes')}
          </div>
          <div className="summary-calories">
            {language === 'ko' ? '약' : 'About'} {estimatedCalories} {t('calories')} {language === 'ko' ? '가 소모됩니다!' : 'will be burned!'}
          </div>
        </div>
      )}

      <div className="stopwatch-container">
        {phase === 'idle' && (
          <div className="settings-section">
            <h3 className="section-title">{t('settings')}</h3>
            <div className="form-group">
              <label className="form-label">{t('warmup')} ({t('minutes')})</label>
              <input
                type="number"
                className="form-input full-width"
                value={settings.warmupMinutes}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && settings.warmupMinutes === 0) {
                    e.preventDefault()
                  } else if (settings.warmupMinutes === 0 && /^[0-9]$/.test(e.key)) {
                    // 0 상태에서 숫자 입력 시 바로 교체
                    e.preventDefault()
                    setSettings({ ...settings, warmupMinutes: parseInt(e.key) })
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                  setSettings({ ...settings, warmupMinutes: val })
                }}
                min="0"
              />
            </div>
            
            {/* 세트 1 */}
            <div className="set-box">
              <div className="set-header">
                <label className="form-label set-header-label">{t('set')} 1</label>
              </div>
              <div className="form-group form-group-spaced">
                <label className="form-label">{t('runningTime')}</label>
                <input
                  type="number"
                  className="form-input full-width"
                  value={settings.runningMinutes}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && settings.runningMinutes === 0) {
                      e.preventDefault()
                    } else if (settings.runningMinutes === 0 && /^[0-9]$/.test(e.key)) {
                      // 0 상태에서 숫자 입력 시 바로 교체
                      e.preventDefault()
                      setSettings({ ...settings, runningMinutes: parseInt(e.key) })
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    setSettings({ ...settings, runningMinutes: val })
                  }}
                  min="0"
                />
              </div>
              <div className="form-group form-group-spaced">
                <label className="form-label">{t('walkingTime')}</label>
                <input
                  type="number"
                  className="form-input full-width"
                  value={settings.walkingMinutes}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && settings.walkingMinutes === 0) {
                      e.preventDefault()
                    } else if (settings.walkingMinutes === 0 && /^[0-9]$/.test(e.key)) {
                      // 0 상태에서 숫자 입력 시 바로 교체
                      e.preventDefault()
                      setSettings({ ...settings, walkingMinutes: parseInt(e.key) })
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    setSettings({ ...settings, walkingMinutes: val })
                  }}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('setsLabel')}</label>
                <input
                  type="number"
                  className="form-input full-width"
                  value={settings.set1Repeat}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && settings.set1Repeat === 1) {
                      e.preventDefault()
                    } else if (settings.set1Repeat === 1 && /^[0-9]$/.test(e.key)) {
                      // 1 상태에서 숫자 입력 시 바로 교체
                      e.preventDefault()
                      const newVal = parseInt(e.key)
                      if (newVal >= 1) {
                        setSettings({ ...settings, set1Repeat: newVal })
                      }
                    } else if (e.key === '0' && settings.set1Repeat === 1) {
                      e.preventDefault()
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 1 : parseInt(e.target.value) || 1
                    setSettings({ ...settings, set1Repeat: Math.max(1, val) })
                  }}
                  min="1"
                />
              </div>
            </div>
            
            {/* 추가된 세트들 */}
            {setTimes.map((setTime, index) => (
              <div key={index} className="set-box">
                <div className="set-header">
                  <label className="form-label set-header-label">{t('set')} {index + 2}</label>
                  <button 
                    className="add-btn delete-btn-small" 
                    onClick={() => {
                      const newSetTimes = setTimes.filter((_, i) => i !== index)
                      setSetTimes(newSetTimes)
                    }}
                  >
                    {t('delete')}
                  </button>
                </div>
                <div className="form-group form-group-spaced">
                  <label className="form-label">{t('runningTime')}</label>
                  <input
                    type="number"
                    className="form-input full-width"
                    value={setTime.running}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && setTime.running === 0) {
                        e.preventDefault()
                      } else if (setTime.running === 0 && /^[0-9]$/.test(e.key)) {
                        // 0 상태에서 숫자 입력 시 바로 교체
                        e.preventDefault()
                        const newSetTimes = [...setTimes]
                        newSetTimes[index].running = parseInt(e.key)
                        setSetTimes(newSetTimes)
                      }
                    }}
                    onChange={(e) => {
                      const newSetTimes = [...setTimes]
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      newSetTimes[index].running = val
                      setSetTimes(newSetTimes)
                    }}
                    min="0"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">{t('walkingTime')}</label>
                  <input
                    type="number"
                    className="form-input full-width"
                    value={setTime.walking}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && setTime.walking === 0) {
                        e.preventDefault()
                      } else if (setTime.walking === 0 && /^[0-9]$/.test(e.key)) {
                        // 0 상태에서 숫자 입력 시 바로 교체
                        e.preventDefault()
                        const newSetTimes = [...setTimes]
                        newSetTimes[index].walking = parseInt(e.key)
                        setSetTimes(newSetTimes)
                      }
                    }}
                    onChange={(e) => {
                      const newSetTimes = [...setTimes]
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      newSetTimes[index].walking = val
                      setSetTimes(newSetTimes)
                    }}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('repeat')}</label>
                  <input
                    type="number"
                    className="form-input full-width"
                    value={setTime.repeat || 1}
                    onKeyDown={(e) => {
                      const currentRepeat = setTime.repeat || 1
                      if (e.key === 'Backspace' && currentRepeat === 1) {
                        e.preventDefault()
                      } else if (currentRepeat === 1 && /^[0-9]$/.test(e.key)) {
                        // 1 상태에서 숫자 입력 시 바로 교체
                        e.preventDefault()
                        const newVal = parseInt(e.key)
                        if (newVal >= 1) {
                          const newSetTimes = [...setTimes]
                          newSetTimes[index].repeat = newVal
                          setSetTimes(newSetTimes)
                        }
                      } else if (e.key === '0' && currentRepeat === 1) {
                        e.preventDefault()
                      }
                    }}
                    onChange={(e) => {
                      const newSetTimes = [...setTimes]
                      const val = e.target.value === '' ? 1 : parseInt(e.target.value) || 1
                      newSetTimes[index].repeat = Math.max(1, val)
                      setSetTimes(newSetTimes)
                    }}
                    min="1"
                  />
                </div>
              </div>
            ))}
            
            <div className="form-group">
              <label className="form-label form-label-spaced">{t('cooldown')} ({t('minutes')})</label>
              <input
                type="number"
                className="form-input full-width"
                value={settings.cooldownMinutes}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && settings.cooldownMinutes === 0) {
                    e.preventDefault()
                  } else if (settings.cooldownMinutes === 0 && /^[0-9]$/.test(e.key)) {
                    // 0 상태에서 숫자 입력 시 바로 교체
                    e.preventDefault()
                    setSettings({ ...settings, cooldownMinutes: parseInt(e.key) })
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                  setSettings({ ...settings, cooldownMinutes: val })
                }}
                min="0"
              />
            </div>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="time-display countdown">
            {countdown}
          </div>
        )}

        {phase !== 'idle' && phase !== 'countdown' && (
          <>
            <div className="time-display">{formatTime(time)}</div>
            <div className="phase-display">
              <div className="phase-name">
                {getPhaseName()}
              </div>
              <div className="phase-time">
                {formatTime(phaseTime)} / {formatMinutes(getPhaseTarget())}
              </div>
              <div className="calories-display">
                🔥 {getRealtimeCalories()} kcal
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getPhaseProgress()}%` }}
                />
              </div>
            </div>
          </>
        )}

        <div className="stopwatch-controls">
          {phase === 'idle' ? (
            <>
              <button className="add-btn flex-1" onClick={openAddSetModal}>
                {t('addSet')}
              </button>
              <button className="add-btn flex-1" onClick={() => start()}>
                {t('startRunning')}
              </button>
            </>
          ) : phase === 'countdown' ? (
            <div className="countdown-text">
              {language === 'ko' ? '준비 중...' : 'Preparing...'}
            </div>
          ) : isRunning ? (
            <button className="add-btn flex-1" onClick={pause}>
              {t('pause')}
            </button>
          ) : (
            <button className="add-btn flex-1" onClick={resume}>
              {t('resume')}
            </button>
          )}
          {phase !== 'idle' && phase !== 'countdown' && (
            <>
              <button className="add-btn flex-1" onClick={addSet}>
                {t('addSet')}
              </button>
              <button className="add-btn flex-1" onClick={endRunning}>
                {t('endRunning')}
              </button>
            </>
          )}
        </div>

        {/* 루틴 전체 목록 */}
        {phase !== 'idle' && (
          <div className="routine-list-section">
            <h3 className="section-title center">
              {language === 'ko' ? '전체 루틴' : 'All Routines'}
            </h3>
            <div className="routine-list">
              {routines.map((routine) => {
                const isCompleted = completedRoutines.has(routine.id)
                const isCurrent = phase !== 'idle' && phase !== 'countdown' && 
                  ((routine.type === 'warmup' && phase === 'warmup') ||
                   (routine.type === 'running' && phase === 'running' && routine.setGroup === currentSetGroup && routine.repeat === currentRepeat) ||
                   (routine.type === 'walking' && phase === 'walking' && routine.setGroup === currentSetGroup && routine.repeat === currentRepeat) ||
                   (routine.type === 'cooldown' && phase === 'cooldown'))
                
                return (
                  <div
                    key={routine.id}
                    className={`routine-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    onClick={() => {
                      if (phase === 'idle' || phase === 'countdown') {
                        start(routine)
                      } else if (phase !== 'idle' && phase !== 'countdown' && !isCompleted) {
                        // 운동 중에는 해당 루틴으로 바로 전환
                        jumpToRoutine(routine)
                      }
                    }}
                  >
                    <span>{routine.name}</span>
                    <span>{routine.duration}{t('minutes')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="history-section">
            <h3 className="section-title">{t('history')}</h3>
            <div className="history-list">
              {history.map((item, index) => (
                <div 
                  key={index} 
                  className="history-item"
                  onClick={() => {
                    setSelectedHistory(item)
                    setShowHistoryModal(true)
                  }}
                >
                  <span>{item.sets}{language === 'ko' ? '세트' : ' sets'}</span>
                  <span>{formatTime(item.totalTime)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 세트 추가 모달 */}
      {showAddSetModal && (
        <div className="modal-overlay" onClick={() => setShowAddSetModal(false)}>
          <div className="modal-content modal-content-form" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {t('addSet')}
            </h2>
            <div className="form-group form-group-spaced">
              <label className="form-label">{t('runningTime')}</label>
              <input
                type="number"
                className="form-input full-width"
                value={newSetRunning}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && newSetRunning === 0) {
                    e.preventDefault()
                  } else if (newSetRunning === 0 && /^[0-9]$/.test(e.key)) {
                    // 0 상태에서 숫자 입력 시 바로 교체
                    e.preventDefault()
                    setNewSetRunning(parseInt(e.key))
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                  setNewSetRunning(val)
                }}
                min="0"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">{t('walkingTime')}</label>
              <input
                type="number"
                className="form-input full-width"
                value={newSetWalking}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && newSetWalking === 0) {
                    e.preventDefault()
                  } else if (newSetWalking === 0 && /^[0-9]$/.test(e.key)) {
                    // 0 상태에서 숫자 입력 시 바로 교체
                    e.preventDefault()
                    setNewSetWalking(parseInt(e.key))
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                  setNewSetWalking(val)
                }}
                min="0"
              />
            </div>
            <div className="form-group form-group-spaced">
              <label className="form-label">{t('repeat')}</label>
              <input
                type="number"
                className="form-input full-width"
                value={newSetRepeat}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && newSetRepeat === 1) {
                    e.preventDefault()
                  } else if (newSetRepeat === 1 && /^[0-9]$/.test(e.key)) {
                    // 1 상태에서 숫자 입력 시 바로 교체
                    e.preventDefault()
                    const newVal = parseInt(e.key)
                    if (newVal >= 1) {
                      setNewSetRepeat(newVal)
                    }
                  } else if (e.key === '0' && newSetRepeat === 1) {
                    e.preventDefault()
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value === '' ? 1 : parseInt(e.target.value) || 1
                  setNewSetRepeat(Math.max(1, val))
                }}
                min="1"
              />
            </div>
            <div className="modal-button-group">
              <button className="add-btn flex-1" onClick={() => setShowAddSetModal(false)}>
                {t('cancel')}
              </button>
              <button className="add-btn flex-1" onClick={confirmAddSet}>
                {t('add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 러닝 끝내기 모달 */}
      {showEndModal && (
        <div className="modal-overlay" onClick={closeEndModal}>
          <div className="modal-content modal-content-centered" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title modal-title-left">
              {t('runningComplete')}
            </h2>
            <div className="modal-body">
              <div className="modal-result-time">
                {(() => {
                  const totalMinutes = Math.floor(time / 60000)
                  const totalSeconds = Math.floor((time % 60000) / 1000)
                  return language === 'ko' 
                    ? `${totalMinutes}${t('minutes')} ${totalSeconds}${language === 'ko' ? '초' : 'sec'} ${language === 'ko' ? '뛰었습니다!' : 'ran!'}`
                    : `${totalMinutes}${t('minutes')} ${totalSeconds}${language === 'ko' ? '초' : 'sec'} ${language === 'ko' ? '뛰었습니다!' : 'ran!'}`
                })()}
              </div>
              <div className="modal-result-calories">
                {language === 'ko' ? '총' : 'Total'} {getActualCalories(Math.floor(time / 60000) + (Math.floor((time % 60000) / 1000) / 60))} {t('calories')} {language === 'ko' ? '를 태웠습니다!' : 'burned!'}
              </div>
            </div>
            <button className="add-btn full-width" onClick={closeEndModal}>
              {t('confirm')}
            </button>
          </div>
        </div>
      )}

      {/* 기록 상세 모달 */}
      {showHistoryModal && selectedHistory && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-content-centered" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title modal-title-left">
              {t('runningHistory')}
            </h2>
            <div className="modal-body">
              <div className="history-detail-box">
                {selectedHistory.date && (
                  <div className="history-detail-item">
                    <strong className="history-detail-label">{language === 'ko' ? '날짜' : 'Date'}:</strong> {(() => {
                      const date = new Date(selectedHistory.date)
                      const year = date.getFullYear()
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const day = String(date.getDate()).padStart(2, '0')
                      const hours = String(date.getHours()).padStart(2, '0')
                      const minutes = String(date.getMinutes()).padStart(2, '0')
                      return language === 'ko' 
                        ? `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`
                        : `${year}-${month}-${day} ${hours}:${minutes}`
                    })()}
                  </div>
                )}
                <div className="history-detail-item">
                  <strong className="history-detail-label">{t('exerciseTime')}:</strong> {(() => {
                    const totalMinutes = Math.floor(selectedHistory.totalTime / 60000)
                    const totalSeconds = Math.floor((selectedHistory.totalTime % 60000) / 1000)
                    return language === 'ko' 
                      ? `${totalMinutes}${t('minutes')} ${totalSeconds}${language === 'ko' ? '초' : 'sec'}`
                      : `${totalMinutes}${t('minutes')} ${totalSeconds}${language === 'ko' ? '초' : 'sec'}`
                  })()}
                </div>
                <div className="history-detail-item">
                  <strong className="history-detail-label">{language === 'ko' ? '세트 수' : 'Sets'}:</strong> {selectedHistory.sets}{language === 'ko' ? '세트' : ' sets'}
                </div>
                <div className="history-detail-item">
                  <strong className="history-detail-label">{language === 'ko' ? '소모 칼로리' : 'Burned Calories'}:</strong> {(() => {
                    if (selectedHistory.calories !== undefined) {
                      return `${selectedHistory.calories} kcal`
                    }
                    // 기존 기록의 경우 칼로리 계산
                    const totalMinutes = Math.floor(selectedHistory.totalTime / 60000) + 
                                       (Math.floor((selectedHistory.totalTime % 60000) / 1000) / 60)
                    return `${getActualCalories(totalMinutes)} kcal`
                  })()}
                </div>
              </div>
            </div>
            <button 
              className="add-btn full-width" 
              onClick={() => setShowHistoryModal(false)}
            >
              {t('confirm')}
            </button>
          </div>
        </div>
      )}

      <BottomMenu />
    </div>
  )
}

export default RunningStopwatch
