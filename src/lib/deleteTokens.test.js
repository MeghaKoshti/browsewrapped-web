import { describe, it, expect, vi, afterEach } from 'vitest'
import { saveAnalysisDeleteToken, loadAnalysisDeleteToken, forgetAnalysisDeleteToken } from './deleteTokens'

describe('analysis delete tokens', () => {
  afterEach(() => sessionStorage.clear())

  it('keeps one token per analysis in sessionStorage under bw.deleteTokens', () => {
    saveAnalysisDeleteToken('42', 'token-42')
    saveAnalysisDeleteToken(7, 'token-7')

    expect(loadAnalysisDeleteToken('42')).toBe('token-42')
    expect(loadAnalysisDeleteToken('7')).toBe('token-7')
    expect(JSON.parse(sessionStorage.getItem('bw.deleteTokens'))).toEqual({ 42: 'token-42', 7: 'token-7' })
    expect(localStorage.getItem('bw.deleteTokens')).toBeNull()
  })

  it('forgets a token after the report is deleted', () => {
    saveAnalysisDeleteToken('42', 'token-42')
    forgetAnalysisDeleteToken('42')
    expect(loadAnalysisDeleteToken('42')).toBeNull()
  })

  it('ignores missing tokens and unreadable storage', () => {
    saveAnalysisDeleteToken('42', undefined)
    expect(loadAnalysisDeleteToken('42')).toBeNull()

    sessionStorage.setItem('bw.deleteTokens', 'not json')
    expect(loadAnalysisDeleteToken('42')).toBeNull()
  })

  it('never throws when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })

    expect(() => saveAnalysisDeleteToken('42', 'token')).not.toThrow()
    expect(loadAnalysisDeleteToken('42')).toBeNull()
    expect(() => forgetAnalysisDeleteToken('42')).not.toThrow()
  })
})
