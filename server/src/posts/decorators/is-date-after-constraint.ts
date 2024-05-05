import {
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateAfter', async: false })
export class IsDateAfterConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: string, args: ValidationArguments): boolean {
    return propertyValue > args.object[args.constraints[0]];
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'End date must be after start date';
  }
}
