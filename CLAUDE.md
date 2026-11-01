# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

Periodic Table of Name Origins: a single-page Preact (TypeScript, Vite) app
showing where the names of the chemical elements come from. See `README.md`,
the roadmap in `docs/plan.md` and the data layers in `data/README.md`.

## Workflow

- **Test-driven development**: every new behavior comes with tests.
- **Focused commits**: one logical change per commit, tests in the same commit
  as the code they cover.
- Run `npm run lint`, `npm test -- --run` and `npm run build` before committing;
  all must pass.
- Keep `docs/plan.md` up to date: tick off finished steps.

## Licensing

Code is MIT (`LICENSE`). Everything in `data/` is CC BY-SA 4.0 (`data/LICENSE`),
because it derives from Wikipedia. Keep Wikipedia-derived content in `data/`,
and keep the attribution visible on the page.

## Code conventions

- Pure logic stays UI-free (`src/filters.ts`, `src/navigation.ts`, `scripts/wikitext.ts`);
  components only render and handle input.
- Never edit `data/elements.json` by hand: edit a layer and run `npm run data`.
- Never render Wikipedia content as raw HTML: it is stored as an inline tree and
  rendered through `src/components/InlineText.tsx`.
- Tests live next to the code as `*.test.ts(x)` (Vitest + Testing Library).
- Prefer accessible markup (roles, labels, keyboard support).

## Commands

```sh
npm run dev           # dev server
npm test -- --run     # run tests once
npm run build         # type-check + production build
npm run data          # rebuild data/elements.json from the layers
npm run data:todo     # list curation placeholders
```
