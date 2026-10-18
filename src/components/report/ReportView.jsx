import { Link } from 'react-router-dom'
import StatCard from '../ui/StatCard'
import SectionHeader from '../ui/SectionHeader'
import HistoryFingerprint from '../ui/HistoryFingerprint'
import PersonaCard from '../stats/PersonaCard'
import SessionStats from '../stats/SessionStats'
import IntentChart from '../stats/IntentChart'
import TopicsDonut from '../charts/TopicsDonut'
import DailyPattern from '../charts/DailyPattern'
import WeeklyPattern from '../charts/WeeklyPattern'
import MonthlyTrends from '../charts/MonthlyTrends'
import TimeByTopic from '../charts/TimeByTopic'
import Heatmap from '../charts/Heatmap'
import ActivityCalendar from '../charts/ActivityCalendar'
import TopicMomentum from '../charts/TopicMomentum'
import TopDomains from '../domain/TopDomains'
import TopPages from '../domain/TopPages'
import SearchCloud from '../search/SearchCloud'
import KnowledgeMap from '../graph/KnowledgeMap'

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

// The full Wrapped report. Used by the results page, the analysis (polling)
// page and, later, shared report links.
// Props:
//   banner  – optional element shown under the header (e.g. "shared report" note)
//   actions – optional element shown in the hero (e.g. the Share button)
//   shared  – true on public /r/:token pages (read-only wording)
export default function ReportView({ data, filename, banner = null, actions = null, shared = false }) {
  const {
    summary, persona, topics, time_by_topic, daily_pattern, weekly_pattern,
    monthly_trends, heatmap, activity_calendar, sessions, streaks, topic_momentum,
    top_domains, top_pages, top_searches, chrome_searches, intent,
    knowledge_graph, meta,
  } = data

  const topTopicColor   = topics?.find((t) => t.name === summary.top_topic)?.color || '#a855f7'
  const hasTimestamps   = summary.has_timestamps
  const hasDuration     = summary.has_duration_data && time_by_topic?.length > 0
  const hasSearches     = (chrome_searches?.length || top_searches?.length) > 0
  const hasGraph        = knowledge_graph?.nodes?.length > 1
  const hasTrends       = monthly_trends?.data?.length > 1
  const hasHeatmap      = heatmap?.max > 0
  const hasCalendar     = activity_calendar?.days?.length > 0 && activity_calendar?.max > 0
  const hasWeekly       = weekly_pattern?.some((d) => d.visits > 0)
  const hasIntent       = intent && (intent.typed_pct > 0 || intent.link_pct > 0)
  const hasPages        = top_pages?.length > 0
  const hasDomains      = top_domains?.length > 0
  const hasSessions     = sessions?.total_sessions > 0
  const hasMomentum     = topic_momentum?.rising?.length > 0 || topic_momentum?.falling?.length > 0
  const activeSearches  = chrome_searches?.length > 0 ? chrome_searches : top_searches

  const year = summary.date_range?.start?.slice(0, 4) || new Date().getFullYear()

  const hoursVal   = summary.total_hours_browsed > 0 ? `${summary.total_hours_browsed}h` : fmt(summary.unique_domains)
  const hoursLabel = summary.total_hours_browsed > 0 ? 'Hours browsed' : 'Sites explored'
  const hoursColor = summary.total_hours_browsed > 0 ? '#f59e0b' : '#06b6d4'

  const fourthVal   = summary.avg_daily_minutes ? `${summary.avg_daily_minutes}m` : summary.total_days ? fmt(summary.total_days) : summary.top_domain
  const fourthLabel = summary.avg_daily_minutes ? 'Daily avg' : summary.total_days ? 'Days tracked' : 'Top domain'

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── Page header ── */}
      <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)', background: 'rgba(6,6,14,0.85)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to="/"
            style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            {shared ? 'Make your own →' : '← Back'}
          </Link>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            BrowseWrapped
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
            {meta?.total_entries_parsed?.toLocaleString()} entries
            {shared ? ' · shared' : meta?.source === 'chrome_direct' ? ' · Chrome' : meta?.source === 'sample' ? ' · sample' : ' · upload'}
          </span>
        </div>
      </header>

      {/* ── Sample data banner ── */}
      {meta?.source === 'sample' && (
        <div
          role="note"
          style={{ background: 'rgba(168,85,247,0.1)', borderBottom: '1px solid rgba(168,85,247,0.25)', padding: '10px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text)' }}
        >
          You&apos;re viewing <strong>synthetic sample data</strong>.{' '}
          <Link to="/" style={{ color: 'var(--accent)' }}>Upload your own history</Link> to see your real Wrapped.
        </div>
      )}

      {banner}

      {/* ── Hero ── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(168,85,247,0.12), transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '48px 20px 40px', textAlign: 'center', position: 'relative' }}>
          <p className="section-label" style={{ marginBottom: 12 }}>{shared ? 'A Shared Digital Footprint' : 'Your Digital Footprint'}</p>
          <h1
            className="display gradient-text"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}
          >
            {year} Wrapped
          </h1>
          {filename && (
            <p className="mono" style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>{filename}</p>
          )}
          {summary.date_range && (
            <p className="mono" style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>
              {summary.date_range.start} → {summary.date_range.end}
            </p>
          )}
          {meta?.ai_classified_domains > 0 && (
            <p className="mono" style={{ marginTop: 8, fontSize: 11, color: 'var(--accent)' }}>
              ✨ {meta.ai_classified_domains} {meta.ai_classified_domains === 1 ? 'site' : 'sites'} categorised by AI
            </p>
          )}
          {actions && <div style={{ marginTop: 20 }}>{actions}</div>}
        </div>
        {hasTimestamps && (
          <div style={{ maxWidth: 980, margin: '0 auto' }}>
            <HistoryFingerprint data={daily_pattern} />
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ─ Persona ─ */}
        {persona && <PersonaCard persona={persona} />}

        {/* ─ Stat cards ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <StatCard label="Total visits"  value={fmt(summary.total_visits)} color="#a855f7" />
          <StatCard label={hoursLabel}    value={hoursVal}   color={hoursColor} />
          <StatCard
            label="Top interest"
            value={summary.top_topic}
            sub={topics?.find((t) => t.name === summary.top_topic) ? `${topics.find((t) => t.name === summary.top_topic).percentage}% of visits` : null}
            color={topTopicColor}
          />
          <StatCard
            label={fourthLabel}
            value={fourthVal}
            sub={summary.avg_daily_minutes && summary.total_days ? `over ${fmt(summary.total_days)} days` : null}
            color="#06b6d4"
          />
        </div>

        {/* ─ Time by topic ─ */}
        {hasDuration && (
          <Section>
            <SectionHeader
              label="Time Spent"
              title="Where Your Hours Went"
              description="Actual foreground browsing time per topic category"
            />
            <TimeByTopic timeByTopic={time_by_topic} />
          </Section>
        )}

        {/* ─ Session stats + streaks ─ */}
        {hasSessions && (
          <Section>
            <SectionHeader
              label="Sessions"
              title="How You Browse"
              description="A session ends after 30 minutes of inactivity"
            />
            <SessionStats sessions={sessions} summary={summary} streaks={streaks} />
          </Section>
        )}

        {/* ─ Topics + Domains ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: hasDomains ? '1fr 1fr' : '1fr', gap: 20 }}>
          <Section>
            <SectionHeader label="Breakdown" title="What You Explored" />
            <TopicsDonut topics={topics} />
          </Section>
          {hasDomains && (
            <Section>
              <SectionHeader label="Top Sites" title="Your Most Visited" />
              <TopDomains domains={top_domains} />
            </Section>
          )}
        </div>

        {/* ─ Activity calendar ─ */}
        {hasCalendar && (
          <Section>
            <SectionHeader
              label="Activity Calendar"
              title="Your Browsing History"
              description="Daily activity over the past year — darker = more visits"
            />
            <ActivityCalendar calendar={activity_calendar} />
          </Section>
        )}

        {/* ─ Heatmap ─ */}
        {hasHeatmap && (
          <Section>
            <SectionHeader
              label="Heatmap"
              title="Your Browsing Rhythm"
              description="Day × hour — when you browse most"
            />
            <Heatmap heatmap={heatmap} />
          </Section>
        )}

        {/* ─ Daily + Weekly ─ */}
        {hasTimestamps && (
          <div style={{ display: 'grid', gridTemplateColumns: hasWeekly ? '3fr 2fr' : '1fr', gap: 20 }}>
            <Section>
              <SectionHeader label="Daily Pattern" title="When You Browse" description="Hourly activity" />
              <DailyPattern data={daily_pattern} />
              {(() => {
                const peak = daily_pattern?.reduce((a, b) => b.visits > a.visits ? b : a, daily_pattern[0])
                const fmtH = (h) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
                return peak?.visits > 0 ? (
                  <p className="mono" style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
                    Peak: <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{fmtH(peak.hour)}</span>
                  </p>
                ) : null
              })()}
            </Section>
            {hasWeekly && (
              <Section>
                <SectionHeader label="Weekly Pattern" title="Your Week" description="Mon–Sun" />
                <WeeklyPattern data={weekly_pattern} />
                {(() => {
                  const peak = weekly_pattern?.reduce((a, b) => b.visits > a.visits ? b : a, weekly_pattern[0])
                  return peak?.visits > 0 ? (
                    <p className="mono" style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                      Busiest: <span style={{ color: '#a855f7', fontWeight: 500 }}>{peak.day}</span>
                    </p>
                  ) : null
                })()}
              </Section>
            )}
          </div>
        )}

        {/* ─ Topic momentum ─ */}
        {hasMomentum && (
          <Section>
            <SectionHeader
              label="Interest Shift"
              title="What's Changing"
              description="How your browsing interests evolved over this period"
            />
            <TopicMomentum momentum={topic_momentum} />
          </Section>
        )}

        {/* ─ Monthly trends ─ */}
        {hasTimestamps && hasTrends && (
          <Section>
            <SectionHeader label="Interest Evolution" title="How Your Curiosity Shifted" description="Topic visits month by month" />
            <MonthlyTrends monthlyTrends={monthly_trends} />
          </Section>
        )}

        {/* ─ Intent analysis ─ */}
        {hasIntent && (
          <Section>
            <SectionHeader
              label="Navigation"
              title="How You Discover Content"
              description="Whether you typed the URL, came via search, or clicked a link"
            />
            <IntentChart intent={intent} />
          </Section>
        )}

        {/* ─ Top individual pages ─ */}
        {hasPages && (
          <Section>
            <SectionHeader label="Top Pages" title="Your Most-Visited Destinations" description="Individual pages by visit count" />
            <TopPages pages={top_pages} />
          </Section>
        )}

        {/* ─ Searches ─ */}
        {hasSearches && (
          <Section>
            <SectionHeader
              label={chrome_searches?.length ? 'Chrome Searches' : 'Search Evolution'}
              title="What You Were Looking For"
              description={
                chrome_searches?.length
                  ? `${chrome_searches.length} unique search terms from Chrome's omnibox history`
                  : 'Your most frequent queries'
              }
            />
            <SearchCloud searches={activeSearches} />
          </Section>
        )}

        {/* ─ Knowledge map ─ */}
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
          {shared
            ? 'Shared reports contain aggregated stats only — no URLs, page titles, searches or site names.'
            : meta?.analysis_id
              ? 'Your upload is analysed on the BrowseWrapped server and deleted after 7 days. Share links only include aggregated stats.'
              : 'Share links only include aggregated stats — no URLs, page titles, searches or site names.'}
        </p>
      </main>
    </div>
  )
}
