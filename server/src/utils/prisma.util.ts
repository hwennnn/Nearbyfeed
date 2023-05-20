/**
 * A utility function to exclude specified keys from an object.
 *
 * @template T The type of the object.
 * @template K The keys of the object to be excluded.
 * @param obj The object to exclude keys from.
 * @param keys The keys to exclude.
 * @returns A new object with the specified keys excluded.
 */
export function exclude<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  keys.forEach((key) => delete result[key]);
  return result;
}
