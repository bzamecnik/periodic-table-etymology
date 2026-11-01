import type { Inline, Note } from './types.ts'
import type { Kind } from './vocabulary.ts'

/** One element as used by the app: all data layers merged. */
export interface ChemicalElement {
  z: number
  symbol: string
  name: string
  period: number
  /** Null in the f-block, the two rows detached from the main table. */
  group: number | null
  block: 's' | 'p' | 'd' | 'f'
  /** The position in the drawn table, 1-based. */
  column: number
  row: number

  gloss: string
  kinds: Kind[]
  language: string
  path: string[]
  symbolLanguage?: string
  review?: string

  word: Inline[]
  meaning: Inline[]
  description: Inline[]
  symbolOrigin: Inline[]
  formerNames: Inline[]
  notes: Note[]
}

export interface ElementDataset {
  source: { title: string; url: string; revision: number; timestamp: string; license: string }
  elements: ChemicalElement[]
}
