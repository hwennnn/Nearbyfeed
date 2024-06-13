import { type ProviderType } from '@prisma/client';
import { type UserWithoutPassword } from './userWithoutPassword';

export type UserResult = UserWithoutPassword & {
  blockedUsers: BlockedUser[];
  hasPassword: boolean;
  providers: AuthProvider[];
};

export interface BlockedUser {
  id: number;
  username: string;
  image: string | null;
}

export interface AuthProvider {
  providerName: ProviderType;
  isActive: boolean;
  userId: number;
}
