import { StrictMode } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import SkipLink from './SkipLink'

function renderApp() {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/']}>
        <SkipLink />
        <Routes>
          <Route path="/" element={<main id="main" tabIndex={-1}><Link to="/next">Next page</Link></main>} />
          <Route path="/next" element={<main id="main" tabIndex={-1}><h1>Next</h1></main>} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  )
}

describe('SkipLink', () => {
  it('is the first tab stop and moves focus to the main content', async () => {
    renderApp()

    await userEvent.tab()
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  // StrictMode (on in main.jsx) runs effects twice on mount; the first page
  // load must still leave focus alone so Tab lands on the skip link.
  it('does not take focus on the first page load', () => {
    renderApp()

    expect(screen.getByRole('link', { name: 'Skip to content' })).not.toHaveFocus()
    expect(document.body).toHaveFocus()
  })

  it('takes focus after navigating so the new page starts at the top', async () => {
    renderApp()

    await userEvent.click(screen.getByRole('link', { name: 'Next page' }))

    expect(await screen.findByRole('heading', { name: 'Next' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
  })
})
