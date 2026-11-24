import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuizAttempt } from '../../shared/types/lms';

export interface FocusLossEvent {
  at: string;
  type: 'hidden' | 'blur';
}

export interface UseFocusIntegrityMonitorOptions {
  enabled: boolean;
  initialCount?: number;
  initialEvents?: FocusLossEvent[];
  debounceMs?: number;
}

export interface UseFocusIntegrityMonitorResult {
  tabSwitchCount: number;
  events: FocusLossEvent[];
  resetFocusMonitor: () => void;
}

const FOCUS_INTEGRITY_STORAGE_PREFIX = 'ruanglatih_focus_integrity_v1:';
const DEMO_ATTEMPTS_STORAGE_KEY = 'ruanglatih_demo_attempts_v11';

/**
 * Monitors tab visibility changes and window blur events (debounced) when enabled
 * to track non-intrusive focus integrity metrics during an active quiz session.
 */
export function useFocusIntegrityMonitor({
  enabled,
  initialCount = 0,
  initialEvents = [],
  debounceMs = 800,
}: UseFocusIntegrityMonitorOptions): UseFocusIntegrityMonitorResult {
  const [events, setEvents] = useState<FocusLossEvent[]>(initialEvents);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(initialCount);
  const lastRecordedAtRef = useRef<number>(0);

  const recordFocusLoss = useCallback(
    (type: 'hidden' | 'blur') => {
      const now = Date.now();
      if (now - lastRecordedAtRef.current < debounceMs) {
        return;
      }
      lastRecordedAtRef.current = now;
      const entry: FocusLossEvent = {
        at: new Date(now).toISOString(),
        type,
      };
      setEvents((prev) => [...prev, entry]);
      setTabSwitchCount((prev) => prev + 1);
    },
    [debounceMs]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordFocusLoss('hidden');
      }
    };

    const handleWindowBlur = () => {
      recordFocusLoss('blur');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, recordFocusLoss]);

  const resetFocusMonitor = useCallback(() => {
    lastRecordedAtRef.current = 0;
    setEvents([]);
    setTabSwitchCount(0);
  }, []);

  return {
    tabSwitchCount,
    events,
    resetFocusMonitor,
  };
}

/**
 * Persists focus integrity metrics locally for an attempt and enriches the local
 * attempt record when running in local/demo storage mode.
 */
export function persistFocusIntegrityForAttempt(
  attemptId: string,
  tabSwitchCount: number,
  events: FocusLossEvent[]
): void {
  if (!attemptId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      `${FOCUS_INTEGRITY_STORAGE_PREFIX}${attemptId}`,
      JSON.stringify({ tab_switch_count: tabSwitchCount, focus_loss_events: events })
    );

    const rawAttempts = localStorage.getItem(DEMO_ATTEMPTS_STORAGE_KEY);
    if (rawAttempts) {
      const parsed = JSON.parse(rawAttempts) as QuizAttempt[];
      if (Array.isArray(parsed)) {
        const updated = parsed.map((a) =>
          a.id === attemptId
            ? { ...a, tab_switch_count: tabSwitchCount, focus_loss_events: events }
            : a
        );
        localStorage.setItem(DEMO_ATTEMPTS_STORAGE_KEY, JSON.stringify(updated));
      }
    }
  } catch {
    // Ignore storage quota or parse errors
  }
}

/**
 * Reads locally persisted focus integrity metrics for a given attempt.
 */
export function readFocusIntegrityForAttempt(attemptId: string): {
  tab_switch_count: number;
  focus_loss_events: FocusLossEvent[];
} | null {
  if (!attemptId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${FOCUS_INTEGRITY_STORAGE_PREFIX}${attemptId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      tab_switch_count?: number;
      focus_loss_events?: FocusLossEvent[];
    };
    return {
      tab_switch_count: parsed.tab_switch_count ?? 0,
      focus_loss_events: Array.isArray(parsed.focus_loss_events) ? parsed.focus_loss_events : [],
    };
  } catch {
    return null;
  }
}
