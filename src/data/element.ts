import type { Inline, Note } from './types.ts'
import type { Kind } from './vocabulary.ts'

export const CERTAINTIES = ['attested', 'traditional', 'disputed'] as const
export type Certainty = (typeof CERTAINTIES)[number]

export interface DeeperClaim {
  text: string
  certainty: Certainty
  sources: { label: string; url: string }[]
}

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

  /** What the element is named after, when that is not the meaning itself. */
  named?: string
  /** The meaning of the name; empty when only `named` and `about` tell the story. */
  gloss: string
  /** What the named thing is, for when its name has no known meaning. */
  about?: string
  kinds: Kind[]
  /** The oldest attested language of the name. */
  language: string
  path: string[]
  /** The oldest attested language of the symbol, when it has another origin than the name. */
  symbolLanguage?: string
  symbolPath?: string[]
  /** A short meaning of the symbol's word, for the tile. */
  symbolGloss?: string
  review?: string
  /** Sourced findings beyond the main Wikipedia table. */
  deeper: DeeperClaim[]

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
