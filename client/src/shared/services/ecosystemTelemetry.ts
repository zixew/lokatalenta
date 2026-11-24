export type EcosystemDivisionId =
  | 'executive'
  | 'architecture'
  | 'engineering'
  | 'qa'
  | 'devops'
  | 'lounge';

export type EcosystemTargetZone =
  | 'workspace'
  | 'boardroom'
  | 'cafeteria'
  | 'lobby'
  | 'lounge'
  | 'gym'
  | 'musholla';

export type EcosystemFloor = 1 | 2 | 3;

export type EcosystemSeverity = 'info' | 'success' | 'warning' | 'alert';

export interface EcosystemNormalizedEvent {
  id: string;
  timestamp: string;
  source: 'lms-psikotes';
  type: 'lms.activity';
  divisionId: EcosystemDivisionId;
  agentId: number;
  entityId: string | null;
  title: string;
  summary: string;
  targetZone: EcosystemTargetZone;
  targetFloor: EcosystemFloor;
  severity: EcosystemSeverity;
  metadata: Record<string, unknown>;
}

export interface LmsTelemetryInput {
  id?: string;
  divisionId?: EcosystemDivisionId;
  agentId?: number;
  entityId?: string | null;
  title: string;
  summary: string;
  targetZone?: EcosystemTargetZone;
  targetFloor?: EcosystemFloor;
  severity?: EcosystemSeverity;
  metadata?: Record<string, unknown>;
}

const FORBIDDEN_PII_KEY_PATTERN =
  /email|name|password|token|secret|user_?id|actor_?id|answers|content|phone|nik|ktp|address|detail|target_?label/i;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const NIK_PATTERN = /\b\d{16}\b/g;
const ID_PHONE_PATTERN = /(?:\+62|08)\d{8,12}/g;

const TELEMETRY_TIMEOUT_MS = 1500;

function readEnvValue(
  key: 'VITE_TELEMETRY_GATEWAY_URL' | 'VITE_TELEMETRY_GATEWAY_TOKEN',
): string | undefined {
  try {
    const rawMeta =
      key === 'VITE_TELEMETRY_GATEWAY_URL'
        ? (import.meta.env?.VITE_TELEMETRY_GATEWAY_URL as unknown)
        : (import.meta.env?.VITE_TELEMETRY_GATEWAY_TOKEN as unknown);
    if (typeof rawMeta === 'string' && rawMeta.length > 0) {
      return rawMeta;
    }
  } catch {
    // ignore in non-Vite environments
  }
  try {
    const proc = (
      globalThis as { process?: { env?: Record<string, string | undefined> } }
    ).process;
    const rawProc = proc?.env?.[key];
    if (typeof rawProc === 'string') {
      return rawProc;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function resolveTelemetryGatewayUrl(): string | null {
  const raw = readEnvValue('VITE_TELEMETRY_GATEWAY_URL');
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed.includes('your-') || trimmed.includes('<')) {
    return null;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function redactPiiString(value: string): string {
  return value
    .replace(EMAIL_PATTERN, '[REDACTED]')
    .replace(NIK_PATTERN, '[REDACTED]')
    .replace(ID_PHONE_PATTERN, '[REDACTED]');
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 8) return undefined;
  if (typeof value === 'string') {
    return redactPiiString(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_PII_KEY_PATTERN.test(key)) {
        continue;
      }
      const cleaned = sanitizeValue(val, depth + 1);
      if (cleaned !== undefined) {
        out[key] = cleaned;
      }
    }
    return out;
  }
  return value;
}

export function sanitizeTelemetryMetadata(
  meta?: Record<string, unknown>,
): Record<string, unknown> {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return {};
  }
  const cleaned = sanitizeValue(meta, 0);
  return cleaned !== null && typeof cleaned === 'object' && !Array.isArray(cleaned)
    ? (cleaned as Record<string, unknown>)
    : {};
}

function clampString(value: string, maxLen: number, fallback: string): string {
  const cleaned = redactPiiString(value).trim();
  const nonEmpty = cleaned.length > 0 ? cleaned : fallback;
  return nonEmpty.length > maxLen ? nonEmpty.slice(0, maxLen) : nonEmpty;
}

function generateEventId(preferredId?: string): string {
  if (typeof preferredId === 'string') {
    const trimmed = preferredId.trim();
    if (trimmed.length > 0) {
      return trimmed.length > 128 ? trimmed.slice(0, 128) : trimmed;
    }
  }
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fallback below
  }
  return `lms-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildLmsActivityEvent(
  input: LmsTelemetryInput,
): EcosystemNormalizedEvent {
  const rawAgent = input.agentId;
  const agentId =
    typeof rawAgent === 'number' &&
    Number.isInteger(rawAgent) &&
    rawAgent >= 0 &&
    rawAgent <= 23
      ? rawAgent
      : 13;

  const divisionId: EcosystemDivisionId = input.divisionId ?? 'lounge';
  const targetZone: EcosystemTargetZone = input.targetZone ?? 'lounge';
  const targetFloor: EcosystemFloor = input.targetFloor ?? 2;
  const severity: EcosystemSeverity = input.severity ?? 'info';

  let entityId: string | null = null;
  if (typeof input.entityId === 'string') {
    const cleanEntity = redactPiiString(input.entityId).trim();
    entityId =
      cleanEntity.length > 0
        ? cleanEntity.slice(0, 128)
        : null;
  }

  return {
    id: generateEventId(input.id),
    timestamp: new Date().toISOString(),
    source: 'lms-psikotes',
    type: 'lms.activity',
    divisionId,
    agentId,
    entityId,
    title: clampString(input.title, 160, 'LMS activity'),
    summary: clampString(input.summary, 500, 'LMS activity recorded'),
    targetZone,
    targetFloor,
    severity,
    metadata: sanitizeTelemetryMetadata(input.metadata),
  };
}

export function emitEcosystemTelemetry(input: LmsTelemetryInput): void {
  try {
    const gatewayUrl = resolveTelemetryGatewayUrl();
    if (!gatewayUrl || typeof fetch !== 'function') {
      return;
    }

    const event = buildLmsActivityEvent(input);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const bearerToken = readEnvValue('VITE_TELEMETRY_GATEWAY_TOKEN')?.trim();
    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }

    const controller =
      typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timeoutId =
      controller !== undefined
        ? setTimeout(() => {
            try {
              controller.abort();
            } catch {
              // ignore abort errors
            }
          }, TELEMETRY_TIMEOUT_MS)
        : undefined;

    Promise.resolve(
      fetch(`${gatewayUrl}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
        keepalive: true,
        ...(controller ? { signal: controller.signal } : {}),
      }),
    )
      .catch(() => undefined)
      .finally(() => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      });
  } catch {
    // Non-blocking: telemetry must never break LMS user workflows
  }
}

export const emitLmsTelemetry = emitEcosystemTelemetry;
