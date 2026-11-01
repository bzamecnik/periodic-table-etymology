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

/** Long lines get smaller instead of being cut off; upright text and wide letters take more room. */
export function lineScale({ text, style }: TileLine): number {
  const letter = style === 'meaning' ? 0.47 : 0.54
  const width = [...text].reduce((sum, char) => sum + letter + (/[mwMW]/.test(char) ? 0.28 : 0), 0)
  return Math.max(0.78, Math.min(1, 6 / width))
}
