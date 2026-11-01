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
    it('reaches the table with one Tab and walks by atomic number', async () => {
      render(<App />)
      await userEvent.tab()
      expect(tile('H')).toHaveFocus()
      await userEvent.keyboard('{ArrowRight}{ArrowRight}')
      expect(tile('Li')).toHaveFocus()
      await userEvent.keyboard('{ArrowLeft}')
      expect(tile('He')).toHaveFocus()
    })

    it('moves within a column', async () => {
      render(<App />)
      await userEvent.tab()
      await userEvent.keyboard('{ArrowDown}{ArrowDown}')
      expect(tile('Na')).toHaveFocus()
      await userEvent.keyboard('{ArrowUp}')
      expect(tile('Li')).toHaveFocus()
    })

    it('jumps with Home and End', async () => {
      render(<App />)
      await userEvent.tab()
      await userEvent.keyboard('{End}')
      expect(tile('Og')).toHaveFocus()
      await userEvent.keyboard('{Home}')
      expect(tile('H')).toHaveFocus()
    })

    it('opens with Enter, follows the arrows and closes with Escape', async () => {
      render(<App />)
      await userEvent.tab()
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
      await userEvent.tab()
      await userEvent.keyboard('{ArrowRight}')
      expect(panel()).toHaveAccessibleName('How to read the table')
      expect(window.location.hash).toBe('')
    })

    it('leaves browser shortcuts alone', async () => {
      render(<App />)
      await userEvent.tab()
      await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}')
      expect(tile('H')).toHaveFocus()
    })
  })
})
