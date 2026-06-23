import { Logger, Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ImagesService } from './images.service';

@Module({
  imports: [CloudinaryModule],
  providers: [ImagesService, Logger],
  exports: [ImagesService],
})
export class ImagesModule {}
