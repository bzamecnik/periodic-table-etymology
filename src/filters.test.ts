import { describe, expect, it } from 'vitest'
import { type ChemicalElement, elements } from './data/index.ts'
import type { Kind } from './data/vocabulary.ts'
import {
  countKinds,
  countLanguages,
  type Filters,
  followFilters,
  groupLanguages,
  hasFilters,
  matchesFilters,
  NO_FILTERS,
  normalize,
  oldestLanguages,
  orderKinds,
  toggled,
} from './filters.ts'

const element = (symbol: string) => elements.find((e) => e.symbol === symbol)!
const symbols = (filters: Partial<typeof NO_FILTERS>) =>
  elements.filter((e) => matchesFilters(e, { ...NO_FILTERS, ...filters })).map((e) => e.symbol)
const search = (query: string) => symbols({ query })

describe('matchesFilters', () => {
  it('lets everything through without filters', () => {
    expect(symbols({})).toHaveLength(118)
  })

  it('filters by kind, also for elements of several kinds', () => {
    const celestial = symbols({ kinds: new Set<Kind>(['celestial']) })
    expect(celestial).toContain('He')
    expect(celestial).not.toContain('Fe')
  })

  it('takes the values within a dimension as alternatives', () => {
    const result = symbols({ kinds: new Set<Kind>(['person', 'celestial']) })
    expect(result).toContain('Es')
    expect(result).toContain('He')
  })

  it('narrows across dimensions', () => {
    const result = symbols({ kinds: new Set<Kind>(['mythology']), languages: new Set(['Old Norse']) })
    expect(result).toEqual(expect.arrayContaining(['V', 'Th']))
    expect(result).not.toContain('Ti')
  })

  it('can select what is not classified yet', () => {
    const unclassified = { ...element('Li'), kinds: ['?' as Kind], language: '?' }
    expect(matchesFilters(unclassified, { ...NO_FILTERS, kinds: new Set<Kind>(['?']) })).toBe(true)
    expect(matchesFilters(unclassified, { ...NO_FILTERS, languages: new Set(['?']) })).toBe(true)
  })

  it('also finds the language of a symbol', () => {
    const curated = { ...element('Na'), language: 'English', symbolLanguage: 'Arabic' }
    expect(oldestLanguages(curated)).toEqual(['English', 'Arabic'])
    expect(matchesFilters(curated, { ...NO_FILTERS, languages: new Set(['Arabic']) })).toBe(true)
  })

  it('ignores the placeholder of a symbol language', () => {
    expect(oldestLanguages({ ...element('Na'), language: 'English', symbolLanguage: '?' })).toEqual(['English'])
  })
})

describe('search', () => {
  it('finds a name, regardless of case', () => {
    expect(search('HELIUM')).toContain('He')
  })

  it('finds an exact symbol', () => {
    expect(search('fe')).toContain('Fe')
    expect(search('W')).toContain('W')
  })

  it('finds a meaning and a language', () => {
    expect(search('moon')).toContain('Se')
    expect(search('swedish')).toContain('Y')
  })

  it('finds original words, also without diacritics', () => {
    expect(search('ηλιος')).toContain('He')
    expect(search('rontgen')).toContain('Rg')
  })

  it('finds former names', () => {
    expect(search('wolfram')).toContain('W')
  })

  it('matches at the start of words only', () => {
    expect(search('sun')).toContain('He')
    expect(search('ium')).not.toContain('He')
  })

  it('does not treat the placeholder as text', () => {
    const placeholder = { ...element('Xe'), gloss: '?' }
    expect(matchesFilters(placeholder, { ...NO_FILTERS, query: '?' })).toBe(false)
  })

  it('takes a blank query as none', () => {
    expect(search('   ')).toHaveLength(118)
    expect(hasFilters({ ...NO_FILTERS, query: '  ' })).toBe(false)
    expect(hasFilters({ ...NO_FILTERS, query: 'x' })).toBe(true)
  })

  it('combines with filters', () => {
    expect(symbols({ query: 'moon', kinds: new Set<Kind>(['person']) })).toEqual([])
  })
})

describe('counts', () => {
  it('counts kinds, with an element of two kinds in both', () => {
    const counts = countKinds(elements, NO_FILTERS)
    expect(counts.get('person')).toBeGreaterThan(10)
    expect(counts.get('substance')).toBeGreaterThan(0)
    const total = [...counts.values()].reduce((a, b) => a + b, 0)
    expect(total).toBe(elements.reduce((sum, e) => sum + e.kinds.length, 0))
  })

  it('counts a dimension under the other dimensions, not under itself', () => {
    const filters = { ...NO_FILTERS, kinds: new Set<Kind>(['person']), languages: new Set(['Greek']) }
    const kinds = countKinds(elements, filters)
    const languages = countLanguages(elements, filters)
    // choosing "person" must not make the other kinds look empty
    expect(kinds.get('place')).toBeGreaterThan(0)
    // while the languages are narrowed to the people
    expect(languages.get('Greek')).toBeLessThan(countLanguages(elements, NO_FILTERS).get('Greek')!)
  })

  it('keeps a language at zero rather than dropping it', () => {
    const counts = countLanguages(elements, { ...NO_FILTERS, query: 'moon' })
    expect(counts.get('Japanese')).toBe(0)
  })
})

describe('orderKinds', () => {
  const withKinds = (kinds: ChemicalElement['kinds']) => ({ ...element('Na'), kinds })

  it('puts the most common kind first and leaves out the unused ones', () => {
    const elements = [withKinds(['color']), withKinds(['person', 'color']), withKinds(['person']), withKinds(['color'])]
    expect(orderKinds(elements)).toEqual(['color', 'person'])
  })

  it('keeps the order of the vocabulary on a tie', () => {
    expect(orderKinds([withKinds(['color']), withKinds(['place'])])).toEqual(['place', 'color'])
  })

  it('leaves placeholders for the end', () => {
    expect(orderKinds([withKinds(['?']), withKinds(['?']), withKinds(['color'])])).toEqual(['color', '?'])
  })
})

describe('the later stages of Latin', () => {
  const sb = { ...element('Sb'), language: 'Medieval Latin', symbolLanguage: 'Greek' }

  it('filter as Latin', () => {
    expect(oldestLanguages(sb)).toEqual(['Latin', 'Greek'])
    expect(matchesFilters(sb, { ...NO_FILTERS, languages: new Set(['Latin']) })).toBe(true)
  })

  it('count once when name and symbol both end up as Latin', () => {
    expect(oldestLanguages({ ...sb, symbolLanguage: 'Latin' })).toEqual(['Latin'])
  })
})

describe('groupLanguages', () => {
  it('has the Romance languages together with Latin', () => {
    const latin = groupLanguages([element('Fe'), { ...element('Co'), language: 'Spanish' }])
    expect(latin.find((g) => g.languages.includes('Spanish'))!.family).toBe('Latin')
  })

  it('groups by family with the most common first', () => {
    const groups = groupLanguages(elements)
    expect(groups[0]).toEqual({ family: 'Greek', languages: ['Greek'] })
    const latin = groups.find((g) => g.family === 'Latin')!
    expect(latin.languages[0]).toBe('Latin')
  })

  it('leaves placeholders for the end', () => {
    const withPlaceholder = [{ ...element('Sm'), language: '?' }, ...elements]
    expect(groupLanguages(withPlaceholder).at(-1)).toEqual({ family: '?', languages: ['?'] })
  })
})

describe('normalize', () => {
  it('drops diacritics and folds whitespace', () => {
    expect(normalize('Ré  Sumé\u00a0X')).toBe('re sume x')
  })
})

describe('toggled', () => {
  it('adds and removes without changing the original', () => {
    const values = new Set(['a'])
    expect(toggled(values, 'b')).toEqual(new Set(['a', 'b']))
    expect(toggled(values, 'a')).toEqual(new Set())
    expect(values).toEqual(new Set(['a']))
  })
})

describe('followFilters', () => {
  const person: Filters = { ...NO_FILTERS, kinds: new Set(['person']) }

  it('stays on an element which matches', () => {
    expect(followFilters(elements, 64, person)).toBe(64)
    expect(followFilters(elements, 26, NO_FILTERS)).toBe(26)
  })

  it('moves to the first match', () => {
    expect(followFilters(elements, 26, person)).toBe(62)
  })

  it('has nowhere to go without matches', () => {
    expect(followFilters(elements, 26, { ...NO_FILTERS, query: 'zzzzzz' })).toBeNull()
  })
})
