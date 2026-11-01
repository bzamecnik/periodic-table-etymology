import { source } from '../data/index.ts'

export function Attribution() {
  const revisionUrl = `https://en.wikipedia.org/w/index.php?oldid=${source.revision}`
  return (
    <footer class="attribution">
      <p>
        Etymologies adapted from{' '}
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          “{source.title}”
        </a>{' '}
        by Wikipedia contributors (
        <a href={revisionUrl} target="_blank" rel="noopener noreferrer">
          revision {source.revision}
        </a>
        ), licensed under{' '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-SA 4.0
        </a>
        . The text was restructured; the categories, short meanings and language routes were added for this site and
        are editorial judgement. The adapted data is under the same license; the code is MIT.
      </p>
    </footer>
  )
}
