import { useCallback, useEffect, useState } from 'preact/hooks'
import { Attribution } from './components/Attribution.tsx'
import { DetailPanel } from './components/DetailPanel.tsx'
import { PeriodicTable } from './components/PeriodicTable.tsx'
import { type ChemicalElement, elements } from './data/index.ts'
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
const everything = () => true

export function App() {
  const [selectedZ, setSelectedZ] = useState<number | null>(zFromHash)
  const [currentZ, setCurrentZ] = useState<number>(() => zFromHash() ?? 1)

  const isActive = everything

  const select = useCallback((z: number | null) => {
    setSelectedZ(z)
    writeHash(z)
    if (z !== null) setCurrentZ(z)
  }, [])

  const close = () => {
    select(null)
    focusTile(currentZ)
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

  const onTileSelect = (element: ChemicalElement) => {
    select(element.z)
    focusTile(element.z)
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedZ !== null) close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div class="page">
      <header class="masthead">
        <h1>Periodic Table of Name Origins</h1>
        <p class="tagline">Where the names of all 118 elements come from.</p>
      </header>
      <main>
        <PeriodicTable
          elements={elements}
          colorBy="kind"
          currentZ={currentZ}
          selectedZ={selectedZ}
          isActive={isActive}
          onSelect={onTileSelect}
          onKeyDown={onTableKeyDown}
        >
          <DetailPanel
            element={selectedZ === null ? null : elements[selectedZ - 1]}
            onClose={close}
            onPrevious={() => moveSelection(-1)}
            onNext={() => moveSelection(1)}
          />
        </PeriodicTable>
      </main>
      <Attribution />
    </div>
  )
}
