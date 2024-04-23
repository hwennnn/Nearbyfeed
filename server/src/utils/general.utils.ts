import { isArray, isDefined } from 'class-validator';

export function sanitize<T>(source: T, field: string): T {
  if (source === null || source === undefined) return source;

  if (typeof source !== 'object') return source;

  if (isArray(source)) {
    for (let i = 0; i < (source as any[]).length; i++) {
      source[i] = sanitize(source[i], field);
    }
  }

  for (const [key, value] of Object.entries(source)) {
    if (!isDefined(value)) continue;

    if (typeof value === 'object') {
      source[key] = sanitize(value, field); // Update source[key]
    }

    if (key === field) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete source[key];
    }
  }
  return source;
}
