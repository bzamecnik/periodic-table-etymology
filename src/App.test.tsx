import { render, screen } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'

describe('App', () => {
  it('shows the title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Periodic Table of Name Origins')
  })

  it('credits Wikipedia and names the license, as CC BY-SA requires', () => {
    render(<App />)
    const credit = screen.getByRole('contentinfo')
    expect(credit).toHaveTextContent('Wikipedia contributors')
    expect(screen.getByRole('link', { name: /List of chemical element name etymologies/ })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/List_of_chemical_element_name_etymologies',
    )
    expect(screen.getByRole('link', { name: 'CC BY-SA 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-sa/4.0/',
    )
  })
})
