import { describe, it, expect, vi } from 'vitest'
import { saveDeleteToken, loadDeleteToken, forgetDeleteToken } from './shareTokens'

describe('shareTokens', () => {
  it('saves, loads and forgets a delete token per share token', () => {
    saveDeleteToken('abc', 'secret-1')
    saveDeleteToken('xyz', 'secret-2')

    expect(loadDeleteToken('abc')).toBe('secret-1')
    expect(loadDeleteToken('xyz')).toBe('secret-2')

    forgetDeleteToken('abc')
    expect(loadDeleteToken('abc')).toBeNull()
    expect(loadDeleteToken('xyz')).toBe('secret-2')
  })

  it('returns null for a token this browser never saw', () => {
    expect(loadDeleteToken('unknown')).toBeNull()
  })

  it('does not throw when storage is unavailable (private mode, blocked site data)', () => {
    const boom = () => { throw new Error('SecurityError') }
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom)

    expect(() => saveDeleteToken('abc', 'secret')).not.toThrow()
    expect(loadDeleteToken('abc')).toBeNull()
    expect(() => forgetDeleteToken('abc')).not.toThrow()
  })
})
