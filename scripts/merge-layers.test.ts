import { describe, expect, it } from 'vitest'
import type { CurationEntry } from './seed-curation.ts'
import { listTodos, mergeLayers, parseSource, type PeriodicFacts, tablePosition } from './merge-layers.ts'
import type { WikiRow } from './wikitext.ts'

const source = { title: 't', url: 'u', revision: 1, timestamp: 'x', license: 'l' }
const facts: PeriodicFacts = { z: 26, symbol: 'Fe', name: 'Iron', period: 4, group: 8, block: 'd' }
const row: WikiRow = {
  symbol: 'Fe',
  language: 'raw',
  origin: 'raw',
  meaningText: 'raw',
  word: ['w'],
  meaning: [],
  description: ['d'],
  symbolOrigin: [],
  formerNames: [],
  notes: [],
}
const entry: CurationEntry = { gloss: 'holy', kinds: ['property'], language: 'Latin', path: ['Latin'] }

describe('tablePosition', () => {
  it('uses group and period in the main table', () => {
    expect(tablePosition(facts)).toEqual({ column: 8, row: 4 })
  })

  it('detaches the f-block', () => {
    expect(tablePosition({ ...facts, z: 57, period: 6, group: null })).toEqual({ column: 3, row: 9 })
    expect(tablePosition({ ...facts, z: 102, period: 7, group: null })).toEqual({ column: 16, row: 10 })
  })
})

describe('mergeLayers', () => {
  it('combines the layers', () => {
    const { elements } = mergeLayers(source, [facts], [row], { Fe: entry })
    expect(elements[0]).toMatchObject({ name: 'Iron', gloss: 'holy', word: ['w'], column: 8, row: 4 })
  })

  it('does not carry the raw Wikipedia strings over', () => {
    const { elements } = mergeLayers(source, [facts], [row], { Fe: entry })
    expect(elements[0]).not.toHaveProperty('meaningText')
    expect(elements[0].language).toBe('Latin')
  })

  it.each([
    ['a missing row', [], { Fe: entry }, /missing in the Wikipedia/],
    ['a missing curation entry', [row], {}, /missing in the curation/],
    ['an unknown kind', [row], { Fe: { ...entry, kinds: ['nonsense'] } }, /unknown kind/],
    ['an unknown language', [row], { Fe: { ...entry, language: 'Klingon' } }, /unknown language/],
    ['an unknown element', [row], { Fe: entry, Xx: entry }, /Xx: unknown element/],
    ['a reconstructed language on a tile', [row], { Fe: { ...entry, language: 'Proto-Indo-European' } }, /reconstructed/],
    ['an unknown language of the symbol route', [row], { Fe: { ...entry, symbolPath: ['Klingon'] } }, /unknown language/],
    ['nothing to show on a tile', [row], { Fe: { ...entry, gloss: undefined } }, /gloss is missing/],
  ])('fails on %s', (_name, rows, curation, message) => {
    expect(() =>
      mergeLayers(source, [facts], rows as WikiRow[], curation as Record<string, CurationEntry>),
    ).toThrow(message)
  })
})

describe('the deeper layer', () => {
  const claim = { text: 't', certainty: 'attested', sources: ['en.wikipedia: Ytterby @ 123'] }
  const merge = (deeper: Record<string, unknown[]>) =>
    mergeLayers(source, [facts], [row], { Fe: entry }, deeper as never).elements[0]

  it('links a source to the revision which was read', () => {
    expect(parseSource('en.wiktionary: lea @ 42')).toEqual({
      label: 'Wiktionary: lea',
      url: 'https://en.wiktionary.org/w/index.php?oldid=42',
    })
  })

  it('names the language of a foreign edition', () => {
    expect(parseSource('sv.wikipedia: Gadolin @ 7').label).toBe('Wikipedia (sv): Gadolin')
  })

  it('merges the claims and defaults to none', () => {
    expect(merge({}).deeper).toEqual([])
    expect(merge({ Fe: [claim] }).deeper).toEqual([
      {
        text: 't',
        certainty: 'attested',
        sources: [{ label: 'Wikipedia: Ytterby', url: 'https://en.wikipedia.org/w/index.php?oldid=123' }],
      },
    ])
  })

  it('allows a tile without a gloss when it has a name to show', () => {
    const { elements } = mergeLayers(source, [facts], [row], { Fe: { ...entry, gloss: undefined, named: 'n' } })
    expect(elements[0]).toMatchObject({ gloss: '', named: 'n' })
  })

  it.each([
    ['no source', { ...claim, sources: [] }, /no source/],
    ['a malformed source', { ...claim, sources: ['Wikipedia'] }, /malformed source/],
    ['an unknown site', { ...claim, sources: ['en.blog: x @ 1'] }, /malformed source/],
    ['an unknown certainty', { ...claim, certainty: 'sure' }, /unknown certainty/],
    ['no text', { ...claim, text: '' }, /no text/],
  ])('fails on %s', (_name, bad, message) => {
    expect(() => merge({ Fe: [bad] })).toThrow(message)
  })

  it('fails on an unknown element', () => {
    expect(() => merge({ Xx: [claim] })).toThrow(/Xx: unknown element/)
  })
})

describe('listTodos', () => {
  it('lists placeholders and review notes', () => {
    const todos = listTodos({
      Fe: { gloss: '?', kinds: ['?'], language: '?', path: [], symbolLanguage: '?' },
      H: { ...entry, review: 'check it' },
      He: entry,
    })
    expect(todos).toEqual([
      'Fe: gloss',
      'Fe: kinds',
      'Fe: language',
      'Fe: symbolLanguage',
      'H: review: check it',
    ])
  })
})
