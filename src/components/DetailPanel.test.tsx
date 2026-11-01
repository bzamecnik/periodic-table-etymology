import { cleanup, render, screen, within } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { elements } from '../data/index.ts'
import { DetailPanel, languageRoute } from './DetailPanel.tsx'

const element = (symbol: string) => elements.find((e) => e.symbol === symbol)!
const show = (symbol: string) =>
  render(<DetailPanel element={element(symbol)} onClose={vi.fn()} onPrevious={vi.fn()} onNext={vi.fn()} />)

describe('DetailPanel', () => {
  it('explains how to read the table when nothing is selected', () => {
    render(<DetailPanel element={null} onClose={vi.fn()} onPrevious={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByRole('complementary', { name: 'How to read the table' })).toBeInTheDocument()
  })

  it('shows the etymology of an element', () => {
    show('He')
    const panel = screen.getByRole('complementary', { name: 'Name origin of Helium' })
    expect(within(panel).getByRole('heading', { name: 'Helium' })).toBeInTheDocument()
    expect(panel).toHaveTextContent('Atomic number 2')
    expect(panel).toHaveTextContent('ἥλιος')
    expect(panel).toHaveTextContent('Celestial body')
    expect(panel).toHaveTextContent('Mythology')
  })

  it('shows the route of a name up to English', () => {
    show('H')
    expect(languageRoute(element('H'))).toEqual(['Greek', 'Latin', 'French', 'English'])
    for (const language of languageRoute(element('H'))) expect(screen.getByText(language)).toBeInTheDocument()
  })

  it('does not repeat English at the end of a route', () => {
    const route = languageRoute({ ...element('H'), path: ['Old English', 'English'] })
    expect(route).toEqual(['Old English', 'English'])
  })

  it('shows the symbol origin and former names when there are some', () => {
    show('W')
    const panel = screen.getByRole('complementary')
    expect(panel).toHaveTextContent('Wolfram')
    expect(panel).toHaveTextContent('Former names')
  })

  it('shows what still needs curating', () => {
    show('Sb')
    expect(screen.getByText(/Uncertain language in source/)).toBeInTheDocument()
    cleanup()
    show('S')
    expect(screen.getByText(/Not classified yet/)).toBeInTheDocument()
  })

  it('shows what an element is named after, and its sourced findings', () => {
    render(
      <DetailPanel
        element={{
          ...element('Y'),
          named: 'Somewhere',
          gloss: 'a meaning',
          about: 'a village',
          symbolPath: ['Latin', 'French'],
          symbolGloss: 'a symbol word',
          deeper: [
            {
              text: 'A finding.',
              certainty: 'disputed',
              sources: [{ label: 'Wikipedia: Somewhere', url: 'https://en.wikipedia.org/w/index.php?oldid=1' }],
            },
            { text: 'A fact.', certainty: 'attested', sources: [{ label: 'Wiktionary: x', url: 'https://u/' }] },
          ],
        }}
        onClose={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    )
    const panel = screen.getByRole('complementary')
    for (const text of ['Somewhere', 'a meaning', 'a village', 'Y: a symbol word', 'Symbol route', 'A finding.']) {
      expect(panel).toHaveTextContent(text)
    }
    expect(screen.getByRole('link', { name: 'Wikipedia: Somewhere' })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/w/index.php?oldid=1',
    )
    expect(screen.getByText('disputed')).toBeInTheDocument()
    expect(screen.queryByText('attested')).toBeNull()
  })

  it('lists the footnotes with their ids', () => {
    show('Zr')
    const first = document.getElementById('note-Zr-1')
    expect(first).toHaveTextContent('Syriac Literature')
    expect(screen.getByRole('button', { name: 'Footnote 1' })).toBeInTheDocument()
  })

  it('moves and closes through its buttons', () => {
    const onClose = vi.fn()
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    render(<DetailPanel element={element('H')} onClose={onClose} onPrevious={onPrevious} onNext={onNext} />)
    screen.getByRole('button', { name: 'Close details' }).click()
    screen.getByRole('button', { name: 'Next element' }).click()
    screen.getByRole('button', { name: 'Previous element' }).click()
    expect(onClose).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledOnce()
    expect(onPrevious).toHaveBeenCalledOnce()
  })
})
