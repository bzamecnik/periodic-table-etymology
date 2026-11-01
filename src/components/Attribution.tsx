import { source } from '../data/index.ts'

const REPOSITORY_URL = 'https://github.com/bzamecnik/periodic-table-etymology'

export function Attribution() {
  return (
    <footer class="attribution" role="contentinfo">
      <p>
        Etymologies adapted from{' '}
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          Wikipedia
        </a>{' '}
        and{' '}
        <a href="https://en.wiktionary.org/" target="_blank" rel="noopener noreferrer">
          Wiktionary
        </a>{' '}
        (
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-SA 4.0
        </a>
        ).
      </p>
      <p>Visualized by Claude Code Opus 5.5, guided by Bohumír Zámečník. Project on{' '}
        <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
          GitHub 
        </a>
        .
      </p>
    </footer>
  )
}
