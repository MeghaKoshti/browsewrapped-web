import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// First tab stop on every page. Focuses the page's #main element directly
// instead of following "#main": a hash navigation would replace the router
// state that the results page reads its report from.
//
// After a client-side navigation it also takes focus, so keyboard and screen
// reader users start the new page at the top instead of wherever the old
// page's button used to be. It only shows on keyboard focus (:focus-visible).
export default function SkipLink() {
  const ref = useRef(null)
  const { pathname } = useLocation()
  // Compare paths rather than using a "first render" flag: StrictMode runs
  // effects twice on mount, which made the flag focus the link on page load.
  const lastPathname = useRef(pathname)

  useEffect(() => {
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname
    ref.current?.focus({ preventScroll: true })
  }, [pathname])

  const skip = (e) => {
    const main = document.getElementById('main')
    if (!main) return
    e.preventDefault()
    main.focus()
    main.scrollIntoView?.()
  }

  return (
    <a ref={ref} href="#main" className="skip-link" onClick={skip}>
      Skip to content
    </a>
  )
}
