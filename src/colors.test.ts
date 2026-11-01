import { describe, expect, it } from 'vitest'
import { tileColors } from './colors.ts'
import { elements } from './data/index.ts'

const element = (symbol: string) => elements.find((e) => e.symbol === symbol)!

describe('tileColors', () => {
  it('colors by the kind, splitting a tile of two kinds', () => {
    expect(tileColors(element('He'), 'kind')).toEqual(['var(--kind-celestial)', 'var(--kind-mythology)'])
    expect(tileColors(element('Fr'), 'kind')).toEqual(['var(--kind-place)', 'var(--kind-place)'])
  })

  it('colors by the family of the oldest language', () => {
    expect(tileColors(element('He'), 'language')).toEqual(['var(--family-greek)', 'var(--family-greek)'])
  })

  it('has a neutral color for placeholders', () => {
    expect(tileColors(element('Li'), 'kind')[0]).toBe('var(--kind-unknown)')
  })
})
