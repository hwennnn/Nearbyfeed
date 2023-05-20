import {
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'distanceRange', async: false })
export class ValidDistanceRangeValue implements ValidatorConstraintInterface {
  validate(distance: string | number, args: ValidationArguments): boolean {
    const numericDistance =
      typeof distance === 'number' ? distance : parseInt(distance, 10);
    return (
      numericDistance === 200 ||
      numericDistance === 500 ||
      numericDistance === 1000
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Distance must be between 200m, 500m or 1000m.';
  }
}
