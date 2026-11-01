import { type ColorBy, tileColors } from '../colors.ts'
import type { ChemicalElement } from '../data/index.ts'
import { KindIcon } from './icons.tsx'
import { describeElement, hasOwnSymbolLanguage } from './Tile.tsx'
import { tileLines } from './tileLines.ts'

interface ElementListProps {
  elements: ChemicalElement[]
  colorBy: ColorBy
  onSelect: (element: ChemicalElement) => void
}

/** What the tiles say on a wider screen, for a phone whose tiles only fit the symbols. */
export function ElementList({ elements, colorBy, onSelect }: ElementListProps) {
  if (elements.length === 0) return <p class="element-list__empty">No element matches the filters.</p>
  return (
    <ul class="element-list" aria-label="Elements">
      {elements.map((element) => {
        const [colorA, colorB] = tileColors(element, colorBy)
        return (
          <li key={element.z}>
            <button
              type="button"
              id={`row-${element.symbol}`}
              class="element-row"
              aria-label={describeElement(element, false)}
              onClick={() => onSelect(element)}
            >
              <span class="element-row__symbol" style={{ '--color-a': colorA, '--color-b': colorB }}>
                {element.symbol}
              </span>
              <span class="element-row__text">
                <span class="element-row__name">{element.name}</span>
                {tileLines(element).map((line) => (
                  <span key={line.text} class={`element-row__line tile__line--${line.style}`}>
                    {line.text}
                  </span>
                ))}
              </span>
              <span class="element-row__meta">
                <span class="element-row__z">{element.z}</span>
                <span class="element-row__icons">
                  {element.kinds.map((kind) => (
                    <KindIcon key={kind} kind={kind} />
                  ))}
                </span>
                <span>{element.language}</span>
                {hasOwnSymbolLanguage(element) && <span>{element.symbolLanguage}</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
