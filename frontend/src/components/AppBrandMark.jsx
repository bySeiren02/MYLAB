/**
 * 앱 안 마크: iOS 아이콘과 같은 비율 — 얇은 L + 발 위에 또렷한 M
 */
export default function AppBrandMark({ size = 40 }) {
  const s = Math.max(28, Math.min(56, size))
  return (
    <div className="app-brand-mark" style={{ width: s, height: s }} aria-hidden>
      <svg
        className="app-brand-mark__svg"
        viewBox="0 0 80 80"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 얇은 L (세로 + 발) */}
        <path fill="currentColor" d="M14 60L14 11L19 11L19 37L62 37L62 43L14 43Z" />
        {/* M — 발 위·안쪽, 지그재그 */}
        <path
          className="app-brand-mark__m"
          fill="none"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 42l3.8-10.5 3.8 10.5 3.8-10.5 3.8 10.5"
        />
      </svg>
    </div>
  )
}
