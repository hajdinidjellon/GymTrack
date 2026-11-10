// Builds journeys/REPORT.md from the numbers the journeys wrote in journeys/results/.
// Run after them: npm run journeys (both, in that order).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, 'results');
const results = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

const groups = [...new Set(results.map((r) => r.group))];
const lines = [
  '# Okilo · combien de taps pour chaque parcours',
  '',
  'Mesuré sur les vrais écrans et la vraie navigation (tests `journeys/`), pas sur un téléphone.',
  'Temps estimé : 0,4 s par tap, 0,3 s par lettre, 1,35 s pour lire chaque écran ou fenêtre',
  '(modèle KLM, utilisateur habitué ; un débutant hésite plus).',
  '',
];
for (const group of groups) {
  lines.push(
    `## ${group}`,
    '',
    '| Parcours | Taps | Lettres | Écrans lus | Temps estimé |',
    '|---|---:|---:|---:|---:|',
  );
  for (const r of results.filter((x) => x.group === group).sort((a, b) => a.seconds - b.seconds)) {
    lines.push(`| ${r.title} | ${r.taps} | ${r.letters} | ${r.views} | ${String(r.seconds).replace('.', ',')} s |`);
  }
  lines.push('');
}
const notes = results.flatMap((r) => r.notes.map((n) => `- **${r.title}** : ${n}`));
if (notes.length) lines.push('## Ce qu’on a vu en les mesurant', '', ...notes, '');
lines.push('## Le détail, étape par étape', '');
for (const r of results)
  lines.push(`<details><summary>${r.title}</summary>`, '', ...r.steps.map((s) => `1. ${s}`), '', '</details>', '');

writeFileSync(join(here, 'REPORT.md'), lines.join('\n'));
console.log(`journeys/REPORT.md: ${results.length} parcours`);
