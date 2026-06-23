import { BadRequestException } from '@nestjs/common';
import { parseOptionalRouteId, parseRouteId } from './parse-route-id.util';

describe('parseRouteId', () => {
  it('parses positive safe integer route ids', () => {
    expect(parseRouteId('42', 'postId')).toBe(42);
  });

  it.each(['0', '-1', '1.5', 'abc', '', undefined, null])(
    'rejects malformed route id value %p',
    (value) => {
      expect(() => parseRouteId(value, 'postId')).toThrow(BadRequestException);
    },
  );

  it('rejects numeric strings that cannot be represented safely', () => {
    expect(() =>
      parseRouteId('9007199254740992', 'postId'),
    ).toThrow(BadRequestException);
  });
});

describe('parseOptionalRouteId', () => {
  it('returns undefined when an optional id is omitted', () => {
    expect(parseOptionalRouteId(undefined, 'userId')).toBeUndefined();
  });

  it('parses present optional ids with the same safety rules', () => {
    expect(parseOptionalRouteId('42', 'userId')).toBe(42);
  });

  it('rejects malformed present optional ids', () => {
    expect(() => parseOptionalRouteId('not-a-user', 'userId')).toThrow(
      BadRequestException,
    );
  });
});
