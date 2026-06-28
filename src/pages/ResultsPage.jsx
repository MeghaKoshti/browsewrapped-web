import { useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import StatCard from '../components/ui/StatCard'
import SectionHeader from '../components/ui/SectionHeader'
import HistoryFingerprint from '../components/ui/HistoryFingerprint'
import TopicsDonut from '../components/charts/TopicsDonut'
import DailyPattern from '../components/charts/DailyPattern'
import MonthlyTrends from '../components/charts/MonthlyTrends'
import TopDomains from '../components/domain/TopDomains'
import SearchCloud from '../components/search/SearchCloud'
import KnowledgeMap from '../components/graph/KnowledgeMap'

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

function Section({ children, className = '' }) {
  return (
    <section className={`card p-6 md:p-7 ${className}`}>
      {children}
    </section>
  )
}

export default function ResultsPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const data = state?.data
  const filename = state?.filename

  useEffect(() => {
    if (!data) navigate('/', { replace: true })
  }, [data, navigate])

  if (!data) return null

  const { summary, topics, daily_pattern, monthly_trends, top_domains, top_searches, knowledge_graph, meta } = data

  const topTopicColor = topics?.find((t) => t.name === summary.top_topic)?.color || '#a855f7'
  const hasTimestamps = summary.has_timestamps
  const hasSearches = top_searches?.length > 0
  const hasGraph = knowledge_graph?.nodes?.length > 1
  const hasTrends = monthly_trends?.data?.length > 1

  const year = summary.date_range?.start?.slice(0, 4) || new Date().getFullYear()

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── Page header ── */}
      <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)', background: 'rgba(6,6,14,0.85)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            ← Back
          </Link>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            BrowseWrapped
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
            {meta?.total_entries_parsed?.toLocaleString()} entries
          </span>
        </div>
      </header>

      {/* ── Hero banner ── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 100% at 50% 0%, rgba(168,85,247,0.12), transparent)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 20px 40px', textAlign: 'center', position: 'relative' }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Your Digital Footprint</p>
          <h1
            className="display gradient-text"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}
          >
            {year} Wrapped
          </h1>
          {filename && (
            <p className="mono" style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>
              {filename}
            </p>
          )}
          {summary.date_range && (
            <p className="mono" style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>
              {summary.date_range.start} → {summary.date_range.end}
            </p>
          )}
        </div>

        {/* Fingerprint waveform */}
        {hasTimestamps && (
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 0 0' }}>
            <HistoryFingerprint data={daily_pattern} />
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <StatCard label="Total visits" value={fmt(summary.total_visits)} color="#a855f7" />
          <StatCard label="Sites explored" value={fmt(summary.unique_domains)} color="#06b6d4" />
          <StatCard
            label="Top interest"
            value={summary.top_topic}
            sub={topics?.find((t) => t.name === summary.top_topic) ? `${topics.find((t) => t.name === summary.top_topic).percentage}% of visits` : null}
            color={topTopicColor}
          />
          <StatCard
            label={summary.total_days ? 'Days tracked' : 'Top domain'}
            value={summary.total_days ? fmt(summary.total_days) : summary.top_domain}
            color="#f59e0b"
          />
        </div>

        {/* Topics + Domains */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Section>
            <SectionHeader label="Breakdown" title="What You Explored" />
            <TopicsDonut topics={topics} />
          </Section>
          <Section>
            <SectionHeader label="Top Sites" title="Your Most Visited" />
            <TopDomains domains={top_domains} />
          </Section>
        </div>

        {/* Daily pattern */}
        {hasTimestamps && (
          <Section>
            <SectionHeader
              label="Activity Pattern"
              title="When You Browse"
              description="Your browsing activity by hour of day"
            />
            <DailyPattern data={daily_pattern} />
            {(() => {
              const peak = daily_pattern?.reduce((a, b) => b.visits > a.visits ? b : a, daily_pattern[0])
              const fmtH = (h) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
              return peak?.visits > 0 ? (
                <p className="mono" style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
                  Peak hour: <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{fmtH(peak.hour)}</span>
                </p>
              ) : null
            })()}
          </Section>
        )}

        {/* Monthly trends */}
        {hasTimestamps && hasTrends && (
          <Section>
            <SectionHeader
              label="Interest Evolution"
              title="How Your Curiosity Shifted"
              description="Topic visits month by month"
            />
            <MonthlyTrends monthlyTrends={monthly_trends} />
          </Section>
        )}

        {/* Searches */}
        {hasSearches && (
          <Section>
            <SectionHeader
              label="Search Evolution"
              title="What You Were Looking For"
              description="Your most frequent queries — size reflects search frequency"
            />
            <SearchCloud searches={top_searches} />
          </Section>
        )}

        {/* Knowledge map */}
        {hasGraph && (
          <section style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', background: '#030308' }}>
            <div style={{ padding: '24px 28px 16px' }}>
              <SectionHeader
                label="Knowledge Map"
                title="Your Digital Universe"
                description={`${knowledge_graph.nodes.length} topic clusters · drag to explore · node size = visit count`}
              />
            </div>
            <KnowledgeMap nodes={knowledge_graph.nodes} edges={knowledge_graph.edges} />
          </section>
        )}

        <p className="mono" style={{ textAlign: 'center', fontSize: 10, color: 'rgba(82,82,110,0.5)', paddingTop: 8, letterSpacing: '0.06em' }}>
          All analysis runs locally — your data never leaves your machine.
        </p>
      </main>
    </div>
  )
}
