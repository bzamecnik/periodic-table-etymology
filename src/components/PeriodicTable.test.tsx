import { render, screen, within } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { elements } from '../data/index.ts'
import { PeriodicTable } from './PeriodicTable.tsx'

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
    setup()
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
