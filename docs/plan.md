# Periodic Table of Name Origins — plan

An interactive periodic table showing where the names of the 118 elements come
from. Each step lands as one or more focused commits.

## Now

- [x] 1. Data pipeline: Wikipedia snapshot, curation layer, generated data
- [x] 2. Static table with tiles
- [x] 3. Detail panel and keyboard navigation
- [x] 4. Filters, search and color switching
- [x] 6. Deployment to GitHub Pages on tags
- [x] 7. Fit the whole table into a laptop window: tiles sized by the available
  height, title and credit in the free spaces of the table, compact filters;
  easier closing of the details and leaving by Escape

## Later

- [ ] 5. Small screens: pinned table thumbnail with the selected element
  highlighted, the detail panel below, scrolling moves across elements, a small
  search box
- [ ] Curation: replace the placeholders (`npm run data:todo` lists them), and add
  sourced deeper meanings (`data/deeper.yaml`). Done so far: a pilot of 24 elements
  (Be Na Mg Sc Mn Fe Cu As Sr Y Ru Gd W Au Lu Fr Am Cm Bk Es Db Sg Mc Og). Next:
  the other placeholders, then places, persons and ancient words
- [ ] Flags for the languages/countries of origin
- [ ] More data layers, e.g. phase at common conditions
- [ ] Illustrations, each with its own license and credit
