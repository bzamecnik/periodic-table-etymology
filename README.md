# Periodic Table of Name Origins

Where the names of all 118 chemical elements come from: an interactive periodic
table of element name etymology.

- Each tile shows the short meaning of the name, its oldest language and an icon
  for the kind of origin (place, person, mythology, …).
- Choose an element to read its original word, the route of the name through
  languages, the origin of its symbol, former names and sources.
- Filter by kind and language, search, and color the table by either dimension
  with the dot beside its row of filters.

## Keyboard

| Key | Action |
|---|---|
| `←` `→` | Previous / next by atomic number |
| `↑` `↓` | Up / down within a column |
| `Home` `End` | First / last element |
| `Enter` | Open or close details; once open, they follow the arrows |
| `Esc` | Close details, then leave the table; in the search, clear it, then leave it |
| `/` | Search; `Enter` then leads to the first match |

With filters on, the arrows skip the elements out of the filter, and open details
move to the first match when their element gets filtered out. Details also close
with a click on their tile or anywhere outside. Elements can be linked directly,
such as `#Fe`.

## Development

```sh
npm install
npm run dev           # dev server
npm test -- --run     # run tests once
npm run build         # type-check + production build
```

## Data

The data comes in separate versioned layers, described in
[data/README.md](data/README.md), including how to curate it:

```sh
npm run data          # rebuild data/elements.json from the layers
npm run data:todo     # list what is waiting for a curator
npm run data:fetch    # download the latest Wikipedia revision
```

## Deployment

Pushing a version tag publishes the app to GitHub Pages:

```sh
git tag v0.1.0 && git push origin v0.1.0
```

Once per repository: set Settings > Pages > Source to GitHub Actions, and add `v*`
to the allowed tags in Settings > Environments > github-pages.

## License / Credits

- Code: [MIT](LICENSE).
  - Ideas and guidance: Bohumír Zámečník
  - Implementation, graphical design: Claude Code (Opus 5.5)
- Data in [`data/`](data/): [CC BY-SA 4.0](data/LICENSE), adapted from
  [List of chemical element name etymologies](https://en.wikipedia.org/wiki/List_of_chemical_element_name_etymologies)
  by Wikipedia contributors
  ([revision 1382331679](https://en.wikipedia.org/w/index.php?oldid=1382331679)).
  The text was restructured; the categories, short meanings and language routes
  were added for this site and are editorial judgement. Further findings in
  [`data/deeper.yaml`](data/deeper.yaml) are adapted from other Wikipedia and
  Wiktionary pages, each linked at the revision read, in the app as well.
