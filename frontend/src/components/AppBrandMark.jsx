/**
 * 앱 안에서 보이는 마크: 큰 L 안쪽(아래 모서리)에 작은 M을 둔 형태
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
        {/* 굵은 L: 왼쪽 세로 + 아래 가로 (모서리만 살짝 둥글게) */}
        <path
          fill="currentColor"
          d="M14 72L14 14Q14 10 18 10L34 10Q38 10 38 14L38 48Q38 50 40 50L66 50Q70 50 70 54L70 70Q70 72 68 72L14 72Z"
        />
        {/* L 안쪽 아래 모서리 위에 얹은 작은 M (지그재그, 선만) */}
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 40 64 L 46 48 L 52 64 L 58 48 L 64 64"
        />
      </svg>
    </div>
  )
}
