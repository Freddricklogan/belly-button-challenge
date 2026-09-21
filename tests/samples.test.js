import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getMetadata, getSample, otus, percentileOf, shortLabel, summary, topN, validateDataset, washFraction } from '../src/samples.js';

const d = JSON.parse(readFileSync(new URL('../data/samples.json', import.meta.url), 'utf8'));

describe('dataset', () => {
  it('is the 153-subject study with aligned arrays and no validation problems', () => {
    expect(d.names).toHaveLength(153);
    expect(validateDataset(d)).toEqual([]);
    expect(getSample(d, '940').otu_ids).toHaveLength(80);
    expect(getMetadata(d, 940)).toMatchObject({ ethnicity: 'Caucasian', gender: 'F', age: 24, location: 'Beaufort/NC', bbtype: 'I', wfreq: 2 });
    expect(getSample(d, 'nope')).toBeNull();
  });
  it('names each defect in a broken dataset', () => {
    const bad = { names: ['1', '2'], metadata: [{ id: 1 }, { id: 9 }], samples: [{ id: 1, otu_ids: [1, 2], sample_values: [3], otu_labels: ['a', 'b'] }, { id: 3, otu_ids: 'x' }, { id: 2, otu_ids: [1], sample_values: [-1], otu_labels: ['a'] }] };
    expect(validateDataset(bad)).toEqual(expect.arrayContaining(['names (2), samples (3) and metadata (2) differ in length', 'sample 1: otu_ids (2), sample_values (1) and otu_labels (2) differ in length', 'sample 3 is not in names', 'sample 3: otu_ids, sample_values and otu_labels must be arrays', 'sample 2: sample_values must be non-negative numbers', 'metadata 9 is not in names']));
    expect(validateDataset(null)).toEqual(['dataset needs names, metadata and samples arrays']);
  });
});

describe('per-sample statistics', () => {
  const s940 = getSample(d, 940);
  it('sorts OTUs by value and takes the top N', () => {
    const top = topN(s940, 10);
    expect(top).toHaveLength(10);
    for (let i = 1; i < top.length; i += 1) expect(top[i - 1].value).toBeGreaterThanOrEqual(top[i].value);
    expect(top[0]).toMatchObject({ id: 1167, value: 163 });
    const shuffled = { otu_ids: [3, 1, 2], sample_values: [5, 9, 5], otu_labels: ['c', 'a', 'b'] };
    expect(otus(shuffled).map((o) => o.id)).toEqual([1, 2, 3]);
  });
  it('computes reads, richness, Shannon, Simpson and top share against hand values', () => {
    const s = summary({ otu_ids: [1, 2, 3, 4], sample_values: [50, 25, 25, 0], otu_labels: ['a', 'b', 'c', 'd'] });
    expect(s.totalReads).toBe(100);
    expect(s.richness).toBe(3);
    expect(s.shannon).toBeCloseTo(-(0.5 * Math.log(0.5) + 2 * 0.25 * Math.log(0.25)), 12);
    expect(s.simpson).toBeCloseTo(1 - (0.25 + 0.0625 + 0.0625), 12);
    expect(s.topShare).toBe(0.5);
    expect(summary({ otu_ids: [], sample_values: [], otu_labels: [] })).toEqual({ totalReads: 0, richness: 0, shannon: 0, simpson: 0, topShare: 0 });
    const real = summary(s940);
    expect(real.totalReads).toBe(s940.sample_values.reduce((a, b) => a + b, 0));
    expect(real.richness).toBe(80);
    expect(real.shannon).toBeGreaterThan(0);
    expect(real.simpson).toBeLessThan(1);
  });
  it('shortens lineage labels and scales wash frequency', () => {
    expect(shortLabel('Bacteria;Firmicutes;Clostridia;Clostridiales;Ruminococcaceae;Faecalibacterium')).toBe('Faecalibacterium');
    expect(shortLabel('Bacteria')).toBe('Bacteria');
    expect(shortLabel('')).toBe('Unclassified');
    expect(shortLabel(undefined)).toBe('Unclassified');
    expect(washFraction({ wfreq: 2 })).toBeCloseTo(2 / 9, 12);
    expect(washFraction({ wfreq: 12 })).toBe(1);
    expect(washFraction({ wfreq: null })).toBeNull();
    expect(washFraction(null)).toBeNull();
  });
  it('percentile rank over the cohort', () => {
    expect(percentileOf([1, 2, 3, 4], 3)).toBe(62.5);
    expect(percentileOf([], 1)).toBeNull();
    const rich = d.samples.map((s) => summary(s).richness);
    const p = percentileOf(rich, summary(s940).richness);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThanOrEqual(100);
  });
});
