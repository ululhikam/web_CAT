<script lang="ts">
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import type {
    ExamSettingsView,
    StagePlan,
    StageCode,
    SubtestCode,
    SubtestPlan,
    ScoringStrategy,
  } from '@webcat/contracts';
  import { SCORING_STRATEGIES, STAGE_CODES, SUBTEST_CODES } from '@webcat/contracts';

  let stages = $state<StagePlan[]>([]);
  let settings = $state<ExamSettingsView | null>(null);
  let configText = $state<Record<string, string>>({});
  let violationText = $state('');
  let loading = $state(true);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let savingId = $state<string | null>(null);

  let showCreate = $state(false);
  let newSubtest = $state({
    stageCode: 'PSIKOLOGI' as StageCode,
    code: 'KECERDASAN' as SubtestCode,
    name: '',
    orderIndex: 1,
    questionCount: 50,
    durationMinutes: 30,
    weight: 10,
    passingScore: 60,
    eliminationEnabled: true,
    scoringStrategy: 'KEYED_CORRECT' as ScoringStrategy,
    isActive: true,
  });

  const canConfig = $derived(session.can('exams.config'));

  $effect(() => {
    if (!session.user || !session.accessToken || !canConfig) return;
    void loadAll();
  });

  async function loadAll(): Promise<void> {
    loading = true;
    error = null;
    try {
      const [stageResult, settingsResult] = await Promise.all([
        apiRequest<StagePlan[]>('/admin/exam-stages', { token: session.accessToken }),
        apiRequest<ExamSettingsView>('/admin/exam-settings', { token: session.accessToken }),
      ]);
      stages = stageResult;
      settings = settingsResult;
      const texts: Record<string, string> = {};
      for (const stage of stageResult) {
        for (const subtest of stage.subtests) {
          texts[subtest.id] = subtest.scoringConfig
            ? JSON.stringify(subtest.scoringConfig, null, 2)
            : '';
        }
      }
      configText = texts;
      violationText = JSON.stringify(settingsResult.violationPolicy, null, 2);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  function parseConfig(subtest: SubtestPlan): Record<string, unknown> | null {
    const text = (configText[subtest.id] ?? '').trim();
    if (!text) return null;
    const parsed: unknown = JSON.parse(text);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('scoringConfig harus berupa objek JSON.');
    }
    return parsed as Record<string, unknown>;
  }

  async function saveStage(stage: StagePlan): Promise<void> {
    savingId = `stage:${stage.id}`;
    error = null;
    success = null;
    try {
      await apiRequest<StagePlan>(`/admin/exam-stages/${stage.id}`, {
        method: 'PATCH',
        token: session.accessToken,
        body: {
          name: stage.name,
          description: stage.description,
          orderIndex: stage.orderIndex,
          weight: stage.weight,
          passingScore: stage.passingScore,
          eliminationEnabled: stage.eliminationEnabled,
          isActive: stage.isActive,
        },
      });
      success = `Stage ${stage.code} disimpan.`;
      await loadAll();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      savingId = null;
    }
  }

  async function saveSubtest(subtest: SubtestPlan): Promise<void> {
    savingId = `subtest:${subtest.id}`;
    error = null;
    success = null;
    try {
      const scoringConfig = parseConfig(subtest);
      await apiRequest<SubtestPlan>(`/admin/subtests/${subtest.id}`, {
        method: 'PATCH',
        token: session.accessToken,
        body: {
          name: subtest.name,
          orderIndex: subtest.orderIndex,
          questionCount: subtest.questionCount,
          durationMinutes: subtest.durationMinutes,
          weight: subtest.weight,
          passingScore: subtest.passingScore,
          eliminationEnabled: subtest.eliminationEnabled,
          scoringStrategy: subtest.scoringStrategy,
          scoringConfig,
          isActive: subtest.isActive,
        },
      });
      success = `Subtes ${subtest.code} disimpan.`;
      await loadAll();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      savingId = null;
    }
  }

  async function createSubtest(): Promise<void> {
    savingId = 'create';
    error = null;
    success = null;
    try {
      await apiRequest<SubtestPlan>('/admin/subtests', {
        method: 'POST',
        token: session.accessToken,
        body: { ...newSubtest, name: newSubtest.name.trim() },
      });
      success = `Subtes ${newSubtest.code} ditambahkan.`;
      showCreate = false;
      await loadAll();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      savingId = null;
    }
  }

  async function saveSettings(): Promise<void> {
    if (!settings) return;
    savingId = 'settings';
    error = null;
    success = null;
    try {
      let policy: unknown;
      try {
        policy = JSON.parse(violationText);
      } catch {
        throw new Error('Kebijakan pelanggaran bukan JSON yang valid.');
      }
      if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
        throw new Error('Kebijakan pelanggaran harus berupa objek JSON.');
      }
      await apiRequest<ExamSettingsView>('/admin/exam-settings', {
        method: 'PATCH',
        token: session.accessToken,
        body: {
          timezone: settings.timezone,
          totalPassingScore: settings.totalPassingScore,
          maxSessionsPerDay: settings.maxSessionsPerDay,
          gracePeriodShortMs: settings.gracePeriodShortMs,
          gracePeriodLongMs: settings.gracePeriodLongMs,
          subtestTransition: settings.subtestTransition,
          violationPolicy: policy,
        },
      });
      success = 'Pengaturan ujian disimpan.';
      await loadAll();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      savingId = null;
    }
  }
</script>

<svelte:head>
  <title>Konfigurasi ujian -" Admin Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Konfigurasi ujian</h1>
      <p class="muted">
        Stage, subtes, timer, bobot, ambang gugur, dan kebijakan pelanggaran. Perubahan hanya
        berlaku untuk sesi baru; sesi berjalan memakai snapshot.
      </p>
    </div>
    <div class="header-actions">
      <Button variant="secondary" onclick={loadAll}>Muat ulang</Button>
      <Button onclick={() => (showCreate = !showCreate)}>
        {showCreate ? 'Tutup form' : 'Tambah subtes'}
      </Button>
    </div>
  </header>

  {#if !canConfig}
    <Alert tone="danger" title="Akses ditolak">
      Akun Anda tidak memiliki permission <code>exams.config</code>.
    </Alert>
  {:else}
    {#if error}
      <Alert tone="danger" title="Gagal menyimpan" onclose={() => (error = null)}>{error}</Alert>
    {/if}
    {#if success}
      <Alert tone="success" title="Berhasil" onclose={() => (success = null)}>{success}</Alert>
    {/if}

    {#if loading}
      <div class="center"><Spinner size={26} label="Memuat konfigurasi" /></div>
    {:else}
      {#if showCreate}
        <Card
          title="Tambah subtes"
          description="Subtes baru langsung tersedia untuk sesi berikutnya."
        >
          <div class="form-grid">
            <label class="field">
              <span class="field__label">Stage</span>
              <select class="input" bind:value={newSubtest.stageCode}>
                {#each STAGE_CODES as code (code)}
                  <option value={code}>{code}</option>
                {/each}
              </select>
            </label>
            <label class="field">
              <span class="field__label">Kode subtes</span>
              <select class="input" bind:value={newSubtest.code}>
                {#each SUBTEST_CODES as code (code)}
                  <option value={code}>{code}</option>
                {/each}
              </select>
            </label>
            <label class="field field--wide">
              <span class="field__label">Nama</span>
              <input class="input" bind:value={newSubtest.name} maxlength="120" />
            </label>
            <label class="field">
              <span class="field__label">Urutan</span>
              <input
                class="input"
                type="number"
                min="1"
                max="20"
                bind:value={newSubtest.orderIndex}
              />
            </label>
            <label class="field">
              <span class="field__label">Jumlah soal</span>
              <input
                class="input"
                type="number"
                min="1"
                max="1000"
                bind:value={newSubtest.questionCount}
              />
            </label>
            <label class="field">
              <span class="field__label">Durasi (menit)</span>
              <input
                class="input"
                type="number"
                min="1"
                max="240"
                bind:value={newSubtest.durationMinutes}
              />
            </label>
            <label class="field">
              <span class="field__label">Bobot</span>
              <input
                class="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                bind:value={newSubtest.weight}
              />
            </label>
            <label class="field">
              <span class="field__label">Ambang lulus</span>
              <input
                class="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                bind:value={newSubtest.passingScore}
              />
            </label>
            <label class="field">
              <span class="field__label">Strategi</span>
              <select class="input" bind:value={newSubtest.scoringStrategy}>
                {#each SCORING_STRATEGIES as strategy (strategy)}
                  <option value={strategy}>{strategy}</option>
                {/each}
              </select>
            </label>
            <label class="field field--check">
              <input type="checkbox" bind:checked={newSubtest.eliminationEnabled} />
              <span>Aktifkan sistem gugur</span>
            </label>
            <label class="field field--check">
              <input type="checkbox" bind:checked={newSubtest.isActive} />
              <span>Aktif</span>
            </label>
          </div>
          <div class="actions">
            <Button loading={savingId === 'create'} onclick={createSubtest}>Simpan subtes</Button>
            <Button variant="secondary" onclick={() => (showCreate = false)}>Batal</Button>
          </div>
        </Card>
      {/if}

      {#if settings}
        <Card
          title="Pengaturan global"
          description="Timezone, batas harian, grace period, dan kebijakan pelanggaran."
        >
          <div class="form-grid">
            <label class="field">
              <span class="field__label">Timezone</span>
              <input class="input" bind:value={settings.timezone} maxlength="64" />
            </label>
            <label class="field">
              <span class="field__label">Ambang total</span>
              <input
                class="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                bind:value={settings.totalPassingScore}
              />
            </label>
            <label class="field">
              <span class="field__label">Maks sesi/hari</span>
              <input
                class="input"
                type="number"
                min="1"
                max="10"
                bind:value={settings.maxSessionsPerDay}
              />
            </label>
            <label class="field">
              <span class="field__label">Grace pendek (ms)</span>
              <input
                class="input"
                type="number"
                min="0"
                max="60000"
                bind:value={settings.gracePeriodShortMs}
              />
            </label>
            <label class="field">
              <span class="field__label">Grace panjang (ms)</span>
              <input
                class="input"
                type="number"
                min="0"
                max="120000"
                bind:value={settings.gracePeriodLongMs}
              />
            </label>
            <label class="field">
              <span class="field__label">Transisi subtes</span>
              <select class="input" bind:value={settings.subtestTransition}>
                <option value="on_open">on_open</option>
                <option value="immediate">immediate</option>
              </select>
            </label>
          </div>
          <label class="field field--wide">
            <span class="field__label">Kebijakan pelanggaran (JSON)</span>
            <textarea class="input textarea" rows="10" bind:value={violationText} spellcheck="false"
            ></textarea>
          </label>
          <div class="actions">
            <Button loading={savingId === 'settings'} onclick={saveSettings}
              >Simpan pengaturan</Button
            >
          </div>
        </Card>
      {/if}

      {#each stages as stage (stage.id)}
        <Card title={`${stage.code} -" ${stage.name}`} description={stage.description ?? undefined}>
          <div class="stage-head">
            <Badge tone={stage.isActive ? 'success' : 'neutral'}>
              {stage.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
            <span class="muted">Bobot {stage.weight}% · ambang {stage.passingScore}%</span>
          </div>

          <div class="form-grid">
            <label class="field field--wide">
              <span class="field__label">Nama stage</span>
              <input class="input" bind:value={stage.name} maxlength="120" />
            </label>
            <label class="field field--wide">
              <span class="field__label">Deskripsi</span>
              <input class="input" bind:value={stage.description} maxlength="500" />
            </label>
            <label class="field">
              <span class="field__label">Urutan</span>
              <input class="input" type="number" min="1" max="20" bind:value={stage.orderIndex} />
            </label>
            <label class="field">
              <span class="field__label">Bobot</span>
              <input
                class="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                bind:value={stage.weight}
              />
            </label>
            <label class="field">
              <span class="field__label">Ambang lulus</span>
              <input
                class="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                bind:value={stage.passingScore}
              />
            </label>
            <label class="field field--check">
              <input type="checkbox" bind:checked={stage.eliminationEnabled} />
              <span>Sistem gugur stage</span>
            </label>
            <label class="field field--check">
              <input type="checkbox" bind:checked={stage.isActive} />
              <span>Aktif</span>
            </label>
          </div>
          <div class="actions">
            <Button loading={savingId === `stage:${stage.id}`} onclick={() => saveStage(stage)}>
              Simpan stage
            </Button>
          </div>

          <div class="subtests">
            {#each stage.subtests as subtest (subtest.id)}
              <div class="subtest-card">
                <header class="subtest-card__head">
                  <div>
                    <p class="subtest-card__title">{subtest.name}</p>
                    <p class="mono muted">{subtest.code} · {subtest.scoringStrategy}</p>
                  </div>
                  <Badge tone={subtest.isActive ? 'success' : 'neutral'}>
                    {subtest.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </header>

                <div class="form-grid">
                  <label class="field field--wide">
                    <span class="field__label">Nama subtes</span>
                    <input class="input" bind:value={subtest.name} maxlength="120" />
                  </label>
                  <label class="field">
                    <span class="field__label">Urutan</span>
                    <input
                      class="input"
                      type="number"
                      min="1"
                      max="20"
                      bind:value={subtest.orderIndex}
                    />
                  </label>
                  <label class="field">
                    <span class="field__label">Jumlah soal</span>
                    <input
                      class="input"
                      type="number"
                      min="1"
                      max="1000"
                      bind:value={subtest.questionCount}
                    />
                  </label>
                  <label class="field">
                    <span class="field__label">Durasi (menit)</span>
                    <input
                      class="input"
                      type="number"
                      min="1"
                      max="240"
                      bind:value={subtest.durationMinutes}
                    />
                  </label>
                  <label class="field">
                    <span class="field__label">Bobot</span>
                    <input
                      class="input"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      bind:value={subtest.weight}
                    />
                  </label>
                  <label class="field">
                    <span class="field__label">Ambang lulus</span>
                    <input
                      class="input"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      bind:value={subtest.passingScore}
                    />
                  </label>
                  <label class="field">
                    <span class="field__label">Strategi</span>
                    <select class="input" bind:value={subtest.scoringStrategy}>
                      {#each SCORING_STRATEGIES as strategy (strategy)}
                        <option value={strategy}>{strategy}</option>
                      {/each}
                    </select>
                  </label>
                  <label class="field field--check">
                    <input type="checkbox" bind:checked={subtest.eliminationEnabled} />
                    <span>Sistem gugur</span>
                  </label>
                  <label class="field field--check">
                    <input type="checkbox" bind:checked={subtest.isActive} />
                    <span>Aktif</span>
                  </label>
                </div>

                <label class="field field--wide">
                  <span class="field__label">scoringConfig (JSON, boleh kosong)</span>
                  <textarea
                    class="input textarea"
                    rows="5"
                    spellcheck="false"
                    bind:value={configText[subtest.id]}
                  ></textarea>
                </label>

                <div class="actions">
                  <Button
                    loading={savingId === `subtest:${subtest.id}`}
                    onclick={() => saveSubtest(subtest)}
                  >
                    Simpan subtes
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        </Card>
      {/each}
    {/if}
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .page__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .page__title {
    font-size: var(--text-2xl);
  }

  .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: var(--space-3);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field--wide {
    grid-column: 1 / -1;
  }

  .field--check {
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
    padding-top: var(--space-4);
    font-size: var(--text-sm);
  }

  .field--check input {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-primary);
  }

  .field__label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .input {
    width: 100%;
    padding: 0.55rem 0.7rem;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
  }

  .input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-ring);
  }

  .textarea {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    resize: vertical;
  }

  .stage-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .subtests {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-top: var(--space-5);
  }

  .subtest-card {
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);
  }

  .subtest-card__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .subtest-card__title {
    font-weight: 650;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.92em;
  }
</style>
