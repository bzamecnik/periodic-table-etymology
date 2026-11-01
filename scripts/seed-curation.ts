/**
 * Pure rules for drafting the curation layer from the Wikipedia fields.
 *
 * Used once, to create data/curation.yaml, which is edited by hand from then on.
 * Anything missing or ambiguous becomes a placeholder or a review note instead of
 * a guess.
 */
import { type Kind, LANGUAGES, PLACEHOLDER } from '../src/data/vocabulary.ts'

export interface CurationEntry {
  /** A very short meaning for the tile. */
  gloss: string
  kinds: Kind[]
  /** The oldest known language of the name or symbol. */
  language: string
  /** The route of the name, from the oldest language on. */
  path: string[]
  /** The oldest language of the symbol, when it has a different origin than the name. */
  symbolLanguage?: string
  /** What a curator should check. */
  review?: string
}

const GLOSS_MAX_LENGTH = 24

const LANGUAGE_ALIASES: Record<string, string> = {
  'Ancient Greek': 'Greek',
  'Anglo-Saxon': 'Old English',
}

function normalizeLanguage(name: string): string | undefined {
  const trimmed = name.trim()
  const canonical = LANGUAGE_ALIASES[trimmed] ?? trimmed
  return canonical in LANGUAGES ? canonical : undefined
}

export function draftKinds(origin: string): { kinds: Kind[]; review?: string } {
  const text = origin.toLowerCase()
  if (!text) return { kinds: [PLACEHOLDER] }
  const kinds: Kind[] = []
  if (text.includes('toponym')) kinds.push('place')
  if (text.includes('eponym')) kinds.push('person')
  if (text.includes('astrological')) kinds.push('celestial')
  if (text.includes('mythological')) kinds.push('mythology')
  if (text.includes('colour')) kinds.push('color')
  else if (text.includes('descriptive')) kinds.push('property')
  if (kinds.length === 0) return { kinds: [PLACEHOLDER], review: `Unknown origin in source: "${origin}"` }
  return text.includes('?') ? { kinds, review: `Uncertain origin in source: "${origin}"` } : { kinds }
}

export function draftLanguages(source: string): { language: string; path: string[]; review?: string } {
  const unresolved = (why: string) => ({
    language: PLACEHOLDER,
    path: [],
    review: `${why}: "${source}"`,
  })
  if (!source) return { language: PLACEHOLDER, path: [] }

  const uncertain = source.includes('?')
  const text = source.replaceAll('?', '')

  // "Neo-Latin from German": the language after "from" is the older one
  const from = /^(.*?) from (.*)$/.exec(text)
  const ordered = from ? `${from[2]} via ${from[1]}` : text

  const parts = ordered.split(/\s+via\s+|,\s*and\s+|,\s*|\s+and\s+/)
  const [head] = parts
  if (head.includes('/')) {
    const options = head.split('/').map(normalizeLanguage)
    // Greek/Latin: Greek is the older one by far
    if (options[0] === 'Greek' && options[1] === 'Latin') {
      return { language: 'Greek', path: ['Greek', 'Latin'], review: `Two languages in source: "${source}"` }
    }
    return unresolved('Two languages in source')
  }
  // "Swedish and Danish": parallel languages; a comma list is a route instead
  if (/^[^,]+\sand\s[^,]+$/.test(ordered.split(/\s+via\s+/)[0])) {
    return unresolved('Several languages in source')
  }

  const path = parts.map(normalizeLanguage)
  if (path.some((language) => language === undefined)) return unresolved('Unknown language in source')
  const known = path as string[]
  return {
    language: known[0],
    path: known,
    ...(uncertain ? { review: `Uncertain language in source: "${source}"` } : {}),
  }
}

/** "Curie, Marie" -> "Marie Curie". */
function personName(word: string): string | undefined {
  const match = /^([^,()]+),\s*([^,()]+?)(?:\s*\(.*\))?$/.exec(word.trim())
  return match ? `${match[2]} ${match[1]}` : undefined
}

export function draftGloss(meaning: string, word: string, kinds: Kind[]): string {
  const cleaned = meaning.replace(/^\?/, '').trim()
  const generic = !cleaned || /^(proper name|various)$/i.test(cleaned) || /\bsurname$/i.test(cleaned)

  if (generic) {
    const candidate = kinds.includes('person') ? personName(word) : kinds.includes('place') ? word.trim() : undefined
    return candidate && candidate.length <= GLOSS_MAX_LENGTH ? candidate : PLACEHOLDER
  }

  // the sole quoted word or phrase, when followed by a remark
  const quoted = /^"([^"]+)"(?:[,\s(].*)?$/.exec(cleaned)
  const text = quoted ? quoted[1] : cleaned
  return text.length <= GLOSS_MAX_LENGTH && !/["/]/.test(text) ? text : PLACEHOLDER
}

export function draftEntry(fields: {
  origin: string
  language: string
  meaning: string
  word: string
  hasSymbolOrigin: boolean
}): CurationEntry {
  const { kinds, review: kindsReview } = draftKinds(fields.origin)
  const { language, path, review: languageReview } = draftLanguages(fields.language)
  const gloss = draftGloss(fields.meaning, fields.word, kinds)
  const reviews = [kindsReview, languageReview].filter(Boolean)
  return {
    gloss,
    kinds,
    language,
    path,
    ...(fields.hasSymbolOrigin ? { symbolLanguage: PLACEHOLDER } : {}),
    ...(reviews.length > 0 ? { review: reviews.join('; ') } : {}),
  }
}
