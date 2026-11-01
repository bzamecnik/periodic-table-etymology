import { describe, expect, it } from 'vitest'
import { elements } from './data/index.ts'
import { navigate } from './navigation.ts'

const all = () => true
const z = (symbol: string) => elements.find((e) => e.symbol === symbol)!.z
const go = (symbol: string, key: string, isActive = all as (e: (typeof elements)[number]) => boolean) =>
  elements[navigate(elements, z(symbol), key, isActive)! - 1].symbol

describe('navigate', () => {
  it('moves by atomic number with left and right, across rows', () => {
    expect(go('H', 'ArrowRight')).toBe('He')
    expect(go('He', 'ArrowRight')).toBe('Li')
    expect(go('Ba', 'ArrowRight')).toBe('La')
    expect(go('Li', 'ArrowLeft')).toBe('He')
  })

  it('stops at both ends', () => {
    expect(go('H', 'ArrowLeft')).toBe('H')
    expect(go('Og', 'ArrowRight')).toBe('Og')
  })

  it('moves within a column with up and down, over gaps', () => {
    expect(go('Fe', 'ArrowDown')).toBe('Ru')
    expect(go('Ru', 'ArrowUp')).toBe('Fe')
    expect(go('H', 'ArrowDown')).toBe('Li')
    expect(go('He', 'ArrowDown')).toBe('Ne')
  })

  it('stays when nothing is above or below', () => {
    expect(go('H', 'ArrowUp')).toBe('H')
    expect(go('No', 'ArrowDown')).toBe('No')
  })

  it('jumps to the ends with Home and End', () => {
    expect(go('Fe', 'Home')).toBe('H')
    expect(go('Fe', 'End')).toBe('Og')
  })

  it('skips elements out of the filter', () => {
    const noble = (e: { symbol: string }) => ['He', 'Ne', 'Ar', 'Kr'].includes(e.symbol)
    expect(go('He', 'ArrowRight', noble)).toBe('Ne')
    expect(go('Ne', 'ArrowDown', noble)).toBe('Ar')
    expect(go('Kr', 'ArrowUp', noble)).toBe('Ar')
    expect(go('Fe', 'Home', noble)).toBe('He')
    expect(go('Fe', 'End', noble)).toBe('Kr')
  })

  it('stays when nothing matches', () => {
    const none = () => false
    for (const key of ['ArrowRight', 'ArrowUp', 'Home']) expect(go('Fe', key, none)).toBe('Fe')
  })

  it('ignores other keys', () => {
    expect(navigate(elements, 1, 'a', all)).toBeNull()
  })
})
