/** Downloads the latest revision of the article; review the diff of the snapshot. */
import { writeFileSync } from 'node:fs'

const TITLE = 'List of chemical element name etymologies'
const api = new URL('https://en.wikipedia.org/w/api.php')
api.search = new URLSearchParams({
  action: 'query',
  prop: 'revisions',
  rvprop: 'ids|timestamp|content',
  rvslots: 'main',
  format: 'json',
  formatversion: '2',
  titles: TITLE,
}).toString()

const response = await fetch(api, { headers: { 'User-Agent': 'periodic-table-of-name-origins/0.1' } })
if (!response.ok) throw new Error(`Wikipedia answered ${response.status}`)
const body = (await response.json()) as {
  query: { pages: { revisions: { revid: number; timestamp: string; slots: { main: { content: string } } }[] }[] }
}
const revision = body.query.pages[0].revisions[0]

writeFileSync('data/wikipedia/source.wikitext', revision.slots.main.content)
writeFileSync(
  'data/wikipedia/source.json',
  JSON.stringify(
    {
      title: TITLE,
      url: `https://en.wikipedia.org/wiki/${TITLE.replaceAll(' ', '_')}`,
      revision: revision.revid,
      timestamp: revision.timestamp,
      license: 'CC BY-SA 4.0',
    },
    null,
    2,
  ) + '\n',
)
console.log(`Revision ${revision.revid} from ${revision.timestamp}. Now run: npm run data`)
