import {
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'numberRange', async: false })
export class ValidNumberRangeValue implements ValidatorConstraintInterface {
  validate(value: string | number, args: ValidationArguments): boolean {
    if (args.constraints.length !== 2) return false;

    const [minNumber, maxNumber] = args.constraints;
    const numericValue =
      typeof value === 'number' ? value : parseInt(value, 10);
    return numericValue >= minNumber && numericValue <= maxNumber;
  }

  defaultMessage(args: ValidationArguments): string {
    const [minNumber, maxNumber] = args.constraints;

    return `The value must be between ${minNumber} and ${maxNumber}`;
  }
}
