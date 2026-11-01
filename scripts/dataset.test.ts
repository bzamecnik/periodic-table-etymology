import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import type { ElementDataset } from '../src/data/element.ts'
import { type CurationEntry } from './seed-curation.ts'
import { mergeLayers, type PeriodicFacts } from './merge-layers.ts'
import { parseEtymologyPage } from './wikitext.ts'

const read = (path: string) => readFileSync(path, 'utf8')
const committed = JSON.parse(read('data/elements.json')) as ElementDataset

describe('the generated dataset', () => {
  it('is up to date with the layers (run `npm run data` if not)', () => {
    const rebuilt = mergeLayers(
      JSON.parse(read('data/wikipedia/source.json')),
      JSON.parse(read('data/periodic.json')) as PeriodicFacts[],
      parseEtymologyPage(read('data/wikipedia/source.wikitext')),
      parse(read('data/curation.yaml')) as Record<string, CurationEntry>,
    )
    expect(committed).toEqual(rebuilt)
  })

  it('holds all 118 elements in the order of atomic numbers', () => {
    expect(committed.elements.map((element) => element.z)).toEqual(Array.from({ length: 118 }, (_, i) => i + 1))
  })

  it('gives each element its own table position', () => {
    const positions = committed.elements.map((element) => `${element.column}/${element.row}`)
    expect(new Set(positions).size).toBe(118)
  })

  it('keeps the upper middle of the table free for the detail panel', () => {
    const inside = committed.elements.filter((e) => e.column >= 3 && e.column <= 12 && e.row <= 3)
    expect(inside).toEqual([])
  })

  it('starts the route of a name with its oldest language unless the symbol is older', () => {
    for (const element of committed.elements) {
      if (element.path.length > 0 && !element.symbolLanguage) expect(element.path[0]).toBe(element.language)
    }
  })

  it('has a description for each element but lead, whose article row has none', () => {
    const empty = committed.elements.filter((element) => element.description.length === 0)
    expect(empty.map((element) => element.symbol)).toEqual(['Pb'])
  })
})
