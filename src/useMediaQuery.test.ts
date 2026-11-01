import { renderHook, act } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from './useMediaQuery.ts'

afterEach(() => vi.unstubAllGlobals())

describe('useMediaQuery', () => {
  it('is false where media queries are not available', () => {
    expect(renderHook(() => useMediaQuery('(max-width: 1px)')).result.current).toBe(false)
  })

  it('follows the query', () => {
    let listener = () => {}
    const list = {
      matches: true,
      addEventListener: (_: string, callback: () => void) => {
        listener = callback
      },
      removeEventListener: () => {},
    }
    vi.stubGlobal('matchMedia', () => list)
    const { result } = renderHook(() => useMediaQuery('(max-width: 1px)'))
    expect(result.current).toBe(true)
    list.matches = false
    act(() => listener())
    expect(result.current).toBe(false)
  })
})
