// Generic result interpretation for automation bridge responses
export interface InterpretedStandardResult {
  success: boolean;
  message: string;
  error?: string;
  warnings?: string[];
  details?: string[];
  payload: Record<string, unknown>;
  cleanText?: string;
  rawText: string;
  raw: unknown;
}

/** Interprets automation bridge responses into a standard format */
export function interpretStandardResult(
  response: unknown,
  defaults: { successMessage: string; failureMessage: string }
): InterpretedStandardResult {
  // Handle automation bridge response format
  const payload = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
  const success = payload.success === true;
  const rawText = typeof payload.message === 'string' ? payload.message : 
                  typeof payload.output === 'string' ? payload.output :
                  String(payload.result ?? '');

  const messageFromPayload = typeof payload.message === 'string' ? payload.message.trim() : '';
  const errorFromPayload = typeof payload.error === 'string' ? payload.error.trim() : '';

  const message = messageFromPayload || (success ? defaults.successMessage : defaults.failureMessage);
  const error = success ? undefined : errorFromPayload || messageFromPayload || defaults.failureMessage;

  return {
    success,
    message,
    error,
    warnings: coerceStringArray(payload.warnings),
    details: coerceStringArray(payload.details),
    payload,
    cleanText: rawText || undefined,
    rawText,
    raw: response
  };
}

/** Cleans result text by removing tags */
export function cleanResultText(
  text: string | undefined,
  options: { tag?: string; defaultValue?: string } = {}
): string | undefined {
  const { defaultValue } = options;
  if (!text) {
    return defaultValue;
  }

  const cleaned = text.trim();
  if (cleaned.length > 0) {
    return cleaned;
  }

  return defaultValue;
}

export function bestEffortInterpretedText(
  interpreted: Pick<InterpretedStandardResult, 'cleanText' | 'rawText'>,
  defaultValue?: string
): string | undefined {
  const cleaned = interpreted.cleanText?.trim();
  if (cleaned) {
    return cleaned;
  }

  const raw = interpreted.rawText?.trim?.();
  if (raw) {
    return raw;
  }

  return defaultValue;
}

export function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export function coerceStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue;
    }
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }
    items.push(trimmed);
  }

  return items.length > 0 ? items : undefined;
}

export function coerceBoolean(value: unknown, defaultValue?: boolean): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  return defaultValue;
}

export function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}
