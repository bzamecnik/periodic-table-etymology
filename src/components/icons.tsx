import { type Kind, PLACEHOLDER } from '../data/vocabulary.ts'

/** Icons of the kinds of origin, so that the kind is never told by color alone. */
const PATHS: Record<Kind, string> = {
  place: 'M8 1.5a4.6 4.6 0 0 0-4.6 4.6C3.4 9.5 8 14.5 8 14.5s4.6-5 4.6-8.4A4.6 4.6 0 0 0 8 1.5Zm0 6.3a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z',
  person: 'M8 1.8a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM2.6 14.2c.3-3 2.6-5 5.4-5s5.1 2 5.4 5H2.6Z',
  celestial: 'M8 1l1.9 4.6 5 .4-3.8 3.2 1.2 4.8L8 11.5 3.7 14l1.2-4.8L1.1 6l5-.4L8 1Z',
  property: 'M3 3h10v2.4H9.3V14H6.7V5.4H3V3Z',
  mythology: 'M9.4 1 3.5 9h3.7l-.9 6 6.2-8.6H8.6L9.4 1Z',
  substance: 'M8 1.2 14 4.6v6.8l-6 3.4-6-3.4V4.6l6-3.4Z',
  color: 'M8 1.5a6.5 6.5 0 0 0 0 13c1 0 1.5-.7 1.5-1.4 0-.9-.6-1.2-.6-2 0-.8.6-1.3 1.5-1.3h1.6A3 3 0 0 0 14.5 7C14.5 3.900 11.600 1.500 8 1.500ZM4.600 8.200a1.100 1.100 0 1 1 0-2.200 1.100 1.100 0 0 1 0 2.200Zm2.500-3a1.100 1.100 0 1 1 0-2.200 1.100 1.100 0 0 1 0 2.200Zm3.400.500a1.100 1.100 0 1 1 0-2.200 1.100 1.100 0 0 1 0 2.200Z',
  [PLACEHOLDER]: '',
}

export function KindIcon({ kind }: { kind: Kind }) {
  if (kind === PLACEHOLDER) {
    return (
      <span class="kind-icon kind-icon--unknown" aria-hidden="true">
        ?
      </span>
    )
  }
  return (
    <svg class="kind-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d={PATHS[kind]} fill="currentColor" fill-rule="evenodd" />
    </svg>
  )
}
