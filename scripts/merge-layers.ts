/** Merges the data layers into the dataset used by the app. Pure, for testing. */
import type { ChemicalElement, ElementDataset } from '../src/data/element.ts'
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

function validateCuration(symbol: string, entry: CurationEntry): string[] {
  const errors: string[] = []
  const known = (language: string) => language === PLACEHOLDER || language in LANGUAGES
  if (typeof entry.gloss !== 'string' || !entry.gloss) errors.push(`${symbol}: gloss is missing`)
  if (!Array.isArray(entry.kinds) || entry.kinds.length === 0) errors.push(`${symbol}: kinds are missing`)
  for (const kind of entry.kinds ?? []) {
    if (!KINDS.includes(kind)) errors.push(`${symbol}: unknown kind "${kind}"`)
  }
  for (const language of [entry.language, ...(entry.path ?? []), entry.symbolLanguage ?? PLACEHOLDER]) {
    if (!known(language)) errors.push(`${symbol}: unknown language "${language}"`)
  }
  return errors
}

export function mergeLayers(
  source: ElementDataset['source'],
  periodic: PeriodicFacts[],
  rows: WikiRow[],
  curation: Record<string, CurationEntry>,
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
    const { meaningText: _meaning, language: _language, origin: _origin, symbol: _symbol, ...content } = row
    elements.push({ ...facts, ...tablePosition(facts), ...entry, ...content })
  }

  const symbols = new Set(periodic.map((facts) => facts.symbol))
  for (const symbol of [...rowsBySymbol.keys(), ...Object.keys(curation)]) {
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
