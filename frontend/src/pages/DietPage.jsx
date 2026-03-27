import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { getStorage, setStorage, listStorageKeysByPrefix } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'
import RunningMap from '../components/RunningMap'

const MEAL_TYPES = [
  { key: 'breakfast', label: '아침' },
  { key: 'lunch', label: '점심' },
  { key: 'snack', label: '간식' },
  { key: 'dinner', label: '저녁' },
]

const RUN_IDLE = 'idle'
const RUN_RUNNING = 'running'
const RUN_PAUSED = 'paused'
const RUN_AUTO_PAUSED = 'auto_paused'
const DEFAULT_KCAL_PER_REP = 0.35
const EXERCISE_KCAL_RULES = [
  { keywords: ['스쿼트', 'squat'], kcalPerRep: 0.5 },
  { keywords: ['런지', 'lunge'], kcalPerRep: 0.45 },
  { keywords: ['푸쉬업', 'push', 'push-up'], kcalPerRep: 0.4 },
  { keywords: ['버피', 'burpee'], kcalPerRep: 0.8 },
  { keywords: ['플랭크', 'plank'], kcalPerRep: 0.3 },
  { keywords: ['크런치', '윗몸', 'crunch', 'sit-up'], kcalPerRep: 0.25 },
  { keywords: ['점핑잭', 'jumping jack'], kcalPerRep: 0.35 },
]

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function haversineMeters(a, b) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

function buildMockRoutePoints(distanceKm = 3, start = { lat: 37.5665, lng: 126.978 }) {
  const pointCount = 60
  const distanceM = Math.max(0.5, Number(distanceKm) || 3) * 1000
  const circumference = distanceM
  const radiusM = Math.max(60, circumference / (2 * Math.PI))
  const metersPerDegLat = 111320
  const metersPerDegLng = 111320 * Math.cos((start.lat * Math.PI) / 180)
  const now = Date.now()
  const points = []

  for (let i = 0; i <= pointCount; i += 1) {
    const theta = (i / pointCount) * Math.PI * 2
    const lat = start.lat + (Math.sin(theta) * radiusM) / metersPerDegLat
    const lng = start.lng + (Math.cos(theta) * radiusM) / metersPerDegLng
    points.push({
      lat,
      lng,
      ts: now + i * 5000,
      accuracy: 8,
    })
  }

  return points
}

function getEstimatedKcalPerRep(exerciseName) {
  const lower = String(exerciseName || '').trim().toLowerCase()
  if (!lower) return DEFAULT_KCAL_PER_REP
  const matched = EXERCISE_KCAL_RULES.find((rule) =>
    rule.keywords.some((kw) => lower.includes(String(kw).toLowerCase())),
  )
  return matched?.kcalPerRep ?? DEFAULT_KCAL_PER_REP
}

export default function DietPage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()

  const [weight, setWeight] = useState('')
  const [mealsByType, setMealsByType] = useState({ breakfast: [], lunch: [], snack: [], dinner: [] })
  const [exerciseEntries, setExerciseEntries] = useState([])
  const [exerciseRoutines, setExerciseRoutines] = useState([])
  const [runningLogs, setRunningLogs] = useState([])

  const [showRoutineModal, setShowRoutineModal] = useState(false)
  const [newRoutineName, setNewRoutineName] = useState('')
  const [routineItems, setRoutineItems] = useState([{ id: Date.now(), name: '', reps: '' }])
  const [showRoutinePicker, setShowRoutinePicker] = useState(false)

  const [runState, setRunState] = useState(RUN_IDLE)
  const [runElapsedMs, setRunElapsedMs] = useState(0)
  const [runDistanceM, setRunDistanceM] = useState(0)
  const [runCurrentPos, setRunCurrentPos] = useState(null)
  const [runError, setRunError] = useState('')
  const [runRoutePoints, setRunRoutePoints] = useState([])
  const [selectedRoutePoints, setSelectedRoutePoints] = useState([])
  const [selectedRunLog, setSelectedRunLog] = useState(null)
  const [showCaptureModal, setShowCaptureModal] = useState(false)

  const watchIdRef = useRef(null)
  const tickRef = useRef(null)
  const lastTickRef = useRef(null)
  const lastPosRef = useRef(null)
  const lastMoveTsRef = useRef(null)
  const routeRef = useRef([])
  const captureCardRef = useRef(null)

  useEffect(() => {
    const d = getStorage(`diet_${dateKey}`, {
      weight: '',
      mealsByType: { breakfast: [], lunch: [], snack: [], dinner: [] },
      exerciseEntries: [],
      meals: [],
      exercises: [],
    })

    setWeight(d.weight || '')

    if (d.mealsByType) {
      setMealsByType({
        breakfast: d.mealsByType.breakfast || [],
        lunch: d.mealsByType.lunch || [],
        snack: d.mealsByType.snack || [],
        dinner: d.mealsByType.dinner || [],
      })
    } else {
      const fallback = { breakfast: [], lunch: [], snack: [], dinner: [] }
      ;(d.meals || []).forEach((m, idx) => {
        const key = MEAL_TYPES[idx % 4].key
        fallback[key].push({ id: m.id || Date.now() + idx, name: m.name, calories: m.calories })
      })
      setMealsByType(fallback)
    }

    setExerciseEntries(d.exerciseEntries || d.exercises || [])
    const dayLogs = getStorage(`running_${dateKey}`, [])
    setRunningLogs(dayLogs)
    const latest = dayLogs[dayLogs.length - 1] || null
    setSelectedRunLog(latest)
    setSelectedRoutePoints(latest?.routePoints || [])
  }, [dateKey])

  useEffect(() => {
    setStorage(`diet_${dateKey}`, { weight, mealsByType, exerciseEntries })
  }, [dateKey, weight, mealsByType, exerciseEntries])

  useEffect(() => {
    setExerciseRoutines(getStorage('exercise_routines', []))
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [])

  const mealIntake = useMemo(() => {
    return Object.values(mealsByType)
      .flat()
      .reduce((sum, m) => sum + (Number(m.calories) || 0), 0)
  }, [mealsByType])

  const exerciseBurn = useMemo(() => {
    return exerciseEntries.reduce((sum, e) => sum + (Number(e.calories) || 0), 0)
  }, [exerciseEntries])

  const highlightDates = useMemo(() => {
    const dietDates = listStorageKeysByPrefix('diet_')
      .map((k) => k.replace('diet_', ''))
      .filter((dk) => {
        const d = getStorage(`diet_${dk}`, { weight: '', mealsByType: {}, exerciseEntries: [] })
        const hasMeals = d.mealsByType
          ? Object.values(d.mealsByType).flat().length > 0
          : (d.meals || []).length > 0
        const hasEx = (d.exerciseEntries || d.exercises || []).length > 0
        return hasMeals || hasEx || !!d.weight
      })
    const runningDates = listStorageKeysByPrefix('running_')
      .map((k) => k.replace('running_', ''))
      .filter((dk) => (getStorage(`running_${dk}`, []) || []).length > 0)
    return [...new Set([...dietDates, ...runningDates])]
  }, [dateKey, mealsByType, exerciseEntries, weight, runningLogs])

  const addMeal = (typeKey) => {
    const name = window.prompt(`${MEAL_TYPES.find((t) => t.key === typeKey)?.label} 음식 이름?`)
    if (!name) return
    const cal = Number(window.prompt('칼로리(kcal)?', '300') || '0')
    const next = {
      ...mealsByType,
      [typeKey]: [...(mealsByType[typeKey] || []), { id: Date.now(), name, calories: cal }],
    }
    setMealsByType(next)
  }

  const removeMeal = (typeKey, id) => {
    setMealsByType({
      ...mealsByType,
      [typeKey]: (mealsByType[typeKey] || []).filter((m) => m.id !== id),
    })
  }

  const toggleFasting = (typeKey) => {
    const list = mealsByType[typeKey] || []
    const hasFasting = list.some((m) => m.isFasting)
    const nextList = hasFasting
      ? list.filter((m) => !m.isFasting)
      : [...list.filter((m) => !m.isFasting), { id: Date.now(), name: '단식', calories: 0, isFasting: true }]
    setMealsByType({
      ...mealsByType,
      [typeKey]: nextList,
    })
  }

  const saveRoutine = () => {
    if (!newRoutineName.trim()) return
    const cleanedItems = routineItems
      .map((item) => ({
        id: item.id,
        name: String(item.name || '').trim(),
        reps: Number(item.reps || 0),
        kcalPerRep: getEstimatedKcalPerRep(item.name),
      }))
      .filter((item) => item.name && item.reps > 0)

    if (cleanedItems.length === 0) return

    const totalCalories = cleanedItems.reduce((sum, item) => sum + item.reps * item.kcalPerRep, 0)

    const newRoutine = {
      id: Date.now(),
      name: newRoutineName.trim(),
      calories: totalCalories,
      items: cleanedItems,
    }
    const next = [...exerciseRoutines, newRoutine]
    setStorage('exercise_routines', next)
    setExerciseRoutines(next)
    setNewRoutineName('')
    setRoutineItems([{ id: Date.now() + 1, name: '', reps: '' }])
    setShowRoutineModal(false)
  }

  const addExerciseFromRoutine = (routine) => {
    const next = [
      ...exerciseEntries,
      {
        id: Date.now(),
        routineId: routine.id,
        name: routine.name,
        calories: routine.calories || 0,
        routineItems: routine.items || [],
      },
    ]
    setExerciseEntries(next)
    setShowRoutinePicker(false)
  }

  const deleteExercise = (id) => {
    setExerciseEntries(exerciseEntries.filter((e) => e.id !== id))
  }

  const startTick = () => {
    if (tickRef.current) window.clearInterval(tickRef.current)
    lastTickRef.current = Date.now()
    tickRef.current = window.setInterval(() => {
      if (runState !== RUN_RUNNING) return
      const now = Date.now()
      const prev = lastTickRef.current || now
      setRunElapsedMs((v) => v + (now - prev))
      lastTickRef.current = now
    }, 250)
  }

  const stopAllTrackers = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  const handlePosition = (pos) => {
    const point = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      ts: pos.timestamp,
      accuracy: pos.coords.accuracy,
    }
    setRunCurrentPos(point)

    if (point.accuracy && point.accuracy > 60) return

    const last = lastPosRef.current
    if (!last) {
      lastPosRef.current = point
      lastMoveTsRef.current = point.ts
      routeRef.current = [point]
      setRunRoutePoints([point])
      return
    }

    const moveM = haversineMeters(last, point)

    if (moveM >= 2) {
      if (runState === RUN_AUTO_PAUSED) {
        setRunState(RUN_RUNNING)
        lastTickRef.current = Date.now()
      }
      if (runState === RUN_RUNNING) {
        setRunDistanceM((v) => v + moveM)
      }
      lastMoveTsRef.current = point.ts
      lastPosRef.current = point
      routeRef.current = [...routeRef.current, point]
      setRunRoutePoints(routeRef.current)
      return
    }

    if (runState === RUN_RUNNING) {
      const stagnantMs = point.ts - (lastMoveTsRef.current || point.ts)
      if (stagnantMs >= 3000) {
        setRunState(RUN_AUTO_PAUSED)
      }
    }

    lastPosRef.current = point
  }

  const startRun = () => {
    if (!navigator.geolocation) {
      setRunError('이 기기/브라우저는 위치 추적을 지원하지 않습니다.')
      return
    }
    setRunError('')
    setRunState(RUN_RUNNING)
    setRunElapsedMs(0)
    setRunDistanceM(0)
    setRunCurrentPos(null)
    lastPosRef.current = null
    lastMoveTsRef.current = null
    routeRef.current = []
    setRunRoutePoints([])
    setSelectedRoutePoints([])
    setSelectedRunLog(null)

    startTick()

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        setRunError(err.message || '위치 권한 또는 GPS 오류가 발생했습니다.')
        setRunState(RUN_PAUSED)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    )
  }

  const pauseRun = () => {
    if (runState === RUN_RUNNING || runState === RUN_AUTO_PAUSED) {
      setRunState(RUN_PAUSED)
    }
  }

  const resumeRun = () => {
    if (runState === RUN_PAUSED || runState === RUN_AUTO_PAUSED) {
      setRunState(RUN_RUNNING)
      lastTickRef.current = Date.now()
    }
  }

  const stopRunAndSave = () => {
    const distanceKm = runDistanceM / 1000
    const pace = distanceKm > 0 ? runElapsedMs / 60000 / distanceKm : 0
    const completedRoute = [...routeRef.current]
    const nextLogs = [
      ...runningLogs,
      {
        id: Date.now(),
        durationMs: runElapsedMs,
        distanceM: runDistanceM,
        paceMinPerKm: pace,
        endLocation: runCurrentPos,
        routeCount: completedRoute.length,
        routePoints: completedRoute,
        createdAt: new Date().toISOString(),
      },
    ]
    const newLog = nextLogs[nextLogs.length - 1]
    setStorage(`running_${dateKey}`, nextLogs)
    setRunningLogs(nextLogs)

    stopAllTrackers()
    setRunState(RUN_IDLE)
    setRunElapsedMs(0)
    setRunDistanceM(0)
    lastPosRef.current = null
    lastMoveTsRef.current = null
    routeRef.current = []
    setRunRoutePoints([])
    setSelectedRoutePoints(completedRoute)
    setSelectedRunLog(newLog)
  }

  const addMockRunLog = (distanceKm = 3) => {
    if (runState !== RUN_IDLE) return
    const mockRoute = buildMockRoutePoints(distanceKm)
    const distanceM = Math.max(0.5, Number(distanceKm) || 3) * 1000
    const paceMinPerKm = 6
    const durationMs = Math.round(distanceM / 1000 * paceMinPerKm * 60 * 1000)
    const lastPoint = mockRoute[mockRoute.length - 1]
    const newLog = {
      id: Date.now(),
      durationMs,
      distanceM,
      paceMinPerKm,
      endLocation: { lat: lastPoint.lat, lng: lastPoint.lng },
      routeCount: mockRoute.length,
      routePoints: mockRoute,
      createdAt: new Date().toISOString(),
      isMock: true,
    }
    const nextLogs = [...runningLogs, newLog]
    setStorage(`running_${dateKey}`, nextLogs)
    setRunningLogs(nextLogs)
    setSelectedRoutePoints(mockRoute)
    setSelectedRunLog(newLog)
    setRunCurrentPos(lastPoint)
  }

  const deleteRun = (id) => {
    const nextLogs = runningLogs.filter((l) => l.id !== id)
    setStorage(`running_${dateKey}`, nextLogs)
    setRunningLogs(nextLogs)
  }

  const downloadCaptureImage = async () => {
    if (!captureCardRef.current || !captureData) return
    try {
      const canvas = await html2canvas(captureCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      })
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      const datePart = new Date().toISOString().slice(0, 10)
      link.download = `running-capture-${datePart}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      window.alert('이미지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const distanceKm = runDistanceM / 1000
  const currentPace = distanceKm > 0 ? runElapsedMs / 60000 / distanceKm : 0
  const captureData = useMemo(() => {
    if (runState !== RUN_IDLE && runRoutePoints.length > 0) {
      return {
        title: '러닝 중',
        durationMs: runElapsedMs,
        distanceKm,
        paceMinPerKm: currentPace,
        routePoints: runRoutePoints,
      }
    }
    if (selectedRunLog && Array.isArray(selectedRunLog.routePoints) && selectedRunLog.routePoints.length > 0) {
      return {
        title: selectedRunLog.isMock ? '샘플 러닝' : '러닝 기록',
        durationMs: Number(selectedRunLog.durationMs || 0),
        distanceKm: Number(selectedRunLog.distanceM || 0) / 1000,
        paceMinPerKm: Number(selectedRunLog.paceMinPerKm || 0),
        routePoints: selectedRunLog.routePoints,
      }
    }
    return null
  }, [runState, runRoutePoints, runElapsedMs, distanceKm, currentPace, selectedRunLog])
  const routineTotalCalories = routineItems
    .reduce((sum, item) => sum + Number(item.reps || 0) * getEstimatedKcalPerRep(item.name), 0)

  const runningMonthStats = useMemo(() => {
    const ym = dateKey.slice(0, 7)
    const monthKeys = listStorageKeysByPrefix('running_').filter((k) => k.replace('running_', '').startsWith(ym))
    const all = monthKeys.flatMap((k) => getStorage(k, []))
    const totalDistanceM = all.reduce((sum, l) => sum + Number(l.distanceM || 0), 0)
    const totalDurationMs = all.reduce((sum, l) => sum + Number(l.durationMs || 0), 0)
    const totalDistanceKm = totalDistanceM / 1000
    const avgPace = totalDistanceKm > 0 ? totalDurationMs / 60000 / totalDistanceKm : 0
    const bestPace = all
      .map((l) => Number(l.paceMinPerKm || 0))
      .filter((p) => p > 0)
      .sort((a, b) => a - b)[0] || 0
    return {
      totalDistanceKm,
      totalDurationMs,
      avgPace,
      bestPace,
      sessionCount: all.length,
    }
  }, [dateKey, runningLogs])

  return (
    <div>
      <div className='page-title-row'>
        <h1>몸</h1>
      </div>

      <CompactCalendar currentDate={currentDate} selectedDate={currentDate} highlightDates={highlightDates} onDateChange={(d) => setCurrentDate(d)} />

      <div className='card'>
        <div className='form-group'>
          <label>체중(kg)</label>
          <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder='예: 62.4' />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <div>섭취 {mealIntake} kcal</div>
          <div>소모 {exerciseBurn} kcal</div>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>순 {mealIntake - exerciseBurn} kcal</div>
        </div>
      </div>

      <div className='page-title-row' style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem' }}>식사</h2>
      </div>
      <div className='card'>
        {MEAL_TYPES.map((t, idx) => (
          <div
            key={t.key}
            style={{
              paddingBottom: idx !== MEAL_TYPES.length - 1 ? '0.9rem' : 0,
              marginBottom: idx !== MEAL_TYPES.length - 1 ? '0.9rem' : 0,
              borderBottom: idx !== MEAL_TYPES.length - 1 ? '1px dashed var(--border)' : 'none',
            }}
          >
            {(() => {
              const hasFasting = (mealsByType[t.key] || []).some((m) => m.isFasting)
              return (
            <div className='page-title-row' style={{ marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>{t.label}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!hasFasting && (
                  <button type='button' className='btn btn-primary btn-uniform' onClick={() => addMeal(t.key)}>
                    추가
                  </button>
                )}
                <button type='button' className='btn btn-secondary btn-uniform' onClick={() => toggleFasting(t.key)}>
                  {hasFasting ? '취소' : '단식'}
                </button>
              </div>
            </div>
              )
            })()}
            {(mealsByType[t.key] || []).length === 0 ? (
              <div className='empty-state'>기록이 없습니다.</div>
            ) : (
              (mealsByType[t.key] || []).map((m) => (
                <div key={m.id} className='item-row'>
                  <span style={{ flex: 1 }}>
                    {m.name} · {m.calories}kcal
                  </span>
                  {!m.isFasting && (
                    <button type='button' className='btn btn-danger' onClick={() => removeMeal(t.key, m.id)}>
                      삭제
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <div className='page-title-row' style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem' }}>운동</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type='button' className='btn btn-secondary' onClick={() => setShowRoutineModal(true)}>
            루틴 만들기
          </button>
          <button type='button' className='btn btn-primary' onClick={() => setShowRoutinePicker(true)}>
            추가
          </button>
        </div>
      </div>
      {exerciseEntries.length === 0 ? (
        <div className='empty-state'>운동 기록이 없습니다.</div>
      ) : (
        exerciseEntries.map((e) => (
          <div key={e.id} className='item-row'>
            <div style={{ flex: 1 }}>
              <div>{e.name} · {e.calories}kcal</div>
              {Array.isArray(e.routineItems) && e.routineItems.length > 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {e.routineItems.map((it) => `${it.name} ${it.reps}회`).join(' / ')}
                </div>
              )}
            </div>
            <button type='button' className='btn btn-danger' onClick={() => deleteExercise(e.id)}>
              삭제
            </button>
          </div>
        ))
      )}

      <div className='page-title-row' style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem' }}>러닝</h2>
      </div>
      <div className='card'>
        <div style={{ display: 'grid', gap: '0.45rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{formatMs(runElapsedMs)}</div>
          <div style={{ color: 'var(--text)' }}>거리: {distanceKm.toFixed(2)} km</div>
          <div style={{ color: 'var(--text)' }}>현재 페이스: {currentPace > 0 ? `${currentPace.toFixed(2)} 분/km` : '-'} </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            현재 위치: {runCurrentPos ? `${runCurrentPos.lat.toFixed(6)}, ${runCurrentPos.lng.toFixed(6)}` : '측정 중...'}
          </div>
          <div style={{ color: runState === RUN_AUTO_PAUSED ? '#f97373' : 'var(--text-muted)', fontSize: '0.9rem' }}>
            상태: {runState === RUN_IDLE ? '대기' : runState === RUN_RUNNING ? '러닝 중' : runState === RUN_PAUSED ? '수동 일시정지' : '자동 일시정지(3초 정지 감지)'}
          </div>
          {runError && <div style={{ color: '#f97373', fontSize: '0.9rem' }}>{runError}</div>}
        </div>

        <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {runState === RUN_IDLE && (
            <button type='button' className='btn btn-primary' onClick={startRun}>
              시작
            </button>
          )}
          {runState === RUN_IDLE && (
            <button type='button' className='btn btn-secondary' onClick={() => addMockRunLog(3)}>
              샘플 3km
            </button>
          )}
          {(runState === RUN_RUNNING || runState === RUN_AUTO_PAUSED) && (
            <button type='button' className='btn btn-secondary' onClick={pauseRun}>
              일시정지
            </button>
          )}
          {(runState === RUN_PAUSED || runState === RUN_AUTO_PAUSED) && (
            <button type='button' className='btn btn-primary' onClick={resumeRun}>
              다시 시작
            </button>
          )}
          {runState !== RUN_IDLE && (
            <button type='button' className='btn btn-danger' onClick={stopRunAndSave}>
              종료 & 저장
            </button>
          )}
          <button type='button' className='btn btn-secondary' onClick={() => setShowCaptureModal(true)} disabled={!captureData}>
            캡처
          </button>
        </div>

        <div style={{ marginTop: '0.9rem' }}>
          <RunningMap currentPos={runCurrentPos} liveRoutePoints={runRoutePoints} selectedRoutePoints={selectedRoutePoints} />
        </div>
      </div>

      <div className='card'>
        <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{dateKey.slice(0, 7)} 러닝 통계</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.92rem' }}>
          <div>이번달 총 거리: {runningMonthStats.totalDistanceKm.toFixed(2)} km</div>
          <div>이번달 총 시간: {formatMs(runningMonthStats.totalDurationMs)}</div>
          <div>이번달 평균 페이스: {runningMonthStats.avgPace > 0 ? `${runningMonthStats.avgPace.toFixed(2)} 분/km` : '-'}</div>
          <div>이번달 최고 페이스: {runningMonthStats.bestPace > 0 ? `${runningMonthStats.bestPace.toFixed(2)} 분/km` : '-'}</div>
          <div>러닝 횟수: {runningMonthStats.sessionCount}회</div>
        </div>
      </div>

      {runningLogs.length === 0 ? (
        <div className='empty-state'>러닝 기록이 없습니다.</div>
      ) : (
        runningLogs.map((l) => (
          <div key={l.id} className='item-row'>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{formatMs(l.durationMs)} · {(Number(l.distanceM || 0) / 1000).toFixed(2)} km</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                평균 페이스: {l.paceMinPerKm ? `${Number(l.paceMinPerKm).toFixed(2)} 분/km` : '-'}
              </div>
              {l.isMock && <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>샘플 기록</div>}
              {l.endLocation && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  종료 위치: {Number(l.endLocation.lat).toFixed(6)}, {Number(l.endLocation.lng).toFixed(6)}
                </div>
              )}
            </div>
            <button type='button' className='btn btn-danger' onClick={() => deleteRun(l.id)}>
              삭제
            </button>
            {Array.isArray(l.routePoints) && l.routePoints.length > 1 && (
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() => {
                  setSelectedRoutePoints(l.routePoints)
                  setSelectedRunLog(l)
                }}
              >
                경로 보기
              </button>
            )}
          </div>
        ))
      )}

      {showCaptureModal && (
        <div className='modal-overlay' role='dialog' aria-modal='true'>
          <div className='modal' style={{ maxWidth: 640 }}>
            <h2 style={{ marginBottom: '0.75rem' }}>러닝 캡처 카드</h2>
            {!captureData ? (
              <div className='empty-state'>캡처할 러닝 데이터가 없습니다.</div>
            ) : (
              <div ref={captureCardRef} className='card' style={{ marginBottom: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <RunningMap currentPos={null} liveRoutePoints={[]} selectedRoutePoints={captureData.routePoints} />
                  <div
                    style={{
                      position: 'absolute',
                      right: '0.7rem',
                      bottom: '0.7rem',
                      zIndex: 4000,
                      background: 'rgba(17, 24, 39, 0.72)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 12,
                      padding: '0.55rem 0.65rem',
                      color: '#f9fafb',
                      minWidth: 168,
                      boxShadow: '0 8px 28px rgba(0, 0, 0, 0.28)',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', opacity: 0.9, marginBottom: '0.28rem' }}>{captureData.title}</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.45 }}>
                      <div>{captureData.distanceKm.toFixed(2)} km</div>
                      <div>{formatMs(captureData.durationMs)}</div>
                      <div>{captureData.paceMinPerKm > 0 ? `${captureData.paceMinPerKm.toFixed(2)} 분/km` : '-'}</div>
                    </div>
                    <div style={{ fontSize: '0.67rem', opacity: 0.78, marginTop: '0.25rem' }}>
                      {new Date().toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type='button' className='btn btn-primary' onClick={downloadCaptureImage} disabled={!captureData}>
                사진 저장
              </button>
              <button type='button' className='btn btn-secondary' onClick={() => setShowCaptureModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoutineModal && (
        <div className='modal-overlay' role='dialog' aria-modal='true'>
          <div className='modal'>
            <h2 style={{ marginBottom: '0.75rem' }}>운동 루틴 만들기</h2>
            <div className='form-group'>
              <label>루틴 이름</label>
              <input value={newRoutineName} onChange={(e) => setNewRoutineName(e.target.value)} placeholder='예: 하체 루틴' />
            </div>
            <div style={{ marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              운동 이름과 횟수만 입력하면, 운동명 기준으로 회당 칼로리를 자동 추정해 총 소모 칼로리를 계산합니다.
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {routineItems.map((item, idx) => (
                <div key={item.id} className='card' style={{ marginBottom: 0, padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong>운동 {idx + 1}</strong>
                    {routineItems.length > 1 && (
                      <button
                        type='button'
                        className='btn btn-danger'
                        onClick={() => setRoutineItems(routineItems.filter((x) => x.id !== item.id))}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <div className='form-group'>
                    <label>운동 이름</label>
                    <input
                      value={item.name}
                      onChange={(e) =>
                        setRoutineItems(
                          routineItems.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      placeholder='예: 스쿼트'
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className='form-group' style={{ marginBottom: 0 }}>
                      <label>횟수(회)</label>
                      <input
                        type='number'
                        value={item.reps}
                        onChange={(e) =>
                          setRoutineItems(
                            routineItems.map((x) => (x.id === item.id ? { ...x, reps: e.target.value } : x)),
                          )
                        }
                      />
                    </div>
                    <div className='form-group' style={{ marginBottom: 0 }}>
                      <label>자동 계산</label>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', paddingTop: '0.65rem' }}>
                        회당 {getEstimatedKcalPerRep(item.name).toFixed(2)}kcal
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    항목 소모: {(Number(item.reps || 0) * getEstimatedKcalPerRep(item.name)).toFixed(1)} kcal
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.65rem' }}>
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() =>
                  setRoutineItems([...routineItems, { id: Date.now() + Math.random(), name: '', reps: '' }])
                }
              >
                운동 항목 추가
              </button>
            </div>
            <div className='card' style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              <div style={{ fontWeight: 700 }}>루틴 총 예상 소모: {routineTotalCalories.toFixed(1)} kcal</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type='button' className='btn btn-secondary' onClick={() => setShowRoutineModal(false)}>
                취소
              </button>
              <button type='button' className='btn btn-primary' onClick={saveRoutine}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoutinePicker && (
        <div className='modal-overlay' role='dialog' aria-modal='true'>
          <div className='modal'>
            <h2 style={{ marginBottom: '0.75rem' }}>루틴 추가</h2>
            {exerciseRoutines.length === 0 ? (
              <div className='empty-state'>저장된 루틴이 없습니다. 먼저 루틴을 만들어 주세요.</div>
            ) : (
              exerciseRoutines.map((r) => (
                <div key={r.id} className='item-row'>
                  <div style={{ flex: 1 }}>
                    <div>{r.name} · {r.calories || 0}kcal</div>
                    {Array.isArray(r.items) && r.items.length > 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {r.items.map((it) => `${it.name} ${it.reps}회`).join(' / ')}
                      </div>
                    )}
                  </div>
                  <button type='button' className='btn btn-primary' onClick={() => addExerciseFromRoutine(r)}>
                    추가
                  </button>
                </div>
              ))
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button type='button' className='btn btn-secondary' onClick={() => setShowRoutinePicker(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
