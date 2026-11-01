/**
 * A parser for the small subset of wikitext used by the Wikipedia article
 * "List of chemical element name etymologies".
 *
 * Unknown templates and tags throw on purpose: a new revision of the article
 * must not silently lose content.
 */
import { inlineToText } from '../src/data/inline.ts'
import type { Inline, InlineNode, Note } from '../src/data/types.ts'

const ROW_TEMPLATE = '{{List of chemical element name etymologies row'
const WIKI_BASE = 'https://en.wikipedia.org/wiki/'

/** Definitions of named footnotes, name -> wikitext. */
export type RefDefinitions = Record<string, string>

export interface ParsedInline {
  content: Inline[]
  notes: Note[]
}

/** One row of the article's table. */
export interface WikiRow {
  symbol: string
  /** The original "language of origin" as plain text. */
  language: string
  /** The original "nature of origin" as plain text. */
  origin: string
  /** The original "meaning" as plain text. */
  meaningText: string
  word: Inline[]
  meaning: Inline[]
  description: Inline[]
  symbolOrigin: Inline[]
  formerNames: Inline[]
  notes: Note[]
}

class NoteCollector {
  notes: Note[] = []
  private ids = new Map<string, number>()
  private readonly definitions: RefDefinitions

  constructor(definitions: RefDefinitions) {
    this.definitions = definitions
  }

  add(source: string, name?: string): number {
    if (name !== undefined) {
      const existing = this.ids.get(name)
      if (existing !== undefined) return existing
    }
    const note: Note = { id: this.notes.length + 1, content: [] }
    this.notes.push(note)
    if (name !== undefined) this.ids.set(name, note.id)
    note.content = parseFragment(source, this)
    return note.id
  }

  addNamed(name: string): number {
    if (this.ids.has(name)) return this.ids.get(name)!
    const source = this.definitions[name]
    if (source === undefined) throw new Error(`Footnote "${name}" has no definition`)
    return this.add(source, name)
  }
}

type Frame = { node: Extract<InlineNode, { children: Inline[] }> | null; children: Inline[] }

/** Builds an inline tree, with bold and italics possibly overlapping. */
class TreeBuilder {
  private stack: Frame[] = [{ node: null, children: [] }]

  private get top() {
    return this.stack[this.stack.length - 1]
  }

  text(value: string) {
    const { children } = this.top
    const last = children[children.length - 1]
    if (typeof last === 'string') children[children.length - 1] = last + value
    else children.push(value)
  }

  node(node: InlineNode) {
    this.top.children.push(node)
  }

  nodes(nodes: Inline[]) {
    for (const node of nodes) {
      if (typeof node === 'string') this.text(node)
      else this.node(node)
    }
  }

  open(tag: 'i' | 'b' | 'sup' | 'sub') {
    this.stack.push({ node: { tag, children: [] }, children: [] })
  }

  isOpen(tag: string) {
    return this.stack.some((frame) => frame.node?.tag === tag)
  }

  /** Closes the tag; tags opened inside of it continue after it. */
  close(tag: 'i' | 'b' | 'sup' | 'sub') {
    const reopen: ('i' | 'b' | 'sup' | 'sub')[] = []
    while (this.stack.length > 1) {
      const frameTag = this.closeTop()
      if (frameTag === tag) break
      reopen.unshift(frameTag)
    }
    for (const t of reopen) this.open(t)
  }

  toggle(tag: 'i' | 'b') {
    if (this.isOpen(tag)) this.close(tag)
    else this.open(tag)
  }

  private closeTop() {
    const frame = this.stack.pop()!
    const node = frame.node!
    node.children = frame.children
    if (node.children.length > 0) this.node(node)
    return node.tag as 'i' | 'b' | 'sup' | 'sub'
  }

  finish(): Inline[] {
    while (this.stack.length > 1) this.closeTop()
    return this.stack[0].children
  }
}

function collapseWhitespace(nodes: Inline[]): Inline[] {
  return nodes.map((node) => {
    if (typeof node === 'string') return node.replace(/[ \t\r\n]+/g, ' ')
    if ('children' in node) return { ...node, children: collapseWhitespace(node.children) }
    return node
  })
}

function trimEnds(nodes: Inline[]): Inline[] {
  const result = [...nodes]
  if (typeof result[0] === 'string') result[0] = result[0].trimStart()
  const last = result.length - 1
  if (typeof result[last] === 'string') result[last] = (result[last] as string).trimEnd()
  return result.filter((node) => node !== '')
}

/** Finds the index just after the matching closing of the opening at `start`. */
function findClosing(source: string, start: number, open: string, close: string): number {
  let depth = 0
  for (let i = start; i < source.length; ) {
    if (source.startsWith(open, i)) {
      depth++
      i += open.length
    } else if (source.startsWith(close, i)) {
      depth--
      i += close.length
      if (depth === 0) return i
    } else {
      i++
    }
  }
  throw new Error(`Unclosed ${open}: ${source.slice(start, start + 60)}`)
}

/** Splits template content on the pipes which are not inside of anything nested. */
function splitArguments(source: string): string[] {
  const args: string[] = []
  let current = 0
  for (let i = 0; i < source.length; ) {
    if (source.startsWith('{{', i)) {
      i = findClosing(source, i, '{{', '}}')
    } else if (source.startsWith('[[', i)) {
      i = findClosing(source, i, '[[', ']]')
    } else if (source.startsWith('<!--', i)) {
      i = source.indexOf('-->', i) + 3
    } else if (/^<ref\b[^>]*[^/]>|^<ref>/.test(source.slice(i, i + 200))) {
      i = source.indexOf('</ref>', i) + '</ref>'.length
    } else if (source[i] === '|') {
      args.push(source.slice(current, i))
      i++
      current = i
    } else {
      i++
    }
  }
  args.push(source.slice(current))
  return args
}

interface TemplateCall {
  name: string
  positional: string[]
  named: Record<string, string>
}

function parseTemplateCall(source: string): TemplateCall {
  const [name, ...args] = splitArguments(source.slice(2, -2))
  const call: TemplateCall = { name: name.trim(), positional: [], named: {} }
  for (const arg of args) {
    const match = /^\s*([\w-]+)\s*=(.*)$/s.exec(arg)
    if (match) call.named[match[1]] = match[2].trim()
    else call.positional.push(arg)
  }
  return call
}

function wikiLink(target: string): string {
  return WIKI_BASE + encodeURI(target.trim().replaceAll(' ', '_'))
}

function citationAuthor(named: Record<string, string>): string {
  const last = named.last ?? named.last1
  if (last) {
    const first = named.first ?? named.first1
    return first ? `${last}, ${first}` : last
  }
  return named.author ?? named.author1 ?? named.editor ?? ''
}

function citation(named: Record<string, string>, notes: NoteCollector): Inline[] {
  const author = citationAuthor(named)
  const date = named.year ?? named.date ?? ''
  const title = parseFragment(named.title ?? named.chapter ?? 'Untitled', notes)
  const source = named.publisher ?? named.website ?? named.journal ?? named.work ?? ''
  const page = named.page ? `p. ${named.page}` : named.pages ? `pp. ${named.pages}` : ''
  const url = named['url-status'] === 'dead' && named['archive-url'] ? named['archive-url'] : named.url
  const tail = [inlineToText(parseFragment(source, notes)), page].filter(Boolean).join(', ')

  const builder = new TreeBuilder()
  if (author || date) builder.text(`${author}${author && date ? ' ' : ''}${date ? `(${date})` : ''}. `)
  builder.node(url ? { tag: 'link', href: url, children: title } : { tag: 'i', children: title })
  builder.text(tail ? `. ${tail}.` : '.')
  return builder.finish()
}

function renderTemplate(call: TemplateCall, notes: NoteCollector): Inline[] {
  const { name, positional, named } = call
  const lower = name.toLowerCase()
  const first = () => parseFragment(positional[0] ?? '', notes)

  if (lower === 'lang') {
    return [{ tag: 'lang', lang: positional[0].trim(), children: parseFragment(positional[1], notes) }]
  }
  if (lower === 'translit') {
    const code = positional[0].trim()
    const lang = code.length > 3 ? 'und-Latn' : `${code}-Latn`
    return [{ tag: 'lang', lang, children: [{ tag: 'i', children: parseFragment(positional[1], notes) }] }]
  }
  if (lower === 'cuneiform') return [{ tag: 'lang', lang: 'akk-Xsux', children: first() }]
  if (lower === 'gcl' && positional[0] === 'GEN') return ['genitive']
  if (lower === 'sic') return ['[sic]']
  if (lower === 'nowrap' || lower === 'nobold' || lower.startsWith('script/')) return first()
  if (lower === 'section link') {
    const target = positional[1].trim()
    return [{ tag: 'link', href: `#${target}`, children: [target] }]
  }
  if (lower === 'oetymd' || lower === 'cite oetymd') {
    const word = positional[0].trim()
    return [
      {
        tag: 'link',
        href: `https://www.etymonline.com/word/${encodeURIComponent(word)}`,
        children: [`Online Etymology Dictionary: ${word}`],
      },
      '.',
    ]
  }
  if (lower.startsWith('cite ')) return citation(named, notes)
  if (lower === 'refn') return [{ tag: 'note', id: notes.add(positional[0], named.name) }]
  throw new Error(`Unknown template: {{${name}}}`)
}

function refName(attributes: string): string | undefined {
  const match = /name\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/.exec(attributes)
  return match ? (match[1] ?? match[2] ?? match[3]).trim() : undefined
}

const ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  ndash: '–',
  mdash: '—',
}

function parseFragment(source: string, notes: NoteCollector): Inline[] {
  const builder = new TreeBuilder()
  let i = 0
  while (i < source.length) {
    const rest = source.slice(i)

    if (rest.startsWith('<!--')) {
      i = source.indexOf('-->', i) + 3
      continue
    }

    if (rest.startsWith('{{')) {
      const end = findClosing(source, i, '{{', '}}')
      builder.nodes(renderTemplate(parseTemplateCall(source.slice(i, end)), notes))
      i = end
      continue
    }

    if (rest.startsWith('[[')) {
      const end = findClosing(source, i, '[[', ']]')
      const [target, label] = source.slice(i + 2, end - 2).split(/\|(.*)/s)
      if (/^(File|Image):/i.test(target)) throw new Error(`Unexpected media: ${target}`)
      const trail = /^[a-z]+/.exec(source.slice(end))?.[0] ?? ''
      const children = parseFragment((label ?? target) + trail, notes)
      builder.node({ tag: 'link', href: wikiLink(target), children })
      i = end + trail.length
      continue
    }

    const external = /^\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]*))?\]/.exec(rest)
    if (external) {
      const children = parseFragment(external[2] ?? external[1], notes)
      builder.node({ tag: 'link', href: external[1], children })
      i += external[0].length
      continue
    }

    const tag = /^<(\/?)([a-zA-Z]+)([^<>]*?)(\/?)>/.exec(rest)
    if (tag) {
      const [whole, closing, rawName, attributes, selfClosing] = tag
      const name = rawName.toLowerCase()
      i += whole.length
      if (name === 'ref' && !closing) {
        const refId = refName(attributes)
        if (selfClosing) {
          if (refId === undefined) throw new Error(`Empty footnote: ${whole}`)
          builder.node({ tag: 'note', id: notes.addNamed(refId) })
        } else {
          const end = source.indexOf('</ref>', i)
          if (end < 0) throw new Error(`Unclosed footnote: ${rest.slice(0, 60)}`)
          builder.node({ tag: 'note', id: notes.add(source.slice(i, end), refId) })
          i = end + '</ref>'.length
        }
      } else if (name === 'br') {
        builder.node({ tag: 'br' })
      } else if (name === 'sup' || name === 'sub') {
        if (closing) builder.close(name)
        else builder.open(name)
      } else if (name === 'hiero') {
        // Egyptian hieroglyph codes only render on Wikipedia itself
        i = source.indexOf('</hiero>', i) + '</hiero>'.length
      } else if (name !== 'div') {
        throw new Error(`Unknown tag: ${whole}`)
      }
      continue
    }

    const quotes = /^'{2,}/.exec(rest)
    if (quotes) {
      const count = quotes[0].length
      if (count >= 5) {
        builder.toggle('i')
        builder.toggle('b')
      } else if (count >= 3) {
        if (count === 4) builder.text("'")
        builder.toggle('b')
      } else {
        builder.toggle('i')
      }
      i += count
      continue
    }

    const entity = /^&(\w+);/.exec(rest)
    if (entity && entity[1] in ENTITIES) {
      builder.text(ENTITIES[entity[1]])
      i += entity[0].length
      continue
    }

    const text = /^.[^'<{[&]*/s.exec(rest)!
    builder.text(text[0])
    i += text[0].length
  }
  return builder.finish()
}

function parseField(source: string | undefined, notes: NoteCollector): Inline[] {
  if (!source) return []
  return trimEnds(collapseWhitespace(parseFragment(source, notes)))
}

export function parseInlineText(source: string, definitions: RefDefinitions = {}): ParsedInline {
  const notes = new NoteCollector(definitions)
  const content = parseField(source, notes)
  return { content, notes: cleanNotes(notes.notes) }
}

function cleanNotes(notes: Note[]): Note[] {
  return notes.map((note) => ({ ...note, content: trimEnds(collapseWhitespace(note.content)) }))
}

/** Finds the definitions of all named footnotes on the page. */
export function findRefDefinitions(page: string): RefDefinitions {
  const definitions: RefDefinitions = {}
  for (const match of page.matchAll(/<ref\s+([^<>]*?[^/<>])>(.*?)<\/ref>/gs)) {
    const name = refName(match[1])
    if (name !== undefined) definitions[name] = match[2]
  }
  return definitions
}

function plainField(source: string | undefined, definitions: RefDefinitions): string {
  // a separate collector: footnotes of plain fields are not shown
  return inlineToText(parseInlineText(source ?? '', definitions).content)
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseEtymologyPage(page: string): WikiRow[] {
  const definitions = findRefDefinitions(page)
  const rows: WikiRow[] = []
  for (let start = page.indexOf(ROW_TEMPLATE); start >= 0; start = page.indexOf(ROW_TEMPLATE, start + 1)) {
    const end = findClosing(page, start, '{{', '}}')
    const { named } = parseTemplateCall(page.slice(start, end))
    const notes = new NoteCollector(definitions)
    rows.push({
      symbol: named.symbol,
      language: plainField(named['word-origin-lang'], definitions),
      origin: plainField(named.origin, definitions),
      meaningText: plainField(named.meaning, definitions),
      word: parseField(named['word-origin'], notes),
      meaning: parseField(named.meaning, notes),
      description: parseField(named.desc, notes),
      symbolOrigin: parseField(named['symbol-etym'], notes),
      formerNames: parseField(named['alt-names'] ?? named['alt-name'], notes),
      notes: cleanNotes(notes.notes),
    })
  }
  return rows
}
