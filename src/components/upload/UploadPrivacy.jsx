// Exactly what happens to an uploaded file, shown right under the drop zone.
// Keep this in sync with the Privacy Policy and the README privacy section.
const UPLOAD_PRIVACY_POINTS = [
  'Your file is read on the BrowseWrapped server. The file itself is deleted as soon as it has been analysed.',
  'The finished report is kept for 7 days so you can reopen it. It includes your top sites, top pages (address and title) and top searches.',
  'You can delete the report sooner with “Delete this report now” on the report page.',
  'Up to 50 site names our rules don’t recognise (like example.com) may be sent to Google Gemini to pick a topic. Never full addresses, page titles or searches.',
  'Share links contain totals and topics only, and expire after 30 days.',
]

export default function UploadPrivacy({ children = null }) {
  return (
    <section
      aria-labelledby="upload-privacy-title"
      style={{ marginTop: 14, padding: '14px 18px', borderRadius: 14, border: '1px solid var(--border)', background: 'rgba(13,13,28,0.7)', textAlign: 'left' }}
    >
      <h2 id="upload-privacy-title" style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>
        What happens to your file
      </h2>
      <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc', fontSize: 12, lineHeight: 1.6, color: 'var(--muted)' }}>
        {UPLOAD_PRIVACY_POINTS.map((point) => <li key={point}>{point}</li>)}
      </ul>
      {children}
    </section>
  )
}
