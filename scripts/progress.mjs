#!/usr/bin/env node
/**
 * Ringkasan progres perbaikan WebCAT.
 *
 * Membaca `docs/PROGRESS.md` (satu-satunya sumber status) lalu mencetak
 * progres per fase, task berikutnya, dan (opsional) memeriksa konsistensi ID
 * terhadap runbook di `docs/perbaikan/`.
 *
 * Pemakaian:
 *   node scripts/progress.mjs            # ringkasan
 *   node scripts/progress.mjs --next     # hanya task berikutnya
 *   node scripts/progress.mjs --check    # gagal bila ID tidak konsisten
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROGRESS_FILE = join(ROOT, 'docs', 'PROGRESS.md');
const RUNBOOK_DIR = join(ROOT, 'docs', 'perbaikan');

const PHASES = [
  { id: 'F0', name: 'Persiapan & jaring pengaman' },
  { id: 'F1', name: 'CAT fungsional (B1/B2)' },
  { id: 'F2', name: 'Integration test & CI' },
  { id: 'F3', name: 'Soal bergambar' },
  { id: 'F4', name: 'Bank soal & konten' },
  { id: 'F5', name: 'Gap fitur P1/P2' },
];

const STATUS = { '⬜': 'belum', '🟨': 'dikerjakan', '✅': 'selesai', '⛔': 'terblokir', '➖': 'dibatalkan' };
const DONE = '✅';
/** Task yang tidak lagi menunggu dikerjakan: selesai ATAU dibatalkan. */
const RESOLVED = new Set([DONE, '➖']);

/** Baris tabel tracker: | F1-04 | pekerjaan | status | bukti | tanggal | */
function parseTasks(markdown) {
  const tasks = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith('| F')) continue;
    const cells = line.split('|').map((cell) => cell.trim());
    // cells[0] kosong (sebelum pipe pertama)
    const id = cells[1] ?? '';
    if (!/^F\d-\d{2}$/.test(id)) continue;
    tasks.push({
      id,
      title: cells[2] ?? '',
      status: cells[3] ?? '⬜',
      evidence: cells[4] ?? '',
    });
  }
  return tasks;
}

function bar(done, total, width = 10) {
  if (total === 0) return '░'.repeat(width);
  const filled = Math.round((done / total) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

async function readRunbookIds() {
  const ids = new Set();
  let files = [];
  try {
    files = await readdir(RUNBOOK_DIR);
  } catch {
    return ids;
  }
  for (const file of files.filter((name) => name.endsWith('.md'))) {
    const text = await readFile(join(RUNBOOK_DIR, file), 'utf8');
    for (const match of text.matchAll(/\|\s*(F\d-\d{2})\s*\|/g)) ids.add(match[1]);
  }
  return ids;
}

const args = new Set(process.argv.slice(2));
const markdown = await readFile(PROGRESS_FILE, 'utf8');
const tasks = parseTasks(markdown);

if (tasks.length === 0) {
  console.error('Tidak ada task yang terbaca dari docs/PROGRESS.md');
  process.exit(1);
}

const byId = new Map(tasks.map((task) => [task.id, task]));
let totalDone = 0;

if (!args.has('--next')) {
  console.log('\nProgres perbaikan WebCAT\n');
  for (const phase of PHASES) {
    const phaseTasks = tasks.filter((task) => task.id.startsWith(`${phase.id}-`));
    const done = phaseTasks.filter((task) => RESOLVED.has(task.status)).length;
    totalDone += done;
    const pct = phaseTasks.length === 0 ? 0 : Math.round((done / phaseTasks.length) * 100);
    console.log(
      `  ${phase.id}  ${bar(done, phaseTasks.length)}  ${String(done).padStart(2)}/${String(
        phaseTasks.length,
      ).padEnd(2)}  ${String(pct).padStart(3)}%  ${phase.name}`,
    );
  }
  const pct = Math.round((totalDone / tasks.length) * 100);
  console.log(`\n  TOTAL ${bar(totalDone, tasks.length)} ${totalDone}/${tasks.length}  ${pct}%`);
}

const blocked = tasks.filter((task) => task.status === '⛔');
if (blocked.length > 0) {
  console.log('\nTerblokir:');
  for (const task of blocked) console.log(`  ⛔ ${task.id} — ${task.evidence}`);
}

const next = tasks.filter((task) => !RESOLVED.has(task.status)).slice(0, 5);
if (next.length > 0) {
  console.log('\nBerikutnya:');
  for (const task of next) console.log(`  ${task.status} ${task.id} — ${task.title}`);
} else {
  console.log('\nSemua task selesai. 🎉');
}

if (args.has('--check')) {
  const runbookIds = await readRunbookIds();
  const trackerOnly = [...byId.keys()].filter((id) => runbookIds.size > 0 && !runbookIds.has(id));
  const runbookOnly = [...runbookIds].filter((id) => !byId.has(id));

  if (trackerOnly.length === 0 && runbookOnly.length === 0) {
    console.log('\nKonsistensi ID: OK (tracker ↔ runbook)');
  } else {
    if (trackerOnly.length > 0) console.error(`\nID hanya ada di tracker: ${trackerOnly.join(', ')}`);
    if (runbookOnly.length > 0) console.error(`\nID hanya ada di runbook: ${runbookOnly.join(', ')}`);
    process.exit(1);
  }
}
