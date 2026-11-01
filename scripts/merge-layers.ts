/** Merges the data layers into the dataset used by the app. Pure, for testing. */
import { CERTAINTIES, type ChemicalElement, type DeeperClaim, type ElementDataset } from '../src/data/element.ts'
import { KINDS, LANGUAGES, PLACEHOLDER } from '../src/data/vocabulary.ts'
import type { CurationEntry } from './seed-curation.ts'
import type { WikiRow } from './wikitext.ts'

export interface PeriodicFacts {
  z: number
  symbol: string
  name: string
  period: number
  group: number | null
  block: ChemicalElement['block']
}

/** The f-block is drawn detached, one blank row below the main table. */
export function tablePosition(facts: PeriodicFacts): { column: number; row: number } {
  if (facts.group !== null) return { column: facts.group, row: facts.period }
  const first = facts.period === 6 ? 57 : 89
  return { column: 3 + facts.z - first, row: facts.period + 3 }
}

/** A claim of the deeper layer as written by hand. A source is like "en.wikipedia: Ytterby @ 1380007014". */
export interface DeeperEntry {
  text: string
  certainty: string
  sources: string[]
}

const SITES: Record<string, string> = {
  wikipedia: 'Wikipedia',
  wiktionary: 'Wiktionary',
}

/** Turns a source into a link to the very revision which was read. */
export function parseSource(source: string): { label: string; url: string } {
  const match = /^(\w+)\.(\w+): (.+) @ (\d+)$/.exec(source)
  const site = match && SITES[match[2]]
  if (!match || !site) throw new Error(`malformed source "${source}"`)
  const [, language, project, title, revision] = match
  const label = language === 'en' ? `${site}: ${title}` : `${site} (${language}): ${title}`
  return { label, url: `https://${language}.${project}.org/w/index.php?oldid=${revision}` }
}

function validateDeeper(symbol: string, entries: DeeperEntry[]): string[] {
  const errors: string[] = []
  for (const entry of entries) {
    if (!entry.text) errors.push(`${symbol}: a deeper claim has no text`)
    if (!CERTAINTIES.includes(entry.certainty as DeeperClaim['certainty'])) {
      errors.push(`${symbol}: unknown certainty "${entry.certainty}"`)
    }
    if (!entry.sources?.length) errors.push(`${symbol}: a deeper claim has no source`)
    for (const source of entry.sources ?? []) {
      try {
        parseSource(source)
      } catch (error) {
        errors.push(`${symbol}: ${(error as Error).message}`)
      }
    }
  }
  return errors
}

function validateCuration(symbol: string, entry: CurationEntry): string[] {
  const errors: string[] = []
  const known = (language: string) => language === PLACEHOLDER || language in LANGUAGES
  if (!entry.gloss && !entry.named && !entry.about) errors.push(`${symbol}: gloss is missing`)
  if (!Array.isArray(entry.kinds) || entry.kinds.length === 0) errors.push(`${symbol}: kinds are missing`)
  for (const kind of entry.kinds ?? []) {
    if (!KINDS.includes(kind)) errors.push(`${symbol}: unknown kind "${kind}"`)
  }
  const oldest = [entry.language, entry.symbolLanguage ?? PLACEHOLDER]
  for (const language of [...oldest, ...(entry.path ?? []), ...(entry.symbolPath ?? [])]) {
    if (!known(language)) errors.push(`${symbol}: unknown language "${language}"`)
  }
  for (const language of oldest) {
    if (LANGUAGES[language]?.reconstructed) errors.push(`${symbol}: "${language}" is reconstructed, so not for a tile`)
  }
  return errors
}

export function mergeLayers(
  source: ElementDataset['source'],
  periodic: PeriodicFacts[],
  rows: WikiRow[],
  curation: Record<string, CurationEntry>,
  deeper: Record<string, DeeperEntry[]> = {},
): ElementDataset {
  const errors: string[] = []
  const rowsBySymbol = new Map(rows.map((row) => [row.symbol, row]))
  const elements: ChemicalElement[] = []

  for (const facts of periodic) {
    const row = rowsBySymbol.get(facts.symbol)
    const entry = curation[facts.symbol]
    if (!row) errors.push(`${facts.symbol}: missing in the Wikipedia table`)
    if (!entry) errors.push(`${facts.symbol}: missing in the curation layer`)
    if (!row || !entry) continue
    errors.push(...validateCuration(facts.symbol, entry))
    const claims = deeper[facts.symbol] ?? []
    const claimErrors = validateDeeper(facts.symbol, claims)
    errors.push(...claimErrors)
    const { meaningText: _meaning, language: _language, origin: _origin, symbol: _symbol, ...content } = row
    elements.push({
      ...facts,
      ...tablePosition(facts),
      ...entry,
      gloss: entry.gloss ?? '',
      ...content,
      deeper:
        claimErrors.length > 0
          ? []
          : claims.map(({ text, certainty, sources }) => ({
              text,
              certainty: certainty as DeeperClaim['certainty'],
              sources: sources.map(parseSource),
            })),
    })
  }

  const symbols = new Set(periodic.map((facts) => facts.symbol))
  for (const symbol of [...rowsBySymbol.keys(), ...Object.keys(curation), ...Object.keys(deeper)]) {
    if (!symbols.has(symbol)) errors.push(`${symbol}: unknown element`)
  }
  if (errors.length > 0) throw new Error(`Invalid data:\n${errors.join('\n')}`)
  return { source, elements }
}

/** Everything still waiting for a curator, as readable lines. */
export function listTodos(curation: Record<string, CurationEntry>): string[] {
  const todos: string[] = []
  for (const [symbol, entry] of Object.entries(curation)) {
    if (entry.gloss === PLACEHOLDER) todos.push(`${symbol}: gloss`)
    if (entry.kinds.includes(PLACEHOLDER)) todos.push(`${symbol}: kinds`)
    if (entry.language === PLACEHOLDER) todos.push(`${symbol}: language`)
    if (entry.symbolLanguage === PLACEHOLDER) todos.push(`${symbol}: symbolLanguage`)
    if (entry.review) todos.push(`${symbol}: review: ${entry.review}`)
  }
  return todos
}
