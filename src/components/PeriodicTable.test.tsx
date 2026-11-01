import { render, screen, within } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { type ChemicalElement, elements } from '../data/index.ts'
import { PeriodicTable } from './PeriodicTable.tsx'
import { Tile } from './Tile.tsx'
import { lineScale, tileLines } from './tileLines.ts'

const setup = (overrides = {}) => {
  const onSelect = vi.fn()
  render(
    <PeriodicTable
      elements={elements}
      colorBy="kind"
      currentZ={1}
      selectedZ={null}
      isActive={() => true}
      onSelect={onSelect}
      {...overrides}
    />,
  )
  return { onSelect }
}

describe('PeriodicTable', () => {
  it('shows a tile for all 118 elements', () => {
    setup()
    expect(within(screen.getByRole('grid')).getAllByRole('gridcell')).toHaveLength(118)
  })

  it('shows what a tile codes', () => {
    setup()
    const tile = screen.getByRole('button', { name: /^Helium, He, atomic number 2: sun/ })
    expect(tile).toHaveTextContent('2')
    expect(tile).toHaveTextContent('He')
    expect(tile).toHaveTextContent('Helium')
    expect(tile).toHaveTextContent('sun')
    expect(tile).toHaveTextContent('Gr')
    expect(tile).toHaveAccessibleName(expect.stringContaining('Oldest language: Greek'))
    expect(tile).toHaveAccessibleName(expect.stringContaining('Kind: Celestial body, Mythology'))
  })

  it('shows placeholders visibly and says so to screen readers', () => {
    const boron = { ...elements[4], gloss: '?', named: undefined, about: undefined }
    setup({ elements: [boron] })
    const tile = screen.getByRole('button', { name: /^Boron/ })
    expect(tile).toHaveTextContent('?')
    expect(tile).toHaveAccessibleName(expect.stringContaining('meaning not filled in yet'))
  })

  it('shrinks long names instead of cutting them off', () => {
    setup()
    const scale = (symbol: string) =>
      document.querySelector<HTMLElement>(`#tile-${symbol} .tile__name`)!.style.getPropertyValue('--name-scale')
    expect(scale('Rf')).toBe('0.8')
    expect(scale('Mo')).toBe('0.9')
    expect(scale('Fe')).toBe('1')
  })

  it('puts tiles at their table position', () => {
    setup()
    const iron = document.getElementById('tile-Fe')!
    expect(iron.style.gridColumn).toContain('8')
    expect(iron.style.gridRow).toContain('4')
  })

  it('has one tab stop in the table', () => {
    setup({ currentZ: 26 })
    const reachable = screen.getAllByRole('button').filter((b) => b.tabIndex === 0)
    expect(reachable.map((b) => b.id)).toEqual(['tile-Fe'])
  })

  it('selects a clicked tile', () => {
    const { onSelect } = setup()
    document.getElementById('tile-Au')!.click()
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ symbol: 'Au' }))
  })

  it('marks the selected tile', () => {
    setup({ selectedZ: 79 })
    const cell = document.getElementById('tile-Au')!.parentElement!
    expect(cell).toHaveAttribute('aria-selected', 'true')
  })

  it('dims the tiles which do not match', () => {
    setup({ isActive: (e: { symbol: string }) => e.symbol !== 'Ne' })
    expect(document.getElementById('tile-Ne')).toHaveClass('tile--dimmed')
    expect(document.getElementById('tile-Na')).not.toHaveClass('tile--dimmed')
    expect(document.getElementById('tile-Ne')).toHaveAccessibleName(expect.stringContaining('Does not match'))
  })
})

describe('tileLines', () => {
  const base = elements.find((element) => element.symbol === 'Y')!
  const lines = (overrides: Partial<ChemicalElement>) =>
    tileLines({ ...base, named: undefined, about: undefined, symbolGloss: undefined, ...overrides })

  it('shows what it is named after and the meaning', () => {
    expect(lines({ named: 'Place', gloss: 'meaning' })).toEqual([
      { text: 'Place', style: 'plain' },
      { text: 'meaning', style: 'meaning' },
    ])
  })

  it('falls back to a description without a meaning', () => {
    expect(lines({ named: 'Place', gloss: '', about: 'a village' })).toEqual([
      { text: 'Place', style: 'plain' },
      { text: 'a village', style: 'plain' },
    ])
  })

  it('prefers the meaning to the description', () => {
    expect(lines({ gloss: 'meaning', about: 'a village' })).toEqual([{ text: 'meaning', style: 'meaning' }])
  })

  it('adds the meaning of the symbol', () => {
    expect(lines({ gloss: 'yellow', symbolGloss: 'aurum, dawn' })).toEqual([
      { text: 'yellow', style: 'meaning' },
      { text: 'Y: aurum, dawn', style: 'plain' },
    ])
  })

  it('marks a placeholder', () => {
    expect(lines({ gloss: '?' })).toEqual([{ text: '?', style: 'todo' }])
  })
})

describe('a tile of an element with a symbol from another language', () => {
  const special = { ...elements[25], language: 'Old English', symbolLanguage: 'Latin' }

  it('shows both language codes and names both', () => {
    render(<Tile element={special} colorBy="kind" current={false} selected={false} dimmed={false} onSelect={vi.fn()} />)
    const tile = screen.getByRole('button')
    expect(tile).toHaveTextContent('OE')
    expect(tile).toHaveTextContent('La')
    expect(tile).toHaveAccessibleName(/Old English, of the symbol: Latin/)
  })

  it('shows one code when the symbol has the same language', () => {
    render(
      <Tile
        element={{ ...special, symbolLanguage: 'Old English' }}
        colorBy="kind"
        current={false}
        selected={false}
        dimmed={false}
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByRole('button').querySelectorAll('.tile__code')).toHaveLength(1)
  })
})

describe('lineScale', () => {
  const scale = (text: string, style: 'plain' | 'meaning' = 'plain') => lineScale({ text, style })

  it('leaves a short line alone', () => {
    expect(scale('Ytterby')).toBe(1)
  })

  it('shrinks a long line, and upright text more than italics', () => {
    expect(scale('Scandinavian text')).toBeLessThan(1)
    expect(scale('Scandinavian', 'plain')).toBeLessThan(scale('Scandinavian', 'meaning'))
  })

  it('counts wide letters', () => {
    expect(scale('mmmmmmmmmm')).toBeLessThan(scale('nnnnnnnnnn'))
  })

  it('never gets too small to read', () => {
    expect(scale('a very very very long line of text')).toBe(0.78)
  })
})
