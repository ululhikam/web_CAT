/**
 * Dinamis Bank Soal & Konfigurasi Paket Pretest CAT Polri (Seleksi SIP / Akpol / Bintara)
 *
 * Seluruh butir soal bersumber langsung dari Seed Bank Soal Utama (`apps/api/prisma/seed/questions/*`)
 * tanpa hardcode statis di komponen UI:
 * - Pool Kecerdasan   : 214 soal narasi panjang -> disajikan 100 soal acak per sesi
 * - Pool Kepribadian  : 240 soal studi kasus kedinasan -> disajikan 100 soal acak per sesi
 * - Pool Kecermatan   : 500 soal (10 Kolom @ 50 Soal, 60 detik/kolom) -> diacak per kolom setiap sesi
 * - Pool TKK          : 206 soal narasi teknis komputer -> disajikan 100 soal acak per sesi
 * - Pool TPK          : 200 soal narasi regulasi & hukum kepolisian -> disajikan 100 soal acak per sesi
 *
 * Pengacakan (randomization) dilakukan secara ketat per subtes (strictly isolated per subtest)
 * sehingga tidak mungkin ada soal lintas kategori yang nyasar ke subtes lain.
 */

import { buildChoices } from '../../../../../api/prisma/seed/questions/builder';
import { DENAH_LOKASI_QUESTIONS } from '../../../../../api/prisma/seed/questions/denah';
import { KECERDASAN_QUESTIONS } from '../../../../../api/prisma/seed/questions/kecerdasan';
import { KECERMATAN_QUESTIONS } from '../../../../../api/prisma/seed/questions/kecermatan';
import { KEPRIBADIAN_QUESTIONS } from '../../../../../api/prisma/seed/questions/kepribadian';
import { TKK_QUESTIONS } from '../../../../../api/prisma/seed/questions/tkk';
import { TPK_QUESTIONS } from '../../../../../api/prisma/seed/questions/tpk';

export interface SimOption {
  key: string;
  text: string;
  weight?: number;
}

export interface SimBenchmarkItem {
  char: string;
  label: string;
}

export interface SimQuestion {
  id: number;
  module: string;
  subtest?: 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN' | 'TKK' | 'TPK';
  subCategory?: string;
  difficulty?: string;
  stem: string;
  image?: string;
  options: SimOption[];
  correctKey: string;
  explanation: string;
  weight?: number;
  optionWeights?: Record<string, number>;
  dimension?: string;
  isKecermatan?: boolean;
  columnNumber?: number;
  benchmark?: SimBenchmarkItem[];
  questionChars?: string[];
}

export interface SimPacket {
  id: string;
  category: 'PSIKOTES' | 'TKK' | 'TPK' | 'ALL';
  subtest?: 'ALL' | 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN';
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  durationSeconds: number;
  isKecermatanOnly?: boolean;
  columnDurationSeconds?: number;
  poolSize?: number;
  questions: SimQuestion[];
}

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'] as const;

const KECERDASAN_SUBCATEGORY_LABEL: Record<string, string> = {
  verbal: 'Kemampuan Verbal & Analogi',
  numerik: 'Aritmatika & Deret Angka',
  logis: 'Penalaran Logis & Silogisme',
  figural: 'Penalaran Figural & Spasial',
  petadenah: 'Denah, Peta & Navigasi Taktis',
  kepribadian: 'Analisis Situasional Kedinasan',
};

const KEPRIBADIAN_DIMENSION_LABEL: Record<string, string> = {
  INTEGRITAS: 'Integritas dan Kejujuran',
  DISIPLIN: 'Disiplin dan Kepatuhan SOP',
  TANGGUNG_JAWAB: 'Tanggung Jawab dan Pengambilan Keputusan',
  PENGENDALIAN_DIRI: 'Pengendalian Emosi dan Ketahanan Mental',
  KERJASAMA: 'Kerja Sama dan Hubungan Sosial',
  PELAYANAN: 'Loyalitas dan Pelayanan Masyarakat',
  KEPEMIMPINAN: 'Kepemimpinan dan Mental Calon Perwira',
};

const TKK_TOPIC_LABEL: Record<string, string> = {
  'perangkat-keras': 'Hardware dan Perangkat Komputer',
  'perangkat-lunak': 'Microsoft Office, OS dan Shortcut',
  jaringan: 'Pengetahuan Dasar Internet & Jaringan',
  keamanan: 'Keamanan Siber & Etika Data Dinas',
  penalaran: 'Troubleshooting & Penalaran Teknis TI',
};

const TPK_TOPIC_LABEL: Record<string, string> = {
  pancasila: 'Pancasila & UUD NRI Tahun 1945',
  'uu-kepolisian': 'Dasar Hukum UU No. 2 Tahun 2002',
  wewenang: 'Wewenang & Diskresi Kepolisian',
  'hukum-pidana': 'Hukum Pidana Materiil (KUHP)',
  kuhap: 'Hukum Acara Pidana (KUHAP)',
  'etika-ham': 'Kode Etik Profesi, Disiplin & HAM',
  'fungsi-teknis': 'Tugas dan Fungsi Teknis Kepolisian',
  manajemen: 'Manajemen Operasional & Kepemimpinan',
  'situasi-tugas': 'Pedoman Pelaksanaan Situasi Tugas',
  profesionalisme: 'Kebijakan & Profesionalisme Polri Presisi',
};

/* -------------------------------------------------------------------------- */
/* KONSTRUKSI POOL SOAL DARI SEED FILE (TERISOLASI KETAT PER SUBTES)          */
/* -------------------------------------------------------------------------- */

const POOL_KECERDASAN: SimQuestion[] = [
  ...KECERDASAN_QUESTIONS.map((row, idx): SimQuestion => {
    const leaf = row.categoryPath.split('/').pop() ?? 'logis';
    return {
      id: 1000 + idx + 1,
      module: 'Tes Psikologi — Kecerdasan (SIP Polri)',
      subtest: 'KECERDASAN',
      subCategory: KECERDASAN_SUBCATEGORY_LABEL[leaf] ?? 'Penalaran Logis & Analitis',
      difficulty: row.difficulty,
      stem: row.stem,
      options: row.options.map((text, optIdx) => ({
        key: OPTION_KEYS[optIdx]!,
        text,
      })),
      correctKey: row.answer,
      explanation: row.explanation,
      weight: 1,
    };
  }),
  ...DENAH_LOKASI_QUESTIONS.map((row, idx): SimQuestion => ({
    id: 1500 + idx + 1,
    module: 'Tes Psikologi — Kecerdasan (SIP Polri)',
    subtest: 'KECERDASAN',
    subCategory: 'Denah, Peta & Navigasi Taktis',
    difficulty: 'MEDIUM',
    stem: row.stem,
    image: '/images/questions/denah_lokasi_sip.png',
    options: row.options.map((text, optIdx) => ({
      key: OPTION_KEYS[optIdx]!,
      text,
    })),
    correctKey: row.answer,
    explanation: row.explanation,
    weight: 1,
  })),
];

const POOL_KEPRIBADIAN: SimQuestion[] = KEPRIBADIAN_QUESTIONS.map((row, idx): SimQuestion => {
  const isReverse = row.polarity === 'REVERSE';
  const weights: Record<string, number> = isReverse
    ? { A: 1, B: 2, C: 3, D: 4, E: 5 }
    : { A: 5, B: 4, C: 3, D: 2, E: 1 };
  const correctKey = isReverse ? 'E' : 'A';
  const dimLabel = KEPRIBADIAN_DIMENSION_LABEL[row.dimension] ?? row.dimension;

  return {
    id: 2000 + idx + 1,
    module: 'Tes Psikologi — Mental Kepribadian',
    subtest: 'KEPRIBADIAN',
    subCategory: dimLabel,
    dimension: dimLabel,
    difficulty: row.difficulty ?? 'MEDIUM',
    stem: row.statement,
    options: [
      { key: 'A', text: 'Sangat Setuju', weight: weights.A },
      { key: 'B', text: 'Setuju', weight: weights.B },
      { key: 'C', text: 'Ragu-Ragu', weight: weights.C },
      { key: 'D', text: 'Tidak Setuju', weight: weights.D },
      { key: 'E', text: 'Sangat Tidak Setuju', weight: weights.E },
    ],
    correctKey,
    optionWeights: weights,
    explanation: `Mengukur indikator ${dimLabel} dalam pelaksanaan tugas kepolisian (${isReverse ? 'pernyataan berarah negatif/terbalik — sikap profesional tertinggi adalah Sangat Tidak Setuju' : 'pernyataan berarah positif — sikap profesional tertinggi adalah Sangat Setuju'}).`,
    weight: 5,
  };
});

const POOL_KECERMATAN: SimQuestion[] = KECERMATAN_QUESTIONS.map((row, idx): SimQuestion => {
  const colNumber = (row.columnIndex ?? Math.floor(idx / 50)) + 1;
  const leftChars = row.left.split('');
  const rightChars = row.right.split('');
  const benchmark: SimBenchmarkItem[] = leftChars.map((char, cIdx) => ({
    char,
    label: OPTION_KEYS[cIdx]!,
  }));
  const answerIdx = leftChars.indexOf(row.answer);
  const correctKey = OPTION_KEYS[answerIdx >= 0 ? answerIdx : 0]!;

  return {
    id: 3000 + idx + 1,
    module: `Tes Psikologi — Kecermatan (Kolom ${colNumber})`,
    subtest: 'KECERMATAN',
    subCategory: `Kolom ${colNumber}`,
    difficulty: row.difficulty,
    stem: row.stem,
    options: benchmark.map((b) => ({
      key: b.label,
      text: b.label,
    })),
    correctKey,
    explanation: `Pada Kolom ${colNumber}, patokan adalah [${leftChars.join(' ')}] (A–E) dan soal menampilkan [${rightChars.join(' ')}]. Karakter yang hilang adalah "${row.answer}" yang berada pada label ${correctKey}.`,
    weight: 1,
    isKecermatan: true,
    columnNumber: colNumber,
    benchmark,
    questionChars: rightChars,
  };
});

const BUILT_TKK = buildChoices('TKK', 'tkk', TKK_QUESTIONS);
const POOL_TKK: SimQuestion[] = BUILT_TKK.map((row, idx): SimQuestion => {
  const leaf = row.categoryPath.split('/').pop() ?? 'penalaran';
  return {
    id: 4000 + idx + 1,
    module: 'Tes Kemampuan Komputer (TKK Polri)',
    subtest: 'TKK',
    subCategory: TKK_TOPIC_LABEL[leaf] ?? 'Teknologi Informasi Kepolisian',
    difficulty: row.difficulty,
    stem: row.stem,
    options: row.options.map((text, optIdx) => ({
      key: OPTION_KEYS[optIdx]!,
      text,
    })),
    correctKey: row.answer,
    explanation: row.explanation,
    weight: 1,
  };
});

const BUILT_TPK = buildChoices('TPK', 'tpk', TPK_QUESTIONS);
const POOL_TPK: SimQuestion[] = BUILT_TPK.map((row, idx): SimQuestion => {
  const leaf = row.categoryPath.split('/').pop() ?? 'profesionalisme';
  return {
    id: 5000 + idx + 1,
    module: 'Tes Pengetahuan Kepolisian (TPK Polri)',
    subtest: 'TPK',
    subCategory: TPK_TOPIC_LABEL[leaf] ?? 'Regulasi & Pengetahuan Kepolisian',
    difficulty: row.difficulty,
    stem: row.stem,
    options: row.options.map((text, optIdx) => ({
      key: OPTION_KEYS[optIdx]!,
      text,
    })),
    correctKey: row.answer,
    explanation: row.explanation,
    weight: 1,
  };
});

export const SIMULATION_POOL_STATS = {
  KECERDASAN: POOL_KECERDASAN.length,
  KEPRIBADIAN: POOL_KEPRIBADIAN.length,
  KECERMATAN: POOL_KECERMATAN.length,
  TKK: POOL_TKK.length,
  TPK: POOL_TPK.length,
  TOTAL:
    POOL_KECERDASAN.length +
    POOL_KEPRIBADIAN.length +
    POOL_KECERMATAN.length +
    POOL_TKK.length +
    POOL_TPK.length,
} as const;

/* -------------------------------------------------------------------------- */
/* PENGACAKAN KETAT PER SUBTES (FISHER-YATES)                                 */
/* -------------------------------------------------------------------------- */

function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

function shuffleSingleChoiceOptions(question: SimQuestion): SimQuestion {
  if (question.isKecermatan || question.subtest === 'KEPRIBADIAN') {
    return { ...question };
  }
  const correctOpt = question.options.find((o) => o.key === question.correctKey) ?? question.options[0]!;
  const shuffledOpts = shuffleArray(question.options);
  let newCorrectKey = 'A';
  const relabeled: SimOption[] = shuffledOpts.map((opt, idx) => {
    const key = OPTION_KEYS[idx]!;
    if (opt.text === correctOpt.text) {
      newCorrectKey = key;
    }
    return {
      ...opt,
      key,
    };
  });

  return {
    ...question,
    options: relabeled,
    correctKey: newCorrectKey,
  };
}

/**
 * Mengambil dan mengacak soal secara ketat hanya dari pool subtes yang diminta.
 * Menjamin 0% kebocoran soal lintas subtes.
 */
export function sampleSubtestQuestions(
  subtest: 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN' | 'TKK' | 'TPK',
  count: number,
): SimQuestion[] {
  if (subtest === 'KECERMATAN') {
    // 10 kolom × 50 soal per kolom = 500 soal; acak urutan soal di dalam masing-masing kolom
    const result: SimQuestion[] = [];
    for (let col = 1; col <= 10; col++) {
      const colQuestions = POOL_KECERMATAN.filter(
        (q) => q.subtest === 'KECERMATAN' && q.columnNumber === col,
      );
      const shuffledCol = shuffleArray(colQuestions).map((q) => ({
        ...q,
        questionChars: q.questionChars ? shuffleArray(q.questionChars) : [],
      }));
      result.push(...shuffledCol);
    }
    return result.slice(0, count);
  }

  const sourcePool =
    subtest === 'KECERDASAN'
      ? POOL_KECERDASAN
      : subtest === 'KEPRIBADIAN'
        ? POOL_KEPRIBADIAN
        : subtest === 'TKK'
          ? POOL_TKK
          : POOL_TPK;

  // Filter defensif untuk memastikan hanya subtest yang tepat yang diambil
  const isolatedPool = sourcePool.filter((q) => q.subtest === subtest);
  const picked = shuffleArray(isolatedPool).slice(0, count);
  return picked.map((q) => shuffleSingleChoiceOptions(q));
}

/**
 * Membangun paket soal Pretest CAT dengan soal yang diacak segar per subtes.
 */
export function buildRandomizedPacket(packetId: string): SimPacket {
  const template = SIMULATION_PACKETS.find((p) => p.id === packetId) ?? SIMULATION_PACKETS[0]!;

  if (packetId === 'psikotes-kecerdasan') {
    return {
      ...template,
      questions: sampleSubtestQuestions('KECERDASAN', 100),
    };
  }
  if (packetId === 'psikotes-kepribadian') {
    return {
      ...template,
      questions: sampleSubtestQuestions('KEPRIBADIAN', 100),
    };
  }
  if (packetId === 'psikotes-kecermatan') {
    return {
      ...template,
      questions: sampleSubtestQuestions('KECERMATAN', 500),
    };
  }
  if (packetId === 'tkk') {
    return {
      ...template,
      questions: sampleSubtestQuestions('TKK', 100),
    };
  }
  if (packetId === 'tpk') {
    return {
      ...template,
      questions: sampleSubtestQuestions('TPK', 100),
    };
  }
  if (packetId === 'psikotes-all') {
    return {
      ...template,
      questions: [
        ...sampleSubtestQuestions('KECERDASAN', 100),
        ...sampleSubtestQuestions('KEPRIBADIAN', 100),
        ...sampleSubtestQuestions('KECERMATAN', 500),
      ],
    };
  }
  if (packetId === 'cat-all') {
    return {
      ...template,
      questions: [
        ...sampleSubtestQuestions('KECERDASAN', 100),
        ...sampleSubtestQuestions('KEPRIBADIAN', 100),
        ...sampleSubtestQuestions('KECERMATAN', 500),
        ...sampleSubtestQuestions('TKK', 100),
        ...sampleSubtestQuestions('TPK', 100),
      ],
    };
  }

  return {
    ...template,
    questions: sampleSubtestQuestions('KECERDASAN', 100),
  };
}

export const SIMULATION_PACKETS: SimPacket[] = [
  {
    id: 'psikotes-all',
    category: 'PSIKOTES',
    subtest: 'ALL',
    title: 'Pretest CAT Psikotes — Semua Subtes (Campuran)',
    subtitle: `Kecerdasan (100 dari ${POOL_KECERDASAN.length} Soal), Kepribadian (100 dari ${POOL_KEPRIBADIAN.length} Soal) & Kecermatan (500 Soal / 10 Kolom)`,
    description:
      'Latihan komprehensif 3 pilar psikotes standar CAT Polri yang diacak per subtes dari bank soal utama (100 Kecerdasan, 100 Kepribadian, dan 500 Kecermatan 10 Kolom @ 60 detik).',
    badge: `700 Soal Aktif • Bank ${POOL_KECERDASAN.length + POOL_KEPRIBADIAN.length + POOL_KECERMATAN.length} Soal`,
    durationSeconds: (90 + 60 + 10) * 60,
    columnDurationSeconds: 60,
    poolSize: POOL_KECERDASAN.length + POOL_KEPRIBADIAN.length + POOL_KECERMATAN.length,
    questions: [
      ...POOL_KECERDASAN.slice(0, 100),
      ...POOL_KEPRIBADIAN.slice(0, 100),
      ...POOL_KECERMATAN.slice(0, 500),
    ],
  },
  {
    id: 'psikotes-kecerdasan',
    category: 'PSIKOTES',
    subtest: 'KECERDASAN',
    title: 'Pretest CAT Psikotes — Subtes Kecerdasan',
    subtitle: `100 Soal Acak (Bank ${POOL_KECERDASAN.length} Soal) • Narasi Analitis, Denah Peta, Deret & Silogisme`,
    description:
      `Menyajikan 100 soal yang diacak otomatis dari total ${POOL_KECERDASAN.length} bank soal Kecerdasan berbasis narasi studi kasus kepolisian, penalaran logis, deret numerik, dan orientasi denah wilayah.`,
    badge: `100 Soal • Bank ${POOL_KECERDASAN.length} Soal`,
    durationSeconds: 90 * 60,
    poolSize: POOL_KECERDASAN.length,
    questions: POOL_KECERDASAN.slice(0, 100),
  },
  {
    id: 'psikotes-kepribadian',
    category: 'PSIKOTES',
    subtest: 'KEPRIBADIAN',
    title: 'Pretest CAT Psikotes — Subtes Mental Kepribadian',
    subtitle: `100 Soal Acak (Bank ${POOL_KEPRIBADIAN.length} Soal) • Studi Kasus Dilema Kedinasan Polri (Skala 1–5)`,
    description:
      `Menyajikan 100 soal yang diacak otomatis dari total ${POOL_KEPRIBADIAN.length} bank soal Mental Kepribadian berbasis narasi dilema integritas, disiplin, kepemimpinan, dan pelayanan publik Polri.`,
    badge: `100 Soal • Bank ${POOL_KEPRIBADIAN.length} Soal`,
    durationSeconds: 60 * 60,
    poolSize: POOL_KEPRIBADIAN.length,
    questions: POOL_KEPRIBADIAN.slice(0, 100),
  },
  {
    id: 'psikotes-kecermatan',
    category: 'PSIKOTES',
    subtest: 'KECERMATAN',
    title: 'Pretest CAT Psikotes — Subtes Kecermatan (Standar TES CAT)',
    subtitle: '500 Soal • 10 Kolom @ 50 Soal • Durasi 60 Detik / Kolom (Otomatis Pindah Kolom)',
    description:
      'Simulasi kecepatan dan ketelitian visual identik dengan TES CAT Polri sesungguhnya: 10 kolom, masing-masing 50 soal dengan batas waktu 60 detik per kolom dan perpindahan kolom otomatis.',
    badge: '500 Soal • 10 Kolom × 60 Detik',
    durationSeconds: 10 * 60,
    isKecermatanOnly: true,
    columnDurationSeconds: 60,
    poolSize: POOL_KECERMATAN.length,
    questions: POOL_KECERMATAN.slice(0, 500),
  },
  {
    id: 'tkk',
    category: 'TKK',
    title: 'Pretest CAT — Tes Kemampuan Komputer (TKK)',
    subtitle: `100 Soal Acak (Bank ${POOL_TKK.length} Soal) • Studi Kasus TI, Perangkat Lunak, Jaringan & Siber`,
    description:
      `Menyajikan 100 soal yang diacak otomatis dari total ${POOL_TKK.length} bank soal TKK murni berbasis skenario operasional teknologi informasi dan siber di lingkungan kepolisian.`,
    badge: `100 Soal • Bank ${POOL_TKK.length} Soal`,
    durationSeconds: 60 * 60,
    poolSize: POOL_TKK.length,
    questions: POOL_TKK.slice(0, 100),
  },
  {
    id: 'tpk',
    category: 'TPK',
    title: 'Pretest CAT — Tes Pengetahuan Kepolisian (TPK)',
    subtitle: `100 Soal Acak (Bank ${POOL_TPK.length} Soal) • UU Kepolisian, KUHP, KUHAP, Kode Etik & HAM`,
    description:
      `Menyajikan 100 soal yang diacak otomatis dari total ${POOL_TPK.length} bank soal TPK berbasis narasi studi kasus hukum kepolisian, wewenang diskresi, dan peraturan perundang-undangan.`,
    badge: `100 Soal • Bank ${POOL_TPK.length} Soal`,
    durationSeconds: 60 * 60,
    poolSize: POOL_TPK.length,
    questions: POOL_TPK.slice(0, 100),
  },
  {
    id: 'cat-all',
    category: 'ALL',
    subtest: 'ALL',
    title: 'Pretest Komprehensif CAT Polri (Seluruh Modul Lulus SIP)',
    subtitle: `Total 900 Soal Aktif dari ${SIMULATION_POOL_STATS.TOTAL} Bank Soal: Kecerdasan, Kepribadian, Kecermatan, TKK & TPK`,
    description:
      `Simulasi gabungan seluruh subtes seleksi CAT Polri yang diacak ketat per kategori subtes dari total ${SIMULATION_POOL_STATS.TOTAL} bank soal terpusat.`,
    badge: `900 Soal Aktif • Bank ${SIMULATION_POOL_STATS.TOTAL} Soal`,
    durationSeconds: (90 + 60 + 10 + 60 + 60) * 60,
    columnDurationSeconds: 60,
    poolSize: SIMULATION_POOL_STATS.TOTAL,
    questions: [
      ...POOL_KECERDASAN.slice(0, 100),
      ...POOL_KEPRIBADIAN.slice(0, 100),
      ...POOL_KECERMATAN.slice(0, 500),
      ...POOL_TKK.slice(0, 100),
      ...POOL_TPK.slice(0, 100),
    ],
  },
];
