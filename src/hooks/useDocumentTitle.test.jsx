import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import useDocumentTitle from './useDocumentTitle'

function Page({ title }) {
  useDocumentTitle(title)
  return null
}

describe('useDocumentTitle', () => {
  it('sets "<page> — BrowseWrapped" and leaves the title alone for null', () => {
    const { rerender } = render(<Page title="Your 2026 Wrapped" />)
    expect(document.title).toBe('Your 2026 Wrapped — BrowseWrapped')

    rerender(<Page title={null} />)
    expect(document.title).toBe('Your 2026 Wrapped — BrowseWrapped')
  })
})
