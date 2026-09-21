/** Belly Button Biodiversity dataset: validation, lookups and per-sample statistics. Pure functions over the samples.json shape. */

export function validateDataset(d) {
  const p = [];
  if (!d || !Array.isArray(d.names) || !Array.isArray(d.metadata) || !Array.isArray(d.samples)) return ['dataset needs names, metadata and samples arrays'];
  if (d.names.length !== d.samples.length || d.names.length !== d.metadata.length) p.push(`names (${d.names.length}), samples (${d.samples.length}) and metadata (${d.metadata.length}) differ in length`);
  const ids = new Set(d.names.map(String));
  for (const s of d.samples) {
    if (!ids.has(String(s.id))) p.push(`sample ${s.id} is not in names`);
    if (!(Array.isArray(s.otu_ids) && Array.isArray(s.sample_values) && Array.isArray(s.otu_labels))) { p.push(`sample ${s.id}: otu_ids, sample_values and otu_labels must be arrays`); continue; }
    if (s.otu_ids.length !== s.sample_values.length || s.otu_ids.length !== s.otu_labels.length) p.push(`sample ${s.id}: otu_ids (${s.otu_ids.length}), sample_values (${s.sample_values.length}) and otu_labels (${s.otu_labels.length}) differ in length`);
    if (s.sample_values.some((v) => !(Number.isFinite(v) && v >= 0))) p.push(`sample ${s.id}: sample_values must be non-negative numbers`);
  }
  for (const m of d.metadata) if (!ids.has(String(m.id))) p.push(`metadata ${m.id} is not in names`);
  return p;
}

export function getSample(d, id) {
  return d.samples.find((s) => String(s.id) === String(id)) ?? null;
}
export function getMetadata(d, id) {
  return d.metadata.find((m) => String(m.id) === String(id)) ?? null;
}

/** OTUs as [{ id, value, label }] sorted by value descending (ties by id), regardless of input order. */
export function otus(sample) {
  return sample.otu_ids.map((id, i) => ({ id, value: sample.sample_values[i], label: sample.otu_labels[i] })).sort((a, b) => b.value - a.value || a.id - b.id);
}

export function topN(sample, n) {
  return otus(sample).slice(0, n);
}

/** Total reads, richness (OTUs with reads), Shannon index (natural log), Simpson index (1 − Σp²) and the share of the top OTU. */
export function summary(sample) {
  const values = sample.sample_values.filter((v) => v > 0);
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return { totalReads: 0, richness: 0, shannon: 0, simpson: 0, topShare: 0 };
  let shannon = 0;
  let sumSq = 0;
  for (const v of values) { const p = v / total; shannon -= p * Math.log(p); sumSq += p * p; }
  return { totalReads: total, richness: values.length, shannon, simpson: 1 - sumSq, topShare: Math.max(...values) / total };
}

/** Shortest genus-level label: the last taxon in a semicolon-separated lineage. */
export function shortLabel(label) {
  const parts = String(label ?? '').split(';').map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'Unclassified';
}

/** Wash frequency as a fraction of the 0–9 scale used by the study; null when not reported. */
export function washFraction(meta) {
  const w = meta?.wfreq;
  if (w === null || w === undefined || Number.isNaN(Number(w))) return null;
  return Math.min(1, Math.max(0, Number(w) / 9));
}

/** Cohort-wide distribution of one numeric statistic for the "where does this sample sit" comparison. */
export function percentileOf(values, v) {
  const s = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return null;
  const below = s.filter((x) => x < v).length;
  const ties = s.filter((x) => x === v).length;
  return ((below + ties / 2) / s.length) * 100;
}
