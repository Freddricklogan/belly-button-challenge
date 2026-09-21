/** Wires the dataset and statistics to the page and the Executive Shell. Scope kept from the original challenge: metadata, top-10 bar, bubble, pie, wash-frequency gauge. */
import { loadPlotly, makeCharts } from './charts.js';
import { mountExecShell } from './exec-shell.js';
import { getMetadata, getSample, otus, percentileOf, shortLabel, summary, validateDataset, washFraction } from './samples.js';
import { $, el, setText } from './ui.js';

const state = { data: null, id: null, cohort: null };
let charts = makeCharts(null);
let shell;

function render() {
  const s = getSample(state.data, state.id);
  const m = getMetadata(state.data, state.id);
  const all = otus(s).map((o) => ({ ...o, short: shortLabel(o.label) }));
  const top = all.slice(0, 10);
  const st = summary(s);
  setText('k-reads', st.totalReads.toLocaleString());
  setText('k-rich', st.richness);
  setText('k-shannon', st.shannon.toFixed(2));
  setText('k-simpson', st.simpson.toFixed(3));
  setText('k-top', `${(st.topShare * 100).toFixed(0)}%`);
  setText('k-rich-sub', `${percentileOf(state.cohort.richness, st.richness).toFixed(0)}th percentile of 153`);
  setText('k-shannon-sub', `${percentileOf(state.cohort.shannon, st.shannon).toFixed(0)}th percentile of 153`);
  setText('top-otu', top.length ? `Most abundant: OTU ${top[0].id} — ${top[0].short} (${top[0].value.toLocaleString()} reads)` : 'No reads');
  const dl = $('meta');
  dl.replaceChildren();
  for (const [k, v] of Object.entries(m ?? {})) dl.append(el('dt', { text: k }), el('dd', { text: v === null || v === undefined ? '—' : String(v) }));
  charts.bar('bar', top);
  charts.bubble('bubble', all);
  charts.pie('pie', all.slice(0, 5));
  const wf = washFraction(m);
  charts.gauge($('gauge'), wf, wf === null ? 'n/a' : `${m.wfreq} / wk`);
  setText('gauge-note', wf === null ? 'Wash frequency not reported for this subject.' : `Belly-button washes per week as reported by the subject (0–9 scale).`);
  shell?.refreshKpis();
}

async function boot() {
  const Plotly = await loadPlotly();
  charts = makeCharts(Plotly);
  if (!Plotly) $('chart-notice').hidden = false;
  state.data = await fetch('data/samples.json').then((r) => r.json());
  const problems = validateDataset(state.data);
  if (problems.length) { setText('chart-notice', `Dataset invalid: ${problems.join(' · ')}`); $('chart-notice').hidden = false; return; }
  state.cohort = { richness: state.data.samples.map((x) => summary(x).richness), shannon: state.data.samples.map((x) => summary(x).shannon) };
  const sel = $('selDataset');
  for (const n of state.data.names) sel.append(el('option', { value: String(n), text: `Subject ${n}` }));
  state.id = state.data.names[0];
  sel.addEventListener('change', () => { state.id = sel.value; render(); });
  render();
  setText('source-note', `Data: Belly Button Biodiversity study samples (Hulcr et al., 2012), as distributed with the Data Visualization bootcamp exercise; ${state.data.names.length} subjects, vendored in data/samples.json so the page does not depend on a third-party bucket.`);

  shell = mountExecShell({
    title: 'Belly Button Biodiversity',
    tagline: 'The classic interactive-visualization exercise, kept to its scope: pick a subject, see the top ten operational taxonomic units, the full bubble distribution, the top-five pie and the wash-frequency gauge — now with the dataset vendored, the arithmetic tested, and diversity indices computed rather than implied.',
    repo: 'https://github.com/Freddricklogan/belly-button-challenge',
    pagesUrl: 'https://freddricklogan.github.io/belly-button-challenge/',
    badges: [{ label: 'Plotly', tone: 'accent' }, { label: '153 subjects', dot: true }, { label: 'Scope kept', dot: true }],
    kpis: [
      { label: 'Subject', compute: () => state.id, tone: 'accent' },
      { label: 'Reads', compute: () => $('k-reads').textContent },
      { label: 'Richness (OTUs)', compute: () => $('k-rich').textContent, tone: 'ok' },
      { label: 'Shannon H′', compute: () => $('k-shannon').textContent, tone: 'warn' }
    ],
    tour: [
      { selector: '#stats', title: 'Indices, not adjectives', body: 'Richness counts OTUs with reads; Shannon and Simpson are computed from read proportions and tested against hand values. Each is placed as a percentile of the 153 subjects.' },
      { selector: '#bar', title: 'Top ten, sorted', body: 'The original page assumed the data arrived sorted. This one sorts by reads and shows the genus-level label on hover.' },
      { selector: '#gauge', title: 'A gauge without a 3 MB bundle', body: 'Wash frequency is drawn as SVG, so the page ships the Plotly basic bundle rather than the full one — and with a pinned version, an integrity hash and a vendored fallback.', action: () => { const sel = $('selDataset'); sel.value = '941'; sel.dispatchEvent(new Event('change')); } }
    ]
  });
  shell.refreshKpis();
}

boot();
