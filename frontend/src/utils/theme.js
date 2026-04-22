import { appIconMarkHex } from './appIcon'

export const THEME_PRESETS = {
  blackpink: {
    label: '블랙핑크',
    vars: {
      '--bg': '#0f0f12',
      '--surface': '#1a1a1f',
      '--border': '#2d2d35',
      '--text': '#e8e8ed',
      '--text-muted': '#8b8b9a',
      '--primary': '#ff87a1',
      '--primary-hover': '#ff6385',
    },
  },
  ivorybrown: {
    label: '아이보리브라운',
    vars: {
      '--bg': '#f7f1e5',
      '--surface': '#fffaf0',
      '--border': '#d9c7a5',
      '--text': '#3f2f20',
      '--text-muted': '#7a6856',
      '--primary': '#8b5e3c',
      '--primary-hover': '#6f472a',
    },
  },
  allblack: {
    label: '올블랙',
    vars: {
      '--bg': '#000000',
      '--surface': '#0e0e0e',
      '--border': '#1f1f1f',
      '--text': '#f0f0f0',
      '--text-muted': '#9a9a9a',
      '--primary': '#5e5e5e',
      '--primary-hover': '#7a7a7a',
    },
  },
  gray: {
    label: '그레이',
    vars: {
      '--bg': '#2b2d31',
      '--surface': '#383b40',
      '--border': '#4a4d53',
      '--text': '#f2f2f3',
      '--text-muted': '#c3c4c7',
      '--primary': '#aeb4be',
      '--primary-hover': '#959ba5',
    },
  },
  allwhite: {
    label: '올화이트',
    vars: {
      '--bg': '#ffffff',
      '--surface': '#f8f8f8',
      '--border': '#e6e6e6',
      '--text': '#1f1f1f',
      '--text-muted': '#6f6f6f',
      '--primary': '#3a3a3a',
      '--primary-hover': '#1f1f1f',
    },
  },
  blackpurple: {
    label: '블랙퍼플',
    vars: {
      '--bg': '#100b16',
      '--surface': '#1b1326',
      '--border': '#2b1d40',
      '--text': '#efe7ff',
      '--text-muted': '#b9a9d8',
      '--primary': '#9f7aea',
      '--primary-hover': '#805ad5',
    },
  },
}

export const FONT_OPTIONS = [
  { id: 'pretendard', label: '프리텐다드', value: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  { id: 'notoSans', label: '노토산스', value: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  { id: 'nanumGothic', label: '나눔고딕', value: "'Nanum Gothic', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  { id: 'jua', label: '주아(귀여움)', value: "'Jua', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  { id: 'gaegu', label: '가우구(손글씨)', value: "'Gaegu', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  { id: 'hiMelody', label: '하이멜로디(동글)', value: "'Hi Melody', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  { id: 'gowunDodum', label: '고운돋움', value: "'Gowun Dodum', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  { id: 'nanumMyeongjo', label: '나눔명조', value: "'Nanum Myeongjo', serif" },
  { id: 'gothicA1', label: '고딕A1', value: "'Gothic A1', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
]

export function applyUiSettings(settings) {
  const root = document.documentElement
  const theme = THEME_PRESETS[settings.theme] || THEME_PRESETS.blackpink
  Object.entries(theme.vars).forEach(([k, v]) => {
    root.style.setProperty(k, v)
  })
  root.style.setProperty('--font-size-base', `${settings.fontSize || 16}px`)
  const font = FONT_OPTIONS.find((f) => f.id === settings.fontFamily) || FONT_OPTIONS[0]
  root.style.setProperty('--font-family-base', font.value)
  root.style.setProperty('--app-icon-mark', appIconMarkHex(settings.appIconVariant || 'default'))
}
