export default function SectionHeader({ label, title, description }) {
  return (
    <div className="mb-6">
      {label && <p className="section-label mb-2">{label}</p>}
      <h2
        className="display text-white"
        style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', fontWeight: 700, letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{description}</p>
      )}
    </div>
  )
}
