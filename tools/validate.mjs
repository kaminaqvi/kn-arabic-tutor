// Content checks: unique ids, required fields, unit references, vowel marks on Arabic.
import { readFileSync } from 'node:fs';
const idx = JSON.parse(readFileSync('content/index.json', 'utf8'));
const files = [idx.foundations, ...idx.paths.filter(p => p.available).map(p => p.file)];
const HARAKAT = /[ً-ْ]/;
let errors = 0; const seen = new Set();
const err = m => { errors++; console.error('✗ ' + m); };
for (const f of files) {
  const pack = JSON.parse(readFileSync('content/' + f, 'utf8'));
  const ids = new Set();
  for (const it of pack.items) {
    if (seen.has(it.id)) err(`${f}: duplicate id ${it.id}`);
    seen.add(it.id); ids.add(it.id);
    for (const k of ['id', 'kind', 'tr', 'en', 'ur']) if (!it[k]) err(`${f}: ${it.id} missing ${k}`);
    if (it.kind === 'ayah') { if (!/^\d+:\d+$/.test(it.quran || '')) err(`${f}: ${it.id} needs quran ref`); continue; }
    if (!it.ar) err(`${f}: ${it.id} missing ar`);
    if (['word', 'phrase', 'dua', 'syllable', 'mark'].includes(it.kind) && !HARAKAT.test(it.ar)) err(`${f}: ${it.id} has no vowel marks`);
    if (it.ar_f && !it.tr_f) err(`${f}: ${it.id} has ar_f without tr_f`);
  }
  for (const u of pack.units) for (const id of u.items) if (!ids.has(id)) err(`${f}: unit ${u.id} references missing ${id}`);
  console.log(`✓ ${f}: ${pack.items.length} items, ${pack.units.length} units`);
}
if (errors) { console.error(`${errors} problem(s)`); process.exit(1); }
console.log('All content checks passed.');
