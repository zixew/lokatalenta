import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';

export interface TelemetryErrorEvent {
  id: string;
  source: string;
  message: string;
  timestamp: string;
}

export interface SystemHealthSnapshot {
  mode: 'Supabase Cloud' | 'Demo Lokal';
  dbLatencyMs: number | null;
  swStatus: 'Aktif' | 'Tidak Terdaftar' | 'Tidak Didukung';
  localStorageKeys: number;
  totalUsers?: number;
  activeUsers?: number;
  totalCourses?: number;
  publishedCourses?: number;
  attempts24h?: number;
  typingAttempts24h?: number;
  checkedAt: string;
}

const TELEMETRY_ERRORS_KEY = 'lokatalenta_telemetry_errors';
const MAX_ERROR_LOG = 30;

export function getClientTelemetryErrors(): TelemetryErrorEvent[] {
  try {
    const raw = sessionStorage.getItem(TELEMETRY_ERRORS_KEY);
    return raw ? (JSON.parse(raw) as TelemetryErrorEvent[]) : [];
  } catch {
    return [];
  }
}

export function recordClientTelemetryError(source: string, message: string) {
  try {
    const current = getClientTelemetryErrors();
    const entry: TelemetryErrorEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source,
      message: message.slice(0, 300),
      timestamp: new Date().toISOString(),
    };
    const next = [entry, ...current].slice(0, MAX_ERROR_LOG);
    sessionStorage.setItem(TELEMETRY_ERRORS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function clearClientTelemetryErrors() {
  try {
    sessionStorage.removeItem(TELEMETRY_ERRORS_KEY);
  } catch {
    // ignore
  }
}

export async function fetchSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  let swStatus: SystemHealthSnapshot['swStatus'] = 'Tidak Didukung';
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      swStatus = reg?.active ? 'Aktif' : 'Tidak Terdaftar';
    } catch {
      swStatus = 'Tidak Terdaftar';
    }
  }

  let localStorageKeys = 0;
  try {
    localStorageKeys = localStorage.length;
  } catch {
    localStorageKeys = 0;
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      mode: 'Demo Lokal',
      dbLatencyMs: null,
      swStatus,
      localStorageKeys,
      checkedAt: new Date().toISOString(),
    };
  }

  const t0 = performance.now();
  const { data, error } = await supabase.rpc('get_admin_health_metrics');
  const dbLatencyMs = Math.round(performance.now() - t0);

  if (error || !data) {
    if (error) {
      recordClientTelemetryError('health-rpc', error.message);
    }
    return {
      mode: 'Supabase Cloud',
      dbLatencyMs,
      swStatus,
      localStorageKeys,
      checkedAt: new Date().toISOString(),
    };
  }

  const metrics = data as Record<string, number | string>;
  return {
    mode: 'Supabase Cloud',
    dbLatencyMs,
    swStatus,
    localStorageKeys,
    totalUsers: Number(metrics.totalUsers ?? 0),
    activeUsers: Number(metrics.activeUsers ?? 0),
    totalCourses: Number(metrics.totalCourses ?? 0),
    publishedCourses: Number(metrics.publishedCourses ?? 0),
    attempts24h: Number(metrics.attempts24h ?? 0),
    typingAttempts24h: Number(metrics.typingAttempts24h ?? 0),
    checkedAt: String(metrics.checkedAt ?? new Date().toISOString()),
  };
}
