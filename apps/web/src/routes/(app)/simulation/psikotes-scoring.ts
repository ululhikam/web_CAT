import type { SimOption, SimQuestion, SimPacket } from './simulation-packets';

/* ============================================================================
 * SISTEM PENILAIAN KHUSUS SUBTES PSIKOTES (STANDAR CAT POLRI)
 *
 * 1. Subtes Kecerdasan:
 *    - Menguji penalaran kognitif (verbal, numerik, logika, figural, spasial).
 *    - Penilaian berbasis bobot butir soal: jawaban benar memperoleh bobot penuh,
 *      salah/kosong memperoleh 0.
 *    - Dihitung persentase skor kognitif (0–100) dan rasio akurasi.
 *
 * 2. Subtes Mental Kepribadian:
 *    - Menguji integritas, pengendalian emosi, tanggung jawab, kerjasama, dan kepemimpinan.
 *    - Menghitung BOBOT DARI SETIAP JAWABAN (gradasi nilai 1 sampai 5 poin per opsi).
 *    - Skor dihitung dari total akumulasi bobot jawaban terpilih dibagi bobot maksimal
 *      (5 × jumlah soal) dikalikan 100.
 *    - Rata-rata bobot jawaban per butir (skala 1.00 – 5.00) dan distribusi kualitas respon.
 *
 * 3. Subtes Kecermatan:
 *    - Menguji konsentrasi, ketelitian persepsi, dan ketahanan di bawah tekanan waktu per kolom.
 *    - Sistem evaluasi komposit 3 pilar CAT Polri:
 *      a. Kecepatan (bobot 40%): rasio butir terjawab terhadap target butir kolom.
 *      b. Ketelitian (bobot 40%): rasio ketepatan benar terhadap yang dikerjakan dikurangi penalti salah.
 *      c. Kestabilan (bobot 20%): konsistensi ritme kerja antar kolom (koefisien variasi stdev/mean).
 *
 * 4. Nilai Gabungan Psikotes (Paket Campuran / Lengkap):
 *    - Komposit pembobotan standar CAT Psikotes Polri:
 *      Kecerdasan (40%) + Mental Kepribadian (30%) + Kecermatan (30%).
 *    - Ambang Batas Kelulusan: Memenuhi Syarat (MS) >= 61.00, Tidak Memenuhi Syarat (TMS) < 61.00.
 * ========================================================================== */

export interface KecerdasanMetrics {
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number; // 0 - 100%
  score: number; // 0 - 100
  earnedPoints: number;
  maxPoints: number;
  passed: boolean;
}

export interface KepribadianDistribution {
  sangatBaik: number; // bobot 5
  baik: number; // bobot 4
  cukup: number; // bobot 3
  kurang: number; // bobot 2
  sangatKurang: number; // bobot 1
}

export interface KepribadianMetrics {
  totalQuestions: number;
  attempted: number;
  blank: number;
  totalScoreEarned: number; // Akumulasi bobot dari setiap jawaban yang dipilih
  maxPossibleScore: number; // Jumlah butir × 5
  averageWeight: number; // Rata-rata bobot per butir (1.00 - 5.00)
  score: number; // Skala 0 - 100
  passed: boolean;
  distribution: KepribadianDistribution;
  interpretation: 'Sangat Memenuhi Syarat' | 'Memenuhi Syarat' | 'Cukup / Perlu Pembinaan' | 'Perlu Perhatian Khusus';
}

export interface KecermatanColumnStat {
  columnNumber: number;
  total: number;
  attempted: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number; // 0 - 100%
}

export interface KecermatanMetrics {
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  blank: number;
  speedScore: number; // Faktor Kecepatan (bobot 40%)
  accuracyScore: number; // Faktor Ketelitian (bobot 40%)
  stabilityScore: number; // Faktor Kestabilan Kolom (bobot 20%)
  score: number; // Komposit 40-40-20 (skala 0 - 100)
  passed: boolean;
  columns: KecermatanColumnStat[];
}

export interface PsikotesEvaluationResult {
  isPsikotes: boolean;
  isMixed: boolean;
  category: 'PSIKOTES' | 'TKK' | 'TPK' | 'ALL';
  subtestType?: 'ALL' | 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN';
  activeSubtests: Array<'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN'>;
  kecerdasan?: KecerdasanMetrics;
  kepribadian?: KepribadianMetrics;
  kecermatan?: KecermatanMetrics;
  finalScore: number; // Skala 0 - 100
  passed: boolean; // Ambang batas >= 61.00
  passingGrade: number; // 61.00
  statusText: 'Memenuhi Syarat (MS)' | 'Tidak Memenuhi Syarat (TMS)';
  summaryExplanation: string;
}

/* -------------------------------------------------------------------------- */
/* HELPER MATEMATIKA & BOBOT JAWABAN                                          */
/* -------------------------------------------------------------------------- */

export function getOptionWeight(question: SimQuestion, optionKey: string | undefined): number {
  if (!optionKey) return 0;
  
  // 1. Cek bobot di dictionary optionWeights pada question
  if (question.optionWeights && typeof question.optionWeights[optionKey] === 'number') {
    return question.optionWeights[optionKey];
  }

  // 2. Cek bobot pada objek opsi
  const opt = question.options.find((o) => o.key === optionKey);
  if (opt && typeof opt.weight === 'number') {
    return opt.weight;
  }

  // 3. Fallback bila soal kepribadian tapi belum ada bobot eksplisit:
  // Kunci benar mendapat 5, opsi berdekatan mendapat 3-4, lainnya 1-2
  if (question.subtest === 'KEPRIBADIAN' || question.module.toLowerCase().includes('kepribadian')) {
    if (optionKey === question.correctKey) return 5;
    const keyCharCode = optionKey.charCodeAt(0);
    const correctCharCode = question.correctKey.charCodeAt(0);
    const diff = Math.abs(keyCharCode - correctCharCode);
    if (diff === 1) return 4;
    if (diff === 2) return 3;
    return 2;
  }

  // Default soal biner biasa: benar bernilai 1, salah 0
  return optionKey === question.correctKey ? 1 : 0;
}

export function getWeightGradeLabel(weight: number): { label: string; badgeClass: string } {
  switch (weight) {
    case 5:
      return { label: 'Sangat Baik (5/5)', badgeClass: 'grade-5' };
    case 4:
      return { label: 'Baik (4/5)', badgeClass: 'grade-4' };
    case 3:
      return { label: 'Cukup (3/5)', badgeClass: 'grade-3' };
    case 2:
      return { label: 'Kurang (2/5)', badgeClass: 'grade-2' };
    case 1:
      return { label: 'Sangat Kurang (1/5)', badgeClass: 'grade-1' };
    default:
      return { label: `Bobot ${weight}`, badgeClass: 'grade-default' };
  }
}

/** Hitung standar deviasi populasi */
function calculateStdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/* -------------------------------------------------------------------------- */
/* PENILAIAN SUBTES KECERDASAN                                                */
/* -------------------------------------------------------------------------- */

export function evaluateKecerdasanSubtest(
  questions: SimQuestion[],
  answers: Record<number, string>,
): KecerdasanMetrics {
  const totalQuestions = questions.length;
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  let earnedPoints = 0;
  let maxPoints = 0;

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i]!;
    const itemWeight = typeof q.weight === 'number' && q.weight > 0 ? q.weight : 10;
    maxPoints += itemWeight;

    const answerKey = answers[i];
    if (!answerKey) {
      blank += 1;
      continue;
    }

    if (answerKey === q.correctKey) {
      correct += 1;
      earnedPoints += itemWeight;
    } else {
      wrong += 1;
    }
  }

  const attempted = correct + wrong;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
  const passed = score >= 61;

  return {
    totalQuestions,
    attempted,
    correct,
    wrong,
    blank,
    accuracy,
    score,
    earnedPoints,
    maxPoints,
    passed,
  };
}

/* -------------------------------------------------------------------------- */
/* PENILAIAN SUBTES MENTAL KEPRIBADIAN (BOBOT JAWABAN 1-5)                    */
/* -------------------------------------------------------------------------- */

export function evaluateKepribadianSubtest(
  questions: SimQuestion[],
  answers: Record<number, string>,
): KepribadianMetrics {
  const totalQuestions = questions.length;
  let attempted = 0;
  let blank = 0;
  let totalScoreEarned = 0;
  const maxPossibleScore = totalQuestions * 5;

  const distribution: KepribadianDistribution = {
    sangatBaik: 0,
    baik: 0,
    cukup: 0,
    kurang: 0,
    sangatKurang: 0,
  };

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i]!;
    const answerKey = answers[i];

    if (!answerKey) {
      blank += 1;
      continue;
    }

    attempted += 1;
    const weight = getOptionWeight(q, answerKey);
    totalScoreEarned += weight;

    if (weight === 5) distribution.sangatBaik += 1;
    else if (weight === 4) distribution.baik += 1;
    else if (weight === 3) distribution.cukup += 1;
    else if (weight === 2) distribution.kurang += 1;
    else distribution.sangatKurang += 1;
  }

  const averageWeight = attempted > 0 ? Number((totalScoreEarned / attempted).toFixed(2)) : 0;
  // Skor dinormalisasi ke skala 0 - 100
  const score = maxPossibleScore > 0 ? Math.round((totalScoreEarned / maxPossibleScore) * 100) : 0;
  const passed = score >= 61;

  let interpretation: KepribadianMetrics['interpretation'] = 'Perlu Perhatian Khusus';
  if (score >= 80) {
    interpretation = 'Sangat Memenuhi Syarat';
  } else if (score >= 61) {
    interpretation = 'Memenuhi Syarat';
  } else if (score >= 50) {
    interpretation = 'Cukup / Perlu Pembinaan';
  }

  return {
    totalQuestions,
    attempted,
    blank,
    totalScoreEarned,
    maxPossibleScore,
    averageWeight,
    score,
    passed,
    distribution,
    interpretation,
  };
}

/* -------------------------------------------------------------------------- */
/* PENILAIAN SUBTES KECERMATAN (KECEPATAN, KETELITIAN & KESTABILAN KOLOM)    */
/* -------------------------------------------------------------------------- */

export function evaluateKecermatanSubtest(
  questions: SimQuestion[],
  answers: Record<number, string>,
): KecermatanMetrics {
  const totalQuestions = questions.length;
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalBlank = 0;

  // Kelompokkan per nomor kolom
  const columnMap = new Map<number, { indices: number[]; questions: SimQuestion[] }>();
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i]!;
    const colNum = q.columnNumber ?? 1;
    if (!columnMap.has(colNum)) {
      columnMap.set(colNum, { indices: [], questions: [] });
    }
    const colData = columnMap.get(colNum)!;
    colData.indices.push(i);
    colData.questions.push(q);
  }

  const sortedColNums = Array.from(columnMap.keys()).sort((a, b) => a - b);
  const columns: KecermatanColumnStat[] = [];
  const columnCorrectCounts: number[] = [];

  for (const colNum of sortedColNums) {
    const { indices } = columnMap.get(colNum)!;
    let colAttempted = 0;
    let colCorrect = 0;
    let colWrong = 0;
    let colBlank = 0;

    for (const idx of indices) {
      const q = questions[idx]!;
      const answerKey = answers[idx];
      if (!answerKey) {
        colBlank += 1;
        totalBlank += 1;
        continue;
      }

      colAttempted += 1;
      totalAttempted += 1;
      if (answerKey === q.correctKey) {
        colCorrect += 1;
        totalCorrect += 1;
      } else {
        colWrong += 1;
        totalWrong += 1;
      }
    }

    const colAccuracy = colAttempted > 0 ? Math.round((colCorrect / colAttempted) * 100) : 0;
    columns.push({
      columnNumber: colNum,
      total: indices.length,
      attempted: colAttempted,
      correct: colCorrect,
      wrong: colWrong,
      blank: colBlank,
      accuracy: colAccuracy,
    });
    columnCorrectCounts.push(colCorrect);
  }

  // 1. Kecepatan (bobot 40%): rasio terjawab terhadap total soal kecermatan
  const speedScore = totalQuestions > 0 ? Math.round((totalAttempted / totalQuestions) * 100) : 0;

  // 2. Ketelitian (bobot 40%): rasio benar terhadap terjawab dikurangi penalti salah (0.25)
  let rawAccuracy = 0;
  if (totalAttempted > 0) {
    const adjustedCorrect = Math.max(0, totalCorrect - 0.25 * totalWrong);
    rawAccuracy = Math.round((adjustedCorrect / totalAttempted) * 100);
  }
  const accuracyScore = Math.min(100, Math.max(0, rawAccuracy));

  // 3. Kestabilan (bobot 20%): koefisien variasi ritme kerja antar kolom
  let stabilityScore = 100;
  if (columnCorrectCounts.length >= 2) {
    const mean = columnCorrectCounts.reduce((a, b) => a + b, 0) / columnCorrectCounts.length;
    if (mean > 0) {
      const stdev = calculateStdev(columnCorrectCounts);
      const stabilityRatio = Math.max(0, 1 - stdev / mean);
      stabilityScore = Math.round(Math.min(100, Math.max(0, stabilityRatio * 100)));
    } else {
      stabilityScore = totalAttempted === 0 ? 0 : 50;
    }
  }

  // Skor Komposit Kecermatan (40% Kecepatan + 40% Ketelitian + 20% Kestabilan)
  const score = Math.round(0.4 * speedScore + 0.4 * accuracyScore + 0.2 * stabilityScore);
  const passed = score >= 61;

  return {
    totalQuestions,
    attempted: totalAttempted,
    correct: totalCorrect,
    wrong: totalWrong,
    blank: totalBlank,
    speedScore,
    accuracyScore,
    stabilityScore,
    score,
    passed,
    columns,
  };
}

/* -------------------------------------------------------------------------- */
/* PENILAIAN LENGKAP PSIKOTES (SUBTES TUNGGAL ATAU KOMPOSIT GABUNGAN)         */
/* -------------------------------------------------------------------------- */

export function evaluatePsikotesExam(
  packet: SimPacket,
  questions: SimQuestion[],
  answers: Record<number, string>,
): PsikotesEvaluationResult {
  const isPsikotes =
    packet.category === 'PSIKOTES' ||
    packet.id.startsWith('psikotes') ||
    packet.id === 'cat-all';

  // Pisahkan butir soal berdasarkan subtesnya
  const kecerdasanQuestions: SimQuestion[] = [];
  const kecerdasanAnswers: Record<number, string> = {};

  const kepribadianQuestions: SimQuestion[] = [];
  const kepribadianAnswers: Record<number, string> = {};

  const kecermatanQuestions: SimQuestion[] = [];
  const kecermatanAnswers: Record<number, string> = {};

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i]!;
    const ans = answers[i];

    if (q.subtest === 'KEPRIBADIAN' || q.module.toLowerCase().includes('kepribadian')) {
      const subIdx = kepribadianQuestions.length;
      kepribadianQuestions.push(q);
      if (ans) kepribadianAnswers[subIdx] = ans;
    } else if (
      q.isKecermatan ||
      q.subtest === 'KECERMATAN' ||
      q.module.toLowerCase().includes('kecermatan')
    ) {
      const subIdx = kecermatanQuestions.length;
      kecermatanQuestions.push(q);
      if (ans) kecermatanAnswers[subIdx] = ans;
    } else if (
      q.subtest === 'KECERDASAN' ||
      q.module.toLowerCase().includes('kecerdasan') ||
      packet.subtest === 'KECERDASAN'
    ) {
      const subIdx = kecerdasanQuestions.length;
      kecerdasanQuestions.push(q);
      if (ans) kecerdasanAnswers[subIdx] = ans;
    }
  }

  const activeSubtests: Array<'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN'> = [];
  let kecerdasanResult: KecerdasanMetrics | undefined;
  let kepribadianResult: KepribadianMetrics | undefined;
  let kecermatanResult: KecermatanMetrics | undefined;

  if (kecerdasanQuestions.length > 0) {
    activeSubtests.push('KECERDASAN');
    kecerdasanResult = evaluateKecerdasanSubtest(kecerdasanQuestions, kecerdasanAnswers);
  }

  if (kepribadianQuestions.length > 0) {
    activeSubtests.push('KEPRIBADIAN');
    kepribadianResult = evaluateKepribadianSubtest(kepribadianQuestions, kepribadianAnswers);
  }

  if (kecermatanQuestions.length > 0) {
    activeSubtests.push('KECERMATAN');
    kecermatanResult = evaluateKecermatanSubtest(kecermatanQuestions, kecermatanAnswers);
  }

  // Tentukan apakah paket campuran psikotes atau subtes tunggal
  const isMixed = activeSubtests.length > 1;

  let finalScore = 0;
  if (isMixed) {
    // Pembobotan komposit CAT Psikotes Polri
    // Kecerdasan (40%), Kepribadian (30%), Kecermatan (30%)
    let weightSum = 0;
    let weightedScore = 0;

    if (kecerdasanResult) {
      weightedScore += kecerdasanResult.score * 0.4;
      weightSum += 0.4;
    }
    if (kepribadianResult) {
      weightedScore += kepribadianResult.score * 0.3;
      weightSum += 0.3;
    }
    if (kecermatanResult) {
      weightedScore += kecermatanResult.score * 0.3;
      weightSum += 0.3;
    }

    finalScore = weightSum > 0 ? Math.round(weightedScore / weightSum) : 0;
  } else if (kecerdasanResult) {
    finalScore = kecerdasanResult.score;
  } else if (kepribadianResult) {
    finalScore = kepribadianResult.score;
  } else if (kecermatanResult) {
    finalScore = kecermatanResult.score;
  } else {
    // Fallback untuk non-psikotes biasa (TKK/TPK)
    const correctCount = questions.filter((q, idx) => answers[idx] === q.correctKey).length;
    finalScore = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  }

  const passed = finalScore >= 61;
  const passingGrade = 61.0;
  const statusText = passed ? 'Memenuhi Syarat (MS)' : 'Tidak Memenuhi Syarat (TMS)';

  let summaryExplanation = '';
  if (isMixed) {
    summaryExplanation = `Nilai Akhir Psikotes dihitung berdasarkan integrasi 3 subtes berbobot: Kecerdasan (40%), Mental Kepribadian (30%), dan Kecermatan (30%).`;
  } else if (packet.subtest === 'KEPRIBADIAN') {
    summaryExplanation = `Nilai dihitung dari akumulasi bobot setiap jawaban yang dipilih (skala 1-5 poin per butir) terhadap bobot maksimal ${kepribadianResult?.maxPossibleScore ?? 50} poin.`;
  } else if (packet.subtest === 'KECERMATAN') {
    summaryExplanation = `Nilai dihitung dari komposit performa 3 pilar: Kecepatan Kerja (40%), Ketelitian (40%), dan Kestabilan Antar Kolom (20%).`;
  } else {
    summaryExplanation = `Nilai dihitung berdasarkan bobot butir soal kognitif dan tingkat akurasi penalaran.`;
  }

  return {
    isPsikotes,
    isMixed,
    category: packet.category,
    subtestType: packet.subtest,
    activeSubtests,
    kecerdasan: kecerdasanResult,
    kepribadian: kepribadianResult,
    kecermatan: kecermatanResult,
    finalScore,
    passed,
    passingGrade,
    statusText,
    summaryExplanation,
  };
}

