import { render, screen } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { InlineText } from './InlineText.tsx'

describe('InlineText', () => {
  it('renders nested markup and language tags', () => {
    const { container } = render(
      <InlineText content={['a ', { tag: 'i', children: [{ tag: 'lang', lang: 'grc', children: ['ἥλιος'] }] }]} />,
    )
    expect(container.querySelector('i [lang="grc"]')).toHaveTextContent('ἥλιος')
  })

  it('opens external links separately and keeps in-page links', () => {
    render(
      <InlineText
        content={[
          { tag: 'link', href: 'https://example.org', children: ['out'] },
          { tag: 'link', href: '#Np', children: ['Np'] },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: 'out' })).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: 'Np' })).not.toHaveAttribute('target')
  })

  it('does not make a link of an unsafe address', () => {
    render(<InlineText content={[{ tag: 'link', href: 'javascript:alert(1)', children: ['bad'] }]} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('bad')).toBeInTheDocument()
  })

  it('never interprets text as markup', () => {
    const { container } = render(<InlineText content={['<img src=x onerror=alert(1)>']} />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('makes footnote markers lead to the note', () => {
    render(
      <>
        <InlineText content={[{ tag: 'note', id: 2 }]} noteIdPrefix="n" />
        <p id="n-2" tabIndex={-1}>
          text
        </p>
      </>,
    )
    Element.prototype.scrollIntoView = () => {}
    screen.getByRole('button', { name: 'Footnote 2' }).click()
    expect(document.getElementById('n-2')).toHaveFocus()
  })
})
