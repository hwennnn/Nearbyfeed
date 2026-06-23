import {
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';

const MAX_PROPERTY_COUNT = 24;
const MAX_PROPERTY_KEY_LENGTH = 80;
const MAX_PROPERTY_VALUE_LENGTH = 500;
const NO_CONTROL_CHARACTERS_PATTERN = /^[^\u0000-\u001F\u007F]*$/;
const OBSERVABILITY_EVENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]{0,119}$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value);

const isWithinPropertyValueBudget = (value: unknown): boolean => {
  if (value === undefined) return true;
  if (value === null) return true;
  if (typeof value === 'string') {
    return value.length <= MAX_PROPERTY_VALUE_LENGTH;
  }
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (typeof value === 'bigint') {
    return value.toString().length <= MAX_PROPERTY_VALUE_LENGTH;
  }

  try {
    const serialized = JSON.stringify(value);
    return (
      typeof serialized === 'string' &&
      serialized.length <= MAX_PROPERTY_VALUE_LENGTH
    );
  } catch {
    return false;
  }
};

const isWithinPropertiesBudget = (value: unknown): boolean => {
  if (!isPlainObject(value)) return false;
  const entries = Object.entries(value);
  if (entries.length > MAX_PROPERTY_COUNT) return false;

  return entries.every(
    ([key, propertyValue]) =>
      key.length <= MAX_PROPERTY_KEY_LENGTH &&
      isWithinPropertyValueBudget(propertyValue),
  );
};

const ObservabilityPropertiesBudget = (
  validationOptions?: ValidationOptions,
) =>
  (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'observabilityPropertiesBudget',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: isWithinPropertiesBudget,
        defaultMessage: () =>
          `properties must contain at most ${MAX_PROPERTY_COUNT} entries, keys no longer than ${MAX_PROPERTY_KEY_LENGTH} characters, and values no longer than ${MAX_PROPERTY_VALUE_LENGTH} serialized characters`,
      },
    });
  };

export class CreateObservabilityEventDto {
  @IsString()
  @MaxLength(120)
  @Matches(OBSERVABILITY_EVENT_NAME_PATTERN)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(NO_CONTROL_CHARACTERS_PATTERN)
  sessionId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  userId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(NO_CONTROL_CHARACTERS_PATTERN)
  route?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  clientTimestamp?: string;

  @IsOptional()
  @IsObject()
  @ObservabilityPropertiesBudget()
  properties?: Record<string, unknown>;
}
