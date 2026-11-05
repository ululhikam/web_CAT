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
  ViolationAction,
} from '@webcat/contracts';
import { LOCK_REASONS } from '@webcat/contracts';
import { ApiError, apiErrorMessage, apiRequest } from '$lib/api/client';
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

interface RecentAnswer {
  questionId: string;
  payload: AnswerPayload;
  timeSpentMs: number;
}

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
  private recentAnswers = new Map<string, RecentAnswer>();
  private clientSeqHighWater = 0;

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

  async startSession(): Promise<ActiveSessionResponse> {
    return this.withLoading(async () => {
      const result = await apiRequest<ActiveSessionResponse>('/exams/sessions', {
        method: 'POST',
        body: { acknowledgeRules: true },
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

      this.questions = items;
      this.answers = { ...seeded, ...this.answers };
      const queued = await listAnswers(subtest.id);
      this.pendingCount = queued.length;
      this.clientSeqHighWater = queued.reduce(
        (max, entry) => Math.max(max, entry.clientSeq),
        this.clientSeqHighWater,
      );
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
    this.answers = { ...this.answers, [questionId]: payload };
    this.recentAnswers.set(questionId, { questionId, payload, timeSpentMs: elapsed });

    this.queueWrite = this.queueWrite.then(async () => {
      try {
        await enqueueAnswer({
          subtestId: subtest.id,
          questionId,
          payload,
          timeSpentMs: elapsed,
        });
        this.pendingCount += 1;
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
          for (const entry of batch) this.recentAnswers.delete(entry.questionId);
          this.pendingCount = Math.max(0, this.pendingCount - batch.length);
        } catch (cause) {
          this.handleError(cause);
          if (this.lockedReason) {
            await clearSubtest(subtest.id);
            this.pendingCount = 0;
            this.recentAnswers.clear();
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

  /** Best-effort saat tab ditutup: fetch keepalive dengan token di memori. */
  keepaliveFlush(): void {
    const subtest = this.currentSubtest;
    const sessionId = this.sessionId;
    if (!subtest || !sessionId || this.recentAnswers.size === 0) return;

    const answers = [...this.recentAnswers.values()]
      .slice(-MAX_BATCH)
      .map((entry) => ({
        questionId: entry.questionId,
        payload: entry.payload,
        timeSpentMs: entry.timeSpentMs,
      }));
    if (answers.length === 0) return;

    this.clientSeqHighWater += 1;
    const clientSeq = this.clientSeqHighWater;

    void fetch(`/api/v1/exams/sessions/${sessionId}/subtests/${subtest.id}/answers`, {
      method: 'PATCH',
      keepalive: true,
      credentials: 'include',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(session.accessToken ? { authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body: JSON.stringify({ clientSeq, answers }),
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
      this.recentAnswers.clear();
      this.applyActive(result);
      this.questions = [];
      this.answers = {};
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
        this.recentAnswers.clear();
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
      this.recentAnswers.clear();
      this.expiryHandled = false;
      this.warning = null;
      this.actionTaken = null;
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
