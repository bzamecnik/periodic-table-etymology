# Data layers

Everything in this directory is under [CC BY-SA 4.0](LICENSE), because it derives
from Wikipedia. Each layer is versioned separately; `npm run data` merges them
into `elements.json`, which the app imports. Never edit `elements.json` by hand.

| Layer | What it holds | How it changes |
|---|---|---|
| `periodic.json` | Atomic number, symbol, name, group, period, block | Rarely, by hand |
| `wikipedia/source.wikitext` | The article, untouched, at the revision in `source.json` | `npm run data:fetch`, then review the diff |
| `curation.yaml` | Values Wikipedia lacks in a usable form | By hand |
| `deeper.yaml` | Sourced findings from other Wikipedia and Wiktionary pages | By hand |

A further layer (such as the phase at common conditions) would be one more file
merged in `scripts/merge-layers.ts`.

## Curating

`curation.yaml` was drafted from the Wikipedia fields by `scripts/seed-curation.ts`
and is edited by hand from now on. Run `npm run data:todo` to see what is waiting.

```yaml
Y:
  named: Ytterby         # what the element is named after, if not the meaning itself
  gloss: outer village   # very short meaning, in italics on the tile
  about: Greek region    # what the named thing is, used when there is no meaning
  kinds: [place]         # one or more, see below
  language: Swedish      # the oldest attested language of the name
  path: [Swedish]        # the route of the name, oldest first
  symbolLanguage: Latin  # only when the symbol has another origin than the name...
  symbolPath: [Latin]    # ...with its own route
  symbolGloss: dawn       # ...and a short meaning, shown like "Au: dawn"
  review: why this is unsure  # shown in the detail panel; remove it once settled
```

- A value of `"?"` is a placeholder. It stays visible in the app: tiles show `?`
  and the filters offer "Unclassified".
- `kinds`: `place`, `person`, `celestial`, `property`, `mythology`, `substance`,
  `color`. Allowed values are in `src/data/vocabulary.ts`, and so are the languages.
  A new language has to be added there with its family and short code.
- Unknown values fail the build.

### Conventions

- **Two lines on a tile, up to 15 characters each.** Line 1 is what it is named
  after (`named`), line 2 the meaning (`gloss`), or else a description (`about`).
  A tile with only one line may wrap it to two. Foreign scripts stay in the details.
- **People** go by their initials and surname, such as `A. Einstein`.
- **An unsure meaning** ends with a question mark on the tile: `dangerous isle?`.
- **The oldest language** is the oldest one that is attested. Reconstructed languages
  (marked in the vocabulary) may be on a route or in the deeper layer, never on a tile.
- **Kinds:** a second kind only for a name with two real origins, such as selenium
  (moon and goddess). A word for a stone or a mineral is `substance`.

### The deeper layer

```yaml
Y:
  - text: The Swedish village name literally means "outer village".
    certainty: attested   # attested, traditional or disputed
    sources:              # the page and the revision that was read
      - "en.wikipedia: Ytterby @ 1380007014"
```

Texts are written in own words, and each one needs a source. A source links to its
exact revision. Wikipedia and Wiktionary can be adapted under the same license;
other sources may only back up facts, never lend their wording.

These categories are editorial judgement on top of Wikipedia's "nature of origin"
and "language of origin" columns, not a part of the source.
