import {
  buildMessage,
  ValidateBy,
  type ValidationOptions,
} from 'class-validator';

const isPositiveSafeIntegerString = (value: unknown): boolean => {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return false;

  return Number.isSafeInteger(Number(value));
};

export const IsReportId = (validationOptions?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'isReportId',
      validator: {
        validate: isPositiveSafeIntegerString,
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be a positive safe integer string`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
