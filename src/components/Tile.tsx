import { type ColorBy, tileColors } from '../colors.ts'
import type { ChemicalElement } from '../data/index.ts'
import { KIND_LABELS, languageCode, PLACEHOLDER } from '../data/vocabulary.ts'
import { KindIcon } from './icons.tsx'

interface TileProps {
  element: ChemicalElement
  colorBy: ColorBy
  /** The one tile of the table reachable by Tab. */
  current: boolean
  selected: boolean
  dimmed: boolean
  onSelect: (element: ChemicalElement) => void
}

function describe(element: ChemicalElement, dimmed: boolean): string {
  const gloss = element.gloss === PLACEHOLDER ? 'meaning not filled in yet' : element.gloss
  const language = element.language === PLACEHOLDER ? 'not classified yet' : element.language
  const kinds = element.kinds.map((kind) => KIND_LABELS[kind]).join(', ')
  const match = dimmed ? ' Does not match the filters.' : ''
  return `${element.name}, ${element.symbol}, atomic number ${element.z}: ${gloss}. Oldest language: ${language}. Kind: ${kinds}.${match}`
}

export function Tile({ element, colorBy, current, selected, dimmed, onSelect }: TileProps) {
  const [colorA, colorB] = tileColors(element, colorBy)
  const code = languageCode(element.language)
  return (
    <div role="gridcell" aria-colindex={element.column} aria-selected={selected} class="tile-cell">
      <button
        type="button"
        id={`tile-${element.symbol}`}
        class={`tile${dimmed ? ' tile--dimmed' : ''}${selected ? ' tile--selected' : ''}`}
        style={{
          gridColumn: element.column,
          gridRow: element.row,
          '--color-a': colorA,
          '--color-b': colorB,
        }}
        tabIndex={current ? 0 : -1}
        aria-label={describe(element, dimmed)}
        onClick={() => onSelect(element)}
      >
        <span class="tile__top">
          <span class="tile__z">{element.z}</span>
          <span class="tile__marks">
            {element.kinds.map((kind) => (
              <KindIcon key={kind} kind={kind} />
            ))}
            <span class="tile__code" title={element.language}>
              {code}
            </span>
          </span>
        </span>
        <span class="tile__symbol">{element.symbol}</span>
        <span class="tile__name">{element.name}</span>
        <span class={`tile__gloss${element.gloss === PLACEHOLDER ? ' tile__gloss--todo' : ''}`}>{element.gloss}</span>
      </button>
    </div>
  )
}
