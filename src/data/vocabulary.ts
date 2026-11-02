/** The controlled values of the curation layer, shared by the data build and the app. */

/** Marks a value still waiting for a curator. */
export const PLACEHOLDER = '?'

export const KINDS = ['place', 'person', 'celestial', 'property', 'mythology', 'substance', 'color', PLACEHOLDER] as const
export type Kind = (typeof KINDS)[number]

export const KIND_LABELS: Record<Kind, string> = {
  place: 'Place',
  person: 'Person',
  celestial: 'Celestial body',
  property: 'Property',
  mythology: 'Mythology',
  substance: 'Substance',
  color: 'Color',
  [PLACEHOLDER]: 'Unclassified',
}

export const FAMILIES = ['Greek', 'Latin', 'Germanic', 'Slavic', 'Other', PLACEHOLDER] as const
export type Family = (typeof FAMILIES)[number]

export const FAMILY_LABELS: Record<Family, string> = {
  Greek: 'Greek',
  Latin: 'Latin',
  Germanic: 'Germanic',
  Slavic: 'Slavic',
  Other: 'Other',
  [PLACEHOLDER]: 'Unclassified',
}

/**
 * Known languages: name -> family and a short code for the tiles. Reconstructed
 * ones may appear on a route, but never as the oldest language of a tile, because
 * sooner or later nearly every word would end up in Proto-Indo-European. The
 * later stages of a language can share the filter of the language itself.
 */
export const LANGUAGES: Record<string, { family: Family; code: string; reconstructed?: boolean; filterAs?: string }> = {
  Greek: { family: 'Greek', code: 'Gr' },
  Latin: { family: 'Latin', code: 'La' },
  'Old Latin': { family: 'Latin', code: 'OL', filterAs: 'Latin' },
  'Medieval Latin': { family: 'Latin', code: 'ML', filterAs: 'Latin' },
  'Neo-Latin': { family: 'Latin', code: 'NL', filterAs: 'Latin' },
  German: { family: 'Germanic', code: 'De' },
  Swedish: { family: 'Germanic', code: 'Sv' },
  Danish: { family: 'Germanic', code: 'Da' },
  Dutch: { family: 'Germanic', code: 'Nl' },
  English: { family: 'Germanic', code: 'En' },
  'Middle English': { family: 'Germanic', code: 'ME' },
  'Old English': { family: 'Germanic', code: 'OE' },
  'Old Norse': { family: 'Germanic', code: 'ON' },
  'Old High German': { family: 'Germanic', code: 'OH' },
  Frankish: { family: 'Germanic', code: 'Fk' },
  'West Germanic': { family: 'Germanic', code: 'WG', reconstructed: true },
  French: { family: 'Latin', code: 'Fr' },
  'Old French': { family: 'Latin', code: 'OF' },
  'Middle French': { family: 'Latin', code: 'MF' },
  'Anglo-Norman': { family: 'Latin', code: 'AN' },
  Italian: { family: 'Latin', code: 'It' },
  Spanish: { family: 'Latin', code: 'Es' },
  Russian: { family: 'Slavic', code: 'Ru' },
  Polish: { family: 'Slavic', code: 'Pl' },
  'Old East Slavic': { family: 'Slavic', code: 'OS' },
  Akkadian: { family: 'Other', code: 'Ak' },
  Arabic: { family: 'Other', code: 'Ar' },
  Armenian: { family: 'Other', code: 'Hy' },
  Egyptian: { family: 'Other', code: 'Eg' },
  Finnic: { family: 'Other', code: 'Fn' },
  Gaulish: { family: 'Other', code: 'Gl' },
  Hebrew: { family: 'Other', code: 'He' },
  Cherokee: { family: 'Other', code: 'Ch' },
  Finnish: { family: 'Other', code: 'Fi' },
  Japanese: { family: 'Other', code: 'Ja' },
  Pali: { family: 'Other', code: 'Pi' },
  Persian: { family: 'Other', code: 'Fa' },
  'Middle Persian': { family: 'Other', code: 'MP' },
  'Old Persian': { family: 'Other', code: 'OP' },
  Prakrit: { family: 'Other', code: 'Pk' },
  'Proto-Indo-European': { family: 'Other', code: 'PIE', reconstructed: true },
  Sanskrit: { family: 'Other', code: 'Sa' },
  'Scottish Gaelic': { family: 'Other', code: 'Gd' },
  Syriac: { family: 'Other', code: 'Sy' },
}

export function familyOf(language: string): Family {
  return LANGUAGES[language]?.family ?? PLACEHOLDER
}

export function filterLanguage(language: string): string {
  return LANGUAGES[language]?.filterAs ?? language
}

export function languageCode(language: string): string {
  return LANGUAGES[language]?.code ?? PLACEHOLDER
}
