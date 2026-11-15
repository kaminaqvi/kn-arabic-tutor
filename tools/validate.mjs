// Content checks: unique ids, required fields, unit references, vowel marks on Arabic, role-play references.
import { readFileSync, existsSync } from 'node:fs';
const idx = JSON.parse(readFileSync('content/index.json', 'utf8'));
const files = [idx.foundations, idx.shared, ...idx.paths.filter(p => p.available).map(p => p.file)].filter(Boolean);
const HARAKAT = /[ً-ْ]/;
let errors = 0; const all = new Map(); const packs = [];
const err = m => { errors++; console.error('✗ ' + m); };
for (const f of files) {
  const pack = JSON.parse(readFileSync('content/' + f, 'utf8'));
  packs.push([f, pack]);
  for (const it of pack.items) {
    if (all.has(it.id)) err(`${f}: duplicate id ${it.id}`);
    all.set(it.id, it);
    for (const k of ['id', 'kind', 'tr', 'en', 'ur']) if (!it[k]) err(`${f}: ${it.id} missing ${k}`);
    if (it.kind === 'ayah') { if (!/^\d+:\d+$/.test(it.quran || '')) err(`${f}: ${it.id} needs quran ref`); continue; }
    if (!it.ar) err(`${f}: ${it.id} missing ar`);
    if (['word', 'phrase', 'dua', 'syllable', 'mark', 'sign'].includes(it.kind) && !HARAKAT.test(it.ar)) err(`${f}: ${it.id} has no vowel marks`);
    if (it.ar_f && !it.tr_f) err(`${f}: ${it.id} has ar_f without tr_f`);
  }
}
for (const [f, pack] of packs) {
  for (const u of pack.units) for (const id of u.items) if (!all.has(id)) err(`${f}: unit ${u.id} references missing ${id}`);
  const n = pack.units.reduce((s, u) => s + u.items.length, 0);
  console.log(`✓ ${f}: ${pack.items.length} items, ${pack.units.length} units, ${n} unit slots`);
}
if (existsSync('content/roleplays.json')) {
  const rp = JSON.parse(readFileSync('content/roleplays.json', 'utf8'));
  for (const s of rp.scenarios) {
    if (!s.steps?.length) err(`roleplay ${s.id} has no steps`);
    for (const st of s.steps) {
      if (!st.npc?.ar || !HARAKAT.test(st.npc.ar)) err(`roleplay ${s.id}: npc line needs vowelled ar`);
      for (const id of st.expect) if (!all.has(id)) err(`roleplay ${s.id} expects missing ${id}`);
    }
  }
  console.log(`✓ roleplays.json: ${rp.scenarios.length} scenarios`);
}
if (errors) { console.error(`${errors} problem(s)`); process.exit(1); }
console.log('All content checks passed.');
