import {
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { isAllowedDistanceMeters } from '@nearbyfeed/shared';

@ValidatorConstraint({ name: 'distanceRange', async: false })
export class ValidDistanceRangeValue implements ValidatorConstraintInterface {
  validate(distance: string | number, args: ValidationArguments): boolean {
    const numericDistance =
      typeof distance === 'number' ? distance : Number(distance);
    return (
      Number.isInteger(numericDistance) &&
      isAllowedDistanceMeters(numericDistance)
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Distance must be between 200m, 500m or 1000m.';
  }
}
