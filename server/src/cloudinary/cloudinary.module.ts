import { Logger, Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [CloudinaryProvider, CloudinaryService, Logger],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
