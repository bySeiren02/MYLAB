import { AppIcon } from '@capacitor-community/app-icon'
import { Capacitor } from '@capacitor/core'

/** iOS 대체 아이콘 이름(Info.plist·Assets 이름과 동일) */
export const APP_ICON_VARIANTS = [
  { id: 'default', label: '기본 (로즈)', nativeName: null },
  { id: 'mint', label: '민트', nativeName: 'AppIconMint' },
  { id: 'amber', label: '앰버', nativeName: 'AppIconAmber' },
  { id: 'violet', label: '바이올렛', nativeName: 'AppIconViolet' },
  { id: 'sky', label: '스카이', nativeName: 'AppIconSky' },
]

const MARK_HEX = {
  default: '#ff87a1',
  mint: '#5eead4',
  amber: '#fbbf24',
  violet: '#a78bfa',
  sky: '#38bdf8',
}

export function appIconMarkHex(variantId) {
  return MARK_HEX[variantId] || MARK_HEX.default
}

/**
 * iOS 홈 화면 대체 아이콘 적용. 웹·Android에서는 no-op.
 */
export async function syncNativeAppIcon(variantId) {
  if (Capacitor.getPlatform() !== 'ios') return
  try {
    const { value: supported } = await AppIcon.isSupported()
    if (!supported) return
    const row = APP_ICON_VARIANTS.find((x) => x.id === variantId) || APP_ICON_VARIANTS[0]
    if (!row.nativeName) {
      await AppIcon.reset({ suppressNotification: true, disable: [] })
    } else {
      await AppIcon.change({ name: row.nativeName, suppressNotification: true })
    }
  } catch {
    /* 대체 아이콘 미지원 기기 등 */
  }
}
