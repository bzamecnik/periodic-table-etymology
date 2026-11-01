/**
 * A tree of inline text. Wikipedia content is stored in this form instead of
 * HTML, so that nothing from the source can inject markup into the page.
 */
export type Inline = string | InlineNode

export type InlineNode =
  | { tag: 'i' | 'b' | 'sup' | 'sub'; children: Inline[] }
  | { tag: 'lang'; lang: string; children: Inline[] }
  | { tag: 'link'; href: string; children: Inline[] }
  | { tag: 'br' }
  | { tag: 'note'; id: number }

/** A footnote of an element, referred to by `{ tag: 'note', id }`. */
export interface Note {
  id: number
  content: Inline[]
}
