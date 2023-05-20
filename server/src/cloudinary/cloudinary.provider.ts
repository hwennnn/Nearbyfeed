import { type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2, type ConfigOptions } from 'cloudinary';

const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  useFactory: async (configService: ConfigService): Promise<ConfigOptions> => {
    return v2.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  },
  inject: [ConfigService],
};
