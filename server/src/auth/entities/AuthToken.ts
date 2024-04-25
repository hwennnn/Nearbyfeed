import { type UserWithoutPassword } from 'src/users/entities';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  tokens: AuthToken;
  user: UserWithoutPassword;
}
