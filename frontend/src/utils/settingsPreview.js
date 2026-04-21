/** 설정 모달에서만 미리보기용. 저장 전 홈/캘린더가 임시 목록을 쓰게 함 */
export const EVENT_CATEGORIES_PREVIEW = 'mylab-event-categories-preview'
export const EVENT_FAVORITES_PREVIEW = 'mylab-event-favorites-preview'
/** 취소: 미리보기만 제거(스토리지는 그대로) */
export const SETTINGS_PREVIEW_DISCARD = 'mylab-settings-preview-discard'

export function dispatchCategoriesPreview(list) {
  window.dispatchEvent(new CustomEvent(EVENT_CATEGORIES_PREVIEW, { detail: { list } }))
}

export function dispatchFavoritesPreview(list) {
  window.dispatchEvent(new CustomEvent(EVENT_FAVORITES_PREVIEW, { detail: { list } }))
}

export function dispatchSettingsPreviewDiscard() {
  window.dispatchEvent(new CustomEvent(SETTINGS_PREVIEW_DISCARD))
}
