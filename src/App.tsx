import { Attribution } from './components/Attribution.tsx'
import { PeriodicTable } from './components/PeriodicTable.tsx'
import { elements } from './data/index.ts'

export function App() {
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
          currentZ={1}
          selectedZ={null}
          isActive={() => true}
          onSelect={() => {}}
        />
      </main>
      <Attribution />
    </div>
  )
}
