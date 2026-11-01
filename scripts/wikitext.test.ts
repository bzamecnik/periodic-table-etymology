import { describe, expect, it } from 'vitest'
import { parseEtymologyPage, parseInlineText } from './wikitext.ts'

const inline = (source: string, refs: Record<string, string> = {}) => parseInlineText(source, refs)

describe('parseInlineText', () => {
  it('keeps plain text and collapses whitespace', () => {
    expect(inline('  from   Greek\nroots ').content).toEqual(['from Greek roots'])
  })

  it('decodes entities', () => {
    expect(inline('a&nbsp;b &amp; c').content).toEqual(['a b & c'])
  })

  it('drops comments', () => {
    expect(inline('a<!-- to check -->b').content).toEqual(['ab'])
  })

  it('parses wiki links with labels and trailing letters', () => {
    expect(inline('[[Helium]]').content).toEqual([
      { tag: 'link', href: 'https://en.wikipedia.org/wiki/Helium', children: ['Helium'] },
    ])
    expect(inline('[[Mercury (planet)|Mercury]]').content).toEqual([
      { tag: 'link', href: 'https://en.wikipedia.org/wiki/Mercury_(planet)', children: ['Mercury'] },
    ])
    expect(inline('[[salt]]s of').content).toEqual([
      { tag: 'link', href: 'https://en.wikipedia.org/wiki/salt', children: ['salts'] },
      ' of',
    ])
  })

  it('parses external links', () => {
    expect(inline('[https://example.org Example] x').content).toEqual([
      { tag: 'link', href: 'https://example.org', children: ['Example'] },
      ' x',
    ])
  })

  it('parses bold and italics, also nested', () => {
    expect(inline("''a'' '''b'''").content).toEqual([
      { tag: 'i', children: ['a'] },
      ' ',
      { tag: 'b', children: ['b'] },
    ])
    expect(inline("'''''a''' b''").content).toEqual([
      { tag: 'i', children: [{ tag: 'b', children: ['a'] }, ' b'] },
    ])
  })

  it('keeps a lone apostrophe', () => {
    expect(inline("Rus' land").content).toEqual(["Rus' land"])
  })

  it('renders lang and translit templates with the language tag', () => {
    expect(inline('{{lang|grc|ἥλιος}}').content).toEqual([{ tag: 'lang', lang: 'grc', children: ['ἥλιος'] }])
    expect(inline('{{translit|grc|helios}}').content).toEqual([
      { tag: 'lang', lang: 'grc-Latn', children: [{ tag: 'i', children: ['helios'] }] },
    ])
    expect(inline('{{lang|de|[[Kobold]]|italic=yes}}').content).toEqual([
      {
        tag: 'lang',
        lang: 'de',
        children: [{ tag: 'link', href: 'https://en.wikipedia.org/wiki/Kobold', children: ['Kobold'] }],
      },
    ])
  })

  it('renders the other small templates', () => {
    expect(inline('{{cuneiform|𒊭𒅈𒇥}}').content).toEqual([{ tag: 'lang', lang: 'akk-Xsux', children: ['𒊭𒅈𒇥'] }])
    expect(inline('{{gcl|GEN}}').content).toEqual(['genitive'])
    expect(inline('{{sic}}').content).toEqual(['[sic]'])
    expect(inline('{{Script/Estrangelo Syriac|ܐ}}').content).toEqual(['ܐ'])
    expect(inline('{{section link||Np}}').content).toEqual([{ tag: 'link', href: '#Np', children: ['Np'] }])
  })

  it('fails on an unknown template rather than losing content', () => {
    expect(() => inline('{{mystery|x}}')).toThrow(/mystery/)
  })

  it('fails on an unknown tag rather than losing content', () => {
    expect(() => inline('<table>x</table>')).toThrow(/table/)
  })

  it('renders line breaks and superscripts', () => {
    expect(inline('a<br/>b<sup>2</sup>').content).toEqual([
      'a',
      { tag: 'br' },
      'b',
      { tag: 'sup', children: ['2'] },
    ])
  })

  it('collects footnotes in order and numbers them', () => {
    const result = inline('a<ref>first</ref> b<ref>second</ref>')
    expect(result.content).toEqual(['a', { tag: 'note', id: 1 }, ' b', { tag: 'note', id: 2 }])
    expect(result.notes).toEqual([
      { id: 1, content: ['first'] },
      { id: 2, content: ['second'] },
    ])
  })

  it('reuses one footnote for repeated named references', () => {
    const result = inline('a<ref name="x"/> b<ref name=x/>', { x: 'shared' })
    expect(result.content).toEqual(['a', { tag: 'note', id: 1 }, ' b', { tag: 'note', id: 1 }])
    expect(result.notes).toEqual([{ id: 1, content: ['shared'] }])
  })

  it('fails on a named reference without a definition', () => {
    expect(() => inline('a<ref name="missing"/>')).toThrow(/missing/)
  })

  it('renders {{refn}} as a footnote', () => {
    const result = inline('a{{refn|inner}}')
    expect(result.notes).toEqual([{ id: 1, content: ['inner'] }])
  })

  it('renders citations as linked text', () => {
    const { notes } = inline(
      '<ref>{{cite web|url=https://example.org/a|title=A Title|publisher=Pub|access-date=2026}}</ref>',
    )
    expect(notes[0].content).toEqual([{ tag: 'link', href: 'https://example.org/a', children: ['A Title'] }, '. Pub.'])
  })

  it('names authors and dates in citations', () => {
    const { notes } = inline('<ref>{{cite book|last=Doe|first=Jane|title=Book|year=1999}}</ref>')
    expect(notes[0].content).toEqual(['Doe, Jane (1999). ', { tag: 'i', children: ['Book'] }, '.'])
  })

  it('links to the Online Etymology Dictionary', () => {
    const { notes } = inline('<ref>{{cite OEtymD|carbon}}</ref>')
    expect(notes[0].content).toEqual([
      { tag: 'link', href: 'https://www.etymonline.com/word/carbon', children: ['Online Etymology Dictionary: carbon'] },
      '.',
    ])
  })

  it('skips hieroglyph markup, which only renders on Wikipedia', () => {
    expect(inline('a<div style="float:right"><hiero>R8-X1</hiero></div>b').content).toEqual(['ab'])
  })
})

describe('parseEtymologyPage', () => {
  const row = (body: string) => `{{List of chemical element name etymologies row\n${body}\n}}`

  it('reads the fields of each row', () => {
    const page = `intro
${row(`|symbol=He
|word-origin-lang = Greek
|word-origin = {{lang|grc|ἥλιος}}
|meaning     = "sun"
|origin      = astrological;<br/>mythological
|desc        = Named after the sun.`)}
${row(`|symbol=Li
|desc = Stone.`)}
outro`
    const rows = parseEtymologyPage(page)
    expect(rows.map((r) => r.symbol)).toEqual(['He', 'Li'])
    expect(rows[0].language).toBe('Greek')
    expect(rows[0].origin).toBe('astrological; mythological')
    expect(rows[0].meaningText).toBe('"sun"')
    expect(rows[0].word).toEqual([{ tag: 'lang', lang: 'grc', children: ['ἥλιος'] }])
    expect(rows[1].language).toBe('')
    expect(rows[1].meaning).toEqual([])
  })

  it('does not take citation parameters for row fields', () => {
    const [r] = parseEtymologyPage(
      row(`|symbol=Fr
|meaning = "x"<ref>{{cite web|title=T|url=https://e.org|origin=wrong}}</ref>
|desc = D`),
    )
    expect(r.origin).toBe('')
    expect(r.notes).toHaveLength(1)
  })

  it('numbers footnotes per element across fields, resolving references defined elsewhere', () => {
    const page = `Text.<ref name=shared>Shared note</ref>
${row(`|symbol=H
|word-origin = w<ref>one</ref>
|desc = d<ref name="shared"/>`)}`
    const [r] = parseEtymologyPage(page)
    expect(r.word).toEqual(['w', { tag: 'note', id: 1 }])
    expect(r.description).toEqual(['d', { tag: 'note', id: 2 }])
    expect(r.notes.map((n) => n.content)).toEqual([['one'], ['Shared note']])
  })

  it('merges the singular and plural former name fields', () => {
    const [a, b] = parseEtymologyPage(`${row('|symbol=A\n|alt-name = x')}${row('|symbol=B\n|alt-names = y')}`)
    expect(a.formerNames).toEqual(['x'])
    expect(b.formerNames).toEqual(['y'])
  })

  it('reads the origin of the symbol', () => {
    const [r] = parseEtymologyPage(row("|symbol=W\n|symbol-etym = '''W''' is from Wolfram."))
    expect(r.symbolOrigin).toEqual([{ tag: 'b', children: ['W'] }, ' is from Wolfram.'])
  })
})
