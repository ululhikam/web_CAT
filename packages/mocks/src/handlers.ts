/**
 * MSW handlers untuk mode "dev tanpa backend".
 *
 * Aktifkan di apps/web lewat `PUBLIC_MOCK_API=true`. Semua respons memakai
 * envelope yang sama dengan API asli supaya kode klien tidak bercabang.
 */
import { HttpResponse, http } from 'msw';
import type { Plan } from '@webcat/contracts';
import { buildFixturesBySubtest, toClientQuestion } from './fixtures';

const API = '/api/v1';

function ok<T>(data: T, meta: Record<string, unknown> = {}) {
  return HttpResponse.json({
    success: true,
    data,
    meta: { requestId: 'mock', timestamp: new Date().toISOString(), ...meta },
    error: null,
    requestId: 'mock',
  });
}

function fail(status: number, code: string, message: string) {
  return HttpResponse.json(
    {
      success: false,
      data: null,
      meta: { requestId: 'mock', timestamp: new Date().toISOString() },
      error: { code, message },
      requestId: 'mock',
    },
    { status },
  );
}

export const MOCK_PLANS: Plan[] = [
  {
    id: 'mock-trial',
    code: 'TRIAL_3D',
    name: 'Coba 3 Hari',
    tagline: 'Kenali alur ujian tanpa komitmen',
    priceIdr: 0,
    compareAtPriceIdr: null,
    durationDays: 3,
    pricePerDayIdr: 0,
    features: [
      { label: '1 sesi TES CAT penuh (3 tes)', included: true },
      { label: 'Pembahasan jawaban', included: false },
      { label: 'Analisis hasil per subtes', included: false },
    ],
    isPublic: true,
    sortOrder: 0,
    badge: 'GRATIS',
    isPopular: false,
  },
  {
    id: 'mock-weekly',
    code: 'WEEKLY',
    name: 'Mingguan',
    tagline: 'Latihan intensif tujuh hari',
    priceIdr: 49000,
    compareAtPriceIdr: null,
    durationDays: 7,
    pricePerDayIdr: 7000,
    features: [
      { label: 'Sesi TES CAT tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
    ],
    isPublic: true,
    sortOrder: 10,
    badge: null,
    isPopular: false,
  },
  {
    id: 'mock-monthly',
    code: 'MONTHLY',
    name: 'Bulanan',
    tagline: 'Pilihan paling banyak diambil',
    priceIdr: 149000,
    compareAtPriceIdr: 196000,
    durationDays: 30,
    pricePerDayIdr: 4967,
    features: [
      { label: 'Sesi TES CAT tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: true },
    ],
    isPublic: true,
    sortOrder: 30,
    badge: 'PALING POPULER',
    isPopular: true,
  },
  {
    id: 'mock-quarterly',
    code: 'QUARTERLY',
    name: 'Tiga Bulan',
    tagline: 'Untuk persiapan seleksi penuh',
    priceIdr: 399000,
    compareAtPriceIdr: 447000,
    durationDays: 90,
    pricePerDayIdr: 4433,
    features: [
      { label: 'Sesi TES CAT tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: true },
    ],
    isPublic: true,
    sortOrder: 40,
    badge: 'HEMAT 33%',
    isPopular: false,
  },
];

const FIXTURES = buildFixturesBySubtest();

export const handlers = [
  http.get(`${API}/health/live`, () => ok({ status: 'ok', uptime: 0, version: 'mock' })),

  http.get(`${API}/plans`, () => ok(MOCK_PLANS)),

  http.get(`${API}/plans/:code`, ({ params }) => {
    const plan = MOCK_PLANS.find((item) => item.code === params.code);
    if (!plan) return fail(404, 'BILLING_PLAN_NOT_FOUND', 'Paket tidak ditemukan');
    return ok(plan);
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return fail(422, 'COMMON_VALIDATION_FAILED', 'Email dan password wajib diisi');
    }
    return ok({
      accessToken: 'mock-access-token',
      user: {
        id: 'mock-user',
        email: body.email,
        fullName: 'Peserta Demo',
        phone: null,
        role: body.email.startsWith('admin') ? 'ADMIN' : 'USER',
        permissions: body.email.startsWith('admin') ? ['users.read'] : ['exam.take'],
        emailVerified: true,
        mustChangePassword: false,
        status: 'ACTIVE',
      },
    });
  }),

  http.post(`${API}/auth/logout`, () => ok({ message: 'Berhasil keluar' })),

  http.get(`${API}/me/subscription`, () =>
    ok({
      id: 'mock-sub',
      userId: 'mock-user',
      planCode: 'MONTHLY',
      status: 'ACTIVE',
      source: 'MANUAL_GRANT',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      remainingDays: 30,
      grantedBy: null,
      grantNote: 'Akun demo',
    }),
  ),

  http.get(`${API}/admin/users`, () =>
    ok(
      [
        {
          id: 'mock-user-1',
          email: 'peserta1@example.com',
          fullName: 'Peserta Satu',
          role: 'USER',
          status: 'ACTIVE',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          createdBy: null,
          subscription: {
            status: 'ACTIVE',
            endsAt: new Date(Date.now() + 12 * 86_400_000).toISOString(),
            remainingDays: 12,
            source: 'MANUAL_GRANT',
          },
        },
        {
          id: 'mock-user-2',
          email: 'peserta2@example.com',
          fullName: 'Peserta Dua',
          role: 'USER',
          status: 'PENDING_INVITE',
          emailVerified: false,
          createdAt: new Date().toISOString(),
          createdBy: 'mock-user',
          subscription: null,
        },
      ],
      { nextCursor: null, hasMore: false, total: 2 },
    ),
  ),

  http.get(`${API}/exam/subtests/:code/questions`, ({ params }) => {
    const code = String(params.code) as keyof typeof FIXTURES;
    const questions = FIXTURES[code];
    if (!questions) return fail(404, 'EXAM_SUBTEST_NOT_FOUND', 'Subtes tidak ditemukan');
    return ok(questions.slice(0, 20).map(toClientQuestion));
  }),
];
