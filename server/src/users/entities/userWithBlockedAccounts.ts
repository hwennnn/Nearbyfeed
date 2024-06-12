import { type UserWithoutPassword } from './userWithoutPassword';

export type UserResult = UserWithoutPassword & {
  blockedUsers: BlockedUser[];
  hasPassword: boolean;
};

export interface BlockedUser {
  id: number;
  username: string;
  image: string | null;
}
