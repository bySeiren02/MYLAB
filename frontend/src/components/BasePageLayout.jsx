import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import BottomMenu from './BottomMenu'
import AppBrandMark from './AppBrandMark'
import { getStorage, setStorage } from '../utils/storage'
import { applyUiSettings, FONT_OPTIONS, THEME_PRESETS } from '../utils/theme'
import { APP_ICON_VARIANTS, appIconMarkHex, syncNativeAppIcon } from '../utils/appIcon'
import { getTitleFavorites, MAX_TITLE_FAVORITES, setTitleFavorites } from '../utils/eventTitleFavorites'
import { getEventCategories, setEventCategories } from '../utils/eventCategories'
import {
  dispatchCategoriesPreview,
  dispatchFavoritesPreview,
  dispatchSettingsPreviewDiscard,
} from '../utils/settingsPreview'
import './BasePage.css'

const DEFAULT_UI_SETTINGS = {
  theme: 'blackpink',
  fontSize: 16,
  fontFamily: 'pretendard',
  appIconVariant: 'default',
}

const normalizeUiSettings = (raw) => ({
  ...DEFAULT_UI_SETTINGS,
  ...(raw && typeof raw === 'object' ? raw : {}),
})

export default function BasePageLayout() {
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [settingsSection, setSettingsSection] = useState('menu')
  const currentUser = getStorage('current_user', null)
  const [draft, setDraft] = useState(() => normalizeUiSettings(getStorage('ui_settings', null)))
  const uiSnapshotRef = useRef(null)
  const [eventFavList, setEventFavList] = useState([])
  const [eventFavDraft, setEventFavDraft] = useState('')
  const [categoryDraft, setCategoryDraft] = useState(() => getEventCategories())

  useEffect(() => {
    const ui = normalizeUiSettings(getStorage('ui_settings', null))
    applyUiSettings(ui)
    void syncNativeAppIcon(ui.appIconVariant || 'default')
  }, [])

  useEffect(() => {
    if (!showSettings) return
    applyUiSettings(draft)
  }, [draft, showSettings])

  useEffect(() => {
    if (!showSettings) return
    dispatchCategoriesPreview(categoryDraft)
  }, [categoryDraft, showSettings])

  useEffect(() => {
    if (!showSettings) return
    dispatchFavoritesPreview(eventFavList)
  }, [eventFavList, showSettings])

  const closeSettings = () => {
    setShowSettings(false)
    setSettingsSection('menu')
  }

  const cancelSettings = () => {
    if (uiSnapshotRef.current) {
      applyUiSettings(uiSnapshotRef.current)
      void syncNativeAppIcon(uiSnapshotRef.current.appIconVariant || 'default')
    }
    dispatchSettingsPreviewDiscard()
    closeSettings()
  }

  const saveSettings = async () => {
    const next = normalizeUiSettings(draft)
    setStorage('ui_settings', next)
    setDraft(next)
    applyUiSettings(next)
    await syncNativeAppIcon(next.appIconVariant || 'default')
    setTitleFavorites(eventFavList)
    setEventCategories(categoryDraft)
    dispatchSettingsPreviewDiscard()
    closeSettings()
  }

  const openSettings = () => {
    const ui = normalizeUiSettings(getStorage('ui_settings', null))
    uiSnapshotRef.current = { ...ui }
    setDraft(ui)
    setEventFavList([...getTitleFavorites()])
    setEventFavDraft('')
    setCategoryDraft(getEventCategories().map((c) => ({ ...c })))
    setSettingsSection('menu')
    setShowSettings(true)
  }

  const addEventFavorite = () => {
    const t = eventFavDraft.trim()
    if (!t) return
    if (eventFavList.length >= MAX_TITLE_FAVORITES) return
    if (eventFavList.includes(t)) {
      setEventFavDraft('')
      return
    }
    setEventFavList([...eventFavList, t])
    setEventFavDraft('')
  }

  const removeEventFavorite = (title) => {
    setEventFavList(eventFavList.filter((x) => x !== title))
  }

  const logout = () => {
    setStorage('current_user', null)
    navigate('/login', { replace: true })
  }

  const sectionTitles = {
    appearance: '화면',
    favorites: '일정 즐겨찾기',
    categories: '일정 카테고리',
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <div className="top-user-bar">
          <div className="top-user-bar__left">
            <AppBrandMark size={40} />
            <div className="top-user-title">
              {currentUser?.nickname || 'Guest'}
              {"'s 홈"}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={openSettings}>
              설정
            </button>
            <button type="button" className="btn btn-danger" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>
        <div className="app-page">
          <Outlet />
        </div>
      </main>
      <BottomMenu />

      {showSettings && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
            {settingsSection === 'menu' ? (
              <h2 className="settings-menu-title">설정</h2>
            ) : (
              <div className="settings-sub-head">
                <button type="button" className="btn btn-secondary btn-uniform" onClick={() => setSettingsSection('menu')}>
                  ← 뒤로
                </button>
                <h2>{sectionTitles[settingsSection]}</h2>
              </div>
            )}

            <div className="settings-modal-body">
              {settingsSection === 'menu' && (
                <nav className="settings-nav-list" aria-label="설정 메뉴">
                  <button type="button" className="settings-nav-item" onClick={() => setSettingsSection('appearance')}>
                    <span>화면 · 테마 · 글꼴</span>
                    <span className="settings-nav-chevron" aria-hidden>
                      ›
                    </span>
                  </button>
                  <button type="button" className="settings-nav-item" onClick={() => setSettingsSection('favorites')}>
                    <span>일정 즐겨찾기</span>
                    <span className="settings-nav-chevron" aria-hidden>
                      ›
                    </span>
                  </button>
                  <button type="button" className="settings-nav-item" onClick={() => setSettingsSection('categories')}>
                    <span>일정 카테고리</span>
                    <span className="settings-nav-chevron" aria-hidden>
                      ›
                    </span>
                  </button>
                </nav>
              )}

              {settingsSection === 'appearance' && (
                <>
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
                  <div className="form-group settings-font-size">
                    <div className="settings-font-size__head">
                      <span className="settings-font-size__title">글씨 크기</span>
                      <span className="settings-font-size__badge">
                        {draft.fontSize % 1 === 0 ? draft.fontSize : draft.fontSize.toFixed(1)}px
                      </span>
                    </div>
                    <div className="settings-font-size__sliderWrap">
                      <input
                        type="range"
                        className="settings-font-size__range"
                        min={12}
                        max={22}
                        step={0.5}
                        value={draft.fontSize}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            fontSize: Math.round(Number(e.target.value) * 2) / 2,
                          })
                        }
                        aria-valuemin={12}
                        aria-valuemax={22}
                        aria-valuenow={draft.fontSize}
                        aria-label="글씨 크기"
                        style={{
                          ['--font-size-fill']: `${((draft.fontSize - 12) / 10) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>앱 아이콘 색 (ML 마크 · iOS 홈 화면)</label>
                    <div className="settings-app-icon-grid" role="list">
                      {APP_ICON_VARIANTS.map((v) => {
                        const active = (draft.appIconVariant || 'default') === v.id
                        return (
                          <button
                            key={v.id}
                            type="button"
                            role="listitem"
                            className={`settings-app-icon-btn ${active ? 'active' : ''}`}
                            onClick={() => setDraft({ ...draft, appIconVariant: v.id })}
                          >
                            <span
                              className="settings-app-icon-swatch"
                              style={{ background: appIconMarkHex(v.id) }}
                            />
                            <span>{v.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    <p className="settings-app-icon-hint">
                      앱 상단 ML 마크는 즉시 반영됩니다. iOS 홈 화면 아이콘은 저장 후 적용되며, 일부 기기에서는 잠시 캐시될 수 있습니다. (웹 브라우저에서는 홈 아이콘이 바뀌지 않을 수 있어요.)
                    </p>
                  </div>
                </>
              )}

              {settingsSection === 'favorites' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>제목 빠른 선택 (최대 {MAX_TITLE_FAVORITES}개)</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={eventFavDraft}
                      onChange={(e) => setEventFavDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addEventFavorite()
                        }
                      }}
                      placeholder=""
                      style={{ flex: 1, minWidth: '8rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={eventFavList.length >= MAX_TITLE_FAVORITES}
                      onClick={addEventFavorite}
                    >
                      추가
                    </button>
                  </div>
                  {eventFavList.length === 0 ? (
                    <div />
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.35rem' }}>
                      {eventFavList.map((t) => (
                        <li
                          key={t}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                            padding: '0.4rem 0.55rem',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            background: 'var(--bg)',
                          }}
                        >
                          <span style={{ fontSize: '0.9rem' }}>{t}</span>
                          <button type="button" className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => removeEventFavorite(t)}>
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {settingsSection === 'categories' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>이름 · 색상</label>
                  <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.5rem' }}>
                    {categoryDraft.map((c, i) => (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.35rem 0.45rem',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          background: 'var(--bg)',
                        }}
                      >
                        <input
                          type="color"
                          aria-label={`${c.name || '카테고리'} 색상`}
                          value={c.color}
                          onChange={(e) => {
                            const next = [...categoryDraft]
                            next[i] = { ...next[i], color: e.target.value }
                            setCategoryDraft(next)
                          }}
                          style={{
                            width: 40,
                            height: 32,
                            padding: 0,
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: 'var(--surface)',
                          }}
                        />
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => {
                            const next = [...categoryDraft]
                            next[i] = { ...next[i], name: e.target.value }
                            setCategoryDraft(next)
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '0.45rem 0.55rem',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            font: 'inherit',
                            fontSize: '0.9rem',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="settings-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cancelSettings}>
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
