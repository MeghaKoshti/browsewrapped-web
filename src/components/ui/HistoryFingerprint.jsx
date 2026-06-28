export default function HistoryFingerprint({ data }) {
  if (!data?.length) return null

  const max = Math.max(...data.map((d) => d.visits), 1)
  const W = 1000
  const H = 52
  const cy = H / 2
  const bw = W / data.length

  return (
    <div className="fingerprint-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: H }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fpGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#a855f7" />
            <stop offset="50%"  stopColor="#f472b6" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>

        {data.map((d, i) => {
          const bh = Math.max((d.visits / max) * (cy - 2), 1)
          const x  = i * bw + bw * 0.15
          const w  = bw * 0.7
          return (
            <g key={i}>
              <rect x={x} y={cy - bh} width={w} height={bh} fill="url(#fpGrad)" opacity={0.85} rx="1" />
              <rect x={x} y={cy}      width={w} height={bh} fill="url(#fpGrad)" opacity={0.35} rx="1" />
            </g>
          )
        })}

        {/* Center axis */}
        <line x1="0" y1={cy} x2={W} y2={cy} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </svg>
    </div>
  )
}
