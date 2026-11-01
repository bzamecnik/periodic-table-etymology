import { source } from '../data/index.ts'

export function Attribution() {
  const revisionUrl = `https://en.wikipedia.org/w/index.php?oldid=${source.revision}`
  return (
    <footer class="attribution" role="contentinfo">
      <p>
        Etymologies adapted from{' '}
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          “{source.title}”
        </a>{' '}
        by Wikipedia contributors (
        <a href={revisionUrl} target="_blank" rel="noopener noreferrer">
          revision {source.revision}
        </a>
        ), under{' '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-SA 4.0
        </a>
        . Text restructured; categories, short meanings and language routes added as editorial judgement. Data under the
        same license, code MIT.
      </p>
    </footer>
  )
}
