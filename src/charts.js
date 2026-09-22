import { tokens } from './exec-shell.js';
/** Plotly (basic bundle) charts plus an SVG gauge. Loads Plotly from the CDN with SRI and falls back to the vendored copy. */

const DARK = { paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: tokens().muted, family: 'Inter, system-ui, sans-serif' }, margin: { t: 30, r: 10, b: 50, l: 60 } };
const AXIS = { gridcolor: tokens().border, zerolinecolor: tokens().border, linecolor: tokens().border };

export async function loadPlotly() {
  if (globalThis.Plotly) return globalThis.Plotly;
  try {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'vendor/plotly-basic.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.append(s);
    });
    return globalThis.Plotly ?? null;
  } catch {
    return null;
  }
}

export function makeCharts(Plotly) {
  const plot = (id, data, layout) => { if (Plotly) Plotly.newPlot(id, data, { ...DARK, ...layout }, { displayModeBar: false, responsive: true }); };
  return {
    bar(id, top) {
      const rows = [...top].reverse();
      plot(id, [{ type: 'bar', orientation: 'h', x: rows.map((o) => o.value), y: rows.map((o) => `OTU ${o.id}`), text: rows.map((o) => o.short), hovertemplate: '%{y}: %{x} reads<br>%{text}<extra></extra>', marker: { color: tokens().accent } }], { xaxis: { title: 'Reads', ...AXIS }, yaxis: { automargin: true, ...AXIS }, margin: { t: 10, r: 10, b: 50, l: 90 } });
    },
    bubble(id, all) {
      const max = Math.max(1, ...all.map((o) => o.value));
      plot(id, [{ type: 'scatter', mode: 'markers', x: all.map((o) => o.id), y: all.map((o) => o.value), text: all.map((o) => o.short), hovertemplate: 'OTU %{x}: %{y} reads<br>%{text}<extra></extra>', marker: { size: all.map((o) => o.value), sizemode: 'area', sizeref: (2 * max) / 60 ** 2, color: all.map((o) => o.id), colorscale: 'Viridis', line: { width: 0 } } }], { xaxis: { title: 'OTU ID', ...AXIS }, yaxis: { title: 'Reads', ...AXIS } });
    },
    pie(id, top) {
      plot(id, [{ type: 'pie', values: top.map((o) => o.value), labels: top.map((o) => `OTU ${o.id}`), text: top.map((o) => o.short), hovertemplate: '%{label}: %{value} reads (%{percent})<br>%{text}<extra></extra>', textinfo: 'percent', marker: { colors: [tokens().accent, tokens().ok, tokens().warn, tokens().danger, tokens().series[4]] } }], { showlegend: true, legend: { font: { color: tokens().muted } }, margin: { t: 10, r: 10, b: 10, l: 10 } });
    },
    /** Semicircular gauge for wash frequency on a 0–9 scale, drawn as SVG so no indicator trace is needed. */
    gauge(svg, fraction, label) {
      const ns = 'http://www.w3.org/2000/svg';
      svg.replaceChildren();
      const arc = (f, colour, width) => {
        const a = Math.PI * (1 - f);
        const x = 100 + 80 * Math.cos(a);
        const y = 100 - 80 * Math.sin(a);
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', `M 20 100 A 80 80 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', colour);
        path.setAttribute('stroke-width', String(width));
        path.setAttribute('stroke-linecap', 'round');
        svg.append(path);
      };
      arc(1, tokens().border, 14);
      if (fraction !== null && fraction > 0) arc(fraction, fraction < 0.34 ? tokens().danger : fraction < 0.67 ? tokens().warn : tokens().ok, 14);
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', '100');
      text.setAttribute('y', '92');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', tokens().text);
      text.setAttribute('font-size', '22');
      text.setAttribute('font-weight', '700');
      text.textContent = label;
      svg.append(text);
    }
  };
}
