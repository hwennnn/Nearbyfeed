import { InternalServerErrorException } from '@nestjs/common';
import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hashData(plainText: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(plainText, salt);
    return hash;
  } catch (e) {
    throw new InternalServerErrorException();
  }
}

export async function compareHash(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(plainText, hash).catch((e) => {
    throw new InternalServerErrorException();
  });
}
