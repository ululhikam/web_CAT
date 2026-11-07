/**
 * Dinamis Bank Soal & Konfigurasi Paket Pretest CAT Polri (Seleksi SIP / Akpol / Bintara)
 *
 * Seluruh butir soal bersumber langsung dari Seed Bank Soal Utama (`apps/api/prisma/seed/questions/*`)
 * tanpa hardcode statis di komponen UI:
 * - Pool Kecerdasan   : 439 soal (Verbal, Praktis/Numerik/Denah, Logis & Figural Hitam-Putih) -> disajikan 100 soal proporsional per sesi
 * - Pool Kepribadian  : 240 soal studi kasus kedinasan -> disajikan 100 soal acak per sesi
 * - Pool Kecermatan   : 500 soal (10 Kolom @ 50 Soal: 3 Huruf, 3 Angka, 3 Simbol, 1 Campuran) -> diacak per kolom setiap sesi
 * - Pool TKK          : 206 soal narasi teknis komputer -> disajikan 100 soal acak per sesi
 * - Pool TPK          : 200 soal narasi regulasi & hukum kepolisian -> disajikan 100 soal acak per sesi
 *
 * Pengacakan (randomization) dilakukan secara ketat per subtes (strictly isolated per subtest)
 * sehingga tidak mungkin ada soal lintas kategori yang nyasar ke subtes lain.
 */

import { renderFigure, STEM_VARIANT, type FigureSpec } from '../../../../../api/prisma/seed/media/figural';
import { buildChoices } from '../../../../../api/prisma/seed/questions/builder';
import { DENAH_LOKASI_QUESTIONS } from '../../../../../api/prisma/seed/questions/denah';
import {
  countDistractors,
  directionDistractors,
  FIGURAL_KECERDASAN,
  figuralTextAnswer,
  layoutFor,
} from '../../../../../api/prisma/seed/questions/figural';
import { KECERDASAN_QUESTIONS } from '../../../../../api/prisma/seed/questions/kecerdasan';
import { KECERMATAN_QUESTIONS } from '../../../../../api/prisma/seed/questions/kecermatan';
import { KEPRIBADIAN_QUESTIONS } from '../../../../../api/prisma/seed/questions/kepribadian';
import { buildOptions, createRng } from '../../../../../api/prisma/seed/questions/rng';
import { TKK_QUESTIONS } from '../../../../../api/prisma/seed/questions/tkk';
import { TPK_QUESTIONS } from '../../../../../api/prisma/seed/questions/tpk';

export interface SimOption {
  key: string;
  text: string;
  image?: string;
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
  kecerdasanGroup?: 'VERBAL' | 'PRAKTIS' | 'LOGIS';
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

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const KECERDASAN_SUBCATEGORY_LABEL: Record<string, string> = {
  verbal: 'Verbal (Sinonim, Antonim, Analogi & Pengelompokan Kata)',
  numerik: 'Praktis / Numerik / Aritmatika Dasar',
  logis: 'Logis (Penarikan Kesimpulan & Silogisme)',
  figural: 'Logis (Penalaran Gambar & Pola Bentuk Hitam-Putih)',
  petadenah: 'Praktis / Numerik (Analisis Peta & Denah)',
  kepribadian: 'Logis (Analisis Situasional & Kesimpulan)',
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

const POOL_FIGURAL_KECERDASAN: SimQuestion[] = FIGURAL_KECERDASAN.map((row, idx): SimQuestion => {
  const spec: FigureSpec = { family: row.family, seed: row.seed };
  const stemImage = svgToDataUrl(renderFigure(spec, STEM_VARIANT));

  if (row.type === 'IMAGE_CHOICE') {
    const { variantByLabel, correctIndex } = layoutFor(row);
    const labels4 = ['A', 'B', 'C', 'D'] as const;
    return {
      id: 1700 + idx + 1,
      module: 'Tes Psikologi — Kecerdasan (Penalaran Gambar Hitam-Putih)',
      subtest: 'KECERDASAN',
      subCategory: 'Logis (Penalaran Gambar & Pola Bentuk Hitam-Putih)',
      kecerdasanGroup: 'LOGIS',
      difficulty: row.difficulty,
      stem: row.stem,
      image: stemImage,
      options: variantByLabel.map((variant, optIdx) => ({
        key: labels4[optIdx]!,
        text: `Pilihan Gambar ${labels4[optIdx]!}`,
        image: svgToDataUrl(renderFigure(spec, variant)),
      })),
      correctKey: labels4[correctIndex]!,
      explanation: row.explanation,
      weight: 1,
    };
  }

  const answer = figuralTextAnswer(row);
  const distractors =
    row.family === 'count'
      ? countDistractors(Number(answer))
      : directionDistractors(answer as Parameters<typeof directionDistractors>[0]);
  const built = buildOptions(createRng(`figural-text:${row.code}`), answer, distractors);
  const correctOpt = built.options.find((o) => o.isCorrect) ?? built.options[0]!;

  return {
    id: 1700 + idx + 1,
    module: 'Tes Psikologi — Kecerdasan (Penalaran Gambar Hitam-Putih)',
    subtest: 'KECERDASAN',
    subCategory: 'Logis (Penalaran Gambar & Pola Bentuk Hitam-Putih)',
    kecerdasanGroup: 'LOGIS',
    difficulty: row.difficulty,
    stem: row.stem,
    image: stemImage,
    options: built.options.map((o) => ({
      key: o.label,
      text: o.contentText ?? o.label,
    })),
    correctKey: correctOpt.label,
    explanation: row.explanation,
    weight: 1,
  };
});

const POOL_KECERDASAN: SimQuestion[] = [
  ...KECERDASAN_QUESTIONS.map((row, idx): SimQuestion => {
    const leaf = row.categoryPath.split('/').pop() ?? 'logis';
    const kecerdasanGroup: 'VERBAL' | 'PRAKTIS' | 'LOGIS' =
      leaf === 'verbal'
        ? 'VERBAL'
        : leaf === 'numerik' || leaf === 'petadenah'
          ? 'PRAKTIS'
          : 'LOGIS';
    return {
      id: 1000 + idx + 1,
      module: 'Tes Psikologi — Kecerdasan (SIP Polri)',
      subtest: 'KECERDASAN',
      subCategory: KECERDASAN_SUBCATEGORY_LABEL[leaf] ?? 'Logis (Penarikan Kesimpulan)',
      kecerdasanGroup,
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
    subCategory: 'Praktis / Numerik (Analisis Peta & Denah)',
    kecerdasanGroup: 'PRAKTIS',
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
  ...POOL_FIGURAL_KECERDASAN,
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

function kecermatanColumnTypeLabel(colNumber: number): string {
  if (colNumber <= 3) return 'Huruf';
  if (colNumber <= 6) return 'Angka';
  if (colNumber <= 9) return 'Simbol';
  return 'Campuran (Angka, Simbol & Huruf)';
}

const POOL_KECERMATAN: SimQuestion[] = KECERMATAN_QUESTIONS.map((row, idx): SimQuestion => {
  const colNumber = (row.columnIndex ?? Math.floor(idx / 50)) + 1;
  const colType = kecermatanColumnTypeLabel(colNumber);
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
    module: `Tes Psikologi — Kecermatan (Kolom ${colNumber} • ${colType})`,
    subtest: 'KECERMATAN',
    subCategory: `Kolom ${colNumber} (${colType})`,
    difficulty: row.difficulty,
    stem: row.stem,
    options: benchmark.map((b) => ({
      key: b.label,
      text: b.label,
    })),
    correctKey,
    explanation: `Pada Kolom ${colNumber} (${colType}), patokan adalah [${leftChars.join(' ')}] (A–E) dan soal menampilkan [${rightChars.join(' ')}]. Karakter yang hilang adalah "${row.answer}" yang berada pada label ${correctKey}.`,
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
    const isThisCorrect = opt.image ? opt.image === correctOpt.image : opt.text === correctOpt.text;
    if (isThisCorrect) {
      newCorrectKey = key;
    }
    return {
      ...opt,
      key,
      text: opt.image ? `Pilihan Gambar ${key}` : opt.text,
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
 * Untuk KECERDASAN, pembagian proporsional sesuai ketentuan:
 *   - 30% Verbal (Sinonim, Antonim, Analogi Kata, Pengelompokan Kata)
 *   - 35% Praktis / Numerik / Aritmatika Dasar (Deret, Hitung Cepat, Persentase, Jarak-Kecepatan-Waktu, Soal Cerita, Analisis Peta/Denah)
 *   - 35% Logis (Penarikan Kesimpulan / Silogisme + Penalaran Gambar / Pola Gambar Hitam-Putih)
 */
export function sampleSubtestQuestions(
  subtest: 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN' | 'TKK' | 'TPK',
  count: number,
): SimQuestion[] {
  if (subtest === 'KECERMATAN') {
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

  if (subtest === 'KECERDASAN') {
    const verbalQuota = Math.round(count * 0.3); // 30 soal
    const praktisQuota = Math.round(count * 0.35); // 35 soal
    const logisQuota = Math.max(0, count - verbalQuota - praktisQuota); // 35 soal (15 silogisme + 20 figural hitam-putih)
    const figuralQuota = Math.min(20, Math.round(logisQuota * 0.57));
    const verbalLogisQuota = Math.max(0, logisQuota - figuralQuota);

    const verbalPool = shuffleArray(
      POOL_KECERDASAN.filter((q) => q.subtest === 'KECERDASAN' && q.kecerdasanGroup === 'VERBAL'),
    );
    const praktisPool = shuffleArray(
      POOL_KECERDASAN.filter((q) => q.subtest === 'KECERDASAN' && q.kecerdasanGroup === 'PRAKTIS'),
    );
    const figuralPool = shuffleArray(
      POOL_KECERDASAN.filter(
        (q) => q.subtest === 'KECERDASAN' && q.kecerdasanGroup === 'LOGIS' && Boolean(q.image),
      ),
    );
    const silogismePool = shuffleArray(
      POOL_KECERDASAN.filter(
        (q) => q.subtest === 'KECERDASAN' && q.kecerdasanGroup === 'LOGIS' && !q.image,
      ),
    );

    const combined = shuffleArray([
      ...verbalPool.slice(0, verbalQuota),
      ...praktisPool.slice(0, praktisQuota),
      ...silogismePool.slice(0, verbalLogisQuota),
      ...figuralPool.slice(0, figuralQuota),
    ]);

    return combined.slice(0, count).map((q) => shuffleSingleChoiceOptions(q));
  }

  const sourcePool =
    subtest === 'KEPRIBADIAN'
      ? POOL_KEPRIBADIAN
      : subtest === 'TKK'
        ? POOL_TKK
        : POOL_TPK;

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
    subtitle: `Kecerdasan (100 Soal, 60m), Kepribadian (100 Soal, 45m) & Kecermatan (500 Soal / 10 Kolom, 10m)`,
    description:
      'Latihan komprehensif 3 pilar psikotes standar CAT Polri (total waktu acuan 115 menit di luar jeda): Kecerdasan (Verbal, Praktis/Numerik, Logis & Gambar Hitam-Putih), Mental Kepribadian (Opsi A–E), dan Kecermatan 10 Kolom (3 Huruf, 3 Angka, 3 Simbol, 1 Campuran).',
    badge: `700 Soal Aktif • Bank ${POOL_KECERDASAN.length + POOL_KEPRIBADIAN.length + POOL_KECERMATAN.length} Soal`,
    durationSeconds: (60 + 45 + 10) * 60,
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
    subtitle: `100 Soal Acak Proporsional (Bank ${POOL_KECERDASAN.length} Soal) • Verbal (30 Poin), Praktis/Numerik (35 Poin) & Logis/Figural (35 Poin)`,
    description:
      `Menyajikan 100 soal (total 100 poin) yang diacak proporsional dari ${POOL_KECERDASAN.length} bank soal Kecerdasan: Verbal (30 poin), Praktis / Numerik / Aritmatika Dasar & Peta Denah (35 poin), serta Logis & Penalaran Gambar Hitam-Putih (35 poin).`,
    badge: `100 Soal (100 Poin) • Bank ${POOL_KECERDASAN.length} Soal`,
    durationSeconds: 60 * 60,
    poolSize: POOL_KECERDASAN.length,
    questions: POOL_KECERDASAN.slice(0, 100),
  },
  {
    id: 'psikotes-kepribadian',
    category: 'PSIKOTES',
    subtest: 'KEPRIBADIAN',
    title: 'Pretest CAT Psikotes — Subtes Mental Kepribadian',
    subtitle: `100 Soal Acak (Bank ${POOL_KEPRIBADIAN.length} Soal) • Studi Kasus Dilema Kedinasan Polri (Opsi A–E)`,
    description:
      `Menyajikan 100 soal yang diacak otomatis dari total ${POOL_KEPRIBADIAN.length} bank soal Mental Kepribadian berbasis narasi dilema integritas, disiplin, kepemimpinan, dan pelayanan publik Polri dengan opsi huruf A sampai E.`,
    badge: `100 Soal • Bank ${POOL_KEPRIBADIAN.length} Soal`,
    durationSeconds: 45 * 60,
    poolSize: POOL_KEPRIBADIAN.length,
    questions: POOL_KEPRIBADIAN.slice(0, 100),
  },
  {
    id: 'psikotes-kecermatan',
    category: 'PSIKOTES',
    subtest: 'KECERMATAN',
    title: 'Pretest CAT Psikotes — Subtes Kecermatan (Standar TES CAT)',
    subtitle: '500 Soal • 10 Kolom (3 Huruf, 3 Angka, 3 Simbol, 1 Campuran) • 60 Detik / Kolom',
    description:
      'Simulasi kecepatan dan ketelitian visual identik dengan TES CAT Polri (durasi 10 menit): Kolom 1–3 Huruf, Kolom 4–6 Angka, Kolom 7–9 Simbol, dan Kolom 10 Campuran Angka, Simbol & Huruf.',
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
    durationSeconds: (60 + 45 + 10 + 60 + 60) * 60,
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
