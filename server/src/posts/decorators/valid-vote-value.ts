import {
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'validVoteValue', async: false })
export class ValidVoteValue implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    return value === -1 || value === 0 || value === 1;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Vote value must be -1, 0, or 1.';
  }
}
