import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  try { localStorage.clear() } catch { /* storage unavailable */ }
})

// jsdom has no layout engine. Recharts' ResponsiveContainer needs a
// ResizeObserver and a non-zero size to render its SVG.
class ResizeObserverStub {
  constructor(callback) { this.callback = callback }
  observe(target) {
    this.callback([{ target, contentRect: { width: 800, height: 400 } }])
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 800 })
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 400 })
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 800 })
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 400 })
