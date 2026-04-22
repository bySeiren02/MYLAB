/**
 * 앱 안에서 보이는 ML 마크 (홈 화면 아이콘과 톤 맞춤용)
 */
export default function AppBrandMark({ size = 40 }) {
  const s = Math.max(28, Math.min(56, size))
  return (
    <div className="app-brand-mark" style={{ width: s, height: s, fontSize: Math.round(s * 0.36) }} aria-hidden>
      ML
    </div>
  )
}
