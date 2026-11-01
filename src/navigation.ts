import type { ChemicalElement } from './data/index.ts'

type Predicate = (element: ChemicalElement) => boolean

/** The next active element by atomic number, or the same one at either end. */
export function nextLinear(elements: ChemicalElement[], z: number, direction: 1 | -1, isActive: Predicate): number {
  for (let candidate = z + direction; candidate >= 1 && candidate <= elements.length; candidate += direction) {
    if (isActive(elements[candidate - 1])) return candidate
  }
  return z
}

/** The nearest active element up or down in the same column, or the same one. */
export function nextVertical(elements: ChemicalElement[], z: number, direction: 1 | -1, isActive: Predicate): number {
  const current = elements[z - 1]
  const candidates = elements
    .filter((e) => e.column === current.column && (e.row - current.row) * direction > 0 && isActive(e))
    .sort((a, b) => (a.row - b.row) * direction)
  return candidates[0]?.z ?? z
}

/** The first or last active element, or the same one when none is active. */
export function edge(elements: ChemicalElement[], z: number, direction: 1 | -1, isActive: Predicate): number {
  const active = elements.filter(isActive)
  if (active.length === 0) return z
  return (direction === 1 ? active[active.length - 1] : active[0]).z
}

/** Maps a key to the atomic number it leads to, or null when it is no navigation key. */
export function navigate(elements: ChemicalElement[], z: number, key: string, isActive: Predicate): number | null {
  switch (key) {
    case 'ArrowRight':
      return nextLinear(elements, z, 1, isActive)
    case 'ArrowLeft':
      return nextLinear(elements, z, -1, isActive)
    case 'ArrowDown':
      return nextVertical(elements, z, 1, isActive)
    case 'ArrowUp':
      return nextVertical(elements, z, -1, isActive)
    case 'Home':
      return edge(elements, z, -1, isActive)
    case 'End':
      return edge(elements, z, 1, isActive)
    default:
      return null
  }
}
