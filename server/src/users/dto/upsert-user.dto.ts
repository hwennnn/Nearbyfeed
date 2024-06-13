import { type ProviderType } from '@prisma/client';

export interface UpsertUserDto {
  email: string;
  name: string;
  image: string;
  providerName: ProviderType;
}
