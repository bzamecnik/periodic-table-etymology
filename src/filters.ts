import type { ChemicalElement } from './data/index.ts'
import { inlineToText } from './data/inline.ts'
import { familyOf, FAMILIES, type Family, KINDS, type Kind, PLACEHOLDER } from './data/vocabulary.ts'

export interface Filters {
  kinds: ReadonlySet<Kind>
  languages: ReadonlySet<string>
  query: string
}

export const NO_FILTERS: Filters = { kinds: new Set(), languages: new Set(), query: '' }

export const hasFilters = (filters: Filters) =>
  filters.kinds.size > 0 || filters.languages.size > 0 || filters.query.trim() !== ''

/** Lower case without diacritics, so that "Rontgen" finds "Röntgen" and "ηλιος" finds "ἥλιος". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

const searchTexts = new WeakMap<ChemicalElement, string>()

function searchText(element: ChemicalElement): string {
  let text = searchTexts.get(element)
  if (text === undefined) {
    text = normalize(
      [
        element.name,
        element.named ?? '',
        element.gloss === PLACEHOLDER ? '' : element.gloss,
        element.about ?? '',
        element.symbolGloss ?? '',
        ...(element.symbolPath ?? []),
        ...element.deeper.map((claim) => claim.text),
        element.language === PLACEHOLDER ? '' : element.language,
        ...element.path,
        inlineToText(element.word),
        inlineToText(element.meaning),
        inlineToText(element.description),
        inlineToText(element.symbolOrigin),
        inlineToText(element.formerNames),
      ].join(' \n '),
    )
    searchTexts.set(element, text)
  }
  return text
}

/** A word start, not anywhere inside of a word: "sun" should not find "unsung" or "Tsunami". */
function hasWordStart(text: string, query: string): boolean {
  for (let i = text.indexOf(query); i >= 0; i = text.indexOf(query, i + 1)) {
    if (i === 0 || !/[\p{L}\p{N}]/u.test(text[i - 1])) return true
  }
  return false
}

function matchesQuery(element: ChemicalElement, query: string): boolean {
  const normalized = normalize(query).trim()
  if (!normalized) return true
  return normalize(element.symbol) === normalized || hasWordStart(searchText(element), normalized)
}

function matchesKinds(element: ChemicalElement, kinds: ReadonlySet<Kind>): boolean {
  return kinds.size === 0 || element.kinds.some((kind) => kinds.has(kind))
}

/** The oldest languages of an element: of the name, and of the symbol when it differs. */
export function oldestLanguages(element: ChemicalElement): string[] {
  const { language, symbolLanguage } = element
  if (!symbolLanguage || symbolLanguage === PLACEHOLDER) return [language]
  return symbolLanguage === language ? [language] : [language, symbolLanguage]
}

function matchesLanguages(element: ChemicalElement, languages: ReadonlySet<string>): boolean {
  return languages.size === 0 || oldestLanguages(element).some((language) => languages.has(language))
}

/** Values within a dimension are alternatives; the dimensions narrow each other. */
export function matchesFilters(element: ChemicalElement, filters: Filters): boolean {
  return (
    matchesKinds(element, filters.kinds) &&
    matchesLanguages(element, filters.languages) &&
    matchesQuery(element, filters.query)
  )
}

/** How many elements each kind would show, given the filters of the other dimensions. */
export function countKinds(elements: ChemicalElement[], filters: Filters): Map<Kind, number> {
  const others = { ...filters, kinds: new Set<Kind>() }
  const counts = new Map<Kind, number>(KINDS.map((kind) => [kind, 0]))
  for (const element of elements) {
    if (!matchesFilters(element, others)) continue
    for (const kind of element.kinds) counts.set(kind, counts.get(kind)! + 1)
  }
  return counts
}

/** The kinds in use, the most common first; placeholders stay at the end. The order ignores filters, so chips do not jump. */
export function orderKinds(elements: ChemicalElement[]): Kind[] {
  const totals = countKinds(elements, NO_FILTERS)
  const rank = (kind: Kind) => (kind === PLACEHOLDER ? -1 : totals.get(kind)!)
  return KINDS.filter((kind) => totals.get(kind)! > 0).sort((a, b) => rank(b) - rank(a))
}

/** How many elements each language would show, given the filters of the other dimensions. */
export function countLanguages(elements: ChemicalElement[], filters: Filters): Map<string, number> {
  const others = { ...filters, languages: new Set<string>() }
  const counts = new Map<string, number>()
  for (const element of elements) {
    for (const language of oldestLanguages(element)) {
      if (!counts.has(language)) counts.set(language, 0)
      if (matchesFilters(element, others)) counts.set(language, counts.get(language)! + 1)
    }
  }
  return counts
}

export interface LanguageGroup {
  family: Family
  languages: string[]
}

/** The languages in use by family, the most common first within each. */
export function groupLanguages(elements: ChemicalElement[]): LanguageGroup[] {
  const totals = countLanguages(elements, NO_FILTERS)
  return FAMILIES.map((family) => ({
    family,
    languages: [...totals.keys()]
      .filter((language) => familyOf(language) === family)
      .sort((a, b) => totals.get(b)! - totals.get(a)! || a.localeCompare(b)),
  })).filter((group) => group.languages.length > 0)
}

export function toggled<T>(values: ReadonlySet<T>, value: T): Set<T> {
  const result = new Set(values)
  if (!result.delete(value)) result.add(value)
  return result
}

/** Where a position in the table goes under new filters: it stays on a match, else moves to the first one, if any. */
export function followFilters(elements: ChemicalElement[], z: number, filters: Filters): number | null {
  if (matchesFilters(elements[z - 1], filters)) return z
  return elements.find((element) => matchesFilters(element, filters))?.z ?? null
}
