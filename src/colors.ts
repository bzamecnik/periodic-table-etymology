import type { ChemicalElement } from './data/index.ts'
import { familyOf, type Family, type Kind, PLACEHOLDER } from './data/vocabulary.ts'

export type ColorBy = 'kind' | 'language'

const slug = (value: string) => (value === PLACEHOLDER ? 'unknown' : value.toLowerCase())

export const kindColor = (kind: Kind) => `var(--kind-${slug(kind)})`
export const familyColor = (family: Family) => `var(--family-${slug(family)})`

/** The colors of a tile: two when it belongs to two kinds, otherwise both the same. */
export function tileColors(element: ChemicalElement, colorBy: ColorBy): [string, string] {
  if (colorBy === 'language') {
    const color = familyColor(familyOf(element.language))
    return [color, color]
  }
  const [first, second = first] = element.kinds
  return [kindColor(first), kindColor(second)]
}
