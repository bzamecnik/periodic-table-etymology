/**
 * Builds data/elements.json from the layers.
 *   --seed   creates data/curation.yaml from the Wikipedia fields, if not there yet
 *   --todo   only lists what is waiting for a curator
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { Document, isSeq, parse, visit } from 'yaml'
import { inlineToText } from '../src/data/inline.ts'
import { listTodos, mergeLayers, type PeriodicFacts } from './merge-layers.ts'
import { type CurationEntry, draftEntry } from './seed-curation.ts'
import { parseEtymologyPage } from './wikitext.ts'

const CURATION = 'data/curation.yaml'
const HEADER = `# Curation layer: what Wikipedia does not offer in a usable form.
# See data/README.md. A "?" is a placeholder; \`npm run data:todo\` lists them.
`

const read = (path: string) => readFileSync(path, 'utf8')
const rows = parseEtymologyPage(read('data/wikipedia/source.wikitext'))

if (process.argv.includes('--seed')) {
  if (existsSync(CURATION)) throw new Error(`${CURATION} exists and is edited by hand; not overwriting it`)
  const drafts = Object.fromEntries(
    rows.map((row) => [
      row.symbol,
      draftEntry({
        origin: row.origin,
        language: row.language,
        meaning: row.meaningText,
        word: inlineToText(row.word),
        hasSymbolOrigin: row.symbolOrigin.length > 0,
      }),
    ]),
  )
  const document = new Document(drafts)
  // one line per list keeps the file easy to scan and edit
  visit(document, {
    Seq(_key, node) {
      if (isSeq(node)) node.flow = true
    },
  })
  writeFileSync(CURATION, HEADER + document.toString({ lineWidth: 0 }))
}

const curation = parse(read(CURATION)) as Record<string, CurationEntry>

if (process.argv.includes('--todo')) {
  const todos = listTodos(curation)
  console.log(todos.join('\n'))
  console.log(`\n${todos.length} items waiting for a curator`)
} else {
  const periodic = JSON.parse(read('data/periodic.json')) as PeriodicFacts[]
  const source = JSON.parse(read('data/wikipedia/source.json'))
  const dataset = mergeLayers(source, periodic, rows, curation)
  writeFileSync('data/elements.json', JSON.stringify(dataset) + '\n')
  console.log(`data/elements.json: ${dataset.elements.length} elements, ${listTodos(curation).length} items to curate`)
}
