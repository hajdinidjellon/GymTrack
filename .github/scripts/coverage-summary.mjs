// Turns Jest's coverage-summary.json into a Markdown table per layer, for the job summary.
// Usage: node coverage-summary.mjs <coverage-summary.json> >> "$GITHUB_STEP_SUMMARY"
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const summary = JSON.parse(readFileSync(file, 'utf8'));
const LAYERS = ['domain', 'i18n', 'services', 'stores', 'components'];
const METRICS = ['statements', 'branches', 'functions', 'lines'];

const empty = () => Object.fromEntries(METRICS.map((m) => [m, { covered: 0, total: 0 }]));
const layers = Object.fromEntries(LAYERS.map((l) => [l, empty()]));

for (const [path, data] of Object.entries(summary)) {
  if (path === 'total') continue;
  const layer = LAYERS.find((l) => path.replaceAll('\\', '/').includes(`/gym-tracker-mobile/${l}/`));
  if (!layer) continue;
  for (const m of METRICS) {
    layers[layer][m].covered += data[m].covered;
    layers[layer][m].total += data[m].total;
  }
}

const pct = ({ covered, total }) => (total === 0 ? '—' : `${((covered / total) * 100).toFixed(1)} %`);
const rows = [
  ...LAYERS.map((l) => `| \`${l}/\` | ${METRICS.map((m) => pct(layers[l][m])).join(' | ')} |`),
  `| **Total** | ${METRICS.map((m) => `**${summary.total[m].pct.toFixed(1)} %**`).join(' | ')} |`,
];

console.log(
  [
    '### Couverture des tests',
    '',
    '| Couche | Instructions | Branches | Fonctions | Lignes |',
    '|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n'),
);
