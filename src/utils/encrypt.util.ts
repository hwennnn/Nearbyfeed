import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hash(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(saltRounds);
  const hashed = await bcrypt.hash(plainText, salt);

  return hashed;
}

export async function compareHash(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}
