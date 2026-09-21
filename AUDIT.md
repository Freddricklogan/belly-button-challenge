# AUDIT — Belly Button Biodiversity (pre-refactor, scope kept)

This repository is a Tier 3 "keep scope" item: the exercise's four
panels stay. The audit covers what the previous build depended on and
what it got wrong, not what it chose to show. Previous build:
`index.html` (114 lines), `static/js/app.js` (187 lines),
`static/css/style.css`, and five screenshots of the old UI.

---

## A. Dependencies and data

### A1 — Data fetched from a third-party course bucket on every visit
`app.js:5` loaded `samples.json` from a `2u-data-curriculum-team` S3
URL behind a "Load sample data" button. If that bucket moves, the page
is empty. **Fix:** the 449 KB dataset is vendored in
`data/samples.json`, validated on load (aligned arrays, ids present,
non-negative reads — 0 problems), with its provenance stated on the
page.

### A2 — `plotly-latest.min.js`, unpinned, no integrity; D3 v7 loaded for
`selector.html("")`
`index.html:110–111`. **Fix:** Plotly basic bundle pinned to 4.1.1 with
an SRI hash computed against the artifact and a vendored fallback; D3
removed (the DOM work is four lines of standard APIs). The gauge, which
needed the full bundle's indicator trace, is drawn as SVG.

## B. Correctness

### B1 — Assumed the OTU arrays arrive sorted
`app.js:121–127` took `slice(0, 10)` as "top ten". The dataset happens
to be sorted, so it looked right; any other export would not be.
**Fix:** `otus()` sorts by reads (ties by id) before slicing; tested
with shuffled input.

### B2 — Loose equality on ids
`sampleObj.id == sample` (lines 54 and 114) compared numbers with the
select's string values. It worked by coincidence of coercion. **Fix:**
explicit `String()` comparison in `getSample`/`getMetadata`, tested
with both types.

### B3 — Fixed 1000-pixel bubble chart
`app.js:162`: `width: 1000` overflowed any narrower viewport. **Fix:**
responsive plots; no horizontal scroll at 400 px (measured).

### B4 — No statistics
The page showed counts and a gauge and called the sample "diverse" or
not by eye. **Fix:** total reads, richness, Shannon H′, Simpson 1−D and
top-OTU share are computed per sample and tested against hand values;
richness and Shannon are placed as percentiles of the 153 subjects.

## C. Structure and security

### C1 — `onchange` attribute, `alert()`, `.html("")`, `style="display:none"`
**Fix:** `addEventListener`, `hidden`, `textContent`; strict CSP whose
only concession is the SHA-256 of the empty string, because Plotly
appends an empty `<style>` element and fills it through CSSOM.

### C2 — Screenshots of the old UI committed as documentation
**Fix:** removed; one current screenshot in `docs/`.

## D. Engineering

### D1 — No tests, no CI
**Fix:** 6 Vitest tests at 100 % statement coverage over the data
module; ESLint, html-validate, security scan, Pages deployment.
