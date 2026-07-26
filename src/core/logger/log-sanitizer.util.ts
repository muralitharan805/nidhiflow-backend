const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'secret',
  'creditcard',
  'ssn',
  'refresh_token',
];

/**
 * Recursively sanitizes data payloads by replacing sensitive keys with '[REDACTED]'.
 *
 * @param data - Raw input payload or value
 * @returns Sanitized clone of payload with PII and secrets masked
 */
export function sanitizeLogPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogPayload(item));
  }

  const sanitized: Record<string, unknown> = {};
  const record = data as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    const isSensitive = SENSITIVE_KEYS.some((k) =>
      key.toLowerCase().includes(k),
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof record[key] === 'object' && record[key] !== null) {
      sanitized[key] = sanitizeLogPayload(record[key]);
    } else {
      sanitized[key] = record[key];
    }
  }

  return sanitized;
}
