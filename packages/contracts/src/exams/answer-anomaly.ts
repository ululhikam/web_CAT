/**
 * F5-13 — aturan murni anomali waktu jawab.
 *
 * Dipakai dua sisi:
 * - API saat autosave (aturan gambar & deret) — data jawaban sudah ada di server.
 * - Web saat peserta mengetuk opsi (aturan perubahan jawaban) — antrean offline
 *   menggabungkan beberapa perubahan pada satu soal menjadi satu baris, jadi
 *   jumlah perubahan per 2 detik hanya terlihat di browser.
 *
 * Tidak ada fungsi di sini yang menggugurkan peserta: anomali hanya dicatat
 * sebagai sinyal untuk ditinjau admin, karena jawaban sangat cepat bisa berarti
 * menebak, bukan curang.
 */

/** Soal bergambar yang dijawab lebih cepat dari ini dicatat. */
export const IMAGE_TOO_FAST_MS = 300;

/** Ambang "sangat cepat" untuk deret soal berurutan. */
export const SPEED_STREAK_MS = 150;

/** Jumlah soal berurutan yang harus terpenuhi sebelum deret dicatat. */
export const SPEED_STREAK_LENGTH = 5;

/** Jendela pengamatan untuk jawaban yang diubah berkali-kali. */
export const CHURN_WINDOW_MS = 2_000;

/** Jumlah perubahan yang masih dianggap wajar di dalam jendela di atas. */
export const CHURN_LIMIT = 5;

export const ANSWER_ANOMALY_TYPES = [
  'ANSWER_TOO_FAST_IMAGE',
  'ANSWER_TOO_FAST_STREAK',
  'ANSWER_CHANGE_BURST',
] as const;
export type AnswerAnomalyType = (typeof ANSWER_ANOMALY_TYPES)[number];

/** Label Indonesia untuk admin (dipakai UI monitoring). */
export const ANSWER_ANOMALY_LABELS: Record<AnswerAnomalyType, string> = {
  ANSWER_TOO_FAST_IMAGE: 'Soal bergambar dijawab < 300 ms',
  ANSWER_TOO_FAST_STREAK: '5 soal berturut dijawab < 150 ms',
  ANSWER_CHANGE_BURST: 'Jawaban diubah > 5 kali dalam 2 detik',
};

/**
 * Keparahan sinyal. `medium` untuk pola yang paling sulit dijelaskan oleh
 * kebiasaan wajar (deret lima soal & perubahan beruntun).
 */
export const ANSWER_ANOMALY_SEVERITY: Record<AnswerAnomalyType, 'low' | 'medium'> = {
  ANSWER_TOO_FAST_IMAGE: 'low',
  ANSWER_TOO_FAST_STREAK: 'medium',
  ANSWER_CHANGE_BURST: 'medium',
};

export function isAnswerAnomalyType(value: string): value is AnswerAnomalyType {
  return (ANSWER_ANOMALY_TYPES as readonly string[]).includes(value);
}

/** Bagian snapshot soal yang dibutuhkan untuk mengenali soal bergambar. */
export interface AnomalySnapshotLike {
  media?: Array<{ role?: string | null }> | null;
  options?: Array<{ media?: Array<{ role?: string | null }> | null }> | null;
}

/**
 * Soal bergambar = punya media pada stem atau pada salah satu opsi (mis.
 * `IMAGE_CHOICE`). Media `EXPLANATION` tidak dihitung karena pembahasan tidak
 * pernah tampil saat peserta menjawab.
 */
export function isImageQuestion(snapshot: AnomalySnapshotLike | null | undefined): boolean {
  if (!snapshot) return false;
  const hasStemMedia = (snapshot.media ?? []).some((entry) => entry?.role !== 'EXPLANATION');
  if (hasStemMedia) return true;
  return (snapshot.options ?? []).some((option) =>
    (option?.media ?? []).some((entry) => entry?.role !== 'EXPLANATION'),
  );
}

/**
 * Aturan 1: soal bergambar dijawab di bawah 300 ms.
 *
 * `0` dianggap "tidak dilaporkan" (klien lama atau antrean offline yang
 * digabung), bukan 0 ms — kalau dihitung, semua jawaban tanpa metrik waktu akan
 * menjadi anomali.
 */
export function isImageAnswerTooFast(timeSpentMs: number): boolean {
  return Number.isFinite(timeSpentMs) && timeSpentMs > 0 && timeSpentMs < IMAGE_TOO_FAST_MS;
}

/** Satu soal dengan waktu jawabnya, untuk aturan deret. */
export interface QuestionTiming {
  sessionQuestionId: string;
  /** `exam_session_questions.position`. */
  position: number;
  /** Waktu jawab soal (ms). */
  timeSpentMs: number;
}

export interface FastStreak {
  /** Soal terakhir pada deret — dipakai sebagai anchor anomali. */
  sessionQuestionId: string;
  positions: number[];
  timeSpentMs: number[];
}

/**
 * Aturan 2: lima soal berurutan dijawab di bawah 150 ms.
 *
 * Posisi harus benar-benar berurutan (`n, n+1, …`): peserta yang melompati soal
 * tidak dianggap membuat deret. Satu deret dilaporkan sekali (yang pertama
 * ditemukan).
 */
export function findFastStreak(items: QuestionTiming[]): FastStreak | null {
  if (items.length < SPEED_STREAK_LENGTH) return null;

  const ordered = [...items].sort((a, b) => a.position - b.position);
  for (let start = 0; start + SPEED_STREAK_LENGTH <= ordered.length; start += 1) {
    const window = ordered.slice(start, start + SPEED_STREAK_LENGTH);
    const consecutive = window.every(
      (entry, index) => index === 0 || entry.position === window[index - 1]!.position + 1,
    );
    if (!consecutive) continue;

    const allFast = window.every(
      (entry) =>
        Number.isFinite(entry.timeSpentMs) &&
        entry.timeSpentMs > 0 &&
        entry.timeSpentMs < SPEED_STREAK_MS,
    );
    if (!allFast) continue;

    return {
      sessionQuestionId: window[window.length - 1]!.sessionQuestionId,
      positions: window.map((entry) => entry.position),
      timeSpentMs: window.map((entry) => entry.timeSpentMs),
    };
  }

  return null;
}

/**
 * Aturan 3: lebih dari lima perubahan dalam dua detik.
 *
 * Jendela dihitung mundur dari perubahan terakhir supaya lonjakan lama tidak
 * dilaporkan ulang saat peserta kembali ke soal itu. Mengembalikan jumlah
 * perubahan pada jendela tersebut, atau `0` bila masih wajar.
 */
export function countChangesInWindow(timestamps: number[]): number {
  if (timestamps.length <= CHURN_LIMIT) return 0;
  const sorted = [...timestamps].sort((a, b) => a - b);
  const last = sorted[sorted.length - 1]!;
  const changes = sorted.filter((timestamp) => last - timestamp <= CHURN_WINDOW_MS).length;
  return changes > CHURN_LIMIT ? changes : 0;
}
