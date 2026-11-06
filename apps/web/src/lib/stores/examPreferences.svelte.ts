export type ExamAdvanceMode = 'auto' | 'manual';

const STORAGE_KEY = 'webcat_exam_advance_mode';

class ExamPreferencesStore {
  mode = $state<ExamAdvanceMode>('auto');

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'manual' || stored === 'auto') {
          this.mode = stored;
        }
      } catch {
        this.mode = 'auto';
      }
    }
  }

  setMode(newMode: ExamAdvanceMode): void {
    this.mode = newMode;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newMode);
      } catch {}
    }
  }
}

export const examPreferences = new ExamPreferencesStore();
