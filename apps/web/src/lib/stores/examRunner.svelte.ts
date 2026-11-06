import type {
  ActiveSessionResponse,
  AnswerPayload,
  AutosaveResponse,
  ClockState,
  ExamQuestion,
  ExamQuestionPage,
  HeartbeatResponse,
  LockReason,
  ProctoringBatchResponse,
  ProctoringEventType,
  SessionStatus,
  SessionSubtestSummary,
  StageCode,
  ViolationAction,
} from '@webcat/contracts';
import { LOCK_REASONS } from '@webcat/contracts';
import { ApiError, apiErrorMessage, apiRequest } from '$lib/api/client';
import { createAnswerChurnTracker } from '$lib/exams/answer-churn';
import { session } from '$lib/stores/session.svelte';
import {
  assignClientSeq,
  clearSubtest,
  enqueueAnswer,
  listAnswers,
  nextClientSeq,
  removeAnswers,
  type QueuedAnswer,
} from '$lib/offline/answer-queue';
import {
  buildKeepaliveBatch,
  mergePendingAnswers,
  type PendingAnswer,
} from '$lib/offline/answer-sync';

/**
 * ============================================================================
 * Store mesin ujian (peserta)
 * ----------------------------------------------------------------------------
 * Semua keputusan waktu, kunci, dan penilaian tetap di server. Store hanya:
 *  - menyimpan state respons terakhir (sesi, soal, jawaban, jam),
 *  - menulis jawaban ke IndexedDB sebelum dikirim (anti kehilangan data),
 *  - mengirim batch autosave/heartbeat/proctoring secara idempoten,
 *  - menerjemahkan 409 server menjadi layar "Subtes Terkunci" tanpa menunggu
 *    cron.
 * ============================================================================
 */

const MAX_BATCH = 50;
const FLUSH_DELAY_MS = 1_500;
const HEARTBEAT_MS = 15_000;
const EVENT_DELAY_MS = 4_000;
const MAX_EVENT_BUFFER = 200;
const MAX_RETRIES = 5;
const TICK_MS = 250;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function lockReasonOf(error: unknown): LockReason | null {
  const value = asRecord(error instanceof ApiError ? error.details : null).lockReason;
  return LOCK_REASONS.includes(value as LockReason) ? (value as LockReason) : null;
}

function clockOf(error: unknown): ClockState | null {
  const clock = asRecord(error instanceof ApiError ? error.details : null).clock;
  if (!clock || typeof clock !== 'object') return null;
  const record = asRecord(clock);
  return typeof record.serverTime === 'string'
    ? (record as unknown as ClockState)
    : null;
}

function isTerminalSession(status: SessionStatus | null | undefined): boolean {
  return (
    status === 'COMPLETED' ||
    status === 'ELIMINATED' ||
    status === 'EXPIRED' ||
    status === 'ABANDONED' ||
    status === 'VOIDED'
  );
}

export class ExamRunnerStore {
  /* ------------------------------------------------------------------ state */
  active = $state<ActiveSessionResponse | null>(null);
  questions = $state<ExamQuestion[]>([]);
  answers = $state<Record<string, AnswerPayload>>({});
  clock = $state<ClockState | null>(null);
  nowMs = $state(Date.now());
  serverOffsetMs = $state(0);

  loading = $state(false);
  loadingQuestions = $state(false);
  saving = $state(false);
  finishing = $state(false);
  error = $state<string | null>(null);
  notice = $state<string | null>(null);
  warning = $state<string | null>(null);
  lockedReason = $state<LockReason | null>(null);
  connected = $state(true);
  pendingCount = $state(0);
  lastSavedAt = $state<number | null>(null);
  /** Jumlah jawaban yang dipulihkan dari IndexedDB saat halaman dimuat. */
  restoredCount = $state(0);
  actionTaken = $state<ViolationAction | null>(null);

  /* --------------------------------------------------------------- internal */
  currentSubtestId: string | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private eventTimer: ReturnType<typeof setInterval> | null = null;
  private eventBuffer: Array<{
    clientEventId: string;
    type: ProctoringEventType;
    metadata?: Record<string, unknown>;
  }> = [];
  private eventSeq = 0;
  private flushing = false;
  private flushAgain = false;
  private retryCount = 0;
  private expiryHandled = false;
  private queueWrite: Promise<void> = Promise.resolve();
  /**
   * Cermin antrean IndexedDB di memori. Dipakai `keepaliveFlush()` saat tab
   * ditutup, ketika operasi async IndexedDB tidak lagi bisa diandalkan.
   */
  private pendingMirror = new Map<string, PendingAnswer>();
  private clientSeqHighWater = 0;
  /**
   * F5-13: riwayat waktu perubahan jawaban per soal. Dipakai untuk mendeteksi
   * "> 5 perubahan dalam 2 detik" — antrean offline menggabungkan perubahan
   * pada satu soal, jadi polanya hanya terlihat di browser.
   */
  private churn = createAnswerChurnTracker();
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;

  /* ------------------------------------------------------------------ getters */

  get sessionId(): string | null {
    return this.active?.session?.id ?? null;
  }

  get sessionStatus(): SessionStatus | null {
    return this.active?.session?.status ?? null;
  }

  get currentSubtest(): SessionSubtestSummary | null {
    return this.active?.currentSubtest ?? null;
  }

  get nextSubtest(): SessionSubtestSummary | null {
    return this.active?.nextSubtest ?? null;
  }

  get currentStageId(): string | null {
    const subtest = this.currentSubtest;
    const stages = this.active?.session?.stages ?? [];
    if (!subtest) return null;
    return (
      stages.find((stage) => stage.subtests.some((entry) => entry.id === subtest.id))?.id ?? null
    );
  }

  /** Timer efektif memakai jam server, bukan jam perangkat peserta. */
  get remainingMs(): number | null {
    const endsAt = this.clock?.endsAt;
    if (!endsAt) return null;
    const end = Date.parse(endsAt);
    if (!Number.isFinite(end)) return null;
    return Math.max(0, end - (this.nowMs + this.serverOffsetMs));
  }

  get remainingLabel(): string {
    const remaining = this.remainingMs;
    if (remaining === null) return '--:--';
    const totalSeconds = Math.ceil(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value: number) => String(value).padStart(2, '0');
    return hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
  }

  get isExpired(): boolean {
    return this.lockedReason === 'TIME_EXPIRED' || this.remainingMs === 0;
  }

  get isLocked(): boolean {
    return this.lockedReason !== null || this.currentSubtest?.status !== 'ACTIVE';
  }

  get isTerminal(): boolean {
    return isTerminalSession(this.sessionStatus);
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get totalQuestions(): number {
    return this.questions.length || this.currentSubtest?.questionCount || 0;
  }

  answerOf(questionId: string): AnswerPayload | null {
    return this.answers[questionId] ?? null;
  }

  /* ------------------------------------------------------------------ muat sesi */

  async loadActive(): Promise<ActiveSessionResponse> {
    return this.withLoading(async () => {
      const result = await apiRequest<ActiveSessionResponse>('/exams/sessions/active', {
        token: session.accessToken,
      });
      this.applyActive(result);
      return result;
    });
  }

  async loadSession(sessionId: string): Promise<ActiveSessionResponse> {
    return this.withLoading(async () => {
      const result = await apiRequest<ActiveSessionResponse>(`/exams/sessions/${sessionId}`, {
        token: session.accessToken,
      });
      this.applyActive(result);
      return result;
    });
  }

  async startSession(stageCode?: StageCode): Promise<ActiveSessionResponse> {
    return this.withLoading(async () => {
      const result = await apiRequest<ActiveSessionResponse>('/exams/sessions', {
        method: 'POST',
        body: { acknowledgeRules: true, ...(stageCode ? { stageCode } : {}) },
        token: session.accessToken,
      });
      this.applyActive(result);
      return result;
    });
  }

  /** Membuka subtes saat ini (timer mulai penuh sesuai kebijakan server). */
  async openCurrentSubtest(): Promise<ActiveSessionResponse | null> {
    const subtest = this.currentSubtest;
    const stageId = this.currentStageId;
    const sessionId = this.sessionId;
    if (!subtest || !stageId || !sessionId) return null;

    return this.withLoading(async () => {
      const result = await apiRequest<ActiveSessionResponse>(
        `/exams/sessions/${sessionId}/stages/${stageId}/subtests/${subtest.id}/open`,
        { method: 'POST', token: session.accessToken },
      );
      this.applyActive(result);
      await this.loadQuestions();
      return result;
    });
  }

  /* ------------------------------------------------------------------ soal */

  async loadQuestions(): Promise<void> {
    const subtest = this.currentSubtest;
    const sessionId = this.sessionId;
    if (!subtest || !sessionId) return;

    this.loadingQuestions = true;
    try {
      const items: ExamQuestion[] = [];
      let cursor: number | null = 0;
      let guard = 0;

      while (cursor !== null && guard < 100) {
        const query: string =
          cursor > 0 ? `?limit=${MAX_BATCH}&cursor=${cursor}` : `?limit=${MAX_BATCH}`;
        const page: ExamQuestionPage = await apiRequest<ExamQuestionPage>(
          `/exams/sessions/${sessionId}/subtests/${subtest.id}/questions${query}`,
          { token: session.accessToken },
        );
        items.push(...page.items);
        this.syncClock(page.clock);
        cursor = page.nextCursor === null ? null : Number(page.nextCursor);
        guard += 1;
      }

      const seeded: Record<string, AnswerPayload> = {};
      for (const question of items) {
        if (question.answer) seeded[question.id] = question.answer;
      }

      // F5-10: pulihkan jawaban yang belum ter-ACK. Server bisa saja sudah
      // punya jawaban lebih lama, tetapi antrean lokal berisi perubahan yang
      // belum sempat terkirim — jadi antrean menang.
      const queued = await listAnswers(subtest.id);
      const restored = mergePendingAnswers(seeded, queued, this.answers);

      this.questions = items;
      this.answers = restored;
      // Cermin dikunci per soal (bukan per baris) karena satu soal bisa punya
      // beberapa baris antrean bila dijawab berulang kali saat offline.
      this.pendingMirror = new Map(
        queued.map((entry) => [
          entry.questionId,
          {
            questionId: entry.questionId,
            payload: entry.payload,
            timeSpentMs: entry.timeSpentMs,
            clientSeq: entry.clientSeq,
          },
        ]),
      );
      this.restoredCount = this.pendingMirror.size;
      this.pendingCount = this.pendingMirror.size;
      this.clientSeqHighWater = queued.reduce(
        (max, entry) => Math.max(max, entry.clientSeq),
        this.clientSeqHighWater,
      );
      if (queued.length > 0) this.scheduleFlush(0);
    } catch (cause) {
      this.handleError(cause);
      this.questions = [];
    } finally {
      this.loadingQuestions = false;
    }
  }

  /* ------------------------------------------------------------------ jawaban */

  /**
   * Menyimpan jawaban lokal + antrean IndexedDB. Tidak menunggu jaringan;
   * pemanggil boleh langsung berpindah soal.
   */
  recordAnswer(questionId: string, payload: AnswerPayload, timeSpentMs = 0): void {
    const subtest = this.currentSubtest;
    if (!subtest || this.lockedReason) return;

    const elapsed = Math.max(0, Math.min(86_400_000, Math.round(timeSpentMs)));

    // F5-13: jawaban PERTAMA untuk soal ini bukan "perubahan". Cek state
    // sebelum baris berikut menimpa jawaban lama.
    if (this.answers[questionId] !== undefined) {
      this.trackAnswerChange(questionId);
    }

    this.answers = { ...this.answers, [questionId]: payload };
    this.pendingMirror.set(questionId, {
      questionId,
      payload,
      timeSpentMs: elapsed,
      clientSeq: 0,
    });

    this.queueWrite = this.queueWrite.then(async () => {
      try {
        await enqueueAnswer({
          subtestId: subtest.id,
          questionId,
          payload,
          timeSpentMs: elapsed,
        });
        this.pendingCount = this.pendingMirror.size;
        this.scheduleFlush();
      } catch (cause) {
        this.handleError(cause);
      }
    });
  }

  /**
   * Menghapus jawaban lokal + antrean IndexedDB (mengirim payload { cleared: true }).
   */
  clearAnswer(questionId: string, timeSpentMs = 0): void {
    const subtest = this.currentSubtest;
    if (!subtest || this.lockedReason) return;
    if (this.answers[questionId] === undefined) return;

    const elapsed = Math.max(0, Math.min(86_400_000, Math.round(timeSpentMs)));
    this.trackAnswerChange(questionId);

    const next = { ...this.answers };
    delete next[questionId];
    this.answers = next;

    const payload: AnswerPayload = { cleared: true };
    this.pendingMirror.set(questionId, {
      questionId,
      payload,
      timeSpentMs: elapsed,
      clientSeq: 0,
    });

    this.queueWrite = this.queueWrite.then(async () => {
      try {
        await enqueueAnswer({
          subtestId: subtest.id,
          questionId,
          payload,
          timeSpentMs: elapsed,
        });
        this.pendingCount = this.pendingMirror.size;
        this.scheduleFlush();
      } catch (cause) {
        this.handleError(cause);
      }
    });
  }

  scheduleFlush(delay = FLUSH_DELAY_MS): void {
    if (this.flushTimer !== null) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, delay);
  }

  /**
   * Mengirim antrean secara berurutan. Batch lama yang gagal dikirim ulang
   * dengan `clientSeq` yang sama (idempoten), batch baru selalu mendapat
   * `clientSeq` baru agar jawaban terbaru tidak dianggap duplikat.
   */
  async flush(): Promise<void> {
    if (this.flushing) {
      this.flushAgain = true;
      return;
    }

    this.flushing = true;
    try {
      await this.queueWrite;
      const subtest = this.currentSubtest;
      const sessionId = this.sessionId;
      if (!subtest || !sessionId || this.lockedReason) return;

      let rows = await listAnswers(subtest.id);
      let guard = 0;

      while (rows.length > 0 && guard < 200) {
        guard += 1;
        let clientSeq: number;
        let batch: QueuedAnswer[];

        if (rows[0]!.clientSeq > 0) {
          clientSeq = rows[0]!.clientSeq;
          batch = rows.filter((entry) => entry.clientSeq === clientSeq).slice(0, MAX_BATCH);
        } else {
          clientSeq = await nextClientSeq(subtest.id);
          this.clientSeqHighWater = Math.max(this.clientSeqHighWater, clientSeq);
          const unsent = rows.filter((entry) => entry.clientSeq === 0).slice(0, MAX_BATCH);
          await assignClientSeq(unsent, clientSeq);
          batch = unsent;
        }

        if (batch.length === 0) break;

        // Cermin memori ikut mendapat `clientSeq` agar keepalive saat tab
        // ditutup memakai nomor batch yang sama (idempoten), bukan nomor baru.
        for (const entry of batch) {
          const mirror = this.pendingMirror.get(entry.questionId);
          if (mirror) mirror.clientSeq = clientSeq;
        }

        this.saving = true;
        try {
          const response = await apiRequest<AutosaveResponse>(
            `/exams/sessions/${sessionId}/subtests/${subtest.id}/answers`,
            {
              method: 'PATCH',
              body: {
                clientSeq,
                answers: batch.map((entry) => ({
                  questionId: entry.questionId,
                  payload: entry.payload,
                  timeSpentMs: entry.timeSpentMs,
                })),
              },
              token: session.accessToken,
            },
          );

          this.syncClock(response.clock);
          this.connected = true;
          this.retryCount = 0;
          this.lastSavedAt = Date.now();
          if (response.rejected.length > 0) {
            this.notice = `${response.rejected.length} jawaban ditolak server dan tidak disimpan.`;
          }

          await removeAnswers(batch.map((entry) => entry.id));
          for (const entry of batch) {
            // Hanya hapus cermin bila isinya masih jawaban yang barusan
            // ter-ACK; perubahan baru saat request berjalan harus tetap
            // tercatat untuk keepalive berikutnya.
            const mirror = this.pendingMirror.get(entry.questionId);
            if (mirror && mirror.clientSeq === clientSeq) {
              this.pendingMirror.delete(entry.questionId);
            }
          }
          this.pendingCount = this.pendingMirror.size;
        } catch (cause) {
          this.handleError(cause);
          if (this.lockedReason) {
            await clearSubtest(subtest.id);
            this.pendingCount = 0;
            this.pendingMirror.clear();
            break;
          }

          this.connected = false;
          if (this.retryCount < MAX_RETRIES) {
            this.retryCount += 1;
            this.scheduleFlush(Math.min(8_000, 1_000 * 2 ** (this.retryCount - 1)));
          } else {
            this.error =
              'Koneksi terputus. Jawaban tetap tersimpan di perangkat dan akan dikirim saat koneksi pulih.';
          }
          break;
        } finally {
          this.saving = false;
        }

        rows = await listAnswers(subtest.id);
      }
    } finally {
      this.flushing = false;
      if (this.flushAgain) {
        this.flushAgain = false;
        void this.flush();
      }
    }
  }

  /**
   * Best-effort saat tab ditutup.
   *
   * `navigator.sendBeacon` tidak bisa mengirim header `Authorization`, jadi
   * dipakai `fetch(..., { keepalive: true })` yang tetap membawa Bearer token
   * dari memori. Batch diambil dari cermin antrean (`pendingMirror`) — operasi
   * IndexedDB async sudah tidak bisa diandalkan pada titik ini.
   */
  keepaliveFlush(): void {
    const subtest = this.currentSubtest;
    const sessionId = this.sessionId;
    if (!subtest || !sessionId) return;

    const nextSeq = this.clientSeqHighWater + 1;
    const batch = buildKeepaliveBatch(this.pendingMirror.values(), MAX_BATCH, nextSeq);
    if (!batch) return;
    // Batch yang memakai `clientSeq` baru (belum pernah dicoba) menaikkan
    // penanda tertinggi agar `flush()` berikutnya tidak memakai nomor sama.
    if (batch.clientSeq === nextSeq) this.clientSeqHighWater = nextSeq;

    const body = JSON.stringify({
      clientSeq: batch.clientSeq,
      answers: batch.answers.map((entry) => ({
        questionId: entry.questionId,
        payload: entry.payload,
        timeSpentMs: entry.timeSpentMs,
      })),
    });

    const url = `/api/v1/exams/sessions/${sessionId}/subtests/${subtest.id}/answers`;

    // `navigator.sendBeacon` sengaja TIDAK dipakai: ia tidak bisa membawa
    // header `Authorization`, sedangkan endpoint ini menuntut Bearer token
    // (tidak ada cookie akses). Beacon akan menerima 401 dan jawaban hilang
    // tanpa jejak. `fetch(..., { keepalive: true })` setara secara semantik
    // (dikirim saat unload) tetapi tetap mengirim header.
    void fetch(url, {
      method: 'PATCH',
      keepalive: true,
      credentials: 'include',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(session.accessToken ? { authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body,
    }).catch(() => undefined);
  }

  async finishSubtest(force = false): Promise<ActiveSessionResponse | null> {
    const subtest = this.currentSubtest;
    const sessionId = this.sessionId;
    if (!subtest || !sessionId) return null;

    this.finishing = true;
    this.error = null;
    try {
      await this.flush();
      if (this.pendingCount > 0 && !force) {
        this.error =
          'Masih ada jawaban yang belum terkirim. Periksa koneksi lalu coba lagi, atau selesaikan tanpa menunggu.';
        return null;
      }

      const result = await apiRequest<ActiveSessionResponse>(
        `/exams/sessions/${sessionId}/subtests/${subtest.id}/finish`,
        {
          method: 'POST',
          body: {},
          token: session.accessToken,
        },
      );

      await clearSubtest(subtest.id);
      this.pendingCount = 0;
      this.pendingMirror.clear();
      this.applyActive(result);
      this.questions = [];
      this.answers = {};
      this.churn.reset();
      return result;
    } catch (cause) {
      this.handleError(cause);
      return null;
    } finally {
      this.finishing = false;
    }
  }

  /* ------------------------------------------------------------------ jam & proctoring */

  async heartbeat(): Promise<void> {
    const sessionId = this.sessionId;
    if (!sessionId) return;

    try {
      const response = await apiRequest<HeartbeatResponse>(
        `/exams/sessions/${sessionId}/heartbeat`,
        {
          method: 'POST',
          body: { clientTime: new Date().toISOString() },
          token: session.accessToken,
        },
      );
      this.syncClock(response.clock);
      this.connected = true;
      if (response.warning) this.warning = response.warning.message;
      if (response.lockedReason) this.lockedReason = response.lockedReason;
      if (isTerminalSession(response.sessionStatus)) {
        await this.loadActive();
      }
    } catch (cause) {
      this.connected = false;
      const reason = lockReasonOf(cause);
      const clock = clockOf(cause);
      if (reason) this.lockedReason = reason;
      if (clock) this.syncClock(clock);
    }
  }

  pushEvent(type: ProctoringEventType, metadata?: Record<string, unknown>): void {
    const sessionId = this.sessionId;
    if (!sessionId) return;

    this.eventSeq += 1;
    this.eventBuffer.push({
      clientEventId: `${sessionId}:${this.eventSeq}:${Date.now()}`,
      type,
      metadata,
    });
    if (this.eventBuffer.length > MAX_EVENT_BUFFER) {
      this.eventBuffer = this.eventBuffer.slice(-MAX_EVENT_BUFFER);
    }
    if (this.eventBuffer.length >= 20) {
      void this.flushEvents();
    }
  }

  async flushEvents(): Promise<void> {
    const sessionId = this.sessionId;
    if (!sessionId || this.eventBuffer.length === 0) return;

    const events = this.eventBuffer.splice(0, MAX_BATCH);
    try {
      const response = await apiRequest<ProctoringBatchResponse>(
        `/exams/sessions/${sessionId}/events`,
        {
          method: 'POST',
          body: { events },
          token: session.accessToken,
        },
      );

      this.actionTaken = response.actionTaken;
      if (response.clock) this.syncClock(response.clock);
      if (response.warnings.length > 0) {
        this.warning = response.warnings[response.warnings.length - 1]!.message;
      }
      if (response.actionTaken === 'LOCK_SUBTEST') {
        this.lockedReason = 'VIOLATION';
      }
      if (response.actionTaken === 'ELIMINATE' || response.actionTaken === 'LOCK_ACCOUNT') {
        this.lockedReason = 'ELIMINATED';
      }
      if (
        isTerminalSession(response.sessionStatus) ||
        response.actionTaken === 'LOCK_SUBTEST' ||
        response.actionTaken === 'ELIMINATE' ||
        response.actionTaken === 'LOCK_ACCOUNT'
      ) {
        await this.loadActive();
      }
    } catch (cause) {
      // Simpan untuk percobaan berikutnya; jangan membanjiri peserta dengan error.
      this.eventBuffer = [...events, ...this.eventBuffer].slice(-MAX_EVENT_BUFFER);
      const reason = lockReasonOf(cause);
      if (reason) this.lockedReason = reason;
    }
  }

  /* ------------------------------------------------------------------ ticker */

  startTicker(): void {
    if (this.ticker !== null) return;
    this.nowMs = Date.now();

    // F5-10: begitu jaringan pulih, langsung kirim antrean tanpa menunggu
    // jadwal flush berikutnya. Tanpa ini, jawaban bisa tertahan sampai
    // retry berikutnya meski koneksi sudah kembali.
    if (typeof window !== 'undefined') {
      this.onlineHandler = () => {
        this.retryCount = 0;
        this.connected = true;
        this.error = null;
        void this.flush();
        void this.flushEvents();
      };
      window.addEventListener('online', this.onlineHandler);
      this.offlineHandler = () => {
        this.connected = false;
      };
      window.addEventListener('offline', this.offlineHandler);
    }

    this.ticker = setInterval(() => {
      this.nowMs = Date.now();
      if (
        !this.expiryHandled &&
        this.clock?.status === 'ACTIVE' &&
        this.remainingMs !== null &&
        this.remainingMs <= 0
      ) {
        this.expiryHandled = true;
        this.lockedReason = 'TIME_EXPIRED';
        this.pendingMirror.clear();
        void this.heartbeat();
      }
    }, TICK_MS);

    this.heartbeatTimer = setInterval(() => {
      void this.heartbeat();
    }, HEARTBEAT_MS);

    this.eventTimer = setInterval(() => {
      void this.flushEvents();
    }, EVENT_DELAY_MS);
  }

  stopTicker(): void {
    if (this.ticker !== null) clearInterval(this.ticker);
    if (this.heartbeatTimer !== null) clearInterval(this.heartbeatTimer);
    if (this.eventTimer !== null) clearInterval(this.eventTimer);
    if (this.flushTimer !== null) clearTimeout(this.flushTimer);
    if (this.onlineHandler && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
    }
    if (this.offlineHandler && typeof window !== 'undefined') {
      window.removeEventListener('offline', this.offlineHandler);
    }
    this.onlineHandler = null;
    this.offlineHandler = null;
    this.ticker = null;
    this.heartbeatTimer = null;
    this.eventTimer = null;
    this.flushTimer = null;
  }

  dispose(): void {
    this.stopTicker();
    void this.flushEvents();
    void this.flush();
  }

  /* ------------------------------------------------------------------ internal */

  /**
   * F5-13: catat satu perubahan jawaban dan kirim sinyal bila melewati ambang.
   *
   * Ambangnya milik `countChangesInWindow` di kontrak (lima perubahan per dua
   * detik). Sinyal dikirim SEKALI per ledakan lalu riwayat soal itu
   * dikosongkan, supaya perubahan keenam tidak memicu event pada setiap
   * perubahan berikutnya — ledakan baru dihitung dari nol.
   */
  private trackAnswerChange(questionId: string): void {
    const changes = this.churn.record(questionId, Date.now());
    if (changes <= 0) return;

    this.churn.reset(questionId);
    this.pushEvent('ANSWER_CHANGE_BURST', { questionId, changes });
  }

  private async withLoading<T>(operation: () => Promise<T>): Promise<T> {
    this.loading = true;
    this.error = null;
    try {
      return await operation();
    } catch (cause) {
      this.handleError(cause);
      throw cause;
    } finally {
      this.loading = false;
    }
  }

  private applyActive(result: ActiveSessionResponse): void {
    this.active = result;
    this.syncClock(result.clock);
    if (result.lockedReason) {
      this.lockedReason = result.lockedReason;
    } else if (result.session?.status === 'ELIMINATED') {
      this.lockedReason = 'ELIMINATED';
    } else if (result.currentSubtest?.status === 'EXPIRED') {
      this.lockedReason = 'TIME_EXPIRED';
    } else {
      // Sesi masih berjalan / subtes berikutnya READY: kunci lama tidak berlaku.
      this.lockedReason = null;
    }

    const nextId = result.currentSubtest?.id ?? null;
    if (nextId !== this.currentSubtestId) {
      this.currentSubtestId = nextId;
      this.questions = [];
      this.answers = {};
      this.pendingMirror.clear();
      this.pendingCount = 0;
      this.restoredCount = 0;
      this.expiryHandled = false;
      this.warning = null;
      this.actionTaken = null;
      // F5-13: riwayat perubahan soal milik subtes lama tidak boleh terbawa.
      this.churn.reset();
    }
  }

  private syncClock(clock: ClockState | null): void {
    this.clock = clock;
    if (!clock) return;

    const serverMs = Date.parse(clock.serverTime);
    if (Number.isFinite(serverMs)) {
      this.serverOffsetMs = serverMs - Date.now();
      this.nowMs = Date.now();
    }

    if (clock.status === 'EXPIRED') {
      this.lockedReason = 'TIME_EXPIRED';
    }
  }

  private handleError(cause: unknown, surface = true): void {
    const reason = lockReasonOf(cause);
    if (reason) this.lockedReason = reason;

    if (cause instanceof ApiError) {
      if (cause.code === 'EXAM_SESSION_ELIMINATED') this.lockedReason = 'ELIMINATED';
      if (cause.code === 'EXAM_SUBTEST_LOCKED' && !this.lockedReason) {
        this.lockedReason = 'TIME_EXPIRED';
      }
      const clock = clockOf(cause);
      if (clock) this.syncClock(clock);
    }

    if (surface) this.error = apiErrorMessage(cause);
  }
}

export const examRunner = new ExamRunnerStore();
