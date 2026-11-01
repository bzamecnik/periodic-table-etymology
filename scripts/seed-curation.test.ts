import { describe, expect, it } from 'vitest'
import { draftEntry, draftGloss, draftKinds, draftLanguages } from './seed-curation.ts'

describe('draftKinds', () => {
  it('maps the nature of origin of Wikipedia', () => {
    expect(draftKinds('toponym').kinds).toEqual(['place'])
    expect(draftKinds('toponym (exonym)').kinds).toEqual(['place'])
    expect(draftKinds('eponym').kinds).toEqual(['person'])
    expect(draftKinds('descriptive').kinds).toEqual(['property'])
    expect(draftKinds('descriptive (colour)').kinds).toEqual(['color'])
    expect(draftKinds('astrological; mythological').kinds).toEqual(['celestial', 'mythology'])
    expect(draftKinds('descriptive, toponym').kinds).toEqual(['place', 'property'])
  })

  it('leaves a placeholder when missing', () => {
    expect(draftKinds('')).toEqual({ kinds: ['?'] })
  })

  it('flags uncertain and unknown values', () => {
    expect(draftKinds('descriptive?').review).toMatch(/Uncertain/)
    const unknown = draftKinds('whimsical')
    expect(unknown.kinds).toEqual(['?'])
    expect(unknown.review).toMatch(/whimsical/)
  })
})

describe('draftLanguages', () => {
  it('takes the oldest language and the route', () => {
    expect(draftLanguages('Greek')).toEqual({ language: 'Greek', path: ['Greek'] })
    expect(draftLanguages('Greek via Latin and French').path).toEqual(['Greek', 'Latin', 'French'])
    expect(draftLanguages('Arabic, Medieval Latin, Anglo-Norman, Middle French, and Middle English').language).toBe(
      'Arabic',
    )
  })

  it('reverses "from"', () => {
    expect(draftLanguages('Neo-Latin from German').path).toEqual(['German', 'Neo-Latin'])
  })

  it('normalizes names', () => {
    expect(draftLanguages('Ancient Greek').language).toBe('Greek')
    expect(draftLanguages('Anglo-Saxon via Middle English').path).toEqual(['Old English', 'Middle English'])
  })

  it('flags an uncertain language', () => {
    const draft = draftLanguages('Greek? via Medieval Latin and Middle English')
    expect(draft.language).toBe('Greek')
    expect(draft.review).toMatch(/Uncertain/)
  })

  it('leaves a placeholder when missing or ambiguous', () => {
    expect(draftLanguages('')).toEqual({ language: '?', path: [] })
    expect(draftLanguages('Swedish and Danish').language).toBe('?')
    expect(draftLanguages('Syriac/Persian via Arabic and German').language).toBe('?')
    expect(draftLanguages('Klingon').language).toBe('?')
  })

  it('takes Greek as older than Latin but flags it', () => {
    const draft = draftLanguages('Greek/Latin')
    expect(draft.language).toBe('Greek')
    expect(draft.review).toBeTruthy()
  })
})

describe('draftGloss', () => {
  it('takes a short meaning without its quotes', () => {
    expect(draftGloss('"sun"', '', [])).toBe('sun')
    expect(draftGloss('"beryl", a mineral', '', [])).toBe('beryl')
    expect(draftGloss('?"male"', '', [])).toBe('male')
  })

  it('names a person or place instead of a generic meaning', () => {
    expect(draftGloss('Italian surname', 'Fermi, Enrico', ['person'])).toBe('Enrico Fermi')
    expect(draftGloss('', 'Einstein, Albert', ['person'])).toBe('Albert Einstein')
    expect(draftGloss('Armenian surname', 'Oganessian, Yuri (Оганесян)', ['person'])).toBe('Yuri Oganessian')
    expect(draftGloss('proper name', 'Ytterby', ['place'])).toBe('Ytterby')
  })

  it('leaves a placeholder when too long or several options', () => {
    expect(draftGloss('possibly "the bearer" or "the sufferer"', '', [])).toBe('?')
    expect(draftGloss('"pebble"/"limestone"', '', [])).toBe('?')
    expect(draftGloss('', 'soda', [])).toBe('?')
  })
})

describe('draftEntry', () => {
  it('asks for the language of a symbol with its own origin', () => {
    const entry = draftEntry({ origin: '', language: 'Greek', meaning: '"x"', word: '', hasSymbolOrigin: true })
    expect(entry.symbolLanguage).toBe('?')
  })
})
