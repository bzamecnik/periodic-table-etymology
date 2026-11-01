# Data layers

Everything in this directory is under [CC BY-SA 4.0](LICENSE), because it derives
from Wikipedia. Each layer is versioned separately; `npm run data` merges them
into `elements.json`, which the app imports. Never edit `elements.json` by hand.

| Layer | What it holds | How it changes |
|---|---|---|
| `periodic.json` | Atomic number, symbol, name, group, period, block | Rarely, by hand |
| `wikipedia/source.wikitext` | The article, untouched, at the revision in `source.json` | `npm run data:fetch`, then review the diff |
| `curation.yaml` | Values Wikipedia lacks in a usable form | By hand |

A further layer (such as the phase at common conditions) would be one more file
merged in `scripts/merge-layers.ts`.

## Curating

`curation.yaml` was drafted from the Wikipedia fields by `scripts/seed-curation.ts`
and is edited by hand from now on. Run `npm run data:todo` to see what is waiting.

```yaml
Fe:
  gloss: holy metal      # very short meaning shown on the tile
  kinds: [property]      # one or more, see below
  language: Old English  # the oldest known language of the name or the symbol
  path: [Old English, Middle English]  # the route of the name, oldest first
  symbolLanguage: Latin  # only when the symbol has a different origin than the name
  review: why this is unsure  # shown in the detail panel; remove it once settled
```

- A value of `"?"` is a placeholder. It stays visible in the app: tiles show `?`
  and the filters offer "Not classified yet".
- `kinds`: `place`, `person`, `celestial`, `property`, `mythology`, `substance`,
  `color`. Allowed values are in `src/data/vocabulary.ts`, and so are the languages.
  A new language has to be added there with its family and short code.
- Unknown values fail the build.

These categories are editorial judgement on top of Wikipedia's "nature of origin"
and "language of origin" columns, not a part of the source.
