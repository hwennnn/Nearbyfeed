import { type User } from '@prisma/client';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface UserWithoutPassword extends Omit<User, 'password'> {}
