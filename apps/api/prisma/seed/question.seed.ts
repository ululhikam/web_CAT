/**
 * Bank soal — entry point seed.
 *
 * Logika dan data soal realistis berada di `./questions` (kategori, 990 soal
 * Psikologi + TPK, status PUBLISHED). Modul ini hanya meneruskan panggilan agar
 * `prisma/seed/index.ts` tidak perlu berubah saat data soal berkembang.
 */
export { QUESTION_CATEGORIES, buildSeedQuestions, seedQuestionBank } from './questions';
