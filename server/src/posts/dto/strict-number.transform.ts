import { type TransformFnParams } from 'class-transformer';

export const strictNumberTransform = ({
  key,
  obj,
  value,
}: TransformFnParams): unknown => {
  const rawValue =
    typeof key === 'string' &&
    typeof obj === 'object' &&
    obj !== null &&
    key in obj
      ? (obj as Record<string, unknown>)[key]
      : value;

  if (typeof rawValue === 'number') return rawValue;

  if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
    return Number(rawValue);
  }

  return rawValue;
};
