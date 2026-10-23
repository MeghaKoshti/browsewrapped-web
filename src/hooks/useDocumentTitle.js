import { useEffect } from 'react'

export const APP_NAME = 'BrowseWrapped'

// Sets the browser tab title for the current page, e.g. "Your 2026 Wrapped — BrowseWrapped".
// Pass null to leave the title to a child (e.g. a page that renders ReportView).
export default function useDocumentTitle(title) {
  useEffect(() => {
    if (title === null) return
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME
  }, [title])
}
