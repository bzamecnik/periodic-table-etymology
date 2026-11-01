import { useEffect, useState } from 'preact/hooks'

/** Phones held upright: too narrow for the tiles to carry their text. In step with the same width in the styles. */
export const PHONE = '(max-width: 699px)'

const matches = (query: string) => window.matchMedia?.(query).matches ?? false

export function useMediaQuery(query: string): boolean {
  const [matching, setMatching] = useState(() => matches(query))
  useEffect(() => {
    const list = window.matchMedia?.(query)
    if (!list) return
    const onChange = () => setMatching(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])
  return matching
}
