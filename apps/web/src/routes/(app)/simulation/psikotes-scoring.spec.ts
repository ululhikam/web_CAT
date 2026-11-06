import { describe, expect, it } from 'vitest';
import {
  evaluateKecerdasanSubtest,
  evaluateKepribadianSubtest,
  evaluateKecermatanSubtest,
  evaluatePsikotesExam,
  getOptionWeight,
  getWeightGradeLabel,
} from './psikotes-scoring';
import type { SimPacket, SimQuestion } from './simulation-packets';

describe('psikotes-scoring', () => {
  const dummyKecerdasanQuestions: SimQuestion[] = [
    {
      id: 1,
      module: 'Tes Kecerdasan',
      subtest: 'KECERDASAN',
      stem: 'Soal 1',
      options: [
        { key: 'A', text: 'Opsi A' },
        { key: 'B', text: 'Opsi B' },
      ],
      correctKey: 'A',
      explanation: 'Penjelasan 1',
      weight: 10,
    },
    {
      id: 2,
      module: 'Tes Kecerdasan',
      subtest: 'KECERDASAN',
      stem: 'Soal 2',
      options: [
        { key: 'A', text: 'Opsi A' },
        { key: 'B', text: 'Opsi B' },
      ],
      correctKey: 'B',
      explanation: 'Penjelasan 2',
      weight: 10,
    },
  ];

  const dummyKepribadianQuestions: SimQuestion[] = [
    {
      id: 201,
      module: 'Tes Mental Kepribadian',
      subtest: 'KEPRIBADIAN',
      dimension: 'Integritas',
      stem: 'Soal Kepribadian 1',
      options: [
        { key: 'A', text: 'Kurang', weight: 2 },
        { key: 'B', text: 'Sangat Baik', weight: 5 },
        { key: 'C', text: 'Cukup', weight: 3 },
      ],
      correctKey: 'B',
      optionWeights: { A: 2, B: 5, C: 3 },
      explanation: 'Penjelasan Kepribadian 1',
    },
    {
      id: 202,
      module: 'Tes Mental Kepribadian',
      subtest: 'KEPRIBADIAN',
      dimension: 'Emosi',
      stem: 'Soal Kepribadian 2',
      options: [
        { key: 'A', text: 'Buruk', weight: 1 },
        { key: 'B', text: 'Baik', weight: 4 },
        { key: 'C', text: 'Sangat Baik', weight: 5 },
      ],
      correctKey: 'C',
      optionWeights: { A: 1, B: 4, C: 5 },
      explanation: 'Penjelasan Kepribadian 2',
    },
  ];

  const dummyKecermatanQuestions: SimQuestion[] = [
    // Kolom 1 (2 butir)
    {
      id: 301,
      module: 'Kecermatan Kolom 1',
      subtest: 'KECERMATAN',
      stem: 'Soal Cermat 1',
      options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }],
      correctKey: 'A',
      explanation: '',
      isKecermatan: true,
      columnNumber: 1,
    },
    {
      id: 302,
      module: 'Kecermatan Kolom 1',
      subtest: 'KECERMATAN',
      stem: 'Soal Cermat 2',
      options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }],
      correctKey: 'B',
      explanation: '',
      isKecermatan: true,
      columnNumber: 1,
    },
    // Kolom 2 (2 butir)
    {
      id: 303,
      module: 'Kecermatan Kolom 2',
      subtest: 'KECERMATAN',
      stem: 'Soal Cermat 3',
      options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }],
      correctKey: 'A',
      explanation: '',
      isKecermatan: true,
      columnNumber: 2,
    },
    {
      id: 304,
      module: 'Kecermatan Kolom 2',
      subtest: 'KECERMATAN',
      stem: 'Soal Cermat 4',
      options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }],
      correctKey: 'B',
      explanation: '',
      isKecermatan: true,
      columnNumber: 2,
    },
  ];

  describe('getOptionWeight & getWeightGradeLabel', () => {
    it('mengambil bobot dari optionWeights atau opsi', () => {
      const q = dummyKepribadianQuestions[0]!;
      expect(getOptionWeight(q, 'B')).toBe(5);
      expect(getOptionWeight(q, 'A')).toBe(2);
      expect(getOptionWeight(q, 'C')).toBe(3);
      expect(getOptionWeight(q, undefined)).toBe(0);
    });

    it('memberikan label predikat mutu bobot dengan benar', () => {
      expect(getWeightGradeLabel(5).label).toContain('Sangat Baik');
      expect(getWeightGradeLabel(4).label).toContain('Baik');
      expect(getWeightGradeLabel(3).label).toContain('Cukup');
      expect(getWeightGradeLabel(2).label).toContain('Kurang');
      expect(getWeightGradeLabel(1).label).toContain('Sangat Kurang');
    });
  });

  describe('evaluateKecerdasanSubtest', () => {
    it('menghitung skor sempurna jika semua jawaban benar', () => {
      const answers = { 0: 'A', 1: 'B' };
      const res = evaluateKecerdasanSubtest(dummyKecerdasanQuestions, answers);
      expect(res.score).toBe(100);
      expect(res.correct).toBe(2);
      expect(res.wrong).toBe(0);
      expect(res.accuracy).toBe(100);
      expect(res.passed).toBe(true);
    });

    it('menghitung skor 50 jika satu benar satu salah', () => {
      const answers = { 0: 'A', 1: 'A' }; // 1 harusnya B
      const res = evaluateKecerdasanSubtest(dummyKecerdasanQuestions, answers);
      expect(res.score).toBe(50);
      expect(res.correct).toBe(1);
      expect(res.wrong).toBe(1);
      expect(res.accuracy).toBe(50);
      expect(res.passed).toBe(false); // < 61
    });
  });

  describe('evaluateKepribadianSubtest', () => {
    it('menghitung bobot dari setiap jawaban yang dipilih peserta', () => {
      // Soal 1 pilih B (bobot 5), Soal 2 pilih B (bobot 4)
      const answers = { 0: 'B', 1: 'B' };
      const res = evaluateKepribadianSubtest(dummyKepribadianQuestions, answers);

      // Total bobot diperoleh = 5 + 4 = 9
      expect(res.totalScoreEarned).toBe(9);
      // Max bobot = 2 soal * 5 = 10
      expect(res.maxPossibleScore).toBe(10);
      // Rata-rata bobot = 9 / 2 = 4.5
      expect(res.averageWeight).toBe(4.5);
      // Skor = 9/10 * 100 = 90
      expect(res.score).toBe(90);
      expect(res.passed).toBe(true);
      expect(res.interpretation).toBe('Sangat Memenuhi Syarat');
      expect(res.distribution.sangatBaik).toBe(1); // bobot 5
      expect(res.distribution.baik).toBe(1); // bobot 4
    });

    it('menghitung nilai rendah jika memilih opsi berbobot rendah', () => {
      // Soal 1 pilih A (bobot 2), Soal 2 pilih A (bobot 1)
      const answers = { 0: 'A', 1: 'A' };
      const res = evaluateKepribadianSubtest(dummyKepribadianQuestions, answers);

      expect(res.totalScoreEarned).toBe(3);
      expect(res.averageWeight).toBe(1.5);
      expect(res.score).toBe(30);
      expect(res.passed).toBe(false);
      expect(res.interpretation).toBe('Perlu Perhatian Khusus');
      expect(res.distribution.kurang).toBe(1); // bobot 2
      expect(res.distribution.sangatKurang).toBe(1); // bobot 1
    });
  });

  describe('evaluateKecermatanSubtest', () => {
    it('menghitung 3 pilar: kecepatan, ketelitian, dan kestabilan per kolom', () => {
      // Kolom 1 benar semua (2), Kolom 2 benar semua (2)
      const answers = { 0: 'A', 1: 'B', 2: 'A', 3: 'B' };
      const res = evaluateKecermatanSubtest(dummyKecermatanQuestions, answers);

      expect(res.totalQuestions).toBe(4);
      expect(res.attempted).toBe(4);
      expect(res.correct).toBe(4);
      expect(res.wrong).toBe(0);
      expect(res.speedScore).toBe(100);
      expect(res.accuracyScore).toBe(100);
      expect(res.stabilityScore).toBe(100);
      expect(res.score).toBe(100);
      expect(res.columns).toHaveLength(2);
      expect(res.columns[0]?.correct).toBe(2);
      expect(res.columns[1]?.correct).toBe(2);
    });

    it('menghitung penurunan stabilitas saat performa antar kolom fluktuatif', () => {
      // Kolom 1 benar 2, Kolom 2 salah semua (benar 0)
      const answers = { 0: 'A', 1: 'B', 2: 'B', 3: 'A' };
      const res = evaluateKecermatanSubtest(dummyKecermatanQuestions, answers);

      expect(res.columns[0]?.correct).toBe(2);
      expect(res.columns[1]?.correct).toBe(0);
      expect(res.stabilityScore).toBeLessThan(100);
      expect(res.passed).toBe(false);
    });
  });

  describe('evaluatePsikotesExam', () => {
    it('menggabungkan nilai 3 subtes dengan pembobotan komposit (40-30-30)', () => {
      const mixedPacket: SimPacket = {
        id: 'psikotes-all',
        category: 'PSIKOTES',
        subtest: 'ALL',
        title: 'Tes Psikologi Lengkap',
        subtitle: 'Campuran 3 Subtes',
        description: '',
        badge: '',
        durationSeconds: 600,
        questions: [
          ...dummyKecerdasanQuestions, // 2 soal
          ...dummyKepribadianQuestions, // 2 soal
          ...dummyKecermatanQuestions, // 4 soal
        ],
      };

      // Jawab semua sempurna
      const answers: Record<number, string> = {
        0: 'A', // Kecerdasan 1
        1: 'B', // Kecerdasan 2
        2: 'B', // Kepribadian 1 (bobot 5)
        3: 'C', // Kepribadian 2 (bobot 5)
        4: 'A', // Kecermatan 1
        5: 'B', // Kecermatan 2
        6: 'A', // Kecermatan 3
        7: 'B', // Kecermatan 4
      };

      const result = evaluatePsikotesExam(mixedPacket, mixedPacket.questions, answers);
      expect(result.isPsikotes).toBe(true);
      expect(result.isMixed).toBe(true);
      expect(result.activeSubtests).toContain('KECERDASAN');
      expect(result.activeSubtests).toContain('KEPRIBADIAN');
      expect(result.activeSubtests).toContain('KECERMATAN');
      expect(result.kecerdasan?.score).toBe(100);
      expect(result.kepribadian?.score).toBe(100);
      expect(result.kecermatan?.score).toBe(100);
      expect(result.finalScore).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.statusText).toBe('Memenuhi Syarat (MS)');
    });
  });
});

