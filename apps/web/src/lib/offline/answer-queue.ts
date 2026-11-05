import type { AnswerPayload } from '@webcat/contracts';

/**
 * Antrean jawaban offline (IndexedDB).
 *
 * Alur yang dijaga:
 *  1. Setiap perubahan jawaban ditulis ke IndexedDB lebih dulu.
 *  2. Flush mengirim batch dengan satu `clientSeq`; record yang sudah terkirim
 *     dihapus. Bila request gagal, record tetap tersimpan dan dicoba lagi.
 *  3. `clientSeq` yang tersimpan membuat retry idempoten di server
 *     (`exam_answer_events` unik per soal + clientSeq).
 *
 * Saat SSR / browser tanpa IndexedDB, modul memakai fallback memori agar
 * halaman tetap dapat dirender dan diuji.
 */

export interface QueuedAnswer {
  id: number;
  subtestId: string;
  questionId: string;
  payload: AnswerPayload;
  timeSpentMs: number;
  /** 0 = belum pernah dikirim; diisi saat flush pertama. */
  clientSeq: number;
  createdAt: number;
}

export interface EnqueueAnswerInput {
  subtestId: string;
  questionId: string;
  payload: AnswerPayload;
  timeSpentMs?: number;
}

const DB_NAME = 'webcat-exam';
const DB_VERSION = 1;
const STORE_ANSWERS = 'answers';
const STORE_META = 'meta';

let memoryAnswers: QueuedAnswer[] = [];
const memorySeq = new Map<string, number>();
let memoryId = 0;

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_ANSWERS)) {
        const store = db.createObjectStore(STORE_ANSWERS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('subtestId', 'subtestId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Gagal membuka IndexedDB'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Operasi IndexedDB gagal'));
  });
}

export async function enqueueAnswer(input: EnqueueAnswerInput): Promise<number> {
  const record = {
    subtestId: input.subtestId,
    questionId: input.questionId,
    payload: input.payload,
    timeSpentMs: input.timeSpentMs ?? 0,
    clientSeq: 0,
    createdAt: Date.now(),
  };

  // Satu soal = satu baris selama belum terkirim. Tanpa penggabungan ini,
  // menjawab soal yang sama berulang kali saat offline menghasilkan beberapa
  // baris dengan `clientSeq` yang sama; server memakai yang PERTAMA dan
  // jawaban terbaru peserta hilang.
  if (!canUseIndexedDb()) {
    const superseded = memoryAnswers.filter(
      (entry) =>
        entry.subtestId === record.subtestId &&
        entry.questionId === record.questionId &&
        entry.clientSeq === 0,
    );
    for (const entry of superseded) record.timeSpentMs += entry.timeSpentMs;
    memoryAnswers = memoryAnswers.filter((entry) => !superseded.includes(entry));

    memoryId += 1;
    memoryAnswers.push({ id: memoryId, ...record });
    return memoryId;
  }

  const db = await openDb();
  const id = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_ANSWERS, 'readwrite');
    const store = tx.objectStore(STORE_ANSWERS);
    let newId = 0;

    const lookup = store.index('subtestId').getAll(record.subtestId);
    lookup.onsuccess = () => {
      for (const row of lookup.result as QueuedAnswer[]) {
        if (row.questionId === record.questionId && row.clientSeq === 0) {
          record.timeSpentMs += row.timeSpentMs;
          store.delete(row.id);
        }
      }
      const add = store.add(record);
      add.onsuccess = () => {
        newId = Number(add.result);
      };
    };

    tx.oncomplete = () => resolve(newId);
    tx.onerror = () => reject(tx.error ?? new Error('Gagal menyimpan jawaban'));
  });
  db.close();
  return id;
}

export async function listAnswers(subtestId: string): Promise<QueuedAnswer[]> {
  if (!canUseIndexedDb()) {
    return memoryAnswers.filter((entry) => entry.subtestId === subtestId);
  }

  const db = await openDb();
  const tx = db.transaction(STORE_ANSWERS, 'readonly');
  const index = tx.objectStore(STORE_ANSWERS).index('subtestId');
  const rows = await requestToPromise(index.getAll(subtestId));
  db.close();
  return (rows as QueuedAnswer[]).sort((a, b) => a.id - b.id);
}

export async function removeAnswers(ids: number[]): Promise<void> {
  if (ids.length === 0) return;

  if (!canUseIndexedDb()) {
    const remove = new Set(ids);
    memoryAnswers = memoryAnswers.filter((entry) => !remove.has(entry.id));
    return;
  }

  const db = await openDb();
  const tx = db.transaction(STORE_ANSWERS, 'readwrite');
  const store = tx.objectStore(STORE_ANSWERS);
  for (const id of ids) store.delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Gagal menghapus jawaban'));
  });
  db.close();
}

export async function nextClientSeq(subtestId: string): Promise<number> {
  const key = `seq:${subtestId}`;

  if (!canUseIndexedDb()) {
    const value = (memorySeq.get(subtestId) ?? 0) + 1;
    memorySeq.set(subtestId, value);
    return value;
  }

  const db = await openDb();
  const tx = db.transaction(STORE_META, 'readwrite');
  const store = tx.objectStore(STORE_META);
  const existing = (await requestToPromise(store.get(key))) as
    { key: string; value: number } | undefined;
  const value = (existing?.value ?? 0) + 1;
  store.put({ key, value });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Gagal menyimpan clientSeq'));
  });
  db.close();
  return value;
}

/** Mengisi `clientSeq` pada record yang belum punya (dipanggil sebelum flush). */
export async function assignClientSeq(records: QueuedAnswer[], clientSeq: number): Promise<void> {
  const pending = records.filter((record) => record.clientSeq === 0);
  if (pending.length === 0) return;

  if (!canUseIndexedDb()) {
    for (const record of pending) record.clientSeq = clientSeq;
    return;
  }

  const db = await openDb();
  const tx = db.transaction(STORE_ANSWERS, 'readwrite');
  const store = tx.objectStore(STORE_ANSWERS);
  for (const record of pending) store.put({ ...record, clientSeq });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Gagal memperbarui antrean'));
  });
  db.close();
}

export async function clearSubtest(subtestId: string): Promise<void> {
  const rows = await listAnswers(subtestId);
  await removeAnswers(rows.map((row) => row.id));
}

/** Hanya untuk unit test / pemulihan darurat. */
export function __resetOfflineQueueForTests(): void {
  memoryAnswers = [];
  memorySeq.clear();
  memoryId = 0;
}
