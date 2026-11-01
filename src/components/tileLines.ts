import type { ChemicalElement } from '../data/element.ts'
import { PLACEHOLDER } from '../data/vocabulary.ts'

export interface TileLine {
  text: string
  style: 'plain' | 'meaning' | 'todo'
}

/** The text below the name of an element on its tile: at most two lines, as the data test ensures. */
export function tileLines(element: ChemicalElement): TileLine[] {
  const { named, gloss, about, symbol, symbolGloss } = element
  const lines: TileLine[] = []
  if (named) lines.push({ text: named, style: 'plain' })
  if (gloss) lines.push({ text: gloss, style: gloss === PLACEHOLDER ? 'todo' : 'meaning' })
  else if (about) lines.push({ text: about, style: 'plain' })
  if (symbolGloss) lines.push({ text: `${symbol}: ${symbolGloss}`, style: 'plain' })
  return lines
}
