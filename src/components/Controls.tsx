import type { Ref } from 'preact'
import { type ColorBy, familyColor, kindColor } from '../colors.ts'
import type { ChemicalElement } from '../data/index.ts'
import { FAMILY_LABELS, KIND_LABELS, type Kind, PLACEHOLDER } from '../data/vocabulary.ts'
import { countKinds, countLanguages, type Filters, groupLanguages, hasFilters, orderKinds, toggled } from '../filters.ts'
import { KindIcon } from './icons.tsx'

interface ControlsProps {
  elements: ChemicalElement[]
  filters: Filters
  matchCount: number
  colorBy: ColorBy
  searchRef: Ref<HTMLInputElement>
  onFiltersChange: (filters: Filters) => void
  onSearchSubmit: () => void
  onColorByChange: (colorBy: ColorBy) => void
  onClear: () => void
}

interface SearchBoxProps {
  filters: Filters
  searchRef: Ref<HTMLInputElement>
  onFiltersChange: (filters: Filters) => void
  onSearchSubmit: () => void
}

interface RowLabelProps {
  value: ColorBy
  label: string
  /** What the colors of the table then stand for. */
  meaning: string
  colorBy: ColorBy
  onColorByChange: (colorBy: ColorBy) => void
}

interface ChipProps {
  label: string
  count: number
  pressed: boolean
  color?: string
  icon?: Kind
  onClick: () => void
}

function Chip({ label, count, pressed, color, icon, onClick }: ChipProps) {
  return (
    <button
      type="button"
      class={`chip${count === 0 && !pressed ? ' chip--empty' : ''}`}
      aria-pressed={pressed}
      style={color ? { '--color-a': color } : undefined}
      onClick={onClick}
    >
      {icon && <KindIcon kind={icon} />}
      {label}{' '}
      <span class="chip__count">{count}</span>
    </button>
  )
}

function SearchBox({ filters, searchRef, onFiltersChange, onSearchSubmit }: SearchBoxProps) {
  return (
    <div class="search">
      <input
        ref={searchRef}
        type="search"
        aria-label="Search names, meanings and original words"
        placeholder="Search names…"
        value={filters.query}
        onInput={(event) => onFiltersChange({ ...filters, query: event.currentTarget.value })}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onSearchSubmit()
          } else if (event.key === 'Escape') {
            // only concerns the search: first clear it, then leave it; an open panel stays
            event.stopPropagation()
            if (filters.query === '') event.currentTarget.blur()
            else onFiltersChange({ ...filters, query: '' })
          }
        }}
      />
      {filters.query === '' && <kbd aria-hidden="true">/</kbd>}
    </div>
  )
}

/** Names a row of filters. Its radio button makes the row the legend of the colors. */
function RowLabel({ value, label, meaning, colorBy, onColorByChange }: RowLabelProps) {
  const title = `Color the table by ${meaning}`
  return (
    <label class="controls__label" title={title}>
      <input
        type="radio"
        name="color-by"
        value={value}
        aria-label={`${label}: ${title.toLowerCase()}`}
        checked={colorBy === value}
        onChange={() => onColorByChange(value)}
      />
      <span>{label}</span>
    </label>
  )
}

export function Controls(props: ControlsProps) {
  const { elements, filters, matchCount, colorBy, searchRef, onFiltersChange, onSearchSubmit, onColorByChange, onClear } =
    props
  const kindCounts = countKinds(elements, filters)
  const languageCounts = countLanguages(elements, filters)

  return (
    <section class="controls" aria-label="Filters">
      <div class="controls__search">
        <SearchBox
          filters={filters}
          searchRef={searchRef}
          onFiltersChange={onFiltersChange}
          onSearchSubmit={onSearchSubmit}
        />
        <p class="controls__status">
          <span class="match-count" role="status">
            {matchCount} of {elements.length} elements
          </span>
          {hasFilters(filters) && (
            <button type="button" class="clear" onClick={onClear}>
              Clear filters
            </button>
          )}
        </p>
      </div>
      <div class="controls__row">
        <RowLabel
          value="kind"
          label="Kind of origin"
          meaning="kind of origin"
          colorBy={colorBy}
          onColorByChange={onColorByChange}
        />
        <div class="chips" role="group" aria-label="Kind of origin">
          {orderKinds(elements).map((kind) => (
            <Chip
              key={kind}
              label={KIND_LABELS[kind]}
              count={kindCounts.get(kind)!}
              pressed={filters.kinds.has(kind)}
              color={colorBy === 'kind' ? kindColor(kind) : undefined}
              icon={kind}
              onClick={() => onFiltersChange({ ...filters, kinds: toggled(filters.kinds, kind) })}
            />
          ))}
        </div>
      </div>
      <div class="controls__row">
        <RowLabel
          value="language"
          label="Oldest language"
          meaning="language family"
          colorBy={colorBy}
          onColorByChange={onColorByChange}
        />
        <div class="chips" role="group" aria-label="Oldest language">
          {groupLanguages(elements).map(({ family, languages }) => {
            const chip = (language: string) => (
              <Chip
                key={language}
                label={language === PLACEHOLDER ? FAMILY_LABELS[PLACEHOLDER] : language}
                count={languageCounts.get(language)!}
                pressed={filters.languages.has(language)}
                color={colorBy === 'language' ? familyColor(family) : undefined}
                onClick={() => onFiltersChange({ ...filters, languages: toggled(filters.languages, language) })}
              />
            )
            const [first, ...others] = languages
            return (
              <div key={family} class="chips__family" role="group" aria-label={FAMILY_LABELS[family]}>
                {family !== PLACEHOLDER && languages.length > 1 ? (
                  <span class="chips__keep">
                    <span class="chips__family-label" aria-hidden="true">
                      {FAMILY_LABELS[family]}
                    </span>
                    {chip(first)}
                  </span>
                ) : (
                  chip(first)
                )}
                {others.map(chip)}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
