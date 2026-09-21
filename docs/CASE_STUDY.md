# Case Study — Belly Button Biodiversity

**Repository:** [belly-button-challenge](https://github.com/Freddricklogan/belly-button-challenge) · **Live demo:** [freddricklogan.github.io/belly-button-challenge](https://freddricklogan.github.io/belly-button-challenge/) · **Author:** Freddrick Logan

---

## 1. Who has this problem

Anyone maintaining a portfolio of small data-visualization exercises: bootcamp graduates whose demos depend on a course provider's bucket, instructors who set the exercise and want a reference that is correct rather than merely rendered, and hiring managers who open a "classic" project and judge the engineering habits behind it rather than the charts.

## 2. The problem, as a scenario

A reviewer opens the dashboard. It asks her to press "Load sample data", fetches from an S3 bucket belonging to a curriculum team, and — this week — works. She picks a subject and sees a bar chart labelled "Top 10", a bubble chart that overflows her laptop screen, and a gauge. She asks what "top" means and whether the sample is diverse; the code has no answer, because it slices the first ten entries of whatever arrived and computes nothing. Next term the bucket is reorganised and the page is empty. That was the earlier version of this repository.

## 3. What it costs to leave it alone

A demo that depends on someone else's storage is a demo with an expiry date the author does not control. A chart that assumes its input is sorted is correct by accident, and accidents do not survive a different export. An unpinned "latest" script can change behaviour or be replaced without any commit in the repository. None of these matters for a homework grade; all of them matter when the page is presented as evidence of how its author builds things.

## 4. The approach, and the alternative I rejected

I rejected expanding the scope. This is a Tier 3 item in the portfolio plan: the exercise's four panels stay, and the work is to make them dependable. The dataset is vendored and validated on load — array lengths aligned, every sample present in the index, reads non-negative — with its provenance printed on the page. `src/samples.js` sorts operational taxonomic units by reads before taking the top ten, compares identifiers explicitly rather than with loose equality, and computes the statistics the charts imply: total reads, richness, Shannon and Simpson indices, and the top unit's share, plus a percentile of each against the 153 subjects. Plotly's basic bundle is pinned with an integrity hash and vendored as a fallback, and the gauge that needed the full bundle is drawn as two SVG arcs. The strict content-security policy has one exception, the hash of an empty string, because Plotly appends an empty style element and fills it through the CSS object model; the comment in the page says so.

## 5. What the code does today

Choose one of 153 subjects. The metadata panel lists the subject's ethnicity, gender, age, location, navel type and reported wash frequency; the gauge draws that frequency on the study's 0–9 scale. Five tiles show total reads, richness with its cohort percentile, Shannon H′ with its percentile, Simpson 1−D and the share held by the most abundant unit, and a line names that unit at genus level. The top-ten bar chart, the bubble chart of every unit by identifier and reads, and the top-five pie are Plotly panels with hover templates that show the genus-level label. Everything is responsive; nothing is fetched from outside the repository except the pinned chart library, which falls back to the vendored copy.

## 6. Evidence

Six Vitest tests cover the vendored dataset's shape (153 subjects, zero validation problems, subject 940's known metadata), the validator's messages on a broken dataset, sorting of shuffled input, the top-ten slice, the diversity indices against hand-computed values for a four-unit sample, label shortening, wash-frequency scaling with clamping and nulls, and cohort percentiles. Statement coverage of the logic module is 100 %. In headless Chrome, subject 940 rendered 1,303 reads, 80 units at the 97th percentile, Shannon 3.49, Simpson 0.949 and a 13 % top share with three Plotly panels and a gauge at 2 washes per week; switching to subject 941 gave 1,027 reads and 44 units; there were zero console errors and no horizontal scroll at 1280 or 400 pixels. `AUDIT.md` records eight findings against the earlier build.

## 7. What it would take to run this in production

There is no production for a course exercise, but the pattern generalises: vendor or mirror any dataset a page depends on, validate it on load, pin and verify every dependency, and compute the numbers a chart implies rather than leaving them to the eye. For a research setting the indices would be extended to rarefaction and beta diversity across subjects, and the data would carry a licence statement from the study.

## 8. Limits and next steps

The dataset is the exercise's snapshot, not the study's full release, and carries no licence beyond its course distribution. Indices are computed on raw read counts without rarefaction, so subjects with more reads can appear richer. Next, if the scope were ever widened: rarefied richness, a cohort-level comparison view, and a CSV export of the per-subject statistics.

## 9. Who should look at this

**Hiring manager:** evidence that I finish small things properly — dependencies pinned, data owned, arithmetic tested — even when the scope is deliberately small.
**Consulting client:** a pattern for making a dashboard independent of the storage and libraries it was born with.
**Engineer:** read `src/samples.js` with `tests/samples.test.js` for the sorting, indices and validation.
