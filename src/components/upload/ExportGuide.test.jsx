import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportGuide from './ExportGuide'

const tabs = () => screen.getAllByRole('tab')
const selectedTab = () => tabs().find((t) => t.getAttribute('aria-selected') === 'true')

describe('ExportGuide', () => {
  it('opens on the visitor’s browser, with only that tab in the Tab order', () => {
    render(<ExportGuide initialBrowser="firefox" />)

    expect(tabs().map((t) => t.textContent)).toEqual(['Chrome', 'Firefox', 'Safari', 'Edge', 'Other'])
    expect(selectedTab()).toHaveTextContent('Firefox')
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0, -1, -1, -1])

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAccessibleName('Firefox')
    expect(selectedTab()).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveTextContent('places.sqlite')
  })

  it('moves between tabs with the arrow keys, wrapping at both ends', async () => {
    const user = userEvent.setup()
    render(<ExportGuide initialBrowser="chrome" />)

    await user.tab()
    expect(tabs()[0]).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(selectedTab()).toHaveTextContent('Firefox')
    expect(selectedTab()).toHaveFocus()
    expect(selectedTab().tabIndex).toBe(0)
    expect(tabs()[0].tabIndex).toBe(-1)

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(selectedTab()).toHaveTextContent('Other')
    expect(selectedTab()).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(selectedTab()).toHaveTextContent('Chrome')
  })

  it('jumps to the first and last tab with Home and End', async () => {
    const user = userEvent.setup()
    render(<ExportGuide initialBrowser="safari" />)

    await user.tab()
    await user.keyboard('{End}')
    expect(selectedTab()).toHaveTextContent('Other')
    await user.keyboard('{Home}')
    expect(selectedTab()).toHaveTextContent('Chrome')
    expect(selectedTab()).toHaveFocus()
  })

  it('leaves the tab list for the panel with Tab, not the other tabs', async () => {
    const user = userEvent.setup()
    render(<ExportGuide initialBrowser="edge" />)

    await user.tab()
    await user.tab()
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('shows a tab’s content on click', async () => {
    const user = userEvent.setup()
    render(<ExportGuide initialBrowser="chrome" />)

    await user.click(screen.getByRole('tab', { name: 'Safari' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('~/Library/Safari/History.db')
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/only runs on Mac/)
  })

  it('shows SQLite locations for every system, the visitor’s first, with the "copy first" tip', () => {
    render(<ExportGuide initialBrowser="chrome" os="windows" />)
    const panel = screen.getByRole('tabpanel')

    const copyButtons = screen.getAllByRole('button', { name: /^Copy .* path$/ })
    expect(copyButtons.map((b) => b.getAttribute('aria-label'))).toEqual(['Copy Windows path', 'Copy macOS path', 'Copy Linux path'])
    expect(panel).toHaveTextContent('%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\History')
    expect(panel).toHaveTextContent(/Quit the browser first, or copy the file/)
    expect(screen.getByRole('link', { name: /google takeout/i })).toHaveAttribute('href', 'https://takeout.google.com')
  })

  it('copies a path to the clipboard', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    render(<ExportGuide initialBrowser="edge" os="mac" />)

    await user.click(screen.getByRole('button', { name: 'Copy macOS path' }))

    expect(writeText).toHaveBeenCalledWith('~/Library/Application Support/Microsoft Edge/Default/History')
    expect(screen.getByRole('button', { name: 'Copy macOS path' })).toHaveTextContent('Copied')
  })

  it('includes a privacy note', () => {
    render(<ExportGuide />)
    expect(screen.getByText(/deleted after 7 days/)).toBeInTheDocument()
  })
})
