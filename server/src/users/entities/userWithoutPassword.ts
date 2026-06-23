import { type PendingUser, type Prisma, type User } from '@prisma/client';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface UserWithoutPassword extends Omit<User, 'password'> {}

export interface PendingUserWithoutPassword
  extends Omit<PendingUser, 'password'> {}

export const USER_WITHOUT_PASSWORD_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  image: true,
};
