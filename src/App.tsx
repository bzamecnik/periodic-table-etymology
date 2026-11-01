import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { ColorBy } from './colors.ts'
import { Attribution } from './components/Attribution.tsx'
import { Controls } from './components/Controls.tsx'
import { DetailPanel } from './components/DetailPanel.tsx'
import { PeriodicTable } from './components/PeriodicTable.tsx'
import { type ChemicalElement, elements } from './data/index.ts'
import { type Filters, followFilters, matchesFilters, NO_FILTERS } from './filters.ts'
import { navigate, nextLinear } from './navigation.ts'

function zFromHash(): number | null {
  const symbol = window.location.hash.slice(1)
  return elements.find((element) => element.symbol === symbol)?.z ?? null
}

function writeHash(z: number | null) {
  const url = z === null ? window.location.pathname + window.location.search : `#${elements[z - 1].symbol}`
  // no history entry per element: the back button should leave the page, not walk the table
  window.history.replaceState(null, '', url)
}

const focusTile = (z: number) => document.getElementById(`tile-${elements[z - 1].symbol}`)?.focus()

/** A click on any of these has a purpose of its own, so it does not close the panel. */
const KEEPS_PANEL_OPEN = 'button, a, input, label, .panel'

export function App() {
  const [selectedZ, setSelectedZ] = useState<number | null>(zFromHash)
  const [currentZ, setCurrentZ] = useState<number>(() => zFromHash() ?? 1)

  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [colorBy, setColorBy] = useState<ColorBy>('kind')
  const searchRef = useRef<HTMLInputElement>(null)

  const activeElements = useMemo(() => new Set(elements.filter((e) => matchesFilters(e, filters))), [filters])
  const isActive = useCallback((element: ChemicalElement) => activeElements.has(element), [activeElements])

  const select = useCallback((z: number | null) => {
    setSelectedZ(z)
    writeHash(z)
    if (z !== null) setCurrentZ(z)
  }, [])

  const close = () => {
    // the focus would get lost with the panel; elsewhere it stays where it is
    const focusInPanel = document.activeElement?.closest('.panel')
    select(null)
    if (focusInPanel) focusTile(currentZ)
  }

  const moveSelection = (direction: 1 | -1) => {
    if (selectedZ !== null) select(nextLinear(elements, selectedZ, direction, isActive))
  }

  const onTableKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const z = navigate(elements, currentZ, event.key, isActive)
    if (z === null) return
    event.preventDefault()
    setCurrentZ(z)
    focusTile(z)
    // an open panel follows along
    if (selectedZ !== null) select(z)
  }

  const goToFirstMatch = () => {
    const [first] = activeElements
    if (!first) return
    setCurrentZ(first.z)
    focusTile(first.z)
    if (selectedZ !== null) select(first.z)
  }

  const onTileSelect = (element: ChemicalElement) => {
    select(element.z === selectedZ ? null : element.z)
    focusTile(element.z)
  }

  const changeFilters = (next: Filters) => {
    setFilters(next)
    if (selectedZ !== null) select(followFilters(elements, selectedZ, next))
    setCurrentZ((z) => followFilters(elements, z, next) ?? z)
  }

  useEffect(() => {
    const onHashChange = () => {
      const z = zFromHash()
      setSelectedZ(z)
      if (z !== null) setCurrentZ(z)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // a layout effect: a key pressed right after a move must already see that move
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedZ !== null) close()
        else if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      }
      // with the focus nowhere, the arrows lead back to the table
      if (event.target === document.body) onTableKeyDown(event)
      const typing = event.target instanceof HTMLInputElement && event.target.type === 'search'
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
      } else if (event.key.toLowerCase() === 'c' && !event.repeat) {
        setColorBy((current) => (current === 'kind' ? 'language' : 'kind'))
      }
    }
    const onClick = (event: MouseEvent) => {
      if (selectedZ === null || !(event.target instanceof Element)) return
      // the end of a drag which selected some text is a click as well
      if (event.target.closest(KEEPS_PANEL_OPEN) || window.getSelection()?.isCollapsed === false) return
      select(null)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('click', onClick)
    }
  })

  return (
    <div class="page">
      <Controls
        elements={elements}
        filters={filters}
        matchCount={activeElements.size}
        colorBy={colorBy}
        searchRef={searchRef}
        onFiltersChange={changeFilters}
        onSearchSubmit={goToFirstMatch}
        onColorByChange={setColorBy}
        onClear={() => changeFilters(NO_FILTERS)}
      />
      <PeriodicTable
        elements={elements}
        colorBy={colorBy}
        currentZ={currentZ}
        selectedZ={selectedZ}
        isActive={isActive}
        onSelect={onTileSelect}
        onKeyDown={onTableKeyDown}
      >
        <header class="masthead">
          <h1>Periodic Table of Name Origins</h1>
          <p class="tagline">Where the names of all 118 elements come from.</p>
        </header>
        <DetailPanel
          element={selectedZ === null ? null : elements[selectedZ - 1]}
          onClose={close}
          onPrevious={() => moveSelection(-1)}
          onNext={() => moveSelection(1)}
        />
        <Attribution />
      </PeriodicTable>
    </div>
  )
}
