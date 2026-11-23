import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  extractUniqueCategories,
  filterQuestionsBySearchAndCategory,
} from '../features/teacher/questionBankHelpers';
import {
  getAdminAuditLogs,
  recordAdminAuditLog,
} from '../features/admin/adminAuditLog';
import type { Question } from '../shared/types/lms';
import manifestRaw from '../../public/manifest.webmanifest?raw';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('Sprint 6 Features — Question Bank Search & Category Filter (BL-18)', () => {
  const mockQuestions = [
    { id: '1', category_tag: 'Verbal', question_text: 'Sinonim kata EPILOG' },
    { id: '2', category_tag: 'Numerik', question_text: 'Deret angka 2, 6, 12' },
    { id: '3', category_tag: 'Verbal', question_text: 'Antonim kata PROLOG' },
  ] as unknown as Question[];

  it('extracts unique categories and filters by search text and category', () => {
    expect(extractUniqueCategories(mockQuestions)).toEqual(['ALL', 'Verbal', 'Numerik']);
    expect(filterQuestionsBySearchAndCategory(mockQuestions, '', 'Verbal')).toHaveLength(2);
    expect(filterQuestionsBySearchAndCategory(mockQuestions, 'deret', 'ALL')).toHaveLength(1);
    expect(filterQuestionsBySearchAndCategory(mockQuestions, 'epilog', 'Verbal')).toHaveLength(1);
  });
});

describe('Sprint 6 Features — Admin Audit Log (BL-19)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('records and retrieves admin audit log entries in reverse chronological order', () => {
    expect(getAdminAuditLogs()).toEqual([]);

    recordAdminAuditLog({
      actorName: 'Admin Utama',
      action: 'ROLE_UPDATED',
      targetLabel: 'rizco@pengajar.id',
      detail: 'Mengubah role menjadi teacher',
    });

    const logs = getAdminAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('ROLE_UPDATED');
    expect(logs[0].targetLabel).toBe('rizco@pengajar.id');
  });
});

describe('Sprint 6 Features — PWA Manifest & Shortcuts (BL-20)', () => {
  it('defines standalone display, theme color, and quick shortcuts for Kraepelin and Tryout', () => {
    const manifest = JSON.parse(manifestRaw) as {
      short_name: string;
      display: string;
      shortcuts: { url: string }[];
    };
    expect(manifest.short_name).toBe('LokaTalenta');
    expect(manifest.display).toBe('standalone');
    expect(manifest.shortcuts).toHaveLength(2);
    expect(manifest.shortcuts[0].url).toBe('/kraepelin');
    expect(manifest.shortcuts[1].url).toBe('/tryout');
  });
});
