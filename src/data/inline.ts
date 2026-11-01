import type { Inline } from './types.ts'

/** The plain text of an inline tree, without footnote markers. */
export function inlineToText(content: Inline[]): string {
  return content
    .map((node) => {
      if (typeof node === 'string') return node
      if (node.tag === 'br') return ' '
      if (node.tag === 'note') return ''
      return inlineToText(node.children)
    })
    .join('')
}
