import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import BottomMenu from './BottomMenu'
import { getStorage, setStorage } from '../utils/storage'
import { applyUiSettings, FONT_OPTIONS, THEME_PRESETS } from '../utils/theme'
import './BasePage.css'

export default function BasePageLayout() {
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const currentUser = getStorage('current_user', null)
  const [draft, setDraft] = useState(() =>
    getStorage('ui_settings', {
      theme: 'blackpink',
      fontSize: 16,
      fontFamily: 'pretendard',
    }),
  )

  useEffect(() => {
    const settings = getStorage('ui_settings', {
      theme: 'blackpink',
      fontSize: 16,
      fontFamily: 'pretendard',
    })
    applyUiSettings(settings)
  }, [])

  const saveSettings = () => {
    setStorage('ui_settings', draft)
    applyUiSettings(draft)
    setShowSettings(false)
  }

  const logout = () => {
    setStorage('current_user', null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <div className="top-user-bar">
          <div className="top-user-title">
            {currentUser?.nickname || 'Guest'}
            {"'s 홈"}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(true)}>
              설정
            </button>
            <button type="button" className="btn btn-danger" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>
        <Outlet />
      </main>
      <BottomMenu />

      {showSettings && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ marginBottom: '0.9rem' }}>설정</h2>
            <div className="form-group">
              <label>테마</label>
              <select value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value })}>
                {Object.entries(THEME_PRESETS).map(([id, v]) => (
                  <option key={id} value={id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>글씨체</label>
              <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.35rem' }}>
                {FONT_OPTIONS.map((f) => {
                  const active = draft.fontFamily === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        fontFamily: f.value,
                      }}
                      onClick={() => setDraft({ ...draft, fontFamily: f.id })}
                    >
                      {f.label} - 가나다라마바사 ABC 123
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="form-group">
              <label>글씨 크기 ({draft.fontSize}px)</label>
              <input
                type="range"
                min="12"
                max="22"
                value={draft.fontSize}
                onChange={(e) => setDraft({ ...draft, fontSize: Number(e.target.value) })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={saveSettings}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
