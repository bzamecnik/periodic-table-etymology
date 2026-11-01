import { kindColor } from '../colors.ts'
import type { ChemicalElement } from '../data/index.ts'
import { KIND_LABELS, PLACEHOLDER } from '../data/vocabulary.ts'
import type { Inline } from '../data/types.ts'
import { KindIcon } from './icons.tsx'
import { InlineText } from './InlineText.tsx'

interface DetailPanelProps {
  element: ChemicalElement | null
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

function Field({ label, content, prefix }: { label: string; content: Inline[]; prefix: string }) {
  if (content.length === 0) return null
  return (
    <div class="field">
      <dt>{label}</dt>
      <dd>
        <InlineText content={content} noteIdPrefix={prefix} />
      </dd>
    </div>
  )
}

/** The route of the name, from the oldest language to English. */
export function languageRoute(element: ChemicalElement): string[] {
  const { path } = element
  if (path.length === 0) return []
  return path[path.length - 1] === 'English' ? path : [...path, 'English']
}

function Route({ element }: { element: ChemicalElement }) {
  const route = languageRoute(element)
  return (
    <div class="field">
      <dt>Route</dt>
      <dd>
        {route.length === 0 ? (
          <span class="todo">? Not classified yet</span>
        ) : (
          <ol class="route">
            {route.map((language) => (
              <li key={language}>{language}</li>
            ))}
          </ol>
        )}
      </dd>
    </div>
  )
}

function Intro() {
  return (
    <aside class="panel panel--intro" aria-label="How to read the table">
      <p class="panel__lead">
        Element names preserve a story: a color seen in a spectrum, a smell, a Norse goddess, a Swedish village.
      </p>
      <p>
        Each tile shows the name's <i>meaning</i>, its <b>oldest language</b> and an icon for the kind of origin. Choose
        an element to read where its name came from.
      </p>
      <p class="panel__keys">
        <kbd>←</kbd> <kbd>→</kbd> by atomic number · <kbd>↑</kbd> <kbd>↓</kbd> within a column · <kbd>Enter</kbd> open ·{' '}
        <kbd>Esc</kbd> close · <kbd>/</kbd> search
      </p>
    </aside>
  )
}

export function DetailPanel({ element, onClose, onPrevious, onNext }: DetailPanelProps) {
  if (!element) return <Intro />
  const prefix = `note-${element.symbol}`
  return (
    <aside class="panel" aria-label={`Name origin of ${element.name}`} key={element.symbol}>
      <header class="panel__head">
        <div class="panel__title">
          <span class="panel__symbol">{element.symbol}</span>
          <div>
            <h2>{element.name}</h2>
            <p class="panel__z">Atomic number {element.z}</p>
          </div>
        </div>
        <p class={`panel__gloss${element.gloss === PLACEHOLDER ? ' todo' : ''}`}>
          {element.gloss === PLACEHOLDER ? '? Short meaning not filled in yet' : element.gloss}
        </p>
        <ul class="panel__kinds" aria-label="Kind of origin">
          {element.kinds.map((kind) => (
            <li key={kind} style={{ '--color-a': kindColor(kind) }}>
              <KindIcon kind={kind} /> {KIND_LABELS[kind]}
            </li>
          ))}
        </ul>
        <div class="panel__nav">
          <button type="button" onClick={onPrevious} aria-label="Previous element">
            ←
          </button>
          <button type="button" onClick={onNext} aria-label="Next element">
            →
          </button>
          <button type="button" onClick={onClose} aria-label="Close details">
            ✕
          </button>
        </div>
      </header>
      <div class="panel__body" tabIndex={0} aria-label="Details">
        <dl>
          <Route element={element} />
          <Field label="Original word" content={element.word} prefix={prefix} />
          <Field label="Meaning" content={element.meaning} prefix={prefix} />
          <Field label="Origin" content={element.description} prefix={prefix} />
          <Field label="Symbol" content={element.symbolOrigin} prefix={prefix} />
          <Field label="Former names" content={element.formerNames} prefix={prefix} />
          {element.review && (
            <div class="field">
              <dt>To review</dt>
              <dd class="todo">{element.review}</dd>
            </div>
          )}
        </dl>
        {element.notes.length > 0 && (
          <ol class="notes">
            {element.notes.map((note) => (
              <li key={note.id} id={`${prefix}-${note.id}`} tabIndex={-1} value={note.id}>
                <InlineText content={note.content} noteIdPrefix={prefix} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  )
}
