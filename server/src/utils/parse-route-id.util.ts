import { BadRequestException } from '@nestjs/common';

export const parseRouteId = (value: unknown, name: string): number => {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(`${name} must be a positive integer`);
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id)) {
    throw new BadRequestException(`${name} must be a positive safe integer`);
  }

  return id;
};

export const parseOptionalRouteId = (
  value: unknown,
  name: string,
): number | undefined => {
  if (value === undefined) return undefined;

  return parseRouteId(value, name);
};
