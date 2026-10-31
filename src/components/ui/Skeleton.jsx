// Placeholders shown while a lazily loaded page or chart downloads.
// They mirror the report layout so the page doesn't jump when it arrives.

function Block({ width = '100%', height = 16, radius = 8, style }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
}

// Stands in for a whole report page (results, analysis, shared).
export function ReportSkeleton() {
  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh' }}>
      <div role="status" className="sr-only">Loading your report…</div>
      <div aria-hidden="true">
        <div style={{ borderBottom: '1px solid var(--border)', height: 45 }} />
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '48px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Block width={150} height={10} />
          <Block width="min(420px, 80%)" height={56} radius={14} />
          <Block width={180} height={10} />
        </div>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ height: 260 }} />
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
            {[0, 1, 2, 3].map((i) => <div key={i} className="card" style={{ height: 110 }} />)}
          </div>
          <div className="card" style={{ height: 320 }} />
        </div>
      </div>
    </div>
  )
}

// Same footprint as the D3 knowledge map (500 px tall).
export function KnowledgeMapSkeleton() {
  return (
    <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeleton" aria-hidden="true" style={{ width: 120, height: 120, borderRadius: '50%' }} />
      <span role="status" className="sr-only">Loading knowledge map…</span>
    </div>
  )
}
