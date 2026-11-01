import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App.tsx'

const tile = (symbol: string) => document.getElementById(`tile-${symbol}`)!
const panel = () => screen.getByRole('complementary')

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('App', () => {
  it('shows the title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Periodic Table of Name Origins')
  })

  it('credits Wikipedia and names the license, as CC BY-SA requires', () => {
    render(<App />)
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Wikipedia contributors')
    expect(screen.getByRole('link', { name: /List of chemical element name etymologies/ })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/List_of_chemical_element_name_etymologies',
    )
    expect(screen.getByRole('link', { name: 'CC BY-SA 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-sa/4.0/',
    )
  })

  describe('the detail panel', () => {
    it('starts with the explanation', () => {
      render(<App />)
      expect(panel()).toHaveAccessibleName('How to read the table')
    })

    it('opens on click and makes the element linkable', async () => {
      render(<App />)
      await userEvent.click(tile('Fe'))
      expect(panel()).toHaveAccessibleName('Name origin of Iron')
      expect(window.location.hash).toBe('#Fe')
    })

    it('opens from a link', () => {
      window.history.replaceState(null, '', '#Au')
      render(<App />)
      expect(panel()).toHaveAccessibleName('Name origin of Gold')
      expect(tile('Au').tabIndex).toBe(0)
    })

    it('ignores an unknown link', () => {
      window.history.replaceState(null, '', '#Xx')
      render(<App />)
      expect(panel()).toHaveAccessibleName('How to read the table')
    })

    it('follows a change of the link, such as a link between elements', async () => {
      render(<App />)
      window.location.hash = '#Np'
      await screen.findByRole('complementary', { name: 'Name origin of Neptunium' })
    })

    it('closes with its button', async () => {
      render(<App />)
      await userEvent.click(tile('Fe'))
      await userEvent.click(screen.getByRole('button', { name: 'Close details' }))
      expect(panel()).toHaveAccessibleName('How to read the table')
      expect(window.location.hash).toBe('')
    })

    it('walks with its buttons', async () => {
      render(<App />)
      await userEvent.click(tile('Fe'))
      await userEvent.click(screen.getByRole('button', { name: 'Next element' }))
      expect(panel()).toHaveAccessibleName('Name origin of Cobalt')
      await userEvent.click(screen.getByRole('button', { name: 'Previous element' }))
      await userEvent.click(screen.getByRole('button', { name: 'Previous element' }))
      expect(panel()).toHaveAccessibleName('Name origin of Manganese')
    })
  })

  describe('the keyboard', () => {
    it('walks by atomic number', async () => {
      render(<App />)
      tile('H').focus()
      await userEvent.keyboard('{ArrowRight}{ArrowRight}')
      expect(tile('Li')).toHaveFocus()
      await userEvent.keyboard('{ArrowLeft}')
      expect(tile('He')).toHaveFocus()
    })

    it('moves within a column', async () => {
      render(<App />)
      tile('H').focus()
      await userEvent.keyboard('{ArrowDown}{ArrowDown}')
      expect(tile('Na')).toHaveFocus()
      await userEvent.keyboard('{ArrowUp}')
      expect(tile('Li')).toHaveFocus()
    })

    it('jumps with Home and End', async () => {
      render(<App />)
      tile('H').focus()
      await userEvent.keyboard('{End}')
      expect(tile('Og')).toHaveFocus()
      await userEvent.keyboard('{Home}')
      expect(tile('H')).toHaveFocus()
    })

    it('opens with Enter, follows the arrows and closes with Escape', async () => {
      render(<App />)
      tile('H').focus()
      await userEvent.keyboard('{ArrowRight}{Enter}')
      expect(panel()).toHaveAccessibleName('Name origin of Helium')
      await userEvent.keyboard('{ArrowRight}')
      expect(panel()).toHaveAccessibleName('Name origin of Lithium')
      expect(window.location.hash).toBe('#Li')
      await userEvent.keyboard('{Escape}')
      expect(panel()).toHaveAccessibleName('How to read the table')
      expect(tile('Li')).toHaveFocus()
    })

    it('does not move the panel without it being open', async () => {
      render(<App />)
      tile('H').focus()
      await userEvent.keyboard('{ArrowRight}')
      expect(panel()).toHaveAccessibleName('How to read the table')
      expect(window.location.hash).toBe('')
    })

    it('leaves browser shortcuts alone', async () => {
      render(<App />)
      tile('H').focus()
      await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}')
      expect(tile('H')).toHaveFocus()
    })
  })

  describe('the filters', () => {
    const chip = (name: RegExp) => screen.getByRole('button', { name })
    const dimmed = (symbol: string) => tile(symbol).classList.contains('tile--dimmed')

    it('dims what does not match while keeping the table shape', async () => {
      render(<App />)
      await userEvent.click(chip(/^Person \d+/))
      expect(dimmed('Es')).toBe(false)
      expect(dimmed('He')).toBe(true)
      expect(screen.getByRole('grid').querySelectorAll('.tile')).toHaveLength(118)
    })

    it('reports how many elements match', async () => {
      render(<App />)
      expect(screen.getByRole('status')).toHaveTextContent('118 of 118 elements')
      await userEvent.click(chip(/^Mythology \d+/))
      expect(screen.getByRole('status')).not.toHaveTextContent('118 of 118')
    })

    it('shows a toggled state and clears', async () => {
      render(<App />)
      expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()
      await userEvent.click(chip(/^Japanese \d+/))
      expect(chip(/^Japanese \d+/)).toHaveAttribute('aria-pressed', 'true')
      expect(dimmed('Nh')).toBe(false)
      expect(dimmed('H')).toBe(true)
      await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
      expect(dimmed('H')).toBe(false)
      expect(chip(/^Japanese \d+/)).toHaveAttribute('aria-pressed', 'false')
    })

    it('hides kinds which no element has yet', () => {
      render(<App />)
      expect(screen.queryByRole('button', { name: /^Mineral or substance/ })).toBeNull()
    })

    it('makes the arrows skip what does not match', async () => {
      render(<App />)
      await userEvent.click(chip(/^Person \d+/))
      await userEvent.click(tile('Sm'))
      await userEvent.keyboard('{ArrowRight}')
      expect(tile('Gd')).toHaveFocus()
      expect(panel()).toHaveAccessibleName('Name origin of Gadolinium')
    })

    it('makes the panel buttons skip what does not match', async () => {
      render(<App />)
      await userEvent.click(chip(/^Person \d+/))
      await userEvent.click(tile('Sm'))
      await userEvent.click(screen.getByRole('button', { name: 'Next element' }))
      expect(panel()).toHaveAccessibleName('Name origin of Gadolinium')
    })

    it('switches the meaning of the colors', async () => {
      render(<App />)
      expect(tile('He').style.getPropertyValue('--color-a')).toBe('var(--kind-celestial)')
      await userEvent.click(screen.getByRole('radio', { name: 'Language family' }))
      expect(tile('He').style.getPropertyValue('--color-a')).toBe('var(--family-greek)')
    })
  })

  describe('the search', () => {
    const box = () => screen.getByRole('searchbox')

    it('is reached with the slash key, without typing the slash', async () => {
      render(<App />)
      tile('H').focus()
      await userEvent.keyboard('/')
      expect(box()).toHaveFocus()
      expect(box()).toHaveValue('')
    })

    it('allows typing a slash into the box', async () => {
      render(<App />)
      await userEvent.click(box())
      await userEvent.keyboard('a/b')
      expect(box()).toHaveValue('a/b')
    })

    it('dims what does not match and leads to the first match on Enter', async () => {
      render(<App />)
      await userEvent.click(box())
      await userEvent.keyboard('moon')
      expect(tile('Se').classList.contains('tile--dimmed')).toBe(false)
      expect(tile('H').classList.contains('tile--dimmed')).toBe(true)
      await userEvent.keyboard('{Enter}')
      expect(tile('Se')).toHaveFocus()
    })

    it('clears on Escape without closing the panel', async () => {
      render(<App />)
      await userEvent.click(tile('Fe'))
      await userEvent.click(box())
      await userEvent.keyboard('moon{Escape}')
      expect(box()).toHaveValue('')
      expect(panel()).toHaveAccessibleName('Name origin of Iron')
    })

    it('does nothing on Enter without matches', async () => {
      render(<App />)
      await userEvent.click(box())
      await userEvent.keyboard('zzzzzz{Enter}')
      expect(box()).toHaveFocus()
    })
  })
})
