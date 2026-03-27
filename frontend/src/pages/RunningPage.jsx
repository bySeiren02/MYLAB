import { useEffect, useRef, useState } from 'react'
import { getStorage, setStorage } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'

function formatMs(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export default function RunningPage() {
  const { dateKey } = useDateNavigation()
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(null)
  const tick = useRef(null)

  useEffect(() => {
    setLogs(getStorage(`running_${dateKey}`, []))
  }, [dateKey])

  const persist = (next) => {
    setStorage(`running_${dateKey}`, next)
    setLogs(next)
  }

  useEffect(() => {
    if (!running) return undefined
    tick.current = window.setInterval(() => {
      if (startedAt.current) setElapsed(Date.now() - startedAt.current)
    }, 200)
    return () => window.clearInterval(tick.current)
  }, [running])

  const start = () => {
    startedAt.current = Date.now()
    setElapsed(0)
    setRunning(true)
  }

  const stop = () => {
    setRunning(false)
    if (!startedAt.current) return
    const durationMs = Date.now() - startedAt.current
    startedAt.current = null
    const memo = window.prompt('메모(선택)') || ''
    persist([
      ...logs,
      {
        id: Date.now(),
        durationMs,
        memo,
        createdAt: new Date().toISOString(),
      },
    ])
    setElapsed(0)
  }

  const remove = (id) => persist(logs.filter((l) => l.id !== id))

  return (
    <div>
      <div className="page-title-row">
        <h1>러닝</h1>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: 1 }}>{formatMs(elapsed)}</div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {!running ? (
            <button type="button" className="btn btn-primary" onClick={start}>
              시작
            </button>
          ) : (
            <button type="button" className="btn btn-danger" onClick={stop}>
              종료 & 저장
            </button>
          )}
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>오늘({dateKey}) 기록에 저장됩니다.</div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '1rem' }}>
          저장된 러닝이 없습니다.
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          {logs.map((l) => (
            <div key={l.id} className="item-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{formatMs(l.durationMs)}</div>
                {l.memo && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{l.memo}</div>}
              </div>
              <button type="button" className="btn btn-danger" onClick={() => remove(l.id)}>
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
