import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hashData(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(plainText, salt);

  return hash;
}

export async function compareHash(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}
