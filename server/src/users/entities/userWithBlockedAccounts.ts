import { type UserWithoutPassword } from './userWithoutPassword';

export type UserWithBlockedAccounts = UserWithoutPassword & {
  blockedUsers: BlockedUser[];
};

export interface BlockedUser {
  id: number;
  username: string;
  image: string | null;
}
