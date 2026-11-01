import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import GuidePage from './GuidePage'

function renderGuide(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/guide/:browser" element={<GuidePage />} />
        <Route path="/" element={<p>upload page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GuidePage', () => {
  it('shows the guide for a browser with a CTA to upload', () => {
    renderGuide('/guide/safari')
    expect(screen.getByRole('heading', { level: 1, name: 'How to export your Safari history' })).toBeInTheDocument()
    expect(screen.getByText('~/Library/Safari/History.db')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Upload my history' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Chrome' })).toHaveAttribute('href', '/guide/chrome')
    expect(document.title).toBe('How to export your Safari history — BrowseWrapped')
  })

  it('sends unknown browsers to the upload page', () => {
    renderGuide('/guide/netscape')
    expect(screen.getByText('upload page')).toBeInTheDocument()
  })
})
