const hasValue = (value: unknown): boolean =>
  value !== null && value !== undefined;

const isSensitiveField = (key: string, field: string): boolean =>
  key.toLowerCase().includes(field.toLowerCase());

export function sanitize<T>(source: T, field: string): T {
  if (source === null || source === undefined) return source;

  if (typeof source !== 'object') return source;

  if (Array.isArray(source)) {
    for (let i = 0; i < (source as any[]).length; i++) {
      source[i] = sanitize(source[i], field);
    }
  }

  for (const [key, value] of Object.entries(source)) {
    if (!hasValue(value)) continue;

    if (typeof value === 'object') {
      source[key] = sanitize(value, field);
    }

    if (isSensitiveField(key, field)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete source[key];
    }
  }
  return source;
}
