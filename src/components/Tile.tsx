import { type ColorBy, tileColors } from '../colors.ts'
import type { ChemicalElement } from '../data/index.ts'
import { KIND_LABELS, languageCode, PLACEHOLDER } from '../data/vocabulary.ts'
import { KindIcon } from './icons.tsx'
import { lineScale, tileLines } from './tileLines.ts'

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
  const gloss =
    element.gloss === PLACEHOLDER
      ? 'meaning not filled in yet'
      : tileLines(element)
          .map((line) => line.text)
          .join(', ')
  const name = element.language === PLACEHOLDER ? 'not classified yet' : element.language
  const language = hasOwnSymbolLanguage(element) ? `${name}, of the symbol: ${element.symbolLanguage}` : name
  const kinds = element.kinds.map((kind) => KIND_LABELS[kind]).join(', ')
  const match = dimmed ? ' Does not match the filters.' : ''
  return `${element.name}, ${element.symbol}, atomic number ${element.z}: ${gloss}. Oldest language: ${language}. Kind: ${kinds}.${match}`
}

const hasOwnSymbolLanguage = ({ language, symbolLanguage }: ChemicalElement) =>
  symbolLanguage !== undefined && symbolLanguage !== PLACEHOLDER && symbolLanguage !== language

/** Long names get smaller instead of being cut off. */
function nameScale(name: string): number {
  if (name.length >= 12) return 0.8
  if (name.length >= 9) return 0.9
  return 1
}

export function Tile({ element, colorBy, current, selected, dimmed, onSelect }: TileProps) {
  const [colorA, colorB] = tileColors(element, colorBy)
  const code = languageCode(element.language)
  const lines = tileLines(element)
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
        <span class="tile__head">
          <span class="tile__symbol">{element.symbol}</span>
          <span class="tile__meta">
            <span class="tile__numbers">
              <span class="tile__z">{element.z}</span>{' '}
              <span class="tile__code" title={element.language}>
                {code}
              </span>
            </span>
            <span class="tile__marks">
              {element.kinds.map((kind) => (
                <KindIcon key={kind} kind={kind} />
              ))}
              {hasOwnSymbolLanguage(element) && (
                <span class="tile__code" title={`Symbol: ${element.symbolLanguage}`}>
                  {languageCode(element.symbolLanguage!)}
                </span>
              )}
            </span>
          </span>
        </span>
        <span class="tile__name" style={{ '--name-scale': nameScale(element.name) }}>
          {element.name}
        </span>
        <span class={`tile__gloss${lines.length > 1 ? ' tile__gloss--two' : ''}`}>
          {lines.map((line) => (
            <span
              key={line.text}
              class={`tile__line tile__line--${line.style}`}
              style={lines.length > 1 ? { '--line-scale': lineScale(line) } : undefined}
            >
              {line.text}
            </span>
          ))}
        </span>
      </button>
    </div>
  )
}
