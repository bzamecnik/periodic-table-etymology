import type { ComponentChildren } from 'preact'
import type { ColorBy } from '../colors.ts'
import type { ChemicalElement } from '../data/index.ts'
import { Tile } from './Tile.tsx'

interface PeriodicTableProps {
  elements: ChemicalElement[]
  colorBy: ColorBy
  currentZ: number
  selectedZ: number | null
  isActive: (element: ChemicalElement) => boolean
  onSelect: (element: ChemicalElement) => void
  onKeyDown?: (event: KeyboardEvent) => void
  /** Placed in the free space in the upper middle of the table. */
  children?: ComponentChildren
}

function rowsOf(elements: ChemicalElement[]): [number, ChemicalElement[]][] {
  const rows = new Map<number, ChemicalElement[]>()
  for (const element of elements) rows.set(element.row, [...(rows.get(element.row) ?? []), element])
  for (const row of rows.values()) row.sort((a, b) => a.column - b.column)
  return [...rows.entries()].sort(([a], [b]) => a - b)
}

export function PeriodicTable(props: PeriodicTableProps) {
  const { elements, colorBy, currentZ, selectedZ, isActive, onSelect, onKeyDown, children } = props
  return (
    <div class="table-scroll">
      <div class="table-layout">
        <div
          role="grid"
          aria-label="Periodic table of the elements"
          aria-colcount={18}
          class="table-grid"
          onKeyDown={onKeyDown}
        >
          {rowsOf(elements).map(([row, cells]) => (
            <div role="row" key={row} class="table-row">
              {cells.map((element) => (
                <Tile
                  key={element.z}
                  element={element}
                  colorBy={colorBy}
                  current={element.z === currentZ}
                  selected={element.z === selectedZ}
                  dimmed={!isActive(element)}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))}
        </div>
        <p class="series-label" style={{ gridRow: 9 }}>
          Lanthanides <span>57–70</span>
        </p>
        <p class="series-label" style={{ gridRow: 10 }}>
          Actinides <span>89–102</span>
        </p>
        {children}
      </div>
    </div>
  )
}
