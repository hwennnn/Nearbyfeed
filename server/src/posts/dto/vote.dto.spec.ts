import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LikeDto } from './like.dto';
import { VotePollDto } from './vote-poll.dto';

const errorsFor = async <T extends object>(
  dtoClass: new () => T,
  body: Record<string, unknown>,
) =>
  await validate(
    plainToInstance(dtoClass, body, {
      enableImplicitConversion: true,
    }),
  );

describe('vote DTOs', () => {
  it('accepts numeric strings for like values', async () => {
    const dto = plainToInstance(
      LikeDto,
      { value: '1' },
      { enableImplicitConversion: true },
    );

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.value).toBe(1);
  });

  it('accepts zero as a like reset value', async () => {
    const dto = plainToInstance(
      LikeDto,
      { value: '0' },
      { enableImplicitConversion: true },
    );

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.value).toBe(0);
  });

  it.each([true, false, '', '2', 2, -1])(
    'rejects invalid like value %p',
    async (value) => {
      await expect(errorsFor(LikeDto, { value })).resolves.not.toEqual([]);
    },
  );

  it('accepts positive numeric strings for poll option ids', async () => {
    const dto = plainToInstance(
      VotePollDto,
      { pollOptionId: '99' },
      { enableImplicitConversion: true },
    );

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.pollOptionId).toBe(99);
  });

  it.each([true, false, '', '0', 0, '-1', -1, '9007199254740992'])(
    'rejects unsafe poll option id %p',
    async (pollOptionId) => {
      await expect(
        errorsFor(VotePollDto, { pollOptionId }),
      ).resolves.not.toEqual([]);
    },
  );
});
