import { type ValidationArguments } from 'class-validator';
import { ValidDistanceRangeValue } from './valid-distance-range-value';
import { ValidNumberRangeValue } from './valid-number-range-value';

const args = (constraints: number[]): ValidationArguments =>
  ({ constraints }) as ValidationArguments;

describe('custom numeric validators', () => {
  it('rejects partial numeric strings in generic ranges', () => {
    const validator = new ValidNumberRangeValue();

    expect(validator.validate('15', args([15, 25]))).toBe(true);
    expect(validator.validate(20, args([15, 25]))).toBe(true);
    expect(validator.validate('15abc', args([15, 25]))).toBe(false);
    expect(validator.validate('20.5', args([15, 25]))).toBe(false);
  });

  it('rejects partial numeric strings for distance ranges', () => {
    const validator = new ValidDistanceRangeValue();

    expect(validator.validate('200', args([]))).toBe(true);
    expect(validator.validate(500, args([]))).toBe(true);
    expect(validator.validate('200m', args([]))).toBe(false);
    expect(validator.validate('1000.5', args([]))).toBe(false);
  });
});
