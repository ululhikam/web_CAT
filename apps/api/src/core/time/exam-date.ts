/**
 * Tanggal ujian mengikuti zona waktu operasional (WIB), bukan UTC.
 * `ExamSession.examDate` bertipe DATE sehingga hanya komponen tanggal yang
 * dipakai untuk batas kuota harian.
 */
export const EXAM_TIMEZONE = 'Asia/Jakarta';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EXAM_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Mengembalikan pukul 00:00 UTC untuk tanggal WIB yang sedang berjalan. */
export function examDateOnly(now: Date = new Date()): Date {
  const [year, month, day] = dateFormatter.format(now).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
