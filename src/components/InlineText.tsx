import type { Inline } from '../data/types.ts'

interface InlineTextProps {
  content: Inline[]
  /** The prefix of the ids of the footnotes in this panel. */
  noteIdPrefix?: string
}

/** Links from the source are shown only when they are plain web or in-page links. */
const isSafeHref = (href: string) => /^(https?:\/\/|#)/i.test(href)

function scrollToNote(id: string) {
  const note = document.getElementById(id)
  note?.scrollIntoView({ block: 'nearest' })
  note?.focus({ preventScroll: true })
}

export function InlineText({ content, noteIdPrefix = 'note' }: InlineTextProps) {
  const render = (nodes: Inline[]) => <InlineText content={nodes} noteIdPrefix={noteIdPrefix} />
  return (
    <>
      {content.map((node, index) => {
        if (typeof node === 'string') return node
        switch (node.tag) {
          case 'br':
            return <br key={index} />
          case 'i':
            return <i key={index}>{render(node.children)}</i>
          case 'b':
            return <b key={index}>{render(node.children)}</b>
          case 'sup':
            return <sup key={index}>{render(node.children)}</sup>
          case 'sub':
            return <sub key={index}>{render(node.children)}</sub>
          case 'lang':
            return (
              <span key={index} lang={node.lang}>
                {render(node.children)}
              </span>
            )
          case 'link': {
            if (!isSafeHref(node.href)) return <span key={index}>{render(node.children)}</span>
            const external = !node.href.startsWith('#')
            return (
              <a
                key={index}
                href={node.href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
              >
                {render(node.children)}
              </a>
            )
          }
          case 'note':
            return (
              <sup key={index}>
                <button
                  type="button"
                  class="note-ref"
                  aria-label={`Footnote ${node.id}`}
                  onClick={() => scrollToNote(`${noteIdPrefix}-${node.id}`)}
                >
                  {node.id}
                </button>
              </sup>
            )
        }
      })}
    </>
  )
}
